import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    if (!form.email || !form.password) return setError("Email and password are required.");
    if (isSignup && !form.name) return setError("Name is required.");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      localStorage.setItem("nexusai_token", data.token);
      localStorage.setItem("nexusai_userId", data.userId);
      localStorage.setItem("nexusai_name", data.name || form.email.split("@")[0]);
      onLogin(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#121216",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { outline: none; border: none; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .input-field:focus { border-color: rgba(255, 255, 255, 0.15) !important; }
        .submit-btn:hover { background: rgba(255,255,255,0.06); }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 420, padding: "40px",
        background: "#18181f",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 24,
        animation: "fadeIn 0.5s ease", position: "relative", zIndex: 1,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 28,
            color: "#fff",
          }}>NexusAI</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginTop: 4 }}>WORKSPACE</div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
            {isSignup ? "Create account" : "Welcome back"}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {isSignup ? "Join NexusAI and start building" : "Sign in to continue to your workspace"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isSignup && (
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Full Name</div>
              <input className="input-field" name="name" value={form.name} onChange={handle}
                placeholder="Your name"
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 10, color: "#fff", fontSize: 14, transition: "all 0.2s",
                }}
              />
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Email</div>
            <input className="input-field" name="email" value={form.email} onChange={handle}
              placeholder="you@example.com" type="email"
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 10, color: "#fff", fontSize: 14, transition: "all 0.2s",
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Password</div>
            <input className="input-field" name="password" value={form.password} onChange={handle}
              placeholder="••••••••" type="password"
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 10, color: "#fff", fontSize: 14, transition: "all 0.2s",
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: 14, padding: "10px 14px",
            background: "rgba(179,130,153,0.08)", border: "1px solid rgba(179,130,153,0.25)",
            borderRadius: 8, color: "#b38299", fontSize: 13,
          }}>{error}</div>
        )}

        <button className="submit-btn" onClick={submit} disabled={loading} style={{
          width: "100%", marginTop: 20, padding: "14px",
          background: "#768b9e",
          border: "none", borderRadius: 12, color: "#121216",
          fontSize: 15, fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
        }}>
          {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button onClick={() => { setIsSignup(!isSignup); setError(""); }} style={{
            background: "none", border: "none", color: "#768b9e",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>
            {isSignup ? "Sign In" : "Sign Up"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => {
            localStorage.setItem("nexusai_name", "Guest");
            onLogin({ name: "Guest" });
            navigate("/");
          }} style={{
            background: "none", border: "none",
            color: "rgba(255,255,255,0.4)", cursor: "pointer",
            fontSize: 12, textDecoration: "underline",
          }}>Continue as Guest</button>
        </div>
      </div>
    </div>
  );
}