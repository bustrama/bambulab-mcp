"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Step = "password" | "code" | "tfa";

function AuthorizeContent() {
  const params = useSearchParams();
  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state") ?? "";
  const codeChallenge = params.get("code_challenge") ?? "";
  const codeChallengeMethod = params.get("code_challenge_method") ?? "S256";

  const [step, setStep] = useState<Step>("password");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState<"world" | "china">("world");
  const [code, setCode] = useState("");
  const [tfaCode, setTfaCode] = useState("");
  const [tfaTicket, setTfaTicket] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!redirectUri || !codeChallenge) {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <p style={styles.error}>
            Invalid authorization request — missing required parameters.
          </p>
        </div>
      </main>
    );
  }

  const oauthBase = {
    clientId,
    redirectUri,
    state,
    codeChallenge,
    codeChallengeMethod,
  };

  async function submit(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/oauth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (data.status === "need_verifyCode") {
        setStep("code");
        return;
      }
      if (data.status === "need_tfa") {
        setTfaTicket(data.tfaTicket);
        setStep("tfa");
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError("Unexpected response from server.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePassword(e: FormEvent) {
    e.preventDefault();
    submit({ step: "password", account, password, region, ...oauthBase });
  }

  function handleCode(e: FormEvent) {
    e.preventDefault();
    submit({ step: "code", account, code, region, ...oauthBase });
  }

  function handleTfa(e: FormEvent) {
    e.preventDefault();
    submit({ step: "tfa", tfaTicket, tfaCode, ...oauthBase });
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.logo}>🎋</div>
        <h1 style={styles.title}>Connect to Bambu Lab</h1>
        <p style={styles.subtitle}>
          Claude is requesting access to your Bambu Lab account so it can read your print
          history, printers, and projects.
        </p>

        {step === "password" && (
          <form onSubmit={handlePassword} style={styles.form}>
            <label style={styles.label}>Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as "world" | "china")}
              style={styles.input}
            >
              <option value="world">World (api.bambulab.com)</option>
              <option value="china">China (api.bambulab.cn)</option>
            </select>

            <label style={{ ...styles.label, marginTop: 16 }} htmlFor="account">
              Email
            </label>
            <input
              id="account"
              type="email"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
              autoComplete="username"
              autoFocus
            />

            <label style={{ ...styles.label, marginTop: 16 }} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your Bambu Lab password"
              required
              style={styles.input}
              autoComplete="current-password"
            />

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" disabled={loading || !account || !password} style={styles.button}>
              {loading ? "Signing in…" : "Continue"}
            </button>

            <p style={styles.footer}>
              Your password is sent only to Bambu Lab to obtain an access token. It is never
              stored on this server.
            </p>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleCode} style={styles.form}>
            <p style={styles.hint}>
              Bambu emailed a 6-digit verification code to <strong>{account}</strong>. Enter
              it below.
            </p>
            <label style={{ ...styles.label, marginTop: 16 }} htmlFor="code">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              style={styles.input}
              autoFocus
            />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" disabled={loading || !code} style={styles.button}>
              {loading ? "Verifying…" : "Authorise"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCode("");
                setStep("password");
              }}
              style={styles.linkButton}
            >
              ← Back
            </button>
          </form>
        )}

        {step === "tfa" && (
          <form onSubmit={handleTfa} style={styles.form}>
            <p style={styles.hint}>
              Two-factor authentication is enabled on your account. Enter the 6-digit code from
              your authenticator app.
            </p>
            <label style={{ ...styles.label, marginTop: 16 }} htmlFor="tfaCode">
              2FA code
            </label>
            <input
              id="tfaCode"
              type="text"
              inputMode="numeric"
              value={tfaCode}
              onChange={(e) => setTfaCode(e.target.value)}
              placeholder="123456"
              required
              style={styles.input}
              autoFocus
            />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" disabled={loading || !tfaCode} style={styles.button}>
              {loading ? "Verifying…" : "Authorise"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTfaCode("");
                setTfaTicket("");
                setStep("password");
              }}
              style={styles.linkButton}
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function AuthorizePage() {
  return (
    <Suspense>
      <AuthorizeContent />
    </Suspense>
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
    maxWidth: "440px",
    width: "100%",
    textAlign: "center",
  },
  logo: { fontSize: "40px", marginBottom: "12px" },
  title: { fontSize: "22px", fontWeight: 700, margin: "0 0 12px" },
  subtitle: { color: "#888", fontSize: "14px", lineHeight: 1.6, margin: "0 0 28px" },
  form: { textAlign: "left" },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "8px",
    color: "#ccc",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "#0f0f0f",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#f0f0f0",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },
  hint: { fontSize: "13px", color: "#aaa", margin: "0", lineHeight: 1.5 },
  error: {
    background: "#2a1010",
    border: "1px solid #5a2020",
    borderRadius: "6px",
    padding: "10px 12px",
    fontSize: "13px",
    color: "#f87171",
    marginTop: "16px",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#00ae42",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "20px",
  },
  linkButton: {
    width: "100%",
    padding: "8px",
    background: "transparent",
    color: "#888",
    border: "none",
    fontSize: "13px",
    cursor: "pointer",
    marginTop: "12px",
  },
  footer: { fontSize: "11px", color: "#444", marginTop: "20px", lineHeight: 1.5 },
};
