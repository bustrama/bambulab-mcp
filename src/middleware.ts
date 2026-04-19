import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Claude.ai uses Streamable HTTP — POSTs/DELETEs go to whatever URL the user
  // entered. If they entered the base URL, rewrite MCP-relevant methods to
  // /api/mcp. Browser GETs fall through to the landing page; only SSE GETs
  // (Accept: text/event-stream) get rewritten to the MCP endpoint.
  if (req.nextUrl.pathname !== "/") return;
  const method = req.method;
  if (method === "POST" || method === "DELETE" || method === "OPTIONS") {
    return NextResponse.rewrite(new URL("/api/mcp", req.url));
  }
  if (method === "GET") {
    const accept = req.headers.get("accept") ?? "";
    if (accept.includes("text/event-stream")) {
      return NextResponse.rewrite(new URL("/api/mcp", req.url));
    }
  }
}

export const config = {
  matcher: ["/"],
};
