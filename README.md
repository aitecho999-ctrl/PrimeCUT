# PrimeCut AI — Professional Long-Form AI Video Studio

**PrimeCut AI** is a personal AI-powered long-form video creation and multi-track editing workspace inspired by modern digital video editors like CapCut, Descript, and Adobe Premiere.

---

## 1. Features Overview

* **Multi-Track Interactive Timeline**:
  - Dedicated tracks: **V1** Main Video, **V2** B-Roll / Overlays, **T1** Titles & Captions, **A1** Voiceover, **A2** Background Music & Sound Effects.
  - Interactive editing: drag clips along tracks, trim in/out handles, split at playhead (`S`), duplicate (`D`), delete (`Delete`/`Backspace`), and magnetic snapping to playhead and clip boundaries.
  - Full Undo & Redo stack with keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`).
  - Track-level controls: Mute / Unmute and Lock / Unlock.

* **Synchronized Video Canvas Preview**:
  - Real-time compositing of main video, B-roll overlays, and stylized lower thirds / headline cards.
  - Real-time visual transform & color grading: scale, position X/Y, rotation, brightness, contrast, saturation, blur, opacity, and fit modes (cover, contain, fill).
  - Broadcast safe-area overlays (90% action safe & 80% title safe guides).
  - Aspect ratio switcher: **16:9** (Landscape / YouTube), **9:16** (Portrait / Shorts / Reels), and **1:1** (Square / Feed).

* **AI Script Breakdown (Google Gemini 3.8 Flash)**:
  - Takes raw long-form narration scripts and breaks them down into structured scenes.
  - Generates scene excerpts, narration, search keywords, visual descriptions, suggested titles, and on-screen captions.
  - Distinguishes illustrative B-roll from actual event footage.
  - Extracts verifiable factual claims with targeted search queries.

* **Stock Media Search (Pexels & Pixabay)**:
  - Unified search library supporting Pexels and Pixabay APIs.
  - Filters by media type (video / photo) and orientation.
  - High-fidelity **DEMO FIXTURES** clearly labeled whenever API keys are not configured, so the entire timeline and rendering pipeline can be tested immediately out-of-the-box.
  - Source links and attribution tracking for all footage.

* **Journalistic Web Research**:
  - Fact-checking panel that extracts claims from narration and queries web sources (Tavily / NewsAPI / Gemini grounding).
  - Flags claims as Verified, Conflicting, or Unverified with publisher and date citations.

* **Client-Side Canvas Video Rendering & Export**:
  - Real in-browser Canvas frame recorder using `MediaRecorder` / WebCodecs.
  - Configurable resolutions: **1080p Full HD** and **720p HD**.
  - Frame rates: **30 fps** (Standard) and **24 fps** (Cinema).
  - Generates real downloadable `.mp4` / `.webm` video files.
  - Subtitle export: instant `.srt` file generation aligned to caption clips.
  - Project JSON backup: complete project serialization for backup and restore.

* **Project Management & Persistence**:
  - Project Dashboard with project cards, duration, aspect ratio, last saved timestamps, project duplication, and deletion.
  - Reliable browser-local storage with JSON import/export.

---

## 2. API Configuration & Secrets

All external keys are stored and evaluated exclusively **on the server** via environment variables. Client code never receives or exposes API keys.

| Environment Variable | Service | Status | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API | **Primary / Auto-Injected** | Powers script analysis, scene breakdown, keyword tagging, and fact-checking extraction (`gemini-3.8-flash`). |
| `PEXELS_API_KEY` | Pexels API | *Optional* | Unlocks live queries against Pexels' 4K/HD video and photo catalog. When unset, curated HD demo fixtures are provided. |
| `PIXABAY_API_KEY` | Pixabay API | *Optional* | Unlocks live search queries across Pixabay's 4M+ media assets. When unset, curated HD demo fixtures are provided. |
| `TAVILY_API_KEY` | Tavily Web Search | *Optional* | Powers real-time journalistic search and primary source article verification for documentary scripts. |
| `NEWS_API_KEY` | NewsAPI | *Optional* | Optional secondary provider for global breaking news article indexing. |
| `SUPABASE_URL` | Supabase Cloud | *Optional* | Optional cloud project synchronization and bucket storage. Default is local browser persistence. |
| `SUPABASE_ANON_KEY` | Supabase Anon Key | *Optional* | Public client key for Supabase cloud persistence. |

### How to Add Secrets in Google AI Studio
1. Open the **Secrets** panel in the AI Studio left sidebar.
2. Add any of the optional keys (e.g. `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `TAVILY_API_KEY`).
3. Return to the PrimeCut AI editor, navigate to the **Settings > Keys** tab, and click **Test Connection** to verify live connectivity.

---

## 3. Testing Integrations

Open the PrimeCut AI editor and navigate to the **Keys** tab on the left sidebar:
* Click **Test Connection** next to Google Gemini to verify low-latency model ping.
* Click **Test Connection** next to Pexels or Pixabay to verify authentication against their REST endpoints.
* Click **Test Connection** next to Tavily to test web query execution.

---

## 4. Export Requirements & Browser Rendering

- **Canvas MediaRecorder**: PrimeCut AI composites video layers onto an offscreen canvas and records the video stream using the browser's native `MediaRecorder` API.
- **Supported Formats**: Modern Chromium and WebKit browsers support WebM (VP9/H264) and MP4 container output.
- **Estimated File Size**: Calculated dynamically based on resolution bitrate and timeline length (approx. ~4 MB per minute at 720p, ~8 MB per minute at 1080p).
- **Subtitles**: Click **Export Subtitles (.SRT)** in the export dialog to receive a standard SubRip subtitle track matching your timeline narration.

---

## 5. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause video preview |
| `S` | Split selected clip at the current playhead position |
| `D` | Duplicate selected clip |
| `Delete` / `Backspace` | Delete selected clip from track |
| `Ctrl + Z` / `Cmd + Z` | Undo last edit action |
| `Ctrl + Y` / `Cmd + Shift + Z` | Redo last edit action |
| `Left Arrow` / `Right Arrow` | Step playhead back / forward by 1 second |
