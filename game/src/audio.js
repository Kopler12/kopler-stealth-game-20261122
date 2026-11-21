// Lantern Shadow — every sound is synthesized with WebAudio: no files,
// no network. Footsteps, pebble tosses, suspicion ticks, the alarm sting,
// seal chimes and the win arpeggio.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  unlock() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      /* sound is decoration; a failure never stops the game */
    }
  }

  // A short filtered thud: a footstep. Volume falls with distance.
  footstep(running, distance) {
    if (!this.ctx || this.muted) return;
    const vol = Math.max(0.02, 0.22 * (1 - distance / 420)) * (running ? 1 : 0.55);
    this.tone(running ? 95 : 80, 0.07, 'sine', vol, 0, 55);
  }

  pebble() {
    this.tone(1400, 0.05, 'triangle', 0.12, 0, 900);
    this.tone(700, 0.06, 'sine', 0.1, 0.12, 420);
  }

  tick() {
    this.tone(1180, 0.05, 'square', 0.05);
  }

  pickup() {
    this.tone(660, 0.12, 'sine', 0.16);
    this.tone(990, 0.18, 'sine', 0.16, 0.09);
  }

  alarm() {
    this.tone(392, 0.16, 'sawtooth', 0.14);
    this.tone(523, 0.16, 'sawtooth', 0.14, 0.16);
    this.tone(392, 0.2, 'sawtooth', 0.14, 0.32);
  }

  caught() {
    this.tone(220, 0.3, 'sawtooth', 0.16, 0, 110);
    this.tone(110, 0.45, 'sawtooth', 0.14, 0.25, 55);
  }

  levelClear() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.15, i * 0.11));
  }

  gameWin() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      this.tone(f, 0.3, 'triangle', 0.15, i * 0.13),
    );
  }
}
