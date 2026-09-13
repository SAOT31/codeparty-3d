import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habilidad } from '../../models/game.models';

@Component({
  selector: 'app-hud',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hud-container">
      <!-- Top Left: Player Status -->
      <div class="top-bar-player glass-panel">
        <div class="player-id">
          <span class="char-avatar">{{ characterEmoji }}</span>
          <span class="drone-ball" [style.background]="playerColor"></span>
          <span class="player-name">{{ nickname }}</span>
        </div>

        <div class="board-badge star-badge" [title]="'Tus Estrellas (Meta: ' + targetStars + ' ⭐)'">
          <span class="badge-icon">⭐</span>
          <span class="badge-val">{{ stars }}/{{ targetStars }}</span>
        </div>

        <div class="board-badge coin-badge" [title]="'Tus Puntos (Meta: ' + targetPoints + ' 🪙)'">
          <span class="badge-icon">🪙</span>
          <span class="badge-val">{{ score }}/{{ targetPoints }}</span>
        </div>

        <div class="board-badge round-badge" title="Ronda de juego">
          <span class="badge-icon">🏁</span>
          <span class="badge-val">Ronda {{ currentRound }}</span>
        </div>

        <div class="board-badge tile-badge hide-on-xs" title="Tu posición en el tablero">
          <span class="badge-icon">📍</span>
          <span class="badge-val">{{ (currentTile % 52) + 1 }}/52</span>
        </div>
      </div>

      <!-- Top Right: Camera & System Actions -->
      <div class="top-bar-actions glass-panel">
        <button class="hud-circle-btn" (click)="rotateLeftClick.emit()" title="Girar cámara a la izquierda (↺)" id="btn-hud-rot-left">
          ↺
        </button>
        <button class="hud-circle-btn" (click)="rotateRightClick.emit()" title="Girar cámara a la derecha (↻)" id="btn-hud-rot-right">
          ↻
        </button>
        <button class="hud-circle-btn" (click)="resetCameraClick.emit()" title="Restablecer vista de cámara (🎯)" id="btn-hud-reset-cam">
          🎯
        </button>
        <button class="hud-circle-btn hide-on-xs" (click)="zoomInClick.emit()" title="Acercar cámara" id="btn-hud-zoom-in">
          ➕
        </button>
        <button class="hud-circle-btn hide-on-xs" (click)="zoomOutClick.emit()" title="Alejar cámara" id="btn-hud-zoom-out">
          ➖
        </button>
        <button class="hud-circle-btn" (click)="toggleSoundClick.emit()" [title]="isMuted ? 'Activar sonido' : 'Silenciar sonido'" id="btn-hud-sound">
          {{ isMuted ? '🔇' : '🔊' }}
        </button>
        <button class="hud-circle-btn" (click)="toggleLeaderboard()" title="Ver ranking" id="btn-hud-toggle-ranks">
          🏆
        </button>
        <button class="hud-circle-btn" (click)="toggleRules()" title="Ver reglas" id="btn-hud-toggle-rules">
          ❓
        </button>
        <button class="hud-circle-btn hud-pause-btn" (click)="togglePauseClick.emit()" [title]="isPaused ? 'Reanudar' : 'Pausar'" id="btn-hud-pause">
          {{ isPaused ? '▶️' : '⏸️' }}
        </button>
      </div>

      <!-- Center Top: Turn Indicator -->
      <div class="turn-indicator glass-panel" [class.turn-indicator-active]="isMyTurn">
        <span class="turn-pulse" [class.turn-mine]="isMyTurn"></span>
        <span class="turn-text">{{ isMyTurn ? '👉 ¡TU TURNO DE TIRAR EL DADO!' : '⏳ Turno de ' + currentTurnNickname }}</span>
      </div>

      <!-- Ranking Panel (Collapsible on Mobile) -->
      <div class="ranking-panel glass-panel" [class.ranking-mobile-open]="showLeaderboard">
        <div class="ranking-header">
          <div class="ranking-title">🏆 Clasificación</div>
          <button class="close-mobile-btn show-on-mobile" (click)="showLeaderboard = false">✕</button>
        </div>
        <div class="ranking-list">
          <div class="rank-row" *ngFor="let p of otherPlayers; let i = index"
               [class.rank-disconnected]="!p.connected">
            <span class="rank-medal">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i+1) }}</span>
            <span class="rank-dot" [style.background]="p.color"></span>
            <span class="rank-name">{{ p.nickname }}{{ p.isBot ? ' 🤖' : '' }}</span>
            <span class="rank-stars" *ngIf="p.stars">⭐{{ p.stars }}</span>
            <span class="rank-pts">🪙 {{ p.score }}</span>
            <span class="rank-offline" *ngIf="!p.connected && !p.isBot" title="Desconectado">📡</span>
          </div>
        </div>
      </div>

      <!-- Board Rules Panel (Collapsible) -->
      <div class="rules-panel glass-panel" [class.rules-panel-open]="showRules">
        <div class="rules-header">
          <span class="rules-title">🎲 GUÍA DEL TABLERO</span>
          <button class="close-mobile-btn" (click)="showRules = false">✕</button>
        </div>
        <div class="rules-items">
          <div class="rules-row">
            <span class="tile-pill pill-blue">🔵 +10</span>
            <span class="rules-text"><strong>Azul:</strong> +10 puntos</span>
          </div>
          <div class="rules-row">
            <span class="tile-pill pill-red">🔴 -5</span>
            <span class="rules-text"><strong>Roja:</strong> -5 puntos</span>
          </div>
          <div class="rules-row">
            <span class="tile-pill pill-trivia">💡 TRIVIA</span>
            <span class="rules-text"><strong>Trivia:</strong> +20 pts y poder</span>
          </div>
          <div class="rules-row">
            <span class="tile-pill pill-power">🎁 PODER</span>
            <span class="rules-text"><strong>Poder:</strong> Doble Dado / Escudo</span>
          </div>
          <div class="rules-row">
            <span class="tile-pill pill-star">⭐ META</span>
            <span class="rules-text"><strong>Estrella:</strong> +30 pts</span>
          </div>
        </div>
        <div class="rules-footer">
          <div class="ctrl-chip"><kbd>ESPACIO</kbd> Dado</div>
          <div class="ctrl-chip"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> Poderes</div>
          <div class="ctrl-chip"><kbd>Táctil / Arrastrar</kbd> Cámara</div>
        </div>
      </div>

      <!-- Center Notifications -->
      <div class="notif-area" *ngIf="notificationText">
        <div class="notif-bubble">{{ notificationText }}</div>
      </div>

      <!-- Disconnect Alert -->
      <div class="disconnect-alert glass-panel" *ngIf="disconnectedPlayer">
        📡 <strong>{{ disconnectedPlayer }}</strong> se desconectó — la partida continúa
      </div>

      <!-- MAIN DICE ROLL ACTION BUTTON -->
      <div class="dice-turn-panel" *ngIf="isMyTurn">
        <button class="btn-roll-dice"
                [class.btn-roll-waiting]="diceWaitingForHit"
                (click)="onRollDiceTrigger($event)"
                (touchstart)="onRollDiceTrigger($event)"
                id="btn-hud-roll-dice">
          <span class="dice-emoji">{{ diceWaitingForHit ? '🛑' : '🎲' }}</span>
          <div class="dice-texts">
            <span class="dice-lbl">{{ diceWaitingForHit ? '¡DETENER DADO!' : '¡LANZAR DADO!' }}</span>
            <span class="dice-sub">(Toca aquí o pulsa ESPACIO)</span>
          </div>
        </button>
      </div>

      <!-- Skills Bar at Bottom -->
      <div class="skills-bar">
        <button class="skill-btn" id="btn-skill-boost"
                [class.skill-ready]="skillsReady.boost"
                [class.skill-locked]="!skillsReady.boost"
                (click)="onSkillClick('boost')"
                (touchstart)="onSkillTouch('boost', $event)">
          <div class="skill-key">1</div>
          <div class="skill-icon">🚀</div>
          <div class="skill-name">DOBLE DADO</div>
          <div class="skill-status">{{ skillsReady.boost ? '¡Listo!' : 'Vacío 🎁' }}</div>
        </button>

        <button class="skill-btn" id="btn-skill-shield"
                [class.skill-ready]="skillsReady.shield"
                [class.skill-locked]="!skillsReady.shield"
                (click)="onSkillClick('shield')"
                (touchstart)="onSkillTouch('shield', $event)">
          <div class="skill-key">2</div>
          <div class="skill-icon">🛡️</div>
          <div class="skill-name">ESCUDO</div>
          <div class="skill-status">{{ skillsReady.shield ? '¡Listo!' : 'Vacío 🎁' }}</div>
        </button>

        <button class="skill-btn" id="btn-skill-attack"
                [class.skill-ready]="skillsReady.attack"
                [class.skill-locked]="!skillsReady.attack"
                (click)="onSkillClick('attack')"
                (touchstart)="onSkillTouch('attack', $event)">
          <div class="skill-key">3</div>
          <div class="skill-icon">🌟</div>
          <div class="skill-name">BOLSA MONEDAS</div>
          <div class="skill-status">{{ skillsReady.attack ? '¡Listo!' : 'Vacío 🎁' }}</div>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .hud-container {
      position: absolute;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      pointer-events: none;
      z-index: 10;
      user-select: none;
      overflow: hidden;
    }

    .top-bar-player {
      position: absolute;
      top: 12px; left: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 50px;
      pointer-events: auto;
      max-width: calc(100vw - 180px);
      overflow-x: auto;
      white-space: nowrap;
      z-index: 25;
      backdrop-filter: blur(12px);
      background: rgba(8, 14, 28, 0.88);
      border: 1.5px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    .player-id {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .char-avatar {
      font-size: 1.25rem;
      line-height: 1;
      filter: drop-shadow(0 0 6px rgba(255,255,255,0.4));
    }

    .drone-ball {
      width: 12px; height: 12px;
      border-radius: 50%;
      box-shadow: 0 0 8px currentColor;
      flex-shrink: 0;
    }

    .player-name {
      font-family: var(--font-title);
      font-weight: 800;
      font-size: 0.92rem;
      white-space: nowrap;
      color: #fff;
    }

    .board-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .badge-icon {
      font-size: 0.9rem;
    }

    .badge-val {
      font-family: var(--font-cyber);
      font-size: 0.85rem;
      font-weight: 800;
      color: #fff;
    }

    .star-badge {
      background: rgba(255, 215, 0, 0.18);
      border-color: rgba(255, 215, 0, 0.4);
      .badge-val { color: #FFD700; text-shadow: 0 0 8px rgba(255, 215, 0, 0.5); }
    }

    .coin-badge {
      background: rgba(78, 205, 196, 0.18);
      border-color: rgba(78, 205, 196, 0.4);
      .badge-val { color: var(--color-primary); }
    }

    .round-badge {
      background: rgba(255, 107, 107, 0.18);
      border-color: rgba(255, 107, 107, 0.4);
      .badge-val { color: #FFA502; }
    }

    .top-bar-actions {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 50px;
      pointer-events: auto;
      z-index: 25;
      backdrop-filter: blur(12px);
      background: rgba(8, 14, 28, 0.88);
      border: 1.5px solid rgba(255, 255, 255, 0.18);
    }

    .hud-circle-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      touch-action: manipulation;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover, &:active {
        background: rgba(255, 255, 255, 0.28);
        transform: scale(1.1);
        border-color: var(--color-primary);
      }
    }

    .ranking-panel {
      position: absolute;
      top: 60px; right: 12px;
      width: 220px;
      padding: 10px 14px;
      border-radius: 18px;
      pointer-events: auto;
      z-index: 20;
      backdrop-filter: blur(14px);
      background: rgba(8, 14, 28, 0.92);
      border: 1.5px solid rgba(255, 255, 255, 0.18);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      transition: all 0.3s ease;
    }

    .ranking-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .ranking-title {
      font-family: var(--font-cyber);
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--color-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-height: 220px;
      overflow-y: auto;
    }

    .rank-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      padding: 4px 6px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
    }

    .rank-medal { font-size: 0.9rem; min-width: 18px; }

    .rank-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .rank-name {
      flex: 1;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #fff;
    }

    .rank-stars {
      font-family: var(--font-cyber);
      font-size: 0.75rem;
      font-weight: 800;
      color: #FFD700;
    }

    .rank-pts {
      font-family: var(--font-cyber);
      font-size: 0.78rem;
      color: var(--color-accent);
      font-weight: 800;
    }

    .rank-offline { font-size: 0.7rem; opacity: 0.7; }

    .rules-panel {
      position: absolute;
      bottom: 85px; left: 12px;
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(8, 14, 28, 0.95);
      backdrop-filter: blur(14px);
      border: 1.5px solid rgba(0, 245, 255, 0.35);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 245, 255, 0.15);
      display: flex;
      flex-direction: column;
      gap: 6px;
      pointer-events: auto;
      max-width: 270px;
      z-index: 30;
      transition: all 0.3s ease;
    }

    .rules-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    .rules-title {
      font-family: var(--font-cyber);
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--color-primary);
      letter-spacing: 0.8px;
    }

    .close-mobile-btn {
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.7);
      font-size: 1rem;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
      &:hover { color: #fff; }
    }

    .rules-items {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .rules-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tile-pill {
      font-family: var(--font-cyber);
      font-size: 0.65rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 5px;
      min-width: 58px;
      text-align: center;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }

    .pill-blue { background: #0984e3; color: #fff; }
    .pill-red { background: #d63031; color: #fff; }
    .pill-trivia { background: #e67e22; color: #fff; }
    .pill-power { background: #8e44ad; color: #fff; }
    .pill-star { background: #ffd700; color: #111; }

    .rules-text {
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.95);
      white-space: nowrap;
      strong { color: #ffffff; }
    }

    .rules-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      padding-top: 5px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .ctrl-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.65rem;
      color: rgba(255, 255, 255, 0.85);

      kbd {
        background: rgba(0, 245, 255, 0.15);
        border: 1px solid rgba(0, 245, 255, 0.4);
        border-radius: 4px;
        padding: 1px 4px;
        font-family: var(--font-cyber);
        font-size: 0.62rem;
        color: var(--color-primary);
        font-weight: 800;
      }
    }

    .turn-indicator {
      position: absolute;
      top: 66px;
      left: 50%;
      transform: translateX(-50%);
      padding: 7px 18px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88rem;
      font-weight: 800;
      color: #fff;
      background: rgba(8, 14, 28, 0.92);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      z-index: 20;
      pointer-events: auto;
      white-space: nowrap;
      transition: all 0.3s ease;

      &.turn-indicator-active {
        border-color: #2ed573;
        box-shadow: 0 0 20px rgba(46, 213, 115, 0.4);
      }
    }

    .turn-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #ffa502;
      box-shadow: 0 0 8px #ffa502;

      &.turn-mine {
        background: #2ed573;
        box-shadow: 0 0 14px #2ed573;
        animation: pulse-glow 0.8s infinite alternate;
      }
    }

    .notif-area {
      position: absolute;
      top: 115px; left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 35;
      width: 90%;
      max-width: 480px;
      display: flex;
      justify-content: center;
    }

    .notif-bubble {
      background: rgba(10,15,30,0.96);
      border: 2px solid var(--color-accent);
      padding: 8px 18px;
      border-radius: 50px;
      font-family: var(--font-cyber);
      font-weight: 800;
      font-size: 0.88rem;
      color: #ffffff;
      box-shadow: 0 0 20px rgba(78,205,196,0.5);
      animation: bounce-in 0.3s ease both;
      text-align: center;
    }

    .disconnect-alert {
      position: absolute;
      top: 60px; right: 12px;
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 0.76rem;
      color: #ffaa44;
      border-color: rgba(255,170,68,0.3);
      animation: bounce-in 0.3s ease both;
      pointer-events: auto;
      z-index: 25;
    }

    .dice-turn-panel {
      position: absolute;
      bottom: 95px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: auto;
      z-index: 45;
      touch-action: manipulation;
    }

    .btn-roll-dice {
      padding: 12px 28px;
      border-radius: 40px;
      border: 3px solid #fff;
      background: linear-gradient(135deg, #ff4757, #ffa502);
      color: #fff;
      font-family: var(--font-title);
      font-size: 1.15rem;
      cursor: pointer;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 24px rgba(255, 71, 87, 0.6), 0 0 20px rgba(255, 215, 0, 0.5);
      animation: pulse-glow 1.2s infinite alternate;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;

      &:active {
        transform: scale(0.96);
      }

      &.btn-roll-waiting {
        background: linear-gradient(135deg, #2ed573, #00b894);
        box-shadow: 0 8px 24px rgba(46, 213, 115, 0.7), 0 0 25px rgba(46, 213, 115, 0.5);
        animation: pulse-glow-green 0.6s infinite alternate;
        border-color: #ffffff;
      }
    }

    .dice-emoji { font-size: 1.6rem; }
    .dice-texts { display: flex; flex-direction: column; align-items: flex-start; }
    .dice-lbl { font-weight: 800; letter-spacing: 0.8px; line-height: 1.2; white-space: nowrap; }
    .dice-sub { font-size: 0.7rem; opacity: 0.9; font-family: var(--font-text); line-height: 1; white-space: nowrap; }

    .skills-bar {
      position: absolute;
      bottom: 12px; left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      pointer-events: auto;
      z-index: 25;
      max-width: 95vw;
    }

    .skill-btn {
      background: rgba(10, 15, 30, 0.9);
      backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.18);
      border-radius: 12px;
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      color: #ffffff;
      font-family: var(--font-text);
      transition: all 0.2s ease;
      min-width: 82px;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;

      &:active {
        transform: scale(0.95);
      }
    }

    .skill-btn.skill-ready {
      background: rgba(68,207,108,0.25);
      border-color: var(--color-success);
      box-shadow: 0 0 16px rgba(68,207,108,0.4);
      animation: pulse-glow 2s infinite;
    }

    .skill-btn.skill-locked {
      opacity: 0.65;
    }

    .skill-key {
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 4px;
      width: 18px; height: 18px;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-cyber);
      font-size: 0.68rem;
      color: var(--color-accent);
    }

    .skill-icon { font-size: 1.2rem; line-height: 1; }

    .skill-name {
      font-weight: 800;
      font-size: 0.7rem;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }

    .skill-status {
      font-size: 0.62rem;
      padding: 1px 6px;
      border-radius: 20px;
      background: rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.65);
      font-weight: 700;
      white-space: nowrap;

      .skill-ready & {
        background: rgba(68,207,108,0.25);
        color: var(--color-success);
      }
    }

    .show-on-mobile { display: none; }

    /* MOBILE RESPONSIVE MEDIA QUERIES */
    @media (max-width: 768px) {
      .top-bar-player {
        top: 8px; left: 8px;
        padding: 4px 10px;
        max-width: calc(100vw - 150px);
        font-size: 0.8rem;
      }

      .player-name { font-size: 0.82rem; }
      .hide-on-mobile { display: none !important; }
      .show-on-mobile { display: block !important; }

      .top-bar-actions {
        top: 8px; right: 8px;
        padding: 4px 6px;
      }

      .hud-circle-btn {
        width: 28px; height: 28px;
        font-size: 0.8rem;
      }

      .turn-indicator {
        top: 52px;
        font-size: 0.78rem;
        padding: 5px 14px;
      }

      .notif-area {
        top: 92px;
      }

      .notif-bubble {
        font-size: 0.78rem;
        padding: 6px 14px;
      }

      .ranking-panel {
        display: none;
        top: 48px; right: 8px; left: 8px;
        width: auto;
        z-index: 50;

        &.ranking-mobile-open {
          display: block;
        }
      }

      .rules-panel {
        display: none;
        bottom: 80px; left: 8px; right: 8px;
        max-width: none;
        z-index: 50;

        &.rules-panel-open {
          display: flex;
        }
      }

      .dice-turn-panel {
        bottom: 76px;
        width: 90%;
        display: flex;
        justify-content: center;
        z-index: 100 !important;
        pointer-events: auto !important;
      }

      .btn-roll-dice {
        width: 100%;
        max-width: 320px;
        min-height: 52px;
        justify-content: center;
        padding: 12px 20px;
        font-size: 1.05rem;
      }

      .skills-bar {
        bottom: 8px;
        gap: 6px;
      }

      .skill-btn {
        min-width: 70px;
        padding: 4px 6px;
      }

      .skill-name {
        font-size: 0.62rem;
      }

      .skill-status {
        font-size: 0.58rem;
      }
    }

    @media (max-width: 480px) {
      .hide-on-xs { display: none !important; }
    }
  `],
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