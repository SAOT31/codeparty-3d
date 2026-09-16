import * as THREE from 'three';

export class ParqueDiversionesScenario {
  static build(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0xb0e2ff, 0.004);

    const baseGeo = new THREE.BoxGeometry(78, 3.2, 62);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x66bb6a,
      roughness: 0.8,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -1.6;
    base.receiveShadow = true;
    scene.add(base);

    const plazaGeo = new THREE.BoxGeometry(72, 0.8, 56);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0xffe082,
      roughness: 0.6,
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = 0.2;
    plaza.receiveShadow = true;
    scene.add(plaza);

    const seaGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    const seaMat = new THREE.MeshStandardMaterial({
      color: 0x4fc3f7,
      roughness: 0.2,
      metalness: 0.2,
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -2.2;
    scene.add(sea);

    this.buildCircusTent(scene, -31, -23, 0xff4757, 0xffffff);
    this.buildCircusTent(scene, 31, 23, 0x1e90ff, 0xfffa65);
    this.buildFerrisWheel(scene, 32, -21);
    this.buildFerrisWheel(scene, -32, 21);

    const booths = [
      { x: -16, z: -25, color: 0xff6b81 },
      { x: 16, z: -25, color: 0x70a1ff },
      { x: -16, z: 25, color: 0x7bed9f },
      { x: 16, z: 25, color: 0xffa502 },
    ];
    booths.forEach(b => this.buildBooth(scene, b.x, b.z, b.color));

    const hotAirBalloons = [
      { x: 38, y: 22, z: 14, c1: 0xff4757, c2: 0xffd32a },
      { x: -40, y: 25, z: -20, c1: 0x3742fa, c2: 0x2ed573 },
      { x: 18, y: 28, z: -38, c1: 0xff6b81, c2: 0x70a1ff },
      { x: -32, y: 24, z: 34, c1: 0x9b59b6, c2: 0xffa502 },
    ];
    hotAirBalloons.forEach(b => this.buildHotAirBalloon(scene, b.x, b.y, b.z, b.c1, b.c2));

    this.buildBunting(scene, -31, 23, 31, 23, 0xff4757);
    this.buildBunting(scene, -31, -23, 31, -23, 0x1e90ff);

    const balloons = [
      { x: -8, z: -23, c: 0xff3838 }, { x: -6, z: -23, c: 0x2ed573 }, { x: -7, z: -22, c: 0xffa502 },
      { x: 8, z: 23, c: 0x1e90ff },   { x: 6, z: 23, c: 0xff6b81 },   { x: 7, z: 22, c: 0x9b59b6 },
    ];
    balloons.forEach(b => this.buildBalloonBunch(scene, b.x, b.z, b.c));

    scene.add(new THREE.AmbientLight(0xfffaed, 2.0));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(40, 60, 40);
    sun.castShadow = true;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xffd54f, 0.7);
    fill.position.set(-40, 25, -40);
    scene.add(fill);

    this.buildConfettiSparkles(scene);
  }

  private static buildCircusTent(scene: THREE.Scene, x: number, z: number, c1: number, c2: number) {
    const tent = new THREE.Group();

    const wallsGeo = new THREE.CylinderGeometry(5.0, 5.4, 3.8, 16);
    const wallsMat = new THREE.MeshStandardMaterial({ color: c1, roughness: 0.5 });
    const walls = new THREE.Mesh(wallsGeo, wallsMat);
    walls.position.y = 1.9;
    tent.add(walls);

    const roofGeo = new THREE.ConeGeometry(5.8, 4.6, 16);
    const roofMat = new THREE.MeshStandardMaterial({ color: c2, roughness: 0.3 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 6.0;
    tent.add(roof);

    const flagPoleGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8);
    const flagPoleMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const pole = new THREE.Mesh(flagPoleGeo, flagPoleMat);
    pole.position.y = 9.2;
    tent.add(pole);

    const flagGeo = new THREE.BoxGeometry(1.2, 0.6, 0.05);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0xff4757 });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.6, 9.8, 0);
    tent.add(flag);

    tent.position.set(x, 0.2, z);
    scene.add(tent);
  }

  private static buildFerrisWheel(scene: THREE.Scene, x: number, z: number) {
    const wheelGroup = new THREE.Group();

    const standMat = new THREE.MeshStandardMaterial({ color: 0x3742fa, roughness: 0.4 });
    const leg1Geo = new THREE.CylinderGeometry(0.2, 0.35, 14, 8);
    const leg1 = new THREE.Mesh(leg1Geo, standMat);
    leg1.position.set(-2.5, 6.5, 0);
    leg1.rotation.z = -0.22;
    wheelGroup.add(leg1);

    const leg2 = new THREE.Mesh(leg1Geo, standMat);
    leg2.position.set(2.5, 6.5, 0);
    leg2.rotation.z = 0.22;
    wheelGroup.add(leg2);

    const rimGeo = new THREE.TorusGeometry(6.2, 0.25, 12, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 12.5;
    wheelGroup.add(rim);

    const innerRimGeo = new THREE.TorusGeometry(3.5, 0.2, 12, 24);
    const innerRim = new THREE.Mesh(innerRimGeo, rimMat);
    innerRim.position.y = 12.5;
    wheelGroup.add(innerRim);

    const spokeMat = new THREE.MeshBasicMaterial({ color: 0x70a1ff });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spokeGeo = new THREE.CylinderGeometry(0.1, 0.1, 6.2, 6);
      const spoke = new THREE.Mesh(spokeGeo, spokeMat);
      spoke.position.set(Math.cos(angle) * 3.1, 12.5 + Math.sin(angle) * 3.1, 0);
      spoke.rotation.z = angle + Math.PI / 2;
      wheelGroup.add(spoke);

      const gondolaGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const colors = [0xff4757, 0x2ed573, 0xffa502, 0x1e90ff, 0x9b59b6, 0xff6b81, 0x5352ed, 0xfffa65];
      const gondolaMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
      const gondola = new THREE.Mesh(gondolaGeo, gondolaMat);
      gondola.position.set(Math.cos(angle) * 6.2, 12.5 + Math.sin(angle) * 6.2, 0);
      wheelGroup.add(gondola);
    }

    const hubGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.y = 12.5;
    hub.rotation.x = Math.PI / 2;
    wheelGroup.add(hub);

    wheelGroup.position.set(x, 0.2, z);
    wheelGroup.rotation.y = Math.PI / 4;
    scene.add(wheelGroup);
  }

  private static buildBooth(scene: THREE.Scene, x: number, z: number, color: number) {
    const booth = new THREE.Group();

    const tableGeo = new THREE.BoxGeometry(3.6, 1.6, 2.4);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = 0.8;
    booth.add(table);

    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 6);
    const corners = [[-1.6, -1.0], [1.6, -1.0], [-1.6, 1.0], [1.6, 1.0]];
    corners.forEach(([cx, cz]) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(cx, 2.2, cz);
      booth.add(post);
    });

    const awningGeo = new THREE.BoxGeometry(4.2, 0.4, 3.0);
    const awningMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.position.y = 3.6;
    awning.rotation.x = 0.1;
    booth.add(awning);

    booth.position.set(x, 0.2, z);
    scene.add(booth);
  }

  private static buildHotAirBalloon(
    scene: THREE.Scene,
    x: number,
    y: number,
    z: number,
    c1: number,
    c2: number,
  ) {
    const balloonGroup = new THREE.Group();

    const balloonGeo = new THREE.SphereGeometry(3.6, 24, 24);
    balloonGeo.scale(1, 1.35, 1);
    const balloonMat = new THREE.MeshStandardMaterial({
      color: c1,
      roughness: 0.4,
      metalness: 0.1,
    });
    const balloon = new THREE.Mesh(balloonGeo, balloonMat);
    balloonGroup.add(balloon);

    const stripeGeo = new THREE.TorusGeometry(3.6, 0.18, 12, 32);
    const stripeMat = new THREE.MeshStandardMaterial({ color: c2, roughness: 0.3 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = Math.PI / 2;
    balloonGroup.add(stripe);

    const basketGeo = new THREE.BoxGeometry(1.4, 1.0, 1.4);
    const basketMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.y = -5.6;
    balloonGroup.add(basket);

    const ropeMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
    const rGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.4, 4);
    const rOffsets = [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]];
    rOffsets.forEach(([rx, rz]) => {
      const rope = new THREE.Mesh(rGeo, ropeMat);
      rope.position.set(rx, -4.4, rz);
      balloonGroup.add(rope);
    });

    balloonGroup.position.set(x, y, z);
    scene.add(balloonGroup);
  }

  private static buildBunting(
    scene: THREE.Scene,
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    color: number,
  ) {
    const count = 10;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(x1, 7.5, z1),
      new THREE.Vector3((x1 + x2) / 2, 5.0, (z1 + z2) / 2),
      new THREE.Vector3(x2, 7.5, z2),
    );
    const points = curve.getPoints(count);

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);

    const flagColors = [0xff4757, 0x2ed573, 0xffa502, 0x1e90ff, 0xff6b81, 0xfffa65];
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const flagGeo = new THREE.ConeGeometry(0.35, 0.65, 3);
      const flagMat = new THREE.MeshBasicMaterial({
        color: flagColors[i % flagColors.length],
        side: THREE.DoubleSide,
      });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(p.x, p.y - 0.32, p.z);
      flag.rotation.x = Math.PI;
      scene.add(flag);
    }
  }

  private static buildBalloonBunch(scene: THREE.Scene, x: number, z: number, color: number) {
    const bunch = new THREE.Group();
    const balloonColors = [0xff4757, 0x2ed573, 0xffa502, 0x1e90ff, 0x9b59b6];

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const bGeo = new THREE.SphereGeometry(0.55, 12, 12);
      bGeo.scale(1, 1.25, 1);
      const bMat = new THREE.MeshStandardMaterial({
        color: balloonColors[i % balloonColors.length],
        roughness: 0.3,
      });
      const balloon = new THREE.Mesh(bGeo, bMat);
      balloon.position.set(Math.cos(angle) * 0.45, 3.2 + (i % 2) * 0.4, Math.sin(angle) * 0.45);
      bunch.add(balloon);

      const sGeo = new THREE.CylinderGeometry(0.015, 0.015, 3.2, 4);
      const sMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const string = new THREE.Mesh(sGeo, sMat);
      string.position.set(Math.cos(angle) * 0.22, 1.6, Math.sin(angle) * 0.22);
      bunch.add(string);
    }

    bunch.position.set(x, 0.2, z);
    scene.add(bunch);
  }

  private static buildConfettiSparkles(scene: THREE.Scene) {
    const confettiCount = 140;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(confettiCount * 3);
    const colors = new Float32Array(confettiCount * 3);

    const palette = [
      new THREE.Color(0xff4757),
      new THREE.Color(0x2ed573),
      new THREE.Color(0xffa502),
      new THREE.Color(0x1e90ff),
      new THREE.Color(0xff6b81),
      new THREE.Color(0xfffa65),
      new THREE.Color(0x9b59b6),
    ];

    for (let i = 0; i < confettiCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 58;
      positions[i * 3 + 1] = 1.0 + Math.random() * 16;
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
      opacity: 0.9,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);
  }
}
