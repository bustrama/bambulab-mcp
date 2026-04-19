import { NextResponse } from "next/server";

export const runtime = "nodejs";

// RFC 9728 — OAuth 2.0 Protected Resource Metadata
export async function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return NextResponse.json(
    {
      resource: base,
      authorization_servers: [base],
      bearer_methods_supported: ["header", "query"],
      resource_documentation: `${base}/api/mcp`,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    }
  );
}
