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
          <div style={styles.logoRow}>
            <ClaudeMark />
            <span style={styles.logoPlus}>+</span>
            <BambuMark />
          </div>
          <h1 style={styles.title}>Bambu Lab MCP</h1>
          <p style={styles.subtitle}>Connect Claude to your Bambu Lab account.</p>
        </div>

        <ol style={styles.stepList}>
          <li style={styles.step}>
            <div style={styles.stepNum}>1</div>
            <div style={styles.stepBody}>
              <div style={styles.stepTitle}>Copy the server URL</div>
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
              <div style={styles.stepTitle}>Add it in Claude</div>
              <div style={styles.stepHint}>
                Open Claude&apos;s Integrations → <strong>Add custom connector</strong> → paste the URL.
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
              <div style={styles.stepTitle}>Sign in with Bambu Lab</div>
              <div style={styles.stepHint}>
                Claude opens a pop-up. Enter your Bambu email + password (+ code / 2FA if prompted).
              </div>
            </div>
          </li>
        </ol>

        <div style={styles.features}>
          <span style={styles.feature}>📜 History</span>
          <span style={styles.feature}>🖨️ Printers</span>
          <span style={styles.feature}>🧵 Filament</span>
          <span style={styles.feature}>📡 Live status</span>
        </div>

        <p style={styles.footer}>
          Password goes straight to Bambu Lab. Only the access token is kept — AES-256-GCM encrypted inside Claude&apos;s bearer token.
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

function ClaudeMark() {
  return (
    <span style={styles.mark} aria-label="Claude" title="Claude">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2 L13.6 9.2 C13.85 10.3 14.7 11.15 15.8 11.4 L23 13 L15.8 14.6 C14.7 14.85 13.85 15.7 13.6 16.8 L12 24 L10.4 16.8 C10.15 15.7 9.3 14.85 8.2 14.6 L1 13 L8.2 11.4 C9.3 11.15 10.15 10.3 10.4 9.2 Z"
          fill="#D97757"
        />
      </svg>
    </span>
  );
}

function BambuMark() {
  return (
    <span style={{ ...styles.mark, background: "#00ae42" }} aria-label="Bambu Lab" title="Bambu Lab">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 3 C12 4 6 9 4 17 C3.5 19 3.5 20.5 4 21 C4.5 21.5 6 21.5 8 21 C16 19 20.5 13.5 21 5 C21 4 20.8 3.3 20.5 3.1 C20.3 3 20.1 3 20 3 Z"
          fill="#ffffff"
        />
        <path
          d="M5 20 C9 14 14 10 20 7"
          stroke="#00ae42"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "14px",
    padding: "24px",
    maxWidth: "480px",
    width: "100%",
  },
  header: { textAlign: "center", marginBottom: "20px" },
  logoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  mark: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlus: {
    color: "#555",
    fontSize: "16px",
    fontWeight: 400,
  },
  title: { fontSize: "20px", fontWeight: 700, margin: "0 0 4px" },
  subtitle: { color: "#888", fontSize: "13px", lineHeight: 1.4, margin: 0 },
  stepList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  step: {
    display: "flex",
    gap: "12px",
    padding: "12px 14px",
    background: "#0f0f0f",
    border: "1px solid #222",
    borderRadius: "10px",
  },
  stepNum: {
    flexShrink: 0,
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#00ae42",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    marginTop: "1px",
  },
  stepBody: { flex: 1, minWidth: 0 },
  stepTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#f0f0f0",
    marginBottom: "6px",
  },
  stepHint: {
    fontSize: "12px",
    color: "#888",
    lineHeight: 1.45,
    marginBottom: "8px",
  },
  urlRow: {
    display: "flex",
    gap: "6px",
    alignItems: "stretch",
  },
  urlCode: {
    flex: 1,
    minWidth: 0,
    background: "#050505",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    padding: "6px 9px",
    fontSize: "11px",
    color: "#00ae42",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  copyButton: {
    padding: "0 12px",
    background: "#2a2a2a",
    color: "#f0f0f0",
    border: "1px solid #333",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  primaryButton: {
    display: "inline-block",
    padding: "7px 14px",
    background: "#00ae42",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontSize: "12px",
    fontWeight: 600,
    textDecoration: "none",
  },
  features: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "14px",
    justifyContent: "center",
  },
  feature: {
    background: "#0f0f0f",
    border: "1px solid #222",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "11px",
    color: "#888",
  },
  footer: {
    fontSize: "10.5px",
    color: "#555",
    lineHeight: 1.5,
    textAlign: "center",
    margin: 0,
  },
  credits: {
    display: "block",
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px solid #222",
    fontSize: "11px",
    color: "#888",
    textDecoration: "none",
    fontWeight: 500,
    textAlign: "center",
  },
};
