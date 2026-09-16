import * as THREE from 'three';

export class BosqueEncantadoScenario {
  static build(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x68d8d6);
    scene.fog = new THREE.FogExp2(0x99e2b4, 0.004);

    const baseGeo = new THREE.BoxGeometry(78, 3.2, 62);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.85,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -1.6;
    base.receiveShadow = true;
    scene.add(base);

    const meadowGeo = new THREE.BoxGeometry(72, 0.8, 56);
    const meadowMat = new THREE.MeshStandardMaterial({
      color: 0x52b788,
      roughness: 0.7,
    });
    const meadow = new THREE.Mesh(meadowGeo, meadowMat);
    meadow.position.y = 0.2;
    meadow.receiveShadow = true;
    scene.add(meadow);

    const seaGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x0077b6,
      roughness: 0.2,
      metalness: 0.3,
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -2.2;
    scene.add(sea);

    this.buildMushroomHouse(scene, -31, -23, 0xff3b30);
    this.buildMushroomHouse(scene, 31, 23, 0xff9500);
    this.buildMushroomHouse(scene, 32, -21, 0xaf52de);
    this.buildMushroomHouse(scene, -32, 21, 0x34c759);

    const fantasyTrees = [
      { x: -34, z: 0, c: 0x38b000, scale: 1.2 },
      { x: 34, z: 0, c: 0x007200, scale: 1.1 },
      { x: -18, z: -25, c: 0x70e000, scale: 0.9 },
      { x: 18, z: -25, c: 0x38b000, scale: 1.0 },
      { x: -18, z: 25, c: 0x007200, scale: 1.0 },
      { x: 18, z: 25, c: 0x70e000, scale: 1.15 },
    ];
    fantasyTrees.forEach(t => this.buildFantasyTree(scene, t.x, t.z, t.c, t.scale));

    const flowers = [
      { x: -10, z: -23, c: 0xff2d55 }, { x: -8, z: -24, c: 0xffcc00 }, { x: -12, z: -24, c: 0x5856d6 },
      { x: 10, z: 23, c: 0xff9500 },   { x: 8, z: 24, c: 0xff2d55 },   { x: 12, z: 24, c: 0x00c7be },
      { x: -30, z: -8, c: 0xff375f },  { x: 30, z: 8, c: 0xffd60a },
    ];
    flowers.forEach(f => this.buildGiantFlower(scene, f.x, f.z, f.c));

    const clouds = [
      { x: 38, y: 22, z: 14 },
      { x: -40, y: 24, z: -20 },
      { x: 16, y: 26, z: -36 },
      { x: -30, y: 22, z: 32 },
    ];
    clouds.forEach(c => this.buildFluffyCloud(scene, c.x, c.y, c.z));

    scene.add(new THREE.AmbientLight(0xf4fbf7, 1.9));
    const sun = new THREE.DirectionalLight(0xffffff, 2.3);
    sun.position.set(38, 58, 38);
    sun.castShadow = true;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x80ed99, 0.7);
    fill.position.set(-38, 25, -38);
    scene.add(fill);

    this.buildFireflySparkles(scene);
  }

  private static buildMushroomHouse(scene: THREE.Scene, x: number, z: number, capColor: number) {
    const house = new THREE.Group();

    const stemGeo = new THREE.CylinderGeometry(2.2, 2.8, 4.0, 16);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xfff8e7, roughness: 0.6 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 2.0;
    house.add(stem);

    const doorGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.6, 8, 1, false, 0, Math.PI);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x6f4e37, roughness: 0.9 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.0, 2.3);
    house.add(door);

    const capGeo = new THREE.SphereGeometry(4.8, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.35 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 3.6;
    house.add(cap);

    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dotGeo = new THREE.SphereGeometry(0.55, 8, 8);
    const dotPositions = [
      [0, 6.4, 3.2], [2.4, 5.6, 2.4], [-2.4, 5.6, 2.4],
      [3.4, 4.8, 0], [-3.4, 4.8, 0], [0, 7.8, 0],
      [2.2, 5.6, -2.4], [-2.2, 5.6, -2.4],
    ];
    dotPositions.forEach(([dx, dy, dz]) => {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(dx, dy, dz);
      dot.scale.set(1, 0.3, 1);
      house.add(dot);
    });

    house.position.set(x, 0.2, z);
    scene.add(house);
  }

  private static buildFantasyTree(scene: THREE.Scene, x: number, z: number, foliageColor: number, scale: number) {
    const tree = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.9, 4.0, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7f4f24, roughness: 0.85 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.0;
    tree.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.6 });
    const layers = [
      { r: 2.8, y: 4.6 },
      { r: 2.2, y: 6.4 },
      { r: 1.5, y: 7.8 },
    ];
    layers.forEach(l => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(l.r, 12, 12), leafMat);
      puff.position.y = l.y;
      puff.scale.set(1, 0.75, 1);
      tree.add(puff);
    });

    tree.scale.set(scale, scale, scale);
    tree.position.set(x, 0.2, z);
    scene.add(tree);
  }

  private static buildGiantFlower(scene: THREE.Scene, x: number, z: number, petalColor: number) {
    const flower = new THREE.Group();

    const stemGeo = new THREE.CylinderGeometry(0.08, 0.12, 2.8, 6);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x38b000 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 1.4;
    flower.add(stem);

    const centerGeo = new THREE.SphereGeometry(0.45, 12, 12);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffd000 });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.position.y = 2.8;
    flower.add(center);

    const petalMat = new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.4 });
    const petalGeo = new THREE.SphereGeometry(0.4, 8, 8);
    petalGeo.scale(1, 1.8, 0.4);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * 0.7, 2.8 + Math.sin(angle) * 0.7, 0);
      petal.rotation.z = angle;
      flower.add(petal);
    }

    flower.position.set(x, 0.2, z);
    scene.add(flower);
  }

  private static buildFluffyCloud(scene: THREE.Scene, x: number, y: number, z: number) {
    const cloud = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05,
    });

    const puffs = [
      { r: 2.2, x: 0, y: 0, z: 0 },
      { r: 1.7, x: 1.6, y: -0.2, z: 0 },
      { r: 1.7, x: -1.6, y: -0.2, z: 0 },
      { r: 1.3, x: 0.8, y: 0.9, z: 0.4 },
      { r: 1.3, x: -0.8, y: 0.9, z: -0.4 },
    ];
    puffs.forEach(p => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(p.r, 12, 12), mat);
      m.position.set(p.x, p.y, p.z);
      cloud.add(m);
    });

    cloud.position.set(x, y, z);
    scene.add(cloud);
  }

  private static buildFireflySparkles(scene: THREE.Scene) {
    const fireflyCount = 90;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(fireflyCount * 3);
    const colors = new Float32Array(fireflyCount * 3);

    const palette = [
      new THREE.Color(0xfffa65),
      new THREE.Color(0x38ef7d),
      new THREE.Color(0x68d8d6),
      new THREE.Color(0xffd166),
    ];

    for (let i = 0; i < fireflyCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 58;
      positions[i * 3 + 1] = 1.0 + Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 46;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);
  }
}
