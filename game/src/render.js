// Lantern Shadow — every pixel the player sees: the night town, lantern
// light and shadow pools, vision cones raycast against walls and cover,
// the guards, Rani, the seals, the gate, the HUD and the screens.
import { TILE, VIEW_W, VIEW_H, HUD_H, VISION_RANGE, VISION_HALF_ANGLE } from './config.js';
import { GUARD_STATE } from './guard.js';

export const OX = 80; // level's left edge on the canvas
export const OY = 64; // level's top edge on the canvas

export function toWorld(canvasX, canvasY) {
  return { x: canvasX - OX, y: canvasY - OY };
}

function blocksSightTile(t) {
  return t === '#' || t === 'c' || t === 'b';
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  // Cast one ray of a vision cone until a wall/cover stops it.
  rayLength(level, gx, gy, angle) {
    const step = 7;
    for (let d = step; d <= VISION_RANGE; d += step) {
      const x = gx + Math.cos(angle) * d;
      const y = gy + Math.sin(angle) * d;
      if (blocksSightTile(level.tileAtPixel(x, y))) return d - step;
    }
    return VISION_RANGE;
  }

  drawCone(level, guard) {
    const ctx = this.ctx;
    const gx = guard.x + OX;
    const gy = guard.y + OY;
    const chasing = guard.state === GUARD_STATE.CHASE;
    const rays = 26;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    for (let i = 0; i <= rays; i++) {
      const a = guard.dir - VISION_HALF_ANGLE + (2 * VISION_HALF_ANGLE * i) / rays;
      const len = this.rayLength(level, guard.x, guard.y, a);
      ctx.lineTo(gx + Math.cos(a) * len, gy + Math.sin(a) * len);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(gx, gy, 10, gx, gy, VISION_RANGE);
    if (chasing) {
      grad.addColorStop(0, 'rgba(255,64,64,0.58)');
      grad.addColorStop(1, 'rgba(255,64,64,0.08)');
    } else if (guard.suspicion >= 45) {
      grad.addColorStop(0, 'rgba(255,170,40,0.56)');
      grad.addColorStop(1, 'rgba(255,170,40,0.08)');
    } else {
      grad.addColorStop(0, 'rgba(255,214,90,0.52)');
      grad.addColorStop(1, 'rgba(255,214,90,0.07)');
    }
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = chasing
      ? 'rgba(255,90,90,0.5)'
      : 'rgba(255,220,110,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  drawLevel(level, player, guards, pebbleFx) {
    const ctx = this.ctx;
    ctx.fillStyle = '#0c0e1a';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Floor: two-tone cobbles, then shadow pools and lantern light.
    for (let y = 0; y < level.rows; y++) {
      for (let x = 0; x < level.cols; x++) {
        const t = level.tiles[y][x];
        const px = OX + x * TILE;
        const py = OY + y * TILE;
        if (t === '#') continue;
        ctx.fillStyle = (x + y) % 2 === 0 ? '#232742' : '#20233c';
        ctx.fillRect(px, py, TILE, TILE);
        if (t === 's') {
          ctx.fillStyle = 'rgba(10,14,40,0.55)';
          ctx.fillRect(px, py, TILE, TILE);
        } else if (t === 'l') {
          const g = ctx.createRadialGradient(
            px + TILE / 2, py + TILE / 2, 4, px + TILE / 2, py + TILE / 2, TILE * 0.9,
          );
          g.addColorStop(0, 'rgba(255,190,90,0.30)');
          g.addColorStop(1, 'rgba(255,190,90,0)');
          ctx.fillStyle = g;
          ctx.fillRect(px, py, TILE, TILE);
        }
      }
    }

    // Walls, crates and bushes.
    for (let y = 0; y < level.rows; y++) {
      for (let x = 0; x < level.cols; x++) {
        const t = level.tiles[y][x];
        const px = OX + x * TILE;
        const py = OY + y * TILE;
        if (t === '#') {
          ctx.fillStyle = '#3a3f5e';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = '#4d5380';
          ctx.fillRect(px, py, TILE, 6);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(px, py + TILE - 5, TILE, 5);
        } else if (t === 'c') {
          ctx.fillStyle = '#7a5a33';
          ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
          ctx.strokeStyle = '#5d4325';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
          ctx.beginPath();
          ctx.moveTo(px + 4, py + 4);
          ctx.lineTo(px + TILE - 4, py + TILE - 4);
          ctx.moveTo(px + TILE - 4, py + 4);
          ctx.lineTo(px + 4, py + TILE - 4);
          ctx.stroke();
        } else if (t === 'b') {
          ctx.fillStyle = '#2f6b3a';
          ctx.beginPath();
          ctx.arc(px + 12, py + 14, 13, 0, Math.PI * 2);
          ctx.arc(px + 27, py + 12, 12, 0, Math.PI * 2);
          ctx.arc(px + 20, py + 26, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3f8a4d';
          ctx.beginPath();
          ctx.arc(px + 15, py + 12, 6, 0, Math.PI * 2);
          ctx.arc(px + 26, py + 22, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Exit gate: green and glowing once every seal is collected.
    const ex = level.exit;
    const open = level.sealsTaken >= level.sealsNeeded;
    ctx.save();
    ctx.translate(OX + ex.x, OY + ex.y);
    ctx.fillStyle = open ? '#27c46b' : '#5a6274';
    ctx.fillRect(-17, -19, 34, 38);
    ctx.fillStyle = open ? '#a9f5c9' : '#8b93a5';
    ctx.fillRect(-11, -12, 22, 24);
    if (open) {
      ctx.strokeStyle = 'rgba(120,255,170,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-21, -23, 42, 46);
    }
    ctx.restore();
    ctx.fillStyle = open ? '#b8ffd4' : '#aab2c2';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(open ? 'EXIT — GO!' : 'EXIT (LOCKED)', OX + ex.x, OY + ex.y - 26);

    // Moon seals: glowing crescents.
    for (const seal of level.seals) {
      if (seal.taken) continue;
      const sx = OX + seal.x;
      const sy = OY + seal.y;
      const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, 24);
      glow.addColorStop(0, 'rgba(255,240,170,0.85)');
      glow.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0.6, Math.PI * 2 - 0.6);
      ctx.arc(sx + 5, sy - 2, 8, Math.PI * 2 - 0.6, 0.6, true);
      ctx.fill();
    }

    // Pebble landing ripples.
    for (const p of pebbleFx) {
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * p.life})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(OX + p.x, OY + p.y, 8 + (1 - p.life) * 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Vision cones under the actors.
    for (const g of guards) this.drawCone(level, g);

    // Guards: navy watchmen with a brass helmet and a facing tick.
    for (const g of guards) {
      const gx = OX + g.x;
      const gy = OY + g.y;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(gx, gy + 11, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = g.state === GUARD_STATE.CHASE ? '#a33327' : '#2c3a6e';
      ctx.beginPath();
      ctx.arc(gx, gy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d9a441';
      ctx.beginPath();
      ctx.arc(gx, gy - 3, 8, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(gx - 8, gy - 5, 16, 3);
      ctx.strokeStyle = '#ffd97a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + Math.cos(g.dir) * 20, gy + Math.sin(g.dir) * 20);
      ctx.stroke();
      // Suspicion eye above the guard.
      if (g.suspicion > 4) {
        const w = 30;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(gx - w / 2, gy - 34, w, 6);
        ctx.fillStyle = g.suspicion >= 100 ? '#ff4040' : g.suspicion >= 45 ? '#ffaa28' : '#ffd65a';
        ctx.fillRect(gx - w / 2, gy - 34, (w * g.suspicion) / 100, 6);
        if (g.suspicion >= 100) {
          ctx.fillStyle = '#ff4040';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('!', gx, gy - 38);
        }
      }
    }

    // Rani: a teal hooded courier; crouched and darker while sneaking.
    if (player.alive) {
      const px = OX + player.x;
      const py = OY + player.y;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(px, py + 11, 13, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = player.sneaking ? '#0f5f5a' : '#17a398';
      ctx.beginPath();
      ctx.arc(px, py, player.sneaking ? 11 : 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d8fff6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, (player.sneaking ? 11 : 13) + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#0b3d3a';
      ctx.beginPath();
      ctx.arc(px, py - 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(px + Math.cos(player.facing) * 4, py + Math.sin(player.facing) * 4 - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      if (level.isShadow(player.x, player.y)) {
        ctx.strokeStyle = 'rgba(140,170,255,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  drawHud(state) {
    const ctx = this.ctx;
    ctx.fillStyle = '#10132a';
    ctx.fillRect(0, 0, VIEW_W, HUD_H);
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏮 LANTERN SHADOW', 16, 28);
    ctx.fillStyle = '#c8cdea';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Level ${state.levelIndex + 1}/3 — ${state.levelName}`, 16, 50);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '15px sans-serif';
    ctx.fillText(`🌙 Seals  ${state.sealsTaken}/${state.sealsNeeded}`, 330, 30);
    ctx.fillText(`🪨 Pebbles  ${state.pebbles}`, 330, 52);
    ctx.fillText(`❤ Lives  ${state.lives}`, 480, 30);
    ctx.fillText(`⏱ ${state.timeText}`, 480, 52);
    // Suspicion bar: the most suspicious guard.
    const sus = state.maxSuspicion;
    ctx.fillStyle = '#c8cdea';
    ctx.fillText('Suspicion', 640, 30);
    ctx.fillStyle = '#262a45';
    ctx.fillRect(640, 38, 220, 12);
    ctx.fillStyle = sus >= 100 ? '#ff4040' : sus >= 45 ? '#ffaa28' : '#ffd65a';
    ctx.fillRect(640, 38, (220 * sus) / 100, 12);
    ctx.fillStyle = '#c8cdea';
    ctx.font = '13px sans-serif';
    ctx.fillText(state.statusLine, 900, 30);
    ctx.fillText(state.objective, 900, 52);
    ctx.fillStyle = '#3a3f5e';
    ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);
  }

  drawBanner(lines, color) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(8,10,24,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? color : '#e8eaf6';
      ctx.font = i === 0 ? 'bold 44px sans-serif' : '18px sans-serif';
      ctx.fillText(line.text, VIEW_W / 2, 300 + i * 44);
    });
  }

  drawTitle(bestTime) {
    this.drawBanner(
      [
        { text: '🏮 LANTERN SHADOW' },
        { text: 'The Night Courier — sneak past the watchmen, take the moon seals,' },
        { text: 'and reach the green gate unseen.' },
        { text: 'WASD / arrows to move · Shift to sneak · Click to toss a pebble' },
        { text: 'Press ENTER to begin' },
      ],
      '#ffd65a',
    );
    if (bestTime) {
      const ctx = this.ctx;
      ctx.fillStyle = '#9aa0c2';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Best clear: ${bestTime}`, VIEW_W / 2, 300 + 5 * 44);
    }
  }
}
