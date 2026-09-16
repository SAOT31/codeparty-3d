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
  templateUrl: './character-selector.component.html',
  styleUrl: './character-selector.component.scss',
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