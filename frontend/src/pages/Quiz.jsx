import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StarBackground from "../components/StarBackground";

export default function Quiz() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem("nexusai_token");

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setLoading(true); setQuiz(null); setAnswers({}); setSubmitted(false); setScore(0);
    try {
      const res = await fetch("http://localhost:5000/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, difficulty, count }),
      });
      const data = await res.json();
      if (data.quiz) {
        setQuiz({ ...data.quiz, questions: data.quiz.questions.map(q => ({ ...q, correct: Number(q.correct) })) });
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const submit = () => {
    if (Object.keys(answers).length === 0) return;
    let correct = 0;
    quiz.questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
    setScore(correct); setSubmitted(true);
  };

  const getOptionStyle = (qi, oi, correct) => {
    const isSelected = answers[qi] === oi;
    if (!submitted) return { bg: isSelected ? "rgba(138, 126, 163, 0.12)" : "rgba(255,255,255,0.03)", border: isSelected ? "rgba(138, 126, 163, 0.35)" : "rgba(255,255,255,0.06)", color: isSelected ? "#fff" : "rgba(255,255,255,0.7)", icon: isSelected ? "●" : "○" };
    if (oi === correct) return { bg: "rgba(110, 142, 122, 0.12)", border: "rgba(110, 142, 122, 0.35)", color: "#6e8e7a", icon: "✓" };
    if (isSelected) return { bg: "rgba(179, 130, 153, 0.12)", border: "rgba(179, 130, 153, 0.35)", color: "#b38299", icon: "✗" };
    return { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", icon: "○" };
  };

  const COLORS = { easy: "#6e8e7a", medium: "#b58c70", hard: "#b38299" };
  const percent = quiz ? Math.round((score / quiz.questions.length) * 100) : 0;
  const grade = percent >= 90 ? "🏆 Excellent!" : percent >= 70 ? "🎉 Good Job!" : percent >= 50 ? "📚 Keep Practicing!" : "💪 Try Again!";

  return (
    <div style={{ height: "100vh", background: "#1a1511", fontFamily: "'DM Sans', sans-serif", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { outline: none; border: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes scoreIn { from { transform:scale(0.8); opacity:0; } to { transform:scale(1); opacity:1; } }
        .option-btn { transition: all 0.2s ease !important; }
        .option-btn:hover:not(:disabled) { transform: translateX(6px) !important; }
      `}</style>

      <StarBackground />

      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 14, background: "#18181f", flexShrink: 0, position: "relative", zIndex: 1 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20 }}>←</button>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 20 }}>Quiz Generator</div>
        <div style={{ padding: "4px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, fontSize: 11, color: "#b58c70" }}>AI Powered</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "24px", marginBottom: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Topic</div>
                <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generateQuiz()}
                  placeholder="e.g. React hooks, World War II, Python basics..."
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, color: "#fff", fontSize: 18 }}
                />
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Difficulty</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["easy", "medium", "hard"].map(d => (
                      <button key={d} onClick={() => setDifficulty(d)} style={{ flex: 1, padding: "9px", background: difficulty === d ? `${COLORS[d]}15` : "rgba(255,255,255,0.02)", border: `1px solid ${difficulty === d ? COLORS[d] + "77" : "rgba(255,255,255,0.05)"}`, borderRadius: 8, color: difficulty === d ? COLORS[d] : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14, fontWeight: 600, textTransform: "capitalize", transition: "all 0.2s" }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Questions: <span style={{ color: "#b58c70", fontWeight: 600 }}>{count}</span></div>
                  <input type="range" min="3" max="10" value={count} onChange={e => setCount(Number(e.target.value))} style={{ width: "100%", accentColor: "#b58c70" }} />
                </div>
              </div>
              <button onClick={generateQuiz} disabled={loading || !topic.trim()} style={{ padding: "13px", background: topic.trim() && !loading ? "#b58c70" : "rgba(255,255,255,0.03)", border: "none", borderRadius: 10, color: topic.trim() && !loading ? "#121216" : "rgba(255,255,255,0.25)", fontSize: 16, fontWeight: 600, cursor: topic.trim() && !loading ? "pointer" : "default", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" }}>
                {loading ? "⏳ Generating..." : "⚡ Generate Quiz"}
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)" }}>
               <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse 1.5s infinite" }}>🧠</div>
               <div>Creating <strong style={{ color: "#b58c70" }}>{count} questions</strong> about <strong style={{ color: "#b58c70" }}>{topic}</strong>...</div>
            </div>
          )}

          {submitted && (
            <div style={{ background: percent >= 70 ? "rgba(110, 142, 122, 0.1)" : "rgba(181, 140, 112, 0.1)", border: `1px solid ${percent >= 70 ? "rgba(110, 142, 122, 0.25)" : "rgba(181, 140, 112, 0.25)"}`, borderRadius: 16, padding: "28px", marginBottom: 24, textAlign: "center", animation: "scoreIn 0.5s ease" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{grade}</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 56, color: percent >= 70 ? "#6e8e7a" : "#b58c70" }}>{percent}%</div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{score} out of {quiz.questions.length} correct</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                {quiz.questions.map((q, i) => (
                  <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: answers[i] === q.correct ? "rgba(110, 142, 122, 0.12)" : "rgba(179, 130, 153, 0.12)", border: `1px solid ${answers[i] === q.correct ? "#6e8e7a" : "#b38299"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: answers[i] === q.correct ? "#6e8e7a" : "#b38299" }}>
                    {answers[i] === q.correct ? "✓" : "✗"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {quiz && !loading && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              {!submitted && (
                <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 20 }}>{quiz.title}</div>
                  <div style={{ padding: "6px 14px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 14, color: "#b58c70", fontWeight: 600 }}>{Object.keys(answers).length}/{quiz.questions.length} answered</div>
                </div>
              )}

              {quiz.questions.map((q, qi) => (
                <div key={qi} style={{ background: "#18181f", border: submitted ? `1px solid ${answers[qi] === q.correct ? "rgba(110, 142, 122, 0.25)" : "rgba(179, 130, 153, 0.25)"}` : "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "20px", marginBottom: 16, transition: "border-color 0.3s" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,0.03)", border: `1px solid ${submitted ? answers[qi] === q.correct ? "#6e8e7a" : "#b38299" : "#b58c70"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: submitted ? answers[qi] === q.correct ? "#6e8e7a" : "#b38299" : "#b58c70" }}>{qi + 1}</div>
                    <div style={{ fontSize: 16.5, fontWeight: 500, lineHeight: 1.6, color: "#fff" }}>{q.question}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 40 }}>
                    {q.options.map((opt, oi) => {
                      const s = getOptionStyle(qi, oi, q.correct);
                      return (
                        <button key={oi} className="option-btn" disabled={submitted} onClick={() => !submitted && setAnswers(p => ({ ...p, [qi]: oi }))}
                          style={{ padding: "11px 16px", textAlign: "left", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, color: s.color, fontSize: 16, cursor: submitted ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                          <span style={{ flex: 1 }}>{opt}</span>
                          {submitted && oi === q.correct && <span style={{ fontSize: 11, color: "#6e8e7a", fontWeight: 700, background: "rgba(110, 142, 122, 0.12)", padding: "2px 8px", borderRadius: 10 }}>CORRECT</span>}
                          {submitted && answers[qi] === oi && oi !== q.correct && <span style={{ fontSize: 11, color: "#b38299", fontWeight: 700, background: "rgba(179, 130, 153, 0.12)", padding: "2px 8px", borderRadius: 10 }}>YOUR ANSWER</span>}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && q.explanation && (
                    <div style={{ marginTop: 14, marginLeft: 40, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${answers[qi] === q.correct ? "#6e8e7a" : "#b58c70"}`, borderRadius: "0 8px 8px 0", fontSize: 14.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      💡 <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}

              {!submitted ? (
                <button onClick={submit} disabled={Object.keys(answers).length === 0} style={{ width: "100%", padding: "15px", background: Object.keys(answers).length > 0 ? "#b58c70" : "rgba(255,255,255,0.03)", border: "none", borderRadius: 12, color: Object.keys(answers).length > 0 ? "#121216" : "rgba(255,255,255,0.25)", fontSize: 16, fontWeight: 600, cursor: Object.keys(answers).length > 0 ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif", marginBottom: 32 }}>
                  Submit Quiz — {Object.keys(answers).length}/{quiz.questions.length} answered
                </button>
              ) : (
                <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
                  <button onClick={() => { setQuiz(null); setTopic(""); setAnswers({}); setSubmitted(false); setScore(0); }} style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>🔄 New Quiz</button>
                  <button onClick={() => { setAnswers({}); setSubmitted(false); setScore(0); }} style={{ flex: 1, padding: "14px", background: "#b58c70", border: "none", borderRadius: 12, color: "#121216", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>↩ Retry Same Quiz</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}