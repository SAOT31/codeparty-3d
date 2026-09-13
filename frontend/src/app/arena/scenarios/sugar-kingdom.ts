import * as THREE from 'three';

export class SugarKingdomScenario {
  static build(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0xffd5e2);
    scene.fog = new THREE.FogExp2(0xffe8f0, 0.005);

    const baseGeo = new THREE.BoxGeometry(64, 3.2, 52);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xfff0f5,
      roughness: 0.7,
      metalness: 0.05,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -1.6;
    base.receiveShadow = true;
    scene.add(base);

    const waferPlateauGeo = new THREE.BoxGeometry(58, 0.8, 46);
    const waferPlateauMat = new THREE.MeshStandardMaterial({
      color: 0xffc2d1,
      roughness: 0.6,
    });
    const waferPlateau = new THREE.Mesh(waferPlateauGeo, waferPlateauMat);
    waferPlateau.position.y = 0.2;
    waferPlateau.receiveShadow = true;
    scene.add(waferPlateau);

    const chocoRiverGeo = new THREE.BoxGeometry(16, 0.25, 36);
    const chocoRiverMat = new THREE.MeshStandardMaterial({
      color: 0x5a2d0c,
      roughness: 0.2,
      metalness: 0.35,
    });
    const chocoRiver = new THREE.Mesh(chocoRiverGeo, chocoRiverMat);
    chocoRiver.position.set(0, 0.45, 0);
    scene.add(chocoRiver);

    const waferBridgeGeo = new THREE.BoxGeometry(18, 0.35, 4.5);
    const waferBridgeMat = new THREE.MeshStandardMaterial({ color: 0xd2a679, roughness: 0.8 });
    const waferBridge = new THREE.Mesh(waferBridgeGeo, waferBridgeMat);
    waferBridge.position.set(0, 0.7, 0);
    scene.add(waferBridge);

    const chocoLakeGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    const chocoLakeMat = new THREE.MeshStandardMaterial({
      color: 0x4a2206,
      roughness: 0.2,
      metalness: 0.35,
    });
    const chocoLake = new THREE.Mesh(chocoLakeGeo, chocoLakeMat);
    chocoLake.rotation.x = -Math.PI / 2;
    chocoLake.position.y = -2.2;
    scene.add(chocoLake);

    this.buildGingerbreadHouse(scene, 25, -18);
    this.buildGingerbreadHouse(scene, -25, 18);

    const lollipops = [
      { x: 26, z: 16, color: 0xff4757 },
      { x: -26, z: 16, color: 0x2ed573 },
      { x: 26, z: -16, color: 0x1e90ff },
      { x: -26, z: -16, color: 0xffa502 },
      { x: -28, z: 0, color: 0x9b59b6 },
      { x: 28, z: 0, color: 0xff6b81 },
    ];
    lollipops.forEach(p => this.buildLollipop(scene, p.x, p.z, p.color));

    const candyCanes = [
      { x: 12, z: -22 }, { x: -12, z: -22 },
      { x: 12, z: 22 },  { x: -12, z: 22 },
    ];
    candyCanes.forEach(c => this.buildCandyCane(scene, c.x, c.z));

    const marshmallowClouds = [
      { x: 36, y: 19, z: 14 },
      { x: -38, y: 17, z: -16 },
      { x: 12, y: 21, z: -36 },
      { x: -26, y: 20, z: 30 },
    ];
    marshmallowClouds.forEach(m => this.buildMarshmallow(scene, m.x, m.y, m.z));

    scene.add(new THREE.AmbientLight(0xfff5fa, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(35, 55, 35);
    sun.castShadow = true;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xffb8c6, 0.8);
    fill.position.set(-35, 25, -35);
    scene.add(fill);

    this.buildSugarSparkles(scene);
  }

  private static buildGingerbreadHouse(scene: THREE.Scene, x: number, z: number) {
    const house = new THREE.Group();

    const wallsGeo = new THREE.BoxGeometry(4.4, 3.2, 4.0);
    const wallsMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    const walls = new THREE.Mesh(wallsGeo, wallsMat);
    walls.position.y = 1.6;
    house.add(walls);

    const roofGeo = new THREE.ConeGeometry(3.8, 2.4, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 4.0;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);

    const gumdropGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const gumdropMat = new THREE.MeshStandardMaterial({ color: 0xff3838, roughness: 0.2 });
    const gumdrop = new THREE.Mesh(gumdropGeo, gumdropMat);
    gumdrop.position.set(0, 5.2, 0);
    house.add(gumdrop);

    house.position.set(x, 0.4, z);
    scene.add(house);
  }

  private static buildLollipop(scene: THREE.Scene, x: number, z: number, color: number) {
    const stickGeo = new THREE.CylinderGeometry(0.2, 0.2, 6.2, 12);
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const stick = new THREE.Mesh(stickGeo, stickMat);
    stick.position.set(x, 3.1, z);
    scene.add(stick);

    const discGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.45, 24);
    const discMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.25,
      roughness: 0.2,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.set(x, 6.2, z);
    disc.rotation.x = Math.PI / 2;
    disc.rotation.z = Math.random() * Math.PI;
    scene.add(disc);

    const swirlGeo = new THREE.TorusGeometry(0.85, 0.15, 8, 24);
    const swirlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const swirl = new THREE.Mesh(swirlGeo, swirlMat);
    swirl.position.set(x, 6.2, z);
    swirl.rotation.x = Math.PI / 2;
    scene.add(swirl);
  }

  private static buildCandyCane(scene: THREE.Scene, x: number, z: number) {
    const stemGeo = new THREE.CylinderGeometry(0.22, 0.22, 5.2, 12);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xff2d55, roughness: 0.3 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(x, 2.6, z);
    scene.add(stem);

    const hookGeo = new THREE.TorusGeometry(0.8, 0.22, 8, 20, Math.PI);
    const hookMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const hook = new THREE.Mesh(hookGeo, hookMat);
    hook.position.set(x + 0.8, 5.2, z);
    hook.rotation.z = Math.PI;
    scene.add(hook);
  }

  private static buildMarshmallow(scene: THREE.Scene, x: number, y: number, z: number) {
    const geo = new THREE.CylinderGeometry(2.2, 2.2, 2.4, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.95 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.z = Math.PI / 4;
    scene.add(m);
  }

  private static buildSugarSparkles(scene: THREE.Scene) {
    const count = 220;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [[1, 0.5, 0.7], [0.5, 1, 0.8], [1, 0.8, 0.4], [0.7, 0.5, 1]];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 75;
      pos[i * 3 + 1] = Math.random() * 18 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 75;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.24, vertexColors: true, transparent: true, opacity: 0.9 });
    scene.add(new THREE.Points(geo, mat));
  }
}
