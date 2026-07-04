import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initSession, sendMessage, loadHistory } from "../services/api";
import StarBackground from "./StarBackground";

const TOOLS = [
  { id: "chat", label: "Chat", icon: "💬", color: "#7a8c99", desc: "General AI conversation" },
  { id: "summarizer", label: "Summarizer", icon: "📝", color: "#8a7ea3", desc: "Condense any text" },
  { id: "code", label: "Code Helper", icon: "⌨️", color: "#728c7b", desc: "Write, debug & explain code" },
  { id: "resume", label: "Resume Checker", icon: "📄", color: "#b58c70", desc: "ATS-ready feedback" },
  { id: "email", label: "Email Writer", icon: "✉️", color: "#768b9e", desc: "Write professional emails" },
  { id: "grammar", label: "Grammar Fixer", icon: "✍️", color: "#b38299", desc: "Fix & improve your writing" },
];

const NAV_LINKS = [
  { label: "🗒️ My Notes", path: "/notes" },
  { label: "⚡ Quiz Generator", path: "/quiz" },
  { label: "🃏 Flashcards", path: "/flashcards" },
  { label: "🔆 Highlighter", path: "/highlight" },
  { label: "📜 History", path: "/history" },
];

const BG_COLORS = {
  chat: "#12171c",
  summarizer: "#16131c",
  code: "#111814",
  resume: "#1a1511",
  email: "#12171c",
  grammar: "#1c1316",
};

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%", background: "#a78bfa",
          animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

function Message({ msg, toolColor }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16 }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `${toolColor}15`,
          border: `1px solid ${toolColor}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, marginRight: 10, flexShrink: 0, marginTop: 2,
          color: toolColor,
        }}>✦</div>
      )}
      <div style={{
        maxWidth: "75%",
        background: isUser ? `${toolColor}12` : "rgba(255, 255, 255, 0.02)",
        border: `1px solid ${isUser ? toolColor + "33" : "rgba(255, 255, 255, 0.04)"}`,
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "12px 16px", color: "#e8e8f0", fontSize: 18, lineHeight: 1.7,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        position: "relative",
        paddingRight: !isUser ? "36px" : "16px",
      }}>
        {msg.content}
        {!isUser && (
          <button onClick={copy} title="Copy reply" style={{
            position: "absolute", right: 8, top: 8,
            background: "none", border: "none", cursor: "pointer",
            color: copied ? "#34d399" : "rgba(255, 255, 255, 0.25)",
            fontSize: 13, transition: "color 0.2s",
            padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {copied ? "✓" : "📋"}
          </button>
        )}
      </div>
    </div>
  );
}

function getStarters(toolId) {
  const map = {
    chat: ["What is quantum computing?", "Write a haiku about space", "Explain React hooks"],
    summarizer: ["Summarize the theory of relativity", "Key points from a long article...", "TL;DR this for me"],
    code: ["Write a REST API in Node.js", "Debug this Python error...", "Explain async/await"],
    resume: ["Review my resume for a tech job", "Make my bullet points stronger", "ATS score my resume"],
    email: ["Write a follow-up email after interview", "Email to ask for a raise", "Cold outreach to a recruiter"],
    grammar: ["Fix grammar in my essay", "Make this sound more professional", "Simplify this paragraph"],
  };
  return map[toolId] || [];
}

export default function AIWorkspace({ user, onLogout }) {
  const [activeTool, setActiveTool] = useState("chat");
  const [histories, setHistories] = useState({
    chat: [], summarizer: [], code: [], resume: [], email: [], grammar: [],
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const tool = TOOLS.find(t => t.id === activeTool);
  const messages = histories[activeTool];

  useEffect(() => { initSession().catch(console.error); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newHistory = [...messages, userMsg];
    setHistories(h => ({ ...h, [activeTool]: newHistory }));
    setInput("");
    setLoading(true);
    try {
      const data = await sendMessage(activeTool, input.trim());
      setHistories(h => ({ ...h, [activeTool]: [...newHistory, { role: "assistant", content: data.reply }] }));
    } catch (err) {
      setHistories(h => ({ ...h, [activeTool]: [...newHistory, { role: "assistant", content: err.message || "Error." }] }));
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const clearChat = () => setHistories(h => ({ ...h, [activeTool]: [] }));
  const handleToolSwitch = async (toolId) => {
    setActiveTool(toolId);
    try {
      const { messages: saved } = await loadHistory(toolId);
      setHistories(h => ({ ...h, [toolId]: saved }));
    } catch {}
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: BG_COLORS[activeTool] || "#121216", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", position: "relative", transition: "background 0.3s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        textarea { resize: none; outline: none; border: none; }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        .tool-btn:hover { background: rgba(255,255,255,0.04) !important; }
        .nav-btn:hover { background: rgba(255,255,255,0.05) !important; color: #fff !important; }
      `}</style>

      <StarBackground />

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 350 : 100,
        background: "#18181f",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column",
        transition: "width 0.3s ease", flexShrink: 0, overflow: "hidden",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          padding: sidebarOpen ? "22px 20px" : "22px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center",
          justifyContent: sidebarOpen ? "space-between" : "center",
        }}>
          {sidebarOpen && (
            <div>
              <div style={{
                fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22,
                background: `linear-gradient(135deg, #fff, ${tool.color})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>NexusAI</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginTop: 2 }}>WORKSPACE</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20, padding: 4 }}>
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

        {sidebarOpen && user?.name && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${tool.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: tool.color }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>● Active</div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 10px" }}>
            {sidebarOpen && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", padding: "4px 8px 8px", letterSpacing: 1.5, fontWeight: 600 }}>AI TOOLS</div>}
            {TOOLS.map(t => (
              <button key={t.id} className="tool-btn" onClick={() => handleToolSwitch(t.id)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: sidebarOpen ? "10px 12px" : "12px",
                justifyContent: sidebarOpen ? "flex-start" : "center",
                background: activeTool === t.id ? `${t.color}18` : "transparent",
                border: `1px solid ${activeTool === t.id ? t.color + "44" : "transparent"}`,
                borderRadius: 10, cursor: "pointer", transition: "all 0.2s", color: "#fff", width: "100%", marginBottom: 4,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, fontSize: 18, flexShrink: 0, background: activeTool === t.id ? `${t.color}30` : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>{t.icon}</div>
                {sidebarOpen && (
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 16, fontWeight: 500, color: activeTool === t.id ? "#fff" : "rgba(255,255,255,0.7)" }}>{t.label}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{t.desc}</div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {sidebarOpen && (
            <div style={{ padding: "0 10px 10px" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", padding: "4px 8px 8px", letterSpacing: 1.5, fontWeight: 600 }}>PAGES</div>
              {NAV_LINKS.map(item => (
                <button key={item.path} className="nav-btn" onClick={() => navigate(item.path)} style={{
                  width: "100%", padding: "11px 14px", marginBottom: 6,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, color: "rgba(255,255,255,0.65)", cursor: "pointer",
                  fontSize: 16, textAlign: "left", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
                }}>{item.label}</button>
              ))}
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={onLogout} style={{
              width: "100%", padding: "11px", background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, color: "#f87171",
              cursor: "pointer", fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
            }}>Sign Out</button>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#18181f",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, fontSize: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: tool.color }}>{tool.icon}</div>
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 20, color: "#fff" }}>{tool.label}</div>
              <div style={{ fontSize: 14.5, color: "rgba(255,255,255,0.4)" }}>{tool.desc}</div>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "6px 14px", borderRadius: 8, fontSize: 14 }}>Clear</button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {messages.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, fontSize: 36, marginBottom: 20, background: `${tool.color}15`, border: `1px solid ${tool.color}33`, display: "flex", alignItems: "center", justifyContent: "center", color: tool.color }}>{tool.icon}</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 25, color: "#fff", marginBottom: 8 }}>{tool.label}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 16.5, maxWidth: 320, lineHeight: 1.6, marginBottom: 28 }}>{tool.desc}. Type below to get started.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 480 }}>
                {getStarters(activeTool).map((s, i) => (
                  <button key={i} onClick={() => setInput(s)} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${tool.color}25`, color: "rgba(255,255,255,0.7)", borderRadius: 20, padding: "7px 14px", fontSize: 14, cursor: "pointer" }}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <Message key={i} msg={msg} toolColor={tool.color} />)}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${tool.color}15`, border: `1px solid ${tool.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: tool.color }}>✦</div>
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div style={{ padding: "16px 24px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "transparent" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(255,255,255,0.01)", border: `1px solid ${input ? tool.color + "33" : "rgba(255,255,255,0.06)"}`, borderRadius: 16, padding: "14px 20px" }}>
            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder={`Message ${tool.label}...`} disabled={loading} rows={1}
              style={{ flex: 1, background: "transparent", color: "#e8e8f0", fontSize: 19, lineHeight: 1.6, caretColor: tool.color, fontFamily: "'DM Sans', sans-serif", minHeight: 32, maxHeight: 200, paddingTop: 4 }}
            />
            <button onClick={send} disabled={!input.trim() || loading} style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: input.trim() && !loading ? tool.color : "rgba(255,255,255,0.03)",
              border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: input.trim() && !loading ? "#121216" : "rgba(255,255,255,0.25)", transition: "all 0.2s",
            }}>↑</button>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8, textAlign: "center" }}>Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  );
}