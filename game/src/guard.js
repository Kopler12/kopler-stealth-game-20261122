// Lantern Shadow — the watchman: patrols waypoints, watches a vision
// cone, grows suspicious, chases, and investigates noises and pebbles.
import {
  TILE,
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  VISION_RANGE,
  VISION_HALF_ANGLE,
} from './config.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  CHASE: 'chase',
  INVESTIGATE: 'investigate',
};

export class Guard {
  constructor(def, level) {
    this.level = level;
    this.waypoints = def.waypoints.map(([tx, ty]) => ({
      x: (tx + 0.5) * TILE,
      y: (ty + 0.5) * TILE,
    }));
    this.pauseTime = def.pause ?? 1;
    this.wpIndex = 0;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.dir = 0; // facing angle, radians
    this.state = GUARD_STATE.PATROL;
    this.suspicion = 0; // 0..100, shared with the player HUD
    this.pauseLeft = 0;
    this.chaseLost = 0;
    this.investigateTarget = null;
    this.stepTimer = 0;
    this.faceNextWaypoint();
  }

  faceNextWaypoint() {
    const next = this.waypoints[(this.wpIndex + 1) % this.waypoints.length];
    this.dir = Math.atan2(next.y - this.y, next.x - this.x);
  }

  // Can this guard see the player right now? Cone + range + line of sight.
  canSee(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > VISION_RANGE || dist < 1) return dist < 1;
    const angle = Math.atan2(dy, dx);
    let diff = angle - this.dir;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > VISION_HALF_ANGLE) return false;
    return this.level.hasLineOfSight(this.x, this.y, px, py);
  }

  hearNoise(px, py, radius) {
    const dist = Math.hypot(px - this.x, py - this.y);
    if (dist > radius) return;
    if (this.state === GUARD_STATE.CHASE) return;
    this.investigateTarget = { x: px, y: py };
    this.state = GUARD_STATE.INVESTIGATE;
  }

  // A pebble landing nearby pulls the guard to its landing spot.
  hearPebble(px, py) {
    const dist = Math.hypot(px - this.x, py - this.y);
    if (dist > 170) return;
    if (this.state === GUARD_STATE.CHASE) return;
    this.investigateTarget = { x: px, y: py };
    this.state = GUARD_STATE.INVESTIGATE;
    this.suspicion = Math.max(this.suspicion, 35);
  }

  update(dt, player, sounds) {
    const seen = this.canSee(player.x, player.y);
    if (seen && player.alive) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      let rate = 62 * (1.35 - dist / VISION_RANGE);
      if (this.level.isShadow(player.x, player.y)) rate *= 0.45;
      if (this.level.isLit(player.x, player.y)) rate *= 1.45;
      if (player.sneaking) rate *= 0.6;
      const before = this.suspicion;
      this.suspicion = Math.min(100, this.suspicion + rate * dt);
      if (Math.floor(this.suspicion / 25) !== Math.floor(before / 25)) sounds.tick();
      if (this.suspicion >= 100 && this.state !== GUARD_STATE.CHASE) {
        this.state = GUARD_STATE.CHASE;
        this.chaseLost = 0;
        sounds.alarm();
      } else if (this.suspicion >= 45 && this.state === GUARD_STATE.PATROL) {
        this.state = GUARD_STATE.SUSPICIOUS;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - 26 * dt);
      if (this.suspicion < 45 && this.state === GUARD_STATE.SUSPICIOUS) {
        this.state = GUARD_STATE.PATROL;
      }
    }

    if (this.state === GUARD_STATE.CHASE) {
      if (seen) {
        this.chaseLost = 0;
        this.moveToward(player.x, player.y, GUARD_CHASE_SPEED, dt);
      } else {
        this.chaseLost += dt;
        // Keep running to the last seen spot, then give up.
        this.moveToward(player.lastSeen.x, player.lastSeen.y, GUARD_CHASE_SPEED, dt);
        if (this.chaseLost > 3) {
          this.state = GUARD_STATE.PATROL;
          this.suspicion = 55;
        }
      }
      this.dir = Math.atan2(player.y - this.y, player.x - this.x);
      if (seen) player.lastSeen = { x: player.x, y: player.y };
    } else if (this.state === GUARD_STATE.INVESTIGATE) {
      const t = this.investigateTarget;
      const arrived = this.moveToward(t.x, t.y, GUARD_PATROL_SPEED * 1.35, dt);
      this.dir = Math.atan2(t.y - this.y, t.x - this.x);
      if (arrived) {
        this.pauseLeft = 1.6;
        this.state = GUARD_STATE.PATROL;
        this.investigateTarget = null;
        this.faceNextWaypoint();
      }
    } else {
      // Patrol: walk to the next waypoint, pause, turn, repeat.
      if (this.pauseLeft > 0) {
        this.pauseLeft -= dt;
        if (this.pauseLeft <= 0) this.faceNextWaypoint();
      } else {
        const next = this.waypoints[(this.wpIndex + 1) % this.waypoints.length];
        const arrived = this.moveToward(next.x, next.y, GUARD_PATROL_SPEED, dt);
        this.dir = Math.atan2(next.y - this.y, next.x - this.x);
        if (arrived) {
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
          this.pauseLeft = this.pauseTime;
        }
      }
    }

    // Footsteps: louder the closer the guard is to the player.
    this.stepTimer -= dt;
    if (this.stepTimer <= 0 && (this.state === GUARD_STATE.CHASE || this.state === GUARD_STATE.PATROL)) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      if (dist < 320) sounds.footstep(false, dist);
      this.stepTimer = this.state === GUARD_STATE.CHASE ? 0.34 : 0.55;
    }
  }

  // Walk toward a point, sliding along walls. Returns true on arrival.
  moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) return true;
    const step = Math.min(dist, speed * dt);
    this.level.moveCircle(this, (dx / dist) * step, (dy / dist) * step, 14);
    return Math.hypot(tx - this.x, ty - this.y) < 8;
  }
}
