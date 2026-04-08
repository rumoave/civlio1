import { useState, useEffect } from "react";
import { supabase } from "./services/supabase";

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 814 1000" style={{ flexShrink: 0, fill: "currentColor" }}>
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.1 134.8-316.6 267.6-316.6 49.5 0 101 20.8 135.5 51.5 33.2 29.5 52.5 45.2 67.2 45.2 19.8 0 51.5-22.5 81.4-50.3 36.3-32.8 71.5-55.6 118.2-55.6 6 0 95.8 2 158.3 62.9zm-166.6-188.1c0-56.5 24.5-115.4 65.2-153.8 7.5-6.8 23.8-17 29.8-17 .6 0 1.5 0 2.5.5v5.5c0 33.5-19.2 77.2-43.5 113.2-22 33.5-59.4 68.5-99.2 68.5-1 0-2-.2-3-.5.5-5.5 1-11 2-16.5 7.5-11.5 22.5-31.5 46.2-52.9z"/>
  </svg>
);

function Spinner({ light }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" style={{ animation: "auth-spin 0.7s linear infinite", flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6" fill="none" stroke={light ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)"} strokeWidth="2"/>
      <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke={light ? "#fff" : "#1a2744"} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function Counter({ target, suffix = "", delay = 0 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const tid = setTimeout(() => {
      let start = null;
      const duration = 1400;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        setVal(Math.floor(ease * target));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(tid);
  }, [target, delay]);
  return <>{val}{suffix}</>;
}

const STATS = [
  { n: 535, suffix: "", label: "Members of Congress", accent: false },
  { n: 100, suffix: "+", label: "Bills Tracked", accent: true },
  { n: 119, suffix: "th", label: "Congress Live", accent: false },
  { n: 9, suffix: "", label: "SCOTUS Justices", accent: false },
];

const TICKER = [
  { tag: "SIGNED", text: "One Big Beautiful Bill Act — $3.2T reconciliation", col: "#16a34a" },
  { tag: "PASSED", text: "Laken Riley Act — Bipartisan 64–35 Senate", col: "#1a4db8" },
  { tag: "FLOOR",  text: "SAVE Act — Voter ID provisions under review", col: "#0284c7" },
  { tag: "CMTE",   text: "HALT Fentanyl Act — Energy & Commerce markup", col: "#b45309" },
];

// Faint Capitol dome SVG
const CapitolSilhouette = () => (
  <svg viewBox="0 0 800 280" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%", height: "auto", opacity: 0.055, pointerEvents: "none" }}>
    <path d="M390 270 L390 140 L385 130 L380 110 L375 90 L370 75 L365 62 L360 52 L355 44 L350 38 L345 34 L340 32 L335 34 L330 38 L325 44 L320 52 L315 62 L310 75 L305 90 L300 110 L295 130 L290 140 L290 145 L260 145 L260 270 Z" fill="white"/>
    <rect x="340" y="28" width="20" height="4" fill="white"/>
    <rect x="347" y="10" width="6" height="20" fill="white"/>
    <circle cx="350" cy="7" r="5" fill="white"/>
    <path d="M260 145 L250 145 L240 148 L230 155 L220 165 L50 165 L50 270 L260 270 Z" fill="white"/>
    <path d="M550 145 L560 145 L570 148 L580 155 L590 165 L750 165 L750 270 L550 270 Z" fill="white"/>
    <rect x="200" y="165" width="400" height="105" fill="white"/>
    <rect x="60" y="165" width="140" height="80" fill="white" opacity="0.5"/>
    <rect x="600" y="165" width="140" height="80" fill="white" opacity="0.5"/>
  </svg>
);

export default function AuthScreen({ onContinueAsGuest }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const handleOAuth = async (provider) => {
    setLoading(provider); setError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (error) { setError(error.message); setLoading(null); }
  };

  const handleEmail = async () => {
    if (!email || !password) return;
    setLoading("email"); setError(""); setSuccess("");
    const { error, data } = mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else if (mode === "signup" && !data.session) setSuccess("Check your email to confirm your account.");
    setLoading(null);
  };

  const switchMode = () => {
    setMode(m => m === "signin" ? "signup" : "signin");
    setError(""); setSuccess(""); setShowEmail(false); setEmail(""); setPassword("");
  };

  const canSubmit = email && password && !loading;

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        @keyframes auth-spin   { to { transform: rotate(360deg); } }
        @keyframes auth-in-l   { from { opacity:0; transform:translateX(-32px); } to { opacity:1; transform:translateX(0); } }
        @keyframes auth-in-up  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes auth-in-r   { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes auth-grow-x { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        @keyframes auth-pulse  { 0%,100%{box-shadow:0 0 0 0 rgba(196,30,58,0.7)} 50%{box-shadow:0 0 0 5px rgba(196,30,58,0)} }
        @keyframes auth-grain  { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-2%,3%)} 40%{transform:translate(2%,-2%)} 60%{transform:translate(-3%,1%)} 80%{transform:translate(1%,-3%)} }
        @keyframes auth-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes auth-ticker { 0%{opacity:0;transform:translateX(-6px)} 100%{opacity:1;transform:translateX(0)} }
        @keyframes auth-line-in { from{width:0;opacity:0} to{width:28px;opacity:1} }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* === LEFT PANEL GRAIN === */
        .auth-left::before {
          content: "";
          position: absolute; inset: -60%;
          width: 220%; height: 220%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size: 220px 220px;
          opacity: 0.048; pointer-events: none;
          animation: auth-grain 9s steps(1) infinite;
          mix-blend-mode: overlay;
          z-index: 1;
        }

        /* === RIGHT PANEL TEXTURE === */
        .auth-right::after {
          content: "";
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size: 160px 160px;
          opacity: 0.018; pointer-events: none; z-index: 0;
        }

        /* === INPUTS === */
        .auth-inp {
          width: 100%; padding: 12px 0 12px 0;
          background: transparent; border: none;
          border-bottom: 1.5px solid #d8d5cf;
          font-size: 14px; font-family: 'DM Sans', system-ui, sans-serif; font-weight: 400;
          color: #111; outline: none; transition: border-color 0.25s;
          letter-spacing: 0.15px;
        }
        .auth-inp:focus { border-bottom-color: transparent; }
        .auth-inp::placeholder { color: #b8b4ae; font-weight: 300; }

        .auth-inp-wrap { position: relative; }
        .auth-inp-wrap::after {
          content: "";
          position: absolute; bottom: 0; left: 0;
          height: 2px; width: 0; background: #c41e3a;
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .auth-inp-wrap:focus-within::after { width: 100%; }

        /* === OAUTH BUTTONS === */
        .auth-oauth-btn {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          padding: 12px 0; border-radius: 7px;
          font-size: 13px; font-family: 'DM Sans', system-ui, sans-serif; font-weight: 500;
          cursor: pointer; white-space: nowrap; letter-spacing: 0.2px;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .auth-oauth-btn::before {
          content: "";
          position: absolute; inset: 0;
          background: rgba(255,255,255,0.12);
          transform: translateX(-100%); transition: transform 0.3s ease;
        }
        .auth-oauth-btn:hover:not(:disabled)::before { transform: translateX(0); }
        .auth-oauth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.14); }
        .auth-oauth-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
        .auth-oauth-btn:disabled { opacity: 0.42; cursor: not-allowed; }

        /* === SUBMIT BUTTON === */
        .auth-submit {
          width: 100%; padding: 14px 0; border: none; border-radius: 7px;
          font-size: 12px; font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase;
          cursor: pointer; transition: transform 0.17s, box-shadow 0.17s, filter 0.17s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .auth-submit.active {
          background: linear-gradient(135deg, #1a2744 0%, #243566 100%);
          color: #fff;
          box-shadow: 0 4px 24px rgba(26,39,68,0.32);
        }
        .auth-submit.active:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(26,39,68,0.38); filter: brightness(1.08); }
        .auth-submit.active:active { transform: translateY(0); box-shadow: 0 2px 12px rgba(26,39,68,0.25); }
        .auth-submit.inactive { background: #e8e5e0; color: #a8a5a0; cursor: not-allowed; }

        /* === TEXT LINKS === */
        .auth-link { all: unset; cursor: pointer; font-weight: 600; color: #c41e3a; transition: opacity 0.15s; }
        .auth-link:hover { opacity: 0.7; }

        /* === EMAIL TOGGLE BUTTON === */
        .auth-email-toggle {
          all: unset; width: 100%; box-sizing: border-box;
          display: flex; align-items: center; justify-content: center;
          padding: 13px 0; border-radius: 7px;
          border: 1.5px solid #d5d2cc;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 13px; font-weight: 500; color: #605d58;
          cursor: pointer; transition: all 0.18s; letter-spacing: 0.2px;
        }
        .auth-email-toggle:hover {
          border-color: #1a2744; color: #1a2744;
          background: rgba(26,39,68,0.03);
          transform: translateY(-1px);
        }

        /* === LIVE PULSE === */
        .live-dot { animation: auth-pulse 2s ease-in-out infinite; }
      `}</style>

      {/* ═══ LEFT — dark editorial panel ═══ */}
      <div className="auth-left" style={{
        width: "55%", flexShrink: 0, position: "relative", overflow: "hidden",
        background: "linear-gradient(155deg, #080f1e 0%, #111d36 40%, #1a2744 72%, #0d1828 100%)",
        display: "flex", flexDirection: "column",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateX(0)" : "translateX(-36px)",
        transition: "opacity 0.65s cubic-bezier(0.4,0,0.2,1), transform 0.65s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Radial crimson glow at bottom-center */}
        <div style={{ position: "absolute", bottom: "-10%", left: "50%", transform: "translateX(-50%)", width: "90%", height: "55%", background: "radial-gradient(ellipse at center bottom, rgba(196,30,58,0.14) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }}/>
        {/* Radial blue glow top-right */}
        <div style={{ position: "absolute", top: "-5%", right: "-10%", width: "60%", height: "50%", background: "radial-gradient(ellipse, rgba(26,77,184,0.09) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }}/>

        {/* Blueprint grid */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ position: "absolute", left: `${i*20}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.028)" }}/>)}
          {[1,2,3,4,5].map(i => <div key={i} style={{ position: "absolute", top: `${i*17}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.022)" }}/>)}
        </div>

        {/* Capitol silhouette */}
        <CapitolSilhouette />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", padding: "44px 50px 40px" }}>

          {/* ── Masthead ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 9, background: "linear-gradient(135deg, #c41e3a 0%, #e8394d 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(196,30,58,0.55), inset 0 1px 0 rgba(255,255,255,0.15)", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 21, fontFamily: "'Bebas Neue', sans-serif", lineHeight: 1, letterSpacing: 1 }}>C</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#fff", letterSpacing: 4, lineHeight: 1 }}>CIVLIO</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.35)", letterSpacing: 2.2, textTransform: "uppercase", marginTop: 3 }}>119th Congress · Washington D.C.</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, background: "rgba(196,30,58,0.16)", border: "1px solid rgba(196,30,58,0.38)", borderRadius: 4, padding: "5px 12px" }}>
              <div className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#c41e3a", flexShrink: 0 }}/>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: 1.2 }}>LIVE</span>
            </div>
          </div>

          {/* ── Red rule under masthead ── */}
          <div style={{ marginTop: 28, height: 1, background: "linear-gradient(90deg, #c41e3a 0%, rgba(196,30,58,0.2) 60%, transparent 100%)", transformOrigin: "left", animation: mounted ? "auth-grow-x 0.9s 0.3s cubic-bezier(0.4,0,0.2,1) both" : "none" }}/>

          {/* ── Hero headline ── */}
          <div style={{ marginTop: 44, marginBottom: 32 }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(60px, 6.5vw, 92px)",
              lineHeight: 0.9, color: "#fff", letterSpacing: 1.5,
              textShadow: "0 2px 40px rgba(0,0,0,0.5)",
              animation: mounted ? "auth-in-l 0.75s 0.15s cubic-bezier(0.4,0,0.2,1) both" : "none",
            }}>
              KNOW<br/>
              <span style={{ color: "#c41e3a", textShadow: "0 0 60px rgba(196,30,58,0.4)" }}>YOUR</span><br/>
              CONGRESS
            </div>
            <div style={{
              marginTop: 22,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 13, fontWeight: 300, lineHeight: 1.7,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 330,
              animation: mounted ? "auth-in-l 0.75s 0.25s cubic-bezier(0.4,0,0.2,1) both" : "none",
            }}>
              The complete non-partisan tracker for every bill, vote, member, and court case of the 119th United States Congress.
            </div>
          </div>

          {/* ── Activity ticker ── */}
          <div style={{ marginBottom: 32, animation: mounted ? "auth-in-up 0.7s 0.4s ease both" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.08)" }}/>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.28)", letterSpacing: 2.5, textTransform: "uppercase" }}>Recent Activity</span>
              <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.08)" }}/>
            </div>
            {TICKER.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "6px 0",
                borderBottom: "1px solid rgba(255,255,255,0.055)",
                opacity: 1 - i * 0.14,
                animation: mounted ? `auth-ticker 0.4s ${0.45 + i * 0.06}s ease both` : "none",
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 600,
                  color: item.col, background: item.col + "1a",
                  border: `1px solid ${item.col}45`,
                  padding: "2px 7px", borderRadius: 3, flexShrink: 0, letterSpacing: 0.8,
                }}>{item.tag}</span>
                <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.52)", fontWeight: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* ── Stats grid ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            marginTop: "auto",
            animation: mounted ? "auth-in-up 0.7s 0.55s ease both" : "none",
          }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                padding: "18px 22px",
                borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.065)" : "none",
                borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.065)" : "none",
              }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, lineHeight: 1, letterSpacing: 1, color: s.accent ? "#c41e3a" : "#fff" }}>
                  <Counter target={s.n} suffix={s.suffix} delay={600 + i * 80}/>
                </div>
                <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 10, fontWeight: 400, color: "rgba(255,255,255,0.36)", marginTop: 4, letterSpacing: 0.3 }}>{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ═══ RIGHT — auth form panel ═══ */}
      <div className="auth-right" style={{
        flex: 1, background: "#f8f6f2",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "52px 44px",
        position: "relative",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(22px)",
        transition: "opacity 0.6s 0.18s cubic-bezier(0.4,0,0.2,1), transform 0.6s 0.18s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* All 4 corner marks */}
        <div style={{ position: "absolute", top: 28, left: 28, width: 36, height: 36, borderTop: "1.5px solid rgba(26,39,68,0.18)", borderLeft: "1.5px solid rgba(26,39,68,0.18)" }}/>
        <div style={{ position: "absolute", top: 28, right: 28, width: 36, height: 36, borderTop: "2px solid #c41e3a", borderRight: "2px solid #c41e3a", opacity: 0.55 }}/>
        <div style={{ position: "absolute", bottom: 28, left: 28, width: 36, height: 36, borderBottom: "1.5px solid rgba(26,39,68,0.15)", borderLeft: "1.5px solid rgba(26,39,68,0.15)" }}/>
        <div style={{ position: "absolute", bottom: 28, right: 28, width: 36, height: 36, borderBottom: "1.5px solid rgba(196,30,58,0.2)", borderRight: "1.5px solid rgba(196,30,58,0.2)" }}/>

        {/* Volume annotation */}
        <div style={{ position: "absolute", top: 38, left: "50%", transform: "translateX(-50%)", fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(0,0,0,0.15)", letterSpacing: 2, textTransform: "uppercase" }}>
          Vol. 119 · 2025–2027
        </div>

        <div style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 1 }}>

          {/* ── Form heading ── */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 46, letterSpacing: 2, color: "#111", lineHeight: 0.95, marginBottom: 14 }}>
              {mode === "signin" ? "SIGN IN" : "GET STARTED"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                height: 2.5, background: "#c41e3a", transformOrigin: "left",
                animation: mounted ? "auth-line-in 0.5s 0.3s ease both" : "none",
                width: 28,
              }}/>
              <span style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, fontWeight: 400, color: "#908d88", letterSpacing: 0.2 }}>
                {mode === "signin" ? "Welcome back to Civlio" : "Free — no credit card needed"}
              </span>
            </div>
          </div>

          {/* ── OAuth ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
            <button className="auth-oauth-btn" disabled={!!loading} onClick={() => handleOAuth("google")}
              style={{ flex: 1, background: "#fff", color: "#1a1a1a", border: "1.5px solid #e2dfd9", boxShadow: "0 1px 5px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)" }}>
              {loading === "google" ? <Spinner /> : <GoogleIcon />}
              Google
            </button>
            <button className="auth-oauth-btn" disabled={!!loading} onClick={() => handleOAuth("apple")}
              style={{ flex: 1, background: "#111", color: "#fff", border: "1.5px solid #111", boxShadow: "0 1px 5px rgba(0,0,0,0.18)" }}>
              {loading === "apple" ? <Spinner light /> : <AppleIcon />}
              Apple
            </button>
          </div>

          {/* ── Divider ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
            <div style={{ flex: 1, height: 1, background: "#e0ddd7" }}/>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: "#c0bdb7", letterSpacing: 1.5 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#e0ddd7" }}/>
          </div>

          {/* ── Email toggle / form ── */}
          {!showEmail ? (
            <button className="auth-email-toggle" onClick={() => setShowEmail(true)}>
              Continue with email
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0, animation: "auth-in-up 0.25s ease" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 600, color: "#b5b2ac", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 2 }}>Email</label>
                <div className="auth-inp-wrap">
                  <input className="auth-inp" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleEmail()} autoFocus />
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 600, color: "#b5b2ac", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 2 }}>Password</label>
                <div className="auth-inp-wrap">
                  <input className="auth-inp" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleEmail()} />
                </div>
              </div>

              {error && (
                <div style={{ background: "rgba(196,30,58,0.05)", border: "1px solid rgba(196,30,58,0.22)", borderRadius: 6, padding: "10px 14px", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, color: "#c41e3a", marginBottom: 14, lineHeight: 1.5 }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: "rgba(21,128,61,0.05)", border: "1px solid rgba(21,128,61,0.22)", borderRadius: 6, padding: "10px 14px", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, color: "#15803d", marginBottom: 14, lineHeight: 1.5 }}>
                  {success}
                </div>
              )}

              <button className={`auth-submit ${canSubmit ? "active" : "inactive"}`} disabled={!canSubmit} onClick={handleEmail}>
                {loading === "email" && <Spinner light />}
                {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
              </button>
            </div>
          )}

          {/* ── Mode toggle ── */}
          <div style={{ marginTop: 26, textAlign: "center", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 400, color: "#908d88" }}>
            {mode === "signin" ? "New to Civlio?" : "Already have an account? "}
            <button className="auth-link" onClick={switchMode}>
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </div>

          {/* ── Guest CTA ── */}
          {onContinueAsGuest && (
            <div style={{ marginTop: 34, paddingTop: 26, borderTop: "1px solid #e5e2dc", textAlign: "center" }}>
              <button
                onClick={onContinueAsGuest}
                style={{ all: "unset", cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, fontWeight: 400, color: "#b5b2ac", transition: "color 0.15s", display: "inline-flex", alignItems: "center", gap: 5 }}
                onMouseEnter={e => e.currentTarget.style.color = "#333"}
                onMouseLeave={e => e.currentTarget.style.color = "#b5b2ac"}
              >
                Browse without account
                <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
              </button>
            </div>
          )}

          {/* ── Legal ── */}
          <div style={{ marginTop: 18, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, fontWeight: 300, color: "#c8c5bf", textAlign: "center", lineHeight: 1.7 }}>
            By continuing you agree to Civlio's{" "}
            <span style={{ color: "#908d88", cursor: "pointer" }}>Terms</span> &amp;{" "}
            <span style={{ color: "#908d88", cursor: "pointer" }}>Privacy Policy</span>
          </div>

        </div>
      </div>
    </div>
  );
}
