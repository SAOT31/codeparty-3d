import * as THREE from 'three';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private isBoardMode = true;
  private zoomLevel = 1.0;
  private targetZoom = 1.0;
  private orbitAngleY = 0;
  private targetOrbitAngleY = 0;
  private orbitAngleX = 0;
  private targetOrbitAngleX = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  setBoardMode(enabled: boolean) {
    this.isBoardMode = enabled;
  }

  setZoom(zoom: number) {
    this.targetZoom = THREE.MathUtils.clamp(zoom, 0.45, 2.6);
  }

  adjustZoom(delta: number) {
    this.setZoom(this.targetZoom + delta);
  }

  getZoom(): number {
    return this.targetZoom;
  }

  rotateOrbit(deltaY: number, deltaX: number = 0) {
    this.targetOrbitAngleY += deltaY;
    this.targetOrbitAngleX = THREE.MathUtils.clamp(this.targetOrbitAngleX + deltaX, -0.4, 0.5);
  }

  resetView() {
    this.targetOrbitAngleY = 0;
    this.targetOrbitAngleX = 0;
    this.targetZoom = 1.0;
  }

  update(focusPos: THREE.Vector3, rotY: number, delta: number) {
    this.zoomLevel = THREE.MathUtils.lerp(this.zoomLevel, this.targetZoom, Math.min(1, delta * 6));
    this.orbitAngleY = THREE.MathUtils.lerp(this.orbitAngleY, this.targetOrbitAngleY, Math.min(1, delta * 8));
    this.orbitAngleX = THREE.MathUtils.lerp(this.orbitAngleX, this.targetOrbitAngleX, Math.min(1, delta * 8));

    if (this.isBoardMode) {
      const baseY = (24 + this.orbitAngleX * 16) * this.zoomLevel;
      const baseDist = 28 * this.zoomLevel;
      const offset = new THREE.Vector3(
        Math.sin(this.orbitAngleY) * baseDist,
        baseY,
        Math.cos(this.orbitAngleY) * baseDist
      );

      const targetPos = focusPos.clone().add(offset);
      this.camera.position.lerp(targetPos, Math.min(1, delta * 6));

      if (this.shakeTimer > 0) {
        this.shakeTimer -= delta;
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      }

      const lookTarget = focusPos.clone().add(new THREE.Vector3(0, 0.5, -1.0));
      this.camera.lookAt(lookTarget);
      return;
    }

    const offset = new THREE.Vector3(0, 4.2 * this.zoomLevel, 8.5 * this.zoomLevel);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY + this.orbitAngleY);

    const targetPos = focusPos.clone().add(offset);
    this.camera.position.lerp(targetPos, Math.min(1, delta * 6));

    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
    }

    const lookTarget = focusPos.clone().add(new THREE.Vector3(0, 0.8, 0));
    this.camera.lookAt(lookTarget);
  }

  triggerShake(intensity: number = 0.4, duration: number = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }
}