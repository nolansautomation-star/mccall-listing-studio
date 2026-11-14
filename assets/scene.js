/* McCall Listing Studio: hero 3D scene (Three.js) */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('scene');

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

if (canvas && !reduce && hasWebGL()) {
  import('three').then(init).catch((err) => console.warn('3D scene unavailable:', err));
}

function init(THREE) {
  const COLORS = { ink: 0x0e1013, bone: 0xe9e2d6, gold: 0xd4a255, goldHi: 0xe9c27f, lake: 0x8fb8d8, roof: 0x2b3038, glow: 0xffc982 };
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { console.warn('WebGL init failed', e); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLORS.ink, 16, 34);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

  // lights
  scene.add(new THREE.HemisphereLight(COLORS.lake, COLORS.ink, 0.55));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.4);
  key.position.set(6, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  key.shadow.radius = 6;
  key.shadow.bias = -0.0008;
  scene.add(key);
  const rim = new THREE.DirectionalLight(COLORS.lake, 1.6);
  rim.position.set(-8, 4, -6);
  scene.add(rim);

  // world group (positioned per breakpoint)
  const world = new THREE.Group();
  scene.add(world);
  const house = new THREE.Group();
  world.add(house);

  const matWall = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.82, metalness: 0.0 });
  const matRoof = new THREE.MeshStandardMaterial({ color: COLORS.roof, roughness: 0.45, metalness: 0.35 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x2a2116, emissive: COLORS.glow, emissiveIntensity: 1.25, roughness: 0.2 });
  const matFrame = new THREE.MeshStandardMaterial({ color: COLORS.gold, roughness: 0.35, metalness: 0.8 });
  const matBase = new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.6, metalness: 0.2 });
  const edgeMat = new THREE.LineBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.55 });

  const W = 3.6, D = 3.2, H = 2.2, RH = 1.7; // width, depth, wall height, roof rise
  function addEdges(mesh, mat = edgeMat) {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), mat);
    mesh.add(e);
    return mesh;
  }
  function shadowed(m) { m.castShadow = true; m.receiveShadow = true; return m; }

  // walls: gable profile extruded
  const prof = new THREE.Shape();
  prof.moveTo(-W / 2, 0); prof.lineTo(W / 2, 0); prof.lineTo(W / 2, H); prof.lineTo(0, H + RH); prof.lineTo(-W / 2, H); prof.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(prof, { depth: D, bevelEnabled: false });
  bodyGeo.translate(0, 0, -D / 2);
  const body = shadowed(addEdges(new THREE.Mesh(bodyGeo, matWall)));
  house.add(body);

  // roof: two slabs with overhang, in a group so it can lift on scroll
  const roof = new THREE.Group();
  const slope = Math.atan2(RH, W / 2);
  const slabLen = Math.hypot(W / 2, RH) + 0.42;
  const slabGeo = new THREE.BoxGeometry(slabLen, 0.14, D + 0.6);
  [-1, 1].forEach((s) => {
    const slab = shadowed(addEdges(new THREE.Mesh(slabGeo, matRoof)));
    slab.rotation.z = -s * slope;
    slab.position.set(s * (W / 4 + 0.06), H + RH / 2 + 0.12, 0);
    slab.position.x += s * 0.11; slab.position.y -= 0.05;
    roof.add(slab);
  });
  // chimney
  const chim = shadowed(addEdges(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.9, 0.38), matRoof)));
  chim.position.set(0.95, H + RH - 0.1, -0.6);
  roof.add(chim);
  house.add(roof);

  // front glazing: the "M" valley echoes the logo; tall window + door
  const front = D / 2 + 0.011;
  function pane(w, h, x, y, z = front, rotY = 0) {
    const g = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), matGlass);
    g.add(glass);
    const t = 0.05;
    [[w + t, t, 0, h / 2], [w + t, t, 0, -h / 2], [t, h, -w / 2, 0], [t, h, w / 2, 0]].forEach(([fw, fh, fx, fy]) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.05), matFrame);
      f.position.set(fx, fy, 0.02); g.add(f);
    });
    g.position.set(x, y, z); g.rotation.y = rotY;
    house.add(g);
    return g;
  }
  pane(0.62, 1.2, 0, 0.6);              // door
  pane(0.8, 0.95, -1.15, 1.25);         // left window
  pane(0.8, 0.95, 1.15, 1.25);          // right window
  // gable triangle window
  const triShape = new THREE.Shape();
  triShape.moveTo(-0.55, 0); triShape.lineTo(0.55, 0); triShape.lineTo(0, 0.62); triShape.closePath();
  const tri = new THREE.Mesh(new THREE.ShapeGeometry(triShape), matGlass);
  tri.position.set(0, H + 0.25, front);
  house.add(tri);
  // side windows
  pane(1.1, 0.8, 0, 1.3, 0, Math.PI / 2).position.set(W / 2 + 0.011, 1.3, 0.2);
  pane(1.1, 0.8, 0, 1.3, 0, -Math.PI / 2).position.set(-W / 2 - 0.011, 1.3, 0.2);

  // interior glow
  const inner = new THREE.PointLight(COLORS.glow, 6, 6, 1.6);
  inner.position.set(0, 1.4, 0.4);
  house.add(inner);

  // plinth + ground
  const plinth = shadowed(addEdges(new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.75, 0.24, 64), matBase),
    new THREE.LineBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.25 })));
  plinth.position.y = -0.12;
  world.add(plinth);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.ShadowMaterial({ opacity: 0.4 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.24; ground.receiveShadow = true;
  world.add(ground);
  const polar = new THREE.PolarGridHelper(7.5, 12, 6, 96, COLORS.gold, COLORS.gold);
  polar.material.transparent = true; polar.material.opacity = 0.12; polar.position.y = -0.23;
  world.add(polar);
  // orbit ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.008, 8, 200), new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.35 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 1.6;
  world.add(ring);

  // floating deliverable cards
  const LABELS = ['MLS COPY', 'SOCIAL POSTS', 'REEL SCRIPT', 'EMAIL BLAST', 'FLYER', 'FACT CHECK'];
  function cardTexture(label, i) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 640;
    const x = c.getContext('2d');
    const r = 36;
    x.fillStyle = i === 5 ? '#D4A255' : '#F6F2EA';
    x.beginPath(); x.roundRect(8, 8, 496, 624, r); x.fill();
    x.fillStyle = i === 5 ? 'rgba(14,16,19,.7)' : '#A87A35';
    x.font = 'italic 600 40px Georgia, serif';
    x.fillText('0' + (i + 1), 48, 92);
    x.fillStyle = '#0E1013';
    x.font = '700 40px Manrope, Helvetica, Arial, sans-serif';
    x.fillText(label, 48, 160);
    const lines = [0.86, 0.72, 0.9, 0.6, 0.8, 0.5];
    lines.forEach((w, k) => {
      x.fillStyle = k === 0 ? (i === 5 ? 'rgba(14,16,19,.85)' : '#0E1013') : (i === 5 ? 'rgba(14,16,19,.25)' : '#E2DACB');
      x.beginPath(); x.roundRect(48, 220 + k * 58, 416 * w, k === 0 ? 26 : 18, 10); x.fill();
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  const cards = [];
  const cardGeo = new THREE.PlaneGeometry(1.15, 1.44);
  LABELS.forEach((label, i) => {
    const m = new THREE.Mesh(cardGeo, new THREE.MeshStandardMaterial({ map: cardTexture(label, i), roughness: 0.55, side: THREE.DoubleSide, transparent: true }));
    m.castShadow = true;
    const a = (i / LABELS.length) * Math.PI * 2;
    m.userData = { a, y: 1.1 + (i % 2) * 1.05, bob: Math.random() * Math.PI * 2 };
    world.add(m); cards.push(m);
  });

  // gold dust
  const N = 420, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 3 + Math.random() * 9, a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.random() * 7 - 0.5; pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: COLORS.goldHi, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }));
  world.add(dust);

  // layout + interaction state
  const hero = document.querySelector('.hero');
  let mobile = false;
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollP = 0, sp = 0, visible = true, running = true;
  const target = new THREE.Vector3();

  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    mobile = w / h < 1.05;
    camera.fov = mobile ? 46 : 34;
    if (mobile) camera.clearViewOffset(); else camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    camera.updateProjectionMatrix();
    world.scale.setScalar(mobile ? 0.58 : 0.92);
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('pointermove', (e) => {
    ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  window.addEventListener('scroll', () => {
    const h = hero.offsetHeight || window.innerHeight;
    scrollP = Math.min(1, Math.max(0, window.scrollY / h));
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  const clock = new THREE.Clock();
  let first = true, t = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !running) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    ptr.x += (ptr.tx - ptr.x) * 0.05; ptr.y += (ptr.ty - ptr.y) * 0.05;
    sp += (scrollP - sp) * 0.08;

    // house slowly turns; scroll adds a sweep and lifts the roof to reveal the glow
    house.rotation.y = -0.55 + t * 0.12 + sp * 1.6 + ptr.x * 0.25;
    roof.position.y = sp * 1.6; roof.rotation.z = sp * 0.12;
    inner.intensity = 6 + sp * 10;
    ring.rotation.z = t * 0.05;
    dust.rotation.y = t * 0.02;

    cards.forEach((m, i) => {
      const a = m.userData.a + t * 0.16;
      const r = 5.2 + sp * 1.4;
      m.position.set(Math.cos(a) * r, m.userData.y + Math.sin(t * 1.1 + m.userData.bob) * 0.14 + sp * 0.8, Math.sin(a) * r);
      m.lookAt(camera.position);
      m.material.opacity = 0.35 + 0.65 * Math.max(0, (Math.sin(a) + 1) / 2);
    });

    const dist = (mobile ? 16 : 14.5) + sp * 3;
    camera.position.set(
      world.position.x + Math.sin(0.75 + ptr.x * 0.12) * dist,
      4.4 + ptr.y * -0.6 + sp * 2.5,
      Math.cos(0.75 + ptr.x * 0.12) * dist
    );
    target.set(world.position.x, (mobile ? -3.9 : 1.4) - sp * 0.4, 0);
    camera.lookAt(target);

    renderer.render(scene, camera);
    if (first) { first = false; document.documentElement.classList.add('webgl-ready'); canvas.dataset.frames = '0'; }
    canvas.dataset.frames = String((+canvas.dataset.frames || 0) + 1);
  }
  frame();
}
