import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Code material ──────────────────────────────────────────────────────────
// "Neo vision": any geometry rendered as a solid built from falling glyphs.
// The glyph grid is projected triplanar in world space (so it survives any
// shape, instancing included), rain falls down vertical faces and flows along
// horizontal ones, a lambert term gives the form volume, and a fresnel rim
// draws the silhouette. Opaque by default so bodies occlude the rain behind
// them and read as objects; `transparent` gives a sparse, glassy variant.

export interface CodeMaterialOptions {
  /** glyph cells per world unit */
  scale?: number;
  /** resting brightness of the glyph field (0..1) */
  base?: number;
  /** overall multiplier */
  bright?: number;
  /** rain speed multiplier */
  speed?: number;
  /** tint of the trail glyphs */
  tint?: [number, number, number];
  /** fresnel silhouette strength */
  rim?: number;
  /** faint solid fill so dark faces still occlude */
  fill?: number;
  transparent?: boolean;
  /** use instanceColor as an rgb tint multiplier (default: instanceColor.g boosts brightness) */
  instanceTint?: boolean;
}

const VERT = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  varying float vBoost;
  varying vec3 vInst;
  void main() {
    vec3 p = position;
    vec3 n = normal;
    #ifdef USE_INSTANCING
      p = (instanceMatrix * vec4(p, 1.0)).xyz;
      n = mat3(instanceMatrix) * n;
    #endif
    #ifdef USE_INSTANCING_COLOR
      vBoost = instanceColor.g;
      vInst = instanceColor;
    #else
      vBoost = 0.0;
      vInst = vec3(1.0);
    #endif
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * n);
    vViewDir = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uTime;
  uniform float uScale;
  uniform float uBright;
  uniform float uBase;
  uniform float uSpeed;
  uniform vec3 uTint;
  uniform float uRim;
  uniform float uFill;
  uniform float uOpaque;
  uniform float uInstTint;
  uniform float uReveal;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  varying float vBoost;
  varying vec3 vInst;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 an = abs(n);
    // Triplanar pick: uv.y is the axis the rain falls along
    vec2 uv;
    if (an.y >= an.x && an.y >= an.z) uv = vec2(vWorldPos.x, vWorldPos.z);
    else if (an.x >= an.z)            uv = vec2(vWorldPos.z, vWorldPos.y);
    else                               uv = vec2(vWorldPos.x, vWorldPos.y);

    vec2 g = uv * uScale;
    vec2 id = floor(g);
    vec2 cell = fract(g);

    float cH = hash(vec2(id.x, 0.37));
    float speed = (0.35 + cH * 1.3) * uSpeed;
    float phase = hash(vec2(id.x, 7.3)) * 60.0;
    float tLen = 5.0 + hash(vec2(id.x, 13.7)) * 10.0;
    float period = 34.0 + tLen;
    float head = mod(uTime * speed + phase, period);
    float d = mod(head + id.y + period * 8.0, period); // head moves toward -y

    float trail = 0.0; float isHead = 0.0;
    if (d < 1.5) { trail = 1.0; isHead = 1.0; }
    else if (d < tLen) { float t = (d - 1.5) / (tLen - 1.5); trail = (1.0 - t) * (1.0 - t) * 0.85 + 0.15; }

    float charVar = 0.7 + hash(id * 3.17) * 0.6;
    float boost = mix(vBoost, 0.0, uInstTint);
    float bright = max(uBase, max(trail, boost)) * charVar;
    vec3 tint = mix(uTint, uTint * vInst * 1.5, uInstTint);
    float fillMul = mix(1.0, vInst.g, uInstTint);

    float buzz = 3.0 + cH * 4.0;
    float seed = hash(id + floor(uTime * buzz) * 0.013);
    float ci = floor(seed * 256.0);
    vec2 atlasUv = (vec2(mod(ci, 16.0), floor(ci / 16.0)) + cell) / 16.0;
    float charA = texture2D(uAtlas, atlasUv).r;

    vec3 v = normalize(vViewDir);
    float lambert = 0.5 + 0.5 * max(0.0, dot(n, normalize(vec3(0.25, 0.85, 0.45))));
    float rim = pow(1.0 - max(0.0, dot(n, v)), 3.0) * uRim;

    float dist = length(vViewDir);
    float fog = smoothstep(46.0, 3.0, dist);

    // Materialise: cells switch on bottom-up with per-cell jitter as uReveal
    // climbs 0 → 1; a cell flashes white the moment it resolves
    float cellT = hash(id * 0.53 + 0.11) * 0.7 + clamp((vWorldPos.y + 2.0) / 20.0, 0.0, 1.0) * 0.3;
    float rev = smoothstep(cellT - 0.1, cellT, uReveal);
    float flash = rev * (1.0 - smoothstep(cellT, cellT + 0.12, uReveal)) * step(uReveal, 0.999);

    float glyph = charA * bright * uBright * lambert * rev;
    vec3 col = (isHead > 0.5 ? vec3(0.8, 1.0, 0.85) : tint * (0.35 + bright * 0.65)) * glyph;
    col += tint * rim * 0.55 * rev;
    col += vec3(0.0, uFill, uFill * 0.3) * lambert * fillMul * rev;
    col += vec3(0.85, 1.0, 0.9) * charA * flash * 2.2;

    float alpha = mix(clamp(glyph + rim * 0.5, 0.0, 1.0), 1.0, uOpaque);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col * fog, alpha);
  }
`;

const registry = new Set<THREE.ShaderMaterial>();

export function createCodeMaterial(atlas: THREE.Texture, o: CodeMaterialOptions = {}): THREE.ShaderMaterial {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uScale: { value: o.scale ?? 30 },
      uBright: { value: o.bright ?? 1.0 },
      uBase: { value: o.base ?? 0.15 },
      uSpeed: { value: o.speed ?? 1.0 },
      uTint: { value: new THREE.Vector3(...(o.tint ?? [0.0, 1.0, 0.25])) },
      uRim: { value: o.rim ?? 0.9 },
      uFill: { value: o.fill ?? 0.02 },
      uOpaque: { value: o.transparent ? 0.0 : 1.0 },
      uInstTint: { value: o.instanceTint ? 1.0 : 0.0 },
      uReveal: { value: 1.0 },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: !!o.transparent,
    blending: o.transparent ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !o.transparent,
    side: THREE.FrontSide,
  });
  registry.add(mat);
  return mat;
}

/** Mount once per scene: advances uTime on every code material. */
export function CodeClock() {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    registry.forEach((m) => { m.uniforms.uTime.value = t; });
  });
  return null;
}
