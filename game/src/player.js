// Lantern Shadow — Rani, the night courier: runs, sneaks, tosses pebbles
// to distract guards, and collects moon seals.
import {
  PLAYER_RUN_SPEED,
  PLAYER_SNEAK_SPEED,
  PLAYER_RADIUS,
  NOISE_RUN_RADIUS,
  NOISE_SNEAK_RADIUS,
  PEBBLE_RANGE,
} from './config.js';

export class Player {
  constructor(level) {
    this.level = level;
    this.x = level.playerStart.x;
    this.y = level.playerStart.y;
    this.sneaking = false;
    this.alive = true;
    this.pebbles = level.pebbles;
    this.lastSeen = { x: this.x, y: this.y };
    this.stepTimer = 0;
    this.facing = 0;
  }

  reset(level) {
    this.level = level;
    this.x = level.playerStart.x;
    this.y = level.playerStart.y;
    this.sneaking = false;
    this.alive = true;
    this.pebbles = level.pebbles;
    this.lastSeen = { x: this.x, y: this.y };
  }

  update(dt, input, guards, sounds, onPebble) {
    if (!this.alive) return;
    const { x, y } = input.axis();
    this.sneaking = input.sneaking;
    const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_RUN_SPEED;
    if (x !== 0 || y !== 0) {
      this.facing = Math.atan2(y, x);
      this.level.moveCircle(this, x * speed * dt, y * speed * dt, PLAYER_RADIUS);
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        const nearest = guards.reduce(
          (best, g) => Math.min(best, Math.hypot(g.x - this.x, g.y - this.y)),
          9999,
        );
        sounds.footstep(!this.sneaking, nearest);
        this.stepTimer = this.sneaking ? 0.5 : 0.34;
        // Running is loud: every guard in earshot comes to look.
        const radius = this.sneaking ? NOISE_SNEAK_RADIUS : NOISE_RUN_RADIUS;
        for (const g of guards) g.hearNoise(this.x, this.y, radius);
      }
    }

    const click = input.takeClick();
    if (click && this.pebbles > 0) {
      const dx = click.x - this.x;
      const dy = click.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 12 && dist <= PEBBLE_RANGE) {
        this.pebbles -= 1;
        sounds.pebble();
        onPebble(click.x, click.y);
      }
    }

    // Pick up any moon seal underfoot.
    for (const seal of this.level.seals) {
      if (!seal.taken && Math.hypot(seal.x - this.x, seal.y - this.y) < 26) {
        seal.taken = true;
        this.level.sealsTaken += 1;
        sounds.pickup();
      }
    }
  }

  get sealsDone() {
    return this.level.sealsTaken >= this.level.sealsNeeded;
  }

  get atExit() {
    return (
      this.sealsDone &&
      Math.hypot(this.level.exit.x - this.x, this.level.exit.y - this.y) < 30
    );
  }
}
