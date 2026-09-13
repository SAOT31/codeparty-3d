import {
  Component, Input, Output, EventEmitter,
  AfterViewInit, OnDestroy, ViewChildren, QueryList, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { CHARACTER_DEFS, CharacterFactory, CharacterType } from '../../arena/characters/character.factory';
import { BaseCharacter } from '../../arena/characters/base.character';

@Component({
  selector: 'app-character-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="char-selector">
      <h2 class="cs-title">✨ {{ currentPickerName ? 'Turno de ' + currentPickerName + ' para elegir' : 'Elige tu Personaje' }}</h2>
      <p class="cs-sub">{{ takenTypes.length > 0 ? 'Los marcados con 🔒 ya fueron tomados por otro jugador' : 'Sé el primero en elegir' }}</p>

      <div class="char-cards">
        <div
          class="char-card"
          *ngFor="let def of defs; let i = index"
          [class.selected]="selectedType === def.type"
          [class.taken]="isTaken(def.type) && selectedType !== def.type"
          (click)="selectCharacter(def.type)"
          [id]="'char-card-' + def.type"
        >
          <canvas
            #charCanvas
            class="char-canvas"
            [width]="140"
            [height]="140"
          ></canvas>

          <div class="char-info">
            <div class="char-name">{{ def.emoji }} {{ def.name }}</div>
            <div class="char-desc">{{ def.description }}</div>
            <div class="char-taken" *ngIf="isTaken(def.type) && selectedType !== def.type">🔒 Tomado</div>
            <div class="char-selected-badge" *ngIf="selectedType === def.type">✅ Tu elección</div>
          </div>

          <div class="char-owner" *ngIf="getOwner(def.type) as owner">
            <span class="owner-dot" [style.background]="owner.color"></span>
            {{ owner.nickname }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .char-selector {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 0 8px;
      width: 100%;
    }

    .cs-title {
      font-family: var(--font-title);
      font-size: 1.8rem;
      color: #ffffff;
      margin: 0;
      text-align: center;
    }

    .cs-sub {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;
      margin: 0;
      text-align: center;
    }

    .char-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      width: 100%;
      max-width: 780px;
    }

    @media (max-width: 640px) {
      .char-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .char-card {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;

      &:hover:not(.taken) {
        transform: translateY(-6px) scale(1.03);
        border-color: var(--color-primary);
        box-shadow: 0 8px 24px rgba(0, 245, 255, 0.25);
      }

      &.selected {
        border-color: var(--color-success);
        background: rgba(68, 207, 108, 0.12);
        box-shadow: 0 0 24px rgba(68, 207, 108, 0.4);
        transform: translateY(-4px);
      }

      &.taken {
        opacity: 0.45;
        cursor: not-allowed;
        filter: grayscale(0.6);
      }
    }

    .char-canvas {
      width: 140px;
      height: 140px;
      border-radius: 12px;
      display: block;
    }

    .char-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      width: 100%;
      text-align: center;
    }

    .char-name {
      font-family: var(--font-title);
      font-size: 0.95rem;
      font-weight: 800;
      color: #ffffff;
    }

    .char-desc {
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.55);
      line-height: 1.2;
    }

    .char-taken, .char-selected-badge {
      font-family: var(--font-cyber);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      margin-top: 2px;
    }

    .char-taken {
      background: rgba(255, 71, 87, 0.2);
      color: var(--color-danger);
      border: 1px solid rgba(255, 71, 87, 0.4);
    }

    .char-selected-badge {
      background: rgba(68,207,108,0.2);
      color: var(--color-success);
      border: 1px solid rgba(68,207,108,0.4);
    }

    .char-owner {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.7rem;
      color: rgba(255,255,255,0.6);
      font-weight: 600;
    }

    .owner-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  `],
})
export class CharacterSelectorComponent implements AfterViewInit, OnDestroy {
  @Input() takenTypes: { type: CharacterType; playerId: string; nickname: string; color: string }[] = [];
  @Input() myPlayerId: string = '';
  @Input() currentPickerName: string = '';
  @Output() characterSelected = new EventEmitter<CharacterType>();

  @ViewChildren('charCanvas') canvasRefs!: QueryList<ElementRef<HTMLCanvasElement>>;

  defs = CHARACTER_DEFS;
  selectedType: CharacterType | null = null;

  private renderers: THREE.WebGLRenderer[] = [];
  private scenes: THREE.Scene[] = [];
  private cameras: THREE.PerspectiveCamera[] = [];
  private characters: BaseCharacter[] = [];
  private animationIds: number[] = [];

  ngAfterViewInit() {
    setTimeout(() => this.initMiniCanvases(), 100);
  }

  private initMiniCanvases() {
    const canvases = this.canvasRefs.toArray();
    canvases.forEach((ref, i) => {
      const canvas = ref.nativeElement;
      const def = CHARACTER_DEFS[i];

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(140, 140);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
      camera.position.set(0, 1.4, 4.8);
      camera.lookAt(0, 0.35, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 1.4));
      const dirLight = new THREE.DirectionalLight(0xffeedd, 2.0);
      dirLight.position.set(3, 5, 3);
      scene.add(dirLight);
      const fillLight = new THREE.DirectionalLight(new THREE.Color(def.color), 1.0);
      fillLight.position.set(-3, -2, -2);
      scene.add(fillLight);

      const character = CharacterFactory.create(def.type, def.color);
      character.mesh.position.set(0, 0, 0);
      scene.add(character.mesh);

      this.renderers.push(renderer);
      this.scenes.push(scene);
      this.cameras.push(camera);
      this.characters.push(character);

      const animate = () => {
        const id = requestAnimationFrame(animate);
        this.animationIds[i] = id;
        const delta = 0.016;
        character.animate(delta);
        character.mesh.rotation.y += delta * 0.8;
        renderer.render(scene, camera);
      };
      animate();
    });
  }

  isTaken(type: CharacterType): boolean {
    return this.takenTypes.some(t => t.type === type && t.playerId !== this.myPlayerId);
  }

  getOwner(type: CharacterType): { nickname: string; color: string } | null {
    const owner = this.takenTypes.find(t => t.type === type && t.playerId !== this.myPlayerId);
    return owner || null;
  }

  selectCharacter(type: CharacterType) {
    if (this.isTaken(type)) return;
    this.selectedType = type;
    this.characterSelected.emit(type);
  }

  ngOnDestroy() {
    this.animationIds.forEach(id => cancelAnimationFrame(id));
    this.renderers.forEach(r => r.dispose());
  }
}