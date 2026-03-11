import { useState } from "react";
import { supabase } from "./services/supabase";

const G = {
  blue:   "#4285F4",
  red:    "#EA4335",
  yellow: "#FBBC04",
  green:  "#34A853",
  text:   "#1f1f1f",
  text2:  "#5f6368",
  textM:  "#9aa0a6",
  bg:     "#f8faff",
  card:   "#ffffff",
  border: "#e8eaed",
};

const F = {
  sans: "'Inter', 'Google Sans', system-ui, -apple-system, sans-serif",
  mono: "'Roboto Mono', monospace",
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 814 1000" style={{ flexShrink: 0, fill: "white" }}>
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.1 134.8-316.6 267.6-316.6 49.5 0 101 20.8 135.5 51.5 33.2 29.5 52.5 45.2 67.2 45.2 19.8 0 51.5-22.5 81.4-50.3 36.3-32.8 71.5-55.6 118.2-55.6 6 0 95.8 2 158.3 62.9zm-166.6-188.1c0-56.5 24.5-115.4 65.2-153.8 7.5-6.8 23.8-17 29.8-17 .6 0 1.5 0 2.5.5v5.5c0 33.5-19.2 77.2-43.5 113.2-22 33.5-59.4 68.5-99.2 68.5-1 0-2-.2-3-.5.5-5.5 1-11 2-16.5 7.5-11.5 22.5-31.5 46.2-52.9z"/>
  </svg>
);

function Spinner({ dark }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: "civly-spin 0.75s linear infinite", flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6" fill="none" stroke={dark ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)"} strokeWidth="2" />
      <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke={dark ? G.blue : "#fff"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const features = [
  { icon: "🏛️", n: "535", label: "Active Members", desc: "Every Senator & Representative", color: G.blue, bg: "rgba(66,133,244,0.08)", border: "rgba(66,133,244,0.18)" },
  { icon: "📜", n: "100+", label: "Bills Tracked", desc: "Every stage, every vote", color: G.green, bg: "rgba(52,168,83,0.08)", border: "rgba(52,168,83,0.18)" },
  { icon: "🗳️", n: "Full", label: "Vote Rosters", desc: "Yea/Nay with photos", color: G.red, bg: "rgba(234,67,53,0.08)", border: "rgba(234,67,53,0.18)" },
  { icon: "⚖️", n: "9", label: "SCOTUS Justices", desc: "Live case tracker", color: "#F9AB00", bg: "rgba(251,188,4,0.1)", border: "rgba(251,188,4,0.25)" },
];

export default function AuthScreen({ onContinueAsGuest }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEmail, setShowEmail] = useState(false);

  const handleOAuth = async (provider) => {
    setLoading(provider);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) { setError(error.message); setLoading(null); }
  };

  const handleEmail = async () => {
    if (!email || !password) return;
    setLoading("email");
    setError("");
    setSuccess("");
    const { error, data } = mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else if (mode === "signup" && !data.session)
      setSuccess("Check your email to confirm your account.");
    setLoading(null);
  };

  const canSubmit = email && password && !loading;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: F.sans, background: G.bg, position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&family=Roboto+Mono:wght@400;500&display=swap');
        @keyframes civly-spin { to { transform: rotate(360deg); } }
        @keyframes civly-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-inp {
          width: 100%; padding: 13px 18px;
          border: 1.5px solid ${G.border};
          border-radius: 14px; font-size: 14px; font-family: inherit; font-weight: 300;
          color: ${G.text}; background: #fff; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-inp:focus {
          border-color: ${G.blue};
          box-shadow: 0 0 0 3px rgba(66,133,244,0.12);
        }
        .auth-inp::placeholder { color: ${G.textM}; font-weight: 300; }

        .pill-btn {
          display: flex; align-items: center; justify-content: center; gap: 9px;
          padding: 12px 22px; border-radius: 9999px;
          font-size: 14px; font-family: inherit; font-weight: 400;
          cursor: pointer; transition: all 0.15s; border: none; white-space: nowrap;
        }
        .pill-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
        .pill-btn:active:not(:disabled) { transform: translateY(0); }
        .pill-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .feat-card {
          display: flex; flex-direction: column; align-items: center;
          gap: 7px; padding: 18px 14px; border-radius: 20px;
          flex: 1; min-width: 0; transition: transform 0.15s, box-shadow 0.15s;
          cursor: default;
        }
        .feat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }

        .email-form { animation: civly-fadein 0.2s ease; }

        .text-link { all: unset; cursor: pointer; color: ${G.blue}; font-weight: 400; }
        .text-link:hover { text-decoration: underline; }
      `}</style>

      {/* ── Ambient background orbs ── */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(66,133,244,0.1) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "-5%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,168,83,0.09) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: "35%", left: "5%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,188,4,0.07) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: "20%", right: "20%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(234,67,53,0.06) 0%, transparent 65%)" }} />
      </div>

      {/* ── Content layer ── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* ── Nav ── */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Logo mark */}
            <div style={{ width: 38, height: 38, borderRadius: 12, background: G.blue, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(66,133,244,0.35)" }}>
              <span style={{ color: "#fff", fontWeight: 500, fontSize: 17, fontFamily: F.sans }}>C</span>
            </div>
            <div>
              <div style={{ fontFamily: F.sans, fontSize: 18, fontWeight: 300, color: G.text, letterSpacing: "-0.3px" }}>Civly</div>
              <div style={{ fontFamily: F.mono, fontSize: 9, color: G.textM, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 1 }}>119th Congress</div>
            </div>
          </div>

          {/* Nav pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(52,168,83,0.1)", border: "1px solid rgba(52,168,83,0.2)", borderRadius: 9999, padding: "5px 14px" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: G.green }} />
              <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 300, color: G.green, letterSpacing: 0.3 }}>Non-partisan · Free</span>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px 20px", textAlign: "center" }}>

          {/* Eyebrow badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(66,133,244,0.08)", border: "1.5px solid rgba(66,133,244,0.2)", borderRadius: 9999, padding: "6px 18px", marginBottom: 28 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: G.blue }} />
            <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 300, color: G.blue, letterSpacing: 0.5 }}>119th U.S. Congress — Live</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: F.sans, fontSize: "clamp(38px, 5.5vw, 68px)", fontWeight: 200, color: G.text, lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 18, maxWidth: 820 }}>
            Track Congress.{" "}
            <span style={{ fontWeight: 200, background: `linear-gradient(100deg, ${G.blue}, ${G.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Know Every Vote.
            </span>{" "}
            Own the Conversation.
          </h1>

          {/* Subtext */}
          <p style={{ fontFamily: F.sans, fontSize: 17, fontWeight: 300, color: G.text2, lineHeight: 1.8, maxWidth: 540, marginBottom: 44, letterSpacing: "-0.2px" }}>
            The complete, non-partisan legislative tracker for every bill, vote, and member of the 119th United States Congress — free for every citizen.
          </p>

          {/* Feature cards */}
          <div style={{ display: "flex", gap: 12, maxWidth: 780, width: "100%", justifyContent: "center" }}>
            {features.map(f => (
              <div key={f.label} className="feat-card" style={{ background: f.bg, border: `1.5px solid ${f.border}` }}>
                {/* Icon circle */}
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: `0 4px 12px ${f.color}40` }}>
                  {f.icon}
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 22, fontWeight: 200, color: f.color, lineHeight: 1, letterSpacing: "-0.5px" }}>{f.n}</div>
                <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 400, color: G.text, textAlign: "center", letterSpacing: "-0.1px" }}>{f.label}</div>
                <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 300, color: G.text2, textAlign: "center", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Auth section — bottom, centered ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 24px 44px" }}>

          {/* Auth card */}
          <div style={{
            width: "100%", maxWidth: 420,
            background: G.card,
            borderRadius: 28,
            padding: "32px 32px 28px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 50px rgba(0,0,0,0.09)",
            border: `1px solid ${G.border}`,
          }}>

            {/* Card heading */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 200, color: G.text, letterSpacing: "-0.5px", marginBottom: 4 }}>
                {mode === "signin" ? "Welcome back" : "Get started free"}
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 300, color: G.text2 }}>
                {mode === "signin" ? "Sign in to continue to Civly" : "Create your Civly account"}
              </div>
            </div>

            {/* OAuth buttons */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button className="pill-btn" disabled={!!loading} onClick={() => handleOAuth("google")}
                style={{ background: "#fff", color: G.text, border: `1.5px solid ${G.border}`, flex: 1 }}>
                {loading === "google" ? <Spinner dark /> : <GoogleIcon />}
                <span>Google</span>
              </button>
              <button className="pill-btn" disabled={!!loading} onClick={() => handleOAuth("apple")}
                style={{ background: "#111", color: "#fff", flex: 1 }}>
                {loading === "apple" ? <Spinner /> : <AppleIcon />}
                <span>Apple</span>
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: G.border }} />
              <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 300, color: G.textM }}>or</span>
              <div style={{ flex: 1, height: 1, background: G.border }} />
            </div>

            {/* Email reveal button */}
            {!showEmail && (
              <button
                onClick={() => setShowEmail(true)}
                style={{
                  all: "unset", width: "100%", boxSizing: "border-box",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "12px 0", borderRadius: 9999,
                  border: `1.5px solid ${G.border}`,
                  color: G.text2, fontSize: 14, fontFamily: F.sans, fontWeight: 300,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = G.blue; e.currentTarget.style.color = G.blue; e.currentTarget.style.background = "rgba(66,133,244,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.text2; e.currentTarget.style.background = "transparent"; }}
              >
                Continue with email
              </button>
            )}

            {/* Email form */}
            {showEmail && (
              <div className="email-form" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input className="auth-inp" type="email" placeholder="Email address"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEmail()} autoFocus />
                <input className="auth-inp" type="password" placeholder="Password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEmail()} />

                {error && (
                  <div style={{ background: "rgba(234,67,53,0.06)", border: `1px solid rgba(234,67,53,0.3)`, borderRadius: 12, padding: "10px 16px", fontFamily: F.sans, fontSize: 13, fontWeight: 300, color: G.red }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div style={{ background: "rgba(52,168,83,0.06)", border: `1px solid rgba(52,168,83,0.3)`, borderRadius: 12, padding: "10px 16px", fontFamily: F.sans, fontSize: 13, fontWeight: 300, color: G.green }}>
                    {success}
                  </div>
                )}

                <button
                  disabled={!canSubmit}
                  onClick={handleEmail}
                  style={{
                    all: "unset", width: "100%", boxSizing: "border-box", textAlign: "center",
                    padding: "13px 0", borderRadius: 9999, fontSize: 14, fontFamily: F.sans, fontWeight: 400,
                    background: canSubmit ? G.blue : G.border,
                    color: canSubmit ? "#fff" : G.textM,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "background 0.2s, box-shadow 0.2s",
                    boxShadow: canSubmit ? "0 4px 16px rgba(66,133,244,0.35)" : "none",
                  }}
                >
                  {loading === "email" && <Spinner />}
                  {mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </div>
            )}

            {/* Mode toggle */}
            <div style={{ textAlign: "center", marginTop: 18, fontFamily: F.sans, fontSize: 13, fontWeight: 300, color: G.text2 }}>
              {mode === "signin" ? "New to Civly? " : "Already have an account? "}
              <button className="text-link"
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setSuccess(""); setShowEmail(false); setEmail(""); setPassword(""); }}>
                {mode === "signin" ? "Create account" : "Sign in"}
              </button>
            </div>
          </div>

          {/* Guest CTA */}
          {onContinueAsGuest && (
            <button
              onClick={onContinueAsGuest}
              style={{
                all: "unset", marginTop: 14, cursor: "pointer",
                fontFamily: F.sans, fontSize: 13, fontWeight: 300, color: G.textM,
                display: "block", textAlign: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = G.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = G.textM; }}
            >
              Continue without login →
            </button>
          )}

          {/* Footer */}
          <div style={{ marginTop: 18, fontFamily: F.sans, fontSize: 11, fontWeight: 300, color: G.textM, textAlign: "center" }}>
            By continuing you agree to Civly's{" "}
            <span style={{ color: G.blue, cursor: "pointer" }}>Terms</span> and{" "}
            <span style={{ color: G.blue, cursor: "pointer" }}>Privacy Policy</span>.
          </div>
        </div>

      </div>
    </div>
  );
}
