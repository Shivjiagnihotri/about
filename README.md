# Shivji Agnihotri — Portfolio

An editorial portfolio and two original, first-person 3D browser games. Built with **HTML, CSS, and vanilla JavaScript**. No framework, build step, backend, or production npm dependencies.

## Preview and check

With Node.js 20 or newer:

```sh
npm start
# http://127.0.0.1:4173
npm test
```

Alternatively, run `python -m http.server 8000` from this folder. Use HTTP instead of opening `index.html` as a file so browser ES modules work.

## What is included

- Responsive ivory-and-ink layout, local typography, original particle sculpture, and project case-study dialogs.
- Live personal projects lead the work section with locally saved homepage previews and matching live badges.
- An interactive celestial garden replaces the Focus Field portrait, with stars, foliage, bees, and the original hover/tap mosaic interaction.
- Illustrated AI concept maps cover RAG, LLM internals, machine learning, and AI design systems with keyboard-accessible tabs.
- Each chapter has a coordinated color tint, gentle flowing backgrounds, and spring-like entrances that respect motion preferences.
- `/learn/` is a public learning garden with 36 visual concepts, 10 interactive teaching models, a free bookshelf, learning paths, and a large source-backed resource catalogue.
- Career history, all 20 existing credentials, research, education, and contact links.
- Motion toggle, reduced-motion support, native keyboard-accessible dialogs, mobile navigation, and clipboard feedback.
- Games load their engine, photographic PBR materials, and HDR environment only when launched. The landing page does not download the 3D engine.
- Local fonts, Three.js, textures, sky, and portrait: no runtime CDN dependency.
- No accounts, analytics, cookies, or server-side data storage. Motion preference and game bests use optional localStorage.

## Learning Garden

Open `/learn/` (the local server redirects `/learn` automatically). The standalone learning page is compatible with GitHub Pages directory routes. Its full resource library supports text search, topic, format, provider and level filters, sorting, 24-item pagination, local bookmarks, and shareable filtered URLs. Concept links such as `/learn/#concept/gradient-descent` open the corresponding experiment directly.

The landing page loads only the collection summary. The full catalogue is fetched as the visitor approaches the library, or starts a library search. Books and learning materials remain on their original hosts. Source notes distinguish individually checked destinations from research entries verified through official metadata. The original catalogue inputs and audit records are kept in `learn/catalogue/`.

To refresh the source collections (network access required):

```sh
node scripts/collect-tutorials.mjs
node scripts/collect-open-books.mjs
python scripts/collect-papers.py --target 3500 --as-of YYYY-MM-DD
npm run catalogue:build
npm test
```

Use the actual review date in place of `YYYY-MM-DD`. The tutorial collector caches page metadata for one day; add `--refresh` to check it again. Paper collection uses the official Hugging Face Papers API with rate limiting and keeps canonical arXiv links. The build combines sources and selected recommendations, removes duplicate URLs, assigns stable bookmark IDs, and writes `library.json` plus the public `manifest.json` counts. Commit these generated files with the source changes when publishing an update. Review exclusions and provider terms before adding new collectors.

Book and course selections are in `learn/books.js` and `learn/resources.js`. Educational explanations and simulations are in `learn/concepts.js` and `learn/demos.js`. Simulations use small deterministic examples, with their simplifying assumptions shown alongside the controls. The learning site uses its own `garden.css`, `library.css`, and `demos.css`; it does not load the games or portfolio graphics engine.

## Games

**Rooftop Protocol** — cross a seven-building course and collect six signals. Each signal saves a checkpoint. Falling restores the last checkpoint and adds five seconds. Complete the course to record a best time.

**Resistance Zero** — survive three waves of security drones. Drones move, strafe, and fire when they have line of sight. Bullets respect cover. Clearing waves replenishes health and ammunition. Finish all three waves to secure the district.

Both are original browser demos inspired by parkour and tactical action, with textured environments, HDR lighting, dynamic shadows, a compass, radar, and optional synthesized audio. They are not affiliated with Assassin’s Creed, Ubisoft, Freedom Fighters, or IO Interactive.

### Controls

| Action                     | Desktop                                                            | Touch                        |
| -------------------------- | ------------------------------------------------------------------ | ---------------------------- |
| Move                       | WASD / arrow keys                                                  | Direction buttons            |
| Look                       | Mouse; drag if capture unavailable; IJKL as a keyboard alternative | Drag the view                |
| Sprint                     | Shift                                                              | Hold Sprint                  |
| Parkour jump / double jump | Space (press twice)                                                | Tap Jump twice               |
| Fire                       | Left mouse / hold Space                                            | Hold Fire                    |
| Aim                        | Right mouse                                                        | Aim using the center reticle |
| Reload                     | R                                                                  | Reload                       |
| Crouch                     | Hold C                                                             | Hold Crouch                  |
| Pause                      | Esc / P / pause button                                             | Pause button                 |

Modern WebGL 2 support is required for games. Browser pointer capture needs a user click. Game loops pause when the page loses focus, is hidden, or the experience closes. Graphics quality and sound are adjustable. High-quality rendering is intended for a computer with hardware acceleration; balanced quality uses fewer display pixels and disables shadows.

## GitHub Pages

GitHub Pages serves HTML, CSS, JavaScript, images, fonts, and other static assets. JavaScript, WebGL, games, animation, and localStorage run in the visitor’s browser, so **all features here work on GitHub Pages**. Server-side applications and secret API keys would require a separate backend.

The existing repository used the `gh-pages` branch root. Keep the existing Pages publishing configuration, or select the intended branch and `/(root)` under **Settings → Pages**. Deploy this folder’s contents, including `assets`, `css`, and `js`.

- `.nojekyll` is preserved.
- `CNAME` remains `shivjiagnihotri.tech`.
- All local asset paths are relative, supporting custom domains and project subpaths.
- No deployment or push is performed by the local preview.

## Source map

| File                     | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| `index.html`             | Semantic portfolio, content, and native dialogs                        |
| `css/style.css`          | Responsive portfolio styling                                           |
| `css/themes.css`         | Section colors, flowing backgrounds, and spring motion                 |
| `css/projects.css`       | Live project screenshot cards                                          |
| `css/ai-lab.css`         | Responsive AI diagrams and concept tabs                                |
| `css/arcade.css`         | Game menus, HUD, touch controls, and fullscreen                        |
| `js/main.js`             | Navigation, motion preference, project details, and lazy game loading  |
| `js/scene.js`            | Lightweight 2D projection of a 3D point sculpture                      |
| `js/portrait-mosaic.js`  | Procedural celestial garden and interactive focus mosaic              |
| `js/motion.js`           | Scroll reveal and offscreen animation management                      |
| `js/ai-lab.js`           | Accessible AI concept navigation                                      |
| `js/games.js`            | Input, player state, combat, missions, audio, and game lifecycle       |
| `js/worlds.js`           | Three.js environments, instanced architecture, drones, and view models |
| `js/physics.js`          | Player collision, jumping, and ray/cover intersection                  |
| `js/level-data.js`       | Shared rooftop course dimensions                                       |
| `tests/physics.test.mjs` | Physics checks and reachability of every rooftop jump                  |

See `assets/CREDITS.md` for third-party licenses. No proprietary game assets are included.
