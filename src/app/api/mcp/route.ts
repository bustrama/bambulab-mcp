import { NextRequest, NextResponse } from "next/server";
import { resolveCredential } from "@/lib/session";
import { BambuClient } from "@/lib/bambu";
import { TOOLS, callTool } from "@/lib/tools";

export const runtime = "nodejs";

const SERVER_INFO = { name: "bambulab", version: "0.1.0" };
const CAPABILITIES = { tools: {} };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-Id",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function ok(id: string | number | null | undefined, result: unknown): NextResponse {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, result } satisfies JsonRpcResponse,
    { headers: CORS }
  );
}

function err(
  id: string | number | null | undefined,
  code: number,
  message: string
): NextResponse {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } } satisfies JsonRpcResponse,
    { status: code === -32600 ? 400 : code === -32601 ? 404 : 200, headers: CORS }
  );
}

async function authenticate(
  req: NextRequest
): Promise<{ cred: Awaited<ReturnType<typeof resolveCredential>>; hadToken: boolean }> {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const cred = await resolveCredential(auth.slice(7));
    return { cred, hadToken: true };
  }
  const token = req.nextUrl.searchParams.get("access_token");
  if (token) {
    const cred = await resolveCredential(token);
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
      { status: 401, headers: { ...CORS, "WWW-Authenticate": wwwAuth } }
    );
  }

  let body: JsonRpcRequest;
  try {
    body = await req.json();
  } catch {
    return err(null, -32700, "Parse error");
  }

  const { id, method, params } = body;
  console.log("[mcp] method:", method, "id:", id);

  if (method === "initialize") {
    const requestedVersion =
      (params as { protocolVersion?: string } | undefined)?.protocolVersion ??
      "2025-03-26";
    const response = ok(id, {
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
    return new NextResponse(null, { status: 202, headers: CORS });
  }

  if (method === "tools/list") {
    return ok(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const { name, arguments: toolArgs } = params as {
      name: string;
      arguments: Record<string, unknown>;
    };
    if (!name) return err(id, -32602, "Missing tool name");

    const client = new BambuClient(cred.accessToken, cred.region);
    try {
      const result = await callTool(name, toolArgs ?? {}, client);
      return ok(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Tool execution failed";
      return ok(id, { content: [{ type: "text", text: message }], isError: true });
    }
  }

  return err(id, -32601, `Method not found: ${method}`);
}

// ── DELETE — session termination ─────────────────────────────────────────────

export async function DELETE() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

// ── GET — SSE stream (legacy transport / server-initiated messages) ──────────

export async function GET(req: NextRequest) {
  const { cred, hadToken } = await authenticate(req);
  if (!cred) {
    const wwwAuth = hadToken ? WWW_AUTH_INVALID() : WWW_AUTH_MISSING();
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { ...CORS, "WWW-Authenticate": wwwAuth },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const qToken = req.nextUrl.searchParams.get("access_token");
  const postUrl = qToken
    ? `${appUrl}/api/mcp?access_token=${encodeURIComponent(qToken)}`
    : `${appUrl}/api/mcp`;
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
      ...CORS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
