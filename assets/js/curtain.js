// Sheer voile at the hero's left window — invisible until a gust blows it into the room.
// Hung from a fixed rod along the top edge; the wind (from the left) swings the drop to the right,
// bending it more towards the hem, with ripples running down the cloth.
import * as THREE from 'three';

const VERT = /* glsl */`
uniform float uTime, uGust;
uniform vec2 uOrigin, uSize;  // top-left corner and size of the hanging panel (world units)
varying vec3 vNormal, vView;
varying vec2 vUv;

vec3 curtain(float u, float v) {  // u: across from the window edge, v: down from the rod
  float t = uTime, g = uGust;
  // blown angle grows down the drop (a + b·v); each part of the width swings a little differently
  float a = g * (0.32 + 0.12 * sin(u * 3.0 + t * 0.9));
  float b = g * (0.95 + 0.25 * sin(u * 2.3 - t * 1.1)) + 1e-3;
  float H = uSize.y;
  vec3 p = vec3(
    uOrigin.x + u * uSize.x * (1.0 - 0.3 * g * v) + H * (cos(a) - cos(a + b * v)) / b,
    uOrigin.y - H * (sin(a + b * v) - sin(a)) / b,
    0.0);
  // ripples racing down the cloth, and soft pleats gathered on the rod
  float w = sin(v * 9.0 - t * 7.0 + u * 4.0) + 0.5 * sin(v * 17.0 - t * 11.0 - u * 6.0);
  p.x += g * v * 0.12 * w;
  p.z += g * v * (0.9 * sin(u * 3.1416) + 0.25 * w) + 0.06 * sin(u * 43.98) * (1.0 - 0.5 * g);
  return p;
}

void main() {
  float u = position.x + 0.5, v = 0.5 - position.y, e = 0.01;
  vec3 p = curtain(u, v);
  vec3 du = curtain(u + e, v) - curtain(u - e, v);
  vec3 dv = curtain(u, v + e) - curtain(u, v - e);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vNormal = normalize(normalMatrix * cross(du, dv));
  vView = -mv.xyz;
  vUv = vec2(u, v);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */`
uniform float uGust, uOpacity;
uniform vec3 uWhite, uGold;
varying vec3 vNormal, vView;
varying vec2 vUv;

void main() {
  vec3 n = normalize(vNormal), vd = normalize(vView);
  // sheer cloth reads denser where it is seen edge-on, in the folds
  float layers = clamp(0.3 / (abs(dot(n, vd)) + 0.12), 0.0, 2.2);
  float light = pow(abs(dot(n, normalize(vec3(-0.4, 0.6, 0.7)))), 3.0);
  vec3 col = mix(uGold, uWhite, 0.45 + 0.55 * light);
  // fine gold pinstripe in the weave and a gold hem
  float thread = smoothstep(0.93, 1.0, abs(sin(vUv.x * 3.1416 * 36.0))) * 0.35;
  float hem = smoothstep(0.965, 0.985, vUv.y);
  col = mix(col, uGold * 1.25, max(thread, hem));
  float a = uOpacity * uGust * (0.45 + 0.55 * layers + thread + hem * 1.5);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`;

export function createCurtain({ segments = [48, 72] } = {}) {
  const uniforms = {
    uTime: { value: 0 }, uGust: { value: 0 }, uOpacity: { value: 0.12 },
    uOrigin: { value: new THREE.Vector2() }, uSize: { value: new THREE.Vector2(1, 1) },
    uWhite: { value: new THREE.Color(0xfffcf5) }, uGold: { value: new THREE.Color(0xc6a86a) },
  };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, segments[0], segments[1]),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  );
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 8);

  // hang the panel from the top-left of the view, covering `width` of it
  function layout(aspect, width) {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const h = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(15)), w = h * aspect;
    uniforms.uOrigin.value.set(-w / 2 - 0.05, h / 2 + 0.05);
    uniforms.uSize.value.set(w * width, h * 1.02);
  }

  return { scene, camera, uniforms, layout };
}
