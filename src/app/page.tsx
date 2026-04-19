"use client";

import { useState } from "react";

export default function Home() {
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (e.g. insecure context) — fall through silently
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.logo}>🎋</div>
        <h1 style={styles.title}>Bambu Lab MCP</h1>
        <p style={styles.subtitle}>
          A remote Model Context Protocol server that connects Claude to your Bambu Lab
          account. Access print history, printers, projects, and live status from Claude.
        </p>

        <a
          href="https://claude.ai/settings/integrations"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.primaryButton}
        >
          Add to Claude →
        </a>

        <div style={styles.urlRow}>
          <code style={styles.urlCode}>{appUrl}</code>
          <button type="button" onClick={copyUrl} style={styles.copyButton}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <details style={styles.details}>
          <summary style={styles.summary}>How to connect</summary>
          <ol style={styles.list}>
            <li>
              Click <strong>Add to Claude</strong> — opens{" "}
              <code style={styles.inlineCode}>claude.ai/settings/integrations</code> in a new
              tab.
            </li>
            <li>In the Integrations page, click <strong>Add custom connector</strong>.</li>
            <li>Paste the URL above as the connector URL.</li>
            <li>Complete the OAuth flow — sign in with your Bambu Lab credentials.</li>
            <li>Done. Ask Claude about your prints.</li>
          </ol>
        </details>

        <div style={styles.features}>
          <div style={styles.feature}>📜 Print history & stats</div>
          <div style={styles.feature}>🖨️ Printer list & status</div>
          <div style={styles.feature}>🧵 Filament usage</div>
          <div style={styles.feature}>📡 Live job status</div>
        </div>

        <p style={styles.footer}>
          Your Bambu password is sent only to Bambu Lab. Only the resulting access token is
          stored — encrypted with AES-256-GCM inside the bearer token Claude holds.
        </p>

        <a
          href="https://linktr.ee/bustrama"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.credits}
        >
          Built by bustrama ↗
        </a>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "16px",
    padding: "48px",
    maxWidth: "520px",
    width: "100%",
    textAlign: "center",
  },
  logo: { fontSize: "48px", marginBottom: "16px" },
  title: { fontSize: "26px", fontWeight: 700, margin: "0 0 12px" },
  subtitle: { color: "#888", fontSize: "14px", lineHeight: 1.6, margin: "0 0 28px" },
  primaryButton: {
    display: "block",
    width: "100%",
    padding: "14px",
    background: "#00ae42",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center",
    boxSizing: "border-box",
    marginBottom: "12px",
  },
  urlRow: {
    display: "flex",
    gap: "8px",
    alignItems: "stretch",
    marginBottom: "24px",
  },
  urlCode: {
    flex: 1,
    background: "#0f0f0f",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "12px",
    color: "#00ae42",
    textAlign: "left",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  copyButton: {
    padding: "0 16px",
    background: "#0f0f0f",
    color: "#ccc",
    border: "1px solid #333",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  details: {
    textAlign: "left",
    background: "#0f0f0f",
    border: "1px solid #222",
    borderRadius: "10px",
    padding: "12px 16px",
    marginBottom: "24px",
  },
  summary: {
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    color: "#ccc",
    listStyle: "none",
    userSelect: "none",
  },
  list: {
    paddingLeft: "20px",
    lineHeight: 1.7,
    fontSize: "13px",
    color: "#aaa",
    margin: "12px 0 4px",
  },
  inlineCode: {
    background: "#1a1a1a",
    padding: "1px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    color: "#ccc",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "20px",
  },
  feature: {
    background: "#0f0f0f",
    border: "1px solid #222",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "12px",
    color: "#888",
    textAlign: "left",
  },
  footer: { fontSize: "11px", color: "#555", lineHeight: 1.5, marginTop: "8px" },
  credits: {
    display: "inline-block",
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #222",
    width: "100%",
    boxSizing: "border-box",
    fontSize: "12px",
    color: "#888",
    textDecoration: "none",
    fontWeight: 500,
  },
};
