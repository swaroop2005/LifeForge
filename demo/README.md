# Demo assets — ImpactForge 2026

## Screenshot tools (working now)

Both scripts need the dev stack running (backend :8000, frontend :5173) and
puppeteer from `frontend/node_modules`:

```bash
cd frontend
# public page
NODE_PATH=$PWD/node_modules node ../demo/shot.js http://localhost:5173/ out.png 900
# authenticated page (logs in via API, injects token, optionally clicks a nav tab)
NODE_PATH=$PWD/node_modules node ../demo/shot_auth.js admin@vitatrace.com Admin@123 /admin out.png "Heatmap"
```

Chrome sandbox is disabled in the scripts (`--no-sandbox`) because this distro
restricts unprivileged user namespaces.

## Demo video plan (blocked on GEMINI_API_KEY)

Six scenes, ~3 minutes, following the earlier submission's structure:

1. Landing page scroll — hero, stats, features
2. Chatbot — 3 questions (disease diet, live blood bank search via tool call, compatibility) **needs API key**
3. Donor accepts a journey request (+25 pts)
4. Patient opens chat, sends thank-you; donor replies
5. Public leaderboard — Hall of Heroes
6. Admin — overview KPIs, Blood Requests tab, live heatmap, Run AI Analysis **needs API key**

Pipeline (same as the June submission): puppeteer frame capture at 8 fps →
ffmpeg assembly → `edge-tts` narration (`en-US-AriaNeural`, +15% rate) overlaid
with padded silence per scene. edge-tts and ffmpeg are installed system-wide.

## Demo accounts

See root README — arjun@ / ravi@ / aiims@ / admin@vitatrace.com.
