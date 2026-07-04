import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AIWorkspace from "./components/ai-workspace";
import Login from "./pages/Login";
import Notes from "./pages/Notes";
import Quiz from "./pages/Quiz";
import History from "./pages/History";
import Highlighter from "./pages/Highlighter";
import Flashcards from "./pages/Flashcards";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("nexusai_token");
    const name = localStorage.getItem("nexusai_name");
    if (token) setUser({ token, name });
    setChecking(false);
  }, []);

  const handleLogin = (data) => setUser(data);

  const handleLogout = () => {
    localStorage.removeItem("nexusai_token");
    localStorage.removeItem("nexusai_userId");
    localStorage.removeItem("nexusai_name");
    setUser(null);
  };

  if (checking) return (
    <div style={{
      height: "100vh", background: "#080810",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif",
    }}>Loading...</div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route path="/" element={user ? <AIWorkspace user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/notes" element={user ? <Notes /> : <Navigate to="/login" />} />
        <Route path="/quiz" element={user ? <Quiz /> : <Navigate to="/login" />} />
        <Route path="/history" element={user ? <History /> : <Navigate to="/login" />} />
        <Route path="/highlight" element={user ? <Highlighter /> : <Navigate to="/login" />} />
        <Route path="/flashcards" element={user ? <Flashcards /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}