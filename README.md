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
- Career history, all 20 existing credentials, research, education, and contact links.
- Motion toggle, reduced-motion support, native keyboard-accessible dialogs, mobile navigation, and clipboard feedback.
- Games load their engine, photographic PBR materials, and HDR environment only when launched. The landing page does not download the 3D engine.
- Local fonts, Three.js, textures, sky, and portrait: no runtime CDN dependency.
- No accounts, analytics, cookies, or server-side data storage. Motion preference and game bests use optional localStorage.

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
| `css/arcade.css`         | Game menus, HUD, touch controls, and fullscreen                        |
| `js/main.js`             | Navigation, motion preference, project details, and lazy game loading  |
| `js/scene.js`            | Lightweight 2D projection of a 3D point sculpture                      |
| `js/games.js`            | Input, player state, combat, missions, audio, and game lifecycle       |
| `js/worlds.js`           | Three.js environments, instanced architecture, drones, and view models |
| `js/physics.js`          | Player collision, jumping, and ray/cover intersection                  |
| `js/level-data.js`       | Shared rooftop course dimensions                                       |
| `tests/physics.test.mjs` | Physics checks and reachability of every rooftop jump                  |

See `assets/CREDITS.md` for third-party licenses. No proprietary game assets are included.
