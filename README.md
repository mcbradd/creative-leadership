# Bradd + Stone — Creative Leadership

An interactive executive one-pager presenting Bradd McBrearty and Stone Perales as a creative leadership team for games, brands, and entertainment.

## Local development

```bash
npm install
npm run dev
```

First run only, for the screenshot and accessibility tooling:

```bash
npx playwright install chromium
```

## Verification

```bash
npm test
npm run test:a11y
npm run lint
npm run build
```

## Visual iteration

```bash
npm run shots            # screenshots across four viewports → outputs/
npm run shots:cinematic  # the WebGL hero at each scroll phase
npm run visual-diff      # compare against outputs/baseline
npm run review           # Claude art-direction critique (needs ANTHROPIC_API_KEY)
```

Production builds use `/creative-leadership/` as the base path for GitHub Pages. The page deliberately carries `noindex`, `nofollow`, and `noarchive` directives until the positioning is approved for search visibility.

## Interactive classroom

The independent Three.js experience lives at `/classroom/` in development and `/creative-leadership/classroom/` on GitHub Pages. It opens inside the classroom. Use the mobile joystick to walk while dragging elsewhere to look; desktop users can use WASD to walk and arrow keys or drag to look. Furniture and room bounds block movement. A floor plan tracks position; front-row and reading-corner presets relocate the camera. Movement pauses while discovery panels are open and stops when input is interrupted. Phone orientation changes preserve position. The optional Room overview retains orbit and pinch-to-zoom. Three lighting moods, a changing chalkboard, a globe, and an audio bell work on desktop and mobile. The root portfolio remains its own entry point.

Run `npm run test:classroom` for collision, keyboard, simultaneous touch movement/look, orientation, discovery, and accessibility checks. It starts its own local server; set `CLASSROOM_URL` to check a deployed build. Mobile screenshots and tests use a phone viewport, not physical-device performance certification.
