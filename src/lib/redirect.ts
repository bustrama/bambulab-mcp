// Redirect URI allow-list — the defense against our `/oauth/authorize` page
// being weaponised as a Bambu-credential phisher. We only ever hand auth codes
// off to Anthropic properties (Claude.ai / Claude.com) and localhost for dev.
//
// If you need to support another MCP client, add its callback here *after*
// verifying it actually exists and is operated by the party you expect.

const ALLOWED_HOST_SUFFIXES = [
  "claude.ai",
  "claude.com",
  "anthropic.com",
];

/** Returns true if the redirect_uri is safe to hand an auth code to. */
export function isAllowedRedirectUri(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  // localhost (any scheme/port) for local MCP client testing
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;

  // Everything else must be HTTPS
  if (url.protocol !== "https:") return false;

  // Hostname must match one of the allow-listed suffixes exactly or as a subdomain
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}
