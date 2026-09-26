# countdown

Full-screen countdown timer for kids, served at countdown.apphub.casa. A sibling
of [color](https://github.com/gunnaringe/color) and styled the same way.

- **No build:** the app is `public/index.html` (markup, CSS, JS inline) plus the
  PWA files next to it: `manifest.webmanifest`, `sw.js`, `icons/` and
  self-hosted Fredoka in `fonts/` (SIL OFL — keep `fonts/OFL.txt`). No build
  step, no dependencies, no framework, no third-party requests (so it works
  offline). Keep it that way.
- **Service worker:** the page is network-first (deploys show up on the next
  load), other files cache-first with background refresh. Bump `CACHE` in
  `sw.js` only when changing the precache list or strategy. Service workers
  don't run from `file://` — test over `python3 -m http.server` in `public/`.
- **Deploy:** Cloudflare Worker with static assets. `wrangler.jsonc` pins the
  Worker name `countdown` and the `countdown.apphub.casa` custom domain — never
  rename the Worker, the domain is bound to it. Only `public/` is uploaded.
  Workers Builds deploys on push to `main`. Agent sessions can't deploy by hand
  (Cloudflare credentials there are read-only).
- **Timer:** states are `idle` → `running` ⇄ `paused` → `done` (mirrored on
  `body[data-state]`, which drives the CSS). Time left is always computed from
  `endAt` (a `Date.now()` timestamp), never decremented. `requestAnimationFrame`
  only draws — the ring's `stroke-dasharray`/`-dashoffset` are set from JS, not
  a CSS animation, because the reduced-motion rule would make a CSS drain
  instant. Finishing has its own `setTimeout`, since rAF stops in hidden tabs.
- **Sound:** toggled by the speaker button in `#controls` (not in settings).
  The `AudioContext` is created/resumed in the tap or key press that starts the
  timer (`unlockAudio`); created later, iOS silently blocks it.
- **Time picks:** `current` (`{ seconds, name }`) is the timer that's set up;
  `reset()` and ↺ reuse it. `pick()` sets it and saves it as
  `settings.seconds`/`settings.name` so a reload keeps it — those aren't shown
  in settings. The buttons under the ring come from `settings.quick` (edited
  in settings, sorted by time, max `MAX_QUICK`) plus the custom button. One
  dialog (`openEditor`) edits both custom times and quick picks. Presets only
  show while idle. Names are user text — only ever `textContent`.
- **Share links:** "Share setup" encodes the settings into the URL fragment
  (format documented above `encode()`, same style as color's). A link is
  applied once at load — saved, then stripped with `history.replaceState` —
  with an Undo toast. Adding a setting means deciding whether it goes in the
  link; keep old links decoding (ignore unknown keys).
- **i18n:** all UI strings go in the `I18N` object (`no` and `en`) and are wired
  via `data-i18n` / `data-i18n-html` / `data-i18n-title` /
  `data-i18n-placeholder`.
- **Settings** persist in `localStorage` under `countdown-settings-v1`. `load()`
  merges stored settings over `defaults()`, so adding a new setting just needs a
  default; bump the key only for incompatible changes.
- **Style:** same as color — rounded font (Fredoka), circles and pills only, no
  square boxes or sharp corners, springy `--ease-pop` transitions. Shared CSS
  blocks (`.fab`, `.round`, `.pill`, `.switch`, `.segmented`, sheet, dialog)
  are copied from color; keep them in step if one side changes.
- **Testing:** serve `public/` with `python3 -m http.server` and drive it in
  headless Chromium via Playwright: run a short timer to done, check space
  pauses (time holds), tap resumes, `r`/↺ resets, preset taps don't start it,
  a custom time (typing `r`/space in its name field mustn't reset or start)
  survives ↺, and settings survive a reload.
