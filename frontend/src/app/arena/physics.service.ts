import * as THREE from 'three';

export class PhysicsService {
  public velocity = new THREE.Vector3();
  public rotationY = 0;
  private readonly maxSpeedNormal = 12;
  private readonly maxSpeedBoost = 22;
  private readonly acceleration = 30;
  private readonly friction = 4.5;
  private readonly arenaLimit = 28;

  update(
    droneMesh: THREE.Group,
    input: { forward: boolean; backward: boolean; left: boolean; right: boolean; up: boolean; down: boolean },
    boostActive: boolean,
    delta: number,
  ): void {
    const maxSpeed = boostActive ? this.maxSpeedBoost : this.maxSpeedNormal;

    if (input.left) {
      this.rotationY += delta * 3.2;
    }
    if (input.right) {
      this.rotationY -= delta * 3.2;
    }
    droneMesh.rotation.y = this.rotationY + Math.PI;

    const forwardDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
    const accelVector = new THREE.Vector3();

    if (input.forward) {
      accelVector.add(forwardDir.clone().multiplyScalar(this.acceleration));
    }
    if (input.backward) {
      accelVector.add(forwardDir.clone().multiplyScalar(-this.acceleration * 0.7));
    }

    if (input.up) {
      accelVector.y += this.acceleration * 0.8;
    }
    if (input.down) {
      accelVector.y -= this.acceleration * 0.8;
    }

    this.velocity.add(accelVector.multiplyScalar(delta));

    this.velocity.x *= Math.max(0, 1 - this.friction * delta);
    this.velocity.y *= Math.max(0, 1 - this.friction * delta);
    this.velocity.z *= Math.max(0, 1 - this.friction * delta);

    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    if (horizontalSpeed > maxSpeed) {
      const scale = maxSpeed / horizontalSpeed;
      this.velocity.x *= scale;
      this.velocity.z *= scale;
    }

    droneMesh.position.add(this.velocity.clone().multiplyScalar(delta));

    droneMesh.position.x = Math.max(-this.arenaLimit, Math.min(this.arenaLimit, droneMesh.position.x));
    droneMesh.position.z = Math.max(-this.arenaLimit, Math.min(this.arenaLimit, droneMesh.position.z));
    droneMesh.position.y = Math.max(0.6, Math.min(14, droneMesh.position.y));

    const targetTiltZ = input.left ? 0.25 : input.right ? -0.25 : 0;
    const targetTiltX = input.forward ? 0.3 : input.backward ? -0.2 : 0;
    droneMesh.rotation.z = THREE.MathUtils.lerp(droneMesh.rotation.z, targetTiltZ, delta * 8);
    droneMesh.rotation.x = THREE.MathUtils.lerp(droneMesh.rotation.x, targetTiltX, delta * 8);
  }
}