import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { GameState, Vector3D, Pregunta, Habilidad } from '../models/game.models';
import { CharacterType } from '../arena/characters/character.factory';
import { ScenarioId } from '../arena/scenarios/scenario.factory';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = typeof window !== 'undefined'
    ? ((window as any).__CODEARENA_SERVER_URL__ || `http://${window.location.hostname || 'localhost'}:3000`)
    : 'http://localhost:3000';

  private roomStateSubject = new Subject<GameState>();
  public roomState$ = this.roomStateSubject.asObservable();

  private playerMovedSubject = new Subject<{ playerId: string; position: Vector3D; rotation: { y: number } }>();
  public playerMoved$ = this.playerMovedSubject.asObservable();

  private gameStartSubject = new Subject<GameState>();
  public gameStart$ = this.gameStartSubject.asObservable();

  private skillQuestionSubject = new Subject<{ habilidad: Habilidad; pregunta: Pregunta }>();
  public skillQuestion$ = this.skillQuestionSubject.asObservable();

  private skillUnlockedSubject = new Subject<{ habilidad: Habilidad }>();
  public skillUnlocked$ = this.skillUnlockedSubject.asObservable();

  private skillFailedSubject = new Subject<{ habilidad: Habilidad }>();
  public skillFailed$ = this.skillFailedSubject.asObservable();

  private skillEffectSubject = new Subject<any>();
  public skillEffect$ = this.skillEffectSubject.asObservable();

  private attackBlockedSubject = new Subject<any>();
  public attackBlocked$ = this.attackBlockedSubject.asObservable();

  private scoreUpdateSubject = new Subject<{ playerId: string; score: number; health: number; lives?: number }>();
  public scoreUpdate$ = this.scoreUpdateSubject.asObservable();

  private playerDisconnectedSubject = new Subject<{ playerId: string; nickname?: string }>();
  public playerDisconnected$ = this.playerDisconnectedSubject.asObservable();

  private gameOverSubject = new Subject<{ winnerId: string; winnerNickname: string; ranking: any[] }>();
  public gameOver$ = this.gameOverSubject.asObservable();

  private hostChangedSubject = new Subject<{ newHostId: string }>();
  public hostChanged$ = this.hostChangedSubject.asObservable();

  private characterSelectedSubject = new Subject<{ playerId: string; characterType: CharacterType }>();
  public characterSelected$ = this.characterSelectedSubject.asObservable();

  private scenarioVotesSubject = new Subject<{ votes: Record<string,string>; voteCounts: Record<string,number>; currentWinner: string }>();
  public scenarioVotes$ = this.scenarioVotesSubject.asObservable();

  private playerRespawnSubject = new Subject<{ playerId: string; position: Vector3D; health: number; lives: number }>();
  public playerRespawn$ = this.playerRespawnSubject.asObservable();

  private playerEliminatedSubject = new Subject<{ playerId: string; nickname: string }>();
  public playerEliminated$ = this.playerEliminatedSubject.asObservable();

  private lobbyPhaseSubject = new Subject<{ phase: any }>();
  public lobbyPhase$ = this.lobbyPhaseSubject.asObservable();

  private boardTurnStartSubject = new Subject<{ currentTurnPlayerId: string; currentTurnNickname: string; currentTurnIndex: number; currentRound: number; totalRounds?: number; targetStars?: number; targetPoints?: number }>();
  public boardTurnStart$ = this.boardTurnStartSubject.asObservable();

  private boardDiceRollingSubject = new Subject<{ playerId: string; nickname: string; characterType: string }>();
  public boardDiceRolling$ = this.boardDiceRollingSubject.asObservable();

  private boardDiceResultSubject = new Subject<{ playerId: string; nickname: string; characterType: string; diceRoll: number; steps: number; isBoost: boolean; targetTileIndex: number }>();
  public boardDiceResult$ = this.boardDiceResultSubject.asObservable();

  private boardPlayerUpdatedSubject = new Subject<{ playerId: string; nickname: string; score: number; stars: number; tileIndex: number; skillsReady?: any }>();
  public boardPlayerUpdated$ = this.boardPlayerUpdatedSubject.asObservable();

  connect() {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('room-state', (data: GameState) => this.roomStateSubject.next(data));
    this.socket.on('player-moved', (data) => this.playerMovedSubject.next(data));
    this.socket.on('game-start', (data: GameState) => this.gameStartSubject.next(data));
    this.socket.on('skill-question', (data) => this.skillQuestionSubject.next(data));
    this.socket.on('skill-unlocked', (data) => this.skillUnlockedSubject.next(data));
    this.socket.on('skill-failed', (data) => this.skillFailedSubject.next(data));
    this.socket.on('skill-effect', (data) => this.skillEffectSubject.next(data));
    this.socket.on('attack-blocked', (data) => this.attackBlockedSubject.next(data));
    this.socket.on('score-update', (data) => this.scoreUpdateSubject.next(data));
    this.socket.on('player-disconnected', (data) => this.playerDisconnectedSubject.next(data));
    this.socket.on('game-over', (data) => this.gameOverSubject.next(data));
    this.socket.on('host-changed', (data) => this.hostChangedSubject.next(data));
    this.socket.on('character-selected', (data) => this.characterSelectedSubject.next(data));
    this.socket.on('scenario-votes-update', (data) => this.scenarioVotesSubject.next(data));
    this.socket.on('player-respawn', (data) => this.playerRespawnSubject.next(data));
    this.socket.on('player-eliminated', (data) => this.playerEliminatedSubject.next(data));
    this.socket.on('lobby-phase', (data) => this.lobbyPhaseSubject.next(data));
    this.socket.on('board-turn-start', (data) => this.boardTurnStartSubject.next(data));
    this.socket.on('board-dice-rolling', (data) => this.boardDiceRollingSubject.next(data));
    this.socket.on('board-dice-result', (data) => this.boardDiceResultSubject.next(data));
    this.socket.on('board-player-updated', (data) => this.boardPlayerUpdatedSubject.next(data));
  }

  joinRoom(codigoSala: string, playerId: string, nickname: string, color: string, characterType?: string) {
    this.connect();
    this.socket?.emit('join-room', { codigoSala, playerId, nickname, color, characterType });
  }

  startGame(salaId: string, hostId: string, targetStars?: number, targetPoints?: number) {
    this.socket?.emit('start-game', { salaId, hostId, targetStars, targetPoints });
  }

  sendMove(salaId: string, playerId: string, position: Vector3D, rotation: { y: number }) {
    this.socket?.emit('player-move', { salaId, playerId, position, rotation });
  }

  requestSkill(salaId: string, playerId: string, habilidad: Habilidad) {
    this.socket?.emit('request-skill', { salaId, playerId, habilidad });
  }

  answerSkill(salaId: string, playerId: string, habilidad: Habilidad, respuesta: number) {
    this.socket?.emit('answer-skill', { salaId, playerId, habilidad, respuesta });
  }

  useSkill(salaId: string, playerId: string, habilidad: Habilidad, targetId?: string, isCharged?: boolean) {
    this.socket?.emit('use-skill', { salaId, playerId, habilidad, targetId, isCharged });
  }

  selectCharacter(salaId: string, playerId: string, characterType: CharacterType) {
    this.connect();
    this.socket?.emit('select-character', { salaId, playerId, characterType });
  }

  voteScenario(salaId: string, playerId: string, scenarioId: ScenarioId) {
    this.connect();
    this.socket?.emit('vote-scenario', { salaId, playerId, scenarioId });
  }

  sendLobbyPhase(salaId: string, phase: string) {
    this.socket?.emit('lobby-phase', { salaId, phase });
  }

  sendBoardRollIntent(salaId: string, playerId: string) {
    this.socket?.emit('board-roll-intent', { salaId, playerId });
  }

  sendBoardHitDice(salaId: string, playerId: string, forcedRoll?: number, isBoost?: boolean) {
    this.socket?.emit('board-hit-dice', { salaId, playerId, forcedRoll, isBoost });
  }

  sendBoardTileEffect(salaId: string, playerId: string, tileType: string, scoreDelta?: number, starsDelta?: number, skillUnlocked?: string) {
    this.socket?.emit('board-tile-effect', { salaId, playerId, tileType, scoreDelta, starsDelta, skillUnlocked });
  }

  sendBoardEndTurn(salaId: string) {
    this.socket?.emit('board-end-turn', { salaId });
  }

  leaveRoom(salaId: string, playerId: string) {
    this.socket?.emit('leave-room', { salaId, playerId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}