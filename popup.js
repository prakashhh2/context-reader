// ============================================
// Context Reader — Popup Script
// Manages settings and usage stats
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api-key");
  const difficultySelect = document.getElementById("difficulty");
  const languageSelect = document.getElementById("language");
  const saveBtn = document.getElementById("save-btn");
  const statusEl = document.getElementById("status");
  const keyToggle = document.getElementById("key-toggle");

  // Load saved settings
  chrome.storage.sync.get(
    ["apiKey", "difficulty", "language", "explainCount", "wordCount"],
    (data) => {
      if (data.apiKey) apiKeyInput.value = data.apiKey;
      if (data.difficulty) difficultySelect.value = data.difficulty;
      if (data.language) languageSelect.value = data.language;

      // Update stats
      document.getElementById("stat-explains").textContent =
        data.explainCount || 0;
      document.getElementById("stat-words").textContent =
        data.wordCount || 0;
    }
  );

  // Toggle API key visibility
  keyToggle.addEventListener("click", () => {
    const isPassword = apiKeyInput.type === "password";
    apiKeyInput.type = isPassword ? "text" : "password";
    keyToggle.textContent = isPassword ? "🔒" : "👁️";
  });

  // Save settings
  saveBtn.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    const difficulty = difficultySelect.value;
    const language = languageSelect.value;

    const nextSettings = { difficulty, language };
    if (apiKey) {
      nextSettings.apiKey = apiKey;
    }

    chrome.storage.sync.set(nextSettings, () => {
      statusEl.textContent = apiKey
        ? "✅ Settings saved!"
        : "✅ Settings saved. Using .env if available.";
      statusEl.style.color = "#27ae60";
      setTimeout(() => (statusEl.textContent = ""), 2500);
    });
  });
});
