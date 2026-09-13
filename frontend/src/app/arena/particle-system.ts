import * as THREE from 'three';

export class ParticleSystem {
  static createExplosion(scene: THREE.Scene, position: THREE.Vector3, colorHex: number = 0xff003c): void {
    const count = 35;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6 + 1.5,
          (Math.random() - 0.5) * 6,
        ),
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      size: 0.25,
      color: colorHex,
      transparent: true,
      opacity: 1.0,
    });

    const pSystem = new THREE.Points(geometry, material);
    scene.add(pSystem);

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 0.03;
      const posArray = geometry.attributes['position'].array as Float32Array;

      for (let i = 0; i < count; i++) {
        posArray[i * 3] += velocities[i].x * 0.03;
        posArray[i * 3 + 1] += velocities[i].y * 0.03;
        posArray[i * 3 + 2] += velocities[i].z * 0.03;
      }
      geometry.attributes['position'].needsUpdate = true;
      material.opacity = Math.max(0, 1.0 - elapsed * 2);

      if (elapsed >= 0.5) {
        clearInterval(interval);
        scene.remove(pSystem);
        geometry.dispose();
        material.dispose();
      }
    }, 30);
  }
}