import type { NextConfig } from "next";

// Security headers applied to every response. Kept intentionally minimal — this
// is an API server; a full CSP would need to allow-list the inline styles on
// /oauth/authorize and is fragile across Next.js upgrades.
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" }, // clickjacking on /oauth/authorize
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/.well-known/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/.well-known/oauth-authorization-server", destination: "/api/oauth/metadata" },
      { source: "/.well-known/oauth-protected-resource", destination: "/api/oauth/protected-resource" },
    ];
  },
};

export default config;
