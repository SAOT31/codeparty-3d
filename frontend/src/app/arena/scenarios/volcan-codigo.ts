import * as THREE from 'three';

export class VolcanCodigoScenario {
  static build(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x1a0500);
    scene.fog = new THREE.FogExp2(0x2d0c00, 0.006);

    const baseGeo = new THREE.BoxGeometry(64, 3.2, 52);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.95,
      metalness: 0.15,
      emissive: 0x2a0800,
      emissiveIntensity: 0.25,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -1.6;
    base.receiveShadow = true;
    scene.add(base);

    const basaltPlateauGeo = new THREE.BoxGeometry(58, 0.8, 46);
    const basaltPlateauMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      roughness: 0.9,
    });
    const basaltPlateau = new THREE.Mesh(basaltPlateauGeo, basaltPlateauMat);
    basaltPlateau.position.y = 0.2;
    basaltPlateau.receiveShadow = true;
    scene.add(basaltPlateau);

    const lavaChasmGeo = new THREE.BoxGeometry(16, 0.25, 36);
    const lavaChasmMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff4400,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    });
    const lavaChasm = new THREE.Mesh(lavaChasmGeo, lavaChasmMat);
    lavaChasm.position.set(0, 0.45, 0);
    scene.add(lavaChasm);

    const stoneBridgeGeo = new THREE.BoxGeometry(18, 0.4, 4.5);
    const stoneBridgeMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.95 });
    const stoneBridge = new THREE.Mesh(stoneBridgeGeo, stoneBridgeMat);
    stoneBridge.position.set(0, 0.7, 0);
    scene.add(stoneBridge);

    const lavaLakeGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    const lavaLakeMat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: 0xff3300,
      emissiveIntensity: 0.75,
      roughness: 0.3,
    });
    const lavaLake = new THREE.Mesh(lavaLakeGeo, lavaLakeMat);
    lavaLake.rotation.x = -Math.PI / 2;
    lavaLake.position.y = -2.2;
    scene.add(lavaLake);

    const spires = [
      { x: 26, z: 18, h: 10.0 },
      { x: -26, z: 18, h: 9.5 },
      { x: 26, z: -18, h: 10.5 },
      { x: -26, z: -18, h: 9.0 },
      { x: -28, z: 0, h: 11.0 },
      { x: 28, z: 0, h: 10.0 },
    ];
    spires.forEach(s => {
      const spireGeo = new THREE.ConeGeometry(2.2, s.h, 6);
      const spireMat = new THREE.MeshStandardMaterial({
        color: 0x1f1813,
        roughness: 0.95,
      });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.set(s.x, s.h / 2 - 1.2, s.z);
      scene.add(spire);

      const light = new THREE.PointLight(0xff4500, 3.2, 16);
      light.position.set(s.x, 1.2, s.z);
      scene.add(light);
    });

    const braziers = [
      { x: 12, z: -22 }, { x: -12, z: -22 },
      { x: 12, z: 22 },  { x: -12, z: 22 },
    ];
    braziers.forEach(b => {
      const pillarGeo = new THREE.CylinderGeometry(0.5, 0.7, 5.2, 8);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.85 });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(b.x, 2.6, b.z);
      scene.add(pillar);

      const fireGeo = new THREE.SphereGeometry(0.75, 10, 10);
      const fireMat = new THREE.MeshBasicMaterial({ color: 0xffa500 });
      const fire = new THREE.Mesh(fireGeo, fireMat);
      fire.position.set(b.x, 5.5, b.z);
      scene.add(fire);

      const fireLight = new THREE.PointLight(0xff5500, 3.8, 18);
      fireLight.position.set(b.x, 5.8, b.z);
      scene.add(fireLight);
    });

    scene.add(new THREE.AmbientLight(0x401000, 1.7));
    const mainLight = new THREE.DirectionalLight(0xff8844, 2.2);
    mainLight.position.set(35, 50, 35);
    scene.add(mainLight);

    const redGlow = new THREE.DirectionalLight(0xff2200, 1.3);
    redGlow.position.set(-35, 25, -35);
    scene.add(redGlow);

    this.buildEmbers(scene);
  }

  private static buildEmbers(scene: THREE.Scene) {
    const count = 280;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [[1, 0.4, 0], [1, 0.2, 0], [1, 0.8, 0.2], [1, 0.1, 0.1]];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 75;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 75;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, opacity: 0.88 });
    scene.add(new THREE.Points(geo, mat));
  }
}