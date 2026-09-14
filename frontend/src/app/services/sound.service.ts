import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private ctx: AudioContext | null = null;
  private musicActive = false;
  private musicTimer: any = null;
  private masterVolume = 0.5;
  private sfxEnabled = true;
  private musicEnabled = true;
  private currentTrack: 'menu' | 'game' | null = null;
  private savedTrack: 'menu' | 'game' | null = null;
  private isMuted = false;
  private lastGameScenarioId = 'isla';

  constructor() {
    if (typeof window !== 'undefined') {
      const events = ['pointerdown', 'keydown', 'click', 'touchstart', 'pointermove'];
      const unlockAudio = () => {
        const ctx = this.getCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        events.forEach(evt => window.removeEventListener(evt, unlockAudio));
      };
      events.forEach(evt => window.addEventListener(evt, unlockAudio, { passive: true }));
    }
  }

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3,
    startDelay = 0,
  ) {
    if (!this.sfxEnabled) return;
    try {
      const ctx = this.getCtx();
      const startTime = ctx.currentTime + Math.max(0, startDelay);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume * this.masterVolume, startTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {}
  }

  private playGlide(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3,
    startDelay = 0,
  ) {
    if (!this.sfxEnabled) return;
    try {
      const ctx = this.getCtx();
      const startTime = ctx.currentTime + Math.max(0, startDelay);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, startTime);
      osc.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);

      gain.gain.setValueAtTime(volume * this.masterVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {}
  }

  playMenuHover() {
    this.playTone(880, 0.04, 'sine', 0.1);
  }

  playMenuClick() {
    this.playTone(440, 0.06, 'square', 0.15);
    this.playTone(660, 0.08, 'sine', 0.12, 0.03);
  }

  playMenuBack() {
    this.playGlide(440, 220, 0.1, 'sine', 0.15);
  }

  playShoot() {
    this.playGlide(700, 160, 0.12, 'square', 0.22);
  }

  playChargedShoot() {
    this.playGlide(1000, 220, 0.2, 'sawtooth', 0.3);
    this.playTone(1300, 0.06, 'sine', 0.2);
  }

  playHit() {
    this.playGlide(190, 75, 0.2, 'sawtooth', 0.35);
    this.playTone(95, 0.18, 'square', 0.25);
  }

  playBigHit() {
    this.playGlide(240, 50, 0.35, 'sawtooth', 0.45);
    this.playTone(80, 0.3, 'square', 0.3);
  }

  playCorrectAnswer() {
    this.playTone(523.25, 0.12, 'sine', 0.3);
    this.playTone(659.25, 0.12, 'sine', 0.3, 0.09);
    this.playTone(783.99, 0.2, 'sine', 0.35, 0.18);
  }

  playWrongAnswer() {
    this.playGlide(320, 90, 0.28, 'sawtooth', 0.3);
  }

  playBoost() {
    this.playGlide(220, 880, 0.18, 'sine', 0.25);
  }

  playShield() {
    this.playTone(1046.5, 0.05, 'sine', 0.3);
    this.playTone(1318.5, 0.35, 'sine', 0.2, 0.02);
  }

  playShieldBlock() {
    this.playTone(880, 0.05, 'square', 0.25);
    this.playTone(660, 0.12, 'sine', 0.2, 0.03);
  }

  playElimination() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.14, 'sine', 0.35, i * 0.08);
    });
  }

  playLoseLife() {
    this.playGlide(440, 220, 0.22, 'sawtooth', 0.3);
    this.playGlide(370, 185, 0.22, 'sawtooth', 0.25, 0.18);
    this.playGlide(293, 146, 0.3, 'sawtooth', 0.2, 0.36);
  }

  playRespawn() {
    this.playGlide(220, 880, 0.25, 'sine', 0.3);
    this.playTone(660, 0.18, 'sine', 0.25, 0.2);
  }

  playVictory() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 1046.5];
    const durations = [0.12, 0.12, 0.12, 0.12, 0.45];
    let t = 0;
    melody.forEach((freq, i) => {
      this.playTone(freq, durations[i], 'sine', 0.4, t);
      t += durations[i] + 0.03;
    });
  }

  playDefeat() {
    this.playGlide(440, 110, 0.6, 'sine', 0.3);
  }

  startMenuMusic() {
    if (!this.musicEnabled) return;
    if (this.musicActive && this.currentTrack === 'menu') return;
    this.stopMusic();
    this.musicActive = true;
    this.currentTrack = 'menu';
    this.runMenuLoop();
  }

  private runMenuLoop() {
    if (!this.musicActive || !this.musicEnabled) return;
    const ctx = this.getCtx();
    const t0 = ctx.currentTime;
    const notes: [number, number][] = [
      [523.25, 0.18], [659.25, 0.18], [783.99, 0.18], [1046.5, 0.36],
      [880, 0.18], [783.99, 0.18], [659.25, 0.36],
      [523.25, 0.18], [587.33, 0.18], [698.46, 0.18], [880, 0.36],
      [783.99, 0.18], [698.46, 0.18], [587.33, 0.36],
    ];
    let t = 0;
    for (const [freq, dur] of notes) {
      this.scheduleNote(freq, t0 + t, dur * 0.9, 'triangle', 0.10, 0.005, 0.04);
      t += dur;
    }
    this.musicTimer = setTimeout(() => {
      if (this.musicActive) this.runMenuLoop();
    }, Math.max(500, t * 1000 - 80));
  }

  startGameMusic(scenarioId: string = 'isla') {
    this.lastGameScenarioId = scenarioId;
    if (!this.musicEnabled) return;
    this.stopMusic();
    this.musicActive = true;
    this.currentTrack = 'game';

    if (scenarioId === 'sugar') {
      this.runSugarWaltz();
    } else if (scenarioId === 'galaxia') {
      this.runGalaxiaSynthwave();
    } else if (scenarioId === 'volcan') {
      this.runVolcanMarch();
    } else {
      this.runIslaCalypso();
    }
  }

  private scheduleNote(
    freq: number,
    startTime: number,
    dur: number,
    wave: OscillatorType,
    vol: number,
    attack = 0.005,
    release = 0.04,
  ) {
    if (freq <= 0 || vol <= 0) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol * this.masterVolume, startTime + attack);
      gain.gain.setValueAtTime(vol * this.masterVolume, startTime + dur - release);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + dur + 0.01);
    } catch {}
  }

  private runIslaCalypso() {
    if (!this.musicActive || !this.musicEnabled) return;
    const ctx = this.getCtx();
    const t0 = ctx.currentTime;
    const beat = 0.46;

    const melody = [
      [523.25, 1], [659.25, 0.5], [0, 0.5],
      [783.99, 1], [880.00, 0.5], [783.99, 0.5],
      [659.25, 1], [587.33, 0.5], [0, 0.5],
      [698.46, 1], [659.25, 0.5], [523.25, 1],
    ];
    const bass = [
      [130.81, 2], [130.81, 0.5], [0, 0.5], [0, 1],
      [98.00, 2], [98.00, 0.5], [0, 0.5], [0, 1],
      [87.31, 2], [87.31, 0.5], [0, 1.5],
      [98.00, 2], [130.81, 4],
    ];
    const chord = [
      [261.63, 4], [196.00, 4], [174.61, 4], [196.00, 4],
    ];

    let mt = t0;
    for (const [f, d] of melody) {
      this.scheduleNote(f, mt, (d as number) * beat * 0.85, 'sine', 0.13, 0.01, 0.06);
      mt += (d as number) * beat;
    }
    let bt = t0;
    for (const [f, d] of bass) {
      this.scheduleNote(f, bt, (d as number) * beat * 0.9, 'triangle', 0.16, 0.008, 0.05);
      bt += (d as number) * beat;
    }
    let ct = t0;
    for (const [f, d] of chord) {
      this.scheduleNote(f, ct, (d as number) * beat * 0.7, 'sine', 0.07, 0.02, 0.1);
      ct += (d as number) * beat;
    }
    const loopDur = Math.max(mt, bt, ct) - t0;
    this.musicTimer = setTimeout(() => {
      if (this.musicActive) this.runIslaCalypso();
    }, Math.max(500, loopDur * 1000 - 80));
  }

  private runSugarWaltz() {
    if (!this.musicActive || !this.musicEnabled) return;
    const ctx = this.getCtx();
    const t0 = ctx.currentTime;
    const beat = 0.235;

    const melody = [
      [0, 1], [987.77, 0.5], [1174.66, 0.5],
      [1318.51, 1], [0, 0.5], [1046.50, 0.5],
      [987.77, 1], [880.00, 0.5], [783.99, 0.5],
      [1046.50, 2], [0, 1],
      [0, 1], [880.00, 0.5], [1046.50, 0.5],
      [1174.66, 1], [0, 0.5], [1318.51, 0.5],
      [1046.50, 1], [987.77, 0.5], [0, 0.5],
      [880.00, 3],
    ];
    const bass = [
      [392.00, 3], [392.00, 3], [349.23, 3], [392.00, 3],
      [349.23, 3], [349.23, 3], [261.63, 3], [392.00, 3],
    ];
    const accomp = [
      [0, 1], [659.25, 1], [783.99, 1],
      [0, 1], [659.25, 1], [783.99, 1],
      [0, 1], [587.33, 1], [698.46, 1],
      [0, 1], [659.25, 1], [783.99, 1],
      [0, 1], [523.25, 1], [659.25, 1],
      [0, 1], [523.25, 1], [659.25, 1],
      [0, 1], [523.25, 1], [659.25, 1],
      [0, 1], [523.25, 1], [659.25, 1],
    ];

    let mt = t0;
    for (const [f, d] of melody) {
      this.scheduleNote(f, mt, (d as number) * beat * 0.88, 'triangle', 0.14, 0.005, 0.03);
      mt += (d as number) * beat;
    }
    let bt = t0;
    for (const [f, d] of bass) {
      this.scheduleNote(f, bt, (d as number) * beat * 0.4, 'triangle', 0.18, 0.005, 0.08);
      bt += (d as number) * beat;
    }
    let at = t0;
    for (const [f, d] of accomp) {
      this.scheduleNote(f, at, (d as number) * beat * 0.5, 'sine', 0.08, 0.005, 0.06);
      at += (d as number) * beat;
    }
    const loopDur = Math.max(mt, bt, at) - t0;
    this.musicTimer = setTimeout(() => {
      if (this.musicActive) this.runSugarWaltz();
    }, Math.max(500, loopDur * 1000 - 80));
  }

  private runGalaxiaSynthwave() {
    if (!this.musicActive || !this.musicEnabled) return;
    const ctx = this.getCtx();
    const t0 = ctx.currentTime;
    const beat = 0.25;

    const melody = [
      [0, 2], [293.66, 0.5], [349.23, 0.5], [440.00, 0.5], [0, 0.5],
      [523.25, 1.5], [440.00, 0.5], [0, 2],
      [0, 2], [261.63, 0.5], [329.63, 0.5], [392.00, 0.5], [0, 0.5],
      [466.16, 1.5], [392.00, 0.5], [0, 2],
    ];
    const bass = [
      [73.42, 0.5], [0, 0.5], [73.42, 0.5], [0, 0.5],
      [73.42, 0.5], [0, 0.5], [73.42, 0.5], [0, 0.5],
      [73.42, 0.5], [0, 0.5], [73.42, 0.5], [0, 0.5],
      [73.42, 0.5], [0, 0.5], [87.31, 0.5], [0, 0.5],
      [65.41, 0.5], [0, 0.5], [65.41, 0.5], [0, 0.5],
      [65.41, 0.5], [0, 0.5], [65.41, 0.5], [0, 0.5],
      [65.41, 0.5], [0, 0.5], [65.41, 0.5], [0, 0.5],
      [65.41, 0.5], [0, 0.5], [73.42, 0.5], [0, 0.5],
    ];
    const arpeggio = [
      [220, 0.25], [293.66, 0.25], [349.23, 0.25], [440, 0.25],
      [293.66, 0.25], [220, 0.25], [293.66, 0.25], [220, 0.25],
      [220, 0.25], [293.66, 0.25], [349.23, 0.25], [440, 0.25],
      [523.25, 0.5], [440, 0.5], [0, 1],
      [196, 0.25], [261.63, 0.25], [329.63, 0.25], [392, 0.25],
      [261.63, 0.25], [196, 0.25], [261.63, 0.25], [196, 0.25],
      [196, 0.25], [261.63, 0.25], [329.63, 0.25], [392, 0.25],
      [466.16, 0.5], [392, 0.5], [0, 1],
    ];

    let mt = t0;
    for (const [f, d] of melody) {
      this.scheduleNote(f, mt, (d as number) * beat * 0.92, 'sawtooth', 0.10, 0.02, 0.08);
      mt += (d as number) * beat;
    }
    let bt = t0;
    for (const [f, d] of bass) {
      this.scheduleNote(f, bt, (d as number) * beat * 0.85, 'sawtooth', 0.20, 0.005, 0.04);
      bt += (d as number) * beat;
    }
    let apt = t0;
    for (const [f, d] of arpeggio) {
      this.scheduleNote(f, apt, (d as number) * beat * 0.7, 'square', 0.06, 0.003, 0.02);
      apt += (d as number) * beat;
    }
    const loopDur = Math.max(mt, bt, apt) - t0;
    this.musicTimer = setTimeout(() => {
      if (this.musicActive) this.runGalaxiaSynthwave();
    }, Math.max(500, loopDur * 1000 - 80));
  }

  private runVolcanMarch() {
    if (!this.musicActive || !this.musicEnabled) return;
    const ctx = this.getCtx();
    const t0 = ctx.currentTime;
    const beat = 0.285;

    const melody = [
      [164.81, 0.5], [164.81, 0.25], [164.81, 0.25], [196.00, 0.5], [0, 0.5],
      [220.00, 0.5], [0, 0.25], [196.00, 0.25], [174.61, 0.5], [164.81, 0.5],
      [146.83, 0.5], [146.83, 0.25], [146.83, 0.25], [174.61, 0.5], [0, 0.5],
      [164.81, 2],
      [220.00, 0.5], [220.00, 0.25], [220.00, 0.25], [246.94, 0.5], [0, 0.5],
      [261.63, 0.5], [0, 0.25], [246.94, 0.25], [220.00, 0.5], [196.00, 0.5],
      [174.61, 0.5], [174.61, 0.25], [164.81, 0.25], [0, 0.5], [0, 0.5],
      [164.81, 2],
    ];
    const bass = [
      [55.00, 1], [0, 0.5], [55.00, 0.5], [0, 1], [0, 1],
      [55.00, 1], [0, 0.5], [55.00, 0.5], [0, 1], [0, 1],
      [41.20, 1], [0, 0.5], [41.20, 0.5], [0, 1], [0, 1],
      [55.00, 1], [0, 0.5], [55.00, 0.5], [0, 1], [0, 1],
    ];
    const snare = [
      [0, 1], [180, 0.08], [0, 0.92], [180, 0.08], [0, 0.92],
      [0, 1], [180, 0.08], [0, 0.92], [180, 0.08], [0, 0.92],
      [0, 1], [180, 0.08], [0, 0.92], [180, 0.08], [0, 0.92],
      [0, 1], [180, 0.08], [0, 0.42], [180, 0.08], [0, 0.42],
    ];

    let mt = t0;
    for (const [f, d] of melody) {
      this.scheduleNote(f, mt, (d as number) * beat * 0.88, 'square', 0.14, 0.005, 0.03);
      mt += (d as number) * beat;
    }
    let bt = t0;
    for (const [f, d] of bass) {
      this.scheduleNote(f, bt, (d as number) * beat * 0.7, 'square', 0.22, 0.005, 0.04);
      bt += (d as number) * beat;
    }
    let st = t0;
    for (const [f, d] of snare) {
      this.scheduleNote(f, st, (d as number) * beat * 0.9, 'sawtooth', 0.10, 0.002, 0.05);
      st += (d as number) * beat;
    }
    const loopDur = Math.max(mt, bt, st) - t0;
    this.musicTimer = setTimeout(() => {
      if (this.musicActive) this.runVolcanMarch();
    }, Math.max(500, loopDur * 1000 - 80));
  }

  stopMusic() {
    this.musicActive = false;
    this.currentTrack = null;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  setMasterVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
  }

  setSfxEnabled(v: boolean) {
    this.sfxEnabled = v;
  }

  setMusicEnabled(v: boolean) {
    this.musicEnabled = v;
    if (!v) this.stopMusic();
  }

  playStartJingle() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 0.18, 'triangle', 0.45, idx * 0.08);
    });
    this.playTone(1318.51, 0.4, 'sine', 0.4, 0.32);
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.savedTrack = this.currentTrack;
      this.stopMusic();
      this.sfxEnabled = false;
      this.musicEnabled = false;
    } else {
      this.sfxEnabled = true;
      this.musicEnabled = true;
      if (this.savedTrack === 'game') {
        this.startGameMusic(this.lastGameScenarioId);
      } else {
        this.startMenuMusic();
      }
    }
    return this.isMuted;
  }

  isAudioMuted(): boolean {
    return this.isMuted;
  }

  isMusicActive(): boolean {
    return this.musicActive;
  }
}