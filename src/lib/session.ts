import { SignJWT, jwtVerify } from "jose";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { BambuRegion } from "@/lib/bambu";

function jwtSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

function encryptionKey(): Buffer {
  return Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
}

export type Credential = { accessToken: string; region: BambuRegion };

// Pin the algorithm on every verify call — jose with a raw HMAC secret already
// refuses RS*/ES*/none, but explicit is safer and future-proof.
const VERIFY_OPTIONS = { algorithms: ["HS256"] };

// ── Access tokens (MCP bearer tokens) ────────────────────────────────────────

/**
 * Issue a long-lived MCP bearer token that wraps the user's encrypted Bambu
 * access token + region. No server-side storage — the credential lives inside
 * the JWT itself, encrypted with AES-256-GCM.
 */
export async function createSession(cred: Credential): Promise<string> {
  const enc = encrypt(cred.accessToken);
  return new SignJWT({ sub: "access", enc, r: cred.region })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d") // Bambu tokens last ~90 days
    .sign(jwtSecret());
}

/** Resolve a bearer token → plain-text Bambu credential, or null. */
export async function resolveCredential(token: string): Promise<Credential | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), VERIFY_OPTIONS);
    // Reject auth_code / tfa_ticket JWTs — they share the same HMAC key but
    // are short-lived grants, never MCP bearer tokens. Accept missing `sub`
    // for backwards compatibility with tokens issued before this check.
    if (payload.sub && payload.sub !== "access") return null;
    if (typeof payload.enc !== "string") return null;
    const region = (payload.r === "china" ? "china" : "world") as BambuRegion;
    return { accessToken: decrypt(payload.enc), region };
  } catch {
    return null;
  }
}

// ── OAuth2 PKCE auth codes ────────────────────────────────────────────────────

type AuthCodePayload = {
  sub: "auth_code";
  enc: string; // encrypted Bambu access token
  r: BambuRegion;
  cc: string; // S256 code_challenge
  ru: string; // redirect_uri
  ci: string; // client_id
};

export async function createAuthCode(params: {
  accessToken: string;
  region: BambuRegion;
  codeChallenge: string;
  redirectUri: string;
  clientId: string;
}): Promise<string> {
  const enc = encrypt(params.accessToken);
  return new SignJWT({
    sub: "auth_code",
    enc,
    r: params.region,
    cc: params.codeChallenge,
    ru: params.redirectUri,
    ci: params.clientId,
  } satisfies AuthCodePayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(jwtSecret());
}

export async function exchangeAuthCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
}): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(params.code, jwtSecret(), VERIFY_OPTIONS);

    if (payload.sub !== "auth_code") return null;
    if (typeof payload.enc !== "string") return null;
    if (typeof payload.cc !== "string") return null;
    if (typeof payload.ru !== "string") return null;
    if (payload.ru !== params.redirectUri) return null;

    const computed = createHash("sha256")
      .update(params.codeVerifier)
      .digest("base64url");
    if (computed !== payload.cc) return null;

    const region = (payload.r === "china" ? "china" : "world") as BambuRegion;
    const accessToken = decrypt(payload.enc);
    return createSession({ accessToken, region });
  } catch {
    return null;
  }
}

// ── Short-lived TFA continuation token ───────────────────────────────────────
// When the user's login returns `tfa`, we hand the UI back a signed ticket
// containing the tfaKey so the next form submission can complete the flow
// without resending the password.

type TfaTicketPayload = {
  sub: "tfa_ticket";
  tk: string; // tfaKey
  a: string;  // account (for display only)
  r: BambuRegion;
};

export async function createTfaTicket(params: {
  tfaKey: string;
  account: string;
  region: BambuRegion;
}): Promise<string> {
  return new SignJWT({
    sub: "tfa_ticket",
    tk: params.tfaKey,
    a: params.account,
    r: params.region,
  } satisfies TfaTicketPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(jwtSecret());
}

export async function resolveTfaTicket(
  ticket: string
): Promise<{ tfaKey: string; account: string; region: BambuRegion } | null> {
  try {
    const { payload } = await jwtVerify(ticket, jwtSecret(), VERIFY_OPTIONS);
    if (payload.sub !== "tfa_ticket") return null;
    if (typeof payload.tk !== "string" || typeof payload.a !== "string") return null;
    const region = (payload.r === "china" ? "china" : "world") as BambuRegion;
    return { tfaKey: payload.tk, account: payload.a, region };
  } catch {
    return null;
  }
}

// ── Crypto helpers ────────────────────────────────────────────────────────────

function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decrypt(data: string): string {
  const buf = Buffer.from(data, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
