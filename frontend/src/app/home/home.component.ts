import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, SalaActivaItem } from '../services/api.service';
import { SoundService } from '../services/sound.service';
import { DRONE_COLORS } from '../models/game.models';
import { CharacterType, CHARACTER_DEFS } from '../arena/characters/character.factory';
import { ScenarioId, SCENARIO_DEFS } from '../arena/scenarios/scenario.factory';

export interface LocalSlotConfig {
  slot: number;
  isBot: boolean;
  nickname: string;
  characterType: CharacterType;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  view: 'play' | 'how' = 'play';
  activeCard: 'crear' | 'unir' = 'crear';

  inTitleScreen: boolean = true;
  isMuted: boolean = false;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  nickname: string = '';
  temaSeleccionado: string = 'Angular';
  codigoInput: string = '';
  selectedColor: string = DRONE_COLORS[0];
  droneColors = DRONE_COLORS;
  loading = false;
  errorMessage = '';
  nicknameError = false;

  salasActivas: SalaActivaItem[] = [];
  cargandoSalas: boolean = false;
  linkCopiado: boolean = false;
  private pollSalasInterval: any = null;

  dificultad: string = 'basico';
  modoJuego: 'lan' | 'local' = 'local';
  targetStars: number = 2;
  targetPoints: number = 100;
  currentHost: string = typeof window !== 'undefined'
    ? ((window.location.hostname && !window.location.hostname.startsWith('172.') && window.location.hostname !== 'localhost')
        ? window.location.hostname
        : '192.168.1.4')
    : '192.168.1.4';

  localSlots: LocalSlotConfig[] = [
    { slot: 1, isBot: false, nickname: 'Jugador 1', characterType: 'star', color: '#00f5ff' },
    { slot: 2, isBot: false, nickname: 'Jugador 2', characterType: 'mushroom', color: '#ff003c' },
    { slot: 3, isBot: true, nickname: 'Bot Beta', characterType: 'crystal', color: '#bf00ff' },
    { slot: 4, isBot: true, nickname: 'Bot Gamma', characterType: 'rocket', color: '#00ff88' },
  ];
  selectedScenarioLocal: ScenarioId = 'isla';
  characterTypesList = CHARACTER_DEFS;
  scenariosList = SCENARIO_DEFS;

  dificultades = [
    { value: 'basico',     label: 'Básico',     emoji: '🟢' },
    { value: 'intermedio', label: 'Intermedio', emoji: '🟡' },
    { value: 'avanzado',   label: 'Avanzado',   emoji: '🔴' },
  ];

  temasValidos = [
    'Angular', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C#', 'Go',
    'Node.js', 'NestJS', 'React', 'Vue', 'HTML', 'CSS', 'SQL',
    'PostgreSQL', 'MongoDB', 'Docker', 'Git', 'GitHub', 'AWS', 'Azure',
    'APIs REST', 'WebSockets', 'Ciberseguridad', 'Algoritmos',
    'Estructuras de datos', 'Bases de datos', 'Arquitectura de software',
  ];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private soundService: SoundService,
  ) {}

  ngOnInit() {
    this.isMuted = this.soundService.isAudioMuted();
    this.keyHandler = (e: KeyboardEvent) => {
      if (this.inTitleScreen && (e.key === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        this.pressStart();
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    this.cargarSalasActivas();
    this.pollSalasInterval = setInterval(() => {
      if (this.view === 'play') {
        this.cargarSalasActivas(true);
      }
    }, 4000);
  }

  ngOnDestroy() {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
    if (this.pollSalasInterval) {
      clearInterval(this.pollSalasInterval);
    }
  }

  pressStart() {
    if (!this.inTitleScreen) return;
    this.inTitleScreen = false;
    if (!this.isMuted) {
      this.soundService.startMenuMusic();
    }
    this.cargarSalasActivas();
  }

  toggleSound() {
    this.isMuted = this.soundService.toggleMute();
  }

  setCard(card: 'crear' | 'unir') {
    this.activeCard = card;
    this.errorMessage = '';
    this.soundService.playMenuClick();
    if (card === 'unir') {
      this.cargarSalasActivas();
    }
  }

  setModoLan() {
    this.modoJuego = 'lan';
    this.soundService.playMenuClick();
    this.cargarSalasActivas();
  }

  cargarSalasActivas(silencioso = false) {
    if (!silencioso) {
      this.cargandoSalas = true;
    }
    this.apiService.obtenerSalasActivas().subscribe({
      next: (res) => {
        this.cargandoSalas = false;
        this.salasActivas = res.salas || [];
        if (res.hostIp && res.hostIp !== 'localhost' && !res.hostIp.startsWith('172.')) {
          this.currentHost = res.hostIp;
        } else if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('172.')) {
          this.currentHost = window.location.hostname;
        }
      },
      error: () => {
        this.cargandoSalas = false;
      },
    });
  }

  getShareUrl(): string {
    let host = this.currentHost;
    if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('172.')) {
      host = window.location.hostname;
    }
    if (!host || host === 'localhost' || host.startsWith('172.')) {
      host = '192.168.1.4';
    }
    const port = typeof window !== 'undefined' && window.location.port ? window.location.port : '';
    if (!port || port === '80' || port === '443') {
      return `http://${host}`;
    }
    return `http://${host}:${port}`;
  }

  copiarEnlaceLan() {
    this.soundService.playMenuClick();
    const url = this.getShareUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.linkCopiado = true;
        setTimeout(() => (this.linkCopiado = false), 2500);
      });
    } else {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.linkCopiado = true;
      setTimeout(() => (this.linkCopiado = false), 2500);
    }
  }

  getLocalHumanCount(): number {
    return this.localSlots.filter(s => !s.isBot).length;
  }

  setLocalPreset(humanCount: number) {
    this.soundService.playMenuClick();
    const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta'];
    const charDefaults: CharacterType[] = ['star', 'mushroom', 'crystal', 'rocket'];
    const colDefaults = DRONE_COLORS;

    this.localSlots = [1, 2, 3, 4].map((slotNum, i) => {
      const isBot = slotNum > humanCount;
      const prev = this.localSlots[i];
      return {
        slot: slotNum,
        isBot,
        nickname: isBot
          ? botNames[i]
          : (prev && !prev.isBot && prev.nickname ? prev.nickname : `Jugador ${slotNum}`),
        characterType: prev ? prev.characterType : charDefaults[i % charDefaults.length],
        color: prev ? prev.color : colDefaults[i % colDefaults.length],
      };
    });
  }

  toggleSlotBot(slot: LocalSlotConfig) {
    this.soundService.playMenuClick();
    slot.isBot = !slot.isBot;
    if (slot.isBot) {
      if (slot.nickname.startsWith('Jugador')) {
        slot.nickname = `Bot ${slot.slot}`;
      }
    } else {
      if (slot.nickname.startsWith('Bot')) {
        slot.nickname = `Jugador ${slot.slot}`;
      }
    }
  }

  iniciarPartidaLocal() {
    this.localSlots.forEach((s) => {
      if (!s.nickname.trim()) {
        s.nickname = s.isBot ? `Bot ${s.slot}` : `Jugador ${s.slot}`;
      }
    });

    sessionStorage.setItem('codearena_modo', 'local');
    sessionStorage.setItem('codearena_local_players', JSON.stringify(this.localSlots));
    sessionStorage.setItem('codearena_dificultad', this.dificultad);
    sessionStorage.setItem('codearena_tema', this.temaSeleccionado);
    sessionStorage.setItem('codearena_target_stars', this.targetStars.toString());
    sessionStorage.setItem('codearena_target_points', this.targetPoints.toString());
    sessionStorage.setItem('codearena_playerId', 'p1_local');
    sessionStorage.setItem('codearena_nickname', this.localSlots[0].nickname);
    sessionStorage.setItem('codearena_color', this.localSlots[0].color);

    this.soundService.playMenuClick();
    this.router.navigate(['/lobby/local']);
  }

  crearSala() {
    if (this.modoJuego === 'local') {
      this.iniciarPartidaLocal();
      return;
    }

    if (!this.nickname.trim()) {
      this.nicknameError = true;
      this.errorMessage = '';
      return;
    }
    this.nicknameError = false;
    this.loading = true;
    this.errorMessage = '';

    this.apiService.crearSala(this.temaSeleccionado, this.dificultad, this.targetStars, this.targetPoints).subscribe({
      next: (sala) => {
        this.apiService.unirseSala(sala.codigo, this.nickname, this.selectedColor).subscribe({
          next: (res) => {
            sessionStorage.setItem('codearena_playerId', res.jugador.id);
            sessionStorage.setItem('codearena_nickname', this.nickname);
            sessionStorage.setItem('codearena_color', this.selectedColor);
            sessionStorage.setItem('codearena_dificultad', this.dificultad);
            sessionStorage.setItem('codearena_target_stars', this.targetStars.toString());
            sessionStorage.setItem('codearena_target_points', this.targetPoints.toString());
            sessionStorage.setItem('codearena_game_mode', 'lan');
            sessionStorage.setItem('codearena_gamemode', 'lan');
            sessionStorage.setItem('codearena_modo', 'multi');
            this.router.navigate(['/lobby', sala.codigo]);
          },
          error: (err) => {
            this.loading = false;
            this.errorMessage = err.error?.message || 'Error al ingresar a la sala creada.';
          },
        });
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'El servidor backend no está respondiendo (puerto 3000).';
        } else {
          this.errorMessage = err.error?.message || 'No se pudo crear la sala.';
        }
      },
    });
  }

  unirseConCodigoDirecto(codigo: string) {
    this.codigoInput = codigo;
    this.unirseSala();
  }

  unirseSala() {
    const cod = this.codigoInput.trim().toUpperCase();
    if (!cod || cod.length !== 6) {
      this.errorMessage = 'El código de sala debe tener exactamente 6 caracteres.';
      return;
    }
    if (!this.nickname.trim()) {
      this.nicknameError = true;
      this.errorMessage = 'Por favor ingresa tu nombre de jugador arriba.';
      return;
    }
    this.nicknameError = false;

    this.loading = true;
    this.errorMessage = '';

    this.apiService.unirseSala(cod, this.nickname, this.selectedColor).subscribe({
      next: (res) => {
        sessionStorage.setItem('codearena_playerId', res.jugador.id);
        sessionStorage.setItem('codearena_nickname', this.nickname);
        sessionStorage.setItem('codearena_color', this.selectedColor);
        sessionStorage.setItem('codearena_modo', 'multi');
        this.router.navigate(['/lobby', cod]);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'El servidor backend no está respondiendo (puerto 3000). Asegúrate de tener corriendo "npm run start:dev" en la carpeta backend.';
        } else {
          this.errorMessage = err.error?.message || 'Error al intentar unirse a la sala.';
        }
      },
    });
  }
}