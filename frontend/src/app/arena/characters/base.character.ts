import * as THREE from 'three';

export abstract class BaseCharacter {
  public mesh: THREE.Group;
  public glowLight: THREE.PointLight;
  public shieldSphere: THREE.Mesh;
  public shieldRing: THREE.Mesh;
  public colorHex: string;

  protected eyeLeft!: THREE.Mesh;
  protected eyeRight!: THREE.Mesh;
  protected pupilLeft!: THREE.Mesh;
  protected pupilRight!: THREE.Mesh;
  protected starParticles!: THREE.Points;
  protected starPositions!: Float32Array;
  protected bodyMeshes: THREE.Mesh[] = [];

  private shakeTime = 0;
  private originalPosition = new THREE.Vector3();
  private isShieldActive = false;
  private shieldPulseTime = 0;

  private overheadSprite: THREE.Sprite;
  private overheadCanvas: HTMLCanvasElement;
  private overheadCtx: CanvasRenderingContext2D;
  private overheadTexture: THREE.CanvasTexture;
  private currentNickname = '';
  private currentHealth = 100;
  private maxHealth = 100;

  constructor(colorHex: string) {
    this.colorHex = colorHex || '#FFD700';
    this.mesh = new THREE.Group();

    this.glowLight = new THREE.PointLight(new THREE.Color(colorHex), 2.5, 6);
    this.glowLight.position.set(0, -0.5, 0);
    this.mesh.add(this.glowLight);

    const shieldGeo = new THREE.SphereGeometry(1.8, 24, 24);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.0,
      wireframe: false,
      side: THREE.DoubleSide,
    });
    this.shieldSphere = new THREE.Mesh(shieldGeo, shieldMat);
    this.mesh.add(this.shieldSphere);

    const ringGeo = new THREE.TorusGeometry(1.85, 0.06, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x88eeff,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
    });
    this.shieldRing = new THREE.Mesh(ringGeo, ringMat);
    this.mesh.add(this.shieldRing);

    this.overheadCanvas = document.createElement('canvas');
    this.overheadCanvas.width = 256;
    this.overheadCanvas.height = 64;
    this.overheadCtx = this.overheadCanvas.getContext('2d')!;
    this.overheadTexture = new THREE.CanvasTexture(this.overheadCanvas);
    this.overheadTexture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.overheadTexture,
      transparent: true,
      depthTest: false,
    });
    this.overheadSprite = new THREE.Sprite(spriteMat);
    this.overheadSprite.position.set(0, 1.8, 0);
    this.overheadSprite.scale.set(2.4, 0.6, 1);
    this.mesh.add(this.overheadSprite);

    this.updateHealthBar(100, 100, '');
  }

  public updateHealthBar(health: number, maxHealth: number = 100, nickname?: string) {
    this.updatePlayerBadge(nickname, health);
  }

  public updatePlayerBadge(nickname?: string, score: number = 0) {
    if (nickname !== undefined) this.currentNickname = nickname;

    const ctx = this.overheadCtx;
    const w = this.overheadCanvas.width;
    const h = this.overheadCanvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.currentNickname) {
      ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
      ctx.beginPath();
      ctx.roundRect(16, 4, w - 32, h - 8, 16);
      ctx.fill();

      ctx.strokeStyle = this.colorHex || '#FFD700';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.currentNickname, w / 2, 28);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`⭐ ${score} pts`, w / 2, 48);
    }

    this.overheadTexture.needsUpdate = true;
  }

  protected buildEyes(yPos: number, zPos: number, separation: number = 0.28) {
    const eyeGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const pupilGeo = new THREE.SphereGeometry(0.1, 10, 10);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

    this.eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeLeft.position.set(-separation, yPos, zPos);
    this.mesh.add(this.eyeLeft);

    this.eyeRight = new THREE.Mesh(eyeGeo, eyeMat.clone());
    this.eyeRight.position.set(separation, yPos, zPos);
    this.mesh.add(this.eyeRight);

    this.pupilLeft = new THREE.Mesh(pupilGeo, pupilMat);
    this.pupilLeft.position.set(-separation, yPos, zPos + 0.1);
    this.mesh.add(this.pupilLeft);

    this.pupilRight = new THREE.Mesh(pupilGeo, pupilMat.clone());
    this.pupilRight.position.set(separation, yPos, zPos + 0.1);
    this.mesh.add(this.pupilRight);
  }

  protected buildStarPropulsion() {
    const count = 25;
    this.starPositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      this.starPositions[i * 3]     = (Math.random() - 0.5) * 0.8;
      this.starPositions[i * 3 + 1] = -0.8 - Math.random() * 0.8;
      this.starPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      const c = new THREE.Color(this.colorHex);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.starPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    this.starParticles = new THREE.Points(geo, mat);
    this.mesh.add(this.starParticles);
  }

  private isJumping = false;
  private jumpProgress = 0;
  private jumpStartPos = new THREE.Vector3();
  private jumpTargetPos = new THREE.Vector3();
  private jumpOnComplete: (() => void) | null = null;
  public tileIndex = 0;

  public headbuttJump(onPeak?: () => void, onComplete?: () => void) {
    const startPos = this.mesh.position.clone();
    const peakPos = startPos.clone();
    peakPos.y += 2.0;
    this.jumpTo(peakPos, () => {
      if (onPeak) onPeak();
      this.jumpTo(startPos, () => {
        if (onComplete) onComplete();
      });
    });
  }

  public jumpTo(target: THREE.Vector3, onComplete?: () => void) {
    this.isJumping = true;
    this.jumpProgress = 0;
    this.jumpStartPos.copy(this.mesh.position);
    this.jumpTargetPos.copy(target);
    this.jumpOnComplete = onComplete || null;
  }

  animate(delta: number) {
    if (this.isJumping) {
      this.jumpProgress += delta * 2.8;
      const t = Math.min(1, this.jumpProgress);
      this.mesh.position.x = THREE.MathUtils.lerp(this.jumpStartPos.x, this.jumpTargetPos.x, t);
      this.mesh.position.z = THREE.MathUtils.lerp(this.jumpStartPos.z, this.jumpTargetPos.z, t);
      const arc = Math.sin(t * Math.PI) * 1.8;
      this.mesh.position.y = THREE.MathUtils.lerp(this.jumpStartPos.y, this.jumpTargetPos.y, t) + arc;

      const dx = this.jumpTargetPos.x - this.jumpStartPos.x;
      const dz = this.jumpTargetPos.z - this.jumpStartPos.z;
      if (dx !== 0 || dz !== 0) {
        this.mesh.rotation.y = Math.atan2(dx, dz);
      }

      if (this.jumpProgress >= 1) {
        this.isJumping = false;
        this.mesh.position.copy(this.jumpTargetPos);
        if (this.jumpOnComplete) {
          const cb = this.jumpOnComplete;
          this.jumpOnComplete = null;
          cb();
        }
      }
    }

    if (this.starParticles && this.starPositions) {
      const pos = this.starParticles.geometry.attributes['position'].array as Float32Array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= delta * (0.8 + Math.random() * 0.5);
        if (pos[i * 3 + 1] < -1.6) {
          pos[i * 3]     = (Math.random() - 0.5) * 0.8;
          pos[i * 3 + 1] = -0.8;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
        }
      }
      this.starParticles.geometry.attributes['position'].needsUpdate = true;
    }

    if (this.isShieldActive) {
      this.shieldPulseTime += delta * 4;
      const pulseScale = 1.0 + Math.sin(this.shieldPulseTime) * 0.08;
      this.shieldSphere.scale.set(pulseScale, pulseScale, pulseScale);
      this.shieldRing.scale.set(pulseScale, pulseScale, pulseScale);
      this.shieldRing.rotation.x += delta * 2.5;
      this.shieldRing.rotation.y += delta * 3.5;
      const sphereMat = this.shieldSphere.material as THREE.MeshBasicMaterial;
      sphereMat.opacity = 0.3 + Math.sin(this.shieldPulseTime * 2) * 0.12;
    }

    if (this.shakeTime > 0) {
      this.shakeTime -= delta;
      this.mesh.position.x = this.originalPosition.x + (Math.random() - 0.5) * 0.15;
      this.mesh.position.z = this.originalPosition.z + (Math.random() - 0.5) * 0.15;
      if (this.shakeTime <= 0) {
        this.mesh.position.copy(this.originalPosition);
      }
    }
  }

  setShieldActive(active: boolean) {
    this.isShieldActive = active;
    const sphereMat = this.shieldSphere.material as THREE.MeshBasicMaterial;
    const ringMat = this.shieldRing.material as THREE.MeshBasicMaterial;
    sphereMat.opacity = active ? 0.35 : 0.0;
    ringMat.opacity = active ? 0.75 : 0.0;
    sphereMat.needsUpdate = true;
    ringMat.needsUpdate = true;
    if (!active) {
      this.shieldSphere.scale.set(1, 1, 1);
      this.shieldRing.scale.set(1, 1, 1);
    }
  }

  flashDamage() {
    this.bodyMeshes.forEach(m => {
      const mat = m.material as THREE.MeshStandardMaterial;
      const orig = mat.color.getHex();
      mat.color.setHex(0xff1a1a);
      setTimeout(() => mat.color.setHex(orig), 300);
    });
    this.shakeTime = 0.3;
    this.originalPosition.copy(this.mesh.position);
  }
}