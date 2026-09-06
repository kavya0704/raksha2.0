/**
 * RAKSHA AI 2.0 // BSF TACTICAL KLAXON & AUDIBLE ALARM SYSTEM
 * Generates authentic continuous dual-tone military intrusion warning sirens using Web Audio API.
 * The siren loops indefinitely upon human breach until an operator silences or acknowledges it.
 */

class TacticalAlarmSystem {
  constructor() {
    this.audioCtx = null;
    this.osc1 = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.intervalId = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.isPlaying) {
      this.stop();
    }
  }

  startContinuousSiren() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    if (this.isPlaying) return; // Already sounding

    this.stop();

    try {
      this.isPlaying = true;

      const playWarbleCycle = () => {
        if (!this.isPlaying || this.isMuted || !this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(920, now);

        // 1-second rapid military warble
        osc.frequency.linearRampToValueAtTime(560, now + 0.25);
        osc.frequency.linearRampToValueAtTime(920, now + 0.50);
        osc.frequency.linearRampToValueAtTime(560, now + 0.75);
        osc.frequency.linearRampToValueAtTime(920, now + 1.00);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
        gain.gain.setValueAtTime(0.35, now + 0.95);
        gain.gain.linearRampToValueAtTime(0.01, now + 1.00);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 1.02);

        this.osc1 = osc;
        this.gainNode = gain;
      };

      // Play immediately and repeat every second until stopped
      playWarbleCycle();
      this.intervalId = setInterval(playWarbleCycle, 1000);
    } catch (err) {
      console.warn("Tactical alarm audio error:", err);
    }
  }

  testSiren() {
    this.isMuted = false;
    this.stop();
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.linearRampToValueAtTime(580, now + 0.35);
      osc.frequency.linearRampToValueAtTime(920, now + 0.70);
      osc.frequency.linearRampToValueAtTime(580, now + 1.05);
      osc.frequency.linearRampToValueAtTime(920, now + 1.40);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
      gain.gain.setValueAtTime(0.35, now + 1.35);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.40);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.42);
    } catch (e) {}
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.osc1) {
      try {
        this.osc1.stop();
        this.osc1.disconnect();
      } catch (e) {}
      this.osc1 = null;
    }
  }
}

export const alarmSystem = new TacticalAlarmSystem();
