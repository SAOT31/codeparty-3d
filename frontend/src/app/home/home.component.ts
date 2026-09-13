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
  template: `
    <div class="title-screen-overlay" *ngIf="inTitleScreen">
      <div class="ts-sound-toggle">
        <button class="sound-mini-btn" (click)="toggleSound(); $event.stopPropagation()" id="btn-title-sound">
          {{ isMuted ? '🔇 Sonido: OFF' : '🔊 Sonido: ON' }}
        </button>
      </div>

      <div class="ts-content" (click)="pressStart()">
        <div class="ts-badge">✨ EDICIÓN 3D MULTIJUGADOR ✨</div>
        <div class="ts-logo-box">
          <div class="ts-star-icon">🎲</div>
          <h1 class="ts-title">Code<span class="ts-accent">Party</span> 3D</h1>
        </div>
        <p class="ts-subtitle">¡La Fiesta de Tablero 3D, Dados & Desafíos para 4 Jugadores!</p>

        <div class="ts-start-box">
          <button class="ts-arcade-btn" (click)="pressStart()" id="btn-arcade-start">
            <span class="ts-play-triangle">▶</span> PRESS START
          </button>
          <div class="ts-blink-text">
            <span>O PRESIONA <kbd class="ts-kbd">ENTER</kbd> PARA ENTRAR</span>
          </div>
        </div>
      </div>
    </div>

    <div class="home-container" *ngIf="!inTitleScreen">
      <div class="stars-bg"></div>

      <header class="game-header" style="animation: fadeInUp 0.6s ease both;">
        <div class="logo-wrapper">
          <span class="logo-icon">🎲</span>
          <h1 class="game-title">Code<span class="title-accent">Party</span> 3D</h1>
        </div>
        <p class="subtitle">¡La Fiesta de Tablero 3D, Dados & Trivia Familiar!</p>
      </header>

      <nav class="main-nav" style="animation: fadeInUp 0.7s ease both;">
        <button class="nav-btn" [class.active]="view === 'play'" (click)="view = 'play'" id="btn-nav-play">
          🎮 Jugar
        </button>
        <button class="nav-btn" [class.active]="view === 'how'" (click)="view = 'how'" id="btn-nav-how">
          📖 Cómo Jugar
        </button>
        <button class="nav-btn sound-nav-btn" (click)="toggleSound()" id="btn-nav-sound" [title]="isMuted ? 'Activar sonido' : 'Silenciar sonido'">
          {{ isMuted ? '🔇 Sonido' : '🔊 Sonido' }}
        </button>
      </nav>

      <main class="content-panel glass-panel" *ngIf="view === 'play'"
            style="animation: bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;">

        <div class="card-switcher">
          <button class="switcher-tab" [class.tab-active]="activeCard === 'crear'"
                  (click)="setCard('crear')" id="card-crear">
            <span class="tab-icon">✨</span>
            <span class="tab-text">Crear Partida</span>
          </button>
          <button class="switcher-tab" [class.tab-active]="activeCard === 'unir'"
                  (click)="setCard('unir')" id="card-unir">
            <span class="tab-icon">🔗</span>
            <span class="tab-text">Unirse a Sala</span>
            <span class="tab-count-badge" *ngIf="salasActivas.length > 0">{{ salasActivas.length }}</span>
          </button>
        </div>

        <!-- PANEL CREAR PARTIDA -->
        <div class="active-card-panel" *ngIf="activeCard === 'crear'">
          <div class="input-group">
            <label class="field-label">🕹️ Modo de juego</label>
            <div class="mode-row">
              <button class="mode-btn" [class.mode-active]="modoJuego === 'local'"
                      (click)="modoJuego = 'local'" id="btn-modo-local"
                      title="1 a 4 jugadores en este mismo PC (solitario contra bots o con amigos)">
                🖥️ Mismo PC / Local
              </button>
              <button class="mode-btn" [class.mode-active]="modoJuego === 'lan'"
                      (click)="setModoLan()" id="btn-modo-lan"
                      title="Cada jugador entra desde su propio PC o celular con la misma Wi-Fi">
                🌐 Red Local / Wi-Fi
              </button>
            </div>
            <small class="field-hint" *ngIf="modoJuego === 'local'">
              Juega tú solo contra bots de IA o con hasta 4 amigos en este mismo computador.
            </small>
            <small class="field-hint" *ngIf="modoJuego === 'lan'">
              Crea la sala y comparte el enlace de abajo para que tus amigos se conecten desde sus celulares o PCs.
            </small>
          </div>

          <!-- BANNER DE ENLACE WI-FI / RED LOCAL -->
          <div class="lan-share-box" *ngIf="modoJuego === 'lan'">
            <div class="lan-share-content">
              <span class="lan-share-icon">📡</span>
              <div class="lan-share-text">
                <span class="lan-share-title">Enlace para amigos o celulares en tu Wi-Fi:</span>
                <code class="lan-url">{{ getShareUrl() }}</code>
              </div>
              <button type="button" class="btn-copy-ip" (click)="copiarEnlaceLan()" id="btn-copy-lan-link">
                {{ linkCopiado ? '✅ ¡Copiado!' : '📋 Copiar Enlace' }}
              </button>
            </div>
          </div>

          <!-- PERFIL ANFITRIÓN EN MODO LAN -->
          <section class="profile-row" *ngIf="modoJuego === 'lan'" style="margin-top: 4px; margin-bottom: 8px;">
            <div class="input-group name-group">
              <label class="field-label name-label">👤 Tu nombre de anfitrión</label>
              <input id="input-nickname" type="text" class="field-input name-input"
                     [(ngModel)]="nickname"
                     [class.input-invalid]="nicknameError"
                     placeholder="Ej: StarHero99" maxlength="15"
                     (input)="nicknameError = false" />
              <span class="name-counter">{{ nickname.length }}/15</span>
              <p class="name-error" *ngIf="nicknameError">⚠️ Escribe tu nombre para continuar</p>
            </div>
            <div class="input-group">
              <label class="field-label">🎨 Color de tu personaje</label>
              <div class="color-picker">
                <button class="color-dot" *ngFor="let c of droneColors"
                        [style.background]="c"
                        [class.selected]="selectedColor === c"
                        (click)="selectedColor = c"
                        [title]="c">
                </button>
              </div>
            </div>
          </section>

          <!-- PARTICIPANTES EN MODO LOCAL -->
          <div class="local-config-container" *ngIf="modoJuego === 'local'">
            <div class="presets-header">
              <label class="field-label">👥 Participantes de la Partida (4 Jugadores)</label>
              <div class="presets-row">
                <button class="preset-btn" [class.preset-active]="getLocalHumanCount() === 1"
                        (click)="setLocalPreset(1)">
                  👤 1P + 3 Bots
                </button>
                <button class="preset-btn" [class.preset-active]="getLocalHumanCount() === 2"
                        (click)="setLocalPreset(2)">
                  👥 2P + 2 Bots
                </button>
                <button class="preset-btn" [class.preset-active]="getLocalHumanCount() === 3"
                        (click)="setLocalPreset(3)">
                  🧑‍🤝‍🧑 3P + 1 Bot
                </button>
                <button class="preset-btn" [class.preset-active]="getLocalHumanCount() === 4"
                        (click)="setLocalPreset(4)">
                  🎉 4P Humanos
                </button>
              </div>
            </div>

            <div class="slots-config-grid">
              <div class="slot-edit-card" *ngFor="let s of localSlots"
                   [class.slot-is-bot]="s.isBot"
                   [class.slot-is-human]="!s.isBot">

                <!-- SLOT HUMANO -->
                <ng-container *ngIf="!s.isBot">
                  <div class="sec-top">
                    <span class="sec-badge">Slot {{ s.slot }} &bull; 👤 Humano</span>
                    <button class="slot-toggle-btn btn-is-human" (click)="toggleSlotBot(s)" title="Cambiar a Bot">
                      👤 Humano
                    </button>
                  </div>

                  <div class="human-card-layout">
                    <div class="human-controls-col">
                      <div class="sec-field">
                        <label class="sec-label">Nombre</label>
                        <input type="text" class="field-input sec-input"
                                [(ngModel)]="s.nickname"
                                maxlength="12"
                                placeholder="Nombre Jugador" />
                      </div>

                      <div class="sec-field">
                        <label class="sec-label">Color</label>
                        <div class="color-picker-mini">
                          <button class="dot-mini" *ngFor="let col of droneColors"
                                  [style.background]="col"
                                  [class.dot-mini-selected]="s.color === col"
                                  (click)="s.color = col">
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>

                <!-- SLOT BOT (AUTOMÁTICO) -->
                <ng-container *ngIf="s.isBot">
                  <div class="sec-top">
                    <span class="sec-badge bot-badge">Slot {{ s.slot }} &bull; 🤖 CPU</span>
                    <button class="slot-toggle-btn btn-is-bot" (click)="toggleSlotBot(s)" title="Cambiar a Humano">
                      🤖 Bot CPU
                    </button>
                  </div>

                  <div class="bot-card-layout">
                    <div class="bot-icon-circle">🤖</div>
                    <div class="bot-info-texts">
                      <span class="bot-name-strong">{{ s.nickname }}</span>
                      <span class="bot-desc-hint">⚡ Rival controlado por la IA automática</span>
                    </div>
                  </div>
                </ng-container>

              </div>
            </div>
          </div>

          <div class="input-group">
            <label class="field-label">🧠 Tema de programación</label>
            <select id="select-tema" class="field-select" [(ngModel)]="temaSeleccionado">
              <option *ngFor="let t of temasValidos" [value]="t">{{ t }}</option>
            </select>
          </div>

          <div class="input-group">
            <label class="field-label">⚡ Dificultad de preguntas</label>
            <div class="difficulty-row">
              <button class="diff-btn" *ngFor="let d of dificultades"
                      [class.diff-active]="dificultad === d.value"
                      (click)="dificultad = d.value"
                      [id]="'btn-diff-' + d.value">
                {{ d.emoji }} {{ d.label }}
              </button>
            </div>
          </div>

          <!-- METAS DE VICTORIA: ESTRELLAS Y MONEDAS -->
          <div class="victory-goals-config">
            <label class="field-label">🏆 Condiciones de Victoria de la Partida</label>
            <div class="goals-grid">
              <!-- Meta de Estrellas -->
              <div class="goal-item">
                <div class="goal-header">
                  <span class="goal-icon">⭐</span>
                  <span class="goal-title">Meta de Estrellas</span>
                </div>
                <div class="goal-selector">
                  <button type="button" class="goal-chip chip-star" *ngFor="let st of [1, 2, 3, 5]"
                          [class.chip-active]="targetStars === st"
                          (click)="targetStars = st"
                          [id]="'chip-stars-' + st">
                    {{ st }} ⭐
                  </button>
                </div>
              </div>

              <!-- Meta de Puntos / Monedas -->
              <div class="goal-item">
                <div class="goal-header">
                  <span class="goal-icon">🪙</span>
                  <span class="goal-title">Meta de Puntos</span>
                </div>
                <div class="goal-selector">
                  <button type="button" class="goal-chip chip-coin" *ngFor="let pt of [50, 100, 150, 200]"
                          [class.chip-active]="targetPoints === pt"
                          (click)="targetPoints = pt"
                          [id]="'chip-points-' + pt">
                    {{ pt }} 🪙
                  </button>
                </div>
              </div>
            </div>

            <div class="victory-summary-badge">
              🎯 <strong>Regla:</strong> ¡Gana el primer jugador en conseguir <strong>{{ targetStars }} ⭐ Estrellas</strong> O acumular <strong>{{ targetPoints }} 🪙 Monedas</strong>!
            </div>
          </div>

          <button id="btn-crear-sala" class="btn-play w-full" (click)="crearSala()" [disabled]="loading">
            {{ loading ? '⏳ Preparando...' : (modoJuego === 'local' ? '✨ Elegir Personajes en 3D ➔' : '🚀 Crear Sala y Elegir Personaje') }}
          </button>
        </div>

        <!-- PANEL UNIRSE A SALA -->
        <div class="active-card-panel unir-panel" *ngIf="activeCard === 'unir'">
          
          <!-- 1. PERFIL DEL JUGADOR QUE SE UNE (NOMBRE Y COLOR) -->
          <div class="unir-profile-box">
            <div class="profile-row" style="margin: 0;">
              <div class="input-group name-group">
                <label class="field-label name-label">👤 Tu nombre de jugador</label>
                <input id="input-nickname-unir" type="text" class="field-input name-input"
                       [(ngModel)]="nickname"
                       [class.input-invalid]="nicknameError"
                       placeholder="Ej: StarHero99" maxlength="15"
                       (input)="nicknameError = false" />
                <span class="name-counter">{{ nickname.length }}/15</span>
                <p class="name-error" *ngIf="nicknameError">⚠️ Escribe tu nombre para unirte</p>
              </div>
              <div class="input-group">
                <label class="field-label">🎨 Tu color de personaje</label>
                <div class="color-picker">
                  <button class="color-dot" *ngFor="let c of droneColors"
                          [style.background]="c"
                          [class.selected]="selectedColor === c"
                          (click)="selectedColor = c"
                          [title]="c">
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="divider" style="margin: 18px 0 14px;"></div>

          <!-- 2. LISTA DE SALAS ACTIVAS EN VIVO -->
          <div class="active-rooms-section">
            <div class="section-title-row">
              <label class="field-label" style="font-size: 1.05rem; color: #ffffff; display: flex; align-items: center; gap: 8px;">
                <span>📡 Salas Abiertas en Espera</span>
                <span class="rooms-badge-count">{{ salasActivas.length }}</span>
              </label>
              <button class="btn-refresh-mini" (click)="cargarSalasActivas()" title="Buscar salas disponibles" id="btn-refresh-salas">
                <span [class.spin-icon]="cargandoSalas">🔄</span> Actualizar
              </button>
            </div>

            <div class="rooms-list-grid" *ngIf="salasActivas.length > 0">
              <div class="room-card-item" *ngFor="let s of salasActivas" [class.room-item-full]="s.jugadoresCount >= s.maxJugadores">
                <div class="room-item-info">
                  <div class="room-item-top">
                    <span class="room-tema-badge">📚 {{ s.tema }}</span>
                    <span class="room-code-badge">🔑 {{ s.codigo }}</span>
                  </div>
                  <div class="room-item-bottom">
                    <span class="room-players-count">👥 {{ s.jugadoresCount }}/{{ s.maxJugadores }} Jugadores</span>
                    <span class="room-status-dot">🟢 En espera</span>
                  </div>
                </div>
                <button class="btn-join-room-direct" (click)="unirseConCodigoDirecto(s.codigo)"
                        [disabled]="loading || s.jugadoresCount >= s.maxJugadores"
                        [id]="'btn-join-' + s.codigo">
                  {{ s.jugadoresCount >= s.maxJugadores ? '🚫 Sala Llena' : '🚀 Entrar' }}
                </button>
              </div>
            </div>

            <div class="no-rooms-box" *ngIf="salasActivas.length === 0 && !cargandoSalas">
              <p class="no-rooms-text">No hay salas abiertas en espera ahora mismo.</p>
              <small class="no-rooms-sub">Crea una en la pestaña <strong>"Crear Partida"</strong> o escribe un código manual abajo si tu amigo acaba de crearla.</small>
            </div>

            <div class="loading-rooms-box" *ngIf="cargandoSalas">
              <span>⏳ Buscando salas en la red...</span>
            </div>
          </div>

          <div class="divider" style="margin: 18px 0 14px;"></div>

          <!-- 3. UNIRSE MEDIANTE CÓDIGO MANUAL -->
          <div class="manual-code-section">
            <label class="field-label">🔑 O ingresa el código de 6 letras manualmente:</label>
            <div class="manual-code-row">
              <input id="input-codigo" type="text" class="field-input code-input"
                     [(ngModel)]="codigoInput" placeholder="EJ: 5TC9Q5"
                     maxlength="6" style="text-transform:uppercase;letter-spacing:4px;font-size:1.25rem;text-align:center;" />
              <button id="btn-unirse-sala" class="btn-play btn-join-manual" (click)="unirseSala()" [disabled]="loading">
                {{ loading ? '⏳...' : '🎮 Unirse' }}
              </button>
            </div>
          </div>

        </div>

        <div class="error-banner" *ngIf="errorMessage" style="animation: bounce-in 0.3s ease both;">
          ⚠️ {{ errorMessage }}
        </div>
      </main>

      <main class="content-panel glass-panel how-panel" *ngIf="view === 'how'"
            style="animation: bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both;">
        <h2 class="how-title">📖 Cómo Jugar en CodeParty 3D</h2>

        <div class="how-grid">
          <div class="how-card">
            <div class="how-icon">🎭</div>
            <h3>4 Personajes Únicos</h3>
            <ul class="controls-list">
              <li>⭐ <strong>Estrellita:</strong> Giro veloz con estrellas mágicas</li>
              <li>🍄 <strong>Hongito:</strong> Sombrero saltarín y esporas brillantes</li>
              <li>💎 <strong>Cristalín:</strong> Octaedro flotante con prismas de luz</li>
              <li>🚀 <strong>Cohete:</strong> Propulsores de plasma y llamaradas</li>
            </ul>
          </div>

          <div class="how-card">
            <div class="how-icon">🗺️</div>
            <h3>4 Tableros Temáticos</h3>
            <ul class="controls-list">
              <li>🏝️ <strong>Isla Tropical:</strong> Palmeras, aguas cristalinas y brisa marina</li>
              <li>🍰 <strong>Reino Dulce:</strong> Piruletas gigantes, caramelos y chocolate</li>
              <li>🌌 <strong>Galaxia Pixel:</strong> Estación espacial, estrellas y Saturno</li>
              <li>🌋 <strong>Volcán Código:</strong> Rocas ardientes sobre magma brillante</li>
            </ul>
          </div>

          <div class="how-card">
            <div class="how-icon">🎲</div>
            <h3>Mecánica de Tablero 3D</h3>
            <ul class="controls-list">
              <li>🎲 <strong>Tirar Dado:</strong> Presiona ESPACIO o el botón para lanzar</li>
              <li>🔵 <strong>Azul (+10 pts) / 🔴 Roja (-5 pts)</strong></li>
              <li>💡 <strong>Trivia:</strong> Pregunta con tiempo justo para pensar y ganar poderes</li>
              <li>🎁 <strong>Regalo / ⭐ Estrella:</strong> Boost x2, Escudo y super puntos</li>
            </ul>
          </div>

          <div class="how-card">
            <div class="how-icon">🌐</div>
            <h3>Multijugador LAN y Local</h3>
            <ul class="controls-list">
              <li>📡 <strong>Red Local (LAN/Wi-Fi):</strong> Cada jugador entra desde su PC o celular</li>
              <li>🖥️ <strong>Mismo PC (Split Keyboard):</strong> 3 jugadores en 1 teclado</li>
              <li>🤖 <strong>Bots CPU:</strong> Practica solo contra IA inteligente</li>
              <li>⚡ <strong>Resiliente:</strong> Si se cae el internet, la red local no para</li>
            </ul>
          </div>
        </div>

        <button class="btn-play" style="margin-top:16px;" (click)="view = 'play'" id="btn-back-to-play">
          🎮 ¡Vamos a Jugar!
        </button>
      </main>
    </div>
  `,
  styles: [`
    .title-screen-overlay {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #2e1065 0%, #0f051d 75%, #06020c 100%);
      overflow: hidden;
      user-select: none;
    }

    .ts-sound-toggle {
      position: absolute;
      top: 24px;
      right: 28px;
      z-index: 110;
    }

    .sound-mini-btn {
      background: rgba(255, 255, 255, 0.12);
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      border-radius: 50px;
      color: #fff;
      padding: 8px 18px;
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

    .ts-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 32px 20px;
      gap: 16px;
      max-width: 700px;
      animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      cursor: pointer;
    }

    .ts-badge {
      font-family: var(--font-cyber);
      font-size: 0.82rem;
      letter-spacing: 3px;
      color: var(--color-accent);
      background: rgba(0, 245, 255, 0.1);
      border: 1px solid rgba(0, 245, 255, 0.3);
      padding: 6px 18px;
      border-radius: 30px;
      text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
    }

    .ts-logo-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    .ts-star-icon {
      font-size: 4rem;
      line-height: 1;
      animation: float 2.8s ease-in-out infinite;
      filter: drop-shadow(0 0 24px rgba(255, 215, 0, 0.7));
    }

    .ts-title {
      font-family: var(--font-title);
      font-size: 4.4rem;
      margin: 0;
      color: #ffffff;
      line-height: 1;
      text-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.3);
      letter-spacing: 1px;
    }

    @media (max-width: 640px) {
      .ts-title { font-size: 2.8rem; }
      .ts-star-icon { font-size: 2.8rem; }
    }

    .ts-accent {
      color: var(--color-primary);
      text-shadow: 0 0 28px rgba(255, 215, 0, 0.8);
    }

    .ts-subtitle {
      font-family: var(--font-text);
      font-size: 1.15rem;
      color: rgba(255, 255, 255, 0.75);
      margin: 0;
    }

    .ts-start-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      margin: 20px 0 10px;
    }

    .ts-arcade-btn {
      padding: 18px 48px;
      font-family: var(--font-title);
      font-size: 1.5rem;
      font-weight: 900;
      color: #1a0533;
      background: linear-gradient(135deg, #FFD700 0%, #FF6B35 50%, #4ECDC4 100%);
      background-size: 200% 200%;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 8px 32px rgba(255, 107, 53, 0.5), 0 0 24px rgba(255, 215, 0, 0.4);
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: arcadePulse 1.8s infinite ease-in-out;

      &:hover {
        transform: translateY(-4px) scale(1.06);
        box-shadow: 0 12px 40px rgba(255, 107, 53, 0.7), 0 0 32px rgba(0, 245, 255, 0.6);
      }
    }

    .ts-play-triangle {
      font-size: 1.2rem;
      line-height: 1;
    }

    .ts-blink-text {
      font-family: var(--font-cyber);
      font-size: 0.88rem;
      letter-spacing: 1.5px;
      color: rgba(255, 255, 255, 0.85);
      animation: arcadeBlink 1.4s infinite ease-in-out;
    }

    .ts-kbd {
      background: rgba(255, 255, 255, 0.2);
      border: 1.5px solid rgba(255, 255, 255, 0.4);
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 0.82rem;
      color: var(--color-primary);
      box-shadow: 0 2px 0 rgba(255, 255, 255, 0.2);
    }

    .sound-nav-btn {
      border-color: rgba(255, 215, 0, 0.3) !important;
      color: var(--color-primary) !important;
      &:hover {
        border-color: var(--color-primary) !important;
        background: rgba(255, 215, 0, 0.15) !important;
      }
    }

    @keyframes arcadePulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.035);
      }
    }

    @keyframes arcadeBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.25; }
    }

    .home-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 24px 16px;
      gap: 16px;
      overflow-y: auto;
      position: relative;
      z-index: 1;
    }

    .game-header {
      text-align: center;
      z-index: 2;
    }

    .logo-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .logo-icon {
      font-size: 2.8rem;
      animation: float 3s ease-in-out infinite;
    }

    .game-title {
      font-family: var(--font-title);
      font-size: 2.8rem;
      color: #ffffff;
      text-shadow: 0 4px 16px rgba(0,0,0,0.4);
      line-height: 1;
    }

    .title-accent {
      color: var(--color-primary);
      text-shadow: 0 0 20px rgba(255,215,0,0.7), 0 4px 8px rgba(0,0,0,0.3);
    }

    .subtitle {
      font-family: var(--font-text);
      font-size: 1rem;
      color: rgba(255,255,255,0.65);
      margin-top: 4px;
    }

    .main-nav {
      display: flex;
      gap: 12px;
      z-index: 2;
    }

    .nav-btn {
      padding: 10px 28px;
      border-radius: 50px;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.7);
      font-size: 0.95rem;
      font-family: var(--font-text);
      font-weight: 700;
      transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);

      &:hover { background: rgba(255,255,255,0.14); color: #fff; transform: translateY(-2px); }

      &.active {
        background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
        border-color: transparent;
        color: #1a0533;
        box-shadow: 0 4px 16px rgba(255,215,0,0.4);
      }
    }

    .content-panel {
      width: 100%;
      max-width: 820px;
      border-radius: 24px;
      padding: 28px 32px;
      z-index: 2;
    }

    .profile-row {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-width: 180px;
    }

    .field-label {
      font-family: var(--font-text);
      font-weight: 700;
      font-size: 0.85rem;
      color: rgba(255,255,255,0.7);
      letter-spacing: 0.3px;
    }

    .field-input {
      padding: 12px 16px;
      border-radius: 14px;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(255,255,255,0.15);
      color: #ffffff;
      font-family: var(--font-text);
      font-size: 1rem;
      font-weight: 600;
      outline: none;
      transition: border-color 0.2s;

      &:focus {
        border-color: var(--color-accent);
        box-shadow: 0 0 0 3px rgba(78,205,196,0.15);
      }

      &::placeholder { color: rgba(255,255,255,0.3); }

      &.input-invalid {
        border-color: #ff4757 !important;
        box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.25) !important;
        animation: shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      }
    }

    .name-group { position: relative; }

    .name-label {
      font-size: 1.0rem !important;
      font-weight: 800 !important;
      color: var(--color-primary) !important;
      letter-spacing: 0.5px;
    }

    .name-input {
      font-size: 1.2rem !important;
      font-weight: 700 !important;
      letter-spacing: 1px;
    }

    .name-counter {
      position: absolute;
      right: 14px;
      bottom: 12px;
      font-size: 0.72rem;
      color: rgba(255,255,255,0.35);
      font-family: var(--font-cyber);
      pointer-events: none;
    }

    .name-error {
      margin: 4px 0 0 2px;
      font-size: 0.8rem;
      color: #ff4757;
      font-family: var(--font-text);
      font-weight: 600;
      animation: fadeInUp 0.2s ease both;
    }

    @keyframes shake {
      10%, 90% { transform: translateX(-2px); }
      20%, 80% { transform: translateX(4px); }
      30%, 50%, 70% { transform: translateX(-6px); }
      40%, 60% { transform: translateX(6px); }
    }

    .field-select {
      padding: 12px 16px;
      border-radius: 14px;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(255,255,255,0.15);
      color: #ffffff;
      font-family: var(--font-text);
      font-size: 1rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;

      option { background: #1a0533; color: #ffffff; }

      &:focus { border-color: var(--color-accent); }
    }

    .color-picker {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }

    .color-dot {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      cursor: pointer;
      border: 3px solid transparent;
      transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);

      &:hover { transform: scale(1.2); }

      &.selected {
        border-color: #ffffff;
        transform: scale(1.25);
        box-shadow: 0 0 0 2px rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.4);
      }
    }

    .card-switcher {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      background: rgba(0, 0, 0, 0.3);
      padding: 6px;
      border-radius: 18px;
      border: 1.5px solid rgba(255, 255, 255, 0.12);
    }

    .switcher-tab {
      flex: 1;
      padding: 12px 20px;
      border-radius: 14px;
      background: transparent;
      border: 1.5px solid transparent;
      color: rgba(255, 255, 255, 0.65);
      font-family: var(--font-title);
      font-size: 1.15rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.08);
      }

      &.tab-active {
        background: rgba(78, 205, 196, 0.2);
        border-color: var(--color-accent);
        color: #ffffff;
        box-shadow: 0 4px 16px rgba(78, 205, 196, 0.35);
      }
    }

    .tab-icon { font-size: 1.3rem; }

    .active-card-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }

    .unir-panel {
      max-width: 480px;
      margin: 10px auto;
      text-align: center;
      background: rgba(0, 0, 0, 0.2);
      border: 1.5px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 24px;
    }

    .unir-desc {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }

    .difficulty-row, .mode-row {
      display: flex;
      gap: 8px;
    }

    .diff-btn {
      flex: 1;
      padding: 8px 4px;
      border-radius: 12px;
      background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.7);
      font-size: 0.82rem;
      font-family: var(--font-text);
      font-weight: 700;
      transition: all 0.2s;

      &:hover { background: rgba(255,255,255,0.12); color: #fff; }

      &.diff-active {
        background: rgba(255,215,0,0.15);
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
    }

    .mode-btn {
      flex: 1;
      padding: 9px 6px;
      border-radius: 12px;
      background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.7);
      font-size: 0.85rem;
      font-family: var(--font-text);
      font-weight: 700;
      transition: all 0.2s;

      &:hover { background: rgba(255,255,255,0.12); }

      &.mode-active {
        background: rgba(108,92,231,0.2);
        border-color: var(--color-purple);
        color: #ffffff;
      }
    }

    .bot-btn {
      flex: 1;
      padding: 10px 8px;
      border-radius: 12px;
      background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.7);
      font-size: 0.95rem;
      font-weight: 800;
      font-family: var(--font-text);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);

      small { font-size: 0.7rem; font-weight: 600; opacity: 0.7; }

      &:hover { transform: scale(1.05); }

      &.bot-active {
        background: rgba(253,121,168,0.2);
        border-color: var(--color-pink);
        color: var(--color-pink);
        transform: scale(1.08);
      }
    }

    .w-full { width: 100%; text-align: center; }

    .code-input {
      font-family: var(--font-cyber) !important;
    }

    .error-banner {
      margin-top: 12px;
      padding: 12px 16px;
      border-radius: 14px;
      background: rgba(255,71,87,0.15);
      border: 1.5px solid rgba(255,71,87,0.4);
      color: #ff8a96;
      font-size: 0.9rem;
      font-weight: 700;
      text-align: center;
    }

    .how-panel { max-width: 900px; }

    .how-title {
      font-family: var(--font-title);
      font-size: 1.8rem;
      text-align: center;
      margin-bottom: 20px;
      color: var(--color-primary);
    }

    .how-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 640px) {
      .how-grid { grid-template-columns: 1fr; }
    }

    .how-card {
      background: rgba(255,255,255,0.05);
      border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 18px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .how-icon { font-size: 2rem; }

    .how-card h3 {
      font-family: var(--font-title);
      font-size: 1.1rem;
      color: #ffffff;
    }

    .controls-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .controls-list li {
      font-size: 0.88rem;
      color: rgba(255,255,255,0.75);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    kbd {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 6px;
      padding: 2px 7px;
      font-family: var(--font-cyber);
      font-size: 0.75rem;
      color: var(--color-accent);
    }

    .skill-preview {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sp-item {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 8px 12px;
    }

    .sp-key {
      width: 26px;
      height: 26px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-cyber);
      font-size: 0.8rem;
      color: var(--color-accent);
      flex-shrink: 0;
    }

    .sp-icon { font-size: 1.3rem; flex-shrink: 0; }

    .sp-item div {
      display: flex;
      flex-direction: column;
      gap: 1px;

      strong { font-size: 0.88rem; color: #fff; }
      small  { font-size: 0.75rem; color: rgba(255,255,255,0.55); }
    }

    .how-note {
      font-size: 0.82rem;
      color: var(--color-primary);
      background: rgba(255,215,0,0.08);
      border-radius: 10px;
      padding: 8px 12px;
      border: 1px solid rgba(255,215,0,0.2);
    }
    .local-config-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: rgba(0, 0, 0, 0.25);
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      padding: 16px;
    }

    .presets-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .presets-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    @media (max-width: 640px) {
      .presets-row { grid-template-columns: 1fr 1fr; }
    }

    .preset-btn {
      padding: 8px 6px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #ffffff;
      font-family: var(--font-text);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { background: rgba(255, 255, 255, 0.16); }

      &.preset-active {
        background: rgba(255, 215, 0, 0.2);
        border-color: var(--color-primary);
        color: var(--color-primary);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
      }
    }

    .slots-config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    @media (max-width: 680px) {
      .slots-config-grid { grid-template-columns: 1fr; }
    }

    .slot-edit-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1.5px solid rgba(255, 255, 255, 0.14);
      border-radius: 16px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.25s;

      &.slot-is-human {
        background: rgba(78, 205, 196, 0.06);
        border-color: rgba(78, 205, 196, 0.35);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      }

      &.slot-is-bot {
        background: rgba(253, 121, 168, 0.04);
        border-color: rgba(253, 121, 168, 0.25);
        opacity: 0.85;
      }
    }

    .human-card-layout {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .human-preview-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .slot-3d-canvas {
      width: 100px;
      height: 100px;
      border-radius: 14px;
      background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.3) 100%);
      border: 1.5px solid rgba(255, 255, 255, 0.18);
      display: block;
      box-shadow: inset 0 0 12px rgba(0,0,0,0.4);
    }

    .preview-char-tag {
      font-family: var(--font-cyber);
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--color-primary);
      text-align: center;
      white-space: nowrap;
    }

    .human-controls-col {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .bot-card-layout {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 6px;
    }

    .bot-icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(253, 121, 168, 0.15);
      border: 1.5px solid rgba(253, 121, 168, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      flex-shrink: 0;
      animation: float 2.5s ease-in-out infinite;
    }

    .bot-info-texts {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .bot-name-strong {
      font-family: var(--font-title);
      font-size: 1.05rem;
      color: #fd79a8;
    }

    .bot-desc-hint {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.55);
      font-weight: 600;
    }

    .sec-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sec-badge {
      font-family: var(--font-cyber);
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--color-accent);
      letter-spacing: 1px;

      &.bot-badge {
        color: var(--color-pink);
      }
    }

    .slot-toggle-btn {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 800;
      font-family: var(--font-text);
      cursor: pointer;
      border: none;
      transition: all 0.2s;

      &.btn-is-human {
        background: rgba(78, 205, 196, 0.25);
        color: #4ECDC4;
        border: 1px solid rgba(78, 205, 196, 0.5);
      }

      &.btn-is-bot {
        background: rgba(253, 121, 168, 0.25);
        color: #fd79a8;
        border: 1px solid rgba(253, 121, 168, 0.5);
      }
    }

    .sec-field {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sec-label {
      width: 65px;
      font-size: 0.75rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.6);
      flex-shrink: 0;
    }

    .sec-input {
      padding: 6px 10px;
      font-size: 0.85rem;
      border-radius: 8px;
      flex: 1;
    }

    .char-picker-mini {
      display: flex;
      gap: 6px;
      flex: 1;
    }

    .c-mini-btn {
      padding: 4px 8px;
      font-size: 1.1rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: all 0.15s;

      &:hover { transform: scale(1.15); }

      &.c-mini-selected {
        background: rgba(255, 215, 0, 0.25);
        border-color: var(--color-primary);
        transform: scale(1.18);
        box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
      }
    }

    .color-picker-mini {
      display: flex;
      gap: 6px;
      align-items: center;
      flex: 1;
    }

    .dot-mini {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.15s;

      &:hover { transform: scale(1.2); }

      &.dot-mini-selected {
        border-color: #ffffff;
        transform: scale(1.25);
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
      }
    }

    .scenarios-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    @media (max-width: 640px) {
      .scenarios-row { grid-template-columns: 1fr 1fr; }
    }

    .scenario-btn {
      padding: 8px 6px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 700;
      font-family: var(--font-text);
      cursor: pointer;
      transition: all 0.2s;

      &:hover { background: rgba(255, 255, 255, 0.15); }

      &.scenario-active {
        background: rgba(78, 205, 196, 0.25);
        border-color: var(--color-accent);
        color: var(--color-accent);
        box-shadow: 0 0 8px rgba(78, 205, 196, 0.35);
      }
    }

    /* ESTILOS DE METAS DE VICTORIA */
    .victory-goals-config {
      background: rgba(255, 255, 255, 0.05);
      border: 1.5px solid rgba(255, 215, 0, 0.3);
      border-radius: 18px;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 4px;
      margin-bottom: 8px;
    }

    .goals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    @media (max-width: 580px) {
      .goals-grid { grid-template-columns: 1fr; }
    }

    .goal-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .goal-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .goal-icon { font-size: 1.1rem; }

    .goal-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.9);
      font-family: var(--font-text);
    }

    .goal-selector {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .goal-chip {
      flex: 1;
      min-width: 44px;
      padding: 6px 4px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      font-family: var(--font-cyber);
      font-size: 0.82rem;
      font-weight: 800;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        background: rgba(255, 255, 255, 0.18);
        transform: translateY(-2px);
      }

      &.chip-star.chip-active {
        background: rgba(255, 215, 0, 0.25);
        border-color: #FFD700;
        color: #FFD700;
        box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
        transform: scale(1.05);
      }

      &.chip-coin.chip-active {
        background: rgba(78, 205, 196, 0.25);
        border-color: var(--color-primary);
        color: var(--color-primary);
        box-shadow: 0 0 12px rgba(78, 205, 196, 0.4);
        transform: scale(1.05);
      }
    }

    .victory-summary-badge {
      background: rgba(10, 15, 30, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.3;
      text-align: center;

      strong {
        color: #ffffff;
      }
    }

    /* ESTILOS DE RED LOCAL / WI-FI SHARE */
    .lan-share-box {
      background: linear-gradient(135deg, rgba(78, 205, 196, 0.15) 0%, rgba(0, 245, 255, 0.08) 100%);
      border: 1.5px solid rgba(78, 205, 196, 0.4);
      border-radius: 16px;
      padding: 12px 16px;
      margin-top: 6px;
      margin-bottom: 8px;
      animation: fadeInUp 0.3s ease both;
    }

    .lan-share-content {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .lan-share-icon {
      font-size: 1.8rem;
    }

    .lan-share-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 180px;
    }

    .lan-share-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--color-accent);
      letter-spacing: 0.3px;
    }

    .lan-url {
      font-family: var(--font-cyber);
      font-size: 1.05rem;
      color: #ffffff;
      background: rgba(0, 0, 0, 0.35);
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
      width: fit-content;
      word-break: break-all;
    }

    .btn-copy-ip {
      padding: 8px 16px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--color-accent), #00b4d8);
      border: none;
      color: #031b28;
      font-family: var(--font-text);
      font-weight: 800;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
      }
    }

    /* ESTILOS DE LISTA DE SALAS ACTIVAS */
    .tab-count-badge {
      background: var(--color-accent);
      color: #031b28;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 20px;
      margin-left: 6px;
    }

    .unir-profile-box {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 16px;
    }

    .active-rooms-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .rooms-badge-count {
      background: rgba(0, 245, 255, 0.2);
      border: 1px solid rgba(0, 245, 255, 0.4);
      color: var(--color-accent);
      padding: 1px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-family: var(--font-cyber);
    }

    .btn-refresh-mini {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.85);
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.18);
        color: #ffffff;
      }
    }

    .spin-icon {
      display: inline-block;
      animation: spin 1s infinite linear;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .rooms-list-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 220px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .room-card-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.07);
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      transition: all 0.2s ease;
      gap: 12px;

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: var(--color-accent);
        transform: translateY(-1px);
      }

      &.room-item-full {
        opacity: 0.55;
        border-color: rgba(255, 255, 255, 0.1);
        &:hover { transform: none; }
      }
    }

    .room-item-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .room-item-top {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .room-tema-badge {
      font-weight: 800;
      color: #ffffff;
      font-size: 0.92rem;
    }

    .room-code-badge {
      font-family: var(--font-cyber);
      background: rgba(255, 215, 0, 0.15);
      border: 1px solid rgba(255, 215, 0, 0.35);
      color: var(--color-primary);
      padding: 1px 6px;
      border-radius: 6px;
      font-size: 0.75rem;
      letter-spacing: 1px;
    }

    .room-item-bottom {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.65);
    }

    .room-players-count {
      color: var(--color-accent);
      font-weight: 600;
    }

    .room-status-dot {
      color: #2ed573;
    }

    .btn-join-room-direct {
      padding: 8px 18px;
      border-radius: 10px;
      background: linear-gradient(135deg, #2ed573 0%, #10ac84 100%);
      border: none;
      color: #ffffff;
      font-family: var(--font-text);
      font-weight: 800;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover:not(:disabled) {
        transform: translateY(-2px) scale(1.04);
        box-shadow: 0 4px 14px rgba(46, 213, 115, 0.5);
      }

      &:disabled {
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.4);
        cursor: not-allowed;
      }
    }

    .no-rooms-box {
      padding: 16px;
      text-align: center;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 12px;
      border: 1px dashed rgba(255, 255, 255, 0.15);
    }

    .no-rooms-text {
      margin: 0;
      font-weight: 700;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .no-rooms-sub {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.78rem;
    }

    .loading-rooms-box {
      text-align: center;
      padding: 16px;
      color: var(--color-accent);
      font-size: 0.88rem;
    }

    .manual-code-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .manual-code-row {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .btn-join-manual {
      padding: 12px 24px !important;
      white-space: nowrap;
      min-width: 120px;
    }
  `]
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
    this.soundService.playStartJingle();
    if (!this.isMuted) {
      setTimeout(() => {
        this.soundService.startMenuMusic();
      }, 400);
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
    const port = typeof window !== 'undefined' && window.location.port ? window.location.port : '4200';
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