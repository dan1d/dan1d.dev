import { useRef, useMemo, useLayoutEffect, createContext, useContext } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, SpotLight, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { CORRIDOR } from "./CorridorStructure";
import { createCodeMaterial } from "./CodeMaterial";

// ─── The Operator's Desk ────────────────────────────────────────────────────
// A real 3D set at the end of the corridor, seen the way Neo sees the Matrix:
// every surface is a solid built from falling glyphs. Geometry is fully
// modelled (steel sled desk, ultrawide on a stand, keyboard with live keys,
// tower with fans and a glass side, office chair on a five-star base, a hooded
// figure with headphones) and every piece wears the triplanar code material,
// with density and brightness chosen per "material" so steel, fabric, skin and
// glass still read differently. The monitor throws a volumetric cone through
// floating dust. The coder faces the camera (film cheat) so we see both them
// and the screen.
//
// Layout (world y): floor at -H/2, desk top 0.74 above it. Camera looks from +z.

const FLOOR_Y = -CORRIDOR.H / 2;
const DESK_H = 0.74;
const DESK_TOP = FLOOR_Y + DESK_H; // top surface of the desk
const GREEN = "#00ff41";

// ─── Materials (shared) ─────────────────────────────────────────────────────

// Code materials, tuned per surface. Built once the atlas is known and
// handed to every sub-component through context.
type Mats = Record<
  "deskTop" | "steel" | "darkSteel" | "chrome" | "plastic" | "matte" | "leather" | "hoodie" | "hood" | "shadow" | "skin" | "ceramic" | "glass" | "pcb" | "led" | "ledDim" | "cable",
  THREE.Material
>;
const MatsCtx = createContext<Mats | null>(null);
function useMats(): Mats {
  const m = useContext(MatsCtx);
  if (!m) throw new Error("CoderDesk materials missing: render inside <CoderDesk>");
  return m;
}
function buildMats(atlas: THREE.Texture): Mats {
  const code = (o: Parameters<typeof createCodeMaterial>[1]) => createCodeMaterial(atlas, o);
  return {
    // Big surfaces get big glyphs (≈6–8 cm) so the code reads as code, not texture
    deskTop: code({ scale: 14, base: 0.12, bright: 1.5, rim: 0.6, fill: 0.006 }),
    steel: code({ scale: 24, base: 0.22, bright: 1.6, tint: [0.45, 1.0, 0.6], rim: 1.0, fill: 0.012 }),
    darkSteel: code({ scale: 18, base: 0.1, bright: 1.2, rim: 0.7, fill: 0.006 }),
    chrome: code({ scale: 28, base: 0.3, bright: 1.7, tint: [0.6, 1.0, 0.75], rim: 1.2, fill: 0.014 }),
    plastic: code({ scale: 22, base: 0.1, bright: 1.2, rim: 0.7, fill: 0.006 }),
    matte: code({ scale: 16, base: 0.08, bright: 1.1, rim: 0.55, fill: 0.004 }),
    leather: code({ scale: 15, base: 0.11, bright: 1.35, rim: 0.8, fill: 0.006 }),
    hoodie: code({ scale: 16, base: 0.1, bright: 1.5, rim: 1.1, fill: 0.006 }),
    // The hood carries the densest, brightest rain — it is the figure's face
    hood: code({ scale: 22, base: 0.16, bright: 1.9, speed: 1.5, rim: 0.3, fill: 0.012, tint: [0.15, 1.0, 0.4] }),
    // Face under the hood: near-black, the glasses do the talking
    shadow: code({ scale: 40, base: 0.03, bright: 0.5, rim: 0.12, fill: 0.0 }),
    skin: code({ scale: 30, base: 0.26, bright: 1.6, tint: [0.7, 1.0, 0.8], rim: 1.3, fill: 0.016 }),
    ceramic: code({ scale: 28, base: 0.2, bright: 1.4, rim: 0.9, fill: 0.01 }),
    glass: code({ scale: 24, base: 0.05, bright: 0.9, rim: 1.0, transparent: true }),
    pcb: code({ scale: 34, base: 0.16, bright: 1.3, rim: 0.6, fill: 0.008 }),
    led: new THREE.MeshBasicMaterial({ color: GREEN, toneMapped: false }),
    ledDim: new THREE.MeshBasicMaterial({ color: "#1e8f3c" }),
    cable: code({ scale: 40, base: 0.22, bright: 1.3, rim: 1.0, fill: 0.008 }),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type V3 = [number, number, number];

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/** A capsule spanning two points — the building block for limbs and tubes. */
function Limb({ from, to, r, material, cast = true }: {
  from: V3; to: V3; r: number; material: THREE.Material; cast?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const { mid, len, quat } = useMemo(() => {
    _a.set(...from); _b.set(...to);
    const dir = _b.clone().sub(_a);
    const len = Math.max(0.001, dir.length() - r * 2);
    const mid = _a.clone().add(_b).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(_up, dir.normalize());
    return { mid, len, quat };
  }, [from, to, r]);
  return (
    <mesh ref={ref} position={mid} quaternion={quat} material={material} castShadow={cast} receiveShadow>
      <capsuleGeometry args={[r, len, 6, 14]} />
    </mesh>
  );
}

/** A cable following a smooth curve through the given points. */
function Cable({ points, r = 0.006 }: { points: V3[]; r?: number }) {
  const M = useMats();
  const geom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.6);
    return new THREE.TubeGeometry(curve, 48, r, 8, false);
  }, [points, r]);
  return <mesh geometry={geom} material={M.cable} castShadow />;
}

// ─── Monitor screen shader (mini code rain) ─────────────────────────────────

const SCREEN_VERT = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const SCREEN_FRAG = `
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 grid = vec2(56.0, 26.0);
    vec2 id = floor(vUv * grid);
    vec2 cell = fract(vUv * grid);
    float cH = hash(vec2(id.x, 0.0));
    float speed = (0.4 + cH * 1.2) * 1.5;
    float phase = hash(vec2(id.x, 7.3)) * 40.0;
    float tLen = 3.0 + hash(vec2(id.x, 13.7)) * 6.0;
    float headPos = mod(uTime * speed + phase, grid.y + tLen + 4.0);
    float d = headPos - (grid.y - id.y);
    float trail = 0.0; float isHead = 0.0;
    if (d > 0.0 && d < 1.2) { trail = 1.0; isHead = 1.0; }
    else if (d >= 1.2 && d < tLen) { float t = (d - 1.2) / (tLen - 1.2); trail = (1.0 - t) * (1.0 - t); }
    float bright = max(0.06, trail);
    float seed = hash(id + floor(uTime * (3.0 + cH * 3.0)) * 0.017);
    float charMask = step(0.15, cell.x) * step(cell.x, 0.85) * step(0.1, cell.y) * step(cell.y, 0.9) * step(0.3, seed);
    // Soft vignette + scanlines so it reads as a lit panel, not a sticker
    float vig = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x) * smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
    float scan = 0.85 + 0.15 * sin(vUv.y * 900.0);
    float alpha = charMask * bright * 0.9 * (0.55 + 0.45 * vig) * scan;
    if (alpha < 0.01) discard;
    vec3 color = isHead > 0.5 ? vec3(0.75, 1.0, 0.82) : vec3(0.0, 0.35 + bright * 0.55, 0.05 + bright * 0.1);
    gl_FragColor = vec4(color * bright, alpha);
  }
`;

const LOGO_FADE_START = 7.6; // when the camera settles
const LOGO_FADE_DUR = 1.6;

function buildTextTexture(text: string, W: number, H: number, px: number, blur: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.font = `bold ${px}px monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = GREEN; ctx.shadowBlur = blur; ctx.fillStyle = GREEN;
  ctx.fillText(text, W / 2, H / 2);
  ctx.shadowBlur = blur / 2; ctx.fillText(text, W / 2, H / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── Monitor ────────────────────────────────────────────────────────────────

const MON_W = 1.12, MON_H = 0.42, BEZEL = 0.012;

function Monitor({ position }: { position: V3 }) {
  const M = useMats();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const logoMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const logoTex = useMemo(() => buildTextTexture("dan1d.dev", 512, 128, 64, 6), []);
  const spotTarget = useMemo(() => new THREE.Object3D(), []);
  const screenMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, vertexShader: SCREEN_VERT, fragmentShader: SCREEN_FRAG,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (matRef.current) matRef.current.uniforms.uTime.value = t;
    if (logoMatRef.current) logoMatRef.current.opacity = t < LOGO_FADE_START ? 0 : Math.min(1, (t - LOGO_FADE_START) / LOGO_FADE_DUR);
  });

  const cy = 0.12 + MON_H / 2; // screen center above the desk

  return (
    <group position={position}>
      {/* Panel body — slim, slightly thicker at the back where the electronics live */}
      <RoundedBox args={[MON_W + BEZEL * 2, MON_H + BEZEL * 2, 0.018]} radius={0.004} smoothness={3}
        position={[0, cy, 0]} material={M.plastic} castShadow receiveShadow />
      <RoundedBox args={[MON_W * 0.72, MON_H * 0.78, 0.05]} radius={0.01} smoothness={3}
        position={[0, cy, -0.032]} material={M.darkSteel} castShadow />
      {/* Back-panel vent slots */}
      {[-0.12, -0.06, 0, 0.06, 0.12].map((y) => (
        <mesh key={y} position={[0, cy + y, -0.058]} material={M.matte}>
          <boxGeometry args={[MON_W * 0.5, 0.012, 0.004]} />
        </mesh>
      ))}

      {/* Screen: code rain, then glass over it so the room reflects in the panel */}
      <mesh position={[0, cy, 0.0095]}>
        <planeGeometry args={[MON_W, MON_H]} />
        <primitive object={screenMat} ref={matRef} attach="material" />
      </mesh>
      <mesh position={[0, cy, 0.0105]}>
        <planeGeometry args={[MON_W * 0.9, MON_H * 0.45]} />
        <meshBasicMaterial ref={logoMatRef} map={logoTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0} toneMapped={false} />
      </mesh>
      <mesh position={[0, cy, 0.0115]} material={M.glass}>
        <planeGeometry args={[MON_W, MON_H]} />
      </mesh>

      {/* Power LED on the chin */}
      <mesh position={[MON_W * 0.42, cy - MON_H / 2 - 0.004, 0.01]} material={M.led}>
        <boxGeometry args={[0.02, 0.003, 0.002]} />
      </mesh>

      {/* Stand: steel neck into a weighted chrome foot */}
      <mesh position={[0, 0.07, -0.05]} material={M.steel} castShadow>
        <boxGeometry args={[0.06, 0.14, 0.025]} />
      </mesh>
      <RoundedBox args={[0.34, 0.012, 0.2]} radius={0.005} position={[0, 0.006, -0.02]} material={M.chrome} castShadow receiveShadow />

      {/* Key light: the screen itself. Volumetric cone toward the coder, through the dust. */}
      <primitive object={spotTarget} position={[0, cy - 0.25, -0.7]} />
      <SpotLight
        position={[0, cy, -0.02]}
        target={spotTarget}
        color={GREEN}
        intensity={22}
        distance={3.2}
        angle={0.62}
        penumbra={0.7}
        decay={2}
        attenuation={2.6}
        anglePower={5}
        radiusTop={0.02}
        radiusBottom={0.9}
        opacity={0.22}
        volumetric
      />
    </group>
  );
}

// ─── Keyboard with live keys ────────────────────────────────────────────────

const KEY_COLS = 15, KEY_ROWS = 5, KEY_PITCH = 0.0275;

function Keyboard({ position }: { position: V3 }) {
  const M = useMats();
  const inst = useRef<THREE.InstancedMesh>(null);
  const heatRef = useRef<Float32Array>(new Float32Array(KEY_COLS * KEY_ROWS));
  const nextRef = useRef(0);
  const dark = useMemo(() => new THREE.Color(0, 0, 0), []);
  const hot = useMemo(() => new THREE.Color(0, 1, 0), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const w = KEY_COLS * KEY_PITCH + 0.02, d = KEY_ROWS * KEY_PITCH + 0.02;

  useLayoutEffect(() => {
    const m = inst.current; if (!m) return;
    const o = new THREE.Object3D();
    let i = 0;
    for (let r = 0; r < KEY_ROWS; r++) for (let c = 0; c < KEY_COLS; c++) {
      o.position.set((c - (KEY_COLS - 1) / 2) * KEY_PITCH, 0.006, (r - (KEY_ROWS - 1) / 2) * KEY_PITCH);
      o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, dark); i++;
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [dark]);

  useFrame(({ clock }) => {
    const m = inst.current; if (!m) return;
    const t = clock.elapsedTime;
    const heat = heatRef.current;
    if (t > nextRef.current) {
      heat[Math.floor(Math.random() * heat.length)] = 1;
      nextRef.current = t + 0.05 + Math.random() * 0.12;
    }
    for (let i = 0; i < heat.length; i++) {
      if (heat[i] <= 0.001) continue;
      heat[i] *= 0.86;
      tmp.copy(dark).lerp(hot, heat[i]);
      m.setColorAt(i, tmp);
      if (heat[i] < 0.001) { heat[i] = 0; m.setColorAt(i, dark); }
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <group position={position}>
      <RoundedBox args={[w, 0.016, d]} radius={0.004} smoothness={2} position={[0, 0.008, 0]} material={M.plastic} castShadow receiveShadow />
      <instancedMesh ref={inst} args={[undefined, undefined, KEY_COLS * KEY_ROWS]} position={[0, 0.016, 0]} material={M.plastic} castShadow>
        <boxGeometry args={[KEY_PITCH * 0.82, 0.009, KEY_PITCH * 0.82]} />
      </instancedMesh>
      {/* Under-glow */}
      <mesh position={[0, 0.017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.96, d * 0.92]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Desk ───────────────────────────────────────────────────────────────────

const DESK_W = 1.6, DESK_D = 0.74;

function Desk() {
  const M = useMats();
  const etchTex = useMemo(() => buildTextTexture("dan1d", 256, 64, 36, 10), []);
  const y = DESK_TOP;
  return (
    <group>
      {/* Top: clear-coated slab with a soft bullnose */}
      <RoundedBox args={[DESK_W, 0.045, DESK_D]} radius={0.012} smoothness={4}
        position={[0, y - 0.0225, 0]} material={M.deskTop} castShadow receiveShadow />
      {/* Etched name, barely there */}
      <mesh position={[-0.35, y + 0.0015, 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 0.125]} />
        <meshBasicMaterial map={etchTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.35} toneMapped={false} />
      </mesh>

      {/* Steel sled frame: two side loops + rear beam + cable tray */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (DESK_W / 2 - 0.08), 0, 0]}>
          <mesh position={[0, y - 0.045 - (DESK_H - 0.09) / 2, -0.28]} material={M.steel} castShadow>
            <boxGeometry args={[0.035, DESK_H - 0.09, 0.035]} />
          </mesh>
          <mesh position={[0, y - 0.045 - (DESK_H - 0.09) / 2, 0.28]} material={M.steel} castShadow>
            <boxGeometry args={[0.035, DESK_H - 0.09, 0.035]} />
          </mesh>
          <mesh position={[0, FLOOR_Y + 0.02, 0]} material={M.steel} castShadow>
            <boxGeometry args={[0.04, 0.03, DESK_D - 0.06]} />
          </mesh>
          <mesh position={[0, y - 0.07, 0]} material={M.steel}>
            <boxGeometry args={[0.035, 0.03, DESK_D - 0.1]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, y - 0.09, -0.3]} material={M.darkSteel} castShadow>
        <boxGeometry args={[DESK_W - 0.2, 0.05, 0.03]} />
      </mesh>
      <mesh position={[0.2, y - 0.12, -0.22]} material={M.darkSteel} castShadow>
        <boxGeometry args={[0.7, 0.06, 0.12]} />
      </mesh>
    </group>
  );
}

// ─── Small props ────────────────────────────────────────────────────────────

function Mouse({ position }: { position: V3 }) {
  const M = useMats();
  return (
    <group position={position}>
      <RoundedBox args={[0.062, 0.03, 0.105]} radius={0.014} smoothness={4} position={[0, 0.015, 0]} material={M.plastic} castShadow />
      <mesh position={[0, 0.03, -0.022]} rotation={[0, 0, Math.PI / 2]} material={M.ledDim}>
        <cylinderGeometry args={[0.006, 0.006, 0.008, 12]} />
      </mesh>
    </group>
  );
}

function Mug({ position }: { position: V3 }) {
  const M = useMats();
  return (
    <group position={position}>
      <mesh position={[0, 0.048, 0]} material={M.ceramic} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.096, 24, 1, false]} />
      </mesh>
      <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.035, 24]} />
        <meshBasicMaterial color="#020402" />
      </mesh>
      <mesh position={[0.045, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.ceramic} castShadow>
        <torusGeometry args={[0.022, 0.006, 8, 20]} />
      </mesh>
    </group>
  );
}

function Notebook({ position }: { position: V3 }) {
  const M = useMats();
  return (
    <group position={position} rotation={[0, -0.18, 0]}>
      <RoundedBox args={[0.19, 0.012, 0.25]} radius={0.003} position={[0, 0.006, 0]} material={M.matte} castShadow receiveShadow />
      <mesh position={[-0.09, 0.006, 0]} material={M.chrome}>
        <boxGeometry args={[0.008, 0.016, 0.22]} />
      </mesh>
    </group>
  );
}

// ─── PC tower (glass side facing the desk, fans spinning) ───────────────────

const CASE_W = 0.24, CASE_H = 0.5, CASE_D = 0.5;

function Fan({ position, rotation = [0, 0, 0] as V3, r = 0.055, speed = 14 }: { position: V3; rotation?: V3; r?: number; speed?: number }) {
  const M = useMats();
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (blades.current) blades.current.rotation.z += dt * speed; });
  return (
    <group position={position} rotation={rotation}>
      <mesh material={M.ledDim}>
        <torusGeometry args={[r, 0.004, 8, 32]} />
      </mesh>
      <mesh material={M.plastic}>
        <cylinderGeometry args={[r * 0.28, r * 0.28, 0.012, 16]} />
      </mesh>
      <group ref={blades}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]} position={[0, 0, 0]} material={M.plastic}>
            <boxGeometry args={[r * 0.9, r * 0.32, 0.004]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function PCTower({ position }: { position: V3 }) {
  const M = useMats();
  const logoTex = useMemo(() => buildTextTexture("dan1d.dev", 512, 128, 64, 6), []);
  const logoRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (logoRef.current) logoRef.current.opacity = t < LOGO_FADE_START ? 0 : Math.min(0.75, ((t - LOGO_FADE_START) / LOGO_FADE_DUR) * 0.75);
  });
  const hy = CASE_H / 2;
  return (
    <group position={position}>
      {/* Chassis: top, bottom, back, right side (left side is glass) */}
      <mesh position={[0, CASE_H - 0.01, 0]} material={M.darkSteel} castShadow receiveShadow>
        <boxGeometry args={[CASE_W, 0.02, CASE_D]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} material={M.darkSteel} castShadow receiveShadow>
        <boxGeometry args={[CASE_W, 0.02, CASE_D]} />
      </mesh>
      <mesh position={[CASE_W / 2 - 0.01, hy, 0]} material={M.darkSteel} castShadow>
        <boxGeometry args={[0.02, CASE_H, CASE_D]} />
      </mesh>
      <mesh position={[0, hy, -CASE_D / 2 + 0.01]} material={M.darkSteel} castShadow>
        <boxGeometry args={[CASE_W, CASE_H, 0.02]} />
      </mesh>
      {/* Feet */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * (CASE_W / 2 - 0.03), 0.01, sz * (CASE_D / 2 - 0.05)]} material={M.plastic}>
          <cylinderGeometry args={[0.012, 0.012, 0.02, 12]} />
        </mesh>
      ))}

      {/* Front panel: brushed face, intake fan behind a slotted grille, power ring */}
      <RoundedBox args={[CASE_W, CASE_H - 0.04, 0.018]} radius={0.006} smoothness={3}
        position={[0, hy, CASE_D / 2 - 0.009]} material={M.darkSteel} castShadow receiveShadow />
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0, hy - 0.12 + i * 0.03, CASE_D / 2 + 0.001]} material={M.matte}>
          <boxGeometry args={[CASE_W * 0.7, 0.012, 0.003]} />
        </mesh>
      ))}
      <mesh position={[0.06, CASE_H - 0.06, CASE_D / 2 + 0.002]} material={M.led}>
        <torusGeometry args={[0.011, 0.0025, 8, 24]} />
      </mesh>
      <mesh position={[0, hy - 0.16, CASE_D / 2 + 0.002]}>
        <planeGeometry args={[CASE_W * 0.85, 0.06]} />
        <meshBasicMaterial ref={logoRef} map={logoTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0} toneMapped={false} />
      </mesh>

      {/* Interior, seen through the glass on the -x side */}
      <group position={[0, hy, 0]}>
        <mesh position={[CASE_W / 2 - 0.025, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={M.pcb}>
          <planeGeometry args={[CASE_D * 0.85, CASE_H * 0.85]} />
        </mesh>
        {/* CPU cooler */}
        <Fan position={[CASE_W / 2 - 0.09, 0.08, -0.05]} rotation={[0, -Math.PI / 2, 0]} r={0.045} speed={10} />
        {/* RAM sticks */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[CASE_W / 2 - 0.04, 0.08, 0.06 + i * 0.016]} material={M.pcb} castShadow>
            <boxGeometry args={[0.03, 0.11, 0.006]} />
          </mesh>
        ))}
        {/* GPU with a lit edge */}
        <mesh position={[CASE_W / 2 - 0.09, -0.06, 0.02]} material={M.plastic} castShadow>
          <boxGeometry args={[0.12, 0.035, 0.26]} />
        </mesh>
        <mesh position={[CASE_W / 2 - 0.152, -0.06, 0.02]} material={M.led}>
          <boxGeometry args={[0.003, 0.004, 0.24]} />
        </mesh>
        {/* Rear exhaust + front intake fans */}
        <Fan position={[0, 0.1, -CASE_D / 2 + 0.03]} r={0.05} speed={13} />
        <Fan position={[0, -0.02, CASE_D / 2 - 0.03]} r={0.06} speed={11} />
        {/* Cable spaghetti along the floor of the case */}
        <Cable points={[[0.02, -0.2, -0.2], [-0.03, -0.18, -0.05], [0.04, -0.19, 0.1], [0.0, -0.14, 0.18]]} r={0.005} />
        <Cable points={[[0.06, 0.2, -0.2], [0.02, 0.16, -0.08], [0.05, 0.05, 0.0]]} r={0.004} />
        {/* Interior light */}
        <pointLight position={[-0.04, 0.05, 0]} color={GREEN} intensity={0.9} distance={0.7} decay={2} />
      </group>
      {/* Tempered glass side */}
      <mesh position={[-CASE_W / 2 + 0.002, hy, 0]} rotation={[0, Math.PI / 2, 0]} material={M.glass}>
        <planeGeometry args={[CASE_D - 0.02, CASE_H - 0.04]} />
      </mesh>
      {/* Glass edge trim */}
      <mesh position={[-CASE_W / 2 + 0.004, hy, 0]} material={M.darkSteel}>
        <boxGeometry args={[0.004, CASE_H - 0.03, 0.012]} />
      </mesh>
    </group>
  );
}

// ─── Chair ──────────────────────────────────────────────────────────────────

function Chair({ position }: { position: V3 }) {
  const M = useMats();
  const seatY = FLOOR_Y + 0.46;
  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Seat cushion + back with a slight recline, lumbar and headrest */}
      <RoundedBox args={[0.5, 0.075, 0.48]} radius={0.03} smoothness={4} position={[0, seatY, 0]} material={M.leather} castShadow receiveShadow />
      <group position={[0, seatY + 0.04, -0.22]} rotation={[-0.14, 0, 0]}>
        <RoundedBox args={[0.5, 0.62, 0.07]} radius={0.03} smoothness={4} position={[0, 0.31, 0]} material={M.leather} castShadow receiveShadow />
        <RoundedBox args={[0.42, 0.14, 0.03]} radius={0.015} position={[0, 0.2, 0.045]} material={M.leather} castShadow />
        <RoundedBox args={[0.26, 0.12, 0.06]} radius={0.025} smoothness={4} position={[0, 0.72, 0.01]} material={M.leather} castShadow />
        <mesh position={[0, 0.66, 0]} material={M.darkSteel}>
          <boxGeometry args={[0.04, 0.08, 0.02]} />
        </mesh>
      </group>
      {/* Armrests */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.28, seatY, 0.02]}>
          <mesh position={[0, 0.1, 0]} material={M.darkSteel} castShadow>
            <boxGeometry args={[0.025, 0.2, 0.03]} />
          </mesh>
          <RoundedBox args={[0.06, 0.02, 0.26]} radius={0.008} position={[0, 0.21, 0]} material={M.plastic} castShadow />
        </group>
      ))}
      {/* Gas lift + mechanism */}
      <mesh position={[0, seatY - 0.06, 0]} material={M.darkSteel} castShadow>
        <boxGeometry args={[0.24, 0.04, 0.22]} />
      </mesh>
      <mesh position={[0, (seatY - 0.08 + FLOOR_Y + 0.05) / 2, 0]} material={M.chrome} castShadow>
        <cylinderGeometry args={[0.02, 0.026, seatY - 0.08 - (FLOOR_Y + 0.05), 16]} />
      </mesh>
      <mesh position={[0, FLOOR_Y + 0.065, 0]} material={M.plastic} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.03, 16]} />
      </mesh>
      {/* Five-star base with casters */}
      {[0, 72, 144, 216, 288].map((deg) => {
        const rad = (deg * Math.PI) / 180, len = 0.3;
        return (
          <group key={deg} rotation={[0, -rad, 0]}>
            <mesh position={[0, FLOOR_Y + 0.045, len / 2]} rotation={[0.08, 0, 0]} material={M.chrome} castShadow>
              <boxGeometry args={[0.035, 0.025, len]} />
            </mesh>
            <mesh position={[0, FLOOR_Y + 0.025, len - 0.01]} material={M.plastic} castShadow>
              <sphereGeometry args={[0.026, 12, 10]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─── Glasses: two lenses lit by the screen, with a slow scan and a flicker ──

function Glasses() {
  const M = useMats();
  const lensMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#00ff41", toneMapped: false }), []);
  const scanRef = useRef<THREE.Mesh>(null);
  const base = useMemo(() => new THREE.Color("#00ff41"), []);
  const hot = useMemo(() => new THREE.Color("#c8ffd8"), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // Breathing glow with an occasional hard flicker, like a refresh
    const breathe = 0.7 + 0.3 * Math.sin(t * 1.7);
    const flick = Math.sin(t * 23.0) > 0.985 ? 1 : 0;
    lensMat.color.copy(base).lerp(hot, Math.min(1, breathe * 0.35 + flick));
    if (scanRef.current) {
      scanRef.current.position.y = ((t * 0.35) % 1) * 0.04 - 0.02;
      (scanRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.25 * Math.sin(t * 3.0);
    }
  });
  const y = 0.012, z = 0.098;
  return (
    <group position={[0, y, z]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.041, 0, 0]}>
          <RoundedBox args={[0.052, 0.034, 0.006]} radius={0.008} smoothness={3} material={lensMat} />
          <RoundedBox args={[0.06, 0.042, 0.004]} radius={0.01} smoothness={3} position={[0, 0, -0.002]} material={M.darkSteel} />
        </group>
      ))}
      {/* Bridge and temples */}
      <mesh position={[0, 0.004, -0.001]} material={M.darkSteel}>
        <boxGeometry args={[0.024, 0.004, 0.004]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.074, 0.006, -0.05]} rotation={[0, 0, 0]} material={M.darkSteel}>
          <boxGeometry args={[0.004, 0.004, 0.1]} />
        </mesh>
      ))}
      {/* Scan line drifting across both lenses */}
      <mesh ref={scanRef} position={[0, 0, 0.004]}>
        <planeGeometry args={[0.16, 0.004]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ─── The coder: a real seated figure in a hoodie, hands on the keys ─────────

function Coder({ position, keyboardZ }: { position: V3; keyboardZ: number }) {
  const M = useMats();
  const rig = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const handL = useRef<THREE.Group>(null);
  const handR = useRef<THREE.Group>(null);

  const [x0, , z0] = position; // hip center
  const hipY = FLOOR_Y + 0.5;
  const shoulderY = hipY + 0.58;
  const headY = shoulderY + 0.26;
  const sx = 0.2; // half shoulder width
  const kz = keyboardZ; // wrists land here
  const wristY = DESK_TOP + 0.045;

  // Joint positions (world-ish, relative to the group)
  const shL: V3 = [x0 - sx, shoulderY, z0 - 0.02];
  const shR: V3 = [x0 + sx, shoulderY, z0 - 0.02];
  const elL: V3 = [x0 - sx - 0.07, shoulderY - 0.26, z0 + 0.12];
  const elR: V3 = [x0 + sx + 0.07, shoulderY - 0.26, z0 + 0.12];
  const wrL: V3 = [x0 - 0.15, wristY, kz + 0.02];
  const wrR: V3 = [x0 + 0.15, wristY, kz + 0.02];
  const hipL: V3 = [x0 - 0.1, hipY, z0];
  const hipR: V3 = [x0 + 0.1, hipY, z0];
  const kneeL: V3 = [x0 - 0.13, hipY + 0.02, z0 + 0.38];
  const kneeR: V3 = [x0 + 0.13, hipY + 0.02, z0 + 0.38];
  const ankL: V3 = [x0 - 0.13, FLOOR_Y + 0.05, z0 + 0.34];
  const ankR: V3 = [x0 + 0.13, FLOOR_Y + 0.05, z0 + 0.34];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (rig.current) {
      rig.current.scale.y = 1 + Math.sin(t * 1.4) * 0.006; // breathing
      rig.current.rotation.z = Math.sin(t * 0.7) * 0.006;
    }
    if (head.current) {
      head.current.rotation.x = 0.12 + Math.sin(t * 0.9) * 0.02;
      head.current.rotation.y = Math.sin(t * 0.35) * 0.06;
    }
    // Alternating typing bob
    if (handL.current) handL.current.position.y = Math.max(0, Math.sin(t * 9.1)) * 0.012;
    if (handR.current) handR.current.position.y = Math.max(0, Math.sin(t * 9.1 + 2.1)) * 0.012;
  });

  return (
    <group ref={rig} position={[0, hipY, 0]}>
      <group position={[0, -hipY, 0]}>
        {/* Torso — hoodie body, slight hunch toward the keys */}
        <group position={[x0, (hipY + shoulderY) / 2, z0 + 0.02]} rotation={[0.1, 0, 0]}>
          <mesh material={M.hoodie} castShadow receiveShadow>
            <capsuleGeometry args={[0.19, 0.36, 6, 18]} />
          </mesh>
          {/* Hoodie pocket seam and drawstrings */}
          <mesh position={[0, -0.05, 0.18]} material={M.matte}>
            <boxGeometry args={[0.26, 0.006, 0.01]} />
          </mesh>
          {[-1, 1].map((s) => (
            <Limb key={s} from={[s * 0.05, 0.22, 0.17]} to={[s * 0.06, 0.02, 0.19]} r={0.004} material={M.cable} cast={false} />
          ))}
        </group>
        {/* Shoulders */}
        <mesh position={shL} material={M.hoodie} castShadow><sphereGeometry args={[0.085, 16, 12]} /></mesh>
        <mesh position={shR} material={M.hoodie} castShadow><sphereGeometry args={[0.085, 16, 12]} /></mesh>
        {/* Arms */}
        <Limb from={shL} to={elL} r={0.062} material={M.hoodie} />
        <Limb from={shR} to={elR} r={0.062} material={M.hoodie} />
        <Limb from={elL} to={wrL} r={0.052} material={M.hoodie} />
        <Limb from={elR} to={wrR} r={0.052} material={M.hoodie} />
        {/* Hands */}
        <group ref={handL} position={[0, 0, 0]}>
          <RoundedBox args={[0.075, 0.028, 0.09]} radius={0.012} smoothness={3} position={[wrL[0], wrL[1] - 0.01, wrL[2] + 0.05]} material={M.skin} castShadow />
        </group>
        <group ref={handR} position={[0, 0, 0]}>
          <RoundedBox args={[0.075, 0.028, 0.09]} radius={0.012} smoothness={3} position={[wrR[0], wrR[1] - 0.01, wrR[2] + 0.05]} material={M.skin} castShadow />
        </group>
        {/* Legs */}
        <Limb from={hipL} to={kneeL} r={0.075} material={M.matte} />
        <Limb from={hipR} to={kneeR} r={0.075} material={M.matte} />
        <Limb from={kneeL} to={ankL} r={0.06} material={M.matte} />
        <Limb from={kneeR} to={ankR} r={0.06} material={M.matte} />
        <RoundedBox args={[0.1, 0.06, 0.24]} radius={0.025} smoothness={3} position={[ankL[0], FLOOR_Y + 0.03, ankL[2] + 0.06]} material={M.plastic} castShadow />
        <RoundedBox args={[0.1, 0.06, 0.24]} radius={0.025} smoothness={3} position={[ankR[0], FLOOR_Y + 0.03, ankR[2] + 0.06]} material={M.plastic} castShadow />

        {/* Head: deep hood, face in shadow, glasses lit from the screen */}
        <group ref={head} position={[x0, headY, z0 + 0.02]}>
          <mesh position={[0, -0.1, 0]} material={M.hoodie}>
            <cylinderGeometry args={[0.05, 0.06, 0.09, 14]} />
          </mesh>
          {/* Face: almost black, only a whisper of code, so the glasses carry it */}
          <mesh position={[0, 0, 0.01]} material={M.shadow}>
            <sphereGeometry args={[0.1, 24, 18]} />
          </mesh>
          {/* Hood: a shell wrapped around the head, open toward the camera (+z),
              drooping forward over the brow so the face sits in darkness */}
          <mesh position={[0, 0.04, -0.04]} rotation={[0.3, 0, 0]} scale={[1, 1.14, 1.1]} material={M.hood}>
            <sphereGeometry args={[0.17, 32, 24, Math.PI / 2 + 0.62, Math.PI * 2 - 1.24, 0, Math.PI * 0.76]} />
          </mesh>
          {/* Hood rim thickness (inner shell) */}
          <mesh position={[0, 0.04, -0.04]} rotation={[0.3, 0, 0]} scale={[1, 1.14, 1.1]} material={M.hood}>
            <sphereGeometry args={[0.155, 32, 24, Math.PI / 2 + 0.62, Math.PI * 2 - 1.24, 0, Math.PI * 0.76]} />
          </mesh>
          {/* Peak of the hood, pulled forward over the brow */}
          <mesh position={[0, 0.16, 0.02]} rotation={[0.55, 0, 0]} material={M.hood}>
            <coneGeometry args={[0.13, 0.16, 20, 1, true]} />
          </mesh>
          {/* Hood falling onto the shoulders */}
          <mesh position={[0, -0.16, -0.06]} rotation={[0.15, 0, 0]} material={M.hood}>
            <cylinderGeometry args={[0.175, 0.26, 0.18, 24, 1, true]} />
          </mesh>
          <Glasses />
        </group>
      </group>
    </group>
  );
}

// ─── Atmosphere ─────────────────────────────────────────────────────────────

function Rig({ x, z }: { x: number; z: number }) {
  return (
    <Sparkles
      count={160}
      position={[x, DESK_TOP + 0.5, z - 0.45]}
      scale={[1.9, 1.4, 1.5]}
      size={1.6}
      speed={0.22}
      opacity={0.5}
      color="#a8ffc0"
      noise={0.8}
    />
  );
}

// ─── Composed set ───────────────────────────────────────────────────────────
// Camera approaches from +z. The coder faces +z; the monitor stands between
// coder and camera with its screen toward us. Keyboard lives on the coder's
// side of the monitor so the hands read; the camera-side of the desk carries
// the mug, a notebook and the cables.

export interface CoderDeskProps {
  position?: V3;
  atlas: THREE.Texture;
}

export function CoderDesk({ position = [0, 0, 0], atlas }: CoderDeskProps) {
  const mats = useMemo(() => buildMats(atlas), [atlas]);
  const coderX = 0.08;
  const chairZ = -0.62;
  const kbZ = -0.3;
  const monZ = -0.1;

  return (
    <MatsCtx.Provider value={mats}>
    <group position={[position[0], 0, position[2]]}>
      <Desk />
      <Monitor position={[coderX, DESK_TOP, monZ]} />
      <Keyboard position={[coderX, DESK_TOP, kbZ]} />
      <Mouse position={[coderX + 0.42, DESK_TOP, kbZ + 0.02]} />
      <Mug position={[-0.55, DESK_TOP, 0.2]} />
      <Notebook position={[0.52, DESK_TOP, 0.2]} />

      {/* Cables: monitor → tray → tower, keyboard → tray */}
      <>
        <Cable points={[[coderX, DESK_TOP + 0.14, monZ - 0.06], [coderX + 0.05, DESK_TOP - 0.02, monZ - 0.16], [0.3, DESK_TOP - 0.15, -0.28], [0.75, DESK_TOP - 0.25, -0.3], [1.0, FLOOR_Y + 0.35, -0.2], [1.08, FLOOR_Y + 0.3, -0.05]]} />
        <Cable points={[[coderX - 0.2, DESK_TOP + 0.01, kbZ - 0.08], [coderX - 0.1, DESK_TOP - 0.05, kbZ - 0.3], [0.2, DESK_TOP - 0.16, -0.3]]} r={0.004} />
        <Cable points={[[0.9, FLOOR_Y + 0.02, -0.3], [1.02, FLOOR_Y + 0.02, -0.28], [1.2, FLOOR_Y + 0.02, -0.34]]} r={0.005} />
      </>

      <PCTower position={[1.18, FLOOR_Y, -0.05]} />
      <Chair position={[coderX, 0, chairZ]} />
      <Coder position={[coderX, 0, chairZ + 0.04]} keyboardZ={kbZ} />

      <Rig x={coderX} z={monZ} />
    </group>
    </MatsCtx.Provider>
  );
}
