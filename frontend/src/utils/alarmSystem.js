/**
 * RAKSHA AI 2.0 // BSF TACTICAL KLAXON & AUDIBLE ALARM SYSTEM
 * Generates authentic continuous dual-tone military intrusion warning sirens using Web Audio API.
 * The siren loops indefinitely upon human breach until an operator silences or acknowledges it.
 * 
 * FIXES:
 * - AudioContext created eagerly and resumed on every play attempt
 * - Siren volume boosted to 0.5 (was 0.35)
 * - Added second oscillator for a richer siren tone
 * - Better cleanup of audio nodes
 */

class TacticalAlarmSystem {
  constructor() {
    this.audioCtx = null;
    this.activeNodes = []; // Track all active oscillator/gain pairs
    this.isPlaying = false;
    this.isMuted = false;
    this.intervalId = null;
    this._userInteracted = false;
  }

  /** Create or resume the AudioContext */
  init() {
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      this._userInteracted = true;
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.isPlaying) {
      this.stop();
    }
  }

  /** Start continuous military siren — loops every 1s until stop() */
  startContinuousSiren() {
    if (this.isMuted) return;
    
    // Always ensure AudioContext is ready
    this.init();
    if (!this.audioCtx) return;

    // Already playing — don't restart
    if (this.isPlaying) return;

    // Clean stop any remnants
    this._cleanupNodes();
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isPlaying = true;

    const playWarbleCycle = () => {
      if (!this.isPlaying || this.isMuted || !this.audioCtx) return;

      // Re-check and resume if suspended (e.g. tab was backgrounded)
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
        return; // skip this cycle, retry next second
      }

      try {
        const now = this.audioCtx.currentTime;

        // Oscillator 1: Sawtooth warble (primary)
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(920, now);
        osc1.frequency.linearRampToValueAtTime(560, now + 0.25);
        osc1.frequency.linearRampToValueAtTime(920, now + 0.50);
        osc1.frequency.linearRampToValueAtTime(560, now + 0.75);
        osc1.frequency.linearRampToValueAtTime(920, now + 1.00);
        gain1.gain.setValueAtTime(0.01, now);
        gain1.gain.linearRampToValueAtTime(0.5, now + 0.04);
        gain1.gain.setValueAtTime(0.5, now + 0.96);
        gain1.gain.linearRampToValueAtTime(0.01, now + 1.00);
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 1.02);

        // Oscillator 2: Square wave sub-tone (adds urgency)
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(460, now);
        osc2.frequency.linearRampToValueAtTime(280, now + 0.25);
        osc2.frequency.linearRampToValueAtTime(460, now + 0.50);
        osc2.frequency.linearRampToValueAtTime(280, now + 0.75);
        osc2.frequency.linearRampToValueAtTime(460, now + 1.00);
        gain2.gain.setValueAtTime(0.01, now);
        gain2.gain.linearRampToValueAtTime(0.15, now + 0.04);
        gain2.gain.setValueAtTime(0.15, now + 0.96);
        gain2.gain.linearRampToValueAtTime(0.01, now + 1.00);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now);
        osc2.stop(now + 1.02);

        // Track for cleanup
        this.activeNodes.push(
          { osc: osc1, gain: gain1 },
          { osc: osc2, gain: gain2 }
        );

        // Auto-cleanup finished nodes after they stop
        osc1.onended = () => this._removeNode(osc1);
        osc2.onended = () => this._removeNode(osc2);
      } catch (err) {
        console.warn("Siren warble error:", err);
      }
    };

    // Play immediately and repeat every second
    playWarbleCycle();
    this.intervalId = setInterval(playWarbleCycle, 1000);
  }

  /** One-shot test siren (1.4 seconds) */
  testSiren() {
    this.isMuted = false;
    this.stop();
    this.init();
    if (!this.audioCtx) return;

    // Resume if suspended
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

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
      gain.gain.linearRampToValueAtTime(0.5, now + 0.04);
      gain.gain.setValueAtTime(0.5, now + 1.35);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.40);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.42);
    } catch (e) {
      console.warn("Test siren error:", e);
    }
  }

  /** Stop the continuous siren */
  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._cleanupNodes();
  }

  /** Internal: disconnect and remove all tracked oscillator/gain nodes */
  _cleanupNodes() {
    this.activeNodes.forEach(({ osc, gain }) => {
      try { osc.stop(); } catch (e) {}
      try { osc.disconnect(); } catch (e) {}
      try { gain.disconnect(); } catch (e) {}
    });
    this.activeNodes = [];
  }

  /** Internal: remove a specific oscillator after it ends naturally */
  _removeNode(osc) {
    this.activeNodes = this.activeNodes.filter(n => n.osc !== osc);
  }
}

export const alarmSystem = new TacticalAlarmSystem();
