# dan1d.dev — Architecture

## Overview

A cinematic Matrix-themed portfolio built with Next.js 16, React 19, Three.js (WebGL/WebGPU), and WebXR AR. The entire site is designed as an immersive Matrix code vision experience — green-on-black terminal aesthetics, 3D code rain corridors, walking figure silhouettes, and AR experiences.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | SSR, routing, static generation |
| **UI** | React 19 + TypeScript | Component architecture |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **3D Engine** | Three.js 0.183 + R3F 9 | WebGL/WebGPU rendering |
| **3D Utilities** | @react-three/drei 10 | Camera controls, helpers |
| **Post-Processing** | @react-three/postprocessing 3 | Bloom, vignette, chromatic aberration |
| **Animation** | GSAP 3.14 | Scroll-triggered animations |
| **AR** | @google/model-viewer | WebXR AR experiences |
| **Testing** | Vitest + Testing Library | Unit & component tests |

## Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (Navbar, GlobalMatrixRain overlay)
│   ├── page.tsx                  # Home — section composition
│   ├── ar/page.tsx               # AR experience page
│   ├── card/page.tsx             # Business card page
│   └── api/github/              # GitHub contributions API
│
├── components/
│   ├── sections/                 # Full-page sections
│   │   ├── Hero.tsx              # Cinematic Matrix corridor hero
│   │   ├── Projects.tsx          # Featured + open source + Rails contributions
│   │   ├── GitHubSkyline.tsx     # 3D GitHub contribution visualization + HUD
│   │   ├── Resume.tsx            # Resume with PDF viewer
│   │   ├── MatrixResume.tsx      # Matrix decode animation of resume data
│   │   └── ARExperience.tsx      # AR preview + QR launch
│   │
│   ├── three/                    # Three.js / R3F scenes
│   │   ├── MatrixCorridorScene.tsx  # 3D code corridor (hero background)
│   │   ├── MatrixRain.tsx        # Reusable instanced rain (texture atlas + shaders)
│   │   ├── MatrixVisionScene.tsx # 2D canvas dense rain with figure silhouettes
│   │   ├── MatrixResumeScene.tsx # Canvas-based resume decoder animation
│   │   ├── SkylineScene.tsx      # 3D GitHub contribution bars + floating quotes
│   │   ├── HeroScene.tsx         # Crystal prism scene (legacy, unused)
│   │   ├── CardScene.tsx         # Floating particles for card page
│   │   ├── ARPreviewScene.tsx    # Crystal with transmission material
│   │   └── corridor/             # Corridor sub-components
│   │       ├── index.ts          # Barrel exports
│   │       ├── GlyphAtlas.ts     # 16×16 glyph texture atlas (Latin + symbols)
│   │       ├── RainSurface.tsx   # Instanced rain on corridor surfaces
│   │       ├── CinematicCamera.tsx # Camera path + earthquake tremors
│   │       ├── CorridorStructure.tsx # Doors, panels, architectural details
│   │       ├── CoderDesk.tsx     # Figure coding at desk (corridor end)
│   │       ├── AgentFigure.tsx   # Walking Agent Smith silhouettes
│   │       └── RainPanel.tsx     # Rain-textured panel segments
│   │
│   ├── ui/                       # Shared UI components
│   │   ├── GlobalMatrixRain.tsx  # Full-page canvas rain overlay (z-[1])
│   │   ├── MatrixTextReveal.tsx  # Reusable text-from-rain canvas component
│   │   ├── Navbar.tsx            # Fixed navigation (z-50)
│   │   ├── PageLoader.tsx        # Matrix loading screen orchestrator (z-[9999])
│   │   ├── ProjectCard.tsx       # Featured project card
│   │   ├── Instructions.tsx      # First-visit instructions modal
│   │   └── ScrollReveal.tsx      # GSAP scroll-triggered reveal wrapper
│   │
│   └── ar/
│       └── ModelViewerWrapper.tsx # AR model viewer component
│
├── data/
│   ├── projects.ts               # Project, social, and site config data
│   └── matrixFigures.ts          # Sprite data: 3 characters × 8 poses (36×48)
│
└── lib/
    ├── github.ts                 # GitHub GraphQL API client
    ├── matrix.ts                 # Shared rain utilities (chars, drawRainChar, buildTextGrid)
    └── matrixTextEffect.ts       # Pure-logic text formation/dissolution engine
```

## Rendering Architecture

### Layer Stack (z-index order)

```
z-[9999]  PageLoader          — Full-screen Matrix loading animation
z-50      Navbar              — Fixed top navigation
z-10      Section content     — Text, cards, buttons (relative z-10)
z-[2]     Projects/Footer     — Content that needs explicit stacking
z-[1]     GlobalMatrixRain    — Canvas 2D overlay: rain + walking figures
z-0       Section backgrounds — Normal flow (bg-black)
```

The GlobalMatrixRain canvas sits between section backgrounds (below) and section content (above), creating the effect of rain visible behind all content without overlapping text or interactive elements.

### Three.js Rendering Pipeline

```
┌─────────────────────────────────────┐
│  React Three Fiber (R3F) Canvas     │
│  ├── Scene Graph                    │
│  │   ├── InstancedMesh (rain chars) │
│  │   ├── Corridor geometry          │
│  │   ├── CoderDesk (end of hall)    │
│  │   ├── Lights                     │
│  │   └── CinematicCamera            │
│  │       ├── Intro path (0–7.5s)    │
│  │       ├── Background drift       │
│  │       └── Random earthquakes     │
│  │                                  │
│  └── Post-Processing Stack          │
│      ├── Bloom (glow on emissive)   │
│      ├── Vignette (edge darkening)  │
│      └── ChromaticAberration        │
│          (shared Vector2 offset —   │
│           mutated by camera, no ref)│
└─────────────────────────────────────┘
```

**Key pattern — Instanced character rendering:**
1. Build a 16×16 glyph texture atlas (Latin + digits + symbols)
2. Create `InstancedMesh` with `PlaneGeometry` base
3. Custom `ShaderMaterial` maps per-instance UV offsets to atlas cells
4. Per-instance brightness via `InstancedBufferAttribute`
5. Additive blending + no depth write for glow effect
6. `useFrame` updates positions and brightness each frame

This renders 10,000+ characters in a single draw call.

**R3F + Postprocessing v3 compatibility note:**
- `wrapEffect` (used by all effect components) calls `JSON.stringify(props)` for memoization
- In React 19, `ref` is a regular prop — passing `ref` to effects causes circular structure errors (Three.js parent/children cycle)
- Solution: share mutable Three.js objects (e.g., `Vector2`) directly instead of using refs on effect components

### Matrix Text Reveal System

Reusable system for text-from-rain effects:

```
matrixTextEffect.ts (pure logic)    MatrixTextReveal.tsx (canvas component)
├── computeThresholds()        →    ├── Background rain drops (varied sizes)
│   0.05–0.95 range                 ├── Primary rain columns
│   deterministic jitter            ├── Locked text cells with fadeIn/fadeOut
├── updateReveal()                  └── Skip rain near locked cells
│   fadeIn ramp (120ms)
├── updateDissolve()            PageLoader.tsx (orchestrator)
│   fadeOut ramp (80ms)         ├── Phase state machine
└── cellOpacity()               │   rain_in → revealing → holding →
    fadeIn × (1 - fadeOut)      │   dissolving → done
                                └── Maps phases to MatrixTextReveal props
```

### GlobalMatrixRain (Canvas 2D Overlay)

A separate full-page `<canvas>` element using Canvas 2D API (not Three.js) for the persistent rain overlay across all pages:

- **4-level density sprites**: `#` (1.0), `+` (0.7), `.` (0.4), ` ` (0.0)
- **3 characters**: Neo, Morpheus, Agent Smith — 36×48 sprites, 6-frame walk cycles
- **Motion trails**: Last 3 positions render as fading ghost masks
- **Depth layering**: 12% of rain columns are "foreground" (drawn after figures)
- **Two-layer glow**: Broad ambient + tight core radial gradients per figure
- **Fade-out exits**: Figures fade over 500ms at viewport edges

## Hero Layout

```
┌──────────────────────────────────────┐
│  ┌──┐                          ┌──┐ │  CRT corner brackets
│  └                                ┘ │
│                                      │
│            d a n 1 d                 │  mt-[15vh] — upper area
│                                      │
│                                      │
│     ┌─── coder at desk ───┐         │  Corridor background (visible center)
│     └─────────────────────┘         │
│                                      │
│     Senior Full-Stack Engineer       │  mt-auto + mb-[10vh] — bottom area
│     Description text...              │
│     [VIEW_PROJECTS] [ENTER_MATRIX]   │
│  ┌                                ┐ │
│  └──┘                          └──┘ │
└──────────────────────────────────────┘
```

## Design System

### Matrix Terminal Visual Language

Every section follows the Matrix HUD aesthetic established in GitHubSkyline:

| Element | Style |
|---------|-------|
| **Borders** | `border border-green-400/20`, sharp corners (no rounded) |
| **Corner brackets** | 4 absolute-positioned divs: `border-t border-l border-green-400/50` |
| **Fonts** | `font-mono` (Geist Mono) everywhere |
| **Labels** | `// COMMENT_STYLE` in `text-green-400/40 text-xs` |
| **Titles** | `text-lime-400` with `textShadow: "0 0 8px #39ff14"` |
| **Body text** | `text-green-300/60` |
| **Tags** | `text-[10px] uppercase tracking-widest border border-green-400/20` |
| **Buttons** | Bracket style: `[VISIT]`, `[DOWNLOAD_SOURCE]` |
| **Backgrounds** | `bg-black` — no frosted glass, no backdrop-blur |
| **Status** | Pulsing green dots, `STATUS: ACTIVE` labels |
| **Characters** | Latin + symbols only (no katakana/CJK) |

### Color Palette

```
--matrix-green:  #00ff41  (primary — rain, text, borders)
--matrix-bright: #39ff14  (accent — titles, glow)
--matrix-lime:   #84cc16  (secondary — lime-400)
--matrix-dim:    rgba(0,255,65,0.2-0.4)  (muted borders, labels)
--bg:            #000000  (pure black)
```

## Section Architecture

### Hero (Cinematic Matrix Corridor)
Full-viewport 3D corridor of falling code. R3F canvas with:
- Instanced character rain on walls, ceiling, floor
- Bloom + chromatic aberration postprocessing
- Cinematic camera intro (0–7.5s): approach → accelerate → glitch → zoom
- Background drift with random earthquake tremors (8–23s intervals)
- CoderDesk figure visible at corridor end
- Hero text split: "dan1d" at top, subtitle/description/buttons at bottom to keep coder visible

### Projects
Terminal-style cards in a grid. Each card has:
- Corner bracket accents
- `// PROJECT` comment labels
- `STATUS: FEATURED` badges
- Bracket-style `[VISIT]` buttons
- Subsections: Featured, Open Source (GitHub cards), Rails Contributions (PR cards)

### GitHubSkyline (Reference Implementation)
The most complete Matrix section — full HUD overlay:
- CRT corner brackets framing the viewport
- Status indicators (LIVE FEED, NEURAL_LINK)
- 3D instanced bar chart (52×7 contribution grid)
- Interactive hover with raycasting
- Floating Matrix quotes
- MatrixRain background layer

### Resume
Two-column layout: highlights (left) + PDF preview (right)
- Stats, skills, and role cards in terminal style
- Embedded PDF iframe

### MatrixResume
Canvas-based decode animation:
- Phase 1: Dense rain
- Phase 2: Characters resolve from noise → actual resume text
- Phase 3: Stable display with glow

### ARExperience
WebXR AR launch section:
- QR code for mobile AR
- 3D crystal preview
- Step-by-step instructions

## Data Flow

```
projects.ts ──→ Projects.tsx ──→ ProjectCard.tsx
                              ──→ Open Source cards (inline)
                              ──→ Rails Contribution cards (inline)

matrixFigures.ts ──→ GlobalMatrixRain.tsx (walking figure silhouettes)

github.ts ──→ API route ──→ GitHubSkyline.tsx ──→ SkylineScene.tsx

matrixTextEffect.ts ──→ MatrixTextReveal.tsx ──→ PageLoader.tsx
```

## Performance

- **Instanced rendering**: 10,000+ characters in 1 draw call
- **Texture atlas**: Single 1024×1024 texture for all glyphs
- **RAF-based 2D overlay**: `requestAnimationFrame` with delta-time normalization
- **Dynamic import**: Three.js scenes loaded client-side only (`ssr: false`)
- **Cached density masks**: Figure silhouettes cached per pose, recomputed only on frame change
- **DPR-aware canvas**: `devicePixelRatio` scaling for sharp rendering
- **No refs on postprocessing effects**: Avoids circular structure JSON errors

## Testing

98 tests across 9 test files covering:
- Section rendering (Hero, Projects, Resume, GitHubSkyline, ARExperience)
- Component behavior (Navbar, Instructions)
- Accessibility (aria-labels, heading roles, data-testid attributes)
- Content verification (project data, links, tags)

Three.js/Canvas components are mocked in tests (GSAP, canvas contexts).

## Build & Deploy

```bash
pnpm dev          # Development server
pnpm build        # Production build (static generation)
pnpm test         # Run all tests
pnpm test:watch   # Watch mode
```
