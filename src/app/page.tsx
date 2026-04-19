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
      // clipboard blocked — ignore
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🎋</div>
          <h1 style={styles.title}>Bambu Lab MCP</h1>
          <p style={styles.subtitle}>
            Connect Claude to your Bambu Lab account. Three quick steps.
          </p>
        </div>

        <ol style={styles.stepList}>
          <li style={styles.step}>
            <div style={styles.stepNum}>1</div>
            <div style={styles.stepBody}>
              <div style={styles.stepTitle}>Copy the server URL</div>
              <div style={styles.stepHint}>
                You&apos;ll paste this into Claude in the next step.
              </div>
              <div style={styles.urlRow}>
                <code style={styles.urlCode}>{appUrl}</code>
                <button type="button" onClick={copyUrl} style={styles.copyButton}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>
          </li>

          <li style={styles.step}>
            <div style={styles.stepNum}>2</div>
            <div style={styles.stepBody}>
              <div style={styles.stepTitle}>Open Claude&apos;s Integrations page</div>
              <div style={styles.stepHint}>
                Click <strong>Add custom connector</strong>, then paste the URL you just
                copied.
              </div>
              <a
                href="https://claude.ai/settings/integrations"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.primaryButton}
              >
                Add to Claude →
              </a>
            </div>
          </li>

          <li style={styles.step}>
            <div style={styles.stepNum}>3</div>
            <div style={styles.stepBody}>
              <div style={styles.stepTitle}>Sign in with your Bambu Lab account</div>
              <div style={styles.stepHint}>
                Claude opens a pop-up to this site. Enter your Bambu email + password (+
                email code or 2FA if prompted). Claude is now connected.
              </div>
            </div>
          </li>
        </ol>

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
    padding: "40px",
    maxWidth: "560px",
    width: "100%",
  },
  header: { textAlign: "center", marginBottom: "32px" },
  logo: { fontSize: "44px", marginBottom: "12px" },
  title: { fontSize: "26px", fontWeight: 700, margin: "0 0 10px" },
  subtitle: { color: "#888", fontSize: "14px", lineHeight: 1.5, margin: 0 },
  stepList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 32px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  step: {
    display: "flex",
    gap: "16px",
    padding: "18px",
    background: "#0f0f0f",
    border: "1px solid #222",
    borderRadius: "12px",
  },
  stepNum: {
    flexShrink: 0,
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#00ae42",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 700,
  },
  stepBody: { flex: 1, minWidth: 0 },
  stepTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#f0f0f0",
    marginBottom: "4px",
  },
  stepHint: {
    fontSize: "12px",
    color: "#888",
    lineHeight: 1.5,
    marginBottom: "12px",
  },
  urlRow: {
    display: "flex",
    gap: "8px",
    alignItems: "stretch",
  },
  urlCode: {
    flex: 1,
    minWidth: 0,
    background: "#050505",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "12px",
    color: "#00ae42",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  copyButton: {
    padding: "0 14px",
    background: "#2a2a2a",
    color: "#f0f0f0",
    border: "1px solid #333",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  primaryButton: {
    display: "inline-block",
    padding: "10px 18px",
    background: "#00ae42",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    textDecoration: "none",
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
  },
  footer: {
    fontSize: "11px",
    color: "#555",
    lineHeight: 1.5,
    textAlign: "center",
    margin: "8px 0 0",
  },
  credits: {
    display: "block",
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #222",
    fontSize: "12px",
    color: "#888",
    textDecoration: "none",
    fontWeight: 500,
    textAlign: "center",
  },
};
