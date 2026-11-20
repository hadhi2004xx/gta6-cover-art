# Vice Poster — GTA-Style Cover Maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hadhi2004xx/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hadhi2004xx/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn any photo into multi-panel GTA-style poster cover art, in the browser, offline.

## What it does

- **The art** — a live canvas poster with 1–4 panels split on diagonals, bold condensed
  caption lettering with outline and shadow, and a Vice City colour grade (Sunset,
  Neon Night, or Vice Gold). The sun and palm silhouettes are drawn in code — all
  original art, no Rockstar logo, artwork, or font anywhere.
- **Any photo** — add one or more photos from your machine (FileReader, local only,
  never uploaded). Drag a panel to position its photo, scroll to zoom, or use the
  Zoom / Position sliders. Assign a different photo to each panel, or spread one
  photo across all panels. Edit the title and subtitle freely.
- **Fast and easy** — pick a panel template, a grade and a lettering style, then
  export a PNG in one click at 1080×1080, 1080×1350, or 1920×1080.
- **Polish** — live preview canvas, three grade presets, three lettering styles
  (Block / Neon / Gold), and two free sample photos (`app/samples/`) so the app
  works instantly with no upload.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only: `app/index.html` + `app/style.css` + vanilla canvas JS under
`app/src/`. No external libraries, no network requests, system font stack only.

## Files

- `app/index.html` — editor page and controls
- `app/style.css` — Vice City dusk theme
- `app/src/cover.js` — poster renderer: diagonal panel splits, photo crop/zoom,
  sun + palm silhouettes, grades, caption lettering, PNG export rendering
- `app/src/main.js` — editor wiring: uploads, templates, drag/zoom, export
- `app/src/shots.js` — fixed `?shot=` scenes used for the screenshots
- `app/samples/` — two free sample photos (made with an image model for make.fun)
- `main.ts` — hands `app/` + `screenshots/` in via `vendor/makefun-app.ts`

## License

MIT — see `LICENSE`.
