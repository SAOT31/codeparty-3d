import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../services/socket.service';
import { SoundService } from '../services/sound.service';
import { GameState } from '../models/game.models';
import { CharacterSelectorComponent } from './character-selector/character-selector.component';
import { ScenarioVoteComponent } from './scenario-vote/scenario-vote.component';
import { CharacterType, CHARACTER_DEFS } from '../arena/characters/character.factory';
import { ScenarioId } from '../arena/scenarios/scenario.factory';
import { Subscription } from 'rxjs';

type LobbyPhase = 'waiting' | 'character' | 'scenario';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, CharacterSelectorComponent, ScenarioVoteComponent],
  template: `
    <div class="lobby-container">
      <div class="stars-bg"></div>

      <div class="lobby-card glass-panel" *ngIf="phase === 'waiting'" style="animation: bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;">
        <div class="lobby-header">
          <button class="sound-mini-btn lobby-sound-btn" (click)="toggleSound()" id="btn-lobby-sound" [title]="isMuted ? 'Activar sonido' : 'Silenciar sonido'">
            {{ isMuted ? '🔇' : '🔊' }}
          </button>
          <div class="lobby-icon">🎮</div>
          <h1 class="lobby-title">Sala de Espera</h1>
          <p class="lobby-sub">Comparte el código con tus amigos</p>
        </div>

        <div class="info-row">
          <div class="info-badge" id="badge-codigo">
            <span class="info-lbl">🔑 Código</span>
            <span class="info-val code-val">{{ codigoSala }}</span>
          </div>
          <div class="info-badge" id="badge-tema">
            <span class="info-lbl">🧠 Tema</span>
            <span class="info-val text-accent">{{ temaSala }}</span>
          </div>
          <div class="info-badge" id="badge-meta">
            <span class="info-lbl">🏆 Meta de Victoria</span>
            <span class="info-val" style="color: #ffd700; font-size: 0.88rem;">{{ targetStars }}⭐ o {{ targetPoints }}🪙</span>
          </div>
          <div class="info-badge" id="badge-jugadores">
            <span class="info-lbl">👥 Jugadores</span>
            <span class="info-val text-primary">{{ playerCount }} / 4</span>
          </div>
        </div>

        <div class="slots-grid">
          <div class="slot-card glass-panel"
               *ngFor="let slot of slots; let i = index"
               [class.slot-occupied]="slot.occupied"
               [class.slot-me]="slot.isMe">

            <div class="slot-number">{{ i + 1 }}</div>

            <div class="slot-content" *ngIf="slot.occupied">
              <div class="char-icon">{{ getCharEmoji(slot.characterType) }}</div>
              <div class="slot-info">
                <span class="slot-name">{{ slot.nickname }}</span>
                <div class="slot-badges">
                  <span class="badge-host" *ngIf="slot.isHost">👑 Host</span>
                  <span class="badge-me" *ngIf="slot.isMe">Tú</span>
                </div>
              </div>
              <span class="slot-ready">✅</span>
            </div>

            <div class="slot-empty" *ngIf="!slot.occupied">
              <span>⏳ Esperando jugador...</span>
            </div>
          </div>
        </div>

        <div class="host-alert" *ngIf="isNewHost" style="animation: bounce-in 0.4s ease both;">
          👑 ¡Eres el nuevo host! Puedes iniciar la partida.
        </div>

        <div class="actions-row">
          <button id="btn-iniciar" class="btn-play btn-start"
                  *ngIf="isHost"
                  [disabled]="playerCount < 1"
                  (click)="iniciarSeleccionPersonaje()">
            🎮 ¡Elegir Personajes!
          </button>

          <div class="wait-msg" *ngIf="!isHost">
            <div class="wait-spinner">⏳</div>
            <span>Esperando al host...</span>
          </div>
        </div>

        <div class="share-hint" *ngIf="isHost">
          Comparte <strong>{{ codigoSala }}</strong> con tus amigos
        </div>
      </div>

      <div class="lobby-card wide-card glass-panel" *ngIf="phase === 'character'" style="animation: bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;">
        <app-character-selector
          [takenTypes]="takenCharacters"
          [myPlayerId]="myPlayerId"
          [currentPickerName]="isLocal ? currentPickerName : ''"
          (characterSelected)="onCharacterSelected($event)"
        ></app-character-selector>

        <div class="phase-players">
          <div class="phase-player" *ngFor="let slot of displaySlots">
            <div class="char-icon-sm">{{ getCharEmoji(slot.characterType) }}</div>
            <span class="phase-player-name" [class.me]="slot.isMe">{{ slot.nickname }}</span>
            <span class="phase-status" *ngIf="slot.characterType">✅</span>
            <span class="phase-status pending" *ngIf="!slot.characterType">⌛</span>
          </div>
        </div>

        <div class="actions-row">
          <button id="btn-continuar-escenario" class="btn-play btn-start"
                  *ngIf="isHost"
                  [disabled]="isLocal ? !allLocalHumansChosen : !myCharacterType"
                  (click)="iniciarVotacionEscenario()">
            🗺️ Votar Escenario →
          </button>
          <div class="wait-msg" *ngIf="!isHost">
            <div class="wait-spinner">⏳</div>
            <span>Esperando al host para continuar...</span>
          </div>
        </div>
      </div>

      <div class="lobby-card wide-card glass-panel" *ngIf="phase === 'scenario'" style="animation: bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;">
        <app-scenario-vote
          [myPlayerId]="myPlayerId"
          [voteCounts]="scenarioVoteCounts"
          [currentWinner]="scenarioWinner"
          (voted)="onScenarioVoted($event)"
          (voteFinished)="onVoteFinished($event)"
        ></app-scenario-vote>

        <div class="actions-row" style="margin-top: 16px;">
          <button id="btn-iniciar-partida" class="btn-play btn-start"
                  *ngIf="isHost"
                  (click)="iniciarPartida()">
            🚀 ¡Iniciar Partida!
          </button>
          <div class="wait-msg" *ngIf="!isHost">
            <div class="wait-spinner">⏳</div>
            <span>El host iniciará la partida...</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lobby-container {
      width: 100vw;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      position: relative;
      overflow: hidden;
    }

    .lobby-card {
      width: 100%;
      max-width: 540px;
      border-radius: 28px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      position: relative;
      z-index: 2;
    }

    .wide-card {
      max-width: 840px !important;
    }

    .lobby-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      position: relative;
    }

    .lobby-sound-btn {
      position: absolute;
      top: 0;
      right: 0;
    }

    .sound-mini-btn {
      background: rgba(255, 255, 255, 0.12);
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      border-radius: 50px;
      color: #fff;
      padding: 6px 14px;
      font-size: 0.85rem;
      font-family: var(--font-text);
      font-weight: 700;
      cursor: pointer;
      backdrop-filter: blur(12px);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.22);
        border-color: var(--color-primary);
        transform: translateY(-2px);
      }
    }

    .lobby-icon { font-size: 2.8rem; }

    .lobby-title {
      font-family: var(--font-title);
      font-size: 2rem;
      color: #ffffff;
      margin: 0;
    }

    .lobby-sub {
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem;
      margin: 0;
    }

    .info-row {
      display: flex;
      gap: 10px;
    }

    .info-badge {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }

    .info-lbl { font-size: 0.72rem; color: rgba(255,255,255,0.5); font-weight: 700; text-transform: uppercase; }
    .info-val { font-family: var(--font-cyber); font-size: 1rem; font-weight: 800; color: #fff; }
    .code-val { letter-spacing: 3px; color: var(--color-primary); }

    .slots-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    @media (max-width: 500px) {
      .slots-grid { grid-template-columns: 1fr; }
      .lobby-card { padding: 24px 16px; }
    }

    .slot-card {
      padding: 14px 18px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 66px;
      transition: all 0.3s ease;
      border-color: rgba(255,255,255,0.08) !important;
    }

    .slot-card.slot-occupied { border-color: rgba(78,205,196,0.3) !important; background: rgba(78,205,196,0.05) !important; }
    .slot-card.slot-me { border-color: var(--color-primary) !important; background: rgba(255,215,0,0.06) !important; box-shadow: 0 0 16px rgba(255,215,0,0.15) !important; }

    .slot-number {
      width: 30px; height: 30px;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-cyber); font-size: 0.9rem;
      color: rgba(255,255,255,0.5); flex-shrink: 0;
    }

    .slot-content { display: flex; align-items: center; gap: 10px; flex: 1; }
    .char-icon { font-size: 1.6rem; flex-shrink: 0; }
    .char-icon-sm { font-size: 1.2rem; }

    .slot-info { display: flex; flex-direction: column; gap: 3px; flex: 1; }
    .slot-name { font-weight: 800; font-size: 0.95rem; color: #ffffff; }
    .slot-badges { display: flex; gap: 6px; }

    .badge-host { font-size: 0.7rem; background: rgba(255,215,0,0.15); border: 1px solid rgba(255,215,0,0.4); color: var(--color-primary); padding: 2px 8px; border-radius: 20px; font-weight: 700; }
    .badge-me { font-size: 0.7rem; background: rgba(78,205,196,0.15); border: 1px solid rgba(78,205,196,0.4); color: var(--color-accent); padding: 2px 8px; border-radius: 20px; font-weight: 700; }
    .slot-ready { font-size: 1rem; }
    .slot-empty { color: rgba(255,255,255,0.3); font-size: 0.86rem; font-style: italic; }

    .mode-selector { display: flex; flex-direction: column; gap: 8px; }
    .mode-label { font-size: 0.85rem; color: rgba(255,255,255,0.5); font-weight: 700; margin: 0; }
    .mode-btns { display: flex; gap: 10px; }
    .mode-btn {
      flex: 1; padding: 10px; border-radius: 12px; font-size: 0.9rem; font-weight: 700;
      background: rgba(255,255,255,0.06); border: 2px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s;
      &.active { border-color: var(--color-primary); color: var(--color-primary); background: rgba(255,215,0,0.1); }
      &:hover { border-color: rgba(255,255,255,0.3); }
    }
    .mode-hint { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin: 0; font-style: italic; }

    .host-alert { background: rgba(255,215,0,0.12); border: 1.5px solid rgba(255,215,0,0.3); border-radius: 14px; padding: 12px 20px; color: var(--color-primary); font-weight: 700; font-size: 0.9rem; text-align: center; }

    .actions-row { display: flex; justify-content: center; }

    .btn-start { min-width: 220px; font-size: 1.1rem; padding: 16px 40px;
      &:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
    }

    .wait-msg { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.55); font-size: 0.95rem; font-weight: 600; }
    .wait-spinner { animation: float 1.5s ease-in-out infinite; }

    .share-hint { text-align: center; font-size: 0.85rem; color: rgba(255,255,255,0.4);
      strong { color: var(--color-primary); font-family: var(--font-cyber); letter-spacing: 3px; }
    }

    .phase-players { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .phase-player { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 6px 14px; }
    .phase-player-name { font-size: 0.88rem; font-weight: 700; color: rgba(255,255,255,0.7);
      &.me { color: var(--color-primary); }
    }
    .phase-status { font-size: 0.85rem;
      &.pending { opacity: 0.5; }
    }
  `],
})
export class LobbyComponent implements OnInit, OnDestroy {
  codigoSala: string = '';
  temaSala: string = 'Angular';
  myPlayerId: string = '';
  myNickname: string = '';
  myColor: string = '#4ECDC4';
  isHost: boolean = false;
  isNewHost: boolean = false;
  playerCount: number = 0;
  salaId: string = '';
  phase: LobbyPhase = 'waiting';
  gameMode: 'local' | 'lan' = 'lan';
  isLocal: boolean = false;

  localSlots: any[] = [];
  humanSlots: any[] = [];
  currentHumanIndex: number = 0;
  currentPickerName: string = '';
  allLocalHumansChosen: boolean = false;

  myCharacterType: CharacterType | null = null;
  takenCharacters: { type: CharacterType; playerId: string; nickname: string; color: string }[] = [];
  playerCharacterMap: Record<string, CharacterType> = {};

  scenarioVoteCounts: Record<string, number> = {};
  scenarioWinner: ScenarioId = 'isla';

  isMuted: boolean = false;

  targetStars: number = 2;
  targetPoints: number = 100;

  slots = [
    { occupied: false, nickname: '', color: '', isHost: false, isMe: false, characterType: '' as CharacterType | '' },
    { occupied: false, nickname: '', color: '', isHost: false, isMe: false, characterType: '' as CharacterType | '' },
    { occupied: false, nickname: '', color: '', isHost: false, isMe: false, characterType: '' as CharacterType | '' },
    { occupied: false, nickname: '', color: '', isHost: false, isMe: false, characterType: '' as CharacterType | '' },
  ];

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private soundService: SoundService,
  ) {}

  ngOnInit() {
    this.codigoSala = (this.route.snapshot.paramMap.get('codigo') || '').toUpperCase();
    this.isLocal = this.codigoSala === 'LOCAL' || sessionStorage.getItem('codearena_modo') === 'local';

    this.isMuted = this.soundService.isAudioMuted();
    if (!this.isMuted) {
      this.soundService.startMenuMusic();
    }

    if (this.isLocal) {
      this.initLocalLobby();
      return;
    }

    this.myPlayerId = sessionStorage.getItem('codearena_playerId') || '';
    this.myNickname = sessionStorage.getItem('codearena_nickname') || 'Piloto';
    this.myColor = sessionStorage.getItem('codearena_color') || '#4ECDC4';
    const savedChar = sessionStorage.getItem('codearena_character') as CharacterType | null;
    if (savedChar) this.myCharacterType = savedChar;

    const savedStars = sessionStorage.getItem('codearena_target_stars');
    if (savedStars) this.targetStars = parseInt(savedStars, 10);
    const savedPoints = sessionStorage.getItem('codearena_target_points');
    if (savedPoints) this.targetPoints = parseInt(savedPoints, 10);

    this.socketService.joinRoom(this.codigoSala, this.myPlayerId, this.myNickname, this.myColor);

    this.subs.push(this.socketService.roomState$.subscribe((state: any) => {
      this.salaId = state.salaId;
      this.temaSala = state.tema;
      this.isHost = state.hostId === this.myPlayerId;
      if (state.targetStars) this.targetStars = state.targetStars;
      if (state.targetPoints) this.targetPoints = state.targetPoints;

      const players = Object.values(state.players as Record<string, any>).filter(p => p.connected);
      this.playerCount = players.length;

      for (let i = 0; i < 4; i++) {
        const p = players[i] as any;
        if (p) {
          this.slots[i] = { occupied: true, nickname: p.nickname, color: p.color, isHost: p.id === state.hostId, isMe: p.id === this.myPlayerId, characterType: p.characterType || '' };
        } else {
          this.slots[i] = { occupied: false, nickname: '', color: '', isHost: false, isMe: false, characterType: '' };
        }
      }

      players.forEach((p: any) => {
        if (p.characterType) this.playerCharacterMap[p.nickname] = p.characterType;
      });

      if (state.status === 'PLAYING') {
        this.navigateToArena();
      }

      if (state.scenarioVotes) {
        const counts: Record<string, number> = {};
        Object.values(state.scenarioVotes as Record<string, string>).forEach(s => { counts[s] = (counts[s] || 0) + 1; });
        this.scenarioVoteCounts = counts;
      }
    }));

    this.subs.push(this.socketService.gameStart$.subscribe(() => this.navigateToArena()));

    this.subs.push(this.socketService.hostChanged$.subscribe(data => {
      if (data.newHostId === this.myPlayerId) {
        this.isHost = true;
        this.isNewHost = true;
        setTimeout(() => this.isNewHost = false, 5000);
      }
    }));

    this.subs.push(this.socketService.characterSelected$.subscribe(data => {
      const existing = this.takenCharacters.find(t => t.playerId === data.playerId);
      if (existing) {
        existing.type = data.characterType;
      } else {
        this.takenCharacters.push({ type: data.characterType, playerId: data.playerId, nickname: '', color: '' });
      }
      this.takenCharacters = [...this.takenCharacters];

      const playerSlot = this.slots.find(s => s.occupied && !s.isMe);
      if (playerSlot) this.playerCharacterMap[playerSlot.nickname] = data.characterType;
    }));

    this.subs.push(this.socketService.scenarioVotes$.subscribe(data => {
      this.scenarioVoteCounts = data.voteCounts;
      this.scenarioWinner = data.currentWinner as ScenarioId;
    }));

    this.subs.push(this.socketService.lobbyPhase$.subscribe(data => {
      if (data && data.phase) {
        this.phase = data.phase;
      }
    }));
  }

  private initLocalLobby() {
    this.phase = 'character';
    this.isHost = true;
    this.gameMode = 'local';
    const raw = sessionStorage.getItem('codearena_local_players');
    if (raw) {
      try {
        this.localSlots = JSON.parse(raw);
      } catch (e) {
        this.localSlots = [];
      }
    }
    if (!this.localSlots || this.localSlots.length === 0) {
      this.localSlots = [
        { slot: 1, isBot: false, nickname: 'Jugador 1', characterType: '', color: '#00f5ff' },
        { slot: 2, isBot: true, nickname: 'Bot Beta', characterType: '', color: '#ff003c' },
        { slot: 3, isBot: true, nickname: 'Bot Gamma', characterType: '', color: '#bf00ff' },
        { slot: 4, isBot: true, nickname: 'Bot Delta', characterType: '', color: '#00ff88' },
      ];
    } else {
      this.localSlots.forEach(s => {
        s.characterType = '';
      });
    }

    this.humanSlots = this.localSlots.filter(s => !s.isBot);
    this.currentHumanIndex = 0;
    this.takenCharacters = [];
    this.playerCharacterMap = {};
    this.allLocalHumansChosen = false;

    if (this.humanSlots.length > 0) {
      const firstHuman = this.humanSlots[0];
      this.myPlayerId = 'p' + firstHuman.slot + '_local';
      this.myNickname = firstHuman.nickname;
      this.myColor = firstHuman.color;
      this.currentPickerName = firstHuman.nickname;
    }
  }

  get displaySlots(): { nickname: string; characterType: CharacterType | ''; isMe: boolean }[] {
    if (this.isLocal) {
      return this.localSlots.map(s => ({
        nickname: s.nickname,
        characterType: s.characterType || '',
        isMe: !s.isBot,
      }));
    }
    return this.slots
      .filter(s => s.occupied)
      .map(s => ({
        nickname: s.nickname,
        characterType: this.getPlayerCharType(s.nickname),
        isMe: s.isMe,
      }));
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    if (this.salaId && this.myPlayerId && !this.isLocal) {
      this.socketService.leaveRoom(this.salaId, this.myPlayerId);
    }
    this.socketService.disconnect();
    this.soundService.stopMusic();
  }

  iniciarSeleccionPersonaje() {
    this.soundService.playMenuClick();
    this.phase = 'character';
    if (!this.isLocal && this.salaId) {
      this.socketService.sendLobbyPhase(this.salaId, 'character');
    }
  }

  onCharacterSelected(type: CharacterType) {
    this.soundService.playMenuClick();

    if (this.isLocal) {
      if (this.currentHumanIndex >= this.humanSlots.length) return;
      const currentHuman = this.humanSlots[this.currentHumanIndex];
      currentHuman.characterType = type;
      this.playerCharacterMap[currentHuman.nickname] = type;

      this.takenCharacters.push({
        type,
        playerId: 'p' + currentHuman.slot + '_local',
        nickname: currentHuman.nickname,
        color: currentHuman.color,
      });
      this.takenCharacters = [...this.takenCharacters];

      this.currentHumanIndex++;
      if (this.currentHumanIndex < this.humanSlots.length) {
        const nextHuman = this.humanSlots[this.currentHumanIndex];
        this.myPlayerId = 'p' + nextHuman.slot + '_local';
        this.myNickname = nextHuman.nickname;
        this.myColor = nextHuman.color;
        this.currentPickerName = nextHuman.nickname;
      } else {
        const allTypes: CharacterType[] = ['star', 'mushroom', 'crystal', 'rocket'];
        const chosenTypes = this.takenCharacters.map(t => t.type);
        const availableTypes = allTypes.filter(t => !chosenTypes.includes(t));
        let availIdx = 0;
        this.localSlots.forEach(s => {
          if (s.isBot) {
            const botType = availableTypes[availIdx % availableTypes.length] || 'star';
            s.characterType = botType;
            this.takenCharacters.push({
              type: botType,
              playerId: 'p' + s.slot + '_bot',
              nickname: s.nickname,
              color: s.color,
            });
            this.playerCharacterMap[s.nickname] = botType;
            availIdx++;
          }
        });
        this.takenCharacters = [...this.takenCharacters];
        this.allLocalHumansChosen = true;
        this.currentPickerName = '¡Todos listos!';
      }

      sessionStorage.setItem('codearena_local_players', JSON.stringify(this.localSlots));
      return;
    }

    this.myCharacterType = type;
    sessionStorage.setItem('codearena_character', type);
    this.socketService.selectCharacter(this.salaId, this.myPlayerId, type);

    const existing = this.takenCharacters.find(t => t.playerId === this.myPlayerId);
    if (existing) {
      existing.type = type;
    } else {
      this.takenCharacters.push({ type, playerId: this.myPlayerId, nickname: this.myNickname, color: this.myColor });
    }
    this.takenCharacters = [...this.takenCharacters];
  }

  iniciarVotacionEscenario() {
    this.soundService.playMenuClick();
    this.phase = 'scenario';
    if (!this.isLocal && this.salaId) {
      this.socketService.sendLobbyPhase(this.salaId, 'scenario');
    }
  }

  onScenarioVoted(scenarioId: ScenarioId) {
    this.soundService.playMenuClick();
    this.scenarioWinner = scenarioId;
    this.scenarioVoteCounts = { [scenarioId]: 1 };
    sessionStorage.setItem('codearena_scenario', scenarioId);
    if (!this.isLocal) {
      this.socketService.voteScenario(this.salaId, this.myPlayerId, scenarioId);
    }
  }

  onVoteFinished(winner: ScenarioId) {
    this.scenarioWinner = winner;
    sessionStorage.setItem('codearena_scenario', winner);
  }

  iniciarPartida() {
    this.soundService.stopMusic();
    this.soundService.playMenuClick();
    sessionStorage.setItem('codearena_scenario', this.scenarioWinner);
    sessionStorage.setItem('codearena_gamemode', this.gameMode);

    if (this.isLocal) {
      sessionStorage.setItem('codearena_local_players', JSON.stringify(this.localSlots));
      sessionStorage.setItem('codearena_character', this.localSlots[0].characterType || 'star');
      this.router.navigate(['/arena/local']);
      return;
    }

    if (this.salaId) {
      this.socketService.startGame(this.salaId, this.myPlayerId, this.targetStars, this.targetPoints);
    }
  }

  setGameMode(mode: 'local' | 'lan') {
    this.gameMode = mode;
    this.soundService.playMenuHover();
    sessionStorage.setItem('codearena_gamemode', mode);
  }

  getCharEmoji(type: string): string {
    const def = CHARACTER_DEFS.find(d => d.type === type);
    return def?.emoji || '🎮';
  }

  getPlayerCharType(nickname: string): CharacterType | '' {
    return this.playerCharacterMap[nickname] || '';
  }

  toggleSound() {
    this.isMuted = this.soundService.toggleMute();
  }

  private navigateToArena() {
    this.soundService.stopMusic();
    this.router.navigate(['/arena', this.codigoSala]);
  }
}