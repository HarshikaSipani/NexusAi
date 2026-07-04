const BASE_URL = "http://localhost:5000/api";

async function initSession() {
  const existingUserId = localStorage.getItem("nexusai_userId");
  const existingToken = localStorage.getItem("nexusai_token");

  if (existingToken && existingUserId) {
    try {
      const payload = JSON.parse(atob(existingToken.split(".")[1]));
      if (payload.exp * 1000 > Date.now()) {
        console.log("✅ Session restored");
        return { token: existingToken, userId: existingUserId };
      }
    } catch {}
  }

  console.log("🔄 Creating new session...");
  const res = await fetch(`${BASE_URL}/auth/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: existingUserId || undefined }),
  });

  if (!res.ok) throw new Error("Failed to create session");

  const data = await res.json();
  localStorage.setItem("nexusai_token", data.token);
  localStorage.setItem("nexusai_userId", data.userId);
  console.log("✅ New session created:", data.userId);
  return data;
}

function authHeaders() {
  const token = localStorage.getItem("nexusai_token");
  console.log("Token being sent:", token ? "✅ exists" : "❌ MISSING");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export { initSession };

export async function sendMessage(tool, message) {
  await initSession(); // Always ensure session exists before sending
  const res = await fetch(`${BASE_URL}/chat/send`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ tool, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send message");
  return data;
}

export async function loadHistory(tool) {
  await initSession();
  const res = await fetch(`${BASE_URL}/history/${tool}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load history");
  return data;
}

export async function clearHistory(tool = null) {
  await initSession();
  const url = tool ? `${BASE_URL}/history/${tool}` : `${BASE_URL}/history`;
  const res = await fetch(url, { method: "DELETE", headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to clear history");
  return data;
}