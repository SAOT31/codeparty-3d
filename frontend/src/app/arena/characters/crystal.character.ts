import * as THREE from 'three';
import { BaseCharacter } from './base.character';

export class CrystalCharacter extends BaseCharacter {
  private innerGlow!: THREE.Mesh;
  private facets: THREE.Mesh[] = [];

  constructor(colorHex: string) {
    super(colorHex);
    this.build();
  }

  private build() {
    const color = new THREE.Color(this.colorHex);

    const bodyGeo = new THREE.OctahedronGeometry(0.85, 0);
    bodyGeo.scale(1, 1.3, 1);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.15,
      roughness: 0.0,
      metalness: 0.1,
      transmission: 0.6,
      transparent: true,
      opacity: 0.82,
      thickness: 1.5,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMeshes.push(body);
    this.mesh.add(body);

    const innerGeo = new THREE.OctahedronGeometry(0.38, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });
    this.innerGlow = new THREE.Mesh(innerGeo, innerMat);
    this.innerGlow.scale.y = 1.3;
    this.mesh.add(this.innerGlow);

    const facetAngles = [0, 72, 144, 216, 288];
    facetAngles.forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      const facetGeo = new THREE.OctahedronGeometry(0.18, 0);
      const facetMat = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.0,
        transparent: true,
        opacity: 0.7,
      });
      const facet = new THREE.Mesh(facetGeo, facetMat);
      facet.position.set(Math.cos(rad) * 0.95, -0.1, Math.sin(rad) * 0.95);
      facet.rotation.set(Math.random(), Math.random(), Math.random());
      this.facets.push(facet);
      this.mesh.add(facet);
    });

    this.buildEyes(0.35, 0.65, 0.2);
    this.buildStarPropulsion();
  }

  override animate(delta: number) {
    super.animate(delta);
    const pulse = 0.7 + Math.sin(Date.now() * 0.004) * 0.3;
    (this.innerGlow.material as THREE.MeshBasicMaterial).opacity = pulse;
    this.innerGlow.scale.setScalar(pulse * 0.9);

    this.mesh.rotation.y += delta * 0.5;

    const t = Date.now() * 0.0008;
    this.facets.forEach((f, i) => {
      const angle = t + (i / this.facets.length) * Math.PI * 2;
      f.position.set(Math.cos(angle) * 0.95, -0.1 + Math.sin(t * 2 + i) * 0.1, Math.sin(angle) * 0.95);
      f.rotation.y += delta * 2;
    });
  }
}