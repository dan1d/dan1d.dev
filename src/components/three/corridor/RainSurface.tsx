import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { intro, smoothstep } from "./IntroTimeline";

const RAIN_VERT = `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vDist = length(mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const RAIN_FRAG = `
  uniform sampler2D uAtlas;
  uniform float uTime;
  uniform float uCols;
  uniform float uRows;
  uniform float uSpeed;
  uniform float uBright;
  uniform float uBase;
  uniform float uFogFar;
  varying vec2 vUv;
  varying float vDist;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float fog = smoothstep(uFogFar, 1.0, vDist);
    if (fog < 0.005) discard;

    vec2 grid = vec2(uCols, uRows);
    vec2 id = floor(vUv * grid);
    vec2 cell = fract(vUv * grid);

    // Column character: some strands burn, some sit dim, so the surface reads
    // as vertical striping instead of an even wash (the film plate look)
    float cH = hash(vec2(id.x, 0.0));
    float colB = 0.45 + pow(hash(vec2(id.x, 2.1)), 2.0) * 1.1;

    // Two streams per column at different speeds so the flow never looks sparse
    float stream = 0.0;
    float isHead = 0.0;
    for (int s = 0; s < 2; s++) {
      float fs = float(s) * 5.0;
      float speed = (0.3 + hash(vec2(id.x, fs)) * 1.4) * uSpeed;
      float phase = hash(vec2(id.x, 7.3 + fs)) * 60.0;
      float tLen = 6.0 + hash(vec2(id.x, 13.7 + fs)) * 16.0;
      float headPos = mod(uTime * speed + phase, uRows + tLen + 5.0);
      float d = headPos - (uRows - id.y);
      if (d > 0.0 && d < 1.5) { stream = 1.0; isHead = 1.0; }
      else if (d >= 1.5 && d < tLen) {
        float t = (d - 1.5) / (tLen - 1.5);
        stream = max(stream, (1.0 - t) * (1.0 - t) * 0.85 + 0.15);
      }
    }

    float charVariation = 0.6 + hash(id * 3.17) * 0.7;
    float bright = max(uBase * colB, stream) * charVariation;

    // Glints: stray cells flash white-hot for a beat, the sparkle in the plate
    float glint = step(0.994, hash(id * 1.31 + floor(uTime * 5.0) * 0.171));

    // Character from atlas (buzzes periodically); the cell is narrowed so
    // neighbouring columns separate into distinct strands
    float buzzRate = 4.0 + cH * 4.0;
    float seed = hash(id + floor(uTime * buzzRate) * 0.013);
    float ci = floor(seed * 256.0);
    vec2 atlasPos = vec2(mod(ci, 16.0), floor(ci / 16.0));
    vec2 c2 = vec2((cell.x - 0.5) * 1.25 + 0.5, cell.y);
    if (c2.x < 0.0 || c2.x > 1.0) discard;
    vec2 atlasUv = (atlasPos + c2) / 16.0;
    float charA = texture2D(uAtlas, atlasUv).r;

    float alpha = charA * (bright + glint) * uBright * fog;
    if (alpha < 0.008) discard;

    vec3 color;
    if (isHead > 0.5 || glint > 0.5) {
      color = vec3(0.85, 1.0, 0.9);
    } else {
      color = vec3(0.0, 0.42 + bright * 0.58, 0.1 + bright * 0.22);
    }

    gl_FragColor = vec4(color * (bright * 1.3 + glint * 2.5), alpha);
  }
`;

export interface RainSurfaceProps {
  atlas: THREE.CanvasTexture;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  cols: number;
  rows: number;
  speed?: number;
  bright?: number;
  base?: number;
  /** How far fog reaches before fading to black (default 35) */
  fogFar?: number;
  /** [start, end] seconds on the intro clock over which brightness fades to 0 */
  fadeOut?: [number, number];
}

export function RainSurface({
  atlas,
  position,
  rotation,
  size,
  cols,
  rows,
  speed = 1.0,
  bright = 1.0,
  base = 0.1,
  fogFar = 35,
  fadeOut,
}: RainSurfaceProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAtlas: { value: atlas },
          uTime: { value: 0 },
          uCols: { value: cols },
          uRows: { value: rows },
          uSpeed: { value: speed },
          uBright: { value: bright },
          uBase: { value: base },
          uFogFar: { value: fogFar },
        },
        vertexShader: RAIN_VERT,
        fragmentShader: RAIN_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [atlas, cols, rows, speed, bright, base, fogFar]
  );

  useFrame(({ clock }) => {
    const m = matRef.current; if (!m) return;
    m.uniforms.uTime.value = clock.elapsedTime;
    if (fadeOut) m.uniforms.uBright.value = bright * (1 - smoothstep(fadeOut[0], fadeOut[1], intro.t));
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}
