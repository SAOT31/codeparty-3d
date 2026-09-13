import * as THREE from 'three';
import { BaseCharacter } from './base.character';

export class MushroomCharacter extends BaseCharacter {
  private capMesh!: THREE.Mesh;
  private dots: THREE.Mesh[] = [];

  constructor(colorHex: string) {
    super(colorHex);
    this.build();
  }

  private build() {
    const color = new THREE.Color(this.colorHex);

    const bodyGeo = new THREE.SphereGeometry(0.65, 20, 20);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xfff5e4,
      roughness: 0.6,
      metalness: 0.0,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.y = 0.85;
    this.bodyMeshes.push(body);
    this.mesh.add(body);

    [-0.25, 0.25].forEach(x => {
      const footGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.2, 10);
      const footMat = new THREE.MeshStandardMaterial({ color: 0xfff5e4, roughness: 0.8 });
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(x, -0.65, 0.05);
      this.mesh.add(foot);
    });

    this.buildEyes(0.1, 0.55, 0.24);

    const capGeo = new THREE.SphereGeometry(0.7, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      roughness: 0.35,
      metalness: 0.1,
    });
    this.capMesh = new THREE.Mesh(capGeo, capMat);
    this.capMesh.position.y = 0.3;
    this.bodyMeshes.push(this.capMesh);
    this.mesh.add(this.capMesh);

    const brimGeo = new THREE.TorusGeometry(0.72, 0.1, 8, 24);
    const brimMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
    const brim = new THREE.Mesh(brimGeo, brimMat);
    brim.position.y = 0.3;
    brim.rotation.x = Math.PI / 2;
    this.mesh.add(brim);

    const dotPositions = [
      { x: 0, z: 0.4 }, { x: -0.35, z: 0.15 }, { x: 0.35, z: 0.15 },
      { x: -0.2, z: -0.3 }, { x: 0.2, z: -0.3 },
    ];
    dotPositions.forEach(dp => {
      const dotGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      const r = 0.62;
      dot.position.set(dp.x * r, 0.55 + Math.sqrt(Math.max(0, r * r - dp.x * dp.x - dp.z * dp.z * r * r * 0.3)), dp.z * r * 0.7);
      this.dots.push(dot);
      this.mesh.add(dot);
    });

    this.buildStarPropulsion();
  }

  override animate(delta: number) {
    super.animate(delta);
    this.capMesh.position.y = 0.35 + Math.abs(Math.sin(Date.now() * 0.003)) * 0.04;
    this.capMesh.rotation.y += delta * 0.3;
  }
}