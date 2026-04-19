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

export const runtime = "nodejs";

// All three steps funnel through one endpoint. The UI progresses:
//   step="password"  → account + password (+ region)
//   step="code"      → account + email verification code (+ region)
//   step="tfa"       → tfaTicket + tfaCode
// Success in any step returns { redirectUrl } so the browser can bounce back
// to Claude. "need_verifyCode" and "need_tfa" ask the UI to render the next
// step with additional data (tfaTicket).
const OAuthParams = z.object({
  clientId: z.string(),
  redirectUri: z.string().url(),
  state: z.string(),
  codeChallenge: z.string().min(1),
  codeChallengeMethod: z.string().default("S256"),
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
      const msg = e.cloudflare
        ? "Cloudflare blocked this request. Try again in a few minutes from a different network."
        : e.status === 401
          ? "Wrong credentials — check email, password, or code."
          : `Bambu Lab returned ${e.status}. ${e.body.slice(0, 200)}`;
      return NextResponse.json({ error: msg }, { status: e.status === 401 ? 401 : 502 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
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
