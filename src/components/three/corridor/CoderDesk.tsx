import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Seated Coder Silhouette (facing camera — front view) ───────────────────

function buildCoderTexture(): THREE.CanvasTexture {
  const W = 160, H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";

  // Head
  ctx.beginPath();
  ctx.ellipse(80, 28, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillRect(72, 46, 16, 10);

  // Shoulders + upper torso (slightly hunched forward)
  ctx.beginPath();
  ctx.moveTo(28, 68);
  ctx.lineTo(50, 56);
  ctx.lineTo(80, 53);
  ctx.lineTo(110, 56);
  ctx.lineTo(132, 68);
  ctx.lineTo(126, 140);
  ctx.lineTo(34, 140);
  ctx.closePath();
  ctx.fill();

  // Left arm reaching toward keyboard
  ctx.beginPath();
  ctx.moveTo(28, 68);
  ctx.lineTo(18, 74);
  ctx.lineTo(22, 140);
  ctx.lineTo(44, 150);
  ctx.lineTo(50, 148);
  ctx.lineTo(34, 100);
  ctx.closePath();
  ctx.fill();

  // Right arm reaching toward keyboard
  ctx.beginPath();
  ctx.moveTo(132, 68);
  ctx.lineTo(142, 74);
  ctx.lineTo(138, 140);
  ctx.lineTo(116, 150);
  ctx.lineTo(110, 148);
  ctx.lineTo(126, 100);
  ctx.closePath();
  ctx.fill();

  // Hands (on keyboard area)
  ctx.fillRect(40, 146, 16, 8);
  ctx.fillRect(104, 146, 16, 8);

  // Lap / seated lower body
  ctx.beginPath();
  ctx.moveTo(34, 140);
  ctx.lineTo(30, 190);
  ctx.lineTo(130, 190);
  ctx.lineTo(126, 140);
  ctx.closePath();
  ctx.fill();

  // Left leg (bent, seated)
  ctx.beginPath();
  ctx.moveTo(30, 190);
  ctx.lineTo(26, 240);
  ctx.lineTo(48, 240);
  ctx.lineTo(58, 190);
  ctx.closePath();
  ctx.fill();

  // Right leg (bent, seated)
  ctx.beginPath();
  ctx.moveTo(102, 190);
  ctx.lineTo(112, 240);
  ctx.lineTo(134, 240);
  ctx.lineTo(130, 190);
  ctx.closePath();
  ctx.fill();

  // Shoes / feet
  ctx.fillRect(20, 238, 32, 10);
  ctx.fillRect(108, 238, 32, 10);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Monitor Screen Shader (mini code rain) ─────────────────────────────────

const SCREEN_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SCREEN_FRAG = `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 grid = vec2(40.0, 24.0);
    vec2 id = floor(vUv * grid);
    vec2 cell = fract(vUv * grid);

    float cH = hash(vec2(id.x, 0.0));
    float speed = (0.4 + cH * 1.2) * 1.5;
    float phase = hash(vec2(id.x, 7.3)) * 40.0;
    float tLen = 3.0 + hash(vec2(id.x, 13.7)) * 6.0;

    float headPos = mod(uTime * speed + phase, grid.y + tLen + 4.0);
    float rowTop = grid.y - id.y;
    float d = headPos - rowTop;

    float trail = 0.0;
    float isHead = 0.0;
    if (d > 0.0 && d < 1.2) {
      trail = 1.0;
      isHead = 1.0;
    } else if (d >= 1.2 && d < tLen) {
      float t = (d - 1.2) / (tLen - 1.2);
      trail = (1.0 - t) * (1.0 - t);
    }

    float bright = max(0.08, trail);

    float seed = hash(id + floor(uTime * (3.0 + cH * 3.0)) * 0.017);
    float charMask = step(0.15, cell.x) * step(cell.x, 0.85)
                   * step(0.1, cell.y) * step(cell.y, 0.9)
                   * step(0.3, seed);

    float alpha = charMask * bright * 0.9;
    if (alpha < 0.01) discard;

    vec3 color;
    if (isHead > 0.5) {
      color = vec3(0.7, 1.0, 0.8);
    } else {
      color = vec3(0.0, 0.35 + bright * 0.55, 0.05 + bright * 0.1);
    }

    gl_FragColor = vec4(color * bright, alpha);
  }
`;

// ─── Monitor ────────────────────────────────────────────────────────────────

function Monitor({ position, rotation = [0, 0, 0] as [number, number, number] }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const logoTex = useMemo(() => buildLogoTexture(), []);

  const screenMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: SCREEN_VERT,
        fragmentShader: SCREEN_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  const monW = 0.7, monH = 0.45, bezelT = 0.03;

  return (
    <group position={position} rotation={rotation}>
      {/* Monitor bezel */}
      <mesh position={[0, monH / 2, 0]}>
        <boxGeometry args={[monW + bezelT * 2, monH + bezelT * 2, 0.03]} />
        <meshBasicMaterial color="#050505" />
      </mesh>

      {/* Screen — code rain */}
      <mesh position={[0, monH / 2, 0.017]}>
        <planeGeometry args={[monW, monH]} />
        <primitive object={screenMat} ref={matRef} attach="material" />
      </mesh>

      {/* "dan1d.dev" on the back of the monitor */}
      <mesh position={[0, monH / 2, -0.017]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[monW * 0.8, monH * 0.4]} />
        <meshBasicMaterial
          map={logoTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.9}
        />
      </mesh>

      {/* Screen glow */}
      <pointLight position={[0, monH / 2, 0.4]} color="#00ff41" intensity={2.5} distance={3.5} decay={2} />

      {/* Stand neck */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
        <meshBasicMaterial color="#080808" />
      </mesh>

      {/* Stand base */}
      <mesh position={[0, -0.07, 0.02]}>
        <boxGeometry args={[0.2, 0.015, 0.12]} />
        <meshBasicMaterial color="#080808" />
      </mesh>
    </group>
  );
}

// ─── "dan1d.dev" back-of-monitor logo texture ───────────────────────────────

function buildLogoTexture(): THREE.CanvasTexture {
  const W = 256, H = 128;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  // Glow
  ctx.shadowColor = "#00ff41";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#00ff41";
  ctx.font = "bold 32px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("dan1d.dev", W / 2, H / 2);
  // Second pass for extra glow
  ctx.shadowBlur = 8;
  ctx.fillText("dan1d.dev", W / 2, H / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Desk ───────────────────────────────────────────────────────────────────

// Build a canvas texture with "dan1d" glowing text
function buildDan1dTexture(): THREE.CanvasTexture {
  const W = 256, H = 64;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  // Glow effect
  ctx.shadowColor = "#00ff41";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#00ff41";
  ctx.font = "bold 36px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("dan1d", W / 2, H / 2);
  // Second pass for extra glow
  ctx.shadowBlur = 6;
  ctx.fillText("dan1d", W / 2, H / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function Desk({ position }: { position: [number, number, number] }) {
  const dan1dTex = useMemo(() => buildDan1dTexture(), []);

  return (
    <group position={position}>
      {/* Desktop surface */}
      <mesh>
        <boxGeometry args={[1.4, 0.04, 0.65]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>

      {/* dan1d text on the desktop surface */}
      <mesh position={[0, 0.022, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.18]} />
        <meshBasicMaterial
          map={dan1dTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.8}
        />
      </mesh>

      {/* Desk edge highlight */}
      <lineSegments position={[0, 0.021, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.4, 0.001, 0.65)]} />
        <lineBasicMaterial color="#00ff41" transparent opacity={0.12} />
      </lineSegments>

      {/* Four legs */}
      {[
        [-0.65, -0.38, -0.28],
        [0.65, -0.38, -0.28],
        [-0.65, -0.38, 0.28],
        [0.65, -0.38, 0.28],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
          <meshBasicMaterial color="#080808" />
        </mesh>
      ))}

      {/* Keyboard */}
      <mesh position={[0.05, 0.03, 0.12]}>
        <boxGeometry args={[0.45, 0.015, 0.15]} />
        <meshBasicMaterial color="#080808" />
      </mesh>
      {/* Keyboard glow */}
      <mesh position={[0.05, 0.039, 0.12]}>
        <planeGeometry args={[0.42, 0.12]} />
        <meshBasicMaterial color="#00ff41" transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Mouse */}
      <mesh position={[0.5, 0.03, 0.12]}>
        <boxGeometry args={[0.06, 0.015, 0.09]} />
        <meshBasicMaterial color="#080808" />
      </mesh>
    </group>
  );
}

// ─── Chair ──────────────────────────────────────────────────────────────────

function Chair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Seat */}
      <mesh>
        <boxGeometry args={[0.5, 0.04, 0.45]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>

      {/* Backrest */}
      <mesh position={[0, 0.32, -0.21]}>
        <boxGeometry args={[0.48, 0.6, 0.03]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>

      {/* Chair post */}
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.04, 0.4, 0.04]} />
        <meshBasicMaterial color="#080808" />
      </mesh>

      {/* Chair base (5-star) */}
      {[0, 72, 144, 216, 288].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const len = 0.22;
        return (
          <mesh key={deg} position={[Math.sin(rad) * len * 0.5, -0.43, Math.cos(rad) * len * 0.5]} rotation={[0, -rad, 0]}>
            <boxGeometry args={[0.03, 0.02, len]} />
            <meshBasicMaterial color="#080808" />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Seated Coder Silhouette ────────────────────────────────────────────────

function CoderSilhouette({ position }: { position: [number, number, number] }) {
  const tex = useMemo(() => buildCoderTexture(), []);
  const groupRef = useRef<THREE.Group>(null);

  // Subtle typing sway
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.z = Math.sin(t * 2.5) * 0.008;
    groupRef.current.position.y = position[1] + Math.sin(t * 3.2) * 0.005;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Dark body */}
      <mesh scale={[1.0, 1.5, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.1} color="#030803" side={THREE.DoubleSide} />
      </mesh>
      {/* Green rim glow */}
      <mesh position={[0, 0, -0.02]} scale={[1.06, 1.56, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={tex}
          transparent
          opacity={0.12}
          color="#00ff41"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── PC Tower ────────────────────────────────────────────────────────────────

function PCTower({ position }: { position: [number, number, number] }) {
  const logoTex = useMemo(() => buildLogoTexture(), []);

  const caseW = 0.25, caseH = 0.65, caseD = 0.5;

  return (
    <group position={position}>
      {/* Case body */}
      <mesh position={[0, caseH / 2, 0]}>
        <boxGeometry args={[caseW, caseH, caseD]} />
        <meshBasicMaterial color="#060606" />
      </mesh>

      {/* Case edges */}
      <lineSegments position={[0, caseH / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(caseW, caseH, caseD)]} />
        <lineBasicMaterial color="#00ff41" transparent opacity={0.08} />
      </lineSegments>

      {/* "dan1d.dev" logo on the side facing camera (+z) */}
      <mesh position={[0, caseH / 2, caseD / 2 + 0.001]}>
        <planeGeometry args={[caseW * 0.85, caseH * 0.25]} />
        <meshBasicMaterial
          map={logoTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.7}
        />
      </mesh>

      {/* Power LED */}
      <mesh position={[caseW * 0.3, caseH * 0.85, caseD / 2 + 0.002]}>
        <circleGeometry args={[0.008, 8]} />
        <meshBasicMaterial color="#00ff41" />
      </mesh>

      {/* Subtle front panel glow */}
      <pointLight position={[0, caseH / 2, caseD / 2 + 0.1]} color="#00ff41" intensity={0.3} distance={1} decay={2} />
    </group>
  );
}

// ─── Composed Coder Desk Scene ──────────────────────────────────────────────
// Layout: camera approaches from +z. Person faces +z (toward camera).
// Monitor is on desk between person and camera, angled so screen is visible.

export interface CoderDeskProps {
  position?: [number, number, number];
}

export function CoderDesk({ position = [0, 0, 0] }: CoderDeskProps) {
  const deskY = -0.55;
  const chairOffset = -0.55; // chair behind person (further from camera)

  return (
    <group position={position}>
      {/* Desk */}
      <Desk position={[0, deskY, 0]} />

      {/* Main monitor — angled ~25° left so screen faces camera */}
      <Monitor
        position={[-0.15, deskY + 0.02, -0.15]}
        rotation={[0, 0.4, 0]}
      />

      {/* Second monitor — angled right, adds depth */}
      <Monitor
        position={[0.45, deskY + 0.02, -0.12]}
        rotation={[0, -0.35, 0]}
      />

      {/* PC tower on the floor, right side of desk */}
      <PCTower position={[1.05, deskY - 0.58, -0.05]} />

      {/* Chair behind person */}
      <Chair position={[0, deskY - 0.02, chairOffset]} />

      {/* Coder sitting, facing camera (+z) */}
      <CoderSilhouette position={[0.1, deskY + 0.15, chairOffset + 0.05]} />
    </group>
  );
}
