# Security Policy

## Threat model

This server acts as an OAuth-wrapped proxy to the Bambu Lab cloud. Each connected user entrusts us with their Bambu Lab email + password during the OAuth flow. We exchange those for a 90-day Bambu access token, encrypt that token with AES-256-GCM, and embed it inside a signed JWT that we hand to Claude.ai. **We store nothing.** All tenancy lives inside the bearer JWT itself.

## What we protect

- **User passwords** — only ever transit the `/api/oauth/authorize` endpoint once, straight to Bambu. Never logged. Never persisted. Never embedded in any JWT.
- **Bambu access tokens** — encrypted with AES-256-GCM (random 12-byte IV per encryption, 128-bit auth tag) before being placed in any JWT. The server holds the key (`ENCRYPTION_KEY`) but not the ciphertext beyond the duration of one request.
- **Cross-tenant isolation** — each MCP bearer JWT decrypts to exactly one Bambu access token. There is no shared state between users.

## Hardening applied

| Mitigation | Where |
|---|---|
| `redirect_uri` allow-list (claude.ai, claude.com, anthropic.com; localhost dev-only) | [src/lib/redirect.ts](src/lib/redirect.ts), enforced in `/api/oauth/authorize`, `/api/oauth/token`, and `/api/oauth/register` |
| HS256 pinned on every `jwtVerify` | [src/lib/session.ts](src/lib/session.ts) |
| `sub` claim separation (access / auth_code / tfa_ticket) | [src/lib/session.ts](src/lib/session.ts) |
| PKCE S256 required; code–redirect-uri AND code–client-id binding enforced at exchange | [src/lib/session.ts](src/lib/session.ts) |
| TFA continuation key encrypted (AES-256-GCM) inside the ticket JWT | [src/lib/session.ts](src/lib/session.ts) |
| Bearer token accepted only via `Authorization` header — no query-string fallback | [src/app/api/mcp/route.ts](src/app/api/mcp/route.ts), [src/app/api/oauth/protected-resource/route.ts](src/app/api/oauth/protected-resource/route.ts) |
| CORS narrowed to claude.ai / claude.com / anthropic.com on `/api/mcp` | [src/app/api/mcp/route.ts](src/app/api/mcp/route.ts) |
| Security headers: HSTS, X-Frame-Options: DENY, nosniff, Referrer-Policy: no-referrer | [next.config.ts](next.config.ts) |
| Input length bounds on all OAuth params | [src/app/api/oauth/authorize/route.ts](src/app/api/oauth/authorize/route.ts) |
| Sanitized upstream errors — raw Bambu bodies never flow to the client or server logs | [src/app/api/oauth/authorize/route.ts](src/app/api/oauth/authorize/route.ts) |
| React auto-escaping for all browser-rendered params; no `dangerouslySetInnerHTML` anywhere | [src/app/oauth/authorize/page.tsx](src/app/oauth/authorize/page.tsx) |
| `.gitignore` blocks `.env*` and `.vercel/` | [.gitignore](.gitignore) |

## Known gaps (do not use if these matter to you)

1. **No rate limiting.** The `/api/oauth/authorize` endpoint will forward any email/password combination to Bambu. A determined attacker could use this deployment as a password-spray proxy. Deployers should add Vercel's native firewall / Upstash rate limit before opening the URL to the public. Secondary risk: repeated abusive requests from our Vercel egress IP could get our server itself blocked by Bambu's Cloudflare and cause an outage for legitimate users.
2. **Auth codes are not single-use.** The 5-minute PKCE code is a self-contained JWT and can be replayed within its lifetime if captured together with the `code_verifier`. A stateless design can't enforce one-time use without external storage — plug in Vercel KV / Upstash Redis and SETNX on the code's `jti` if this matters to you.
3. **No token revocation.** Rotating `JWT_SECRET` invalidates every issued MCP token in one go (nuclear option). There is no per-user revoke endpoint. To drop a specific user's access today: have them rotate their Bambu Lab password, which expires the underlying Bambu access token.
4. **Unofficial Bambu API.** The upstream endpoints we call are community-reverse-engineered. Bambu can change them at any time, and depending on Bambu's ToS interpretation, this may not be officially sanctioned.

## Reporting a vulnerability

Open a **private security advisory** on the GitHub repository at
https://github.com/bustrama/bambulab-mcp/security/advisories/new — please do not file a public issue.

Include:
- A concise description of the vulnerability
- Minimal reproduction steps
- The affected commit / deployment
- Any suggested remediation

We aim to acknowledge within 7 days.
