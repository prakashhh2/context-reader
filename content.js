

(function () {
  // Prevent double injection
  if (window.__contextReaderLoaded) return;
  window.__contextReaderLoaded = true;

  let selectedText = "";
  let currentMode = "explain";
  let activeRequestId = 0;

 
  // Floating action button (appears near selection)
  const fab = document.createElement("div");
  fab.id = "ctx-reader-fab";
  fab.innerHTML = `<span class="ctx-icon">📖</span> Explain`;
  document.body.appendChild(fab);

  // Main panel
  const panel = document.createElement("div");
  panel.id = "ctx-reader-panel";
  panel.innerHTML = `
    <div class="ctx-header">
      <div class="ctx-header-left">
        <span class="ctx-logo">📖</span>
        <span class="ctx-title">Context Reader</span>
      </div>
      <button class="ctx-close" id="ctx-close-btn">&times;</button>
    </div>
    <div class="ctx-tabs" id="ctx-tabs">
      <button class="ctx-tab active" data-mode="explain">✨ Explain</button>
      <button class="ctx-tab" data-mode="summarize">Summarize</button>
      <button class="ctx-tab" data-mode="examples"> Examples</button>
      <button class="ctx-tab" data-mode="quiz">Quiz me</button>
    </div>
    <div class="ctx-selected-text" id="ctx-selected-preview"></div>
    <div class="ctx-content" id="ctx-content"></div>
    <div class="ctx-footer">
      <button class="ctx-footer-btn" id="ctx-copy-btn"> Copy</button>
      <span class="ctx-footer-meta">Powered by Gemini AI</span>
    </div>
  `;
  document.body.appendChild(panel);

  // Make panel draggable (once, at init)
  makeDraggable(panel, panel.querySelector(".ctx-header"));

  // ============================================
  // Event: Text Selection → Show FAB
  // ============================================
  document.addEventListener("mouseup", (e) => {
    // Ignore clicks inside our own UI
    if (fab.contains(e.target) || panel.contains(e.target)) return;

    const sel = window.getSelection();
    const text = sel?.toString().trim();

    if (text && text.length > 3 && sel.rangeCount > 0) {
      selectedText = text;

      // Position FAB near the selection
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      fab.style.top = `${Math.max(8, rect.top - 44)}px`;
      fab.style.left = `${Math.min(
        window.innerWidth - 140,
        rect.left + rect.width / 2 - 60
      )}px`;
      fab.style.display = "flex";
    } else {
      // Hide FAB if no selection (but don't close panel)
      fab.style.display = "none";
    }
  });

  // Hide FAB on scroll
  document.addEventListener("mousedown", (e) => {
    if (!fab.contains(e.target) && !panel.contains(e.target)) {
      fab.style.display = "none";
    }
  });

  // ============================================
  // Event: FAB Click → Open Panel
  // ============================================
  fab.addEventListener("click", () => {
    fab.style.display = "none";
    openPanel(selectedText);
  });

  // ============================================
  // Event: Context menu message from background
  // ============================================
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "explain" && msg.text) {
      selectedText = msg.text;
      openPanel(selectedText);
    }
  });

  // ============================================
  // Panel Logic
  // ============================================
  function openPanel(text) {
    if (!text || !text.trim()) {
      showError("Please select some text first.");
      panel.style.display = "block";
      return;
    }

    // Position the panel
    const panelWidth = 420;
    const panelHeight = 400;
    let left = Math.min(window.innerWidth - panelWidth - 20, window.innerWidth / 2 - panelWidth / 2);
    let top = Math.max(20, window.innerHeight / 2 - panelHeight / 2);

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    panel.style.display = "block";

    // Show selected text preview
    const preview = document.getElementById("ctx-selected-preview");
    preview.textContent = text.length > 200 ? text.substring(0, 200) + "…" : text;

    // Reset to explain mode
    currentMode = "explain";
    setActiveTab("explain");
    callGemini(text, "explain");
  }

  // Close panel
  document.getElementById("ctx-close-btn").addEventListener("click", () => {
    panel.style.display = "none";
  });

  // ESC key closes panel
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      panel.style.display = "none";
      fab.style.display = "none";
    }
  });

  // Tab switching
  document.getElementById("ctx-tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".ctx-tab");
    if (!tab) return;

    const mode = tab.dataset.mode;
    currentMode = mode;
    setActiveTab(mode);
    callGemini(selectedText, mode);
  });

  function setActiveTab(mode) {
    document.querySelectorAll("#ctx-tabs .ctx-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.mode === mode);
    });
  }

  // Copy button
  document.getElementById("ctx-copy-btn").addEventListener("click", () => {
    const content = document.getElementById("ctx-content");
    navigator.clipboard.writeText(content.innerText).then(() => {
      const btn = document.getElementById("ctx-copy-btn");
      btn.textContent = "✅ Copied!";
      setTimeout(() => (btn.textContent = "📋 Copy"), 1500);
    }).catch(() => {
      showError("Copy failed. Please copy the text manually.");
    });
  });

  // ============================================
  // Gemini API Call (via background script)
  // ============================================
  async function callGemini(text, mode) {
    const content = document.getElementById("ctx-content");
    const requestId = ++activeRequestId;

    // Show loading
    content.innerHTML = `
      <div class="ctx-loading">
        <div class="ctx-spinner"></div>
        <span>Thinking about this...</span>
      </div>
    `;

    // Get user settings
    const settings = await chrome.storage.sync.get(["difficulty", "language"]);

    let responded = false;
    const timeoutId = setTimeout(() => {
      if (!responded && requestId === activeRequestId) {
        responded = true;
        showError("Request timed out. Please try again.");
      }
    }, 30000);

    chrome.runtime.sendMessage(
      {
        action: "callGemini",
        text: text,
        mode: mode,
        difficulty: settings.difficulty || "simple",
        language: settings.language || "English"
      },
      (response) => {
        if (responded || requestId !== activeRequestId) return;
        responded = true;
        clearTimeout(timeoutId);

        if (chrome.runtime.lastError) {
          showError("Connection error — try reloading the page.");
          return;
        }

        if (!response) {
          showError("No response from background. Try reloading the extension.");
          return;
        }

        if (response.error === "NO_API_KEY") {
          showError(
            "No API key set. Click the extension icon in the toolbar and add your Gemini API key."
          );
          return;
        }

        if (response.error) {
          showError(response.error);
          return;
        }

        if (response.result) {
          content.innerHTML = formatMarkdown(response.result);

          // Update usage stats
          const wordCount = text.trim().split(/\s+/).length;
          chrome.storage.sync.get(["explainCount", "wordCount"], (stats) => {
            chrome.storage.sync.set({
              explainCount: (stats.explainCount || 0) + 1,
              wordCount: (stats.wordCount || 0) + wordCount
            });
          });
        } else {
          showError("Unexpected response. Please try again.");
        }
      }
    );
  }

  function showError(msg) {
    const content = document.getElementById("ctx-content");
    content.innerHTML = `
      <div class="ctx-error">
        <span class="ctx-error-icon">⚠️</span>
        <span>${escapeHtml(msg)}</span>
      </div>
    `;
  }

  // ============================================
  // Simple Markdown → HTML converter
  // ============================================
  function formatMarkdown(text) {
    const escaped = escapeHtml(text);

    return escaped
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Inline code
      .replace(/`(.*?)`/g, "<code>$1</code>")
      // Unordered list items
      .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
      // Ordered list items
      .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
      // Wrap consecutive <li> in <ul>
      .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
      // Headers
      .replace(/^### (.+)$/gm, "<strong>$1</strong>")
      .replace(/^## (.+)$/gm, "<strong>$1</strong>")
      .replace(/^# (.+)$/gm, "<strong>$1</strong>")
      // Paragraphs (double newline)
      .replace(/\n\n/g, "</p><p>")
      // Single newline to <br>
      .replace(/\n/g, "<br>")
      // Wrap in paragraph
      .replace(/^/, "<p>")
      .replace(/$/, "</p>");
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ============================================
  // Make panel draggable
  // ============================================
  function makeDraggable(element, handle) {
    let offsetX, offsetY, isDragging = false;

    handle.style.cursor = "grab";

    handle.addEventListener("mousedown", (e) => {
      if (e.target.closest(".ctx-close")) return;
      isDragging = true;
      offsetX = e.clientX - element.getBoundingClientRect().left;
      offsetY = e.clientY - element.getBoundingClientRect().top;
      handle.style.cursor = "grabbing";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const nextLeft = Math.min(
        window.innerWidth - element.offsetWidth,
        Math.max(0, e.clientX - offsetX)
      );
      const nextTop = Math.min(
        window.innerHeight - element.offsetHeight,
        Math.max(0, e.clientY - offsetY)
      );

      element.style.left = `${nextLeft}px`;
      element.style.top = `${nextTop}px`;
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      handle.style.cursor = "grab";
    });
  }
})();
