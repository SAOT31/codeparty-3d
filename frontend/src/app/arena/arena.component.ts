import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import * as THREE from 'three';
import { SocketService } from '../services/socket.service';
import { DRONE_COLORS, GameState, Habilidad, Pregunta } from '../models/game.models';
import { CharacterFactory, CharacterType, CHARACTER_DEFS } from './characters/character.factory';
import { BaseCharacter } from './characters/base.character';
import { ScenarioFactory, ScenarioId } from './scenarios/scenario.factory';
import { SoundService } from '../services/sound.service';
import { InputHandler, InputMode, PlayerSlot } from './input.handler';
import { PhysicsService } from './physics.service';
import { CameraController } from './camera.controller';
import { ParticleSystem } from './particle-system';
import { HudComponent } from './hud/hud.component';
import { QuestionModalComponent } from './question-modal/question-modal.component';
import { BotService, BotState } from '../services/bot.service';
import { LOCAL_PREGUNTAS } from '../services/local-questions';
import { BoardEngine } from './board/board.engine';
import { ApiService } from '../services/api.service';
import { ArenaVfxService } from './arena-vfx.service';
import { ArenaTurnService } from './arena-turn.service';

export interface LocalPlayerState {
  id: string;
  slot: number;
  isBot: boolean;
  nickname: string;
  characterType: CharacterType;
  color: string;
  score: number;
  stars: number;
  tileIndex: number;
  skillsReady: { boost: boolean; attack: boolean; shield: boolean };
  isBoostActive: boolean;
  isShieldActive: boolean;
  charInstance?: BaseCharacter;
}

@Component({
  selector: 'app-arena',
  standalone: true,
  imports: [CommonModule, HudComponent, QuestionModalComponent],
  templateUrl: './arena.component.html',
  styleUrl: './arena.component.scss',
})
export class ArenaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('renderCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  public codigoSala: string = '';
  public myPlayerId: string = '';
  public myNickname: string = 'Piloto';
  public myColor: string = '#00f5ff';
  public myHealth: number = 100;
  public myLives: number = 3;
  public myScore: number = 0;
  public rankingPlayers: any[] = [];
  public notification: string = '';
  public disconnectedPlayer: string = '';
  public isWinner: boolean = false;
  public chargedReady: boolean = false;
  public myCharacterEmoji: string = '⭐';

  public skillsReady = { boost: false, attack: false, shield: false };
  public activeQuestion: Pregunta | null = null;
  public activeSkillRequested: Habilidad = 'boost';
  public gameOverData: any = null;

  public isCpuMode: boolean = false;
  public numBots: number = 0;
  public isLocalMultiplayer: boolean = false;
  public localPlayersList: LocalPlayerState[] = [];
  public currentLocalTurnIndex: number = 0;
  public isGamePaused: boolean = false;
  public isMuted: boolean = false;

  public myStars: number = 0;
  public isMyTurn: boolean = true;
  public currentTurnNickname: string = 'Tú';
  public isDiceRolling: boolean = false;
  public boardEngine!: BoardEngine;
  public myTileIndex = 0;
  public roundNumber = 1;
  public totalRounds = 5;
  public targetStars = 2;
  public targetPoints = 100;
  public diceWaitingForHit: boolean = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private cameraController!: CameraController;
  private physicsService = new PhysicsService();
  private inputHandler!: InputHandler;

  private myCharacter!: BaseCharacter;
  private myCharacterType: CharacterType = 'star';
  private otherCharacters = new Map<string, BaseCharacter>();
  private playerPositions = new Map<string, THREE.Vector3>();
  private clock = new THREE.Clock();
  private animationFrameId: number = 0;
  private lastMoveEmitTime = 0;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private mouseDownHandler: ((e: MouseEvent) => void) | null = null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseUpHandler: ((e: MouseEvent) => void) | null = null;
  private touchStartHandler: ((e: TouchEvent) => void) | null = null;
  private touchMoveHandler: ((e: TouchEvent) => void) | null = null;
  private touchEndHandler: ((e: TouchEvent) => void) | null = null;
  private isBoostActive = false;
  private isShieldActive = false;
  private scenarioId: ScenarioId = 'isla';
  private gameMode: InputMode = 'lan';
  private playerSlot: PlayerSlot = 1;
  private temaPartida: string = 'Angular';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private botService: BotService,
    private soundService: SoundService,
    private apiService: ApiService,
    private arenaVfx: ArenaVfxService,
    private arenaTurnService: ArenaTurnService,
  ) {}

  ngOnInit() {
    this.codigoSala = this.route.snapshot.paramMap.get('codigo') || '';
    this.myPlayerId = sessionStorage.getItem('codearena_playerId') || 'p_' + Date.now();
    this.myNickname = sessionStorage.getItem('codearena_nickname') || 'Piloto';
    this.myColor = sessionStorage.getItem('codearena_color') || '#4ECDC4';
    this.temaPartida = sessionStorage.getItem('codearena_tema') || 'Angular';
    this.scenarioId = (sessionStorage.getItem('codearena_scenario') || 'isla') as ScenarioId;
    this.gameMode = (sessionStorage.getItem('codearena_gamemode') || 'lan') as InputMode;
    this.myCharacterType = (sessionStorage.getItem('codearena_character') || 'star') as CharacterType;

    this.playerSlot = (parseInt(sessionStorage.getItem('codearena_slot') || '1', 10) || 1) as PlayerSlot;
    this.targetStars = parseInt(sessionStorage.getItem('codearena_target_stars') || '2', 10);
    this.targetPoints = parseInt(sessionStorage.getItem('codearena_target_points') || '100', 10);

    const def = CHARACTER_DEFS.find(d => d.type === this.myCharacterType);
    this.myCharacterEmoji = def?.emoji || '⭐';

    const modo = sessionStorage.getItem('codearena_modo');
    this.isLocalMultiplayer = modo === 'local';
    this.isCpuMode = modo === 'cpu';
    this.numBots = parseInt(sessionStorage.getItem('codearena_num_bots') || '0', 10);
    const dificultad = sessionStorage.getItem('codearena_dificultad') || 'basico';

    this.boardEngine = new BoardEngine(this.scenarioId);
    this.boardEngine.onDiceTick = (val: number) => {
      this.soundService.playDiceTick(val);
    };
    this.inputHandler = new InputHandler(this.gameMode, this.playerSlot);

    if (this.isLocalMultiplayer) {
      try {
        const raw = JSON.parse(sessionStorage.getItem('codearena_local_players') || '[]');
        if (Array.isArray(raw) && raw.length > 0) {
          this.localPlayersList = raw.map((r: any, idx: number) => ({
            id: r.id || `local_p_${idx + 1}`,
            slot: r.slot || (idx + 1),
            isBot: !!r.isBot,
            nickname: r.nickname || (r.isBot ? `Bot ${idx + 1}` : `Jugador ${idx + 1}`),
            characterType: (r.characterType || 'star') as CharacterType,
            color: r.color || DRONE_COLORS[idx % DRONE_COLORS.length],
            score: 0,
            stars: 0,
            tileIndex: 0,
            skillsReady: { boost: false, attack: false, shield: false },
            isBoostActive: false,
            isShieldActive: false,
          }));
        }
      } catch {}

      if (this.localPlayersList.length === 0) {
        this.localPlayersList = [
          { id: 'local_p_1', slot: 1, isBot: false, nickname: 'Jugador 1', characterType: 'star', color: '#00f5ff', score: 0, stars: 0, tileIndex: 0, skillsReady: { boost: false, attack: false, shield: false }, isBoostActive: false, isShieldActive: false },
          { id: 'local_p_2', slot: 2, isBot: false, nickname: 'Jugador 2', characterType: 'mushroom', color: '#ff003c', score: 0, stars: 0, tileIndex: 0, skillsReady: { boost: false, attack: false, shield: false }, isBoostActive: false, isShieldActive: false },
          { id: 'local_p_3', slot: 3, isBot: true, nickname: 'Bot Beta', characterType: 'crystal', color: '#bf00ff', score: 0, stars: 0, tileIndex: 0, skillsReady: { boost: false, attack: false, shield: false }, isBoostActive: false, isShieldActive: false },
          { id: 'local_p_4', slot: 4, isBot: true, nickname: 'Bot Gamma', characterType: 'rocket', color: '#00ff88', score: 0, stars: 0, tileIndex: 0, skillsReady: { boost: false, attack: false, shield: false }, isBoostActive: false, isShieldActive: false },
        ];
      }

      const first = this.localPlayersList[0];
      this.myNickname = first.nickname;
      this.myColor = first.color;
      this.myCharacterType = first.characterType;
      this.myCharacterEmoji = CHARACTER_DEFS.find(d => d.type === first.characterType)?.emoji || '⭐';
      this.currentTurnNickname = first.nickname;
      this.isMyTurn = !first.isBot;
    }

    this.isMuted = this.soundService.isAudioMuted();
    this.soundService.startGameMusic(this.scenarioId);

    if (!this.isLocalMultiplayer) {
      this.setupSocketListeners();
      if (this.codigoSala) {
        this.socketService.joinRoom(this.codigoSala, this.myPlayerId, this.myNickname, this.myColor, this.myCharacterType);
      }
      if (this.isCpuMode && this.numBots > 0) {
        this.initBots(dificultad);
      }
    }

    this.keydownHandler = (e: KeyboardEvent) => {
      if ((e.code === 'Escape' || e.code === 'KeyP') && !this.gameOverData && !this.activeQuestion) {
        e.preventDefault();
        this.togglePause();
      } else if (e.code === 'Space' && this.isMyTurn && !this.activeQuestion && !this.isGamePaused) {
        e.preventDefault();
        if (this.diceWaitingForHit) {
          this.hitDiceNow();
        } else if (!this.isDiceRolling) {
          this.showDiceAndWait();
        }
      } else if (e.code === 'Digit1' && !this.activeQuestion && !this.isGamePaused) {
        e.preventDefault();
        this.handleSkillAction('boost');
      } else if (e.code === 'Digit2' && !this.activeQuestion && !this.isGamePaused) {
        e.preventDefault();
        this.handleSkillAction('shield');
      } else if (e.code === 'Digit3' && !this.activeQuestion && !this.isGamePaused) {
        e.preventDefault();
        this.handleSkillAction('attack');
      } else if ((e.code === 'Equal' || e.code === 'NumpadAdd' || e.key === '+') && !this.activeQuestion) {
        e.preventDefault();
        this.zoomIn();
      } else if ((e.code === 'Minus' || e.code === 'NumpadSubtract' || e.key === '-') && !this.activeQuestion) {
        e.preventDefault();
        this.zoomOut();
      } else if ((e.code === 'KeyQ' || e.code === 'ArrowLeft') && !this.activeQuestion) {
        e.preventDefault();
        this.rotateLeft();
      } else if ((e.code === 'KeyE' || e.code === 'ArrowRight') && !this.activeQuestion) {
        e.preventDefault();
        this.rotateRight();
      } else if (e.code === 'KeyR' && !this.activeQuestion) {
        e.preventDefault();
        this.resetCamera();
      }
    };
    window.addEventListener('keydown', this.keydownHandler);

    this.wheelHandler = (e: WheelEvent) => {
      if (this.activeQuestion) return;
      const zoomDelta = e.deltaY * 0.0018;
      this.cameraController?.adjustZoom(zoomDelta);
    };
    window.addEventListener('wheel', this.wheelHandler, { passive: true });

    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let mouseStartX = 0;
    let mouseStartY = 0;
    let mouseStartTime = 0;
    let hasMouseMovedSignificantly = false;

    this.mouseDownHandler = (e: MouseEvent) => {
      if (this.activeQuestion || this.isGamePaused) return;
      if (e.button === 0 || e.button === 2) {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
        mouseStartTime = Date.now();
        hasMouseMovedSignificantly = false;
      }
    };

    this.mouseMoveHandler = (e: MouseEvent) => {
      if (!isDragging || this.activeQuestion || this.isGamePaused) return;
      const deltaX = e.clientX - prevX;
      const deltaY = e.clientY - prevY;
      if (Math.hypot(deltaX, deltaY) > 5) {
        hasMouseMovedSignificantly = true;
      }
      prevX = e.clientX;
      prevY = e.clientY;
      this.cameraController?.rotateOrbit(-deltaX * 0.007, deltaY * 0.004);
    };

    this.mouseUpHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const isHudElement = target && target.closest('.hud-circle-btn, .btn-roll-dice, .skill-btn, .btn-pause-action, .close-mobile-btn, .ranking-panel, .rules-panel');
      if (e.button === 0 && !hasMouseMovedSignificantly && !isHudElement) {
        const elapsed = Date.now() - mouseStartTime;
        if (elapsed < 350 && this.isMyTurn && !this.activeQuestion && !this.isGamePaused) {
          this.rollDice();
        }
      }
      isDragging = false;
    };

    window.addEventListener('mousedown', this.mouseDownHandler);
    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);

    let isTouchDragging = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchStartDist = 0;
    let hasTouchMovedSignificantly = false;

    this.touchStartHandler = (e: TouchEvent) => {
      if (this.activeQuestion || this.isGamePaused) return;
      if (e.touches.length === 1) {
        isTouchDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        hasTouchMovedSignificantly = false;
      } else if (e.touches.length >= 2) {
        isTouchDragging = false;
        hasTouchMovedSignificantly = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.hypot(dx, dy);
      }
    };

    this.touchMoveHandler = (e: TouchEvent) => {
      if (this.activeQuestion || this.isGamePaused) return;
      if (e.touches.length === 1 && isTouchDragging) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartX;
        const deltaY = currentY - touchStartY;
        if (Math.hypot(deltaX, deltaY) > 8) {
          hasTouchMovedSignificantly = true;
        }
        touchStartX = currentX;
        touchStartY = currentY;
        this.cameraController?.rotateOrbit(-deltaX * 0.009, deltaY * 0.005);
      } else if (e.touches.length >= 2 && touchStartDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const distDelta = touchStartDist - dist;
        touchStartDist = dist;
        this.cameraController?.adjustZoom(distDelta * 0.006);
      }
    };

    this.touchEndHandler = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const isHudElement = target && target.closest('.hud-circle-btn, .btn-roll-dice, .skill-btn, .btn-pause-action, .close-mobile-btn, .ranking-panel, .rules-panel');
      if (!hasTouchMovedSignificantly && !isHudElement) {
        const elapsed = Date.now() - touchStartTime;
        if (elapsed < 400 && this.isMyTurn && !this.activeQuestion && !this.isGamePaused) {
          this.rollDice();
        }
      }
      isTouchDragging = false;
      touchStartDist = 0;
    };

    window.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    window.addEventListener('touchmove', this.touchMoveHandler, { passive: true });
    window.addEventListener('touchend', this.touchEndHandler, { passive: true });
    window.addEventListener('touchcancel', this.touchEndHandler, { passive: true });
  }

  zoomIn() {
    this.cameraController?.adjustZoom(-0.25);
    this.soundService.playMenuHover();
  }

  zoomOut() {
    this.cameraController?.adjustZoom(0.25);
    this.soundService.playMenuHover();
  }

  rotateLeft() {
    this.cameraController?.rotateOrbit(Math.PI / 8);
    this.soundService.playMenuHover();
  }

  rotateRight() {
    this.cameraController?.rotateOrbit(-Math.PI / 8);
    this.soundService.playMenuHover();
  }

  resetCamera() {
    this.cameraController?.resetView();
    this.soundService.playMenuHover();
    this.showNotification('🎯 Vista de cámara restablecida');
  }

  ngAfterViewInit() {
    this.initThreeJS();
    this.startRenderLoop();
  }

  ngOnDestroy() {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
    }
    if (this.wheelHandler) {
      window.removeEventListener('wheel', this.wheelHandler);
    }
    if (this.mouseDownHandler) {
      window.removeEventListener('mousedown', this.mouseDownHandler);
    }
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
    }
    if (this.mouseUpHandler) {
      window.removeEventListener('mouseup', this.mouseUpHandler);
    }
    if (this.touchStartHandler) {
      window.removeEventListener('touchstart', this.touchStartHandler);
    }
    if (this.touchMoveHandler) {
      window.removeEventListener('touchmove', this.touchMoveHandler);
    }
    if (this.touchEndHandler) {
      window.removeEventListener('touchend', this.touchEndHandler);
      window.removeEventListener('touchcancel', this.touchEndHandler);
    }
    cancelAnimationFrame(this.animationFrameId);
    if (this.codigoSala && this.myPlayerId && !this.isLocalMultiplayer) {
      this.socketService.leaveRoom(this.codigoSala, this.myPlayerId);
    }
    this.socketService.disconnect();
    this.botService.clearBots();
    if (this.boardEngine) {
      this.boardEngine.hideDice();
      this.boardEngine.stopCycling();
    }
    this.soundService.stopMusic();
  }

  private initThreeJS() {
    const canvas = this.canvasRef.nativeElement;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
    this.cameraController = new CameraController(this.camera);
    this.arenaVfx.registerCameraController(this.cameraController);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    ScenarioFactory.build(this.scene, this.scenarioId);
    this.scene.add(this.boardEngine.boardGroup);

    const startTile = this.boardEngine.getTile(0);

    if (this.isLocalMultiplayer) {
      const offsets = [
        { x: 0.7, z: 0.7 },
        { x: -0.7, z: 0.7 },
        { x: 0.7, z: -0.7 },
        { x: -0.7, z: -0.7 },
      ];
      this.localPlayersList.forEach((p, idx) => {
        const char = CharacterFactory.create(p.characterType, p.color);
        const off = offsets[idx % offsets.length];
        char.mesh.position.set(startTile.position.x + off.x, startTile.position.y + 0.8, startTile.position.z + off.z);
        char.tileIndex = 0;
        char.updatePlayerBadge(p.nickname, 0);
        p.charInstance = char;
        this.scene.add(char.mesh);
        if (idx === 0) {
          this.myCharacter = char;
        } else {
          this.otherCharacters.set(p.id, char);
        }
      });
      this.updateLocalRanking();
      setTimeout(() => {
        this.startLocalTurn(0);
      }, 700);
    } else {
      this.myCharacter = CharacterFactory.create(this.myCharacterType, this.myColor);
      this.myCharacter.mesh.position.set(startTile.position.x, startTile.position.y + 0.8, startTile.position.z);
      this.myCharacter.tileIndex = 0;
      this.myCharacter.updatePlayerBadge(this.myNickname, 0);
      this.scene.add(this.myCharacter.mesh);

      setTimeout(() => {
        if (this.isMyTurn) {
          this.showDiceAndWait();
        }
      }, 600);
    }

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private startRenderLoop() {
    const render = () => {
      this.animationFrameId = requestAnimationFrame(render);
      const delta = Math.min(this.clock.getDelta(), 0.1);

      if (!this.isGamePaused) {
        this.myCharacter.animate(delta);
        this.boardEngine.update(delta);

        const activeChar = this.getActiveTurnCharacter();
        this.cameraController.update(
          activeChar ? activeChar.mesh.position : this.myCharacter.mesh.position,
          0,
          delta,
        );

        this.otherCharacters.forEach(c => c.animate(delta));

        const now = performance.now();
        if (now - this.lastMoveEmitTime > 80) {
          this.lastMoveEmitTime = now;
          this.socketService.sendMove(
            this.codigoSala,
            this.myPlayerId,
            { x: this.myCharacter.mesh.position.x, y: this.myCharacter.mesh.position.y, z: this.myCharacter.mesh.position.z },
            { y: this.myCharacter.mesh.rotation.y },
          );
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    render();
  }

  private setupSocketListeners() {
    this.socketService.roomState$.subscribe((state: GameState) => {
      this.syncOtherPlayers(state.players);
      if (state.currentTurnPlayerId) {
        const p = state.players[state.currentTurnPlayerId];
        this.currentTurnNickname = p ? p.nickname : '';
        this.isMyTurn = (state.currentTurnPlayerId === this.myPlayerId);
        if (state.currentRound || state.roundNumber) this.roundNumber = state.currentRound || state.roundNumber || 1;
        if (state.totalRounds) this.totalRounds = state.totalRounds;
        if (state.targetStars) this.targetStars = state.targetStars;
        if (state.targetPoints) this.targetPoints = state.targetPoints;
      }
    });

    this.socketService.boardTurnStart$.subscribe((data) => {
      this.currentTurnNickname = data.currentTurnNickname;
      this.isMyTurn = (data.currentTurnPlayerId === this.myPlayerId);
      this.roundNumber = data.currentRound;
      if (data.totalRounds) this.totalRounds = data.totalRounds;
      if (data.targetStars) this.targetStars = data.targetStars;
      if (data.targetPoints) this.targetPoints = data.targetPoints;
      if (this.isMyTurn) {
        this.soundService.playMenuHover();
        this.showNotification(`🎲 ¡Es tu turno (${this.myNickname})! Toca DETENER DADO para lanzar`);
        setTimeout(() => {
          if (this.isMyTurn && !this.isGamePaused && !this.diceWaitingForHit) {
            this.showDiceAndWait();
          }
        }, 400);
      } else {
        this.showNotification(`⏳ Turno de ${data.currentTurnNickname}...`);
      }
    });

    this.socketService.boardDiceRolling$.subscribe((data) => {
      const char = (data.playerId === this.myPlayerId) ? this.myCharacter : this.otherCharacters.get(data.playerId);
      if (char) {
        this.boardEngine.showDiceAt(char.mesh.position);
      }
    });

    this.socketService.boardDiceResult$.subscribe((data) => {
      const char = (data.playerId === this.myPlayerId) ? this.myCharacter : this.otherCharacters.get(data.playerId);
      this.boardEngine.hitDice();
      this.soundService.playHit();
      this.arenaVfx.onDiceLanded();
      if (char) {
        char.headbuttJump(() => {}, () => {});
        const isDoubled = data.isBoost;
        const steps = data.steps;
        if (isDoubled) {
          this.showNotification(`🚀 ¡${data.nickname} usó BOOST! Dado (${data.diceRoll}) x2 = ¡${steps} casillas!`);
        } else {
          this.showNotification(`🎲 ¡${data.nickname} sacó ${data.diceRoll}! Avanza ${steps} casillas`);
        }
        setTimeout(() => {
          this.boardEngine.hideDice();
          this.isDiceRolling = false;
          this.movePlayerSteps(char, steps, () => {
            if (data.playerId === this.myPlayerId) {
              this.executeTileEffect(char, data.targetTileIndex, true);
            }
          });
        }, 700);
      }
    });

    this.socketService.boardPlayerUpdated$.subscribe((data) => {
      if (data.playerId === this.myPlayerId) {
        this.myScore = data.score;
        this.myStars = data.stars;
        if (data.skillsReady) this.skillsReady = data.skillsReady;
        this.myCharacter?.updatePlayerBadge(this.myNickname, this.myScore);
      } else {
        const char = this.otherCharacters.get(data.playerId);
        if (char) char.updatePlayerBadge(data.nickname, data.score);
      }
      const p = this.rankingPlayers.find((item: any) => item.id === data.playerId);
      if (p) {
        p.score = data.score;
        p.stars = data.stars;
      }
      this.rankingPlayers = this.arenaTurnService.computeSortedRanking(this.rankingPlayers);
    });

    this.socketService.playerDisconnected$.subscribe((data) => {
      const char = this.otherCharacters.get(data.playerId);
      if (char) { this.scene.remove(char.mesh); this.otherCharacters.delete(data.playerId); }
      const nombre = data.nickname || 'Un jugador';
      this.disconnectedPlayer = nombre;
      this.showNotification(`📡 ${nombre} se desconectó — el juego sigue`);
      setTimeout(() => this.disconnectedPlayer = '', 5000);
    });

    this.socketService.gameOver$.subscribe((data) => {
      this.gameOverData = {
        winnerNickname: data.winnerNickname,
        ranking: this.rankingPlayers,
      };
      this.arenaVfx.onGameOverVictory();
      this.soundService.stopMusic();
      this.soundService.playVictory();
    });
  }

  private syncOtherPlayers(players: Record<string, any>) {
    const list: any[] = [];
    const offsets = [
      { x: 0.7, z: 0.7 },
      { x: -0.7, z: 0.7 },
      { x: 0.7, z: -0.7 },
      { x: -0.7, z: -0.7 },
    ];
    let idx = 0;

    Object.values(players).forEach((p) => {
      list.push({
        id: p.id,
        nickname: p.nickname,
        color: p.color,
        score: p.score || 0,
        stars: p.stars || 0,
        connected: p.connected,
        isBot: false,
      });

      if (p.id === this.myPlayerId) {
        this.myScore = p.score || 0;
        this.myStars = p.stars || 0;
        return;
      }

      if (!this.otherCharacters.has(p.id) && p.connected && this.boardEngine) {
        const charType = (p.characterType || 'star') as CharacterType;
        const char = CharacterFactory.create(charType, p.color);
        const tileIdx = p.tileIndex || 0;
        const tile = this.boardEngine.getTile(tileIdx);
        const off = offsets[idx % offsets.length];
        char.mesh.position.set(tile.position.x + off.x, tile.position.y + 0.8, tile.position.z + off.z);
        char.tileIndex = tileIdx;
        char.updatePlayerBadge(p.nickname, p.score || 0);
        this.otherCharacters.set(p.id, char);
        this.scene.add(char.mesh);
      }
      idx++;
    });

    this.rankingPlayers = list.sort((a, b) => {
      if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
      return b.score - a.score;
    });
  }

  private localQuestionIndex = 0;

  openTriviaQuestion() {
    this.activeSkillRequested = 'boost';
    if (!this.isLocalMultiplayer) {
      this.socketService.requestSkill(this.codigoSala, this.myPlayerId, 'boost');
    }

    this.apiService.obtenerPregunta(this.temaPartida, 'trivia').subscribe({
      next: (q: any) => {
        if (q && q.enunciado) {
          this.activeQuestion = {
            enunciado: q.enunciado,
            opciones: q.opciones,
            correcta: q.correcta,
            dificultad: (q.dificultad as any) || 'facil',
          };
        }
      },
      error: () => {
        if (!this.activeQuestion) {
          const q = LOCAL_PREGUNTAS[this.localQuestionIndex % LOCAL_PREGUNTAS.length];
          this.localQuestionIndex++;
          this.activeQuestion = q;
        }
      },
    });

    setTimeout(() => {
      if (!this.activeQuestion) {
        const q = LOCAL_PREGUNTAS[this.localQuestionIndex % LOCAL_PREGUNTAS.length];
        this.localQuestionIndex++;
        this.activeQuestion = q;
      }
    }, 400);
  }

  handleSkillAction(habilidad: Habilidad) {
    if (this.isLocalMultiplayer) {
      const player = this.localPlayersList[this.currentLocalTurnIndex];
      if (player && player.skillsReady[habilidad]) {
        player.skillsReady[habilidad] = false;
        this.skillsReady = { ...player.skillsReady };
        this.arenaVfx.onSkillActivated();
        if (habilidad === 'boost') {
          player.isBoostActive = true;
          this.soundService.playBoost();
          this.showNotification(`🚀 ¡${player.nickname} activó DOBLE DADO! Tu próximo tiro avanzará el doble (x2)`);
        } else if (habilidad === 'shield') {
          player.isShieldActive = true;
          player.charInstance?.setShieldActive(true);
          this.soundService.playShield();
          this.showNotification(`🛡️ ¡${player.nickname} activó ESCUDO! Inmunidad a casillas rojas en tu turno`);
        } else if (habilidad === 'attack') {
          this.soundService.playVictory();
          player.score += 20;
          this.myScore = player.score;
          player.charInstance?.updatePlayerBadge(player.nickname, player.score);
          this.updateLocalRanking();
          this.showNotification(`🌟 ¡${player.nickname} usó BOLSA DE MONEDAS! +20 Monedas a tu marcador`);
          if (player.stars >= this.targetStars || player.score >= this.targetPoints) {
            this.declareLocalWinner(player);
            return;
          }
        }
      } else {
        this.soundService.playWrongAnswer();
        const nomPoder = habilidad === 'boost' ? 'Doble Dado 🚀' : habilidad === 'shield' ? 'Escudo 🛡️' : 'Bolsa de Monedas 🌟';
        this.showNotification(`🔒 No tienes ${nomPoder}. ¡Consíguelo cayendo en una casilla 🎁 o 💡!`);
      }
      return;
    }

    if (this.skillsReady[habilidad]) {
      this.skillsReady[habilidad] = false;
      this.arenaVfx.onSkillActivated();
      if (habilidad === 'boost') {
        this.isBoostActive = true;
        this.soundService.playBoost();
        this.showNotification('🚀 ¡DOBLE DADO ACTIVADO! Tu próximo tiro avanzará el doble (x2)');
      } else if (habilidad === 'shield') {
        this.isShieldActive = true;
        this.myCharacter.setShieldActive(true);
        this.soundService.playShield();
        this.showNotification('🛡️ ¡ESCUDO ACTIVADO! Inmunidad total a casillas rojas en tu siguiente turno');
      } else if (habilidad === 'attack') {
        this.soundService.playVictory();
        this.myScore += 20;
        this.myCharacter.updatePlayerBadge(this.myNickname, this.myScore);
        this.updateBoardRanking();
        this.showNotification('🌟 ¡BOLSA DE MONEDAS USADA! +20 Monedas a tu marcador');
        if (this.isCpuMode && (this.myStars >= this.targetStars || this.myScore >= this.targetPoints)) {
          this.declareBoardWinner();
          return;
        }
      }
      this.socketService.useSkill(this.codigoSala, this.myPlayerId, habilidad);
    } else {
      this.soundService.playWrongAnswer();
      const nomPoder = habilidad === 'boost' ? 'Doble Dado 🚀' : habilidad === 'shield' ? 'Escudo 🛡️' : 'Bolsa de Monedas 🌟';
      this.showNotification(`🔒 No tienes ${nomPoder}. ¡Consíguelo cayendo en una casilla 🎁 o 💡!`);
    }
  }

  handleAnswerSubmitted(index: number) {
    const habilidad = this.activeSkillRequested;
    const currentQ = this.activeQuestion;
    this.activeQuestion = null;

    if (this.isLocalMultiplayer) {
      const player = this.localPlayersList[this.currentLocalTurnIndex];
      const isCorrect = !!(currentQ && index === currentQ.correcta);
      this.arenaVfx.onTriviaResult(isCorrect);
      if (isCorrect) {
        this.soundService.playCorrectAnswer();
        player.score += 20;
        const powers: Habilidad[] = ['boost', 'shield', 'attack'];
        const p = powers[Math.floor(Math.random() * powers.length)];
        player.skillsReady[p] = true;
        this.myScore = player.score;
        this.skillsReady = { ...player.skillsReady };
        player.charInstance?.updatePlayerBadge(player.nickname, player.score);
        const nom = p === 'boost' ? 'Doble Dado 🚀' : p === 'shield' ? 'Escudo 🛡️' : 'Bolsa de Monedas 🌟';
        this.showNotification(`✨ ¡${player.nickname} acertó! +20 Monedas y ganaste ${nom}`);
      } else {
        this.soundService.playWrongAnswer();
        this.showNotification(`❌ Respuesta incorrecta para ${player.nickname}. ¡Mejor suerte la próxima!`);
      }
      this.updateLocalRanking();
      if (player.stars >= this.targetStars || player.score >= this.targetPoints) {
        this.declareLocalWinner(player);
        return;
      }
      this.finishTurn();
      return;
    }

    const isCorrect = !!(currentQ && index === currentQ.correcta);
    this.arenaVfx.onTriviaResult(isCorrect);
    if (isCorrect) {
      this.soundService.playCorrectAnswer();
      this.myScore += 20;
      const powers: Habilidad[] = ['boost', 'shield', 'attack'];
      const p = powers[Math.floor(Math.random() * powers.length)];
      this.skillsReady[p] = true;
      this.myCharacter.updatePlayerBadge(this.myNickname, this.myScore);
      const nom = p === 'boost' ? 'Doble Dado 🚀' : p === 'shield' ? 'Escudo 🛡️' : 'Bolsa de Monedas 🌟';
      this.showNotification(`✨ ¡Respuesta Correcta! +20 Monedas y ganaste ${nom}`);
    } else {
      this.soundService.playWrongAnswer();
      this.showNotification('❌ Respuesta incorrecta. ¡Mejor suerte la próxima!');
    }

    this.updateBoardRanking();
    if (this.isCpuMode && (this.myStars >= this.targetStars || this.myScore >= this.targetPoints)) {
      this.declareBoardWinner();
      return;
    }
    this.socketService.answerSkill(this.codigoSala, this.myPlayerId, habilidad, index);
    this.finishTurn();
  }

  private showNotification(msg: string) {
    this.notification = msg;
    setTimeout(() => {
      if (this.notification === msg) {
        this.notification = '';
      }
    }, 3000);
  }

  private initBots(dificultad: string) {
    const usedTypes: CharacterType[] = [this.myCharacterType];
    const bots = this.botService.createBots(this.numBots, dificultad);

    setTimeout(() => {
      bots.forEach((bot: BotState, i: number) => {
        const botType = CharacterFactory.getRandomType(usedTypes);
        usedTypes.push(botType);
        const char = CharacterFactory.create(botType, bot.color);
        const startTile = this.boardEngine.getTile(0);
        const offX = (i === 0 ? 0.8 : i === 1 ? -0.8 : 0);
        const offZ = (i === 2 ? 0.8 : -0.4);
        char.mesh.position.set(startTile.position.x + offX, startTile.position.y + 0.8, startTile.position.z + offZ);
        char.tileIndex = 0;
        char.updatePlayerBadge(bot.nickname, 0);
        this.otherCharacters.set(bot.id, char);
        this.scene.add(char.mesh);
      });

      this.rankingPlayers = [
        { id: this.myPlayerId, nickname: this.myNickname, color: this.myColor, score: this.myScore, stars: this.myStars, connected: true, isBot: false },
        ...bots.map(b => ({ id: b.id, nickname: b.nickname, color: b.color, score: 0, stars: 0, connected: true, isBot: true })),
      ];
      this.updateBoardRanking();
    }, 500);
  }

  private updateBoardRanking() {
    const bots = this.botService.getBots();
    const humanPlayers = this.rankingPlayers.filter((p: any) => !p.isBot);
    const botPlayers = bots.map(b => ({
      id: b.id,
      nickname: b.nickname,
      color: b.color,
      score: b.score,
      stars: b.stars || 0,
      connected: true,
      isBot: true,
    }));
    this.rankingPlayers = [...humanPlayers, ...botPlayers].sort((a: any, b: any) => {
      if ((b.stars || 0) !== (a.stars || 0)) {
        return (b.stars || 0) - (a.stars || 0);
      }
      return b.score - a.score;
    });
  }

  private updateLocalRanking() {
    this.rankingPlayers = this.localPlayersList.map(p => ({
      id: p.id,
      nickname: p.nickname,
      color: p.color,
      score: p.score,
      stars: p.stars,
      connected: true,
      isBot: p.isBot,
    })).sort((a, b) => {
      if ((b.stars || 0) !== (a.stars || 0)) {
        return (b.stars || 0) - (a.stars || 0);
      }
      return b.score - a.score;
    });
  }

  private startLocalTurn(index: number) {
    this.currentLocalTurnIndex = index;
    const p = this.localPlayersList[index];
    this.currentTurnNickname = p.nickname;
    this.myNickname = p.nickname;
    this.myColor = p.color;
    this.myScore = p.score;
    this.myStars = p.stars;
    this.myTileIndex = p.tileIndex;
    this.skillsReady = { ...p.skillsReady };
    const def = CHARACTER_DEFS.find(d => d.type === p.characterType);
    this.myCharacterEmoji = def?.emoji || (p.isBot ? '🤖' : '⭐');

    if (!p.isBot) {
      this.isMyTurn = true;
      this.soundService.playMenuHover();
      this.showNotification(`🎲 ¡Turno de ${p.nickname} (${this.myCharacterEmoji})! Presiona ESPACIO o haz clic para lanzar`);
      setTimeout(() => {
        if (this.isMyTurn && !this.isGamePaused) {
          this.showDiceAndWait();
        }
      }, 400);
    } else {
      this.isMyTurn = false;
      this.showNotification(`🤖 Turno de ${p.nickname}...`);
      setTimeout(() => {
        if (!this.isGamePaused) {
          this.runLocalBotTurn(p);
        }
      }, 600);
    }
  }

  rollDice() {
    if (!this.isMyTurn || this.activeQuestion || this.isGamePaused) return;
    if (this.diceWaitingForHit) {
      this.hitDiceNow();
    } else if (!this.isDiceRolling) {
      this.showDiceAndWait();
    }
  }

  private showDiceAndWait() {
    if (this.isDiceRolling || !this.isMyTurn) return;
    this.isDiceRolling = true;
    this.diceWaitingForHit = true;
    this.soundService.playMenuClick();
    const activeChar = this.getActiveTurnCharacter();
    if (this.boardEngine && activeChar) {
      this.boardEngine.showDiceAt(activeChar.mesh.position);
    }
    this.showNotification('🎲 ¡Presiona ESPACIO o toca DETENER DADO!');

    if (!this.isLocalMultiplayer && !this.isCpuMode && this.codigoSala) {
      this.socketService.sendBoardRollIntent(this.codigoSala, this.myPlayerId);
    }
  }

  private hitDiceNow() {
    if (!this.diceWaitingForHit) return;
    this.diceWaitingForHit = false;

    if (!this.isLocalMultiplayer && !this.isCpuMode && this.codigoSala) {
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      this.soundService.playHit();
      this.arenaVfx.onDiceLanded();
      this.socketService.sendBoardHitDice(this.codigoSala, this.myPlayerId, diceRoll, this.isBoostActive);
      if (this.isBoostActive) this.isBoostActive = false;
      return;
    }

    const diceRoll = this.boardEngine.hitDice();
    this.soundService.playHit();
    this.arenaVfx.onDiceLanded();

    const activeChar = this.getActiveTurnCharacter();
    activeChar.headbuttJump(() => {}, () => {});

    if (this.isLocalMultiplayer) {
      const activePlayer = this.localPlayersList[this.currentLocalTurnIndex];
      const isDoubled = activePlayer.isBoostActive;
      const steps = this.arenaTurnService.calculateStepMovement(diceRoll, isDoubled);
      if (activePlayer.isBoostActive) {
        activePlayer.isBoostActive = false;
        this.showNotification(`🚀 ¡BOOST ACTIVADO! Dado (${diceRoll}) x2 = ¡${steps} casillas!`);
      } else {
        this.showNotification(`🎲 ¡${activePlayer.nickname} sacó ${diceRoll}! Avanza ${steps} casillas`);
      }

      setTimeout(() => {
        this.boardEngine.hideDice();
        this.isDiceRolling = false;
        this.movePlayerSteps(activeChar, steps, () => {
          this.executeTileEffect(activeChar, activePlayer.tileIndex, !activePlayer.isBot);
        });
      }, 700);
    } else {
      const isDoubled = this.isBoostActive;
      const steps = this.arenaTurnService.calculateStepMovement(diceRoll, isDoubled);
      if (this.isBoostActive) {
        this.isBoostActive = false;
        this.showNotification(`🚀 ¡BOOST ACTIVADO! Dado (${diceRoll}) x2 = ¡${steps} casillas!`);
      } else {
        this.showNotification(`🎲 ¡Sacaste ${diceRoll}! Avanzas ${steps} casillas`);
      }

      setTimeout(() => {
        this.boardEngine.hideDice();
        this.isDiceRolling = false;
        this.movePlayerSteps(this.myCharacter, steps, () => {
          this.executeTileEffect(this.myCharacter, this.myTileIndex, true);
        });
      }, 700);
    }
  }

  private movePlayerSteps(char: BaseCharacter, stepsRemaining: number, onDone: () => void) {
    if (stepsRemaining <= 0) {
      onDone();
      return;
    }

    char.tileIndex = (char.tileIndex + 1) % this.boardEngine.tiles.length;
    if (this.isLocalMultiplayer) {
      const p = this.localPlayersList[this.currentLocalTurnIndex];
      if (p) {
        p.tileIndex = char.tileIndex;
        this.myTileIndex = p.tileIndex;
      }
    } else if (char === this.myCharacter) {
      this.myTileIndex = char.tileIndex;
    }

    const targetTile = this.boardEngine.getTile(char.tileIndex);
    const targetPos = new THREE.Vector3(targetTile.position.x, targetTile.position.y + 0.8, targetTile.position.z);

    this.soundService.playMenuHover();
    char.jumpTo(targetPos, () => {
      this.movePlayerSteps(char, stepsRemaining - 1, onDone);
    });
  }

  private executeTileEffect(char: BaseCharacter, tileIdx: number, isLocalPlayer: boolean) {
    const tile = this.boardEngine.getTile(tileIdx);

    if (this.isLocalMultiplayer) {
      const player = this.localPlayersList[this.currentLocalTurnIndex];
      if (player.isBot) {
        if (tile.type === 'blue') {
          player.score += 10;
          this.arenaVfx.onBlueTileReward();
          this.soundService.playCoinReward();
        } else if (tile.type === 'red') {
          player.score = Math.max(0, player.score - 5);
          this.arenaVfx.onRedTilePenalty();
          this.soundService.playCoinPenalty();
        } else if (tile.type === 'star') {
          player.stars = (player.stars || 0) + 1;
          player.score += 30;
          this.arenaVfx.onStarObtained();
          this.soundService.playStarCapture();
          this.showNotification(`⭐ ¡${player.nickname} consiguió una Estrella!`);
        } else if (tile.type === 'trivia') {
          const acierta = Math.random() > 0.35;
          if (acierta) {
            player.score += 15;
            this.soundService.playCoinReward();
            this.showNotification(`💡 ¡${player.nickname} acertó la trivia! (+15 pts)`);
          } else {
            this.soundService.playCoinPenalty();
            this.showNotification(`💡 ¡${player.nickname} falló la trivia!`);
          }
        } else if (tile.type === 'power') {
          const powers: Habilidad[] = ['boost', 'shield', 'attack'];
          const p = powers[Math.floor(Math.random() * powers.length)];
          player.skillsReady[p] = true;
          this.arenaVfx.onBlueTileReward();
          this.soundService.playCorrectAnswer();
        }
        char.updatePlayerBadge(player.nickname, player.score);
        this.updateLocalRanking();
        if (this.arenaTurnService.checkVictoryTarget(player.stars, player.score, this.targetStars, this.targetPoints)) {
          this.declareLocalWinner(player);
          return;
        }
        this.finishTurn();
      } else {
        if (tile.type === 'blue') {
          player.score += 10;
          this.myScore = player.score;
          this.arenaVfx.onBlueTileReward();
          this.soundService.playCoinReward();
          this.showNotification(`🔵 ¡${player.nickname} cayó en Casilla Azul! +10 Monedas`);
          char.updatePlayerBadge(player.nickname, player.score);
          this.updateLocalRanking();
          if (this.arenaTurnService.checkVictoryTarget(player.stars, player.score, this.targetStars, this.targetPoints)) {
            this.declareLocalWinner(player);
            return;
          }
          this.finishTurn();
        } else if (tile.type === 'red') {
          this.arenaVfx.onRedTilePenalty();
          if (!player.isShieldActive) {
            player.score = Math.max(0, player.score - 5);
            this.myScore = player.score;
            this.soundService.playCoinPenalty();
            this.showNotification(`🔴 ¡${player.nickname} cayó en Casilla Roja! -5 Monedas`);
          } else {
            player.isShieldActive = false;
            this.soundService.playShieldBlock();
            this.showNotification(`🛡️ ¡El escudo de ${player.nickname} protegió de la casilla roja!`);
          }
          char.updatePlayerBadge(player.nickname, player.score);
          this.updateLocalRanking();
          this.finishTurn();
        } else if (tile.type === 'trivia') {
          this.soundService.playMenuClick();
          this.showNotification(`💡 ¡Trivia para ${player.nickname}! Responde y gana +20 Monedas y poder`);
          this.openTriviaQuestion();
        } else if (tile.type === 'power') {
          const powers: Habilidad[] = ['boost', 'shield', 'attack'];
          const p = powers[Math.floor(Math.random() * powers.length)];
          player.skillsReady[p] = true;
          this.skillsReady = { ...player.skillsReady };
          this.arenaVfx.onBlueTileReward();
          this.soundService.playCorrectAnswer();
          const nom = p === 'boost' ? 'DOBLE DADO 🚀' : p === 'shield' ? 'ESCUDO 🛡️' : 'BOLSA DE MONEDAS 🌟';
          this.showNotification(`🎁 ¡${player.nickname} obtuvo ${nom}!`);
          this.finishTurn();
        } else if (tile.type === 'star') {
          player.stars++;
          player.score += 30;
          this.myStars = player.stars;
          this.myScore = player.score;
          this.arenaVfx.onStarObtained();
          this.soundService.playStarCapture();
          this.showNotification(`⭐ ¡${player.nickname} capturó una SUPER ESTRELLA! (+1 ⭐ / +30 pts)`);
          char.updatePlayerBadge(player.nickname, player.score);
          this.updateLocalRanking();
          if (this.arenaTurnService.checkVictoryTarget(player.stars, player.score, this.targetStars, this.targetPoints)) {
            this.declareLocalWinner(player);
            return;
          }
          this.finishTurn();
        }
      }
      return;
    }

    if (isLocalPlayer) {
      if (tile.type === 'blue') {
        this.myScore += 10;
        this.arenaVfx.onBlueTileReward();
        this.soundService.playCoinReward();
        this.showNotification('🔵 ¡Casilla Azul! +10 Monedas');
        this.myCharacter.updatePlayerBadge(this.myNickname, this.myScore);
        this.updateBoardRanking();
        if (!this.isCpuMode && this.codigoSala) {
          this.socketService.sendBoardTileEffect(this.codigoSala, this.myPlayerId, 'blue', 10, 0);
        }
        if (this.isCpuMode && this.arenaTurnService.checkVictoryTarget(this.myStars, this.myScore, this.targetStars, this.targetPoints)) {
          this.declareBoardWinner();
          return;
        }
        this.finishTurn();
      } else if (tile.type === 'red') {
        let delta = 0;
        this.arenaVfx.onRedTilePenalty();
        if (!this.isShieldActive) {
          delta = -5;
          this.myScore = Math.max(0, this.myScore - 5);
          this.soundService.playCoinPenalty();
          this.showNotification('🔴 ¡Casilla Roja! -5 Monedas');
        } else {
          this.isShieldActive = false;
          this.soundService.playShieldBlock();
          this.showNotification('🛡️ ¡Tu escudo te protegió de la casilla roja!');
        }
        this.myCharacter.updatePlayerBadge(this.myNickname, this.myScore);
        this.updateBoardRanking();
        if (!this.isCpuMode && this.codigoSala) {
          this.socketService.sendBoardTileEffect(this.codigoSala, this.myPlayerId, 'red', delta, 0);
        }
        this.finishTurn();
      } else if (tile.type === 'trivia') {
        this.soundService.playMenuClick();
        this.showNotification('💡 ¡Casilla de Trivia! Responde y gana +20 Monedas y un poder');
        this.openTriviaQuestion();
      } else if (tile.type === 'power') {
        const powers: Habilidad[] = ['boost', 'shield', 'attack'];
        const p = powers[Math.floor(Math.random() * powers.length)];
        this.skillsReady[p] = true;
        this.arenaVfx.onBlueTileReward();
        this.soundService.playCorrectAnswer();
        const nom = p === 'boost' ? 'DOBLE DADO 🚀' : p === 'shield' ? 'ESCUDO 🛡️' : 'BOLSA DE MONEDAS 🌟';
        this.showNotification(`🎁 ¡Casilla de Regalo! Ganaste ${nom}`);
        if (!this.isCpuMode && this.codigoSala) {
          this.socketService.sendBoardTileEffect(this.codigoSala, this.myPlayerId, 'power', 0, 0, p);
        }
        this.finishTurn();
      } else if (tile.type === 'star') {
        this.myStars++;
        this.myScore += 30;
        this.arenaVfx.onStarObtained();
        this.soundService.playVictory();
        this.showNotification('⭐ ¡SUPER ESTRELLA! +1 Estrella & +30 Pts');
        this.myCharacter.updatePlayerBadge(this.myNickname, this.myScore);
        this.updateBoardRanking();
        if (!this.isCpuMode && this.codigoSala) {
          this.socketService.sendBoardTileEffect(this.codigoSala, this.myPlayerId, 'star', 30, 1);
        }
        if (this.isCpuMode && this.arenaTurnService.checkVictoryTarget(this.myStars, this.myScore, this.targetStars, this.targetPoints)) {
          this.declareBoardWinner();
          return;
        }
        this.finishTurn();
      }
    } else {
      const bot = this.botService.getBots().find(b => b.nickname === this.currentTurnNickname);
      if (bot) {
        if (tile.type === 'blue') {
          bot.score += 10;
        } else if (tile.type === 'red') {
          bot.score = Math.max(0, bot.score - 5);
        } else if (tile.type === 'star') {
          bot.stars = (bot.stars || 0) + 1;
          bot.score += 30;
          this.showNotification(`⭐ ¡${bot.nickname} consiguió una Estrella!`);
        } else if (tile.type === 'trivia') {
          const acierta = Math.random() > 0.35;
          if (acierta) {
            bot.score += 15;
            this.showNotification(`💡 ¡${bot.nickname} acertó la trivia! (+15 pts)`);
          } else {
            this.showNotification(`💡 ¡${bot.nickname} falló la trivia!`);
          }
        }
        char.updatePlayerBadge(bot.nickname, bot.score);
        this.updateBoardRanking();
        if ((bot.stars || 0) >= this.targetStars || bot.score >= this.targetPoints) {
          this.declareBoardWinner(bot);
          return;
        }
      }
      this.finishTurn();
    }
  }

  private finishTurn() {
    this.isMyTurn = false;
    this.diceWaitingForHit = false;
    this.isDiceRolling = false;
    if (this.boardEngine) {
      this.boardEngine.hideDice();
    }
    if (!this.isLocalMultiplayer && !this.isCpuMode && this.codigoSala) {
      setTimeout(() => {
        this.socketService.sendBoardEndTurn(this.codigoSala);
      }, 1000);
    } else {
      setTimeout(() => {
        this.nextTurn();
      }, 1200);
    }
  }

  private nextTurn() {
    if (this.isLocalMultiplayer) {
      const nextIdx = (this.currentLocalTurnIndex + 1) % this.localPlayersList.length;
      if (nextIdx === 0) {
        this.roundNumber++;
        this.showNotification(`🏁 ¡Ronda ${this.roundNumber}! (Meta: ${this.targetStars} ⭐ o ${this.targetPoints} 🪙)`);
      }
      this.startLocalTurn(nextIdx);
      return;
    }

    const bots = this.botService.getBots();
    if (bots.length === 0) {
      this.isMyTurn = true;
      this.currentTurnNickname = this.myNickname;
      setTimeout(() => this.showDiceAndWait(), 400);
      return;
    }

    const currentIdx = bots.findIndex(b => b.nickname === this.currentTurnNickname);
    if (currentIdx === -1) {
      this.currentTurnNickname = bots[0].nickname;
      this.runBotTurn(bots[0]);
    } else if (currentIdx < bots.length - 1) {
      const nextBot = bots[currentIdx + 1];
      this.currentTurnNickname = nextBot.nickname;
      this.runBotTurn(nextBot);
    } else {
      this.roundNumber++;
      this.isMyTurn = true;
      this.currentTurnNickname = this.myNickname;
      this.showNotification(`🏁 ¡Ronda ${this.roundNumber}! (Meta: ${this.targetStars} ⭐ o ${this.targetPoints} 🪙)`);
      setTimeout(() => this.showDiceAndWait(), 800);
    }
  }

  private getActiveTurnCharacter(): BaseCharacter {
    if (this.isLocalMultiplayer) {
      const cur = this.localPlayersList[this.currentLocalTurnIndex];
      if (cur?.charInstance) return cur.charInstance;
      return this.myCharacter;
    }
    if (this.isMyTurn || this.currentTurnNickname === this.myNickname) {
      return this.myCharacter;
    }
    const bot = this.botService.getBots().find(b => b.nickname === this.currentTurnNickname);
    if (bot) {
      const char = this.otherCharacters.get(bot.id);
      if (char) return char;
    }
    const other = this.rankingPlayers.find((p: any) => p.nickname === this.currentTurnNickname);
    if (other) {
      const char = this.otherCharacters.get(other.id);
      if (char) return char;
    }
    return this.myCharacter;
  }

  private runBotTurn(bot: BotState) {
    const char = this.otherCharacters.get(bot.id);
    if (!char) {
      this.finishTurn();
      return;
    }

    this.boardEngine.showDiceAt(char.mesh.position);

    setTimeout(() => {
      this.isDiceRolling = true;
      char.headbuttJump(
        () => {
          const steps = this.boardEngine.hitDice();
          this.soundService.playHit();
          this.arenaVfx.onDiceLanded();
          this.showNotification(`🤖 ${bot.nickname} golpeó el dado: ¡${steps}!`);

          setTimeout(() => {
            this.boardEngine.hideDice();
            this.isDiceRolling = false;
            this.movePlayerSteps(char, steps, () => {
              this.executeTileEffect(char, char.tileIndex, false);
            });
          }, 550);
        }
      );
    }, 1100);
  }

  private runLocalBotTurn(botPlayer: LocalPlayerState) {
    const char = botPlayer.charInstance;
    if (!char) {
      this.finishTurn();
      return;
    }

    this.boardEngine.showDiceAt(char.mesh.position);

    setTimeout(() => {
      this.isDiceRolling = true;
      char.headbuttJump(
        () => {
          const steps = this.boardEngine.hitDice();
          this.soundService.playHit();
          this.arenaVfx.onDiceLanded();
          this.showNotification(`🤖 ${botPlayer.nickname} lanzó el dado: ¡${steps}!`);

          setTimeout(() => {
            this.boardEngine.hideDice();
            this.isDiceRolling = false;
            this.movePlayerSteps(char, steps, () => {
              this.executeTileEffect(char, char.tileIndex, false);
            });
          }, 550);
        }
      );
    }, 1100);
  }

  private declareLocalWinner(winner?: LocalPlayerState) {
    const sorted = [...this.localPlayersList].sort((a, b) => {
      if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
      return b.score - a.score;
    });

    const winningPlayer = winner || sorted[0];

    this.gameOverData = {
      winnerId: winningPlayer.id,
      winnerNickname: winningPlayer.nickname,
      ranking: sorted.map(p => ({
        nickname: p.nickname,
        color: p.color,
        score: p.score,
        stars: p.stars,
        isBot: p.isBot,
      })),
    };
    this.isWinner = !winningPlayer.isBot;
    this.arenaVfx.onGameOverVictory();
    this.soundService.stopMusic();
    this.isWinner ? this.soundService.playVictory() : this.soundService.playDefeat();
  }

  private declareBoardWinner(botWinner?: BotState) {
    const all = [
      { nickname: this.myNickname, score: this.myScore, stars: this.myStars, color: this.myColor, isBot: false },
      ...this.botService.getBots().map(b => ({
        nickname: b.nickname,
        score: b.score,
        stars: b.stars || 0,
        color: b.color,
        isBot: true,
      })),
    ].sort((a, b) => {
      if ((b.stars || 0) !== (a.stars || 0)) return (b.stars || 0) - (a.stars || 0);
      return b.score - a.score;
    });

    const winnerNick = botWinner ? botWinner.nickname : all[0].nickname;

    this.gameOverData = {
      winnerId: winnerNick === this.myNickname ? this.myPlayerId : 'bot',
      winnerNickname: winnerNick,
      ranking: all,
    };
    this.isWinner = winnerNick === this.myNickname;
    this.arenaVfx.onGameOverVictory();
    this.soundService.stopMusic();
    this.isWinner ? this.soundService.playVictory() : this.soundService.playDefeat();
  }

  togglePause() {
    this.isGamePaused = !this.isGamePaused;
    this.botService.setPaused(this.isGamePaused);
  }

  toggleSound() {
    this.isMuted = this.soundService.toggleMute();
  }

  returnToHome() {
    if (this.codigoSala && this.myPlayerId && !this.isLocalMultiplayer) {
      this.socketService.leaveRoom(this.codigoSala, this.myPlayerId);
    }
    this.router.navigate(['/']);
  }
}