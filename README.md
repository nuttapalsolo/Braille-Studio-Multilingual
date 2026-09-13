# ⠃ Braille Studio Multilingual

> **Universal Braille Translation, Interactive Editor & Data Management System**

> [!NOTE]
> 🤖 **AI Generated & Architected**: This application was completely designed, architected, and built by **Antigravity AI (Google DeepMind Agentic Assistant)** in pair programming collaboration with the repository owner.

---

## 🌟 Overview

**Braille Studio Multilingual** is a web application designed for bi-directional Braille translation, interactive 6-dot and 8-dot matrix editing, dictionary exploration, data validation, version control, and dataset import/export.

The system is built from the ground up to prioritize **Accessibility (a11y)** for Screen Readers (**NVDA**, **JAWS**, **Windows Narrator**, **VoiceOver**, and **TalkBack**).

---

## ✨ Key Features

### 🌐 1. Multilingual Dataset Architecture
- Pre-configured dataset structures for **10 languages**:
  - 🇹🇭 **Thai** (`th`) — *Initialized as an empty array (`[]`) ready for official developer import. No hardcoded or guessed Thai mappings.*
  - 🇬🇧 **English** (`en`) — Grade 1 Standard Braille.
  - 🇯🇵 **Japanese** (`ja`) — Full Hiragana & Katakana Tenji (あ-ん, ア-ン), Dakuten (ざ, が, だ, ば), Handakuten (ぱ), and Yōon (きゃ, しゅ, ちょ, じゃ).
  - 🇨🇳 **Chinese** (`zh`) — Pinyin Braille.
  - 🇰🇷 **Korean** (`ko`) — Hangeul Jeomja.
  - 🇩🇪 **German** (`de`) — German Braille & Umlauts.
  - 🇫🇷 **French** (`fr`) — Code Braille Français.
  - 🇪🇸 **Spanish** (`es`) — Codigo Braille Español.
  - 🇮🇹 **Italian** (`it`) — Codice Braille Italiano.
  - 🇷🇺 **Russian** (`ru`) — Russian Cyrillic Braille.

### 🔄 2. Bi-directional Braille Converter
- **Text ➔ Braille Unicode**: Converts text into standard Braille Unicode symbols (`⠁⠃⠉...`).
- **Braille ➔ Text**: Reverse translates Braille Unicode back to plain text.
- **Character Breakdown Table**: Shows character, Braille Unicode, Dot Pattern, Category, Source, and Verification status badge for every processed token.

### ⌨️ 3. Interactive Braille Dot Editor
- Toggle between **6-dot** (3x2 grid) and **8-dot** (4x2 grid) cell layouts.
- **ISO/IEC 11548-1 Mathematical Bitmask Standard**:
  $$\text{Codepoint} = 0x2800 + \sum_{d \in \text{dots}} 2^{(d-1)}$$
- **Keyboard Shortcuts**:
  - `1` – `8`: Toggle corresponding dot
  - `Space`: Toggle currently focused dot
  - `Enter`: Save mapping correction
  - `Esc`: Reset cell
- **Screen Reader Announcements**: `aria-live="polite"` announces dot changes in real-time (*"Dot 1 enabled. Current pattern: 1 2 4 5"*).

### 📜 4. Data Correction & Version Audit Trail
- Form for updating incorrect character mappings with reason, source reference, and verification flags.
- Complete version history storing old vs. new values, timestamp, reason, source, and version number.
- **1-Click Restore**: Revert to previous versions instantly.

### 🔍 5. Searchable Braille Dictionary
- Multi-field search by Character, Word, Braille symbol, Dot Pattern (e.g. `1-2-4-5`), Category, or Source.
- Filter dropdowns by Category and Verified / Unverified status.

### 🔌 6. External Reference Adapter
- Modular `IExternalReferenceAdapter` interface for external reference lookups (e.g. Japanese Braille Viewer API).
- Graceful standalone fallback to local dataset with clear visual status indicators.

### 📁 7. Data Manager (Import / Export)
- Export complete or filtered datasets to **JSON** or **CSV**.
- **Pre-Import Validation**: Validates JSON/CSV schema, duplicate characters, dot index ranges ($1..8$), and conflicts before committing to database.

### 💾 8. Local-first IndexedDB Repository
- Powered by Dexie.js (`MultilingualBrailleDB`).
- Decoupled `IBrailleRepository` interface for future cloud database integration (Firebase / Supabase).

---

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (Vanilla CSS variables + utility classes)
- **Database**: IndexedDB (Dexie.js ORM)
- **Icons**: Lucide React
- **Build Tool**: Vite

---

## 🚀 Getting Started

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nuttapalsolo/braille.git
   cd braille
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

*Created with ❤️ & AI by Google DeepMind Antigravity AI Agent.*
