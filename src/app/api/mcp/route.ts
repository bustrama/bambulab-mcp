import { NextRequest, NextResponse } from "next/server";
import { resolveCredential } from "@/lib/session";
import { BambuClient } from "@/lib/bambu";
import { TOOLS, callTool } from "@/lib/tools";
import { isAllowedClientOrigin } from "@/lib/redirect";

export const runtime = "nodejs";

const SERVER_INFO = { name: "bambulab", version: "0.1.0" };
const CAPABILITIES = { tools: {} };

// CORS is tightened to claude.ai / claude.com / anthropic.com (and localhost
// in dev). Server-to-server callers (e.g. Claude's backend) don't send an
// Origin header, so they're unaffected — CORS only governs browsers. Unknown
// browser origins simply don't get ACAO back and get blocked by the browser.
const CORS_BASE = {
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-Id",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  if (!isAllowedClientOrigin(origin)) return CORS_BASE;
  return {
    ...CORS_BASE,
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

const WWW_AUTH_MISSING = () => {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `Bearer realm="${base}", resource_metadata="${base}/.well-known/oauth-protected-resource"`;
};
const WWW_AUTH_INVALID = () => {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `Bearer realm="${base}", error="invalid_token", resource_metadata="${base}/.well-known/oauth-protected-resource"`;
};

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

function ok(
  req: NextRequest,
  id: string | number | null | undefined,
  result: unknown
): NextResponse {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, result } satisfies JsonRpcResponse,
    { headers: corsHeaders(req) }
  );
}

function err(
  req: NextRequest,
  id: string | number | null | undefined,
  code: number,
  message: string
): NextResponse {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } } satisfies JsonRpcResponse,
    {
      status: code === -32600 ? 400 : code === -32601 ? 404 : 200,
      headers: corsHeaders(req),
    }
  );
}

// Bearer token comes from the Authorization header only. Query-string auth was
// removed because Vercel's access logs capture full URLs — a `?access_token=`
// fallback put JWTs (and with them, decryptable Bambu access tokens) into
// persisted log storage.
async function authenticate(
  req: NextRequest
): Promise<{ cred: Awaited<ReturnType<typeof resolveCredential>>; hadToken: boolean }> {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const cred = await resolveCredential(auth.slice(7));
    return { cred, hadToken: true };
  }
  return { cred: null, hadToken: false };
}

// ── POST — JSON-RPC messages ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { cred, hadToken } = await authenticate(req);
  if (!cred) {
    const wwwAuth = hadToken ? WWW_AUTH_INVALID() : WWW_AUTH_MISSING();
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32000, message: "Unauthorized" } },
      { status: 401, headers: { ...corsHeaders(req), "WWW-Authenticate": wwwAuth } }
    );
  }

  let body: JsonRpcRequest;
  try {
    body = await req.json();
  } catch {
    return err(req, null, -32700, "Parse error");
  }

  const { id, method, params } = body;

  if (method === "initialize") {
    const requestedVersion =
      (params as { protocolVersion?: string } | undefined)?.protocolVersion ??
      "2025-03-26";
    const response = ok(req, id, {
      protocolVersion: requestedVersion,
      capabilities: CAPABILITIES,
      serverInfo: SERVER_INFO,
    });
    response.headers.set(
      "Mcp-Session-Id",
      crypto.randomUUID().replace(/-/g, "")
    );
    return response;
  }

  if (method === "notifications/initialized") {
    return new NextResponse(null, { status: 202, headers: corsHeaders(req) });
  }

  if (method === "tools/list") {
    return ok(req, id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const { name, arguments: toolArgs } = params as {
      name: string;
      arguments: Record<string, unknown>;
    };
    if (!name) return err(req, id, -32602, "Missing tool name");

    const client = new BambuClient(cred.accessToken, cred.region);
    try {
      const result = await callTool(name, toolArgs ?? {}, client);
      return ok(req, id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Tool execution failed";
      return ok(req, id, { content: [{ type: "text", text: message }], isError: true });
    }
  }

  return err(req, id, -32601, `Method not found: ${method}`);
}

// ── DELETE — session termination ─────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders(req) });
}

// ── GET — SSE stream (legacy transport / server-initiated messages) ──────────

export async function GET(req: NextRequest) {
  const { cred, hadToken } = await authenticate(req);
  if (!cred) {
    const wwwAuth = hadToken ? WWW_AUTH_INVALID() : WWW_AUTH_MISSING();
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { ...corsHeaders(req), "WWW-Authenticate": wwwAuth },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const postUrl = `${appUrl}/api/mcp`;
  const enc = new TextEncoder();

  let keepAlive: ReturnType<typeof setInterval>;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(`event: endpoint\ndata: ${postUrl}\n\n`));
      keepAlive = setInterval(() => {
        try {
          controller.enqueue(enc.encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15_000);
    },
    cancel() {
      clearInterval(keepAlive);
    },
  });

  return new NextResponse(stream, {
    headers: {
      ...corsHeaders(req),
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
