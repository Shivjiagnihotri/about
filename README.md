# shivjiagnihotri.tech — 3D Portfolio

Production single-page portfolio with a Lottie hero, a real-time **Three.js** "neural space" section, and a three-game arcade — built as a zero-build static site so it deploys straight from this repository to **GitHub Pages**.

## Stack

- [Three.js](https://threejs.org) `v0.178.0` via ES-module import map (jsDelivr CDN, pinned version — no bundler needed)
- Vanilla JS modules (`js/scene.js`, `js/games.js`, `js/main.js`)
- Single stylesheet (`css/style.css`)
- Lottie hero background + mid-page interactive 3D "neural space" section
- Arcade with three games: Bug Runner, Bird Fly, Arrow Shooter (touch/mouse/keyboard)

## Structure

```
about/
├── index.html        # markup + import map
├── css/style.css     # theme, layout, reduced-motion & no-JS handling
├── js/scene.js       # Three.js mid-page scene: particles, constellation lines, wireframe core
├── js/games.js       # arcade engine: shared loop/input helpers + 3 games
├── js/main.js        # nav, reveal animations, tilt cards, ticker speed, arcade wiring
├── CNAME             # custom domain: shivjiagnihotri.tech
└── .nojekyll         # serve repo files as-is on Pages
```

## Run locally

Any static server works (ES modules require http://, not file://):

```bash
python -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000

## Deploy

This repo deploys from the **gh-pages** branch root:

```bash
git add .
git commit -m "3D Three.js portfolio"
git push origin gh-pages
```

GitHub Pages serves it at https://shivjiagnihotri.tech (custom domain via `CNAME`). Verify under **Settings → Pages** that source is *Deploy from a branch → gh-pages → /(root)*.

## Production features

- DPR clamped to 2, particle count halved on mobile/coarse pointers
- 3D scene pauses when the tab is hidden or offscreen (IntersectionObserver); games pause when their tab is inactive
- Games render at device-pixel resolution via a logical-coordinate fit (crisp on any screen/DPR)
- Pointer Events everywhere: every game works with touch, mouse and keyboard
- `prefers-reduced-motion`: static rendered frame instead of animation loop
- WebGL failure fallback (CSS gradient stays, canvas hidden)
- Loader overlay with failsafe timeout; content visible without JavaScript
- Scroll-linked camera pull-back and fade tied to the scene section; mouse parallax; context-loss recovery
