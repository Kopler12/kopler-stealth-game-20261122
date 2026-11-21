[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

# Lantern Shadow — The Night Courier

A complete top-down stealth game that runs offline in a desktop browser from
static files. You are Rani, a night courier in the lantern-lit old town of
Kertajaya. Slip past the watchmen, collect every moon seal, and reach the
green gate without ever being seen.

## How to play

Open `game/index.html` in desktop Chrome, or run `node serve.ts` and open
http://localhost:8080. No build step, no network request: all art is drawn on
canvas and all sound is synthesized with WebAudio.

- **Move:** WASD or arrow keys. **Sneak (slow + quiet):** hold Shift.
- **Distract:** click the mouse to toss a pebble (3 per level). Guards nearby
  go investigate where it lands.
- **Collect:** walk over every moon seal, then reach the green exit gate.
- **Hide:** stay out of the yellow vision cones. Crates and bushes block a
  guard's sight. Dark shadow pools slow detection; lantern light speeds it up.
- **Detection:** the eye above a guard fills as he grows suspicious. At full
  he raises the alarm and chases you — break line of sight to slip away.
- **Restart level:** R. **Mute:** M. **Pause:** P or Esc.

## The game

- 3 hand-built levels: Lantern Alley, The Old Bazaar, and Moon Gate — each
  with its own patrol routes, cover layout, and light/shadow puzzle.
- Guards with patrol waypoints, vision cones with real line-of-sight, a
  suspicion meter that gives you a chance to recover, chase and
  investigate behaviours, and footsteps you can hear getting closer.
- Score, timer, lives, level-clear and game-win screens, and a staged
  screenshot mode (`?shot=cover|patrol|alarm|win`) used for the entry's
  screenshots.

## Layout

- `game/index.html` — the page and canvas
- `game/src/config.js` — levels, tiles, tuning
- `game/src/level.js` — map parsing, collision, line of sight
- `game/src/guard.js` — patrol, vision, suspicion, chase
- `game/src/player.js` — movement, sneaking, pebble throws
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized footsteps, alerts, chimes
- `game/src/render.js` — all canvas drawing, cones, HUD
- `game/src/shots.js` — staged scenes for screenshots
- `game/src/main.js` — game loop and states
- `main.ts` — hands the game, screenshots and dossier to make.fun
- `serve.ts` — tiny local static server for play-testing

## License

MIT — see `LICENSE`.
