import * as THREE from 'three';
import { BaseCharacter } from './base.character';

export class RocketCharacter extends BaseCharacter {
  private flameParticles!: THREE.Points;
  private flamePositions!: Float32Array;
  private flameColors!: Float32Array;

  constructor(colorHex: string) {
    super(colorHex);
    this.build();
  }

  private build() {
    const color = new THREE.Color(this.colorHex);

    const bodyGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.4, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.6,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMeshes.push(body);
    this.mesh.add(body);

    const noseGeo = new THREE.ConeGeometry(0.45, 0.7, 12);
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.5,
    });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.y = 1.05;
    this.mesh.add(nose);

    const windowGeo = new THREE.CircleGeometry(0.28, 16);
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x88ddff,
      emissive: 0x44aaff,
      emissiveIntensity: 0.5,
      roughness: 0.1,
    });
    const window3d = new THREE.Mesh(windowGeo, windowMat);
    window3d.position.set(0, 0.25, 0.46);
    this.mesh.add(window3d);

    this.buildEyes(0.27, 0.47, 0.12);

    for (let i = 0; i < 3; i++) {
      const rad = (i / 3) * Math.PI * 2;
      const aletaShape = new THREE.Shape();
      aletaShape.moveTo(0, 0);
      aletaShape.lineTo(0.5, -0.5);
      aletaShape.lineTo(0, -0.5);
      aletaShape.closePath();
      const extrudeSettings = { depth: 0.06, bevelEnabled: false };
      const aletaGeo = new THREE.ExtrudeGeometry(aletaShape, extrudeSettings);
      const aletaMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.4 });
      const aleta = new THREE.Mesh(aletaGeo, aletaMat);
      aleta.position.set(Math.cos(rad) * 0.42, -0.55, Math.sin(rad) * 0.42);
      aleta.rotation.y = -rad;
      aleta.rotation.z = Math.PI;
      this.mesh.add(aleta);
    }

    this.buildFlames();
    this.buildStarPropulsion();
  }

  private buildFlames() {
    const count = 40;
    this.flamePositions = new Float32Array(count * 3);
    this.flameColors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      this.resetFlameParticle(i);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.flamePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.flameColors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    this.flameParticles = new THREE.Points(geo, mat);
    this.mesh.add(this.flameParticles);
  }

  private resetFlameParticle(i: number) {
    this.flamePositions[i * 3]     = (Math.random() - 0.5) * 0.35;
    this.flamePositions[i * 3 + 1] = -0.7 - Math.random() * 0.5;
    this.flamePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.35;

    const t = Math.random();
    if (t < 0.4) {
      this.flameColors[i * 3] = 1.0; this.flameColors[i * 3 + 1] = 0.2; this.flameColors[i * 3 + 2] = 0.0;
    } else if (t < 0.7) {
      this.flameColors[i * 3] = 1.0; this.flameColors[i * 3 + 1] = 0.65; this.flameColors[i * 3 + 2] = 0.0;
    } else {
      this.flameColors[i * 3] = 1.0; this.flameColors[i * 3 + 1] = 0.95; this.flameColors[i * 3 + 2] = 0.5;
    }
  }

  override animate(delta: number) {
    super.animate(delta);

    if (this.flameParticles) {
      const pos = this.flameParticles.geometry.attributes['position'].array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= delta * (1.5 + Math.random());
        pos[i * 3]     += (Math.random() - 0.5) * 0.02;
        pos[i * 3 + 2] += (Math.random() - 0.5) * 0.02;
        if (pos[i * 3 + 1] < -1.8) {
          this.resetFlameParticle(i);
          pos[i * 3]     = this.flamePositions[i * 3];
          pos[i * 3 + 1] = this.flamePositions[i * 3 + 1];
          pos[i * 3 + 2] = this.flamePositions[i * 3 + 2];
        }
      }
      this.flameParticles.geometry.attributes['position'].needsUpdate = true;
    }

    this.mesh.rotation.z = Math.sin(Date.now() * 0.005) * 0.04;
  }
}