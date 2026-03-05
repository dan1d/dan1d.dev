"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MatrixRainProps {
  columnCount?: number;
  rowCount?: number;
  speed?: number;
  opacity?: number;
  color?: string;
  area?: [number, number];
}

function buildGlyphAtlas(color: string): THREE.CanvasTexture {
  const COLS = 16;
  const ROWS = 16;
  const CELL = 64;
  const W = COLS * CELL;
  const H = ROWS * CELL;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "transparent";
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = color;
  ctx.font = `bold ${CELL - 8}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Build character set: Latin A-Z + digits 0-9
  const chars: string[] = [];

  // Latin A-Z
  for (let i = 0; i < 26; i++) {
    chars.push(String.fromCharCode(65 + i));
  }

  // Digits 0-9
  for (let i = 0; i <= 9; i++) {
    chars.push(String(i));
  }

  // Fill 256 cells (16x16 grid), cycling through chars
  for (let i = 0; i < COLS * ROWS; i++) {
    const ch = chars[i % chars.length];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * CELL + CELL / 2;
    const y = row * CELL + CELL / 2;
    ctx.fillText(ch, x, y);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export default function MatrixRain({
  columnCount = 40,
  rowCount = 15,
  speed = 1.0,
  opacity = 0.85,
  color = "#00ff41",
  area = [20, 10],
}: MatrixRainProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = columnCount * rowCount;

  // Atlas texture (created once on client)
  const atlas = useMemo(() => buildGlyphAtlas(color), [color]);

  // Per-column data: speed multiplier and phase offset
  const columnData = useMemo(() => {
    const speeds = new Float32Array(columnCount);
    const phases = new Float32Array(columnCount);
    for (let c = 0; c < columnCount; c++) {
      speeds[c] = 0.5 + Math.random() * 1.2;
      phases[c] = Math.random() * Math.PI * 2;
    }
    return { speeds, phases };
  }, [columnCount]);

  // Per-instance glyph UV offsets (random atlas cell per instance)
  const glyphOffsets = useMemo(() => {
    const COLS = 16;
    const ROWS = 16;
    const offsets = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const cell = Math.floor(Math.random() * COLS * ROWS);
      offsets[i * 2] = (cell % COLS) / COLS;
      offsets[i * 2 + 1] = Math.floor(cell / COLS) / ROWS;
    }
    return offsets;
  }, [count]);

  // Shared geometry and material
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);
    // Inject per-instance UV offsets as an instanced attribute
    const uvAttr = new THREE.InstancedBufferAttribute(glyphOffsets, 2);
    geo.setAttribute("instanceUVOffset", uvAttr);
    return geo;
  }, [glyphOffsets]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: atlas },
        uCellSize: { value: 1 / 16 },
        uOpacity: { value: opacity },
      },
      vertexShader: `
        attribute vec2 instanceUVOffset;
        attribute float instanceBrightness;
        varying vec2 vUv;
        varying float vBrightness;

        void main() {
          vUv = uv * (1.0 / 16.0) + instanceUVOffset;
          vBrightness = instanceBrightness;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uAtlas;
        uniform float uOpacity;
        varying vec2 vUv;
        varying float vBrightness;

        void main() {
          vec4 tex = texture2D(uAtlas, vUv);
          // Use texture alpha as glyph mask; tint with brightness
          float alpha = tex.r * vBrightness * uOpacity;
          gl_FragColor = vec4(tex.rgb * vBrightness, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Add per-instance brightness attribute to geometry
    const brightnessAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(count).fill(1.0),
      1
    );
    geometry.setAttribute("instanceBrightness", brightnessAttr);

    return mat;
  }, [atlas, opacity, geometry, count]);

  // Scratch objects for frame updates
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const brightnessArray = useMemo(() => new Float32Array(count), [count]);

  // Column vertical offsets (track each column's scroll position)
  const columnOffsets = useRef<Float32Array>(
    (() => {
      const arr = new Float32Array(columnCount);
      for (let c = 0; c < columnCount; c++) {
        arr[c] = Math.random() * rowCount;
      }
      return arr;
    })()
  );

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const [areaW, areaH] = area;
    const cellW = areaW / columnCount;
    const cellH = areaH / rowCount;
    const { speeds, phases } = columnData;
    const offsets = columnOffsets.current;

    for (let c = 0; c < columnCount; c++) {
      // Advance this column's offset
      offsets[c] += delta * speed * speeds[c];
      if (offsets[c] > rowCount) offsets[c] -= rowCount;

      const trailHead = offsets[c]; // fractional row position of trail head

      for (let r = 0; r < rowCount; r++) {
        const idx = c * rowCount + r;

        // World position: column left-to-right, row top-to-bottom
        const x = -areaW / 2 + c * cellW + cellW / 2;
        const y = areaH / 2 - r * cellH - cellH / 2;

        dummy.position.set(x, y, 0);
        dummy.scale.set(cellW * 0.9, cellH * 0.9, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);

        // Compute brightness: bright at trail head, fading behind
        // Distance behind the head (wrap around)
        let dist = trailHead - r;
        if (dist < 0) dist += rowCount;

        // Trail length is ~40% of rowCount
        const trailLen = rowCount * 0.4;
        let brightness = 0;
        if (dist < 1) {
          // Bright leading character
          brightness = 1.0;
        } else if (dist < trailLen) {
          brightness = Math.max(0, 1.0 - (dist - 1) / trailLen);
          brightness = brightness * brightness; // quadratic falloff
        }

        // Add subtle flicker
        brightness *= 0.85 + 0.15 * Math.sin(phases[c] + r * 1.7 + _state.clock.elapsedTime * 8);

        brightnessArray[idx] = brightness;
      }
    }

    // Update brightness attribute
    const brightnessAttr = mesh.geometry.getAttribute(
      "instanceBrightness"
    ) as THREE.InstancedBufferAttribute;
    brightnessAttr.array.set(brightnessArray);
    brightnessAttr.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      position={[0, 0, 0]}
      frustumCulled={false}
    />
  );
}
