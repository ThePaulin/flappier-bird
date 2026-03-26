# Agent Operating Guide
Last updated: 2026-03-26
Repository: /Volumes/T7 Shield/Files/Projects/VIBES/flappy_bird

## Mission
- Keep the arcade-style Flappy Bird clone fast, bug-free, and dependency-light.
- Preserve the single page footprint: `index.html` + `game.js`.
- Favor clarity and maintainability over micro-optimizations unless performance regresses.

## Project Layout
- `index.html`: hosts the canvas and inlined styling for display-only concerns.
- `game.js`: self-invoking bundle containing all gameplay, rendering, and input handlers.
- `package.json`: NPM configuration with Jest + jsdom for testing.
- `src/`: Modular source code (extracted from game.js for testability)
  - `constants.js`: Game configuration constants
  - `math.js`: Pure mathematical functions
  - `entities.js`: Entity factory functions
  - `gameState.js`: Core game logic class with dependency injection
  - `collision.js`: Collision detection system
  - `storage.js`: localStorage abstraction
- `tests/`: Comprehensive test suite
  - `unit/`: Unit tests
  - `integration/`: Integration tests
  - `performance/`: Performance tests
  - `mocks/`: Canvas, DOM, timer mocks
- `.github/workflows/test.yml`: CI/CD pipeline

## Runtime Assumptions
- Target browsers: evergreen Chromium, Firefox, Safari on desktop/mobile.
- Vector-style visuals rely on canvas 2D API; keep feature set ES2018-compatible.
- LocalStorage persists the high score under `flappyHighScore`; guard for privacy modes.

## Environment Setup
- No dependencies required; ensure a static file server is available for local testing.
- Recommended tooling: `npm install -g serve` or use `python3 -m http.server`.
- Keep assets under 1 MB total; avoid binary dependencies unless essential.

## Build and Serve Commands
- Launch lightweight dev server (recommended): `npx serve .`
- Alternative: `python3 -m http.server 8000`
- Open the game at `http://localhost:8000/index.html` (adjust port if needed).
- For live reload workflows, configure your own watcher (e.g., `browser-sync`), but document deviations.

## Linting Expectations
- No formal linter configured; emulate ESLint defaults: 2-space indent, semicolons, double quotes.
- Run `npx eslint game.js` only if you introduce a config; include `.eslintrc` with repo changes.
- Keep top-of-file banner comment updated when major refactors land.

## Testing Guidance
- Automated tests run via `npm test` using Jest + jsdom.
- Run `npm run test:coverage` to check code coverage (target: 80% lines, 70% branches).
- CI runs automatically on push/PR via GitHub Actions (`.github/workflows/test.yml`).
- Manual QA still recommended for visual/UX issues; use smoke checklist below.

## Manual Smoke Checklist (Run Every Change)
- Load the game and confirm canvas initializes without console errors.
- Verify bird flaps on spacebar, click, and touchstart.
- Test shooting with KeyF on desktop and right-side tap/hold on mobile.
- Confirm pipes spawn, score increments, and high score persists across reloads.
- Verify enemies spawn and fire bullets at the player.
- Test powerup spawning and collection (invincibility, multishot, score multiplier).
- Confirm health system: player takes damage from enemies/bullets, shows hearts UI.
- Verify invincibility flashing effect and temporary immunity after damage.
- Test multishot powerup creates 3-bullet spread pattern.
- Confirm score multiplier doubles points and shows "x2" in score display.
- Trigger a collision with pipes; ensure game transitions to Game Over with fade overlay.
- Take damage until health reaches zero; confirm death and game over.
- Restart via click/tap; confirm all state (health, powerups, enemies, bullets) resets properly.

## Single Test Equivalent
- Execute the smoke checklist sequence above start-to-finish.
- If automating, record an MPV script or Cypress run and link evidence in PRs.

## Coding Style: JavaScript
- File-scoped IIFE with `"use strict"` stays; new modules should respect existing pattern or justify ES module conversion.
- Constant configuration uses upper snake case (`PIPE_WIDTH`); runtime mutables use `camelCase`.
- One declaration per `const`/`let`; avoid chained comma declarations.
- Prefer early returns for guard clauses; keep nesting shallow.
- Export nothing globally; attach shared helpers internally or refactor to module pattern thoughtfully.

## Formatting Rules
- Indent two spaces; no tabs.
- Trailing commas only where ECMAScript allows and they aid diffs.
- Keep lines under ~100 chars; wrap arguments, not the function name.
- Yoda comparisons discouraged; compare `value === expected`.
- Comments use full sentences; prefer section dividers (`// --- Section ---`) where necessary.

## Imports and Dependencies
- Currently zero imports; bundler-free environment means new dependencies must be vanilla JS or inline modules.
- Before adding external scripts, confirm CDN reliability and document fallback.
- If migrating to modules, update `index.html` script tag to `type="module"` and note in this document.

## Types and Documentation
- Use JSDoc annotations sparingly for non-obvious helper signatures.
- Document units (`ms`, `px`, etc.) for magic numbers introduced.
- When changing physics constants, explain rationale near the declaration block.

## Naming Conventions
- Boolean flags use `is`, `has`, `should`.
- Functions use imperative verbs (`updateBird`, `drawGround`).
- Private helpers keep lowercase prefixes; avoid leading underscores.
- DOM refs start with nouns (`canvas`, `ctx`).

## State Management
- Centralize mutable state at top-level (`bird`, `pipes`, `score`); keep new state grouped there.
- Reset mutable structures inside `resetGame()` or analogous initializer.
- Avoid hidden globals; prefer closures and explicit parameters.

## Error Handling
- Wrap storage and platform-specific calls in `try/catch` like `loadHighScore`.
- Fail gracefully: if storage is inaccessible, continue with zero high score.
- Log to `console.error` only when unexpected failures occur; avoid noisy logs in normal flow.
- For async additions, use `catch` chains or `try/await` with user-visible fallbacks when appropriate.

## Rendering Practices
- Draw order matters: background -> pipes -> ground -> bird -> overlays.
- Keep paint operations batched; reuse gradients and styles when possible.
- Use `ctx.save()/ctx.restore()` around transformations.
- For new sprites, define palette constants near existing color block.

## Physics and Timing
- Maintain frame normalization via `(timestamp - lastTimestamp) / 16.667`.
- Cap delta to avoid spiral-of-death; adjust only with rationale.
- When altering gravity or flap strength, tune together to preserve difficulty curve.

## Input Handling
- Space, ArrowUp, and WASD should continue to flap; mirror for new controls.
- Prevent default on inputs to avoid page scrolling.
- Keep touchstart responsive; test on mobile simulators and physical devices when possible.

## Accessibility
- Maintain keyboard parity with pointer interactions.
- Provide descriptive title text and consider adding instructions in DOM for screen readers.
- When introducing audio, add mute toggles and respect reduced motion preferences.

## Performance Budget
- Keep frame budget under 16 ms; profile with Chrome DevTools when adding heavy logic.
- Debounce expensive computations; avoid allocating objects inside tight loops.
- Sprite drawing should reuse path objects where practical.

## Asset Strategy
- Favor programmatic shapes over bitmap assets to keep bundle light.
- If adding images, store under `assets/` and reference relative paths; compress aggressively.
- Document any new asset pipeline in this file.

## Browser Storage
- High score lives in `localStorage`; guard writes in try/catch.
- If expanding persistence, namespace keys under `flappy*`.
- Provide migration notes if formats change.

## Logging and Diagnostics
- Keep the console clean on successful runs.
- Use `console.info` sparingly for experimental instrumentation and remove before merging.
- Consider lightweight debug overlay toggled via query param when debugging physics.

## Git Workflow
- Feature branches recommended even without remote; keep commits scoped.
- Reference manual smoke checklist in commit message body when relevant.
- Do not commit generated assets unless reproducible via documented steps.

## Deployment Notes
- Static hosting friendly (GitHub Pages, Netlify Drop).
- Ensure `index.html` remains root entrypoint; no SPA router involved.
- When adding service workers, document cache strategy and offline testing steps.

## Cursor and Copilot Policies
- No `.cursor` or Copilot instruction files present as of 2026-03-26.
- If such rules are introduced, summarize them here verbatim in the next update.

## Update Checklist for Future Editors
- Review this guide after significant gameplay or tooling changes.
- Append new commands, configs, or style rules; keep obsolete guidance pruned.
- Re-run manual smoke checklist post-update to ensure accuracy.
- Tag the update with author and date at the top of the file.
