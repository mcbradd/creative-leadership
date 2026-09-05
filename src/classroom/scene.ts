import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createWalker } from "./walker";
import type { Obstacle } from "./movement";

export type View = "walk" | "room" | "seat" | "board";
export type Lighting = "day" | "golden" | "night";
export type Discovery = "globe" | "board" | "books" | "plant" | "bell";

export function createClassroom(host: HTMLDivElement, onSelect: (id: Discovery) => void, onReady: () => void, onPose?: (pose: { x: number; z: number; yaw: number }) => void, onFailure?: () => void) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-label", "First-person classroom. Drag to look. Use the movement joystick or WASD to walk, and arrow keys to look around.");
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
  const obstacles: Obstacle[] = [];
  const obstacle = (x: number, z: number, w: number, d: number) => obstacles.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
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
  // The complete interior is hidden only in the optional architectural overview.
  const enclosure = new THREE.Group(); world.add(enclosure);
  box(0.18, 4.5, 8.8, cream, 5.15, 2.2, 0, enclosure);
  box(10.4, 4.5, 0.18, cream, 0, 2.2, 4.4, enclosure);
  box(10.4, 0.16, 8.8, trim, 0, 4.49, 0, enclosure).castShadow = false;
  box(0.08, 0.2, 8.8, dark, 5.02, 0.12, 0, enclosure);
  box(10.4, 0.2, 0.08, dark, 0, 0.12, 4.27, enclosure);
  for (const z of [-2.8, 0, 2.8]) box(10.2, 0.12, 0.15, edge, 0, 4.34, z, enclosure);
  const fixture = mat("#fff1c8"); fixture.emissive.set("#ffe1a0"); fixture.emissiveIntensity = 0.8;
  for (const z of [-2, 1.8]) {
    box(2.1, 0.08, 0.58, dark, 0, 4.25, z, enclosure, true);
    box(1.95, 0.035, 0.46, fixture, 0, 4.19, z, enclosure);
  }
  box(1.65, 2.95, 0.12, wood, 3.8, 1.47, 4.24, enclosure, true);
  box(1.34, 1.05, 0.025, dark, 3.8, 2.19, 4.165, enclosure);
  box(1.12, 0.85, 0.026, glass, 3.8, 2.19, 4.14, enclosure);
  sphere(0.055, brass, 3.24, 1.21, 4.11, enclosure);
  box(0.2, 0.04, 0.06, brass, 3.31, 1.21, 4.09, enclosure);
  const poster = (title: string, subtitle: string, bg: string, orbit: boolean) => canvasTexture(512, 680, c => {
    c.fillStyle = bg; c.fillRect(0, 0, 512, 680); c.fillStyle = "#f6edd6"; c.font = "bold 49px sans-serif"; c.textAlign = "center"; c.fillText(title, 256, 100);
    c.strokeStyle = "#eadba8"; c.lineWidth = 4;
    if (orbit) for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(256, 330, 60 + i * 35, 60 + i * 35, 0, 0, Math.PI * 2); c.stroke(); }
    else for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(95 + i * 45, 465); c.lineTo(256, 210); c.lineTo(420 - i * 25, 465); c.stroke(); }
    c.fillStyle = "#f6edd6"; c.font = "22px sans-serif"; c.fillText(subtitle, 256, 596);
  });
  for (const [i, title, subtitle, color] of [[0,"STAY CURIOUS","THERE IS ALWAYS MORE TO DISCOVER","#56715f"], [1,"MAKE THINGS","IMAGINATION IS A PRACTICE","#b07850"]] as const) {
    box(1.53, 2.02, 0.08, wood, -2.8 + i * 2.7, 2.52, 4.23, enclosure);
    const p = face(1.38, 1.86, poster(title, subtitle, color, i === 0), -2.8 + i * 2.7, 2.52, 4.18, enclosure); p.rotation.y = Math.PI;
  }
  // Right-wall pinboard and low storage make looking behind you a worthwhile discovery.
  const pinboard = new THREE.Group(); pinboard.position.set(5.02, 2.5, -0.8); pinboard.rotation.y = -Math.PI / 2; enclosure.add(pinboard);
  box(2.9, 1.85, 0.09, wood, 0, 0, 0, pinboard);
  box(2.72, 1.67, 0.04, mat("#b5956a"), 0, 0, 0.07, pinboard);
  for (let i = 0; i < 5; i++) {
    const p = box(0.54, 0.7, 0.012, i % 2 ? paper : trim, -0.95 + (i % 3) * 0.9, i < 3 ? 0.35 : -0.47, 0.12, pinboard);
    p.rotation.z = (i % 3 - 1) * 0.12;
    sphere(0.024, brass, p.position.x, p.position.y + 0.28, 0.145, pinboard);
  }
  box(0.7, 1.0, 2.2, edge, 4.66, 0.5, -0.9, enclosure, true); obstacle(4.66, -0.9, 0.7, 2.2);
  for (const z of [-1.6, -0.9, -0.2]) { box(0.035, 0.7, 0.63, wood, 4.29, 0.5, z, enclosure); sphere(0.035, brass, 4.25, 0.64, z, enclosure); }
  const outdoors = new THREE.Group(); scene.add(outdoors);
  box(35, 0.12, 40, mat("#839b6b"), -15, -0.45, 0, outdoors);
  for (let i = 0; i < 12; i++) {
    const x = -9 - i % 3 * 3.3, z = -15 + i * 2.7;
    cylinder(0.16, 0.23, 4, wood, x, 1.6, z, outdoors);
    const canopy = sphere(2.3, i % 2 ? green : mat("#9caa72"), x, 4.2, z, outdoors); canopy.scale.y = 1.25;
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
  obstacle(3.63, -3.93, 2.05, 0.71);
  // Teacher's desk and nine individual pupil desks, each with a modeled chair.
  function table(x: number, z: number, width: number, depth: number, height: number) {
    const group = new THREE.Group(); group.position.set(x, 0, z); world.add(group);
    box(width, 0.13, depth, edge, 0, height, 0, group, true);
    for (const dx of [-width / 2 + 0.12, width / 2 - 0.12]) for (const dz of [-depth / 2 + 0.12, depth / 2 - 0.12]) cylinder(0.035, 0.045, height, dark, dx, height / 2, dz, group);
    box(width - 0.16, 0.2, 0.06, wood, 0, height - 0.2, -depth / 2 + 0.1, group);
    return group;
  }
  table(-1.2, -2.8, 2.75, 1.03, 1.22);
  obstacle(-1.2, -2.8, 2.75, 1.03);
  box(1.3, 0.62, 0.07, wood, -1.2, 0.77, -2.36);
  book(-1.8, 1.33, -2.76, bookColors[0]); book(-1.83, 1.43, -2.78, bookColors[2]);
  cylinder(0.1, 0.1, 0.22, pot, -0.4, 1.39, -2.7);
  for (let i = 0; i < 4; i++) { const p = cylinder(0.012, 0.012, 0.35, bookColors[i], -0.46 + i * 0.036, 1.6, -2.7); p.rotation.z = (i - 2) * 0.12; }
  const bell = new THREE.Group(); bell.position.set(-0.9, 1.3, -2.65); world.add(bell);
  cylinder(0.16, 0.18, 0.035, charcoal, 0, 0, 0, bell); sphere(0.135, brass, 0, 0.04, 0, bell); cylinder(0.025, 0.025, 0.07, brass, 0, 0.19, 0, bell); tag(bell, "bell");
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const x = -2.9 + col * 2.53, z = -0.8 + row * 1.62;
    obstacle(x, z + 0.33, 1.55, 1.58);
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
  obstacle(-4.43, -3.68, 0.8, 0.8); obstacle(4.46, 3.54, 0.85, 0.85);
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

  let currentView: View = "walk", lightMode: Lighting = "day", paused = false;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  function pick(x: number, y: number) {
    if (paused) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    // Raycast all visible room geometry so discoveries cannot be clicked through walls or furniture.
    const hits = raycaster.intersectObject(world, true).filter(hit => {
      let item: THREE.Object3D | null = hit.object;
      while (item) { if (!item.visible) return false; item = item.parent; }
      return !(hit.object instanceof THREE.Points);
    });
    if (hits[0]) {
      let item: THREE.Object3D | null = hits[0].object;
      while (item && !item.userData.discovery) item = item.parent;
      if (item) onSelect(item.userData.discovery);
    }
  }
  const walker = createWalker(camera, renderer.domElement, obstacles, pick);
  function background() {
    scene.background = currentView === "room" ? null : new THREE.Color(lightMode === "night" ? "#172738" : lightMode === "golden" ? "#eed2a5" : "#bedbdc");
  }
  function view(which: View) {
    currentView = which;
    controls.enabled = which === "room" && !paused;
    walker.setEnabled(which !== "room");
    enclosure.visible = outdoors.visible = which !== "room";
    camera.fov = which === "room" ? 36 : host.clientWidth < 700 ? 78 : 68;
    camera.updateProjectionMatrix();
    if (which === "room") {
      const narrow = host.clientWidth < 700;
      camera.position.set(narrow ? 18 : 13.4, narrow ? 15.5 : 11.6, narrow ? 23.2 : 17.2);
      controls.minDistance = 7; controls.target.set(0, 1.2, 0); controls.update();
    } else if (which === "seat") walker.teleport(-0.4, -1.73, 0, 0.06);
    else if (which === "board") walker.teleport(3.4, -2.35, 0.16, 0.2);
    else walker.teleport(1.0, 3.65, 0.14, -0.025);
    background();
    renderer.shadowMap.needsUpdate = true;
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h); camera.aspect = w / h;
    camera.fov = currentView === "room" ? 36 : w < 700 ? 78 : 68;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize(); view("walk");
  let down = { x: 0, y: 0 }, orbitPointers = 0, wasMulti = false;
  const pointerDown = (e: PointerEvent) => { if (currentView !== "room") return; orbitPointers++; wasMulti = orbitPointers > 1; down = { x: e.clientX, y: e.clientY }; };
  const pointerUp = (e: PointerEvent) => {
    if (currentView !== "room") return;
    orbitPointers = Math.max(0, orbitPointers - 1);
    if (!wasMulti && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 7) pick(e.clientX, e.clientY);
  };
  const pointerCancel = () => { orbitPointers = 0; wasMulti = true; };
  renderer.domElement.addEventListener("pointerdown", pointerDown); renderer.domElement.addEventListener("pointerup", pointerUp); renderer.domElement.addEventListener("pointercancel", pointerCancel);
  const contextLost = (e: Event) => { e.preventDefault(); onFailure?.(); walker.pause(true); };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let spinning = false, visible = true, firstFrame = true, last = performance.now(), poseTime = 0;
  const visibility = () => { visible = !document.hidden; last = performance.now(); };
  document.addEventListener("visibilitychange", visibility);
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; if (!visible) return;
    if (currentView === "room") { if (!paused) controls.update(); } else walker.update(dt);
    if (spinning && !reducedMotion) globe.rotation.y += dt * 0.55;
    if (!reducedMotion) dust.rotation.y += dt * 0.007;
    if (now - poseTime > 80) { onPose?.(walker.pose()); poseTime = now; }
    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; onReady(); }
  });
  return {
    view, lesson,
    input: walker.input,
    step: walker.step,
    pause: (value: boolean) => { paused = value; walker.pause(value); controls.enabled = currentView === "room" && !value; },
    rotate: (amount: number) => {
      if (currentView !== "room") { walker.turn(amount); return; }
      const offset = camera.position.clone().sub(controls.target); offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), amount); camera.position.copy(controls.target).add(offset); controls.update();
    },
    zoom: (factor: number) => {
      if (currentView !== "room") return;
      const offset = camera.position.clone().sub(controls.target); offset.multiplyScalar(factor).clampLength(controls.minDistance, controls.maxDistance); camera.position.copy(controls.target).add(offset); controls.update();
    },
    spin: () => { spinning = !spinning; if (reducedMotion) globe.rotation.y += Math.PI / 3; return spinning; },
    lighting: (mode: Lighting) => {
      renderer.shadowMap.needsUpdate = true;
      lightMode = mode; background(); fixture.emissiveIntensity = mode === "night" ? 2.5 : 0.8;
      if (mode === "day") { hemi.intensity = 2.7; sun.intensity = 4.2; sun.color.set(0xffe5bb); sun.position.set(-7, 9, 5); fill.intensity = 1.1; lamp.intensity = 5; renderer.toneMappingExposure = 1.28; }
      if (mode === "golden") { hemi.intensity = 1.8; sun.intensity = 5; sun.color.set(0xffb85c); sun.position.set(-8, 4.5, 3); fill.intensity = 0.7; lamp.intensity = 8; renderer.toneMappingExposure = 1.18; }
      if (mode === "night") { hemi.intensity = 0.7; sun.intensity = 0.9; sun.color.set(0x9baeff); sun.position.set(-7, 9, 5); fill.intensity = 0.4; lamp.intensity = 70; renderer.toneMappingExposure = 1.15; }
    },
    dispose: () => {
      renderer.setAnimationLoop(null); observer.disconnect(); controls.dispose(); walker.dispose(); document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("pointerdown", pointerDown); renderer.domElement.removeEventListener("pointerup", pointerUp); renderer.domElement.removeEventListener("pointercancel", pointerCancel); renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      scene.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Points) o.geometry.dispose(); });
      textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
