import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isAllowedRedirectUri } from "@/lib/redirect";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Dynamic Client Registration — RFC 7591. No persistence needed because our
// auth codes are self-contained JWTs. We do still validate the supplied
// redirect_uris against the same allow-list as /oauth/authorize — echoing
// back an uncontrolled list would imply we'd honour it later (we don't).
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // body is optional
  }

  const redirectUris: string[] = Array.isArray(body.redirect_uris)
    ? (body.redirect_uris as string[]).filter(
        (u): u is string => typeof u === "string"
      )
    : [];

  const invalid = redirectUris.find((u) => !isAllowedRedirectUri(u));
  if (invalid) {
    return NextResponse.json(
      {
        error: "invalid_redirect_uri",
        error_description: `redirect_uri not allow-listed: ${invalid}`,
      },
      { status: 400, headers: CORS }
    );
  }

  const clientId = randomBytes(16).toString("hex");

  return NextResponse.json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: body.client_name ?? "mcp-client",
      redirect_uris: redirectUris,
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      code_challenge_methods_supported: ["S256"],
    },
    { status: 201, headers: CORS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
