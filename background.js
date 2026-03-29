// ============================================
// Context Reader — Background Service Worker
// Handles Gemini API calls & context menu
// ============================================

const GEMINI_MODEL = "gemini-2.5-flash";

// Create right-click context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "context-reader-explain",
    title: "📖 Explain this in simple words",
    contexts: ["selection"]
  });

  // Set default settings
  chrome.storage.sync.get(["apiKey", "difficulty", "language"], (result) => {
    if (!result.apiKey) chrome.storage.sync.set({ apiKey: "AIzaSyAm_SlxGHkROJ56tJOqBbHv1FFNXPF2VQ0" });
    if (!result.difficulty) chrome.storage.sync.set({ difficulty: "simple" });
    if (!result.language) chrome.storage.sync.set({ language: "English" });
  });
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url && isPdfUrl(tab.url)) {
    const viewerUrl =
      chrome.runtime.getURL("pdf-viewer.html") +
      "?url=" +
      encodeURIComponent(tab.url);
    chrome.tabs.update(tabId, { url: viewerUrl });
  }
});

function isPdfUrl(url) {
  if (!url) return false;
  if (url.startsWith("chrome") || url.startsWith(chrome.runtime.getURL(""))) return false;
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "context-reader-explain" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: "explain",
      text: info.selectionText
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callGemini") {
    handleGeminiCall(request.text, request.mode, request.difficulty, request.language)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true; // Keep message channel open for async
  }
});


async function handleGeminiCall(text, mode, difficulty, language) {
  const settings = await chrome.storage.sync.get(["apiKey"]);

  if (!settings.apiKey) {
    return { error: "NO_API_KEY" };
  }

  const difficultyPrompts = {
    "simple": "Explain like I'm 12 years old. Use everyday words, short sentences, and relatable analogies.",
    "medium": "Explain at a high school level. Use clear language but include proper terminology with brief definitions.",
    "detailed": "Explain at a college level. Be thorough but still accessible. Include relevant context and connections."
  };

  const modePrompts = {
    "explain": `${difficultyPrompts[difficulty] || difficultyPrompts["simple"]}

Explain the following text in ${language || "English"}. Structure your response as:
- **What it means**: A clear, plain-language explanation
- **Why it matters**: Why this concept is important
- **Think of it like**: A simple real-world analogy

Text to explain:
"""
${text}
"""`,

    "summarize": `Summarize the following text in 2-3 bullet points using ${language || "English"}. Keep it concise and student-friendly.
${difficultyPrompts[difficulty] || difficultyPrompts["simple"]}

Text:
"""
${text}
"""`,

    "examples": `Give 2-3 real-world examples that illustrate the concept described in this text. Use ${language || "English"}.
${difficultyPrompts[difficulty] || difficultyPrompts["simple"]}

Text:
"""
${text}
"""`,

    "quiz": `Based on this text, generate 3 quick quiz questions (multiple choice, 4 options each) to test understanding. Use ${language || "English"}.
Format each question clearly with options A, B, C, D and mark the correct answer.

Text:
"""
${text}
"""`
  };

  const prompt = modePrompts[mode] || modePrompts["explain"];

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${settings.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      throw new Error("Empty response from Gemini");
    }

    return { result };
  } catch (err) {
    return { error: err.message };
  }
}
