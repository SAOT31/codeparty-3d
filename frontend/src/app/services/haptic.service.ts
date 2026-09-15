import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HapticService {
  private isSupported = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isSupported = 'vibrate' in navigator;
    }
  }

  lightImpact() {
    if (!this.isSupported) return;
    try {
      navigator.vibrate(30);
    } catch {}
  }

  diceStop() {
    if (!this.isSupported) return;
    try {
      navigator.vibrate([40, 30, 60]);
    } catch {}
  }

  success() {
    if (!this.isSupported) return;
    try {
      navigator.vibrate([40, 50, 80]);
    } catch {}
  }

  error() {
    if (!this.isSupported) return;
    try {
      navigator.vibrate([120, 60, 120]);
    } catch {}
  }

  starCelebration() {
    if (!this.isSupported) return;
    try {
      navigator.vibrate([60, 40, 60, 40, 120, 60, 200]);
    } catch {}
  }

  skillUse() {
    if (!this.isSupported) return;
    try {
      navigator.vibrate([80, 40, 100]);
    } catch {}
  }
}
