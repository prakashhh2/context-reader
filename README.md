# Context Reader — AI Text Explainer for Students

A Chrome extension that lets students highlight any text on webpages or PDFs and get instant plain-language explanations powered by Google Gemini AI.

---

## Features

- **Highlight & Explain** — Select any text, click the floating button, get an instant AI explanation
- **Right-click support** — Right-click selected text → "Explain this in simple words"
- **4 Modes** — Explain, Summarize, Examples, Quiz Me
- **3 Difficulty levels** — Simple (ELI12), Medium (High School), Detailed (College)
- **12 Languages** — English, Hindi, Spanish, French, German, Chinese, Japanese, Korean, Arabic, Portuguese, Tamil, Telugu
- **PDF support** — Works on PDFs opened in Chrome (custom PDF viewer with selectable text)
- **Draggable panel** — Move the explanation panel anywhere on screen
- **Copy to clipboard** — One-click copy of any explanation
- **Dark mode** — Automatically matches your system theme

---

## Setup

### 1. Get a Gemini API Key (free)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy the key

### 2. Load the extension in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `context-reader-extension` folder

### 3. Add your API key

1. Click the extension icon in the toolbar
2. Paste your Gemini API key
3. Choose your difficulty level and language
4. Click **Save Settings**

### 4. Use it

- Open any webpage or PDF
- Highlight text you want explained
- Click the floating **Explain** button that appears
- Or right-click → **Explain this in simple words**

---

## Project Structure

```
context-reader-extension/
├── manifest.json       # Extension config (Manifest V3)
├── background.js       # Service worker — Gemini API calls, PDF redirect
├── content.js          # Content script — text selection, floating panel UI
├── content.css         # Panel styles
├── popup.html          # Settings popup
├── popup.js            # Settings logic
├── pdf-viewer.html     # Custom PDF viewer page
├── pdf-viewer.js       # PDF.js rendering with selectable text layer
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## How It Works

```
User highlights text on a webpage or PDF
              ↓
content.js — detects selection, shows floating button
              ↓
User clicks Explain (or right-clicks)
              ↓
background.js — builds prompt, calls Gemini API
              ↓
Result rendered in floating panel
```

**PDF support:** When Chrome navigates to a `.pdf` URL, `background.js` intercepts it and redirects to `pdf-viewer.html`, which renders the PDF using [PDF.js](https://mozilla.github.io/pdf.js/) with a transparent text layer — so text selection and the Explain button work exactly like on web pages.

---

## Tech Stack

- Chrome Extension Manifest V3
- Google Gemini API (`gemini-2.5-flash`)
- PDF.js for PDF rendering
- Vanilla JavaScript — no frameworks

---

## Permissions Used

| Permission | Why |
|---|---|
| `storage` | Save API key, difficulty, language settings |
| `contextMenus` | Right-click "Explain" menu item |
| `tabs` | Detect and redirect PDF navigations |
| `activeTab` | Access the current tab's content |
| `host_permissions: <all_urls>` | Inject content script on any page; fetch PDFs |
