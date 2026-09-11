import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SalasService } from '../salas/salas.service';
import { AiService } from '../ai/ai.service';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerLiveState {
  id: string;
  nickname: string;
  color: string;
  characterType: string;
  position: Vector3D;
  rotation: { y: number };
  health: number;
  lives: number;
  score: number;
  stars?: number;
  tileIndex?: number;
  skillsReady?: { boost: boolean; shield: boolean; attack: boolean };
  shield: boolean;
  boostActive: boolean;
  chargedReady: boolean;
  connected: boolean;
  socketId: string;
}

export interface GameLiveState {
  salaId: string;
  codigo: string;
  tema: string;
  scenarioId: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Record<string, PlayerLiveState>;
  hostId: string;
  winnerId?: string;
  pendingQuestions?: Map<string, { habilidad: string; correcta: number }>;
  scenarioVotes: Record<string, string>;
  currentTurnPlayerId?: string;
  currentTurnIndex?: number;
  turnOrder?: string[];
  currentRound?: number;
  totalRounds?: number;
  targetStars?: number;
  targetPoints?: number;
  diceWaitingForHit?: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ArenaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private games = new Map<string, GameLiveState>();
  private socketMap = new Map<string, { salaId: string; playerId: string }>();

  constructor(
    private readonly salasService: SalasService,
    private readonly aiService: AiService,
  ) {}

  handleConnection(client: Socket) {}

  async handleDisconnect(client: Socket) {
    const meta = this.socketMap.get(client.id);
    if (!meta) return;

    this.socketMap.delete(client.id);
    const game = this.games.get(meta.salaId);
    if (!game) return;

    const player = game.players[meta.playerId];
    if (player) {
      player.connected = false;
      this.server.to(game.codigo).emit('player-disconnected', {
        playerId: meta.playerId,
        nickname: player.nickname,
      });
      this.salasService.marcarDesconectado(meta.playerId).catch(() => {});
    }

    const conectados = Object.values(game.players).filter(p => p.connected);
    if (conectados.length === 0) {
      game.status = 'FINISHED';
      this.salasService.cambiarEstado(game.salaId, 'FINISHED').catch(() => {});
      this.games.delete(game.salaId);
      return;
    }

    if (game.hostId === meta.playerId && game.status !== 'FINISHED') {
      const nuevoHost = conectados[0];
      if (nuevoHost) {
        game.hostId = nuevoHost.id;
        this.server.to(game.codigo).emit('host-changed', { newHostId: nuevoHost.id });
      }
    }

    if (game.status === 'PLAYING') {
      const vivos = conectados.filter(p => p.lives > 0);
      if (vivos.length === 1) {
        this.declararGanador(game, vivos[0].id);
      }
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @MessageBody() data: { salaId: string; playerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;

    const player = game.players[data.playerId];
    if (player) {
      player.connected = false;
      client.leave(game.codigo);
      this.socketMap.delete(client.id);
      this.server.to(game.codigo).emit('player-disconnected', {
        playerId: data.playerId,
        nickname: player.nickname,
      });
      await this.salasService.marcarDesconectado(data.playerId);
    }

    const conectados = Object.values(game.players).filter(p => p.connected);
    if (conectados.length === 0) {
      game.status = 'FINISHED';
      await this.salasService.cambiarEstado(game.salaId, 'FINISHED');
      this.games.delete(game.salaId);
    } else if (game.hostId === data.playerId && game.status !== 'FINISHED') {
      const nuevoHost = conectados[0];
      if (nuevoHost) {
        game.hostId = nuevoHost.id;
        this.server.to(game.codigo).emit('host-changed', { newHostId: nuevoHost.id });
      }
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: { codigoSala: string; playerId: string; nickname: string; color: string; characterType?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { codigoSala, playerId, nickname, color, characterType } = data;
    const codigoUpper = codigoSala.toUpperCase();

    const info = await this.salasService.obtenerPorCodigo(codigoUpper);
    const salaId = info.sala.id;

    client.join(codigoUpper);
    this.socketMap.set(client.id, { salaId, playerId });

    let game = this.games.get(salaId);
    if (!game) {
      game = {
        salaId,
        codigo: codigoUpper,
        tema: info.sala.tema,
        scenarioId: 'isla',
        status: info.sala.estado,
        players: {},
        hostId: playerId,
        pendingQuestions: new Map(),
        scenarioVotes: {},
      };
      this.games.set(salaId, game);
    }

    const count = Object.keys(game.players).length;
    const spawns: Vector3D[] = [
      { x: -6, y: 1.5, z: -6 }, { x: 6, y: 1.5, z: 6 },
      { x: -6, y: 1.5, z: 6 }, { x: 6, y: 1.5, z: -6 },
    ];
    const spawnPos = spawns[count % 4] || { x: 0, y: 1.5, z: 0 };

    if (!game.players[playerId]) {
      game.players[playerId] = {
        id: playerId,
        nickname: nickname || `Piloto_${count + 1}`,
        color: color || '#00f5ff',
        characterType: characterType || 'star',
        position: spawnPos,
        rotation: { y: 0 },
        health: 100,
        lives: 3,
        score: 0,
        shield: false,
        boostActive: false,
        chargedReady: false,
        connected: true,
        socketId: client.id,
      };
    } else {
      game.players[playerId].connected = true;
      game.players[playerId].socketId = client.id;
      if (characterType) game.players[playerId].characterType = characterType;
    }

    this.server.to(codigoUpper).emit('room-state', this.serializarEstado(game));
  }

  private getGame(idOrCodigo: string): GameLiveState | undefined {
    if (!idOrCodigo) return undefined;
    if (this.games.has(idOrCodigo)) return this.games.get(idOrCodigo);
    const upper = idOrCodigo.toUpperCase();
    for (const g of this.games.values()) {
      if (g.codigo === upper || g.salaId === idOrCodigo) return g;
    }
    return undefined;
  }

  @SubscribeMessage('start-game')
  async handleStartGame(
    @MessageBody() data: { salaId: string; hostId: string; targetStars?: number; targetPoints?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;

    if (game.hostId === data.hostId || Object.keys(game.players)[0] === data.hostId) {
      game.status = 'PLAYING';
      game.turnOrder = Object.keys(game.players).filter(id => game.players[id].connected);
      game.currentTurnIndex = 0;
      game.currentTurnPlayerId = game.turnOrder[0] || game.hostId;
      game.targetStars = data.targetStars || game.targetStars || 2;
      game.targetPoints = data.targetPoints || game.targetPoints || 100;
      game.currentRound = 1;

      await this.salasService.cambiarEstado(game.salaId, 'PLAYING');
      this.server.to(game.codigo).emit('game-start', this.serializarEstado(game));

      const firstPlayer = game.players[game.currentTurnPlayerId];
      this.server.to(game.codigo).emit('board-turn-start', {
        currentTurnPlayerId: game.currentTurnPlayerId,
        currentTurnNickname: firstPlayer ? firstPlayer.nickname : '',
        currentTurnIndex: 0,
        currentRound: 1,
        targetStars: game.targetStars,
        targetPoints: game.targetPoints,
      });
    }
  }

  @SubscribeMessage('player-move')
  handlePlayerMove(
    @MessageBody() data: { salaId: string; playerId: string; position: Vector3D; rotation: { y: number } },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;
    if (game.status !== 'PLAYING') game.status = 'PLAYING';

    const player = game.players[data.playerId];
    if (player && player.connected) {
      player.position = data.position;
      player.rotation = data.rotation;

      client.to(game.codigo).emit('player-moved', {
        playerId: data.playerId,
        position: data.position,
        rotation: data.rotation,
      });
    }
  }

  @SubscribeMessage('request-skill')
  async handleRequestSkill(
    @MessageBody() data: { salaId: string; playerId: string; habilidad: 'boost' | 'attack' | 'shield' },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;
    if (game.status !== 'PLAYING') game.status = 'PLAYING';

    const player = game.players[data.playerId];
    if (!player || player.lives <= 0) return;

    if (game.pendingQuestions?.has(`${data.playerId}_${data.habilidad}`)) return;

    const pregunta = await this.aiService.generarPregunta(game.tema, data.habilidad);

    if (!game.pendingQuestions) game.pendingQuestions = new Map();
    game.pendingQuestions.set(`${data.playerId}_${data.habilidad}`, {
      habilidad: data.habilidad,
      correcta: pregunta.correcta,
    });

    client.emit('skill-question', {
      habilidad: data.habilidad,
      pregunta: {
        enunciado: pregunta.enunciado,
        opciones: pregunta.opciones,
        correcta: pregunta.correcta,
        dificultad: pregunta.dificultad,
      },
    });
  }

  @SubscribeMessage('answer-skill')
  async handleAnswerSkill(
    @MessageBody() data: { salaId: string; playerId: string; habilidad: string; respuesta: number },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;
    if (game.status !== 'PLAYING') game.status = 'PLAYING';

    const player = game.players[data.playerId];
    if (!player) return;

    const key = `${data.playerId}_${data.habilidad}`;
    const pending = game.pendingQuestions?.get(key);
    if (!pending) return;

    game.pendingQuestions.delete(key);
    const esCorrecto = Number(data.respuesta) === pending.correcta;

    if (esCorrecto) {
      player.score += 5;
      await this.salasService.actualizarPuntaje(player.id, player.score);

      if (data.habilidad === 'attack') {
        player.chargedReady = true;
        setTimeout(() => { if (game.players[player.id]) game.players[player.id].chargedReady = false; }, 12000);
      }

      client.emit('skill-unlocked', { habilidad: data.habilidad });
      this.server.to(game.codigo).emit('score-update', {
        playerId: player.id,
        score: player.score,
        health: player.health,
        lives: player.lives,
      });

      if (player.score >= 100) this.declararGanador(game, player.id);
    } else {
      client.emit('skill-failed', { habilidad: data.habilidad });
    }
  }

  @SubscribeMessage('use-skill')
  async handleUseSkill(
    @MessageBody() data: { salaId: string; playerId: string; habilidad: 'boost' | 'attack' | 'shield'; targetId?: string; isCharged?: boolean },
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;
    if (game.status !== 'PLAYING') game.status = 'PLAYING';

    const player = game.players[data.playerId];
    if (!player || player.lives <= 0) return;

    if (data.habilidad === 'boost') {
      player.boostActive = true;
      this.server.to(game.codigo).emit('skill-effect', {
        habilidad: 'boost', fromId: player.id, duration: 5000,
      });
      setTimeout(() => { if (game.players[player.id]) game.players[player.id].boostActive = false; }, 5000);

    } else if (data.habilidad === 'shield') {
      player.shield = true;
      this.server.to(game.codigo).emit('skill-effect', {
        habilidad: 'shield', fromId: player.id, duration: 6000,
      });
      setTimeout(() => { if (game.players[player.id]) game.players[player.id].shield = false; }, 6000);

    } else if (data.habilidad === 'attack') {
      const damage = data.isCharged ? 35 : 10;
      if (data.isCharged && player.chargedReady) {
        player.chargedReady = false;
      }

      let target: PlayerLiveState | null = null;
      if (data.targetId && game.players[data.targetId]) {
        target = game.players[data.targetId];
      } else {
        const otros = Object.values(game.players).filter(
          p => p.id !== player.id && p.connected && p.lives > 0,
        );
        target = otros[0] || null;
      }

      if (target) {
        if (target.shield) {
          this.server.to(game.codigo).emit('attack-blocked', {
            fromId: player.id, targetId: target.id,
          });
        } else {
          target.health = Math.max(0, target.health - damage);
          player.score += data.isCharged ? 15 : 10;

          if (target.health === 0) {
            target.lives--;
            if (target.lives > 0) {
              target.health = 100;
              const spawns: Vector3D[] = [
                { x: -6, y: 1.5, z: -6 }, { x: 6, y: 1.5, z: 6 },
                { x: -6, y: 1.5, z: 6 }, { x: 6, y: 1.5, z: -6 },
              ];
              target.position = spawns[Math.floor(Math.random() * spawns.length)];
              this.server.to(game.codigo).emit('player-respawn', {
                playerId: target.id,
                position: target.position,
                health: target.health,
                lives: target.lives,
              });
              player.score += 25;
            } else {
              player.score += 50;
              this.server.to(game.codigo).emit('player-eliminated', {
                playerId: target.id,
                nickname: target.nickname,
              });
            }
          }

          await this.salasService.actualizarPuntaje(player.id, player.score);

          this.server.to(game.codigo).emit('skill-effect', {
            habilidad: 'attack',
            fromId: player.id,
            targetId: target.id,
            damage,
            isCharged: data.isCharged || false,
            targetHealth: target.health,
            targetLives: target.lives,
            attackerScore: player.score,
          });

          if (player.score >= 100) {
            this.declararGanador(game, player.id);
            return;
          }

          const vivos = Object.values(game.players).filter(p => p.connected && p.lives > 0);
          if (vivos.length === 1) this.declararGanador(game, vivos[0].id);
        }
      }
    }
  }

  @SubscribeMessage('select-character')
  handleSelectCharacter(
    @MessageBody() data: { salaId: string; playerId: string; characterType: string },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game || game.status !== 'WAITING') return;
    const player = game.players[data.playerId];
    if (player) {
      player.characterType = data.characterType;
      this.server.to(game.codigo).emit('character-selected', {
        playerId: data.playerId,
        characterType: data.characterType,
      });
    }
  }

  @SubscribeMessage('vote-scenario')
  handleVoteScenario(
    @MessageBody() data: { salaId: string; playerId: string; scenarioId: string },
  ) {
    const game = this.getGame(data.salaId);
    if (!game || game.status !== 'WAITING') return;
    game.scenarioVotes[data.playerId] = data.scenarioId;

    const voteCounts: Record<string, number> = {};
    Object.values(game.scenarioVotes).forEach(s => {
      voteCounts[s] = (voteCounts[s] || 0) + 1;
    });

    const winner = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
    if (winner) game.scenarioId = winner[0];

    this.server.to(game.codigo).emit('scenario-votes-update', {
      votes: game.scenarioVotes,
      voteCounts,
      currentWinner: game.scenarioId,
    });
  }

  @SubscribeMessage('lobby-phase')
  handleLobbyPhase(
    @MessageBody() data: { salaId: string; phase: string },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;
    this.server.to(game.codigo).emit('lobby-phase', { phase: data.phase });
  }

  @SubscribeMessage('board-roll-intent')
  handleBoardRollIntent(
    @MessageBody() data: { salaId: string; playerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;
    const player = game.players[data.playerId];
    if (!player) return;
    game.diceWaitingForHit = true;
    this.server.to(game.codigo).emit('board-dice-rolling', {
      playerId: data.playerId,
      nickname: player.nickname,
      characterType: player.characterType,
    });
  }

  @SubscribeMessage('board-hit-dice')
  handleBoardHitDice(
    @MessageBody() data: { salaId: string; playerId: string; forcedRoll?: number; isBoost?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;
    const player = game.players[data.playerId];
    if (!player) return;
    game.diceWaitingForHit = false;

    const diceRoll = (data.forcedRoll && data.forcedRoll >= 1 && data.forcedRoll <= 6)
      ? data.forcedRoll
      : Math.floor(Math.random() * 6) + 1;
    const isBoost = data.isBoost || player.boostActive;
    const steps = isBoost ? diceRoll * 2 : diceRoll;
    if (player.boostActive) player.boostActive = false;

    player.tileIndex = ((player.tileIndex || 0) + steps) % 36;

    this.server.to(game.codigo).emit('board-dice-result', {
      playerId: data.playerId,
      nickname: player.nickname,
      characterType: player.characterType,
      diceRoll,
      steps,
      isBoost,
      targetTileIndex: player.tileIndex,
    });
  }

  @SubscribeMessage('board-tile-effect')
  async handleBoardTileEffect(
    @MessageBody() data: { salaId: string; playerId: string; tileType: string; scoreDelta?: number; pointsDelta?: number; starsDelta?: number; skillUnlocked?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;
    const player = game.players[data.playerId];
    if (!player) return;

    const delta = data.scoreDelta !== undefined ? data.scoreDelta : data.pointsDelta;
    if (delta !== undefined && delta !== 0) {
      player.score = Math.max(0, player.score + delta);
      await this.salasService.actualizarPuntaje(player.id, player.score);
    }
    if (data.starsDelta) {
      player.stars = (player.stars || 0) + data.starsDelta;
    }
    if (data.skillUnlocked) {
      if (!player.skillsReady) {
        player.skillsReady = { boost: false, shield: false, attack: false };
      }
      (player.skillsReady as any)[data.skillUnlocked] = true;
    }

    this.server.to(game.codigo).emit('board-player-updated', {
      playerId: player.id,
      nickname: player.nickname,
      score: player.score,
      stars: player.stars || 0,
      tileIndex: player.tileIndex || 0,
      skillsReady: player.skillsReady,
    });

    const targetStars = game.targetStars || 2;
    const targetPoints = game.targetPoints || 100;
    if ((player.stars && player.stars >= targetStars) || player.score >= targetPoints) {
      this.declararGanador(game, player.id);
      return;
    }
  }

  @SubscribeMessage('board-end-turn')
  handleBoardEndTurn(
    @MessageBody() data: { salaId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const game = this.getGame(data.salaId);
    if (!game) return;

    const targetStars = game.targetStars || 2;
    const targetPoints = game.targetPoints || 100;
    const winnerPlayer = Object.values(game.players)
      .filter(p => p.connected)
      .find(p => (p.stars && p.stars >= targetStars) || p.score >= targetPoints);

    if (winnerPlayer) {
      this.declararGanador(game, winnerPlayer.id);
      return;
    }

    const connectedPlayerIds = Object.keys(game.players).filter(id => game.players[id].connected);
    if (connectedPlayerIds.length === 0) return;

    game.turnOrder = connectedPlayerIds;
    game.currentTurnIndex = ((game.currentTurnIndex || 0) + 1) % game.turnOrder.length;
    game.currentTurnPlayerId = game.turnOrder[game.currentTurnIndex];

    if (game.currentTurnIndex === 0) {
      game.currentRound = (game.currentRound || 1) + 1;
    }

    const nextPlayer = game.players[game.currentTurnPlayerId];
    this.server.to(game.codigo).emit('board-turn-start', {
      currentTurnPlayerId: game.currentTurnPlayerId,
      currentTurnNickname: nextPlayer ? nextPlayer.nickname : '',
      currentTurnIndex: game.currentTurnIndex,
      currentRound: game.currentRound || 1,
      targetStars: game.targetStars || 2,
      targetPoints: game.targetPoints || 100,
    });
  }

  private async declararGanador(game: GameLiveState, winnerId: string) {
    if (game.status === 'FINISHED') return;
    game.status = 'FINISHED';
    game.winnerId = winnerId;
    await this.salasService.cambiarEstado(game.salaId, 'FINISHED');

    const ganador = game.players[winnerId];
    if (ganador) {
      ganador.score += 15;
      await this.salasService.actualizarPuntaje(ganador.id, ganador.score);
    }

    const ranking = Object.values(game.players)
      .sort((a, b) => ((b.stars || 0) !== (a.stars || 0)) ? ((b.stars || 0) - (a.stars || 0)) : (b.score - a.score))
      .map(p => ({ ...p, lives: p.lives, stars: p.stars || 0 }));

    this.server.to(game.codigo).emit('game-over', {
      winnerId,
      winnerNickname: ganador?.nickname || 'Ganador',
      ranking,
    });
  }

  private serializarEstado(game: GameLiveState) {
    return {
      salaId: game.salaId,
      codigo: game.codigo,
      tema: game.tema,
      scenarioId: game.scenarioId,
      status: game.status,
      hostId: game.hostId,
      winnerId: game.winnerId,
      players: game.players,
      scenarioVotes: game.scenarioVotes,
      currentTurnPlayerId: game.currentTurnPlayerId,
      currentTurnIndex: game.currentTurnIndex,
      currentRound: game.currentRound,
      targetStars: game.targetStars || 2,
      targetPoints: game.targetPoints || 100,
    };
  }
}