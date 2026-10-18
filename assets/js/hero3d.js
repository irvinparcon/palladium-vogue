// FELIX bottle — real-time 3D for the hero (Three.js).
// Proportions follow the product photo; the label is drawn from the PV mark at runtime.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createSilk } from './silk.js?v=202610191300';
import { createCurtain } from './curtain.js?v=202610191300';

const stage = document.getElementById('hero3d');
const hero = stage?.closest('.hero');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const still = params.has('still'); // static frame for screenshots
const showCurtain = params.has('curtain'); // with ?still: freeze the curtain mid-gust
const GUST_EVERY = 60; // seconds between the curtain's gusts
const narrow = matchMedia('(max-width: 700px)').matches;

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { return false; }
}

if (stage && hero && webglOK()) init().catch((e) => console.warn('[hero3d]', e));

async function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.autoClear = false;
  // one canvas across the whole hero, behind the text: the curtain uses all of it,
  // the bottle scene draws into the stage's rectangle
  const layer = document.createElement('div');
  layer.className = 'hero__gl';
  layer.setAttribute('aria-hidden', 'true');
  layer.appendChild(renderer.domElement);
  stage.after(layer);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studioEnvironment(), 0.02).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.3, 8.3);

  // ---------- materials ----------
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xc9a465, metalness: 1, roughness: 0.32, envMapIntensity: 1.25 });
  const goldBright = new THREE.MeshPhysicalMaterial({ color: 0xe2c48a, metalness: 1, roughness: 0.18, envMapIntensity: 1.6, emissive: 0x3a2a10 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x020203, metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02,
    envMapIntensity: 1.0,
  });
  // faceted crystal: reflective rather than transmissive so it sparkles over any background
  const crystal = new THREE.MeshPhysicalMaterial({
    color: 0xf6efe2, metalness: 0.05, roughness: 0, clearcoat: 1, clearcoatRoughness: 0, ior: 2.0,
    envMapIntensity: 2.6, flatShading: true, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
  });

  // ---------- bottle ----------
  const bottle = new THREE.Group();
  const W = 1.6, H = 1.71, D = 0.86;

  bottle.add(new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 4, 0.05), glass));

  // gold corner edges, as on the photographed flacon
  const edgeGeo = new THREE.BoxGeometry(0.035, H - 0.06, 0.035);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const e = new THREE.Mesh(edgeGeo, goldBright);
    e.position.set(sx * (W / 2 - 0.012), 0, sz * (D / 2 - 0.012));
    bottle.add(e);
  }
  const shoulder = new THREE.Mesh(new RoundedBoxGeometry(W - 0.02, 0.025, D - 0.02, 2, 0.01), gold);
  shoulder.position.y = H / 2 - 0.005;
  bottle.add(shoulder);

  // collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.38, 64), gold);
  collar.position.y = H / 2 + 0.19;
  bottle.add(collar);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 64), goldBright);
  lip.position.y = H / 2 + 0.39;
  bottle.add(lip);

  // faceted crystal stopper (octagonal lathe, flat shaded)
  const prof = [[0.001, 0], [0.36, 0], [0.56, 0.13], [0.56, 0.3], [0.4, 0.46], [0.001, 0.46]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const stopper = new THREE.Mesh(new THREE.LatheGeometry(prof, 8), crystal);
  stopper.rotation.y = Math.PI / 8;
  stopper.position.y = H / 2 + 0.41;
  bottle.add(stopper);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 32),
    new THREE.MeshPhysicalMaterial({ color: 0xd9bf8f, metalness: 0.6, roughness: 0.2, transparent: true, opacity: 0.55 }));
  stem.position.y = H / 2 + 0.62;
  bottle.add(stem);

  // gold-foil label drawn from the PV mark + Cormorant type
  const label = await makeLabel();
  const labelMat = new THREE.MeshPhysicalMaterial({
    map: label, transparent: true, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.8, color: 0xffffff,
    emissive: 0xffffff, emissiveMap: label, emissiveIntensity: 0.32,
  });
  const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), labelMat);
  labelMesh.position.set(0, -0.06, D / 2 + 0.002);
  bottle.add(labelMesh);

  bottle.position.y = -0.55;
  const rig = new THREE.Group();
  rig.add(bottle);
  scene.add(rig);

  // soft contact shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.4), new THREE.MeshBasicMaterial({
    map: radialTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false,
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.55 - H / 2 - 0.02;
  scene.add(shadow);

  // ---------- lights: warm key, champagne rims ----------
  scene.add(new THREE.AmbientLight(0xffffff, 0.05));
  const key = new THREE.DirectionalLight(0xffe2b8, 0.9); key.position.set(3, 4, 5); scene.add(key);
  const rimL = new THREE.PointLight(0xe8c27e, 22, 12); rimL.position.set(-3, 1.5, -2.5); scene.add(rimL);
  const rimR = new THREE.PointLight(0xf3d9a8, 16, 12); rimR.position.set(3.2, 0.6, -2); scene.add(rimR);
  const top = new THREE.PointLight(0xfff1d6, 10, 8); top.position.set(0, 3.6, 1.5); scene.add(top);

  // ---------- gold dust ----------
  const N = 320, pos = new Float32Array(N * 3), speed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 6;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.5;
    speed[i] = 0.08 + Math.random() * 0.18;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.035, map: radialTexture('rgba(255,226,170,1)', 'rgba(255,226,170,0)'), color: 0xd9b874,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85,
  }));
  scene.add(dust);

  // ---------- silk ribbons in the wind, behind and around the bottle ----------
  const silk = createSilk(narrow ? { only: [0, 1, 3], segments: 140 } : {});
  scene.add(silk.group);

  // ---------- sheer curtain at the window, blown in by a gust every minute and on click ----------
  const curtain = createCurtain(narrow ? { segments: [32, 56] } : {});
  let gust = 0, gustAt = -1e9, nextGust = GUST_EVERY;
  const blow = (now) => {
    // a new gust while one is blowing keeps it at full strength instead of restarting it
    const age = now - gustAt;
    gustAt = age < 6 ? now - Math.min(age, 0.7) : now;
  };
  if (!reduced) hero.addEventListener('pointerdown', () => blow(clock.elapsedTime), { passive: true });

  // ---------- interaction ----------
  const pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 };
  const onStage = new THREE.Vector2(9, 9), lastPointer = new THREE.Vector2(9, 9);
  const track = (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
    const r = stage.getBoundingClientRect();
    onStage.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  addEventListener('pointermove', track, { passive: true });
  addEventListener('pointerdown', track, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => onStage.set(9, 9));

  const view = { x: 0, y: 0, w: 1, h: 1 }; // the stage inside the hero canvas (CSS px, GL origin bottom-left)
  function resize() {
    const H = hero.getBoundingClientRect(), S = stage.getBoundingClientRect();
    renderer.setSize(H.width, H.height, false);
    Object.assign(view, { x: S.left - H.left, y: H.bottom - S.bottom, w: S.width, h: S.height });
    camera.aspect = S.width / Math.max(S.height, 1);
    // keep the bottle comfortably framed on narrow stages
    camera.position.z = camera.aspect < 0.8 ? 8.3 / Math.max(camera.aspect / 0.8, 0.72) : 8.3;
    camera.updateProjectionMatrix();
    const pr = renderer.getPixelRatio();
    silk.uniforms.uView.value.set(view.x * pr, view.y * pr, view.w * pr, view.h * pr);
    // feather the silk where the stage ends inside the page (left edge on desktop, top/bottom always)
    silk.uniforms.uFade.value.set(narrow ? 0 : 0.26, 0, narrow ? 0.3 : 0.2, narrow ? 0.18 : 0.14);
    // the curtain covers the left of the window: about a third of the hero, more on phones
    curtain.layout(H.width / Math.max(H.height, 1), narrow ? 0.55 : 0.36);
    // resizing clears the canvas; redraw when the loop isn't running (still / reduced motion)
    if (reduced || still) draw();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(hero); ro.observe(stage);
  resize();

  function draw() {
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, layer.clientWidth, layer.clientHeight);
    renderer.clear();
    if (gust > 0.002) renderer.render(curtain.scene, curtain.camera);
    renderer.setViewport(view.x, view.y, view.w, view.h);
    renderer.setScissor(view.x, view.y, view.w, view.h);
    renderer.setScissorTest(true);
    renderer.render(scene, camera);
  }

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(hero);

  const clock = new THREE.Clock();
  const intro = reduced || still ? 1 : 0;
  let introT = intro;
  let raf = 0;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = still ? 0 : clock.elapsedTime;
    introT = Math.min(1, introT + dt / 2.6);
    const ease = 1 - Math.pow(1 - introT, 3);

    eased.x += (pointer.x - eased.x) * 0.05;
    eased.y += (pointer.y - eased.y) * 0.05;
    const scroll = Math.min(scrollY / innerHeight, 1);

    // arrive with a slow half-turn, then breathe: gentle sway + follow the cursor
    rig.rotation.y = -0.38 + (1 - ease) * -Math.PI * 1.1 + Math.sin(t * 0.35) * 0.3 * ease + eased.x * 0.45 + scroll * 0.9;
    rig.rotation.x = eased.y * 0.12 + 0.04;
    rig.position.y = Math.sin(t * 0.8) * 0.06 * ease + (1 - ease) * -0.4;
    shadow.material.opacity = 0.65 - Math.sin(t * 0.8) * 0.12;

    // silk: its own clock so the still frame is a composed moment, not t = 0
    const su = silk.uniforms;
    su.uTime.value = (still || reduced ? 0 : clock.elapsedTime) + 14;
    su.uReveal.value = Math.min(1, ease * 1.15);
    su.uScroll.value = scroll;
    // cursor → silk: follow softly, part where it rests, ripple and drag when it sweeps
    const inside = Math.abs(onStage.x) < 1.2 && Math.abs(onStage.y) < 1.2;
    su.uHover.value += ((inside ? 1 : 0) - su.uHover.value) * 0.05;
    if (inside) {
      const fresh = lastPointer.x > 5; // just entered: no jump in velocity
      su.uPointer.value.lerp(onStage, fresh ? 1 : 0.18);
      const vx = fresh ? 0 : (onStage.x - lastPointer.x) / Math.max(dt, 1 / 120);
      const vy = fresh ? 0 : (onStage.y - lastPointer.y) / Math.max(dt, 1 / 120);
      su.uVel.value.lerp({ x: THREE.MathUtils.clamp(vx, -4, 4), y: THREE.MathUtils.clamp(vy, -4, 4) }, 0.08);
      lastPointer.copy(onStage);
    } else {
      lastPointer.set(9, 9);
      su.uVel.value.multiplyScalar(0.92);
    }
    su.uPower.value += (Math.min(su.uVel.value.length() / 2.5, 1) - su.uPower.value) * 0.06;
    silk.group.rotation.y = eased.x * 0.06;

    // curtain: rises fast with the gust, holds while it billows, then falls back and fades away
    const now = clock.elapsedTime;
    if (!reduced && !still && now >= nextGust) { blow(now); nextGust += GUST_EVERY; }
    const age = now - gustAt, smooth = THREE.MathUtils.smoothstep;
    const target = still ? (showCurtain ? 1 : 0) : smooth(age, 0, 0.7) * (1 - smooth(age, 2.4, 6));
    gust = still ? target : gust + (target - gust) * (1 - Math.exp(-dt * 6)); // same pace at any frame rate
    curtain.uniforms.uGust.value = gust;
    curtain.uniforms.uTime.value = still ? 1.3 : now;
    su.uStorm.value = gust;
    silk.group.rotation.x = eased.y * 0.03;

    const p = dustGeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      p[i * 3 + 1] += speed[i] * dt;
      p[i * 3] += Math.sin(t * 0.3 + i) * 0.0012;
      if (p[i * 3 + 1] > 2.6) p[i * 3 + 1] = -2.6;
    }
    dustGeo.attributes.position.needsUpdate = true;
    dust.rotation.y = t * 0.02;

    draw();
  }
  function loop() {
    cancelAnimationFrame(raf);
    const tick = () => { if (!visible) return; frame(); raf = reduced || still ? 0 : requestAnimationFrame(tick); };
    tick();
  }
  loop();
  stage.classList.add('is-3d');
}

// Dark studio with warm softbox strips: gives black glass crisp vertical highlights
function studioEnvironment() {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x050505);
  const box = (w, h, color, intensity, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, y, 0); m.rotation.y += ry;
    env.add(m);
  };
  box(1.2, 8, 0xffe3b5, 3.2, -5, 0, 2.5);   // left strip
  box(1.0, 8, 0xfff0d6, 2.6, 5, 0, 2.0);    // right strip
  box(6, 1.2, 0xffe9c4, 1.6, 0, 5, 1);      // overhead
  box(3, 6, 0xc9a465, 1.2, 0, 0, -6);       // warm back fill for the crystal
  box(10, 2, 0x2a2118, 1, 0, -4, 0);        // floor bounce
  box(4.5, 5, 0xffe6bf, 1.15, -2.2, 0.8, 6);  // large front softbox (reflected by the label & front face)
  return env;
}

function radialTexture(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner); grd.addColorStop(1, outer);
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

async function makeLabel() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1280;
  const g = c.getContext('2d');
  await Promise.all([
    document.fonts.load('500 120px "Cormorant Garamond"'),
    document.fonts.load('400 26px Inter'),
  ]).catch(() => {});
  const foil = g.createLinearGradient(0, 300, 0, 1000);
  foil.addColorStop(0, '#F3E2B4'); foil.addColorStop(0.45, '#C9A465'); foil.addColorStop(0.7, '#EBD39C'); foil.addColorStop(1, '#A88548');
  g.fillStyle = foil; g.strokeStyle = foil;

  const mark = await new Promise((res) => {
    const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null);
    img.src = 'assets/logo/pv-interlace-circle-gold.svg';
  });
  if (mark) {
    // tint the circled mark with the foil gradient
    const mw = 240, mh = 240, mc = document.createElement('canvas');
    mc.width = mw; mc.height = mh;
    const mg = mc.getContext('2d');
    mg.drawImage(mark, 0, 0, mw, mh);
    mg.globalCompositeOperation = 'source-in';
    const mf = mg.createLinearGradient(0, 0, 0, mh);
    mf.addColorStop(0, '#F3E2B4'); mf.addColorStop(0.6, '#C9A465'); mf.addColorStop(1, '#A88548');
    mg.fillStyle = mf; mg.fillRect(0, 0, mw, mh);
    g.drawImage(mc, (1024 - mw) / 2, 232);
  }
  g.fillRect(452, 498, 120, 2.5);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const spaced = (txt, y, font, track) => {
    g.font = font;
    const chars = [...txt], widths = chars.map((ch) => g.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + track * (chars.length - 1);
    let x = 512 - total / 2;
    g.textAlign = 'left';
    chars.forEach((ch, i) => { g.fillText(ch, x, y); x += widths[i] + track; });
  };
  spaced('FELIX', 680, '500 150px "Cormorant Garamond", Georgia, serif', 46);
  spaced('MAISON DE PARFUM', 770, '400 30px Inter, sans-serif', 13);
  spaced('EAU DE PARFUM · 100 ML', 1150, '400 24px Inter, sans-serif', 10);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
