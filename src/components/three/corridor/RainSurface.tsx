import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

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

    // Per-column random properties
    float cH = hash(vec2(id.x, 0.0));
    float speed = (0.3 + cH * 1.4) * uSpeed;
    float phase = hash(vec2(id.x, 7.3)) * 60.0;
    float tLen = 6.0 + hash(vec2(id.x, 13.7)) * 14.0;

    // Rain head position (top-to-bottom)
    float headPos = mod(uTime * speed + phase, uRows + tLen + 5.0);
    float rowTop = uRows - id.y;
    float d = headPos - rowTop;

    // Trail brightness
    float trail = 0.0;
    float isHead = 0.0;
    if (d > 0.0 && d < 1.5) {
      trail = 1.0;
      isHead = 1.0;
    } else if (d >= 1.5 && d < tLen) {
      float t = (d - 1.5) / (tLen - 1.5);
      trail = (1.0 - t) * (1.0 - t) * 0.85 + 0.15;
    }

    float bright = max(uBase, trail);

    // Character from atlas (buzzes periodically)
    float buzzRate = 4.0 + cH * 4.0;
    float seed = hash(id + floor(uTime * buzzRate) * 0.013);
    float ci = floor(seed * 256.0);
    vec2 atlasPos = vec2(mod(ci, 16.0), floor(ci / 16.0));
    vec2 atlasUv = (atlasPos + cell) / 16.0;
    float charA = texture2D(uAtlas, atlasUv).r;

    float alpha = charA * bright * uBright * fog;
    if (alpha < 0.008) discard;

    // Head chars are white-green, trail is green
    vec3 color;
    if (isHead > 0.5) {
      color = vec3(0.7, 1.0, 0.8);
    } else {
      color = vec3(0.0, 0.35 + bright * 0.65, 0.05 + bright * 0.15);
    }

    gl_FragColor = vec4(color * bright, alpha);
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
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}
