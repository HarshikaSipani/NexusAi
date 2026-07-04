import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { sendMessage } from "../services/api";

const HIGHLIGHT_COLORS = {
  fact:       { bg: "rgba(181, 140, 112, 0.2)", border: "#b58c70", label: "Key Fact",    dot: "#b58c70", text: "#fef3c7" },
  action:     { bg: "rgba(110, 142, 122, 0.2)", border: "#6e8e7a", label: "Action Item", dot: "#6e8e7a", text: "#d1fae5" },
  warning:    { bg: "rgba(179, 130, 153, 0.2)", border: "#b38299", label: "Warning",     dot: "#b38299", text: "#fee2e2" },
  definition: { bg: "rgba(138, 126, 163, 0.2)", border: "#8a7ea3", label: "Definition",  dot: "#8a7ea3", text: "#ede9fe" },
  number:     { bg: "rgba(118, 139, 158, 0.2)", border: "#768b9e", label: "Number/Date", dot: "#768b9e", text: "#dbeafe" },
};

const HIGHLIGHT_PROMPT = `You MUST use ALL 5 of these mark types on the text below:
- <mark type="fact"> = key facts and important statements
- <mark type="action"> = action items, tasks, things to do
- <mark type="warning"> = warnings, risks, penalties, cautions
- <mark type="definition"> = definitions, explanations of terms
- <mark type="number"> = any number, date, %, $ amount
Be generous, highlight as much as possible. Return ONLY the full marked-up text, no explanation.


`;

// Cleans up common ways the AI might mangle the response
function cleanReply(raw) {
  let text = raw.trim();

  // Strip markdown code fences: ```html ... ``` or ``` ... ```
  text = text.replace(/^```[\w]*\n?/i, "").replace(/\n?```$/i, "").trim();

  // Unescape HTML entities the model might have escaped
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Some models wrap output in <response>...</response> or <output>...</output>
  text = text.replace(/^<(?:response|output|result)>/i, "").replace(/<\/(?:response|output|result)>$/i, "").trim();

  return text;
}

// Extracts reply text from various API response shapes
function extractReply(data) {
  // Try common field names
  const raw =
    data?.reply ||
    data?.message ||
    data?.response ||
    data?.text ||
    data?.content ||
    data?.choices?.[0]?.message?.content ||  // OpenAI-style
    data?.candidates?.[0]?.content?.parts?.[0]?.text || // Gemini-style
    "";

  return typeof raw === "string" ? raw : JSON.stringify(raw);
}

function renderHighlighted(text) {
  const parts = [];
  const regex = /<mark type="(\w+)">([\s\S]*?)<\/mark>/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={`text-${last}`}>{text.slice(last, match.index)}</span>);
    }
    const type = match[1];
    const content = match[2];
    const style = HIGHLIGHT_COLORS[type] || HIGHLIGHT_COLORS.fact;
    parts.push(
      <mark key={`mark-${match.index}`} title={style.label} style={{
        background: style.bg,
        borderBottom: `2px solid ${style.border}`,
        borderRadius: 4,
        padding: "2px 4px",
        color: style.text,
        fontStyle: "inherit",
        display: "inline",
      }}>{content}</mark>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key="text-end">{text.slice(last)}</span>);
  return parts;
}

// Fallback: basic rule-based highlighting if AI fails
function autoHighlight(text) {
  return text
    .replace(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}|\d+%|\$[\d,.]+|\b\d+\b)\b/g,
      '<mark type="number">$1</mark>')
    .replace(/\b([A-Z]{3,})\b/g, '<mark type="warning">$1</mark>')
    .replace(/(Note|Warning|Important|IMPORTANT|NOTE|WARNING):([^\n.]+)/g,
      '<mark type="warning">$1:$2</mark>');
}

const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const MAX_INPUT_LENGTH = 5000;

export default function Highlighter() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const readFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (e) => setInput(e.target.result);
      reader.readAsText(file);
      return;
    }
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setInput("Reading PDF... please wait...");
      loadPdfJs().then(async (pdfjsLib) => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(" ");
            fullText += pageText + "\n";
          }
          setInput(fullText.trim() || "Empty PDF or could not extract text.");
        } catch (err) {
          console.error(err);
          setInput("Error parsing PDF. Please paste the text manually.");
        }
      }).catch((err) => {
        console.error(err);
        setInput("Failed to load PDF parser. Please paste the text manually.");
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setInput(e.target.result);
    reader.onerror = () => setInput("Could not read file. Please paste the text manually.");
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    readFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!input.trim()) return;

    if (input.trim().length > MAX_INPUT_LENGTH) {
      setError(`Document too long (${input.trim().length} chars). Please paste a shorter excerpt under ${MAX_INPUT_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    setResult("");
    setError("");

    try {
      const fullMessage = HIGHLIGHT_PROMPT + input.trim();

      console.log("Sending message, length:", fullMessage.length);

      let data;
      try {
        data = await sendMessage("highlight", fullMessage);
      } catch (err) {
        // Surface the real error message instead of generic fallback
        console.error("sendMessage threw:", err.message, err);
        setError(`API error: ${err.message} — showing rule-based highlights instead.`);
        setResult(autoHighlight(input.trim()));
        setLoading(false);
        return;
      }

      // Log full data shape for debugging
      console.log("Raw API data:", data);

      const rawReply = extractReply(data);
      console.log("Extracted reply (first 300 chars):", rawReply.slice(0, 300));

      const reply = cleanReply(rawReply);
      console.log("Cleaned reply (first 300 chars):", reply.slice(0, 300));

      if (!reply || !reply.includes("<mark")) {
        console.warn("No <mark> tags found in reply. Falling back to rule-based highlighting.");
        setError("AI did not return highlights — showing rule-based highlights instead.");
        setResult(autoHighlight(input.trim()));
      } else {
        setResult(reply);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(`Unexpected error: ${err.message}`);
      setResult(autoHighlight(input.trim()));
    }

    setLoading(false);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const counts = Object.keys(HIGHLIGHT_COLORS).reduce((acc, type) => {
    acc[type] = (result.match(new RegExp(`<mark type="${type}">`, "g")) || []).length;
    return acc;
  }, {});
  const totalHighlights = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{
      height: "100vh", background: "#1a1511",
      fontFamily: "'DM Sans', sans-serif", color: "#fff",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea { outline: none; border: none; resize: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .analyze-btn:hover:not(:disabled) { background: rgba(255,255,255,0.06); }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#18181f", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20 }}>←</button>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 20 }}>Doc Highlighter</div>
          <div style={{ padding: "4px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, fontSize: 11, color: "#b58c70" }}>AI Powered</div>
        </div>
        {totalHighlights > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(counts).map(([type, c]) => c > 0 && (
              <div key={type} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20,
                background: HIGHLIGHT_COLORS[type].bg,
                border: `1px solid ${HIGHLIGHT_COLORS[type].border}`,
                fontSize: 11, color: HIGHLIGHT_COLORS[type].dot,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: HIGHLIGHT_COLORS[type].dot }} />
                {c} {HIGHLIGHT_COLORS[type].label}{c > 1 ? "s" : ""}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left panel — input */}
        <div style={{
          width: result ? "42%" : "100%",
          display: "flex", flexDirection: "column",
          borderRight: result ? "1px solid rgba(255,255,255,0.05)" : "none",
          transition: "width 0.35s ease",
        }}>
          {/* Toolbar */}
          <div style={{
            padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
              {fileName ? `📄 ${fileName}` : "📄 PASTE OR UPLOAD TEXT"}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
                {input.split(/\s+/).filter(Boolean).length} words
              </span>
              {input.trim().length > MAX_INPUT_LENGTH && (
                <span style={{ fontSize: 13, color: "#f47373" }}>
                  ⚠ Too long ({input.trim().length}/{MAX_INPUT_LENGTH})
                </span>
              )}
              <button onClick={() => fileInputRef.current.click()} style={{
                padding: "5px 12px", background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8,
                color: "#fbbf24", cursor: "pointer", fontSize: 14, fontWeight: 500,
              }}>Uploader</button>
              <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf,.csv"
                onChange={e => readFile(e.target.files[0])} style={{ display: "none" }} />
            </div>
          </div>

          {/* Textarea */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            style={{
              flex: 1, position: "relative",
              border: dragging ? "2px dashed #fbbf24" : "2px dashed transparent",
              background: dragging ? "rgba(251,191,36,0.04)" : "transparent",
              transition: "all 0.2s",
            }}
          >
            {!input && !dragging && (
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center",
                pointerEvents: "none", gap: 10,
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 18,
                  background: "rgba(251,191,36,0.08)",
                  border: "2px dashed rgba(251,191,36,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
                }}>📄</div>
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>Drag & drop or paste text below</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>.txt · .md · .pdf · .csv</div>
              </div>
            )}
            {dragging && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 10,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>📄</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fbbf24" }}>Drop your file here</div>
              </div>
            )}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder=""
              style={{
                width: "100%", height: "100%", padding: "20px",
                background: "transparent", color: "rgba(255,255,255,0.8)",
                fontSize: 19, lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>

          {/* Action row */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10 }}>
            {input && (
              <button onClick={() => { setInput(""); setResult(""); setFileName(""); setError(""); }}
                style={{
                  padding: "11px 16px", background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 15,
                }}>Clear</button>
            )}
            <button
              className="analyze-btn"
              onClick={analyze}
              disabled={loading || !input.trim() || input.trim().length > MAX_INPUT_LENGTH}
              style={{
                flex: 1, padding: "12px",
                background: input.trim() && !loading && input.trim().length <= MAX_INPUT_LENGTH
                  ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                  : "rgba(255,255,255,0.05)",
                border: "none", borderRadius: 10,
                color: input.trim() && !loading && input.trim().length <= MAX_INPUT_LENGTH
                  ? "#000" : "rgba(255,255,255,0.3)",
                fontSize: 16, fontWeight: 700, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              }}>
              {loading
                ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ width: 14, height: 14, border: "2px solid #00000033", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    Analyzing...
                  </span>
                : "🔆 Highlight Document"}
            </button>
          </div>

          {error && (
            <div style={{ margin: "0 20px 14px", padding: "10px 14px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 8, fontSize: 12, color: "#fbbf24" }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Right panel — results */}
        {(result || loading) && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "fadeIn 0.4s ease" }}>
            <div style={{
              padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                ✨ HIGHLIGHTED RESULT
                {totalHighlights > 0 && <span style={{ marginLeft: 8, color: "#fbbf24" }}>{totalHighlights} highlights</span>}
              </div>
              {result && (
                <button onClick={copyResult} style={{
                  padding: "5px 12px",
                  background: copied ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${copied ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8, color: copied ? "#34d399" : "rgba(255,255,255,0.6)",
                  cursor: "pointer", fontSize: 14, transition: "all 0.2s",
                }}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.4)" }}>
                  <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse 1.5s infinite" }}>🔍</div>
                  <div>Analyzing your document...</div>
                </div>
              ) : (
                <div>
                  {/* Legend */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                    {Object.entries(HIGHLIGHT_COLORS).map(([type, style]) => (
                      <div key={type} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 12px", borderRadius: 20,
                        background: style.bg, border: `1px solid ${style.border}`,
                        fontSize: 14, color: style.dot, fontWeight: 500,
                      }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: style.dot }} />
                        {style.label}
                      </div>
                    ))}
                  </div>

                  {/* Highlighted text */}
                  <div style={{
                    fontSize: 16, lineHeight: 2.1,
                    color: "rgba(255,255,255,0.8)",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {renderHighlighted(result)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
