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
      <svg
        width="22"
        height="22"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: "#D97757" }}
      >
        <path
          fill="currentColor"
          d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z"
        />
      </svg>
    </span>
  );
}

function BambuMark() {
  return (
    <span style={styles.mark} aria-label="Bambu Lab" title="Bambu Lab">
      <svg
        width="22"
        height="22"
        viewBox="0 0 135 176"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="#00ae42">
          <polygon points="71.11,153.19 117.59,153.19 117.59,89.8 71.11,71.5" />
          <polygon points="71.11,22.84 71.11,63.69 117.59,82 117.59,22.84" />
          <polygon points="17.42,22.84 17.42,104.53 63.89,86.23 63.89,22.84" />
          <polygon points="17.42,153.19 63.89,153.19 63.89,94.03 17.42,112.34" />
        </g>
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
