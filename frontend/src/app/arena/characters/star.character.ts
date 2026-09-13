import * as THREE from 'three';
import { BaseCharacter } from './base.character';

export class StarCharacter extends BaseCharacter {
  private spinners: THREE.Mesh[] = [];

  constructor(colorHex: string) {
    super(colorHex);
    this.build();
  }

  private build() {
    const color = new THREE.Color(this.colorHex);

    const bodyGeo = new THREE.SphereGeometry(0.7, 16, 16);
    bodyGeo.scale(1, 0.65, 1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMeshes.push(body);
    this.mesh.add(body);

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const puntaGeo = new THREE.ConeGeometry(0.22, 0.7, 8);
      const puntaMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });
      const punta = new THREE.Mesh(puntaGeo, puntaMat);
      punta.position.set(Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8);
      punta.rotation.z = -angle + Math.PI / 2;
      punta.rotation.x = Math.PI / 2;
      const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      punta.lookAt(punta.position.clone().add(dir));
      punta.rotateX(-Math.PI / 2);
      this.bodyMeshes.push(punta);
      this.mesh.add(punta);
    }

    this.buildEyes(0.18, 0.62, 0.22);

    for (let i = 0; i < 3; i++) {
      const spinGeo = new THREE.OctahedronGeometry(0.1, 0);
      const spinMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const spin = new THREE.Mesh(spinGeo, spinMat);
      spin.position.set(
        Math.cos((i / 3) * Math.PI * 2) * 1.1,
        0.3,
        Math.sin((i / 3) * Math.PI * 2) * 1.1,
      );
      this.spinners.push(spin);
      this.mesh.add(spin);
    }

    this.buildStarPropulsion();
  }

  override animate(delta: number) {
    super.animate(delta);
    const t = Date.now() * 0.001;
    this.spinners.forEach((s, i) => {
      const angle = t * 2 + (i / 3) * Math.PI * 2;
      s.position.set(Math.cos(angle) * 1.1, 0.3 + Math.sin(t * 3 + i) * 0.15, Math.sin(angle) * 1.1);
      s.rotation.y += delta * 5;
    });
  }
}