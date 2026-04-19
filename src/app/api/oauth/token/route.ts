import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthCode } from "@/lib/session";
import { isAllowedRedirectUri } from "@/lib/redirect";

export const runtime = "nodejs";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function errorResponse(error: string, description: string, status = 400) {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers: CORS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  let params: Record<string, string> = {};
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      params = Object.fromEntries(new URLSearchParams(text));
    } else {
      params = await req.json();
    }
  } catch {
    return errorResponse("invalid_request", "Could not parse request body");
  }

  const { grant_type, code, redirect_uri, client_id, code_verifier } = params;

  if (grant_type !== "authorization_code") {
    return errorResponse("unsupported_grant_type", "Only authorization_code is supported");
  }
  if (!code) return errorResponse("invalid_request", "Missing code");
  if (!redirect_uri) return errorResponse("invalid_request", "Missing redirect_uri");
  if (!code_verifier) return errorResponse("invalid_request", "Missing code_verifier");
  if (!client_id) return errorResponse("invalid_request", "Missing client_id");
  if (!isAllowedRedirectUri(redirect_uri)) {
    return errorResponse("invalid_request", "redirect_uri is not allow-listed");
  }

  const accessToken = await exchangeAuthCode({
    code,
    codeVerifier: code_verifier,
    redirectUri: redirect_uri,
    clientId: client_id,
  });

  if (!accessToken) {
    return errorResponse("invalid_grant", "Auth code is invalid, expired, or PKCE failed", 400);
  }

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 7_776_000, // 90 days — matches Bambu's upstream token lifetime
    },
    { headers: { ...CORS, "Cache-Control": "no-store" } }
  );
}
