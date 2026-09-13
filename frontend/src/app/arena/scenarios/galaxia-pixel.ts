import * as THREE from 'three';

export class GalaxiaPixelScenario {
  static build(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x020818);
    scene.fog = new THREE.FogExp2(0x020818, 0.005);

    const baseGeo = new THREE.BoxGeometry(64, 3.2, 52);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x141e30,
      roughness: 0.35,
      metalness: 0.8,
      emissive: 0x050c1e,
      emissiveIntensity: 0.3,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -1.6;
    base.receiveShadow = true;
    scene.add(base);

    const deckGeo = new THREE.BoxGeometry(58, 0.8, 46);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.85,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.2;
    deck.receiveShadow = true;
    scene.add(deck);

    const gridHelper = new THREE.GridHelper(54, 24, 0x00f5ff, 0x1e293b);
    gridHelper.position.y = 0.62;
    scene.add(gridHelper);

    const centerHubGeo = new THREE.BoxGeometry(16, 0.4, 12);
    const centerHubMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x0044ff,
      emissiveIntensity: 0.3,
    });
    const centerHub = new THREE.Mesh(centerHubGeo, centerHubMat);
    centerHub.position.set(0, 0.45, 0);
    scene.add(centerHub);

    const saturn = new THREE.Group();
    const saturnPlanetGeo = new THREE.SphereGeometry(16, 32, 32);
    const saturnPlanetMat = new THREE.MeshStandardMaterial({
      color: 0xf5deb3,
      roughness: 0.6,
      emissive: 0x8b7355,
      emissiveIntensity: 0.15,
    });
    const saturnPlanet = new THREE.Mesh(saturnPlanetGeo, saturnPlanetMat);
    saturn.add(saturnPlanet);

    const saturnRingGeo = new THREE.RingGeometry(22, 34, 64);
    const saturnRingMat = new THREE.MeshBasicMaterial({
      color: 0xdfba73,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const saturnRing = new THREE.Mesh(saturnRingGeo, saturnRingMat);
    saturnRing.rotation.x = Math.PI / 2.3;
    saturn.add(saturnRing);

    saturn.position.set(-85, 48, -115);
    saturn.rotation.z = 0.35;
    scene.add(saturn);

    const towerPos = [
      { x: 26, z: 18, c: 0x00f5ff },
      { x: -26, z: 18, c: 0x7d5fff },
      { x: 26, z: -18, c: 0xff3838 },
      { x: -26, z: -18, c: 0x00d2d3 },
      { x: 0, z: 22, c: 0xfffa65 },
      { x: 0, z: -22, c: 0xe056fd },
    ];
    towerPos.forEach(p => {
      const towerGeo = new THREE.BoxGeometry(1.6, 7.5, 1.6);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.2,
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(p.x, 4.0, p.z);
      scene.add(tower);

      const orbGeo = new THREE.SphereGeometry(0.7, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({ color: p.c });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(p.x, 8.2, p.z);
      scene.add(orb);

      const light = new THREE.PointLight(p.c, 3.5, 20);
      light.position.set(p.x, 8.5, p.z);
      scene.add(light);
    });

    scene.add(new THREE.AmbientLight(0x4a69bd, 1.5));
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(35, 50, 35);
    scene.add(mainLight);

    const cyanLight = new THREE.DirectionalLight(0x00f5ff, 1.2);
    cyanLight.position.set(-35, 25, -35);
    scene.add(cyanLight);

    this.buildStarfield(scene);
  }

  private static buildStarfield(scene: THREE.Scene) {
    const count = 650;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [[0, 0.9, 1], [0.5, 0.4, 1], [1, 0.9, 0.5], [1, 0.3, 0.6], [1, 1, 1]];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 280;
      pos[i * 3 + 1] = Math.random() * 110 - 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 280;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.9 });
    scene.add(new THREE.Points(geo, mat));
  }
}