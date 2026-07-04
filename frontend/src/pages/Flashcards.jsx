import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StarBackground from "../components/StarBackground";

export default function Flashcards() {
  const [topic, setTopic] = useState("");
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [known, setKnown] = useState([]);
  const [unknown, setUnknown] = useState([]);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setCards([]); setKnown([]); setUnknown([]);
    setCurrent(0); setFlipped(false); setDone(false);
    try {
      let authToken = localStorage.getItem("nexusai_token");
      if (!authToken) {
        const guestRes = await fetch("http://localhost:5000/api/auth/guest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        const guestData = await guestRes.json();
        authToken = guestData.token;
        localStorage.setItem("nexusai_token", authToken);
      }
      const res = await fetch("http://localhost:5000/api/quiz/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.cards && data.cards.length > 0) setCards(data.cards);
      else console.error("No cards:", data);
    } catch (err) { console.error("Flashcard error:", err.message); }
    setLoading(false);
  };

  const markKnown = () => { setKnown(k => [...k, current]); next(); };
  const markUnknown = () => { setUnknown(u => [...u, current]); next(); };
  const next = () => {
    setFlipped(false);
    setTimeout(() => { if (current + 1 >= cards.length) setDone(true); else setCurrent(c => c + 1); }, 200);
  };
  const restart = () => { setCurrent(0); setFlipped(false); setKnown([]); setUnknown([]); setDone(false); };

  const card = cards[current];
  const progress = cards.length ? (current / cards.length) * 100 : 0;

  return (
    <div style={{ height: "100vh", background: "#16131c", fontFamily: "'DM Sans', sans-serif", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { outline: none; border: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .card-inner { transition: transform 0.5s ease; transform-style: preserve-3d; position: relative; width: 100%; height: 100%; }
        .card-inner.flipped { transform: rotateY(180deg); }
        .card-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .card-back { transform: rotateY(180deg); }
      `}</style>

      <StarBackground />

      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 14, background: "#18181f", flexShrink: 0, position: "relative", zIndex: 1 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20 }}>←</button>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 22 }}>Flashcards</div>
        <div style={{ padding: "4px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, fontSize: 11, color: "#8a7ea3" }}>AI Powered</div>
        {cards.length > 0 && !done && <div style={{ marginLeft: "auto", fontSize: 15, color: "rgba(255,255,255,0.4)" }}>{current + 1} / {cards.length}</div>}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>

          {!cards.length && !loading && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🃏</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 26, marginBottom: 8 }}>Flashcard Generator</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>Enter any topic and AI will create flashcards for you</div>
              </div>
              <div style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "24px" }}>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Topic</div>
                <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()}
                  placeholder="e.g. Photosynthesis, JavaScript promises, French Revolution..."
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, color: "#fff", fontSize: 18, marginBottom: 16 }}
                />
                <button onClick={generate} disabled={!topic.trim()} style={{ width: "100%", padding: "13px", background: topic.trim() ? "#8a7ea3" : "rgba(255,255,255,0.03)", border: "none", borderRadius: 10, color: topic.trim() ? "#121216" : "rgba(255,255,255,0.25)", fontSize: 16, fontWeight: 600, cursor: topic.trim() ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif" }}>
                  🃏 Generate Flashcards
                </button>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                {["Photosynthesis", "React Hooks", "World War II", "Python basics", "Calculus"].map(t => (
                  <button key={t} onClick={() => setTopic(t)} style={{ padding: "7px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, color: "#8a7ea3", cursor: "pointer", fontSize: 14 }}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse 1.5s infinite" }}>🃏</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>Generating flashcards for <strong style={{ color: "#8a7ea3" }}>{topic}</strong>...</div>
            </div>
          )}

          {cards.length > 0 && !done && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14.5, color: "rgba(255,255,255,0.4)" }}>
                  <span>Progress</span>
                  <span style={{ color: "#6e8e7a" }}>✓ {known.length} known</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "#8a7ea3", borderRadius: 4, transition: "width 0.3s" }} />
                </div>
              </div>

              {card && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <div onClick={() => setFlipped(f => !f)} style={{ perspective: "1000px", cursor: "pointer", marginBottom: 24, height: 280 }}>
                    <div className={`card-inner ${flipped ? "flipped" : ""}`}>
                      <div className="card-face" style={{ background: "#18181f", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 20, padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                        <div style={{ fontSize: 13, color: "#8a7ea3", letterSpacing: 2, marginBottom: 16, fontWeight: 600 }}>QUESTION</div>
                        <div style={{ fontSize: 23, fontWeight: 600, lineHeight: 1.5, color: "#fff" }}>{card.front}</div>
                        <div style={{ position: "absolute", bottom: 16, fontSize: 13.5, color: "rgba(255,255,255,0.3)" }}>Click to reveal answer</div>
                      </div>
                      <div className="card-face card-back" style={{ background: "#18181f", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 20, padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                        <div style={{ fontSize: 13, color: "#6e8e7a", letterSpacing: 2, marginBottom: 16, fontWeight: 600 }}>ANSWER</div>
                        <div style={{ fontSize: 20, lineHeight: 1.6, color: "#fff" }}>{card.back}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={markUnknown} style={{ flex: 1, padding: "14px", background: "rgba(179,130,153,0.08)", border: "1px solid rgba(179,130,153,0.25)", borderRadius: 12, color: "#b38299", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✗ Still Learning</button>
                    <button onClick={markKnown} style={{ flex: 1, padding: "14px", background: "rgba(110,142,122,0.08)", border: "1px solid rgba(110,142,122,0.25)", borderRadius: 12, color: "#6e8e7a", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✓ Got It!</button>
                  </div>
                  <div style={{ textAlign: "center", marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.3)" }}>Click the card to flip it</div>
                </div>
              )}
            </>
          )}

          {done && (
            <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>{known.length >= cards.length * 0.7 ? "🎉" : "📚"}</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 24, marginBottom: 8 }}>{known.length >= cards.length * 0.7 ? "Great job!" : "Keep practicing!"}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 28 }}>You knew {known.length} out of {cards.length} cards</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16 }}>
                <div style={{ padding: "16px 24px", background: "rgba(110,142,122,0.08)", border: "1px solid rgba(110,142,122,0.25)", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#6e8e7a" }}>{known.length}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Known</div>
                </div>
                <div style={{ padding: "16px 24px", background: "rgba(179,130,153,0.08)", border: "1px solid rgba(179,130,153,0.25)", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#b38299" }}>{unknown.length}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Still Learning</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={restart} style={{ flex: 1, padding: "13px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>↩ Restart</button>
                <button onClick={() => { setCards([]); setTopic(""); setDone(false); }} style={{ flex: 1, padding: "13px", background: "#8a7ea3", border: "none", borderRadius: 12, color: "#121216", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🃏 New Topic</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}