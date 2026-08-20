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
