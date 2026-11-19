# makefun-gta6-cover-art-01-v2

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Zikri167/makefun-gta6-cover-art-01-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Zikri167/makefun-gta6-cover-art-01-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Palms Cover Studio — a static, fully offline web app that turns your own photos and a caption into GTA-poster-style cover art. Six multi-panel layouts, six sunset/neon gradient-map grades plus an ink posterise mode, per-panel crop/drag/zoom, caption and script-subtitle lettering in bundled OFL fonts, and one-click PNG export at 1080x1080, 1080x1350 and 1920x1080. Photos are read on your own machine and never uploaded; everything the app loads is a file in app/.

## How it works

Pick a layout, drop a photo into each panel (or fill every panel with one photo), drag and scroll to frame each shot, choose a grade, type a caption and a subtitle, then export a PNG. The app is plain HTML, CSS and hand-written JavaScript under app/ — no libraries, no network requests, no build step. The sample photos under app/samples/ are either free-to-use kit photos or scenes drawn for this entry.

## Run it

```sh
cd app && python3 -m http.server 8000
# open http://localhost:8000 in a desktop browser, load a photo, export a cover
MAKEFUN_OUTPUT_DIR=/tmp/coverart-out node ../main.ts
# main.ts copies app/ and screenshots/ to the output dir and writes dossier.json
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=63s6rw9w&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
