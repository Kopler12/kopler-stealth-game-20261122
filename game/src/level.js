// Lantern Shadow — map parsing, tile collision and line of sight.
import { TILE } from './config.js';

export const WALL = '#';
export const CRATE = 'c';
export const BUSH = 'b';

// A tile blocks a guard's sight when it is a wall or solid cover.
function blocksSight(tile) {
  return tile === WALL || tile === CRATE || tile === BUSH;
}

function blocksMove(tile) {
  return tile === WALL || tile === CRATE || tile === BUSH;
}

export class Level {
  constructor(def) {
    this.name = def.name;
    this.tip = def.tip;
    this.sealsNeeded = def.sealsNeeded;
    this.pebbles = def.pebbles;
    this.guardDefs = def.guards;
    this.rows = def.map.length;
    this.cols = def.map[0].length;
    // Keep a mutable copy: seals are picked up, the rest never changes.
    this.tiles = def.map.map((row) => row.split(''));
    this.seals = [];
    this.playerStart = { x: 0, y: 0 };
    this.exit = { x: 0, y: 0 };
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const t = this.tiles[y][x];
        if (t === 'P') {
          this.playerStart = { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE };
          this.tiles[y][x] = '.';
        } else if (t === 'E') {
          this.exit = { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE };
          this.tiles[y][x] = '.';
        } else if (t === '*') {
          this.seals.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE, taken: false });
          this.tiles[y][x] = '.';
        } else if (t === 'G') {
          this.tiles[y][x] = '.';
        }
      }
    }
    this.sealsTaken = 0;
  }

  tileAtPixel(px, py) {
    const x = Math.floor(px / TILE);
    const y = Math.floor(py / TILE);
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return WALL;
    return this.tiles[y][x];
  }

  isShadow(px, py) {
    return this.tileAtPixel(px, py) === 's';
  }

  isLit(px, py) {
    return this.tileAtPixel(px, py) === 'l';
  }

  // Circle-vs-tile collision: try the move, slide along each axis in turn.
  moveCircle(pos, dx, dy, radius) {
    const nx = pos.x + dx;
    if (!this.circleHits(nx, pos.y, radius)) pos.x = nx;
    const ny = pos.y + dy;
    if (!this.circleHits(pos.x, ny, radius)) pos.y = ny;
  }

  circleHits(cx, cy, radius) {
    const x0 = Math.floor((cx - radius) / TILE);
    const x1 = Math.floor((cx + radius) / TILE);
    const y0 = Math.floor((cy - radius) / TILE);
    const y1 = Math.floor((cy + radius) / TILE);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return true;
        if (!blocksMove(this.tiles[y][x])) continue;
        const bx = Math.max(x * TILE, Math.min(cx, (x + 1) * TILE));
        const by = Math.max(y * TILE, Math.min(cy, (y + 1) * TILE));
        const ddx = cx - bx;
        const ddy = cy - by;
        if (ddx * ddx + ddy * ddy < radius * radius) return true;
      }
    }
    return false;
  }

  // Sampled line of sight: walls and cover block it.
  hasLineOfSight(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (blocksSight(this.tileAtPixel(ax + dx * t, ay + dy * t))) return false;
    }
    return true;
  }

  // Is the player standing where a guard's cone cannot reach at all:
  // directly behind a crate or bush, or inside a shadow pool the cone
  // does not cross? (Cover is handled by line of sight; this is only the
  // "fully hidden" hint used for the HUD.)
  playerHidden(px, py) {
    return this.isShadow(px, py);
  }
}
