/**
 * Procedural Web Audio API sound generator for GlassLock 3D.
 * 100% procedural with zero external audio assets.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Sound when the key slides into the lock cylinder
   */
  public playKeySlide() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const dur = 0.28;

    // Buffer noise for metallic glide
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + dur);
    filter.Q.value = 4.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + dur);
  }

  /**
   * Sound when key completes insertion with a solid seated click
   */
  public playKeyInsertSeat() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Sound when key turns inside cylinder with ratchet friction
   */
  public playKeyTurn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Dual micro clicks
    [0, 0.04].forEach((offset, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 1420 : 1850, now + offset);
      osc.frequency.exponentialRampToValueAtTime(650, now + offset + 0.03);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.035);
    });
  }

  /**
   * Iconic mechanical padlock release spring POP
   */
  public playUnlockPop() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Sharp high metallic release snap
    const snapOsc = this.ctx.createOscillator();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(2600, now);
    snapOsc.frequency.exponentialRampToValueAtTime(650, now + 0.04);

    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(0.25, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.05);

    // 2. Heavy hollow metal body spring thud
    const thudOsc = this.ctx.createOscillator();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(320, now + 0.01);
    thudOsc.frequency.exponentialRampToValueAtTime(120, now + 0.18);

    const thudGain = this.ctx.createGain();
    thudGain.gain.setValueAtTime(0.35, now + 0.01);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    thudOsc.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thudOsc.start(now + 0.01);
    thudOsc.stop(now + 0.22);

    // 3. Shackle ringing resonance
    const ringOsc = this.ctx.createOscillator();
    ringOsc.type = 'triangle';
    ringOsc.frequency.setValueAtTime(1180, now + 0.03);
    ringOsc.frequency.exponentialRampToValueAtTime(1140, now + 0.35);

    const ringGain = this.ctx.createGain();
    ringGain.gain.setValueAtTime(0.12, now + 0.03);
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    ringOsc.connect(ringGain);
    ringGain.connect(this.ctx.destination);
    ringOsc.start(now + 0.03);
    ringOsc.stop(now + 0.35);
  }

  /**
   * Sound when shackle is pressed back in and clicks shut
   */
  public playLockShut() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(540, now);
    osc1.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.09);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1920, now + 0.01);
    osc2.frequency.exponentialRampToValueAtTime(800, now + 0.05);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.15, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.01);
    osc2.stop(now + 0.05);
  }

  /**
   * Individual tumbler pin click (for lockpick minigame or inspection)
   */
  public playTumblerClick(pitchMultiplier: number = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(900 * pitchMultiplier, now + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }
}

export const audioSynth = new AudioSynthesizer();
