import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private ctx: AudioContext | null = null;
  private musicActive = false;
  private musicTimer: any = null;
  private musicGainNode: GainNode | null = null;
  private activeMusicOscs: OscillatorNode[] = [];
  private masterVolume = 0.55;
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
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
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
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private getMusicGain(): GainNode {
    const ctx = this.getCtx();
    if (!this.musicGainNode) {
      this.musicGainNode = ctx.createGain();
      this.musicGainNode.gain.setValueAtTime(this.musicEnabled ? this.masterVolume : 0, ctx.currentTime);
      this.musicGainNode.connect(ctx.destination);
    }
    return this.musicGainNode;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, startDelay = 0) {
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

  private playGlide(freqStart: number, freqEnd: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, startDelay = 0) {
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
    this.playTone(880, 0.03, 'sine', 0.08);
  }

  playMenuClick() {
    this.playTone(587.33, 0.04, 'triangle', 0.16);
    this.playTone(880, 0.05, 'sine', 0.12, 0.02);
  }

  playMenuBack() {
    this.playGlide(587.33, 293.66, 0.08, 'sine', 0.14);
  }

  playShoot() {
    this.playGlide(600, 180, 0.1, 'triangle', 0.2);
  }

  playChargedShoot() {
    this.playGlide(880, 261.63, 0.16, 'triangle', 0.25);
    this.playTone(1046.5, 0.05, 'sine', 0.18);
  }

  playHit() {
    this.playGlide(180, 80, 0.15, 'triangle', 0.28);
    this.playTone(90, 0.12, 'sine', 0.22);
  }

  playBigHit() {
    this.playGlide(220, 60, 0.25, 'triangle', 0.35);
    this.playTone(80, 0.2, 'sine', 0.28);
  }

  playCoinReward() {
    this.playTone(987.77, 0.08, 'sine', 0.38);
    this.playTone(1318.51, 0.22, 'triangle', 0.42, 0.06);
    this.playTone(1760.00, 0.32, 'sine', 0.28, 0.12);
  }

  playCoinPenalty() {
    this.playGlide(380, 130, 0.28, 'sawtooth', 0.35);
    this.playTone(110, 0.22, 'triangle', 0.25, 0.08);
  }

  playStarCapture() {
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    fanfare.forEach((freq, idx) => this.playTone(freq, 0.14, 'triangle', 0.42, idx * 0.07));
    this.playTone(1567.98, 0.45, 'sine', 0.45, 0.35);
  }

  playCorrectAnswer() {
    this.playTone(523.25, 0.12, 'sine', 0.35);
    this.playTone(659.25, 0.12, 'sine', 0.35, 0.08);
    this.playTone(783.99, 0.14, 'triangle', 0.40, 0.16);
    this.playTone(1046.50, 0.35, 'triangle', 0.45, 0.24);
    this.playTone(1318.51, 0.40, 'sine', 0.30, 0.32);
  }

  playWrongAnswer() {
    this.playGlide(340, 160, 0.22, 'sawtooth', 0.35);
    this.playGlide(260, 110, 0.35, 'sawtooth', 0.38, 0.18);
  }

  playBoost() {
    this.playGlide(261.63, 880, 0.16, 'sine', 0.25);
  }

  playShield() {
    this.playTone(1046.5, 0.04, 'sine', 0.28);
    this.playTone(1318.5, 0.25, 'sine', 0.22, 0.02);
  }

  playShieldBlock() {
    this.playTone(783.99, 0.04, 'triangle', 0.24);
    this.playTone(587.33, 0.1, 'sine', 0.2, 0.02);
  }

  playDiceTick(step: number = 1) {
    const baseFreq = 520 + ((step * 42) % 280);
    this.playTone(baseFreq, 0.035, 'triangle', 0.22);
    this.playTone(baseFreq * 1.5, 0.02, 'sine', 0.14, 0.005);
  }

  playElimination() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => this.playTone(freq, 0.12, 'sine', 0.35, i * 0.07));
  }

  playLoseLife() {
    this.playGlide(440, 220, 0.18, 'triangle', 0.25);
    this.playGlide(370, 185, 0.18, 'triangle', 0.20, 0.14);
    this.playGlide(293, 146, 0.22, 'triangle', 0.18, 0.28);
  }

  playRespawn() {
    this.playGlide(261.63, 880, 0.2, 'sine', 0.28);
    this.playTone(659.25, 0.15, 'sine', 0.24, 0.16);
  }

  playVictory() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 1046.5];
    const durations = [0.1, 0.1, 0.1, 0.1, 0.35];
    let t = 0;
    melody.forEach((freq, i) => {
      this.playTone(freq, durations[i], 'sine', 0.38, t);
      t += durations[i] + 0.02;
    });
  }

  playDefeat() {
    this.playGlide(440, 110, 0.5, 'sine', 0.28);
  }

  startMenuMusic() {
    if (!this.musicEnabled) return;
    if (this.musicActive && this.currentTrack === 'menu') return;
    this.stopMusic();
    this.musicActive = true;
    this.currentTrack = 'menu';
    const mg = this.getMusicGain();
    if (this.ctx) {
      mg.gain.cancelScheduledValues(this.ctx.currentTime);
      mg.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
    this.runTrackLoop(() => this.runMenuMusic(), 3800);
  }

  startGameMusic(scenarioId: string = 'isla') {
    this.lastGameScenarioId = scenarioId;
    if (!this.musicEnabled) return;
    if (this.musicActive && this.currentTrack === 'game' && this.lastGameScenarioId === scenarioId) return;
    this.stopMusic();
    this.musicActive = true;
    this.currentTrack = 'game';
    const mg = this.getMusicGain();
    if (this.ctx) {
      mg.gain.cancelScheduledValues(this.ctx.currentTime);
      mg.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }

    if (scenarioId === 'sugar') {
      this.runTrackLoop(() => this.runSugarWaltz(), 3800);
    } else if (scenarioId === 'parque') {
      this.runTrackLoop(() => this.runParqueCarnival(), 3600);
    } else if (scenarioId === 'bosque') {
      this.runTrackLoop(() => this.runBosqueFantasy(), 4500);
    } else {
      this.runTrackLoop(() => this.runIslaCalypso(), 4200);
    }
  }

  private scheduleNote(freq: number, startTime: number, dur: number, wave: OscillatorType, vol: number, attack = 0.005, release = 0.04) {
    if (freq <= 0 || vol <= 0 || !this.musicActive) return;
    try {
      const ctx = this.getCtx();
      const musicGain = this.getMusicGain();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = wave;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + attack);
      gain.gain.setValueAtTime(vol, startTime + Math.max(attack, dur - release));
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(gain);
      gain.connect(musicGain);

      osc.start(startTime);
      osc.stop(startTime + dur + 0.01);

      this.activeMusicOscs.push(osc);
      osc.onended = () => {
        const idx = this.activeMusicOscs.indexOf(osc);
        if (idx !== -1) this.activeMusicOscs.splice(idx, 1);
      };
    } catch {}
  }

  private runTrackLoop(playFn: () => number, fallbackMs: number) {
    if (!this.musicActive || !this.musicEnabled) return;
    const durSec = playFn();
    const ms = durSec > 0 ? durSec * 1000 - 80 : fallbackMs;
    this.musicTimer = setTimeout(() => {
      if (this.musicActive) this.runTrackLoop(playFn, fallbackMs);
    }, Math.max(500, ms));
  }

  private playSequence(pattern: [number, number][], beat: number, wave: OscillatorType, vol: number): number {
    const ctx = this.getCtx();
    let t = ctx.currentTime;
    for (const [f, d] of pattern) {
      this.scheduleNote(f, t, d * beat * 0.88, wave, vol, 0.008, 0.04);
      t += d * beat;
    }
    return t - ctx.currentTime;
  }

  private runMenuMusic(): number {
    const notes: [number, number][] = [
      [523.25, 0.18], [659.25, 0.18], [783.99, 0.18], [1046.5, 0.36],
      [880, 0.18], [783.99, 0.18], [659.25, 0.36],
      [523.25, 0.18], [587.33, 0.18], [698.46, 0.18], [880, 0.36],
      [783.99, 0.18], [698.46, 0.18], [587.33, 0.36],
    ];
    return this.playSequence(notes, 1.0, 'triangle', 0.12);
  }

  private runIslaCalypso(): number {
    const melody: [number, number][] = [
      [523.25, 1], [659.25, 0.5], [0, 0.5], [783.99, 1], [880.00, 0.5], [783.99, 0.5],
      [659.25, 1], [587.33, 0.5], [0, 0.5], [698.46, 1], [659.25, 0.5], [523.25, 1],
    ];
    const bass: [number, number][] = [
      [130.81, 2], [130.81, 0.5], [0, 1.5], [98.00, 2], [98.00, 0.5], [0, 1.5],
      [87.31, 2], [87.31, 0.5], [0, 1.5], [130.81, 4],
    ];
    this.playSequence(bass, 0.46, 'triangle', 0.18);
    return this.playSequence(melody, 0.46, 'sine', 0.14);
  }

  private runSugarWaltz(): number {
    const melody: [number, number][] = [
      [0, 1], [987.77, 0.5], [1174.66, 0.5], [1318.51, 1], [0, 0.5], [1046.50, 0.5],
      [987.77, 1], [880.00, 0.5], [783.99, 0.5], [1046.50, 2], [0, 1],
      [0, 1], [880.00, 0.5], [1046.50, 0.5], [1174.66, 1], [0, 0.5], [1318.51, 0.5],
      [1046.50, 1], [987.77, 0.5], [0, 0.5], [880.00, 3],
    ];
    const bass: [number, number][] = [
      [392.00, 3], [392.00, 3], [349.23, 3], [392.00, 3],
      [349.23, 3], [349.23, 3], [261.63, 3], [392.00, 3],
    ];
    this.playSequence(bass, 0.235, 'triangle', 0.18);
    return this.playSequence(melody, 0.235, 'triangle', 0.14);
  }

  private runParqueCarnival(): number {
    const melody: [number, number][] = [
      [587.33, 1], [659.25, 0.5], [783.99, 1], [880.00, 0.5],
      [1046.50, 2], [880.00, 1], [783.99, 1],
      [659.25, 1], [783.99, 0.5], [880.00, 1], [783.99, 0.5],
      [659.25, 2], [587.33, 2],
    ];
    const bass: [number, number][] = [
      [196.00, 1], [0, 0.5], [196.00, 0.5], [220.00, 1], [0, 1],
      [261.63, 1], [0, 0.5], [261.63, 0.5], [196.00, 1], [0, 1],
      [164.81, 1], [0, 0.5], [164.81, 0.5], [196.00, 1], [0, 1],
      [146.83, 2], [196.00, 2],
    ];
    this.playSequence(bass, 0.22, 'triangle', 0.18);
    return this.playSequence(melody, 0.22, 'triangle', 0.15);
  }

  private runBosqueFantasy(): number {
    const melody: [number, number][] = [
      [659.25, 1.5], [783.99, 0.5], [880.00, 1], [1046.50, 1],
      [987.77, 2], [783.99, 1], [0, 1],
      [587.33, 1.5], [698.46, 0.5], [783.99, 1], [880.00, 1],
      [659.25, 3], [0, 1],
    ];
    const bass: [number, number][] = [
      [164.81, 3], [196.00, 1], [130.81, 3], [164.81, 1],
      [146.83, 3], [174.61, 1], [164.81, 4],
    ];
    this.playSequence(bass, 0.38, 'sine', 0.16);
    return this.playSequence(melody, 0.38, 'sine', 0.14);
  }

  stopMusic() {
    this.musicActive = false;
    this.currentTrack = null;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx) {
      try {
        if (this.musicGainNode) {
          this.musicGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
          this.musicGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        }
        for (const osc of this.activeMusicOscs) {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        }
        this.activeMusicOscs = [];
      } catch {}
    }
  }

  setMasterVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setValueAtTime(this.musicEnabled ? this.masterVolume : 0, this.ctx.currentTime);
    }
  }

  setSfxEnabled(v: boolean) {
    this.sfxEnabled = v;
  }

  setMusicEnabled(v: boolean) {
    this.musicEnabled = v;
    if (!v) {
      this.stopMusic();
    } else if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  playStartJingle() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => this.playTone(freq, 0.18, 'triangle', 0.45, idx * 0.08));
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