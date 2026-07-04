import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StarBackground from "../components/StarBackground";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("nexusai_token");

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notes", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {}
  };

  const saveNote = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const url = activeNote ? `http://localhost:5000/api/notes/${activeNote._id}` : "http://localhost:5000/api/notes";
      const res = await fetch(url, {
        method: activeNote ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!activeNote) setActiveNote(data.note);
      fetchNotes();
    } catch {}
    setSaving(false);
  };

  const deleteNote = async (id) => {
    await fetch(`http://localhost:5000/api/notes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setActiveNote(null); setTitle(""); setContent(""); fetchNotes();
  };

  const exportNote = (format) => {
    const element = document.createElement("a");
    let fileContent = "";
    let mimeType = "text/plain";
    let extension = format;
    
    if (format === "md") {
      fileContent = `# ${title || "Untitled"}\n\n${content}`;
      mimeType = "text/markdown";
    } else {
      fileContent = `TITLE: ${title || "Untitled"}\n====================\n\n${content}`;
      mimeType = "text/plain";
    }
    
    const file = new Blob([fileContent], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = `${(title || "Untitled").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${extension}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#16131c", fontFamily: "'DM Sans', sans-serif", color: "#fff", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        input, textarea { outline: none; border: none; }
        .note-item:hover { background: rgba(255,255,255,0.04) !important; }
        .export-opt:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      <StarBackground />

      {/* Sidebar */}
      <div style={{ width: 380, background: "#18181f", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <div style={{ padding: "22px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20 }}>←</button>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 22 }}>My Notes</div>
            </div>
            <button onClick={() => { setActiveNote(null); setTitle(""); setContent(""); }} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#8a7ea3", borderRadius: 8, padding: "8px 14px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}>+ New</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
            style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, color: "#fff", fontSize: 16 }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 16 }}>
              {search ? "No notes found" : "No notes yet. Create one!"}
            </div>
          ) : filtered.map(note => (
            <div key={note._id} className="note-item"
              onClick={() => { setActiveNote(note); setTitle(note.title); setContent(note.content); }}
              style={{ padding: "14px", borderRadius: 10, cursor: "pointer", background: activeNote?._id === note._id ? "rgba(255, 255, 255, 0.04)" : "transparent", border: `1px solid ${activeNote?._id === note._id ? "rgba(255, 255, 255, 0.08)" : "transparent"}`, marginBottom: 6, transition: "all 0.2s" }}>
              <div style={{ fontSize: 16.5, fontWeight: 500, marginBottom: 4 }}>{note.title || "Untitled"}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.content || "No content"}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>{new Date(note.updatedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent" }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..."
            style={{ background: "none", color: "#fff", fontSize: 22, fontWeight: 600, fontFamily: "Syne, sans-serif", flex: 1, marginRight: 16 }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {activeNote && (
              <button onClick={() => deleteNote(activeNote._id)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", borderRadius: 8, padding: "7px 14px", fontSize: 14, cursor: "pointer" }}>Delete</button>
            )}
            {content.trim() && (
              <div style={{ position: "relative", display: "inline-block" }}>
                <button onClick={() => setShowExport(!showExport)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#8a7ea3", borderRadius: 8, padding: "7px 14px", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  📤 Export
                </button>
                {showExport && (
                  <div style={{ position: "absolute", right: 0, marginTop: 6, background: "#18181f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", zIndex: 10, width: 130, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                    <button onClick={() => { exportNote("md"); setShowExport(false); }} style={{ width: "100%", padding: "8px 12px", background: "none", border: "none", color: "#fff", fontSize: 12, textAlign: "left", cursor: "pointer", transition: "background 0.2s" }} className="export-opt">Markdown (.md)</button>
                    <button onClick={() => { exportNote("txt"); setShowExport(false); }} style={{ width: "100%", padding: "8px 12px", background: "none", border: "none", color: "#fff", fontSize: 12, textAlign: "left", cursor: "pointer", transition: "background 0.2s" }} className="export-opt">Text (.txt)</button>
                  </div>
                )}
              </div>
            )}
            <button onClick={saveNote} disabled={saving} style={{ background: "#8a7ea3", border: "none", color: "#121216", borderRadius: 8, padding: "7px 16px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              {saving ? "Saving..." : activeNote ? "Update" : "Save"}
            </button>
          </div>
        </div>
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Start writing your note here..."
          style={{ flex: 1, padding: "24px", background: "transparent", color: "rgba(255,255,255,0.85)", fontSize: 19, lineHeight: 1.8, resize: "none", fontFamily: "'DM Sans', sans-serif" }}
        />
        <div style={{ padding: "8px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,0.25)", background: "transparent" }}>
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          <span>{content.length} characters</span>
        </div>
      </div>
    </div>
  );
}