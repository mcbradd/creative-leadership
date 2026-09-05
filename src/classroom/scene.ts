import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type View = "room" | "seat" | "board";
export type Lighting = "day" | "golden" | "night";
export type Discovery = "globe" | "board" | "books" | "plant" | "bell";

export function createClassroom(host: HTMLDivElement, onSelect: (id: Discovery) => void, onReady: () => void) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-label", "Interactive 3D classroom. Drag to rotate, pinch or scroll to zoom. Use the view buttons for keyboard navigation.");
  renderer.domElement.setAttribute("role", "img");
  host.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 4;
  controls.maxDistance = 32;
  controls.maxPolarAngle = Math.PI / 2 - 0.025;
  controls.minPolarAngle = 0.12;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  const world = new THREE.Group();
  scene.add(world);
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];
  const mat = (color: string | number, roughness = 0.75, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.push(m); return m;
  };
  const cream = mat("#e8dfc9"), trim = mat("#f9efd9"), wood = mat("#b88149");
  const edge = mat("#d2a575"), dark = mat("#314b43"), green = mat("#6f8c6e");
  const brass = mat("#b69a59", 0.35, 0.6), pot = mat("#bc7254");
  const charcoal = mat("#424947"), paper = mat("#f9f2dc");
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = world, rounded = false) => {
    const geo = rounded ? new RoundedBoxGeometry(w, h, d, 2, Math.min(0.055, h / 3)) : new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const cylinder = (r: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = world) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, rb, h, 20), m);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const sphere = (r: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = world) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), m); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const canvasTexture = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d")!);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); textures.push(texture); return texture;
  };
  const mapped = (texture: THREE.Texture) => {
    const m = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }); materials.push(m); return m;
  };
  const face = (w: number, h: number, texture: THREE.Texture, x: number, y: number, z: number, parent: THREE.Object3D = world) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mapped(texture)); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  const floorTexture = canvasTexture(1024, 1024, c => {
    c.fillStyle = "#c49a6b"; c.fillRect(0, 0, 1024, 1024);
    for (let row = 0; row < 20; row++) {
      for (let col = -1; col < 5; col++) {
        const x = col * 256 + (row % 2) * 128, y = row * 52;
        c.fillStyle = ["#c7a477", "#c09a6d", "#cfae83", "#c4a174"][(row * 3 + col + 4) % 4];
        c.fillRect(x + 1, y + 1, 254, 50);
        c.strokeStyle = "#9b774b22"; c.lineWidth = 1;
        for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(x + 4, y + k * 9 + 5); c.bezierCurveTo(x + 90, y + k * 9 + 2, x + 155, y + k * 9 + 10, x + 245, y + k * 9 + 5); c.stroke(); }
      }
    }
  });
  box(10.5, 0.32, 9, edge, 0, -0.21, 0, world, true);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10.3, 8.8), mapped(floorTexture));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.035; floor.receiveShadow = true; world.add(floor);
  // Cutaway architecture: a chalkboard wall and a wall with three true window openings.
  box(10.4, 4.5, 0.18, cream, 0, 2.2, -4.4);
  box(10.45, 0.12, 0.3, trim, 0, 4.48, -4.4);
  box(10.4, 0.22, 0.08, dark, 0, 0.12, -4.27);
  box(0.18, 1.15, 8.8, cream, -5.15, 0.53, 0);
  box(0.18, 0.65, 8.8, cream, -5.15, 4.15, 0);
  box(0.32, 0.12, 8.9, trim, -5.15, 4.48, 0);
  box(0.08, 0.2, 8.8, dark, -5.02, 0.12, 0);
  const glass = new THREE.MeshStandardMaterial({ color: "#c4e0dd", transparent: true, opacity: 0.22, roughness: 0.15, side: THREE.DoubleSide }); materials.push(glass);
  for (const z of [-4.27, -1.5, 1.5, 4.27]) box(0.2, 2.72, 0.24, cream, -5.15, 2.48, z);
  for (const z of [-2.88, 0, 2.88]) {
    box(0.1, 2.6, 2.52, glass, -5.13, 2.45, z).castShadow = false;
    for (const dz of [-1.3, 0, 1.3]) box(0.15, 2.72, 0.07, trim, -5.0, 2.45, z + dz);
    for (const y of [1.13, 2.6, 3.8]) box(0.15, 0.07, 2.65, trim, -5.0, y, z);
    box(0.42, 0.1, 2.8, trim, -4.99, 1.06, z);
  }
  const interactive: THREE.Object3D[] = [];
  const tag = (object: THREE.Object3D, id: Discovery) => { object.userData.discovery = id; interactive.push(object); };
  const boardGroup = new THREE.Group(); world.add(boardGroup);
  box(5.4, 2.3, 0.12, wood, -0.85, 2.65, -4.24, boardGroup, true);
  box(5.16, 2.08, 0.13, dark, -0.85, 2.65, -4.20, boardGroup);
  const lessons = [
    ["A little room for", "BIG IDEAS.", "Stay curious. Ask why. Make something.", "TODAY'S LESSON     /     THE ART OF WONDER"],
    ["Our place in", "THE UNIVERSE.", "One small planet. Endless possibilities.", "TODAY'S LESSON     /     ASTRONOMY"],
    ["Every great idea", "STARTS SMALL.", "Observe. Imagine. Experiment. Repeat.", "TODAY'S LESSON     /     CREATIVE THINKING"],
  ];
  const boardCanvas = document.createElement("canvas"); boardCanvas.width = 1280; boardCanvas.height = 512;
  const boardTexture = new THREE.CanvasTexture(boardCanvas); boardTexture.colorSpace = THREE.SRGBColorSpace; textures.push(boardTexture);
  function lesson(index: number) {
    const c = boardCanvas.getContext("2d")!; const words = lessons[index % lessons.length];
    c.fillStyle = "#294c42"; c.fillRect(0, 0, 1280, 512);
    c.fillStyle = "#eff0d7"; c.textAlign = "left"; c.font = "24px sans-serif"; c.fillText(words[3], 65, 70);
    c.font = "italic 54px Georgia"; c.fillText(words[0], 65, 165);
    c.font = "bold 100px sans-serif"; c.fillText(words[1], 60, 276);
    c.font = "27px sans-serif"; c.fillText(words[2], 65, 369);
    c.strokeStyle = "#f0dc91"; c.lineWidth = 3; c.beginPath(); c.moveTo(65, 303); c.lineTo(875, 303); c.stroke();
    c.beginPath(); c.ellipse(1070, 237, 99, 34, -0.4, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(1070, 237, 62, 0, Math.PI * 2); c.stroke();
    c.font = "21px sans-serif"; c.fillText("✦", 1134, 136);
    boardTexture.needsUpdate = true;
  }
  lesson(0); face(5.12, 2.04, boardTexture, -0.85, 2.65, -4.12, boardGroup); tag(boardGroup, "board");
  box(5.5, 0.09, 0.3, wood, -0.85, 1.49, -4.04);
  box(0.3, 0.065, 0.08, paper, 0.7, 1.57, -4.0);
  box(0.29, 0.08, 0.14, charcoal, -2.4, 1.58, -4.0);
  // The clock is canvas drawn so the dial stays crisp without hundreds of meshes.
  const clockTexture = canvasTexture(256, 256, c => {
    c.fillStyle = "#f6efd9"; c.fillRect(0, 0, 256, 256); c.strokeStyle = "#334d43"; c.lineWidth = 3;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(128 + Math.sin(a) * 91, 128 + Math.cos(a) * 91); c.lineTo(128 + Math.sin(a) * 104, 128 + Math.cos(a) * 104); c.stroke(); }
    c.lineWidth = 7; c.lineCap = "round"; c.beginPath(); c.moveTo(90, 92); c.lineTo(128, 128); c.lineTo(179, 80); c.stroke();
  });
  const clock = cylinder(0.43, 0.43, 0.1, charcoal, 3.35, 3.72, -4.2); clock.rotation.x = Math.PI / 2;
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.39, 48), mapped(clockTexture)); dial.position.set(3.35, 3.72, -4.13); world.add(dial);
  const bookColors = [mat("#b2674e"), mat("#72958a"), mat("#d6b064"), mat("#5d7987"), mat("#e5d3b3")];
  function book(x: number, y: number, z: number, color: THREE.Material, parent: THREE.Object3D = world, w = 0.38) {
    box(w, 0.07, 0.48, color, x, y, z, parent); box(w - 0.025, 0.045, 0.45, paper, x, y + 0.018, z + 0.01, parent);
  }
  const shelf = new THREE.Group(); shelf.position.set(3.63, 0, -3.93); world.add(shelf);
  for (const x of [-0.96, 0.96]) box(0.1, 2.5, 0.65, wood, x, 1.25, 0, shelf);
  box(2.02, 2.5, 0.08, edge, 0, 1.25, -0.3, shelf);
  for (const y of [0.14, 0.9, 1.66, 2.5]) box(2.05, 0.1, 0.71, wood, 0, y, 0, shelf);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
    const height = 0.39 + ((i * 7 + row * 3) % 5) * 0.046;
    const b = box(0.12, height, 0.36, bookColors[(i + row) % 5], -0.76 + i * 0.178, 0.22 + row * 0.76 + height / 2, 0, shelf);
    if (i === 7) b.rotation.z = 0.12;
    box(0.08, 0.018, 0.008, paper, -0.76 + i * 0.178, 0.32 + row * 0.76, 0.185, shelf);
  }
  tag(shelf, "books");
  // Teacher's desk and nine individual pupil desks, each with a modeled chair.
  function table(x: number, z: number, width: number, depth: number, height: number) {
    const group = new THREE.Group(); group.position.set(x, 0, z); world.add(group);
    box(width, 0.13, depth, edge, 0, height, 0, group, true);
    for (const dx of [-width / 2 + 0.12, width / 2 - 0.12]) for (const dz of [-depth / 2 + 0.12, depth / 2 - 0.12]) cylinder(0.035, 0.045, height, dark, dx, height / 2, dz, group);
    box(width - 0.16, 0.2, 0.06, wood, 0, height - 0.2, -depth / 2 + 0.1, group);
    return group;
  }
  table(-1.2, -2.8, 2.75, 1.03, 1.22);
  box(1.3, 0.62, 0.07, wood, -1.2, 0.77, -2.36);
  book(-1.8, 1.33, -2.76, bookColors[0]); book(-1.83, 1.43, -2.78, bookColors[2]);
  cylinder(0.1, 0.1, 0.22, pot, -0.4, 1.39, -2.7);
  for (let i = 0; i < 4; i++) { const p = cylinder(0.012, 0.012, 0.35, bookColors[i], -0.46 + i * 0.036, 1.6, -2.7); p.rotation.z = (i - 2) * 0.12; }
  const bell = new THREE.Group(); bell.position.set(-0.9, 1.3, -2.65); world.add(bell);
  cylinder(0.16, 0.18, 0.035, charcoal, 0, 0, 0, bell); sphere(0.135, brass, 0, 0.04, 0, bell); cylinder(0.025, 0.025, 0.07, brass, 0, 0.19, 0, bell); tag(bell, "bell");
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const x = -2.9 + col * 2.53, z = -0.8 + row * 1.62;
    table(x, z, 1.55, 0.92, 1.1);
    const chair = new THREE.Group(); chair.position.set(x + 0.06, 0, z + 0.77); world.add(chair);
    box(0.78, 0.12, 0.7, green, 0, 0.61, 0, chair, true);
    box(0.79, 0.47, 0.1, green, 0, 1.0, 0.31, chair, true);
    for (const dx of [-0.3, 0.3]) for (const dz of [-0.25, 0.25]) cylinder(0.027, 0.037, dz > 0 ? 1.18 : 0.6, dark, dx, dz > 0 ? 0.59 : 0.3, dz, chair);
    if ((row + col) % 2 === 0) { book(x - 0.3, 1.21, z - 0.03, bookColors[(row + col) % 5]); box(0.36, 0.012, 0.49, paper, x + 0.29, 1.177, z + 0.04); }
    else book(x + 0.23, 1.21, z, bookColors[(row + col) % 5]);
    const pencil = cylinder(0.012, 0.012, 0.35, brass, x + 0.52, 1.19, z + 0.03); pencil.rotation.x = Math.PI / 2; pencil.rotation.z = 0.23;
  }
  function plant(x: number, z: number, scale: number) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); world.add(g);
    cylinder(0.3, 0.22, 0.5, pot, 0, 0.25, 0, g); cylinder(0.32, 0.3, 0.08, pot, 0, 0.49, 0, g);
    cylinder(0.275, 0.275, 0.015, mat("#514330"), 0, 0.535, 0, g);
    for (let i = 0; i < 10; i++) {
      const a = i * 2.4, r = 0.15 + (i % 3) * 0.13;
      const leaf = sphere(1, i % 2 ? green : dark, Math.sin(a) * r, 0.7 + (i % 4) * 0.2, Math.cos(a) * r, g);
      leaf.scale.set(0.13, 0.38, 0.065); leaf.rotation.set(Math.cos(a) * 0.6, a, Math.sin(a) * 0.65);
    }
    tag(g, "plant");
  }
  plant(-4.43, -3.68, 1.25); plant(4.46, 3.54, 1.3);
  // Globe with hand-authored continent silhouettes and geographic graticules.
  const globeMap = canvasTexture(1024, 512, c => {
    c.fillStyle = "#7fadb0"; c.fillRect(0, 0, 1024, 512); c.strokeStyle = "#cee0c455"; c.lineWidth = 1;
    for (let x = 0; x < 1024; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 512); c.stroke(); }
    for (let y = 32; y < 512; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(1024, y); c.stroke(); }
    c.fillStyle = "#dbd4a0";
    const polygons = [ [[110,90],[175,66],[231,93],[287,137],[242,175],[213,179],[199,229],[165,188],[136,165]], [[246,237],[283,246],[323,302],[293,375],[266,418],[251,361],[220,288]], [[480,117],[531,105],[552,145],[525,177],[465,168]], [[486,186],[555,182],[585,239],[556,316],[523,355],[488,295],[455,237]], [[558,88],[686,65],[825,89],[911,137],[839,182],[768,181],[732,229],[677,205],[636,244],[603,171],[550,156]], [[791,316],[861,306],[900,352],[857,381],[799,367]], [[335,46],[397,35],[380,107],[342,119]] ];
    for (const points of polygons) { c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fill(); }
  });
  const globeGroup = new THREE.Group(); globeGroup.position.set(3.65, 2.6, -3.92); world.add(globeGroup);
  cylinder(0.32, 0.38, 0.08, dark, 0, 0, 0, globeGroup); cylinder(0.05, 0.05, 0.24, brass, 0, 0.15, 0, globeGroup);
  const globe = sphere(0.44, mapped(globeMap), 0, 0.62, 0, globeGroup); globe.rotation.z = -0.23;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.018, 8, 64), brass); ring.position.y = 0.62; ring.rotation.z = -0.23; globeGroup.add(ring); tag(globeGroup, "globe");
  const rug = box(2.15, 0.016, 1.52, mat("#c3b697"), 3.61, 0, -2.48, world, true); rug.receiveShadow = true;
  // Floating dust catches the light, with a deliberately low particle count.
  const dustPositions = new Float32Array(72 * 3);
  for (let i = 0; i < 72; i++) { dustPositions[i * 3] = Math.sin(i * 51.73) * 4.9; dustPositions[i * 3 + 1] = 0.3 + (i % 29) / 8; dustPositions[i * 3 + 2] = Math.cos(i * 15.13) * 4; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({ color: "#fff4d1", size: 0.025, transparent: true, opacity: 0.48, depthWrite: false }); materials.push(dustMat);
  const dust = new THREE.Points(dustGeo, dustMat); world.add(dust);
  const hemi = new THREE.HemisphereLight(0xfff6e6, 0x767e66, 2.7); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe5bb, 4.2); sun.position.set(-7, 9, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.1, far: 35 }); sun.shadow.normalBias = 0.035; sun.shadow.bias = -0.00015; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc7dfef, 1.1); fill.position.set(5, 5, 0); scene.add(fill);
  const lamp = new THREE.PointLight(0xffcc86, 0, 15, 2); lamp.position.set(0, 3.8, 0); scene.add(lamp);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x6f614a, opacity: 0.16 }));
  materials.push(shadow.material); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.39; shadow.receiveShadow = true; scene.add(shadow);

  let currentView: View = "room", destination: { camera: THREE.Vector3; target: THREE.Vector3 } | null = null;
  function view(which: View, instant = false) {
    currentView = which;
    controls.minDistance = which === "room" ? 7 : 0.8;
    const narrow = host.clientWidth < 700;
    const p = which === "seat" ? new THREE.Vector3(0, 1.9, 2.3) : which === "board" ? new THREE.Vector3(-0.85, 2.65, 2.1) : new THREE.Vector3(narrow ? 18 : 13.4, narrow ? 15.5 : 11.6, narrow ? 23.2 : 17.2);
    const target = which === "room" ? new THREE.Vector3(0, 1.2, 0) : new THREE.Vector3(-0.85, 2.35, -4.0);
    if (instant) { camera.position.copy(p); controls.target.copy(target); controls.update(); destination = null; }
    else destination = { camera: p, target };
  }
  const cancelTransition = () => { destination = null; };
  controls.addEventListener("start", cancelTransition);
  function resize() { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); view(currentView, true); }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let down = { x: 0, y: 0 }, activePointers = 0, wasMulti = false;
  const pointerDown = (e: PointerEvent) => { activePointers++; if (activePointers > 1) wasMulti = true; else wasMulti = false; down = { x: e.clientX, y: e.clientY }; };
  const pointerUp = (e: PointerEvent) => {
    activePointers = Math.max(0, activePointers - 1);
    if (wasMulti || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7) return;
    const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera); const hits = raycaster.intersectObjects(interactive, true);
    if (hits[0]) { let obj: THREE.Object3D | null = hits[0].object; while (obj && !obj.userData.discovery) obj = obj.parent; if (obj) onSelect(obj.userData.discovery); }
  };
  const pointerCancel = () => { activePointers = 0; wasMulti = true; };
  renderer.domElement.addEventListener("pointerdown", pointerDown); renderer.domElement.addEventListener("pointerup", pointerUp); renderer.domElement.addEventListener("pointercancel", pointerCancel);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let spinning = false, visible = true, firstFrame = true, last = performance.now();
  const visibility = () => { visible = !document.hidden; last = performance.now(); };
  document.addEventListener("visibilitychange", visibility);
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; if (!visible) return;
    if (destination) {
      const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 5);
      camera.position.lerp(destination.camera, ease); controls.target.lerp(destination.target, ease);
      if (camera.position.distanceTo(destination.camera) < 0.015) destination = null;
    }
    if (spinning && !reducedMotion) globe.rotation.y += dt * 0.55;
    if (!reducedMotion) dust.rotation.y += dt * 0.007;
    controls.update(); renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; onReady(); }
  });
  return {
    view, lesson,
    rotate: (amount: number) => { const offset = camera.position.clone().sub(controls.target); offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), amount); camera.position.copy(controls.target).add(offset); controls.update(); },
    zoom: (factor: number) => { const offset = camera.position.clone().sub(controls.target); offset.multiplyScalar(factor).clampLength(controls.minDistance, controls.maxDistance); camera.position.copy(controls.target).add(offset); controls.update(); },
    spin: () => { spinning = !spinning; if (reducedMotion) globe.rotation.y += Math.PI / 3; return spinning; },
    lighting: (mode: Lighting) => {
      if (mode === "day") { hemi.intensity = 2.7; sun.intensity = 4.2; sun.color.set(0xffe5bb); sun.position.set(-7, 9, 5); fill.intensity = 1.1; lamp.intensity = 0; renderer.toneMappingExposure = 1.28; }
      if (mode === "golden") { hemi.intensity = 1.8; sun.intensity = 5; sun.color.set(0xffb85c); sun.position.set(-8, 4.5, 3); fill.intensity = 0.7; lamp.intensity = 0; renderer.toneMappingExposure = 1.18; }
      if (mode === "night") { hemi.intensity = 0.7; sun.intensity = 0.9; sun.color.set(0x9baeff); sun.position.set(-7, 9, 5); fill.intensity = 0.4; lamp.intensity = 55; renderer.toneMappingExposure = 1.15; }
    },
    dispose: () => {
      renderer.setAnimationLoop(null); observer.disconnect(); controls.dispose(); document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("pointerdown", pointerDown); renderer.domElement.removeEventListener("pointerup", pointerUp); renderer.domElement.removeEventListener("pointercancel", pointerCancel);
      scene.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Points) o.geometry.dispose(); });
      textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
