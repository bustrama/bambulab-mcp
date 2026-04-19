# Bambu Lab MCP

Connect Claude to your Bambu Lab account. Query print history, printers, projects, and live status from inside Claude.ai via MCP.

```bash
# 1. Generate secrets
openssl rand -hex 32     # → ENCRYPTION_KEY
openssl rand -base64 48  # → JWT_SECRET

# 2. Configure
cp .env.example .env.local   # paste the keys + NEXT_PUBLIC_APP_URL

# 3. Run
npm install && npm run dev
```

Then add `http://localhost:3000` as a custom connector in Claude.ai and sign in with your Bambu Lab credentials.

See [CLAUDE.md](./CLAUDE.md) for architecture, auth flow, tool reference, and deployment instructions.

## Why?

Bambu Lab has no official API, but the community has reverse-engineered the cloud endpoints used by the mobile app and Bambu Studio. This repo wraps the minimum surface needed to ask Claude questions like:

- "How much filament did I print this month?"
- "Which of my prints failed in the last 7 days?"
- "What's my X1 printing right now?"
- "Show me all projects from last week."

The implementation is intentionally thin: one `BambuClient` per request, stateless JWT auth, no database.
