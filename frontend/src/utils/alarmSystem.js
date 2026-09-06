/**
 * RAKSHA AI 2.0 // BSF TACTICAL KLAXON & AUDIBLE ALARM SYSTEM
 * Generates authentic dual-tone military intrusion warning sirens using Web Audio API.
 * Ensures zero external MP3 dependencies, instant sub-millisecond response, and browser compatibility.
 */

class TacticalAlarmSystem {
  constructor() {
    this.audioCtx = null;
    this.osc1 = null;
    this.osc2 = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.stopTimeout = null;
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

  playHumanBreachAlarm(durationSeconds = 4.5) {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    // Reset previous oscillator if running
    this.stop();

    try {
      const now = this.audioCtx.currentTime;
      
      // Dual-frequency warble military siren (intruder alert)
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, now);

      // Warble modulation (rapid high/low military oscillation)
      const step = 0.22;
      for (let t = 0; t < durationSeconds; t += step * 2) {
        osc.frequency.linearRampToValueAtTime(580, now + t + step);
        osc.frequency.linearRampToValueAtTime(920, now + t + (step * 2));
      }

      // Attack and Decay Envelope
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
      gain.gain.setValueAtTime(0.35, now + durationSeconds - 0.2);
      gain.gain.linearRampToValueAtTime(0.001, now + durationSeconds);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + durationSeconds);

      this.osc1 = osc;
      this.gainNode = gain;
      this.isPlaying = true;

      if (this.stopTimeout) clearTimeout(this.stopTimeout);
      this.stopTimeout = setTimeout(() => {
        this.isPlaying = false;
      }, durationSeconds * 1000);
    } catch (err) {
      console.warn("Tactical alarm audio error:", err);
    }
  }

  testSiren() {
    this.isMuted = false;
    this.playHumanBreachAlarm(2.2);
  }

  stop() {
    if (this.osc1) {
      try {
        this.osc1.stop();
        this.osc1.disconnect();
      } catch (e) {}
      this.osc1 = null;
    }
    this.isPlaying = false;
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
  }
}

export const alarmSystem = new TacticalAlarmSystem();
