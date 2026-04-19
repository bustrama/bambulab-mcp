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
| `redirect_uri` allow-list (claude.ai, claude.com, anthropic.com, localhost) | [src/lib/redirect.ts](src/lib/redirect.ts), enforced in both `/api/oauth/authorize` and `/api/oauth/token` |
| HS256 pinned on every `jwtVerify` | [src/lib/session.ts](src/lib/session.ts) |
| `sub` claim separation (access / auth_code / tfa_ticket) | [src/lib/session.ts](src/lib/session.ts) |
| PKCE S256 required; code–redirect-uri binding enforced at exchange | [src/lib/session.ts](src/lib/session.ts) |
| Input length bounds on all OAuth params | [src/app/api/oauth/authorize/route.ts](src/app/api/oauth/authorize/route.ts) |
| Sanitized upstream errors — raw Bambu bodies never flow to the client | [src/app/api/oauth/authorize/route.ts](src/app/api/oauth/authorize/route.ts) |
| React auto-escaping for all browser-rendered params; no `dangerouslySetInnerHTML` anywhere | [src/app/oauth/authorize/page.tsx](src/app/oauth/authorize/page.tsx) |
| `.gitignore` blocks `.env*` and `.vercel/` | [.gitignore](.gitignore) |

## Known gaps (do not use if these matter to you)

1. **No rate limiting.** The `/api/oauth/authorize` endpoint will forward any email/password combination to Bambu. A determined attacker could use this deployment as a password-spray proxy. Deployers should add Vercel's native firewall / Upstash rate limit before opening the URL to the public. Secondary risk: repeated abusive requests from our Vercel egress IP could get our server itself blocked by Bambu's Cloudflare and cause an outage for legitimate users.
2. **Bearer token via query string is advertised in OAuth metadata.** `/api/oauth/protected-resource` lists both `header` and `query`. When Claude.ai falls back to SSE, the JWT is embedded in the URL and Vercel's access logs will capture it. Anyone with read access to this Vercel project can see those JWTs and decrypt them via `ENCRYPTION_KEY`. If you self-host, either limit who has Vercel project access or patch the server to reject query-string auth and only accept the `Authorization` header.
3. **CORS is wide-open (`*`) on `/api/mcp`.** The MCP endpoint is hardened by bearer-token auth; credentials aren't allowed over CORS, so there's no CSRF path. But a malicious site can make cross-origin calls that count against a victim's quota if the victim shares their JWT. Self-hosters may want to narrow this to `https://claude.ai` and `https://claude.com`.
4. **No token revocation.** Rotating `JWT_SECRET` invalidates every issued MCP token in one go (nuclear option). There is no per-user revoke endpoint. To drop a specific user's access today: have them rotate their Bambu Lab password, which expires the underlying Bambu access token.
5. **Unofficial Bambu API.** The upstream endpoints we call are community-reverse-engineered. Bambu can change them at any time, and depending on Bambu's ToS interpretation, this may not be officially sanctioned.

## Reporting a vulnerability

Open a **private security advisory** on the GitHub repository at
https://github.com/bustrama/bambulab-mcp/security/advisories/new — please do not file a public issue.

Include:
- A concise description of the vulnerability
- Minimal reproduction steps
- The affected commit / deployment
- Any suggested remediation

We aim to acknowledge within 7 days.
