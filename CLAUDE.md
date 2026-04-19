# Bambu Lab MCP Server

Remote MCP server that connects Claude to the Bambu Lab cloud — primarily for reading **print history**, printers, projects, and live status. Deployed on Vercel, supports multi-tenant OAuth2 (PKCE) so any Bambu Lab user can connect via Claude.ai custom connectors.

> Bambu Lab has no official public API. This server wraps the same reverse-engineered endpoints used by community projects like [Doridian/OpenBambuAPI](https://github.com/Doridian/OpenBambuAPI), [greghesp/ha-bambulab](https://github.com/greghesp/ha-bambulab), and [coelacant1/Bambu-Lab-Cloud-API](https://github.com/coelacant1/Bambu-Lab-Cloud-API). Endpoints can change without notice.

## Architecture

- **Transport**: MCP Streamable HTTP (2025-03-26+), single `/api/mcp` endpoint.
- **Auth**: OAuth2 Authorization Code + PKCE — no database. User signs in with Bambu email + password; the resulting Bambu access token is AES-256-GCM-encrypted inside a signed JWT.
- **Runtime**: Next.js App Router, Node.js serverless functions on Vercel.

```
POST /          → middleware rewrites → /api/mcp   (MCP JSON-RPC)
GET  /          → landing page (or /api/mcp SSE if Accept: text/event-stream)
/.well-known/oauth-authorization-server → /api/oauth/metadata
/.well-known/oauth-protected-resource   → /api/oauth/protected-resource
/oauth/authorize                        → React page (email/password + verifyCode + TFA)
/api/oauth/register                     → Dynamic client registration
/api/oauth/token                        → Token exchange
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/mcp/route.ts` | MCP endpoint — handles initialize, tools/list, tools/call |
| `src/lib/tools.ts` | MCP tool definitions (list_prints, list_printers, get_project, etc.) |
| `src/lib/bambu.ts` | Bambu Lab cloud HTTP client — login, tasks, projects, devices |
| `src/lib/session.ts` | JWT issuance, AES-256-GCM encrypt/decrypt, PKCE auth codes, TFA ticket |
| `src/app/oauth/authorize/page.tsx` | Browser UI — password → (verifyCode | tfa) → authorise |
| `src/app/api/oauth/authorize/route.ts` | Drives the multi-step Bambu login flow |
| `src/middleware.ts` | Rewrites root-path MCP requests to /api/mcp |

## Bambu Login Flow

Bambu's login can branch three ways — we handle all three on one UI:

```
POST /v1/user-service/user/login          ┐
  {account, password}                     │  step 1 (password)
                                          │
  returns accessToken ───────────────────→ DONE, issue auth code
  returns loginType="verifyCode" ────┐
  returns loginType="tfa", tfaKey ──┐│
                                    ││
POST /v1/user-service/user/sendemail/code     step 2a (verifyCode)
  {email, type:"codeLogin"}         │
                                    │ user receives email
POST /v1/user-service/user/login ←──┘
  {account, code}  → accessToken
                                    │
POST https://bambulab.com/api/sign-in/tfa     step 2b (TFA)
  {tfaKey, tfaCode} → token (in Set-Cookie)
```

The user's password is never stored. Only the resulting Bambu access token (90-day lifetime) lives encrypted inside the MCP bearer JWT.

## Cloudflare Resistance

Bambu's API is behind Cloudflare and aggressively flags clients that don't look like the real `bambu_network_agent`. Every outbound call sends these headers (mirrored from Bambu Studio / Orca Slicer):

```
User-Agent: bambu_network_agent/01.09.05.01
X-BBL-Client-Name: OrcaSlicer
X-BBL-Client-Type: slicer
X-BBL-Client-Version: 01.09.05.51
X-BBL-Language: en-US
X-BBL-OS-Type: linux
```

If you still get 403s with `"cloudflare"` in the body, wait a few minutes and retry. Persistent blocks may require deploying to a different region.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | 64-char secret for signing JWTs (any strong random string) |
| `ENCRYPTION_KEY` | 64-char hex = 32-byte AES-256 key (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Production URL, e.g. `https://bambulab-mcp.vercel.app` |

Generate keys:
```bash
openssl rand -hex 32      # ENCRYPTION_KEY
openssl rand -base64 48   # JWT_SECRET
```

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in the three vars above
npm run dev
```

## Deploying to Vercel

```bash
npm i -g vercel
vercel env add JWT_SECRET
vercel env add ENCRYPTION_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel deploy --prod
```

## Connecting via Claude.ai

1. **Claude.ai → Settings → Connectors → Add custom connector**.
2. Enter the deployed URL, e.g. `https://bambulab-mcp.vercel.app`.
3. Complete the OAuth flow — sign in with your Bambu Lab email + password (+ verification code / TFA if required).
4. Done. Claude can now query your print history and printers.

## Available Tools

| Tool | Endpoint | Purpose |
|------|----------|---------|
| `list_printers` | `GET /v1/iot-service/api/user/bind` | All printers bound to your account |
| `list_prints` | `GET /v1/user-service/my/tasks` | **Print history** — paginated tasks |
| `get_print` | `GET /v1/user-service/my/task/{id}` | Single task detail |
| `get_filament_usage_summary` | (client aggregation over `my/tasks`) | Total grams / hours / success rate |
| `list_projects` | `GET /v1/iot-service/api/user/project` | Projects (higher-level than tasks) |
| `get_project` | `GET /v1/iot-service/api/user/project/{id}` | Full project — per-filament grams, plates, downloads |
| `get_live_status` | `GET /v1/iot-service/api/user/print?force=true` | Current job status for every printer |
| `get_user_preference` | `GET /v1/design-user-service/my/preference` | Numeric `uid` (MQTT username prefix) |
| `list_messages` | `GET /v1/user-service/my/messages` | Notifications |

## Task Status Codes

`status` field returned by `list_prints`:
- `1` — printing (in progress)
- `2` — finished (success)
- `3` — failed

## Security Notes

- The Bambu access token is never stored server-side — it lives encrypted inside the bearer token Claude.ai holds.
- Changing your Bambu Lab password revokes all existing tokens (including ours).
- Rotating `JWT_SECRET` invalidates every issued MCP token (all users must re-auth).
- Bambu's token has a ~90-day lifetime. When it expires, `list_prints` and friends will return 401 → users must re-run the OAuth flow.

## References

- [Doridian/OpenBambuAPI — cloud-http.md](https://github.com/Doridian/OpenBambuAPI/blob/main/cloud-http.md) — authoritative endpoint reference
- [greghesp/ha-bambulab — pybambu/bambu_cloud.py](https://github.com/greghesp/ha-bambulab/blob/main/custom_components/bambu_lab/pybambu/bambu_cloud.py) — reference login/MFA/Cloudflare implementation
- [coelacant1/Bambu-Lab-Cloud-API](https://github.com/coelacant1/Bambu-Lab-Cloud-API) — standalone auth CLI + modular docs
