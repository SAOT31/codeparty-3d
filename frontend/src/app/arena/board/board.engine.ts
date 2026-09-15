import * as THREE from 'three';
import { BoardTile, TileType, Vector3D } from '../../models/game.models';

type ScenarioLayout = 'isla' | 'sugar' | 'galaxia' | 'volcan';

export class BoardEngine {
  public tiles: BoardTile[] = [];
  public tileMeshes: THREE.Mesh[] = [];
  public boardGroup: THREE.Group;
  public diceMesh!: THREE.Group;
  public currentDiceValue = 1;
  public onDiceTick?: (value: number) => void;

  private isRolling = false;
  private rollTimer: any = null;
  private hitAnimTimer = 0;
  private baseDiceY = 4.0;
  private diceCanvas!: HTMLCanvasElement;
  private diceCtx!: CanvasRenderingContext2D;
  private diceTexture!: THREE.CanvasTexture;
  private diceCube!: THREE.Mesh;

  constructor(scenarioId: string = 'isla') {
    this.boardGroup = new THREE.Group();
    this.generateTiles(scenarioId as ScenarioLayout);
    this.createDice();
  }

  private tileType(i: number): { type: TileType; label: string } {
    if (i % 9 === 0) return { type: 'star', label: '⭐ META' };
    if (i % 3 === 1) return { type: 'trivia', label: '💡 TRIVIA' };
    if (i % 6 === 5) return { type: 'power', label: '🎁 PODER' };
    if (i % 6 === 2) return { type: 'red', label: '🔴 -5 PTS' };
    return { type: 'blue', label: '🔵 +10 PTS' };
  }

  private addTile(x: number, y: number, z: number, i: number) {
    const { type, label } = this.tileType(i);
    this.tiles.push({ index: i, position: { x, y, z }, type, label });
    const mesh = this.createTileMesh(type, { x, y, z }, i);
    this.tileMeshes.push(mesh);
    this.boardGroup.add(mesh);
  }

  private generateTiles(layout: ScenarioLayout) {
    this.tiles = [];
    this.tileMeshes = [];

    if (layout === 'isla') {
      this.generateIslaLayout();
    } else if (layout === 'sugar') {
      this.generateSugarLayout();
    } else if (layout === 'galaxia') {
      this.generateGalaxiaLayout();
    } else {
      this.generateVolcanLayout();
    }

    this.createPathConnections();
  }

  private generateIslaLayout() {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      pts.push([-21 + t * 42, 0.5 + Math.sin(t * Math.PI) * 0.8, 14]);
    }
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      pts.push([21, 0.5 + Math.sin(t * Math.PI) * 1.0, 14 - t * 14]);
    }
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      pts.push([21 - t * 21, 1.2 + Math.sin(t * Math.PI) * 1.4, 0]);
    }
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      pts.push([0 - t * 21, 1.2 + Math.sin(t * Math.PI) * 1.4, 0]);
    }
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      pts.push([-21, 0.5 + Math.sin(t * Math.PI) * 1.0, -t * 14]);
    }
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      pts.push([-21 + t * 42, 0.5 + Math.sin(t * Math.PI) * 0.8, -14]);
    }
    const total = Math.min(52, pts.length);
    for (let i = 0; i < total; i++) {
      this.addTile(pts[i][0], pts[i][1], pts[i][2], i);
    }
  }

  private generateSugarLayout() {
    const pts: [number, number, number][] = [];
    const cx = 0;
    const cz = 0;
    const rings = [
      { r: 20, start: 0, count: 16, dir: 1 },
      { r: 12, start: Math.PI / 8, count: 12, dir: -1 },
      { r: 5, start: Math.PI / 4, count: 8, dir: 1 },
    ];
    for (const ring of rings) {
      for (let i = 0; i < ring.count; i++) {
        const angle = ring.start + ring.dir * (i / ring.count) * Math.PI * 2;
        const x = cx + Math.cos(angle) * ring.r;
        const z = cz + Math.sin(angle) * ring.r;
        const y = 0.5 + (ring.r / 25) * 0.5 + Math.sin(i * 0.8) * 0.3;
        pts.push([x, y, z]);
      }
    }
    for (let i = 0; i < Math.min(52, pts.length); i++) {
      this.addTile(pts[i][0], pts[i][1], pts[i][2], i);
    }
  }

  private generateGalaxiaLayout() {
    const pts: [number, number, number][] = [];

    for (let i = 0; i < 13; i++) {
      const t = i / 12;
      pts.push([-18 + t * 36, 0.5 + Math.sin(t * Math.PI) * 0.6, 0]);
    }
    for (let i = 1; i < 8; i++) {
      const t = i / 7;
      pts.push([0, 0.5 + Math.sin(t * Math.PI) * 0.6, -t * 14]);
    }
    for (let i = 1; i < 8; i++) {
      const t = i / 7;
      pts.push([0, 0.5 + Math.sin(t * Math.PI) * 0.6, (7 - i + 1) * 2]);
    }
    for (let i = 1; i < 8; i++) {
      const t = i / 7;
      pts.push([t * 18, 0.8 + Math.sin(t * Math.PI) * 1.2, -14]);
    }
    for (let i = 1; i < 8; i++) {
      const t = i / 7;
      pts.push([-t * 18, 0.8 + Math.sin(t * Math.PI) * 1.2, -14]);
    }
    for (let i = 1; i < 10; i++) {
      const t = i / 9;
      pts.push([18, 0.5 + t * 0.3, -14 + t * 14]);
    }
    const total = Math.min(52, pts.length);
    for (let i = 0; i < total; i++) {
      this.addTile(pts[i][0], pts[i][1], pts[i][2], i);
    }
  }

  private generateVolcanLayout() {
    const pts: [number, number, number][] = [];
    const levels = [
      { z: -14, xStart: -18, xEnd: 18, y: 2.2, count: 13 },
      { z: -7, xStart: 18, xEnd: 6, y: 1.5, count: 6 },
      { z: 0, xStart: 6, xEnd: -6, y: 1.8, count: 6 },
      { z: 0, xStart: -6, xEnd: -18, y: 1.5, count: 6 },
      { z: 7, xStart: -18, xEnd: -6, y: 1.0, count: 6 },
      { z: 7, xStart: -6, xEnd: 6, y: 1.3, count: 6 },
      { z: 14, xStart: 6, xEnd: 18, y: 1.0, count: 6 },
      { z: 14, xStart: 18, xEnd: -18, y: 0.6, count: 7 },
    ];
    for (const seg of levels) {
      for (let i = 0; i < seg.count; i++) {
        const t = i / (seg.count - 1);
        const x = seg.xStart + (seg.xEnd - seg.xStart) * t;
        const y = seg.y + Math.sin(t * Math.PI) * 0.5;
        pts.push([x, y, seg.z]);
      }
    }
    const total = Math.min(52, pts.length);
    for (let i = 0; i < total; i++) {
      this.addTile(pts[i][0], pts[i][1], pts[i][2], i);
    }
  }

  private createTileMesh(type: TileType, pos: Vector3D, index: number): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(1.35, 1.48, 0.42, 32);

    let color = 0x0984e3;
    let emissive = 0x00a8ff;
    let rimColor = 0x74b9ff;
    let innerColor = 0x0056b3;
    let badgeBorder = '#00a8ff';
    let badgeText = '+10 PTS';
    let icon = '🔵';

    if (type === 'red') {
      color = 0xd63031;
      emissive = 0xff4757;
      rimColor = 0xff7675;
      innerColor = 0x961a1a;
      badgeBorder = '#ff4757';
      badgeText = '-5 PTS';
      icon = '🔴';
    } else if (type === 'trivia') {
      color = 0xf39c12;
      emissive = 0xe67e22;
      rimColor = 0xfdcb6e;
      innerColor = 0xb7791f;
      badgeBorder = '#f39c12';
      badgeText = 'TRIVIA';
      icon = '💡';
    } else if (type === 'power') {
      color = 0x8e44ad;
      emissive = 0x9b59b6;
      rimColor = 0xe056fd;
      innerColor = 0x5b2c6f;
      badgeBorder = '#e056fd';
      badgeText = 'PODER';
      icon = '🎁';
    } else if (type === 'star') {
      color = 0xf1c40f;
      emissive = 0xf39c12;
      rimColor = 0xfffa65;
      innerColor = 0xd4ac0d;
      badgeBorder = '#ffd700';
      badgeText = 'META';
      icon = '⭐';
    }

    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.35,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const topPadGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.08, 28);
    const topPadMat = new THREE.MeshStandardMaterial({
      color: innerColor,
      emissive,
      emissiveIntensity: 0.25,
      roughness: 0.3,
      metalness: 0.2,
    });
    const topPad = new THREE.Mesh(topPadGeo, topPadMat);
    topPad.position.y = 0.23;
    mesh.add(topPad);

    const ringGeo = new THREE.TorusGeometry(1.5, 0.08, 12, 36);
    const ringMat = new THREE.MeshBasicMaterial({ color: rimColor });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    mesh.add(ring);

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 96;
    const ctx = labelCanvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(8, 12, 24, 0.9)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 80, 24);
    ctx.fill();

    ctx.strokeStyle = badgeBorder;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = badgeBorder;
    ctx.shadowBlur = 8;
    ctx.fillText(`${icon} ${badgeText}`, 128, 48);

    const tex = new THREE.CanvasTexture(labelCanvas);
    const iconMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const iconSprite = new THREE.Sprite(iconMat);
    iconSprite.position.set(0, 0.88, 0);
    iconSprite.scale.set(1.85, 0.7, 1);
    mesh.add(iconSprite);

    return mesh;
  }

  private createPathConnections() {
    const count = this.tiles.length;
    for (let i = 0; i < count - 1; i++) {
      const p1 = this.tiles[i].position;
      const p2 = this.tiles[i + 1].position;

      const curve = new THREE.LineCurve3(
        new THREE.Vector3(p1.x, p1.y + 0.08, p1.z),
        new THREE.Vector3(p2.x, p2.y + 0.08, p2.z)
      );

      const tubeGeo = new THREE.TubeGeometry(curve, 8, 0.12, 6, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xffeaa7,
        emissive: 0xfdcb6e,
        emissiveIntensity: 0.55,
        roughness: 0.25,
      });

      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      this.boardGroup.add(tube);
    }
  }

  private createDice() {
    this.diceCanvas = document.createElement('canvas');
    this.diceCanvas.width = 512;
    this.diceCanvas.height = 512;
    this.diceCtx = this.diceCanvas.getContext('2d')!;

    this.diceTexture = new THREE.CanvasTexture(this.diceCanvas);
    this.diceTexture.needsUpdate = true;

    this.diceMesh = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      map: this.diceTexture,
      roughness: 0.15,
      metalness: 0.1,
    });

    const boxGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
    const mats = [mat, mat, mat, mat, mat, mat];
    this.diceCube = new THREE.Mesh(boxGeo, mats);
    this.diceCube.name = 'diceCube';
    this.diceCube.castShadow = true;
    this.diceMesh.add(this.diceCube);

    const glowGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd32a,
      transparent: true,
      opacity: 0.18,
    });
    this.diceMesh.add(new THREE.Mesh(glowGeo, glowMat));

    const light = new THREE.PointLight(0xffd32a, 3.0, 8);
    this.diceMesh.add(light);

    this.drawDiceFace(1);
    this.diceMesh.position.set(0, 5, 0);
    this.diceMesh.visible = false;
    this.boardGroup.add(this.diceMesh);
  }

  private drawDiceFace(num: number) {
    const ctx = this.diceCtx;
    const w = 512;
    const h = 512;

    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w / 2);
    grad.addColorStop(0, '#ffe24a');
    grad.addColorStop(0.6, '#ff9f1a');
    grad.addColorStop(1, '#c97000');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(12, 12, w - 24, h - 24, 80);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.roundRect(12, 12, w - 24, h - 24, 80);
    ctx.stroke();

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 148, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffd32a';
    ctx.lineWidth = 12;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const size = num >= 10 ? 180 : 220;
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 20;
    ctx.fillText(num.toString(), w / 2, h / 2 + 8);
    ctx.strokeText(num.toString(), w / 2, h / 2 + 8);
    ctx.shadowBlur = 0;

    this.diceTexture.needsUpdate = true;
  }

  public showDiceAt(pos: Vector3D) {
    this.baseDiceY = pos.y + 3.8;
    this.diceMesh.position.set(pos.x, this.baseDiceY, pos.z);
    this.diceMesh.scale.set(1, 1, 1);
    this.diceMesh.rotation.set(0, 0, 0);
    this.diceMesh.visible = true;
    this.startCycling();
  }

  public hideDice() {
    this.stopCycling();
    if (this.diceMesh) {
      this.diceMesh.visible = false;
    }
  }

  private startCycling() {
    this.stopCycling();
    this.isRolling = true;
    this.currentDiceValue = 1;
    this.drawDiceFace(1);

    this.rollTimer = setInterval(() => {
      if (!this.isRolling || !this.diceMesh || !this.diceMesh.visible) {
        this.stopCycling();
        return;
      }
      this.currentDiceValue = (this.currentDiceValue % 9) + 1;
      this.drawDiceFace(this.currentDiceValue);
      if (this.onDiceTick && this.isRolling && this.diceMesh.visible) {
        this.onDiceTick(this.currentDiceValue);
      }
    }, 100);
  }

  public stopCycling() {
    this.isRolling = false;
    if (this.rollTimer) {
      clearInterval(this.rollTimer);
      this.rollTimer = null;
    }
  }

  public hitDice(): number {
    this.stopCycling();
    const finalVal = this.currentDiceValue;
    this.drawDiceFace(finalVal);

    this.hitAnimTimer = 0.5;
    this.diceMesh.position.y = this.baseDiceY + 1.0;
    this.diceMesh.scale.set(1.4, 0.65, 1.4);

    return finalVal;
  }

  public isCurrentlyRolling(): boolean {
    return this.isRolling;
  }

  public update(delta: number) {
    if (!this.diceMesh.visible) return;

    if (this.hitAnimTimer > 0) {
      this.hitAnimTimer -= delta;
      this.diceMesh.position.y = THREE.MathUtils.lerp(this.diceMesh.position.y, this.baseDiceY, delta * 9);
      this.diceMesh.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 9);
      this.diceMesh.rotation.y += delta * 14;
    } else if (this.isRolling) {
      this.diceMesh.rotation.y += delta * 3.0;
      this.diceMesh.rotation.x = Math.sin(Date.now() * 0.004) * 0.18;
      this.diceMesh.position.y = this.baseDiceY + Math.sin(Date.now() * 0.007) * 0.22;
    } else {
      this.diceMesh.rotation.y += delta * 0.8;
      this.diceMesh.position.y = this.baseDiceY + Math.sin(Date.now() * 0.003) * 0.1;
    }
  }

  public getTile(index: number): BoardTile {
    return this.tiles[index % this.tiles.length];
  }

  public updateDiceNumber(num: number) {
    this.currentDiceValue = num;
    this.drawDiceFace(num);
  }
}
