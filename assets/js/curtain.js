// Sheer chiffon at the hero's left window — invisible until a gust blows it into the room.
// Hung from a fixed rod along the top edge. The wind (from the left) swings the drop to the right
// in a soft S, twisting the cloth as it goes so it narrows at the waist and flares open at the end,
// with ripples running down it. Shaded as sheer white chiffon: faint face-on, bright where it folds
// edge-on, rolled edges catching the light, overlapping layers adding up like real gauze.
import * as THREE from 'three';

const VERT = /* glsl */`
uniform float uTime, uGust;
uniform vec2 uOrigin, uSize;  // top-left corner and size of the hanging panel (world units)
varying vec3 vNormal, vView;
varying vec2 vUv;

// centreline of the drop: a pendulum bend (angle a + b·v) with an S-curve travelling along it
vec3 spine(float v, out vec3 T) {
  float t = uTime, g = uGust, H = uSize.y;
  float a = g * (0.3 + 0.08 * sin(t * 0.9));
  float b = g * (0.85 + 0.18 * sin(t * 0.7 + 1.0)) + 1e-3;
  float th = a + b * v;
  vec3 c = vec3(
    uOrigin.x + uSize.x * 0.5 + H * (cos(a) - cos(th)) / b,
    uOrigin.y - H * (sin(th) - sin(a)) / b,
    0.0);
  T = normalize(vec3(sin(th), -cos(th), 0.0));
  vec3 side = vec3(-T.y, T.x, 0.0);
  // the S: a slow wave rolling down the cloth, growing towards the free end
  float s = sin(v * 4.2 - t * 1.6) + 0.35 * sin(v * 9.0 - t * 2.9);
  c += side * g * v * 0.42 * s;
  c.z += g * v * (0.7 + 0.3 * sin(v * 3.0 - t * 1.2));
  return c;
}

vec3 cloth(float u, float v) {  // u: across the panel, v: down from the rod
  float t = uTime, g = uGust;
  vec3 T;
  vec3 c = spine(v, T);
  vec3 side = vec3(-T.y, T.x, 0.0);
  vec3 depth = vec3(0.0, 0.0, 1.0);
  // the cloth twists around its drop: edge-on at the waist, opening again at the end
  float tw = g * (1.5 * v + 0.5 * sin(v * 5.0 - t * 1.7) + 0.25 * sin(u * 3.0 + t));
  vec3 across = cos(tw) * side + sin(tw) * depth;
  vec3 nrm = cross(T, across);
  // width: full on the rod, gathered at the waist, flaring wide at the end
  float w = uSize.x * (1.0 - g * (0.38 * sin(min(v * 1.25, 1.0) * 3.1416) - 0.45 * v * v));
  vec3 p = c + across * (u - 0.5) * w;
  // fluttering ripples across the cloth and rolled, lifting edges
  float edge = pow(abs(u - 0.5) * 2.0, 3.0);
  p += nrm * g * v * (0.14 * sin(u * 7.0 + v * 9.0 - t * 6.0) + 0.06 * sin(u * 17.0 - v * 5.0 - t * 9.0));
  p += nrm * g * edge * (0.18 + 0.12 * sin(t * 2.3 + v * 4.0)) * (0.3 + v);
  // soft pleats gathered on the rod, smoothed out as the wind takes the cloth
  p += nrm * 0.05 * sin(u * 43.98) * (1.0 - 0.7 * g);
  return p;
}

void main() {
  float u = position.x + 0.5, v = 0.5 - position.y, e = 0.008;
  vec3 p = cloth(u, v);
  vec3 du = cloth(u + e, v) - cloth(u - e, v);
  vec3 dv = cloth(u, v + e) - cloth(u, v - e);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vNormal = normalize(normalMatrix * cross(du, dv));
  vView = -mv.xyz;
  vUv = vec2(u, v);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */`
uniform float uGust, uOpacity;
uniform vec3 uWhite, uShade;
varying vec3 vNormal, vView;
varying vec2 vUv;

void main() {
  vec3 n = normalize(vNormal), vd = normalize(vView);
  if (dot(n, vd) < 0.0) n = -n;
  float facing = clamp(dot(n, vd), 0.0, 1.0);
  // sheer cloth: little light face-on, much more where it folds away from the eye
  float fold = pow(1.0 - facing, 2.2);
  float light = 0.5 + 0.5 * dot(n, normalize(vec3(-0.35, 0.65, 0.68)));
  // rolled edges and the hem catch a bright line of light
  float rim = smoothstep(0.44, 0.5, abs(vUv.x - 0.5)) + smoothstep(0.95, 1.0, vUv.y);
  vec3 col = mix(uShade, uWhite, clamp(0.35 + 0.65 * light + 0.4 * fold, 0.0, 1.0));
  float a = uOpacity * uGust * (0.2 + 1.5 * fold + 0.8 * rim);
  // the cloth thins out right at the rod so it seems to come from beyond the frame
  a *= smoothstep(0.0, 0.06, vUv.y);
  gl_FragColor = vec4(col * a, 1.0); // additive: overlapping layers build up like real gauze
  #include <colorspace_fragment>
}
`;

export function createCurtain({ segments = [56, 96] } = {}) {
  const uniforms = {
    uTime: { value: 0 }, uGust: { value: 0 }, uOpacity: { value: 0.17 },
    uOrigin: { value: new THREE.Vector2() }, uSize: { value: new THREE.Vector2(1, 1) },
    uWhite: { value: new THREE.Color(0xfffdf8) }, uShade: { value: new THREE.Color(0xb9b2a6) },
  };
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, segments[0], segments[1]),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcColorFactor }),
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
