// api/chat.js — Vercel Serverless Function (no Express needed)

export default async function handler(req, res) {
  // Preflight for browsers
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  try {
    const { system, history, user, npc, playerName } = req.body || {};

    const messages = [];
    if (system) messages.push({ role: "system", content: system });
    if (Array.isArray(history)) {
      for (const m of history) {
        if (m?.role && m?.content) messages.push(m);
      }
    }
    messages.push({
      role: "user",
      content: `Player "${playerName || "Player"}" says to NPC "${npc || "NPC"}": ${user || ""}`
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 120,
      }),
    });

    if (!response.ok) {
      const txt = await response.text();
      return res.status(500).json({ error: "openai_error", detail: txt });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "…";
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: "proxy_error" });
  }
}
