// Lantern Shadow — the game loop, states, and wiring. Title, playing,
// paused, caught, level clear, game win and game over; plus the staged
// screenshot mode (?shot=cover|patrol|alarm|win).
import { LEVELS, VIEW_W, VIEW_H } from './config.js';
import { Level } from './level.js';
import { Guard, GUARD_STATE } from './guard.js';
import { Player } from './player.js';
import { Input, } from './input.js';
import { SoundBank } from './audio.js';
import { Renderer, toWorld } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const sounds = new SoundBank();

const game = {
  state: 'title',
  levelIndex: 0,
  level: null,
  player: null,
  guards: [],
  lives: 3,
  time: 0,
  totalTime: 0,
  pebbleFx: [],
  frozen: false,
  overlayTimer: 0,
  bestTime: null,
  muted: false,
};

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

game.loadLevel = function loadLevel(index) {
  this.levelIndex = index;
  this.level = new Level(LEVELS[index]);
  this.player = new Player(this.level);
  this.guards = this.level.guardDefs.map((def) => new Guard(def, this.level));
  this.pebbleFx = [];
};

function startGame() {
  game.lives = 3;
  game.totalTime = 0;
  game.time = 0;
  game.loadLevel(0);
  game.state = 'playing';
  sounds.unlock();
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.state = 'gameWin';
    game.bestTime = formatTime(game.totalTime + game.time);
    sounds.gameWin();
  } else {
    game.totalTime += game.time;
    game.time = 0;
    game.loadLevel(game.levelIndex + 1);
    game.state = 'playing';
    sounds.levelClear();
  }
}

function onCaught() {
  game.lives -= 1;
  sounds.caught();
  game.state = game.lives <= 0 ? 'gameOver' : 'caught';
  game.overlayTimer = 1.8;
}

function onPebble(x, y) {
  game.pebbleFx.push({ x, y, life: 1 });
  for (const g of game.guards) g.hearPebble(x, y);
}

function maxSuspicion() {
  return game.guards.reduce((m, g) => Math.max(m, g.suspicion), 0);
}

function update(dt) {
  if (game.state === 'caught') {
    game.overlayTimer -= dt;
    if (game.overlayTimer <= 0) {
      game.loadLevel(game.levelIndex);
      game.state = 'playing';
    }
    return;
  }
  if (game.state !== 'playing') return;
  game.time += dt;
  const click = input.click;
  if (click) {
    // Convert the canvas click into level coordinates for the pebble.
    const w = toWorld(click.x, click.y);
    input.click = { x: w.x, y: w.y };
  }
  game.player.update(dt, input, game.guards, sounds, onPebble);
  for (const g of game.guards) g.update(dt, game.player, sounds);
  for (const p of game.pebbleFx) p.life -= dt * 0.8;
  game.pebbleFx = game.pebbleFx.filter((p) => p.life > 0);

  // Caught: a guard gets within arm's reach.
  for (const g of game.guards) {
    if (Math.hypot(g.x - game.player.x, g.y - game.player.y) < 24) {
      onCaught();
      return;
    }
  }
  if (game.player.atExit) {
    game.state = 'levelClear';
    game.overlayTimer = 2.4;
    sounds.levelClear();
  }
}

function render() {
  const ctx = renderer.ctx;
  if (game.state === 'title') {
    renderer.drawLevel(game.level, game.player, game.guards, game.pebbleFx);
    renderer.drawHud(hudState());
    renderer.drawTitle(game.bestTime);
    return;
  }
  renderer.drawLevel(game.level, game.player, game.guards, game.pebbleFx);
  renderer.drawHud(hudState());
  if (game.state === 'levelClear') {
    const last = game.levelIndex + 1 >= LEVELS.length;
    renderer.drawBanner(
      [
        { text: last ? '👑 ALL LEVELS CLEAR!' : '🌙 LEVEL CLEAR!' },
        { text: `${game.level.name} — ${formatTime(game.time)} · Seals ${game.level.sealsTaken}/${game.level.sealsNeeded}` },
        { text: last ? 'Rani slips into the night, unseen.' : 'Press ENTER for the next level' },
      ],
      '#7dffb0',
    );
  } else if (game.state === 'caught') {
    renderer.drawBanner(
      [
        { text: '🚨 CAUGHT!' },
        { text: `A watchman grabbed Rani. Lives left: ${game.lives}` },
        { text: 'Watch the cones. Hide in shadow. Toss pebbles to distract.' },
      ],
      '#ff5a5a',
    );
  } else if (game.state === 'gameOver') {
    renderer.drawBanner(
      [
        { text: '🌑 THE NIGHT ENDS' },
        { text: 'Out of lives. The watchmen win this time.' },
        { text: 'Press ENTER to try again' },
      ],
      '#ff5a5a',
    );
  } else if (game.state === 'gameWin') {
    renderer.drawBanner(
      [
        { text: '👑 THE NIGHT COURIER' },
        { text: `Every seal delivered in ${game.bestTime} — and nobody saw a thing.` },
        { text: 'Press ENTER to play again' },
      ],
      '#ffd65a',
    );
  } else if (game.state === 'paused') {
    renderer.drawBanner(
      [{ text: '⏸ PAUSED' }, { text: 'Press P to keep sneaking' }],
      '#c8cdea',
    );
  }
  // The "SPOTTED" shout across the top of the screen.
  if (game.state === 'playing') {
    const chasing = game.guards.some((g) => g.state === GUARD_STATE.CHASE);
    if (chasing) {
      ctx.fillStyle = '#ff4040';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ SPOTTED — BREAK LINE OF SIGHT! ⚠', VIEW_W / 2, 110);
    }
    // The level's tip, as a pill over the bottom wall for the first seconds.
    if (game.time < 7) {
      const tip = game.level.tip;
      ctx.font = '15px sans-serif';
      const w = ctx.measureText(tip).width + 28;
      ctx.fillStyle = 'rgba(8,10,24,0.82)';
      ctx.beginPath();
      ctx.roundRect(VIEW_W / 2 - w / 2, 756, w, 30, 15);
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.textAlign = 'center';
      ctx.fillText(tip, VIEW_W / 2, 776);
    }
  }
}

function hudState() {
  const sus = maxSuspicion();
  const chasing = game.guards.some((g) => g.state === GUARD_STATE.CHASE);
  const suspicious = game.guards.some((g) => g.suspicion >= 45);
  const hidden = game.level.isShadow(game.player.x, game.player.y);
  return {
    levelIndex: game.levelIndex,
    levelName: game.level.name,
    sealsTaken: game.level.sealsTaken,
    sealsNeeded: game.level.sealsNeeded,
    pebbles: game.player.pebbles,
    lives: game.lives,
    timeText: formatTime(game.time),
    maxSuspicion: sus,
    statusLine: chasing
      ? '🚨 SPOTTED — run!'
      : suspicious
        ? '👁 A guard is suspicious…'
        : hidden
          ? '🌑 Hidden in shadow'
          : '✓ Unseen',
    objective: game.player.sealsDone
      ? 'All seals — reach the green gate!'
      : `Collect ${game.level.sealsNeeded} seals, then the gate`,
  };
}

input.onKey = (key) => {
  sounds.unlock();
  if (key === 'm') {
    game.muted = sounds.toggleMute();
    return;
  }
  if (key === 'enter') {
    if (game.state === 'title' || game.state === 'gameOver' || game.state === 'gameWin') {
      startGame();
    } else if (game.state === 'levelClear') {
      if (game.levelIndex + 1 >= LEVELS.length) startGame();
      else nextLevel();
    }
    return;
  }
  if (key === 'r' && (game.state === 'playing' || game.state === 'paused')) {
    game.loadLevel(game.levelIndex);
    game.state = 'playing';
    return;
  }
  if ((key === 'p' || key === 'escape') && game.state === 'playing') {
    game.state = 'paused';
    return;
  }
  if ((key === 'p' || key === 'escape') && game.state === 'paused') {
    game.state = 'playing';
  }
};

function announce() {
  if (!statusLine) return;
  const s = hudState();
  statusLine.textContent =
    `Level ${game.levelIndex + 1}, ${game.level.name}. ` +
    `Seals ${s.sealsTaken} of ${s.sealsNeeded}. ${s.statusLine}`;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) {
    if (game.state === 'levelClear') {
      game.overlayTimer -= dt;
      if (game.overlayTimer <= 0) nextLevel();
    } else {
      update(dt);
    }
  }
  render();
  announce();
  requestAnimationFrame(frame);
}

// Boot: a quiet title scene behind the menu, or a staged screenshot.
game.loadLevel(0);
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot && applyShot(shot, game)) {
  document.title = `Lantern Shadow — shot ${shot}`;
} else {
  game.state = 'title';
}
requestAnimationFrame(frame);
