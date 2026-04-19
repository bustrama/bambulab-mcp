export default function Home() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.logo}>🎋</div>
        <h1 style={styles.title}>Bambu Lab MCP</h1>
        <p style={styles.subtitle}>
          A remote Model Context Protocol server that connects Claude to your Bambu Lab
          account. Access your print history, printers, projects, and live status directly
          from Claude.
        </p>

        <div style={styles.steps}>
          <h2 style={styles.h2}>Connect via Claude.ai</h2>
          <ol style={styles.list}>
            <li>Go to <strong>Claude.ai → Settings → Connectors → Add custom connector</strong>.</li>
            <li>
              Paste this URL: <code style={styles.code}>{appUrl}</code>
            </li>
            <li>Complete the OAuth flow — you&apos;ll be prompted to sign in to Bambu Lab.</li>
            <li>Done. Claude can now query your print history and printers.</li>
          </ol>
        </div>

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
  subtitle: { color: "#888", fontSize: "14px", lineHeight: 1.6, margin: "0 0 32px" },
  steps: { textAlign: "left", marginBottom: "32px" },
  h2: { fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", margin: "0 0 12px" },
  list: { paddingLeft: "20px", lineHeight: 1.7, fontSize: "14px", color: "#ccc" },
  code: {
    background: "#0f0f0f",
    border: "1px solid #333",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#00ae42",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "24px",
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
  footer: { fontSize: "11px", color: "#555", lineHeight: 1.5, marginTop: "12px" },
};
