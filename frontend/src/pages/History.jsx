import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StarBackground from "../components/StarBackground";

const TOOLS = [
  { id: "chat", label: "Chat", icon: "💬", color: "#00d4ff" },
  { id: "summarizer", label: "Summarizer", icon: "📝", color: "#a78bfa" },
  { id: "code", label: "Code Helper", icon: "⌨️", color: "#34d399" },
  { id: "resume", label: "Resume Checker", icon: "📄", color: "#fb923c" },
  { id: "email", label: "Email Writer", icon: "✉️", color: "#60a5fa" },
  { id: "grammar", label: "Grammar Fixer", icon: "✍️", color: "#f472b6" },
];

export default function History() {
  const [summary, setSummary] = useState([]);
  const [activeTool, setActiveTool] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("nexusai_token");

  useEffect(() => { fetchSummary(); }, []);
  useEffect(() => { fetchMessages(activeTool); }, [activeTool]);

  const fetchSummary = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/history", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSummary(data.summary || []);
    } catch {}
  };

  const fetchMessages = async (tool) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/history/${tool}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
    setLoading(false);
  };

  const clearTool = async (tool) => {
    await fetch(`http://localhost:5000/api/history/${tool}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setMessages([]); fetchSummary();
  };

  const tool = TOOLS.find(t => t.id === activeTool);
  const toolSummary = summary.find(s => s.tool === activeTool);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#12171c", fontFamily: "'DM Sans', sans-serif", color: "#fff", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      <StarBackground />

      {/* Sidebar */}
      <div style={{ width: 350, background: "#18181f", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <div style={{ padding: "22px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20 }}>←</button>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 20 }}>History</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "10px" }}>
          {TOOLS.map(t => {
            const s = summary.find(x => x.tool === t.id);
            return (
              <button key={t.id} onClick={() => setActiveTool(t.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: activeTool === t.id ? `${t.color}15` : "transparent", border: `1px solid ${activeTool === t.id ? t.color + "33" : "transparent"}`, borderRadius: 10, cursor: "pointer", marginBottom: 6, transition: "all 0.2s" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, fontSize: 18, background: activeTool === t.id ? `${t.color}22` : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>{t.icon}</div>
                <div style={{ flex: 1, textAlign: "left", fontSize: 15, color: activeTool === t.id ? "#fff" : "rgba(255,255,255,0.65)", fontWeight: 500 }}>{t.label}</div>
                {s?.messageCount > 0 && <div style={{ padding: "3px 9px", borderRadius: 10, background: `${t.color}22`, color: t.color, fontSize: 11, fontWeight: 600 }}>{s.messageCount}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, fontSize: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: tool.color }}>{tool.icon}</div>
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16 }}>{tool.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{toolSummary?.messageCount || 0} messages</div>
            </div>
          </div>
          {messages.length > 0 && <button onClick={() => clearTool(activeTool)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>Clear</button>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }}>Loading...</div>
          ) : messages.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>{tool.icon}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>No history for {tool.label} yet</div>
              <button onClick={() => navigate("/")} style={{ marginTop: 16, padding: "9px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#8a7ea3", borderRadius: 10, cursor: "pointer", fontSize: 15 }}>Start a conversation →</button>
            </div>
          ) : messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 14 }}>
              {msg.role === "assistant" && <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, marginRight: 8, flexShrink: 0, marginTop: 2, color: tool.color }}>✦</div>}
              <div style={{ maxWidth: "70%", background: msg.role === "user" ? "rgba(255, 255, 255, 0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${msg.role === "user" ? "rgba(255, 255, 255, 0.08)" : "rgba(255,255,255,0.04)"}`, borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}