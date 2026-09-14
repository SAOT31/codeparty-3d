import { Injectable } from '@angular/core';
import * as THREE from 'three';

export interface BotState {
  id: string;
  nickname: string;
  color: string;
  health: number;
  score: number;
  stars?: number;
  tileIndex?: number;
  position: THREE.Vector3;
  rotation: number;
  connected: boolean;
  isBot: true;
}

@Injectable({ providedIn: 'root' })
export class BotService {
  private bots: BotState[] = [];
  private botIntervals: ReturnType<typeof setInterval>[] = [];
  private isPaused = false;

  setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  private readonly speedPorDificultad: Record<string, number> = {
    basico:     0.34,
    intermedio: 0.48,
    avanzado:   0.62,
  };

  private readonly aciertoPorDificultad: Record<string, number> = {
    basico:     0.45,
    intermedio: 0.70,
    avanzado:   0.90,
  };

  private readonly BOT_NAMES = [
    'CPU-Alpha', 'CPU-Beta', 'CPU-Gamma',
    'RoboFly', 'ByteBot', 'PixelBot',
  ];

  private readonly BOT_COLORS = ['#FF6B35', '#44CF6C', '#6C5CE7'];

  createBots(cantidad: number, dificultad: string): BotState[] {
    this.clearBots();
    this.bots = [];

    const startPositions = [
      new THREE.Vector3(8, 1, 8),
      new THREE.Vector3(-8, 1, 8),
      new THREE.Vector3(0, 1, -10),
    ];

    for (let i = 0; i < Math.min(cantidad, 3); i++) {
      const bot: BotState = {
        id: `bot_${i}_${Date.now()}`,
        nickname: this.BOT_NAMES[i],
        color: this.BOT_COLORS[i],
        health: 100,
        score: 0,
        position: startPositions[i].clone(),
        rotation: Math.random() * Math.PI * 2,
        connected: true,
        isBot: true,
      };
      this.bots.push(bot);
    }

    return this.bots;
  }

  startBotAI(
    dificultad: string,
    onBotMove: (bot: BotState) => void,
    onBotSkill: (bot: BotState, habilidad: 'boost' | 'attack' | 'shield') => void,
    onBotShoot?: (bot: BotState) => void,
  ) {
    this.botIntervals.forEach(id => clearInterval(id));
    this.botIntervals = [];
  }

  applyDamageToBot(botId: string, damage: number): BotState | null {
    const bot = this.bots.find(b => b.id === botId);
    if (!bot) return null;
    bot.health = Math.max(0, bot.health - damage);
    return bot;
  }

  getBots(): BotState[] {
    return this.bots;
  }

  clearBots() {
    this.botIntervals.forEach(id => clearInterval(id));
    this.botIntervals = [];
    this.bots = [];
    this.isPaused = false;
  }

  allBotsDead(): boolean {
    return this.bots.every(b => b.health <= 0);
  }
}