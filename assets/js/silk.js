// Silk ribbons in a slow wind — shared by the hero scene.
// Each ribbon is a flat strip bent on the GPU: a centreline swept by layered travelling waves,
// twisted along its length, shaded with MeshPhysicalMaterial (sheen + anisotropy) so it reads as satin.
import * as THREE from 'three';

// x0, x1: span (runs well past the frame) · y, slope, bow: resting path · z, zAmp: depth
// amp, waves, speed, twist: wind · width · phase · lift: how far scroll carries it away
const RIBBONS = [
  { tone: 'gold',   x0: -3.9, x1: 4.2, y: 0.1, slope: -1.1, bow: 0.55, z: -1.5, zAmp: 0.5, amp: 0.26, waves: 1.1, speed: 0.55, twist: 1.25, width: 0.44, phase: 0.0, lift: 1.4 },
  { tone: 'ivory',  x0: -4.2, x1: 4.0, y: -0.75, slope: 1.5, bow: -0.3, z: -2.5, zAmp: 0.6, amp: 0.22, waves: 0.9, speed: 0.42, twist: 1.6, width: 0.3, phase: 2.1, lift: -1.1 },
  { tone: 'onyx',   x0: -4.4, x1: 4.4, y: 1.25, slope: -0.4, bow: 0.25, z: -1.0, zAmp: 0.45, amp: 0.2, waves: 1.3, speed: 0.5, twist: 1.1, width: 0.5, phase: 4.0, lift: 1.8 },
  { tone: 'gold',   x0: -3.6, x1: 3.8, y: -1.3, slope: 0.5, bow: -0.2, z: 1.2, zAmp: 0.35, amp: 0.16, waves: 1.0, speed: 0.6, twist: 1.8, width: 0.16, phase: 5.3, lift: -1.4 },
  { tone: 'ivory',  x0: -4.0, x1: 4.4, y: 1.35, slope: 0.6, bow: -0.15, z: -3.4, zAmp: 0.4, amp: 0.2, waves: 1.0, speed: 0.38, twist: 1.4, width: 0.18, phase: 1.2, lift: 1.2 },
];

const TONES = {
  // champagne satin: metallic body, warm sheen, highlights pulled along the weave
  gold: { color: 0xc6a86a, metalness: 0.55, roughness: 0.3, sheen: 1, sheenColor: 0xf6e2b2, sheenRoughness: 0.32, anisotropy: 0.75, envMapIntensity: 1.25, edge: 0xf1dca8, opacity: 0.95 },
  ivory: { color: 0xe9e1d2, metalness: 0.0, roughness: 0.48, sheen: 1, sheenColor: 0xfff6e6, sheenRoughness: 0.4, anisotropy: 0.5, envMapIntensity: 0.9, edge: 0xffffff, opacity: 0.86 },
  // deep black satin with a champagne sheen and a fine gold selvedge
  onyx: { color: 0x0f0e11, metalness: 0.25, roughness: 0.26, sheen: 1, sheenColor: 0xc6a86a, sheenRoughness: 0.3, anisotropy: 0.8, envMapIntensity: 1.4, clearcoat: 0.35, clearcoatRoughness: 0.2, edge: 0xc6a86a, opacity: 0.97 },
};

const VERT_PARS = /* glsl */`
uniform float uTime, uScroll, uLift, uWidth;
uniform vec4 uPathA;  // x0, x1, y, slope
uniform vec4 uPathB;  // z, zAmp, bow, phase
uniform vec4 uWind;   // amp, waves, speed, twist
uniform vec3 uGust;   // pointer xy (world), strength
varying vec2 vRib;

vec3 silkCentre(float u) {
  float t = uTime, ph = uPathB.w, k = uWind.y * 6.2832;
  float breath = 0.82 + 0.18 * sin(t * 0.13 + ph);
  vec3 c = vec3(
    mix(uPathA.x, uPathA.y, u),
    uPathA.z + uPathA.w * (u - 0.5) + uPathB.z * sin(u * 3.1416),
    uPathB.x + uPathB.y * sin(u * 4.08 + ph));
  // layered travelling waves: the wind moves along the ribbon, never repeating exactly
  float a = uWind.x * breath;
  c.y += a * (0.75 * sin(u * k - t * uWind.z + ph) + 0.25 * sin(u * k * 2.7 - t * uWind.z * 1.6 + ph * 1.7))
       + 0.22 * sin(u * 8.2 - t * 0.21 + ph * 0.5);
  c.z += a * 1.1 * cos(u * k * 0.8 - t * uWind.z * 0.9 + ph);
  c.x += 0.06 * sin(u * 9.0 - t * 0.7 + ph);
  // a soft gust where the cursor is
  vec2 d = c.xy - uGust.xy;
  float g = exp(-dot(d, d) * 0.8) * uGust.z;
  c.z -= g * 0.55;
  c.y += g * 0.12 * sin(u * 22.0 - t * 2.4);
  // scrolling carries the silk up and away, parting it from the bottle
  c.y += uScroll * uLift * (0.6 + 0.4 * u);
  c.z += uScroll * 0.6;
  return c;
}

vec3 silkPoint(float u, float v, out vec3 T, out vec3 A) {
  float e = 0.004;
  vec3 c = silkCentre(u);
  T = normalize(silkCentre(u + e) - silkCentre(u - e));
  vec3 side = normalize(cross(vec3(0.0, 0.0, 1.0), T));
  vec3 depth = cross(T, side);
  float th = uWind.w * sin(u * 13.8 - uTime * 0.45 + uPathB.w * 2.0)
           + 0.35 * sin(u * 5.0 - uTime * 0.3 + uPathB.w);
  A = cos(th) * side + sin(th) * depth;
  return c + A * v * uWidth;
}
`;

const FRAG_PARS = /* glsl */`
uniform float uReveal;
uniform vec3 uEdge;
uniform vec4 uFade;  // fraction of the canvas to fade at left, right, bottom, top
uniform vec2 uRes;
varying vec2 vRib;
`;

const FRAG_ALPHA = /* glsl */`
#include <color_fragment>
{
  float across = abs(vRib.y) * 2.0;
  // fine selvedge line just inside each edge
  diffuseColor.rgb = mix(diffuseColor.rgb, uEdge, smoothstep(0.78, 0.84, across) * (1.0 - smoothstep(0.86, 0.92, across)) * 0.55);
  float a = 1.0 - smoothstep(0.88, 1.0, across);
  // unfurls into frame along its length
  a *= 1.0 - smoothstep(uReveal * 1.15 - 0.15, uReveal * 1.15, vRib.x);
  // never a hard edge where the canvas ends
  vec2 s = gl_FragCoord.xy / uRes;
  a *= smoothstep(0.0, uFade.x + 1e-4, s.x) * smoothstep(0.0, uFade.y + 1e-4, 1.0 - s.x)
     * smoothstep(0.0, uFade.z + 1e-4, s.y) * smoothstep(0.0, uFade.w + 1e-4, 1.0 - s.y);
  diffuseColor.a *= a;
}
`;

export function createSilk({ only = RIBBONS.map((_, i) => i), segments = 220 } = {}) {
  const group = new THREE.Group();
  const shared = {
    uTime: { value: 0 }, uScroll: { value: 0 }, uReveal: { value: 1 },
    uGust: { value: new THREE.Vector3(0, 0, 0) },
    uFade: { value: new THREE.Vector4(0, 0, 0, 0) }, uRes: { value: new THREE.Vector2(1, 1) },
  };
  const geo = new THREE.PlaneGeometry(1, 1, segments, 6);

  only.map((i) => RIBBONS[i]).forEach((r) => {
    const { edge, ...tone } = TONES[r.tone];
    const mat = new THREE.MeshPhysicalMaterial({
      ...tone, side: THREE.DoubleSide, transparent: true,
    });
    const own = {
      uPathA: { value: new THREE.Vector4(r.x0, r.x1, r.y, r.slope) },
      uPathB: { value: new THREE.Vector4(r.z, r.zAmp, r.bow, r.phase) },
      uWind: { value: new THREE.Vector4(r.amp, r.waves, r.speed, r.twist) },
      uWidth: { value: r.width }, uLift: { value: r.lift },
      uEdge: { value: new THREE.Color(edge) },
    };
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, shared, own);
      shader.vertexShader = VERT_PARS + shader.vertexShader
        .replace('#include <beginnormal_vertex>', `
          vec3 sT, sA;
          vec3 sP = silkPoint(position.x + 0.5, position.y, sT, sA);
          vec3 objectNormal = normalize(cross(sT, sA));
          vRib = vec2(position.x + 0.5, position.y);`)
        .replace('#include <begin_vertex>', 'vec3 transformed = sP;');
      shader.fragmentShader = FRAG_PARS + shader.fragmentShader
        .replace('#include <color_fragment>', FRAG_ALPHA);
    };
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false; // shape lives in the shader
    mesh.renderOrder = r.z;     // back-to-front among the ribbons
    group.add(mesh);
  });

  return { group, uniforms: shared };
}
