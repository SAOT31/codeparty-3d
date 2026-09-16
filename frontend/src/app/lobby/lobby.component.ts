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
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
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

      if (state.scenarioId) {
        this.scenarioWinner = state.scenarioId as ScenarioId;
        sessionStorage.setItem('codearena_scenario', state.scenarioId);
      }
    }));

    this.subs.push(this.socketService.gameStart$.subscribe((data: any) => {
      if (data?.scenarioId) {
        this.scenarioWinner = data.scenarioId as ScenarioId;
        sessionStorage.setItem('codearena_scenario', data.scenarioId);
      }
      this.navigateToArena();
    }));

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
      this.router.navigate(['/tablero/local']);
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
    this.router.navigate(['/tablero', this.codigoSala]);
  }
}