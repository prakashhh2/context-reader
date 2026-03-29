# 📖 Context Reader — AI Text Explainer for Students

A Chrome extension that lets students highlight any text on PDFs or webpages and get instant plain-language explanations powered by Google Gemini AI.

## ✨ Features

- **Highlight & Explain** — Select any text, click the floating button, get an instant explanation
- **Right-click menu** — Right-click selected text → "Explain this in simple words"
- **4 Modes** — Explain, Summarize, Examples, Quiz Me
- **3 Difficulty Levels** — Simple (ELI12), Medium (High School), Detailed (College)
- **12 Languages** — English, Hindi, Spanish, French, German, Chinese, Japanese, Korean, Arabic, Portuguese, Tamil, Telugu
- **Dark Mode** — Automatically matches your system theme
- **Draggable Panel** — Move the explanation panel anywhere on screen
- **Works on PDFs** — Chrome's built-in PDF viewer is supported
- **Copy to clipboard** — One-click copy of any explanation

## 🚀 Quick Setup (5 minutes)

### Step 1: Get a Gemini API Key (Free)
1. Go to [aistudio.google.com](https://aistudio.google.com/apikey)
2. Click **"Create API Key"**
3. Copy the key

### Step 2: Load the Extension in Chrome
1. Open Chrome → go to `chrome://extensions/`
2. Turn ON **"Developer mode"** (top-right toggle)
3. Click **"Load unpacked"**
4. Select this `context-reader-extension` folder
5. The 📖 icon appears in your toolbar

### Step 3: Add Your API Key
1. Click the 📖 icon in the toolbar
2. Paste your Gemini API key
3. Choose difficulty level and language
4. Click **Save Settings**

### Step 4: Start Using!
1. Open any PDF or webpage
2. Highlight text you want explained
3. Click the floating **"📖 Explain"** button
4. Or right-click → **"Explain this in simple words"**

## 📁 Project Structure

```
context-reader-extension/
├── manifest.json       # Extension config (Manifest V3)
├── background.js       # Service worker (Gemini API calls)
├── content.js          # Content script (text selection UI)
├── content.css         # Floating panel styles
├── popup.html          # Settings popup
├── popup.js            # Settings logic
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 🏗️ Architecture

```
User highlights text on any page
         ↓
Content Script (content.js)
  → Detects selection
  → Shows floating FAB button
  → Opens explanation panel
         ↓
Background Script (background.js)
  → Receives message from content script
  → Constructs prompt based on mode/difficulty/language
  → Calls Gemini API (REST)
  → Returns formatted response
         ↓
Content Script renders result in floating panel
```

## 🛠️ Tech Stack

- **Chrome Extension Manifest V3**
- **Google Gemini API** (gemini-2.5-flash)
- **Vanilla JavaScript** (no frameworks — fast & lightweight)
- **CSS with dark mode support**

## 💡 Hackathon Presentation Tips

1. **Demo on a real academic PDF** — show it working on a research paper
2. **Switch difficulty levels live** — show simple vs detailed explanations
3. **Use the Quiz mode** — judges love interactive features
4. **Show the right-click menu** — it's a power-user feature
5. **Mention it works offline-free** — only needs a free API key, no server

## 📝 License

MIT — Built for educational purposes.
