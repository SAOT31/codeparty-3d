import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habilidad } from '../../models/game.models';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hud.component.html',
  styleUrl: './hud.component.scss',
})
export class HudComponent {
  @Input() nickname: string = '';
  @Input() playerColor: string = '#4ECDC4';
  @Input() characterEmoji: string = '⭐';
  @Input() score: number = 0;
  @Input() stars: number = 0;
  @Input() currentTile: number = 0;
  @Input() currentRound: number = 1;
  @Input() totalRounds: number = 5;
  @Input() targetStars: number = 2;
  @Input() targetPoints: number = 100;
  @Input() otherPlayers: any[] = [];
  @Input() skillsReady: { boost: boolean; attack: boolean; shield: boolean } = {
    boost: false, attack: false, shield: false,
  };
  @Input() health: number = 100;
  @Input() lives: number = 3;
  @Input() chargedReady: boolean = false;
  @Input() notificationText: string = '';
  @Input() disconnectedPlayer: string = '';
  @Input() isMuted: boolean = false;
  @Input() isPaused: boolean = false;
  @Input() isMyTurn: boolean = true;
  @Input() currentTurnNickname: string = '';
  @Input() isDiceRolling: boolean = false;
  @Input() diceWaitingForHit: boolean = false;

  @Output() skillAction = new EventEmitter<Habilidad>();
  @Output() toggleSoundClick = new EventEmitter<void>();
  @Output() togglePauseClick = new EventEmitter<void>();
  @Output() rollDiceClick = new EventEmitter<void>();
  @Output() zoomInClick = new EventEmitter<void>();
  @Output() zoomOutClick = new EventEmitter<void>();
  @Output() rotateLeftClick = new EventEmitter<void>();
  @Output() rotateRightClick = new EventEmitter<void>();
  @Output() resetCameraClick = new EventEmitter<void>();

  showRules: boolean = false;
  showLeaderboard: boolean = false;
  private lastRollTrigger = 0;
  private lastSkillTrigger = 0;

  toggleRules() {
    this.showRules = !this.showRules;
    if (this.showRules) this.showLeaderboard = false;
  }

  toggleLeaderboard() {
    this.showLeaderboard = !this.showLeaderboard;
    if (this.showLeaderboard) this.showRules = false;
  }

  onRollDiceTrigger(event: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const now = Date.now();
    if (now - this.lastRollTrigger < 250) return;
    this.lastRollTrigger = now;
    this.rollDiceClick.emit();
  }

  onSkillClick(habilidad: Habilidad) {
    this.skillAction.emit(habilidad);
  }

  onSkillTouch(habilidad: Habilidad, event: TouchEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const now = Date.now();
    if (now - this.lastSkillTrigger < 250) return;
    this.lastSkillTrigger = now;
    this.skillAction.emit(habilidad);
  }
}