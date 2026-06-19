# Nepali Typing & Font Converter Platform

A highly authoritative, fast, and visually stunning Nepali language platform focused on **Preeti to Unicode conversion**, **Unicode to Preeti conversion**, and **Nepali Typing**.

## Features

- **Preeti to Unicode**: Highly accurate conversion of legacy Preeti ASCII font text to standard Unicode Devanagari.
- **Unicode to Preeti**: Reliable conversion of Devanagari Unicode back to legacy Preeti typewriter layout, with local font preview.
- **English to Nepali Typing**: A phonetic Romanized keyboard tool that converts Roman script (e.g., `namaste`) into Devanagari script (`नमस्ते`) as you type. Includes support for:
  - Romanized layout (Phonetic mapping)
  - Traditional keyboard layout (Preeti map)
  - Nepali to English transliteration (Devanagari to Roman)
  - English bypass mode
- **Nepali Typing Speed Test (Typeshala)**: Mimics Typeshala features with interactive typing lessons, a real-time words-per-minute (WPM) tracker, and an accuracy index.
- **Batch Converter**: Convert multiple text files or MS Word document content in batch.
- **SEO Optimized**: Fully semantic HTML structure, proper meta titles/descriptions, FAQ Schema markup.
- **Progressive Web App (PWA)**: Completely offline-capable with a registered Service Worker.
- **Light & Dark Theme**: Premium styling using modern glassmorphic UI elements and CSS variables.

## Project Structure

- `/src/` - Contains the raw page files with page-specific main content.
- `/templates/` - Contains common components (header, footer, navigation bar, layouts).
- `/assets/` - Static assets:
  - `/css/` - CSS variables, layout grid, global styling, component sheets.
  - `/js/` - Transliteration engine (`nepalify.js`), bidirectional converter logic (`converter.js`), and page logic (`main.js`).
  - `/fonts/` - Embedded legacy Preeti font file.
- `build.ps1` - Lightweight PowerShell compiler script that compiles raw pages in `src/` using fragments in `templates/` into production-ready pages.
- `verify.ps1` - Validation script to check links, structure, and conversion accuracy.
- `sw.js` & `manifest.json` - PWA files for service worker lifecycle and offline caching.

## Getting Started

### Prerequisites

- PowerShell (for build and verification scripts)
- Local HTTP server (e.g., Python, `http-server` npm package, or any static hosting tool)

### Building the Project

If you modify any file inside `src/` or `templates/`, recompile the project:

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

### Running Locally

To run the site locally, start a local server at the root directory:

```powershell
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000
```

Open `http://localhost:8000` in your web browser.

### Verifying Build Structure

To run the automated validation tests:

```powershell
powershell -ExecutionPolicy Bypass -File .\verify.ps1
```
