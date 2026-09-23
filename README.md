# 🚀 Universal Media Downloader

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/badge/Release-v2.4.0-emerald.svg)](https://github.com/vgskills/Universal-Media-Downloader/releases)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Web-purple.svg)](#-downloads--installers)
[![Electron](https://img.shields.io/badge/Electron-33.2.1-47848F.svg?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**The ultimate high-speed batch media downloader & creative utility.**  
Effortlessly download videos, playlists, audio tracks, and multi-slide carousels from **YouTube**, **Instagram**, **Pinterest**, and **TikTok** with 16-connection multi-stream acceleration and zero terminal jargon.

[**🌐 Open Live Web App**](https://vgskills.github.io/Universal-Media-Downloader/) • [**🍏 Download for macOS**](#-macos-installation) • [**🪟 Download for Windows**](#-windows-installation) • [**📖 Documentation**](#-key-features)

</div>

---

## 📥 Downloads & Installers

Choose the appropriate installer for your operating system:

| Platform | Architecture | Installer Type | Direct Download Link |
| :--- | :--- | :--- | :--- |
| **macOS** | Apple Silicon (M1 / M2 / M3 / M4) | `.dmg` Installer | [⬇️ **Download for Mac (Apple Silicon .dmg)**](https://github.com/vgskills/Universal-Media-Downloader/releases/latest/download/Universal-Media-Downloader-arm64.dmg) |
| **macOS** | Intel x64 | `.dmg` Installer | [⬇️ **Download for Mac (Intel .dmg)**](https://github.com/vgskills/Universal-Media-Downloader/releases/latest/download/Universal-Media-Downloader-x64.dmg) |
| **macOS** | Universal Portable | `.zip` Archive | [⬇️ **Download Portable Mac (.zip)**](https://github.com/vgskills/Universal-Media-Downloader/releases/latest/download/Universal-Media-Downloader-mac.zip) |
| **Windows** | 64-bit (x64) | `.exe` Setup Installer | [⬇️ **Download for Windows (.exe Installer)**](https://github.com/vgskills/Universal-Media-Downloader/releases/latest/download/Universal-Media-Downloader-Setup.exe) |
| **Windows** | 64-bit (x64) | Standalone Portable | [⬇️ **Download Portable Windows (.exe)**](https://github.com/vgskills/Universal-Media-Downloader/releases/latest/download/Universal-Media-Downloader-Portable.exe) |
| **Web Browser** | Any Device | Web Application | [🌐 **Launch Web App Online**](https://vgskills.github.io/Universal-Media-Downloader/) |

---

## 🍏 macOS Installation

1. Download the **`Universal-Media-Downloader-arm64.dmg`** (for Apple Silicon M-series) or **`Universal-Media-Downloader-x64.dmg`** (for Intel).
2. Double-click the downloaded `.dmg` file.
3. Drag **Universal Media Downloader** into your **Applications** folder.
4. Launch the app from Spotlight or Applications.

> [!NOTE]
> **First-Time macOS Gatekeeper Notice**:  
> Because the app is independently distributed without an Apple Developer ID certificate, macOS may show a *"App cannot be opened because it is from an unidentified developer"* warning on first launch.
> 
> **To allow the app (2 seconds):**
> 1. Right-click (or Control-click) **Universal Media Downloader** in your Applications folder and click **Open**.
> 2. Click **Open** in the dialog box.
> 
> *Or run this one-line command in Terminal:*
> ```bash
> xattr -cr "/Applications/Universal Media Downloader.app"
> ```

---

## 🪟 Windows Installation

1. Download **`Universal-Media-Downloader-Setup.exe`**.
2. Run the installer and choose your installation directory (desktop and start menu shortcuts will be created).
3. If you prefer not to install, download **`Universal-Media-Downloader-Portable.exe`** and run it directly.

> [!NOTE]
> **Windows SmartScreen Notice**:  
> If Windows Defender SmartScreen shows *"Windows protected your PC"*, click **More info** and then click **Run anyway**.

---

## 🌐 Web Version (Any Browser / Device)

You can access and use the user interface directly in your browser without installing anything:
👉 **[https://vgskills.github.io/Universal-Media-Downloader/](https://vgskills.github.io/Universal-Media-Downloader/)**

- Paste and queue links from any device (phone, tablet, PC, Mac).
- Preview video information, thumbnails, tags, and carousel albums.
- Configure trimming ranges and export format configurations.

---

## ✨ Key Features

### 🎬 Precision Video Ingestion
- **YouTube 4K & HDR**: Full support for single videos, Shorts, and playlists up to 4K Ultra HD.
- **Interactive Dual-Thumb Trimmer**: Trim start and end timecodes directly on an interactive timeline scrubber before downloading.
- **Format Pipeline Flexibility**: Choose between `Video + Audio (MP4)`, `Video Only`, or `Audio Only (320kbps MP3 / FLAC)`.
- **Metadata & Tag Inspector**: 1-click export of YouTube titles, full descriptions, and SEO tags to `.txt`.

### 📸 Instagram Reels, Carousels & Posts
- **Instagram Reels**: Instant high-speed unthrottled video downloads.
- **Carousel & Album Support**: Detects and extracts all multi-image and multi-video slides in `/p/` posts.
- **1-Click Google Chrome Session Bridge**: Seamlessly synchronizes with your active Google Chrome Instagram login so private/restricted carousels and posts download without typing passwords or encountering scraper blocks.
- **Carousel Gallery**: Preview every slide individually and click *"Download All Images (.zip / folder)"*.

### 📌 Pinterest & TikTok
- **Pinterest Pins**: Auto-resolves original uncompressed images and 1080p MP4 videos.
- **TikTok**: Downloads clean, watermark-free videos.

### ⚡ Accelerated Engine
- **16-Stream Parallel Acceleration**: Uses an embedded `aria2c` engine for maximum download speeds.
- **True Pause & Resume**: Saves `.aria2` state chunks; resume anytime without starting over.
- **Zero Configuration**: `yt-dlp`, `ffmpeg`, and `aria2c` are automatically downloaded and managed in isolated app storage — no Python or Homebrew setup required.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Obsidian Dark Design System (`#0e0e11`).
- **Desktop Runtime**: Electron 33 with context-isolated secure IPC bridge (`contextBridge`).
- **Core Engine**: Embedded standalone `yt-dlp`, static `ffmpeg 4.4.1`, and `aria2c 1.37`.
- **Authentication Bridge**: Native Google Chrome profile SQLite session decryptor (`AES-128-CBC` via Node.js crypto).
- **CI/CD**: GitHub Actions for automated multi-platform builds and GitHub Pages deployment.

```
.
├── assets/                  # App vector icons and branding
├── build/                   # macOS hardened runtime entitlements
├── electron/                # Main process, IPC handlers & engine orchestrators
│   ├── main.cjs             # Window management & IPC routing
│   ├── preload.cjs          # Secure IPC bridge
│   ├── binaryManager.cjs    # Auto-downloads yt-dlp, ffmpeg, aria2c
│   ├── instagramAuth.cjs    # Chrome session sync & Instagram login
│   └── queueManager.cjs     # Batch queue, aria2c spawn, pause/resume
├── src/                     # React 18 Vite application
│   ├── components/          # Obsidian UI components
│   ├── App.jsx              # Main orchestrator & state manager
│   └── index.css            # Dark theme design tokens
├── .github/workflows/
│   ├── deploy-pages.yml     # Auto-deploys web app to GitHub Pages
│   └── release.yml          # Multi-platform desktop build pipeline
├── electron-builder.yml     # Packaging & installer configuration
└── package.json
```

---

## 💻 Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+)
- npm (v9+)

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/vgskills/Universal-Media-Downloader.git
cd Universal-Media-Downloader

# Install dependencies
npm install

# Start Vite UI + Electron app in development mode
npm run dev

# Or start the web UI preview server only
npm run dev:ui
```

### Building & Packaging
```bash
# Build web production bundle
npm run build:ui

# Package desktop application for your current OS
npm run build:electron
```
The compiled binaries will be output into the `dist_electron/` directory:
- macOS: `dist_electron/Universal Media Downloader.dmg` and `.zip`
- Windows: `dist_electron/Universal Media Downloader Setup.exe` and portable `.exe`

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
