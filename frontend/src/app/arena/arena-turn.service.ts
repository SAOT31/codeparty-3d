import { Injectable } from '@angular/core';
import { LocalPlayerState } from './arena.component';
import { Habilidad } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class ArenaTurnService {
  checkVictoryTarget(
    stars: number,
    score: number,
    targetStars: number,
    targetPoints: number
  ): boolean {
    return stars >= targetStars || score >= targetPoints;
  }

  computeSortedRanking(players: any[]): any[] {
    return [...players].sort((a, b) => {
      const starsB = b.stars || 0;
      const starsA = a.stars || 0;
      if (starsB !== starsA) {
        return starsB - starsA;
      }
      return (b.score || 0) - (a.score || 0);
    });
  }

  calculateStepMovement(diceRoll: number, isBoostActive: boolean): number {
    return isBoostActive ? diceRoll * 2 : diceRoll;
  }

  applyLocalSkill(
    player: LocalPlayerState,
    habilidad: Habilidad
  ): { success: boolean; message: string; coinsEarned?: number } {
    if (!player.skillsReady[habilidad]) {
      const name =
        habilidad === 'boost'
          ? 'Doble Dado 🚀'
          : habilidad === 'shield'
          ? 'Escudo 🛡️'
          : 'Bolsa de Monedas 🌟';
      return {
        success: false,
        message: `🔒 No tienes ${name}. ¡Consíguelo cayendo en una casilla 🎁 o 💡!`,
      };
    }

    player.skillsReady[habilidad] = false;

    if (habilidad === 'boost') {
      player.isBoostActive = true;
      return {
        success: true,
        message: `🚀 ¡${player.nickname} activó DOBLE DADO! Tu próximo tiro avanzará el doble (x2)`,
      };
    }

    if (habilidad === 'shield') {
      player.isShieldActive = true;
      return {
        success: true,
        message: `🛡️ ¡${player.nickname} activó ESCUDO! Inmunidad a casillas rojas en tu turno`,
      };
    }

    if (habilidad === 'attack') {
      player.score += 20;
      return {
        success: true,
        coinsEarned: 20,
        message: `🌟 ¡${player.nickname} usó BOLSA DE MONEDAS! +20 Monedas a tu marcador`,
      };
    }

    return { success: false, message: '' };
  }
}
