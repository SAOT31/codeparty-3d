import * as THREE from 'three';

export class IslaArcoirisScenario {
  static build(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x70cfff);
    scene.fog = new THREE.FogExp2(0xa0e0ff, 0.005);

    const baseGeo = new THREE.BoxGeometry(64, 3.2, 52);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xe5c287,
      roughness: 0.9,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -1.6;
    base.receiveShadow = true;
    scene.add(base);

    const plateauGeo = new THREE.BoxGeometry(58, 0.8, 46);
    const plateauMat = new THREE.MeshStandardMaterial({
      color: 0x55bb44,
      roughness: 0.75,
    });
    const plateau = new THREE.Mesh(plateauGeo, plateauMat);
    plateau.position.y = 0.2;
    plateau.receiveShadow = true;
    scene.add(plateau);

    const lagoonGeo = new THREE.BoxGeometry(20, 0.25, 10);
    const lagoonMat = new THREE.MeshStandardMaterial({
      color: 0x00a8cc,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.88,
    });
    const lagoon = new THREE.Mesh(lagoonGeo, lagoonMat);
    lagoon.position.set(0, 0.45, 0);
    scene.add(lagoon);

    const bridgeGeo = new THREE.BoxGeometry(4.5, 0.3, 11);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, 0.7, 0);
    scene.add(bridge);

    const seaGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x0088cc,
      roughness: 0.15,
      metalness: 0.25,
      transparent: true,
      opacity: 0.85,
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -2.2;
    scene.add(sea);

    this.buildLighthouse(scene, 26, -18);
    this.buildCabana(scene, -25, 6, 0.4);
    this.buildCabana(scene, 25, 6, -0.4);

    const palmPositions = [
      { x: -26, z: -18 }, { x: -26, z: 18 },
      { x: 26, z: 18 },   { x: 26, z: -10 },
      { x: -27, z: -8 },  { x: 27, z: -2 },
      { x: 0, z: -21 },   { x: 0, z: 21 },
    ];
    palmPositions.forEach(p => this.buildPalm(scene, p.x, p.z));

    const arcColors = [0xff4757, 0xffa502, 0xffd700, 0x2ed573, 0x1e90ff, 0x9b59b6];
    arcColors.forEach((c, i) => {
      const arcGeo = new THREE.TorusGeometry(42 + i * 1.3, 0.4, 10, 60, Math.PI);
      const arcMat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8 });
      const arc = new THREE.Mesh(arcGeo, arcMat);
      arc.position.set(0, 16, -45);
      scene.add(arc);
    });

    const cloudPos = [
      { x: 36, y: 20, z: 14 }, { x: -38, y: 18, z: -15 },
      { x: 14, y: 22, z: -36 }, { x: -28, y: 19, z: 30 },
      { x: 32, y: 21, z: -25 },
    ];
    cloudPos.forEach(p => this.buildCloud(scene, p.x, p.y, p.z));

    scene.add(new THREE.AmbientLight(0xfffae8, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(40, 60, 40);
    sun.castShadow = true;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x70cfff, 0.8);
    fill.position.set(-40, 25, -40);
    scene.add(fill);

    this.buildParticles(scene);
  }

  private static buildLighthouse(scene: THREE.Scene, x: number, z: number) {
    const towerGeo = new THREE.CylinderGeometry(1.6, 2.4, 9, 16);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(x, 4.5, z);
    scene.add(tower);

    const stripeGeo = new THREE.CylinderGeometry(1.85, 2.05, 2.2, 16);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.5 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(x, 4.5, z);
    scene.add(stripe);

    const lampGeo = new THREE.CylinderGeometry(1.3, 1.3, 1.8, 12);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(x, 9.6, z);
    scene.add(lamp);

    const roofGeo = new THREE.ConeGeometry(1.8, 1.8, 12);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(x, 11.2, z);
    scene.add(roof);

    const light = new THREE.PointLight(0xfffa65, 4.0, 25);
    light.position.set(x, 10, z);
    scene.add(light);
  }

  private static buildCabana(scene: THREE.Scene, x: number, z: number, rotY: number) {
    const house = new THREE.Group();

    const wallsGeo = new THREE.BoxGeometry(4.2, 3.0, 3.8);
    const wallsMat = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.8 });
    const walls = new THREE.Mesh(wallsGeo, wallsMat);
    walls.position.y = 1.5;
    house.add(walls);

    const roofGeo = new THREE.ConeGeometry(3.6, 2.2, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.9 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.8;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);

    const doorGeo = new THREE.PlaneGeometry(1.2, 2.0);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x3d2314 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.0, 1.91);
    house.add(door);

    house.position.set(x, 0.4, z);
    house.rotation.y = rotY;
    scene.add(house);
  }

  private static buildPalm(scene: THREE.Scene, x: number, z: number) {
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.48, 6.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x825a2c, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 3.4, z);
    trunk.rotation.z = (Math.random() - 0.5) * 0.22;
    trunk.rotation.x = (Math.random() - 0.5) * 0.22;
    scene.add(trunk);

    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const leafGeo = new THREE.ConeGeometry(0.95, 2.8, 4);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.7 });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(x + Math.cos(angle) * 2.0, 6.7, z + Math.sin(angle) * 2.0);
      leaf.rotation.z = Math.cos(angle) * 0.95;
      leaf.rotation.x = Math.sin(angle) * 0.95;
      scene.add(leaf);
    }
  }

  private static buildCloud(scene: THREE.Scene, x: number, y: number, z: number) {
    const parts = [
      { ox: 0, oy: 0, oz: 0, r: 3.2 },
      { ox: 3.0, oy: -0.5, oz: 0, r: 2.3 },
      { ox: -3.0, oy: -0.5, oz: 0, r: 2.2 },
      { ox: 1.3, oy: 1.1, oz: 0, r: 2.0 },
    ];
    parts.forEach(p => {
      const geo = new THREE.SphereGeometry(p.r, 10, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 });
      const cloud = new THREE.Mesh(geo, mat);
      cloud.position.set(x + p.ox, y + p.oy, z + p.oz);
      scene.add(cloud);
    });
  }

  private static buildParticles(scene: THREE.Scene) {
    const count = 220;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [[1, 0.9, 0.4], [0.4, 1, 0.6], [0.4, 0.8, 1], [1, 0.6, 0.8]];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 75;
      pos[i * 3 + 1] = Math.random() * 20 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 75;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.24, vertexColors: true, transparent: true, opacity: 0.85 });
    scene.add(new THREE.Points(geo, mat));
  }
}