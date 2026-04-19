import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  login,
  sendEmailCode,
  verifyTfa,
  BambuApiError,
  type BambuRegion,
} from "@/lib/bambu";
import {
  createAuthCode,
  createTfaTicket,
  resolveTfaTicket,
} from "@/lib/session";
import { isAllowedRedirectUri } from "@/lib/redirect";

export const runtime = "nodejs";

// All three steps funnel through one endpoint. The UI progresses:
//   step="password"  → account + password (+ region)
//   step="code"      → account + email verification code (+ region)
//   step="tfa"       → tfaTicket + tfaCode
// Success in any step returns { redirectUrl } so the browser can bounce back
// to Claude. "need_verifyCode" and "need_tfa" ask the UI to render the next
// step with additional data (tfaTicket).
const OAuthParams = z.object({
  clientId: z.string().max(256),
  redirectUri: z.string().url().max(1024),
  state: z.string().max(1024),
  codeChallenge: z.string().min(1).max(512),
  codeChallengeMethod: z.string().max(16).default("S256"),
});

const Body = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("password"),
    account: z.string().min(3),
    password: z.string().min(1),
    region: z.enum(["world", "china"]).default("world"),
    ...OAuthParams.shape,
  }),
  z.object({
    step: z.literal("code"),
    account: z.string().min(3),
    code: z.string().min(1),
    region: z.enum(["world", "china"]).default("world"),
    ...OAuthParams.shape,
  }),
  z.object({
    step: z.literal("tfa"),
    tfaTicket: z.string().min(1),
    tfaCode: z.string().min(1),
    ...OAuthParams.shape,
  }),
]);

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request parameters", detail: String(e) },
      { status: 400 }
    );
  }

  if (parsed.codeChallengeMethod !== "S256") {
    return NextResponse.json(
      { error: "Only S256 code_challenge_method is supported" },
      { status: 400 }
    );
  }

  // Reject any redirect_uri that isn't pointing at a known MCP client. This is
  // what stops the authorize page from being used as a generic Bambu-password
  // phisher — without it, an attacker could craft a /oauth/authorize URL with
  // redirect_uri=https://evil.com, phish a user on our real domain, and walk
  // away with an auth code they exchange for the victim's Bambu token.
  if (!isAllowedRedirectUri(parsed.redirectUri)) {
    return NextResponse.json(
      {
        error:
          "This redirect_uri is not allow-listed. Only Claude.ai / Claude.com callbacks are accepted.",
      },
      { status: 400 }
    );
  }

  let bambuAccessToken: string | null = null;
  let region: BambuRegion = "world";

  try {
    if (parsed.step === "password") {
      region = parsed.region;
      const result = await login({
        account: parsed.account,
        password: parsed.password,
        region,
      });
      if (result.kind === "verifyCode") {
        // Bambu will email the user a code; kick that off now.
        await sendEmailCode(parsed.account, region);
        return NextResponse.json({
          status: "need_verifyCode",
          account: parsed.account,
          region,
        });
      }
      if (result.kind === "tfa") {
        const tfaTicket = await createTfaTicket({
          tfaKey: result.tfaKey,
          account: parsed.account,
          region,
        });
        return NextResponse.json({ status: "need_tfa", tfaTicket, account: parsed.account });
      }
      bambuAccessToken = result.accessToken;
    } else if (parsed.step === "code") {
      region = parsed.region;
      const result = await login({
        account: parsed.account,
        code: parsed.code,
        region,
      });
      if (result.kind !== "token") {
        return NextResponse.json(
          { error: "Unexpected response from Bambu — verification code did not yield a token." },
          { status: 400 }
        );
      }
      bambuAccessToken = result.accessToken;
    } else {
      // step === "tfa"
      const ticket = await resolveTfaTicket(parsed.tfaTicket);
      if (!ticket) {
        return NextResponse.json(
          { error: "TFA ticket is invalid or expired — restart login." },
          { status: 400 }
        );
      }
      region = ticket.region;
      bambuAccessToken = await verifyTfa(ticket.tfaKey, parsed.tfaCode);
    }
  } catch (e) {
    if (e instanceof BambuApiError) {
      // Log upstream detail server-side only. NEVER echo Bambu's raw body to
      // the client — it can contain reconnaissance-useful internals (CF ray
      // IDs, account field echoes, etc.). Map to a small set of generic msgs.
      console.error("[authorize] bambu error:", {
        status: e.status,
        cloudflare: e.cloudflare,
        bodySnippet: e.body.slice(0, 200),
      });
      const msg = e.cloudflare
        ? "Our server is temporarily being blocked by Bambu's Cloudflare. Please try again in a few minutes."
        : e.status === 401
          ? "Wrong credentials — check email, password, or code."
          : e.status === 429
            ? "Too many attempts. Please wait a few minutes and try again."
            : e.status >= 500
              ? "Bambu Lab is temporarily unavailable. Please try again shortly."
              : "Bambu Lab rejected the request.";
      return NextResponse.json({ error: msg }, { status: e.status === 401 ? 401 : 502 });
    }
    console.error("[authorize] unexpected error:", e);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }

  if (!bambuAccessToken) {
    return NextResponse.json({ error: "Login failed to produce a token" }, { status: 500 });
  }

  const code = await createAuthCode({
    accessToken: bambuAccessToken,
    region,
    codeChallenge: parsed.codeChallenge,
    redirectUri: parsed.redirectUri,
    clientId: parsed.clientId,
  });

  const redirectUrl = new URL(parsed.redirectUri);
  redirectUrl.searchParams.set("code", code);
  if (parsed.state) redirectUrl.searchParams.set("state", parsed.state);

  return NextResponse.json({ status: "ok", redirectUrl: redirectUrl.toString() });
}
