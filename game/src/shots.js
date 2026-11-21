// Lantern Shadow — staged scenes for the entry's screenshots. Each one
// sets up a real, playable game state (positions, suspicion, seals) and
// freezes it, so the screenshot is a true render of the game's own code.
import { TILE } from './config.js';
import { GUARD_STATE } from './guard.js';

function at(tileX, tileY) {
  return { x: (tileX + 0.5) * TILE, y: (tileY + 0.5) * TILE };
}

// Cover: level 1 mid-play — Rani behind a crate, two guards with cones,
// a seal already taken, the green exit waiting on the right.
function stageCover(g) {
  g.loadLevel(0);
  const p = at(7, 9);
  g.player.x = p.x;
  g.player.y = p.y;
  g.player.sneaking = true;
  g.guards[0].x = at(22, 6).x;
  g.guards[0].y = at(22, 6).y;
  g.guards[0].dir = Math.PI;
  g.guards[0].suspicion = 38;
  g.guards[0].state = GUARD_STATE.SUSPICIOUS;
  g.guards[1].x = at(16, 13).x;
  g.guards[1].y = at(16, 13).y;
  g.guards[1].dir = -Math.PI / 2;
  g.level.seals[0].taken = true;
  g.level.sealsTaken = 1;
  g.state = 'playing';
  g.frozen = true;
}

// Patrol: level 2 — Rani flat in a shadow pool while a guard's cone
// sweeps past her, unnoticed.
function stagePatrol(g) {
  g.loadLevel(1);
  const p = at(2, 6);
  g.player.x = p.x;
  g.player.y = p.y;
  g.player.sneaking = true;
  g.guards[0].x = at(6, 5).x;
  g.guards[0].y = at(6, 5).y;
  g.guards[0].dir = Math.PI / 2;
  g.guards[0].suspicion = 16;
  g.state = 'playing';
  g.frozen = true;
}

// Alarm: level 1 — spotted at 100 suspicion, the guard is chasing,
// the cone is red and Rani has to break line of sight.
function stageAlarm(g) {
  g.loadLevel(0);
  const p = at(20, 4);
  g.player.x = p.x;
  g.player.y = p.y;
  g.player.lastSeen = { x: p.x, y: p.y };
  g.guards[0].x = at(22, 6).x;
  g.guards[0].y = at(22, 6).y;
  g.guards[0].dir = Math.atan2(p.y - at(22, 6).y, p.x - at(22, 6).x);
  g.guards[0].suspicion = 100;
  g.guards[0].state = GUARD_STATE.CHASE;
  g.state = 'playing';
  g.frozen = true;
}

// Win: level 1 cleared — the level-clear screen over the finished level.
function stageWin(g) {
  g.loadLevel(0);
  g.level.seals.forEach((s) => {
    s.taken = true;
  });
  g.level.sealsTaken = g.level.sealsNeeded;
  g.player.x = g.level.exit.x;
  g.player.y = g.level.exit.y;
  g.time = 84.3;
  g.state = 'levelClear';
  g.frozen = true;
}

export function applyShot(shot, game) {
  if (shot === 'cover') stageCover(game);
  else if (shot === 'patrol') stagePatrol(game);
  else if (shot === 'alarm') stageAlarm(game);
  else if (shot === 'win') stageWin(game);
  else return false;
  return true;
}
