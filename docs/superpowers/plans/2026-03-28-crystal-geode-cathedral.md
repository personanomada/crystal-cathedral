# Crystal Geode Cathedral Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an immersive WebXR meditation experience — an elongated crystal geode cathedral with reactive systems that respond to user presence, evolving sacred geometry, and adaptive quality management.

**Architecture:** Centralized reactivity engine reads XR inputs and computes smoothed presence values (stillness, focus, engagement, sessionDepth) stored in Zustand. All visual systems (mandala, lighting, particles, crystals) subscribe to these values. Adaptive quality monitor adjusts feature tiers based on FPS.

**Tech Stack:** React Three Fiber 9.x, @react-three/xr 6.x, @react-three/drei 10.x, @react-three/postprocessing 3.x, @react-three/uikit, Three.js 0.183.x, Zustand 5.x, Tone.js 15.x, Vite 8.x, TypeScript 5.x, custom GLSL shaders via vite-plugin-glsl.

**IMPORTANT:** Always use Context7 (MCP) to look up documentation before writing code that uses any library. Do NOT rely on training data for API signatures.

---

## File Structure

```
src/
├── main.tsx                          # Entry point, renders App
├── App.tsx                           # Canvas + XR + post-processing + scene composition
├── config.ts                         # Color themes, tunable params, quality tier definitions
├── store/
│   └── useStore.ts                   # Zustand store: presence state, settings, quality tier
├── components/
│   ├── GeodeChamber.tsx              # Inverted ellipsoid shell with displacement
│   ├── CrystalFormation.tsx          # Instanced crystal groups (9 InstancedMesh groups)
│   ├── HeroCrystals.tsx             # Near-player transmission/iridescence crystals
│   ├── SacredMandala.tsx            # Evolving sacred geometry shader + light source
│   ├── LightingRig.tsx             # Point lights, ambient, environment map
│   ├── ParticleField.tsx           # 3 reactive particle layers
│   ├── PostProcessing.tsx          # Bloom, chromatic aberration, vignette, noise
│   └── Scene.tsx                    # Composes all scene components
├── systems/
│   ├── ReactivityEngine.tsx         # Computes presence state from XR input
│   ├── AdaptiveQuality.tsx          # FPS monitor, tier management
│   ├── BreathingPulse.tsx           # Global sine wave animation driver
│   └── SessionArc.tsx               # Arc/freeform session phase management
├── interaction/
│   ├── GazeDrift.tsx                # Drift-toward-gaze locomotion
│   ├── TeleportSystem.tsx           # Teleport via controller
│   ├── HandInteraction.tsx          # Hand trails, crystal touch, mandala gestures
│   └── GazeFocus.tsx                # Gaze-based crystal brightening
├── audio/
│   ├── AudioManager.tsx             # Mode switching, master volume
│   ├── AmbientDrone.tsx             # Procedural Tone.js drone
│   ├── CrystalSounds.tsx           # Spatial crystal tones on gaze/proximity
│   └── tracks.ts                    # Track metadata for lo-fi and nature modes
├── ui/
│   ├── VRMenu.tsx                   # In-VR floating settings panel (uikit)
│   ├── DesktopOverlay.tsx           # Desktop controls overlay
│   └── EnterVRButton.tsx            # Styled VR entry button
├── shaders/
│   ├── mandala.vert                 # Mandala vertex shader
│   ├── mandala.frag                 # Mandala fragment shader (sacred geometry patterns)
│   ├── crystal-mid.vert             # Mid-tier crystal vertex (instanced)
│   ├── crystal-mid.frag             # Mid-tier crystal fragment (fake transparency + emissive)
├── utils/
│   ├── crystalDistribution.ts       # Poisson-disk placement on ellipsoid interior
│   └── smoothing.ts                 # Exponential smoothing helpers for presence values
index.html
vite.config.ts
tsconfig.json
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /Users/robeyjoyce/Documents/Development/crystal-game
npm create vite@latest . -- --template react-ts
```

Select "Ignore files and continue" if prompted about existing files.

- [ ] **Step 2: Install core dependencies**

Check latest versions with `npm info <pkg> version` before installing, then:

```bash
npm install @react-three/fiber @react-three/drei @react-three/xr @react-three/postprocessing @react-three/uikit three postprocessing zustand tone
npm install -D vite-plugin-glsl @types/three @vitejs/plugin-basic-ssl
```

- [ ] **Step 3: Configure Vite**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    glsl(),
    basicSsl(),
  ],
  server: {
    host: true,
    https: true,
  },
})
```

- [ ] **Step 4: Add glsl module declaration**

Create `src/glsl.d.ts`:

```ts
declare module '*.vert' {
  const value: string
  export default value
}
declare module '*.frag' {
  const value: string
  export default value
}
declare module '*.glsl' {
  const value: string
  export default value
}
```

- [ ] **Step 5: Write minimal App.tsx with XR**

Replace `src/App.tsx`:

```tsx
import { Canvas } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'

const xrStore = createXRStore({
  emulate: 'metaQuest3',
  hand: true,
  controller: true,
  frameRate: 'high',
})

export default function App() {
  return (
    <>
      <button
        onClick={() => xrStore.enterVR()}
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          zIndex: 10,
          background: '#6c5ce7',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Enter VR
      </button>
      <Canvas
        camera={{ position: [0, 1.5, 0], fov: 75 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <XR store={xrStore}>
          <ambientLight intensity={0.1} />
          <mesh position={[0, 1.5, -3]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#6c5ce7" />
          </mesh>
        </XR>
      </Canvas>
    </>
  )
}
```

- [ ] **Step 6: Update main.tsx**

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Update index.html**

Ensure `index.html` body has full-screen canvas styling:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Crystal Geode Cathedral</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body, #root { width: 100%; height: 100%; overflow: hidden; background: #000; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Verify it runs**

```bash
npm run dev
```

Open browser at `https://localhost:5173`. Confirm: purple cube visible, "Enter VR" button visible, no console errors. If on Quest 3 same network, open the URL there and confirm VR entry works.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + R3F + XR project with Quest 3 support"
```

---

## Task 2: Zustand Store & Config

**Files:**
- Create: `src/store/useStore.ts`, `src/config.ts`, `src/utils/smoothing.ts`

- [ ] **Step 1: Create config.ts with theme palettes and tunable params**

Create `src/config.ts`:

```ts
import * as THREE from 'three'

export interface ColorTheme {
  name: string
  crystal: THREE.Color
  emissive: THREE.Color
  lights: THREE.Color[]
  mandala: THREE.Color
  particle: THREE.Color
}

export const THEMES: Record<string, ColorTheme> = {
  amethyst: {
    name: 'Amethyst',
    crystal: new THREE.Color('#6c5ce7'),
    emissive: new THREE.Color('#a29bfe'),
    lights: [
      new THREE.Color('#6c5ce7'),
      new THREE.Color('#a29bfe'),
      new THREE.Color('#e84393'),
      new THREE.Color('#6c5ce7'),
    ],
    mandala: new THREE.Color('#ffeaa7'),
    particle: new THREE.Color('#a29bfe'),
  },
  celestial: {
    name: 'Celestial',
    crystal: new THREE.Color('#0984e3'),
    emissive: new THREE.Color('#74b9ff'),
    lights: [
      new THREE.Color('#0984e3'),
      new THREE.Color('#74b9ff'),
      new THREE.Color('#00cec9'),
      new THREE.Color('#0984e3'),
    ],
    mandala: new THREE.Color('#dfe6e9'),
    particle: new THREE.Color('#74b9ff'),
  },
  rose: {
    name: 'Rose',
    crystal: new THREE.Color('#e84393'),
    emissive: new THREE.Color('#fd79a8'),
    lights: [
      new THREE.Color('#e84393'),
      new THREE.Color('#fd79a8'),
      new THREE.Color('#ffeaa7'),
      new THREE.Color('#fab1a0'),
    ],
    mandala: new THREE.Color('#ffeaa7'),
    particle: new THREE.Color('#fd79a8'),
  },
  citrine: {
    name: 'Citrine',
    crystal: new THREE.Color('#e17055'),
    emissive: new THREE.Color('#fdcb6e'),
    lights: [
      new THREE.Color('#e17055'),
      new THREE.Color('#fdcb6e'),
      new THREE.Color('#ffeaa7'),
      new THREE.Color('#e17055'),
    ],
    mandala: new THREE.Color('#ffeaa7'),
    particle: new THREE.Color('#fdcb6e'),
  },
}

export const THEME_ORDER = ['amethyst', 'celestial', 'rose', 'citrine'] as const

export const CONFIG = {
  // Cathedral geometry
  cathedral: {
    radiusX: 6,        // half-width ~12m
    radiusY: 12.5,     // half-height ~25m
    subdivisions: 64,
  },
  // Breathing
  breathing: {
    slow: 10,    // seconds per cycle
    medium: 8,
    fast: 6,
  },
  // Session
  session: {
    arcDuration: 20 * 60, // 20 minutes in seconds
    themeCycleDuration: 8 * 60, // 8 minutes per full color cycle
  },
  // Reactivity
  reactivity: {
    stillnessThreshold: 0.1,   // rad/s
    stillnessSmoothingWindow: 3, // seconds
    focusBuildDelay: 2,        // seconds of steady gaze
    focusSphereRadius: 0.5,    // meters
  },
  // Locomotion
  locomotion: {
    maxDriftSpeed: 0.3, // m/s
    boundaryDistance: 4, // meters from wall
  },
  // Interaction
  interaction: {
    crystalTouchRadius: 0.3,  // meters
    rippleRadius: 2,          // meters
    rippleDuration: 1.5,      // seconds
    gazeFocusDelay: 2,        // seconds
  },
  // Quality
  quality: {
    high: { fpsThreshold: 80, heroCount: 15, bloomRes: 0.5, particles: 3 },
    medium: { fpsThreshold: 65, heroCount: 8, bloomRes: 0.25, particles: 2 },
    low: { fpsThreshold: 0, heroCount: 3, bloomRes: 0, particles: 1 },
    downgradeDelay: 4,   // seconds
    upgradeDelay: 10,    // seconds
    hysteresis: 5,       // fps buffer
  },
  // Mandala
  mandala: {
    diameter: 4,  // meters
    stages: ['seed', 'flower', 'metatron', 'sriYantra'] as const,
    morphDuration: 45, // seconds per morph (base, modified by stillness)
    stageColors: [
      new THREE.Color('#ffeaa7'), // Seed → golden
      new THREE.Color('#a29bfe'), // Flower → violet
      new THREE.Color('#fd79a8'), // Metatron → pink
      new THREE.Color('#55efc4'), // Sri Yantra → cyan
    ],
  },
} as const
```

- [ ] **Step 2: Create smoothing utility**

Create `src/utils/smoothing.ts`:

```ts
export class ExponentialSmoother {
  private value: number
  private readonly halfLife: number

  constructor(initialValue: number, halfLife: number) {
    this.value = initialValue
    this.halfLife = halfLife
  }

  update(target: number, dt: number): number {
    const factor = 1 - Math.pow(0.5, dt / this.halfLife)
    this.value += (target - this.value) * factor
    return this.value
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}

export class RollingAverage {
  private samples: number[] = []
  private sum = 0
  private readonly window: number

  constructor(windowSeconds: number, estimatedFps = 90) {
    this.window = Math.ceil(windowSeconds * estimatedFps)
  }

  push(value: number): number {
    this.samples.push(value)
    this.sum += value
    while (this.samples.length > this.window) {
      this.sum -= this.samples.shift()!
    }
    return this.sum / this.samples.length
  }

  get(): number {
    return this.samples.length > 0 ? this.sum / this.samples.length : 0
  }
}
```

- [ ] **Step 3: Create Zustand store**

Create `src/store/useStore.ts`:

```ts
import { create } from 'zustand'

export type AudioMode = 'drone' | 'lofi' | 'nature' | 'spatialFx'
export type LocomotionMode = 'gaze' | 'teleport' | 'static'
export type SessionMode = 'arc' | 'freeform'
export type QualityTier = 'high' | 'medium' | 'low'
export type QualityOverride = 'auto' | QualityTier
export type BreathingSpeed = 'slow' | 'medium' | 'fast'
export type ThemeKey = 'auto' | 'amethyst' | 'celestial' | 'rose' | 'citrine'
export type MandalaStage = 'seed' | 'flower' | 'metatron' | 'sriYantra'

interface PresenceState {
  stillness: number      // 0-1
  focus: number          // 0-1
  engagement: number     // 0-1
  sessionDepth: number   // 0-1
}

interface Settings {
  audioMode: AudioMode
  volume: number           // 0-1
  crystalSounds: boolean
  theme: ThemeKey
  breathingSpeed: BreathingSpeed
  locomotion: LocomotionMode
  sessionMode: SessionMode
  qualityOverride: QualityOverride
}

interface Store {
  // Presence (written by ReactivityEngine)
  presence: PresenceState
  setPresence: (p: Partial<PresenceState>) => void

  // Quality (written by AdaptiveQuality)
  qualityTier: QualityTier
  setQualityTier: (tier: QualityTier) => void

  // Mandala (written by SessionArc / ReactivityEngine)
  mandalaStage: MandalaStage
  mandalaProgress: number  // 0-1 morph between current and next stage
  setMandalaStage: (stage: MandalaStage) => void
  setMandalaProgress: (p: number) => void

  // Breathing (written by BreathingPulse)
  breathPhase: number  // 0-1 sine wave phase
  setBreathPhase: (p: number) => void

  // Session
  sessionElapsed: number  // seconds
  setSessionElapsed: (t: number) => void

  // Settings (written by VR menu / desktop overlay)
  settings: Settings
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

export const useStore = create<Store>()((set) => ({
  presence: { stillness: 0, focus: 0, engagement: 0, sessionDepth: 0 },
  setPresence: (p) =>
    set((s) => ({ presence: { ...s.presence, ...p } })),

  qualityTier: 'high',
  setQualityTier: (tier) => set({ qualityTier: tier }),

  mandalaStage: 'seed',
  mandalaProgress: 0,
  setMandalaStage: (stage) => set({ mandalaStage: stage }),
  setMandalaProgress: (p) => set({ mandalaProgress: p }),

  breathPhase: 0,
  setBreathPhase: (p) => set({ breathPhase: p }),

  sessionElapsed: 0,
  setSessionElapsed: (t) => set({ sessionElapsed: t }),

  settings: {
    audioMode: 'drone',
    volume: 0.65,
    crystalSounds: true,
    theme: 'auto',
    breathingSpeed: 'medium',
    locomotion: 'gaze',
    sessionMode: 'arc',
    qualityOverride: 'auto',
  },
  setSetting: (key, value) =>
    set((s) => ({ settings: { ...s.settings, [key]: value } })),
}))
```

- [ ] **Step 4: Verify store works**

```bash
npm run dev
```

No errors in console. Open React DevTools if available and confirm store is initialized.

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/store/useStore.ts src/utils/smoothing.ts
git commit -m "feat: add Zustand store, config, and smoothing utilities"
```

---

## Task 3: Breathing Pulse System

**Files:**
- Create: `src/systems/BreathingPulse.tsx`

- [ ] **Step 1: Implement breathing pulse component**

Create `src/systems/BreathingPulse.tsx`:

```tsx
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'

export function BreathingPulse() {
  const breathingSpeed = useStore((s) => s.settings.breathingSpeed)
  const setBreathPhase = useStore((s) => s.setBreathPhase)

  useFrame((_, delta) => {
    const cycleDuration = CONFIG.breathing[breathingSpeed]
    const phaseIncrement = delta / cycleDuration
    const currentPhase = useStore.getState().breathPhase
    const newPhase = (currentPhase + phaseIncrement) % 1
    setBreathPhase(newPhase)
  })

  return null
}
```

- [ ] **Step 2: Add to App.tsx inside XR**

Add `<BreathingPulse />` inside the `<XR>` component in App.tsx, after removing the test cube. Import it at top.

- [ ] **Step 3: Verify breathing phase updates**

Open browser, open console, run:
```js
// In browser console — check the store is updating
setInterval(() => console.log(window.__ZUSTAND_STORE?.getState().breathPhase), 1000)
```

Or add a temporary `console.log` in the useFrame to confirm the phase is cycling 0→1.

- [ ] **Step 4: Commit**

```bash
git add src/systems/BreathingPulse.tsx src/App.tsx
git commit -m "feat: add breathing pulse system"
```

---

## Task 4: Geode Chamber

**Files:**
- Create: `src/components/GeodeChamber.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create the geode chamber component**

Create `src/components/GeodeChamber.tsx`:

```tsx
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CONFIG } from '../config'
import { useStore } from '../store/useStore'
import { createNoise3D } from 'simplex-noise'

// Note: install simplex-noise: npm install simplex-noise

export function GeodeChamber() {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const { radiusX, radiusY, subdivisions } = CONFIG.cathedral
    const geo = new THREE.IcosahedronGeometry(1, subdivisions)

    // Scale to elongated ellipsoid
    const pos = geo.attributes.position
    const noise3D = createNoise3D()

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)

      // Normalize to unit sphere
      const len = Math.sqrt(x * x + y * y + z * z)
      const nx = x / len
      const ny = y / len
      const nz = z / len

      // Rock displacement noise
      const noiseScale = 0.8
      const noiseAmount = 0.15
      const displacement = 1 + noise3D(nx * noiseScale * 3, ny * noiseScale * 3, nz * noiseScale * 3) * noiseAmount

      // Scale to ellipsoid and apply displacement
      pos.setXYZ(
        i,
        nx * radiusX * displacement,
        ny * radiusY * displacement,
        nz * radiusX * displacement,
      )
    }

    // Flatten the floor (y < -radiusY * 0.85)
    const floorY = -radiusY * 0.85
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < floorY) {
        const floorNoise = noise3D(pos.getX(i) * 0.5, floorY, pos.getZ(i) * 0.5) * 0.3
        pos.setY(i, floorY + floorNoise)
      }
    }

    geo.computeVertexNormals()

    // Flip normals inward (we're inside the geode)
    const normals = geo.attributes.normal
    for (let i = 0; i < normals.count; i++) {
      normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i))
    }

    // Flip face winding for inside rendering
    const index = geo.index!
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i)
      const c = index.getX(i + 2)
      index.setX(i, c)
      index.setX(i + 2, a)
    }

    return geo
  }, [])

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#1a1a2e"
        roughness={0.9}
        metalness={0.1}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}
```

- [ ] **Step 2: Install simplex-noise**

```bash
npm install simplex-noise
```

- [ ] **Step 3: Add GeodeChamber to App.tsx**

Import and add `<GeodeChamber />` inside the `<XR>` component. Position the camera at `[0, -CONFIG.cathedral.radiusY * 0.35, 0]` (below center, looking up gives the vault effect). Also add OrbitControls from drei for desktop testing:

```tsx
import { OrbitControls } from '@react-three/drei'
// ... in Canvas:
<OrbitControls target={[0, 0, 0]} />
```

- [ ] **Step 4: Verify visually**

```bash
npm run dev
```

Confirm: dark rocky interior visible from inside, ellipsoid shape, floor is flattened. You should be able to orbit around and see the cathedral shape.

- [ ] **Step 5: Commit**

```bash
git add src/components/GeodeChamber.tsx src/App.tsx package.json package-lock.json
git commit -m "feat: add geode chamber with displacement and floor"
```

---

## Task 5: Crystal Distribution & Instancing

**Files:**
- Create: `src/utils/crystalDistribution.ts`, `src/components/CrystalFormation.tsx`

- [ ] **Step 1: Create crystal distribution utility**

Create `src/utils/crystalDistribution.ts`:

```ts
import * as THREE from 'three'
import { CONFIG } from '../config'

export interface CrystalPlacement {
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  surfaceNormal: THREE.Vector3
}

/**
 * Generate crystal placements on the interior of the ellipsoid.
 * Density increases toward the top (ceiling vault).
 */
export function generateCrystalPlacements(
  count: number,
  seed: number = 42,
): CrystalPlacement[] {
  const { radiusX, radiusY } = CONFIG.cathedral
  const placements: CrystalPlacement[] = []

  // Simple seeded random
  let s = seed
  const random = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }

  for (let i = 0; i < count; i++) {
    // Bias y toward top: use pow to weight upward
    const u = random()
    const v = random()
    const theta = u * Math.PI * 2
    // Bias phi toward top (small phi = top of sphere)
    const phi = Math.acos(1 - 2 * Math.pow(v, 0.6)) // pow < 1 biases toward top

    const nx = Math.sin(phi) * Math.cos(theta)
    const ny = Math.cos(phi)
    const nz = Math.sin(phi) * Math.sin(theta)

    // Position on ellipsoid surface
    const px = nx * radiusX
    const py = ny * radiusY
    const pz = nz * radiusX

    // Skip floor area
    if (py < -radiusY * 0.75) continue

    // Surface normal (inward, toward center)
    const normal = new THREE.Vector3(-nx, -ny, -nz).normalize()

    // Rotation: align crystal to point inward along normal
    const up = new THREE.Vector3(0, 1, 0)
    const quat = new THREE.Quaternion().setFromUnitVectors(up, normal)
    const euler = new THREE.Euler().setFromQuaternion(quat)
    // Add random twist around the normal axis
    euler.z += random() * Math.PI * 2

    // Scale: larger toward ceiling, smaller near floor
    const heightFactor = (py + radiusY) / (2 * radiusY) // 0 at bottom, 1 at top
    const baseScale = 0.2 + random() * 0.5
    const heightScale = 0.5 + heightFactor * 1.5
    const scaleY = baseScale * heightScale * (0.8 + random() * 1.5) // elongation
    const scaleXZ = baseScale * heightScale * (0.3 + random() * 0.4)

    placements.push({
      position: new THREE.Vector3(px, py, pz),
      rotation: euler,
      scale: new THREE.Vector3(scaleXZ, scaleY, scaleXZ),
      surfaceNormal: normal,
    })
  }

  return placements
}
```

- [ ] **Step 2: Create CrystalFormation component**

Create `src/components/CrystalFormation.tsx`:

```tsx
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { generateCrystalPlacements, CrystalPlacement } from '../utils/crystalDistribution'

const CRYSTAL_COUNT = 600
const TEMP_OBJECT = new THREE.Object3D()
const TEMP_COLOR = new THREE.Color()

// Hexagonal prism geometry
function createHexPrismGeometry(radiusTop: number, radiusBottom: number, height: number): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 6, 1)
}

// Three crystal geometry types
const CRYSTAL_GEOMETRIES = [
  () => createHexPrismGeometry(0.08, 0.12, 1),     // Thin, tapered
  () => createHexPrismGeometry(0.15, 0.15, 1),      // Uniform column
  () => createHexPrismGeometry(0.05, 0.18, 1),      // Wide base, pointed
]

export function CrystalFormation() {
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([])
  const placementsRef = useRef<CrystalPlacement[][]>([])

  const allPlacements = useMemo(
    () => generateCrystalPlacements(CRYSTAL_COUNT),
    [],
  )

  // Split placements into 3 groups (one per geometry type)
  const groups = useMemo(() => {
    const g: CrystalPlacement[][] = [[], [], []]
    allPlacements.forEach((p, i) => g[i % 3].push(p))
    return g
  }, [allPlacements])

  useEffect(() => {
    placementsRef.current = groups
    groups.forEach((group, gi) => {
      const mesh = meshRefs.current[gi]
      if (!mesh) return
      group.forEach((placement, i) => {
        TEMP_OBJECT.position.copy(placement.position)
        TEMP_OBJECT.rotation.copy(placement.rotation)
        TEMP_OBJECT.scale.copy(placement.scale)
        TEMP_OBJECT.updateMatrix()
        mesh.setMatrixAt(i, TEMP_OBJECT.matrix)

        // Base color with slight variation
        TEMP_COLOR.setHSL(0.75 + Math.random() * 0.1, 0.5, 0.15)
        mesh.setColorAt(i, TEMP_COLOR)
      })
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    })
  }, [groups])

  // Animate emissive based on breathing
  useFrame(() => {
    const breathPhase = useStore.getState().breathPhase
    const breathValue = Math.sin(breathPhase * Math.PI * 2) * 0.5 + 0.5
    const sessionDepth = useStore.getState().presence.sessionDepth
    const emissiveIntensity = (0.3 + breathValue * 0.7) * (0.2 + sessionDepth * 0.8)

    meshRefs.current.forEach((mesh) => {
      if (!mesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = emissiveIntensity
    })
  })

  const geometries = useMemo(
    () => CRYSTAL_GEOMETRIES.map((fn) => fn()),
    [],
  )

  return (
    <>
      {geometries.map((geo, i) => (
        <instancedMesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el }}
          args={[geo, undefined, groups[i]?.length ?? 0]}
          frustumCulled={false}
        >
          <meshStandardMaterial
            color="#2d2d44"
            emissive="#6c5ce7"
            emissiveIntensity={0.3}
            roughness={0.3}
            metalness={0.2}
            transparent
            opacity={0.85}
          />
        </instancedMesh>
      ))}
    </>
  )
}
```

- [ ] **Step 3: Add CrystalFormation to App.tsx**

Import and add `<CrystalFormation />` inside `<XR>`.

- [ ] **Step 4: Verify visually**

```bash
npm run dev
```

Confirm: hundreds of crystals visible on the interior walls, denser toward the ceiling, gently pulsing with the breathing phase. Should render as 3 draw calls total for all instanced crystals.

- [ ] **Step 5: Commit**

```bash
git add src/utils/crystalDistribution.ts src/components/CrystalFormation.tsx src/App.tsx
git commit -m "feat: add instanced crystal formations with density gradient"
```

---

## Task 6: Hero Crystals

**Files:**
- Create: `src/components/HeroCrystals.tsx`

- [ ] **Step 1: Create hero crystals component**

Create `src/components/HeroCrystals.tsx`:

```tsx
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { generateCrystalPlacements } from '../utils/crystalDistribution'
import { CONFIG } from '../config'

/**
 * Hero crystals: the nearest N crystals to the player with full
 * MeshPhysicalMaterial (transmission + iridescence).
 * Count is controlled by adaptive quality tier.
 */
export function HeroCrystals() {
  const groupRef = useRef<THREE.Group>(null)
  const materialsRef = useRef<THREE.MeshPhysicalMaterial[]>([])

  const qualityTier = useStore((s) => s.qualityTier)
  const heroCount = CONFIG.quality[qualityTier].heroCount

  // Generate fixed hero placements near center
  const heroData = useMemo(() => {
    const allPlacements = generateCrystalPlacements(600, 42)
    const playerPos = new THREE.Vector3(0, -CONFIG.cathedral.radiusY * 0.35, 0)
    // Sort by distance to player
    const sorted = allPlacements.sort(
      (a, b) => a.position.distanceTo(playerPos) - b.position.distanceTo(playerPos),
    )
    // Take top 15 (max possible)
    return sorted.slice(0, 15)
  }, [])

  const geometry = useMemo(
    () => new THREE.CylinderGeometry(0.12, 0.18, 1.5, 6, 1),
    [],
  )

  useFrame(() => {
    const breathPhase = useStore.getState().breathPhase
    const breathValue = Math.sin(breathPhase * Math.PI * 2) * 0.5 + 0.5
    const sessionDepth = useStore.getState().presence.sessionDepth

    materialsRef.current.forEach((mat) => {
      mat.emissiveIntensity = (0.5 + breathValue * 0.5) * (0.3 + sessionDepth * 0.7)
    })
  })

  return (
    <group ref={groupRef}>
      {heroData.slice(0, heroCount).map((placement, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={placement.position}
          rotation={placement.rotation}
          scale={placement.scale.clone().multiplyScalar(1.3)}
        >
          <meshPhysicalMaterial
            ref={(mat) => { if (mat) materialsRef.current[i] = mat }}
            transmission={1}
            thickness={0.5}
            roughness={0.05}
            ior={2.4}
            iridescence={1}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[100, 400]}
            emissive="#6c5ce7"
            emissiveIntensity={0.5}
            transparent
            envMapIntensity={1}
          />
        </mesh>
      ))}
    </group>
  )
}
```

- [ ] **Step 2: Add HeroCrystals to App.tsx**

Import and add `<HeroCrystals />` inside `<XR>`.

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```

Confirm: 15 crystals nearest to the camera position look distinctly different — glassy, transmissive, with rainbow iridescence. They should stand out from the instanced mid-tier crystals.

- [ ] **Step 4: Commit**

```bash
git add src/components/HeroCrystals.tsx src/App.tsx
git commit -m "feat: add hero crystals with transmission and iridescence"
```

---

## Task 7: Lighting Rig

**Files:**
- Create: `src/components/LightingRig.tsx`

- [ ] **Step 1: Create lighting rig component**

Create `src/components/LightingRig.tsx`:

```tsx
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { CONFIG, THEMES, THEME_ORDER } from '../config'

function getActiveThemeColors(themeKey: string, elapsed: number) {
  if (themeKey !== 'auto') {
    return THEMES[themeKey]
  }
  // Auto-cycle: lerp between themes
  const cycleDuration = CONFIG.session.themeCycleDuration
  const progress = (elapsed % cycleDuration) / cycleDuration
  const totalThemes = THEME_ORDER.length
  const exactIndex = progress * totalThemes
  const fromIndex = Math.floor(exactIndex) % totalThemes
  const toIndex = (fromIndex + 1) % totalThemes
  const t = exactIndex - Math.floor(exactIndex)

  const from = THEMES[THEME_ORDER[fromIndex]]
  const to = THEMES[THEME_ORDER[toIndex]]

  return {
    name: 'auto',
    crystal: from.crystal.clone().lerp(to.crystal, t),
    emissive: from.emissive.clone().lerp(to.emissive, t),
    lights: from.lights.map((c, i) => c.clone().lerp(to.lights[i], t)),
    mandala: from.mandala.clone().lerp(to.mandala, t),
    particle: from.particle.clone().lerp(to.particle, t),
  }
}

export { getActiveThemeColors }

export function LightingRig() {
  const lightsRef = useRef<THREE.PointLight[]>([])
  const ambientRef = useRef<THREE.AmbientLight>(null)

  // 4 point light positions behind crystal clusters
  const lightPositions = useMemo(() => [
    new THREE.Vector3(-4, 2, -3),
    new THREE.Vector3(4, 4, -2),
    new THREE.Vector3(-3, 6, 3),
    new THREE.Vector3(3, 0, 4),
  ], [])

  useFrame(() => {
    const { sessionDepth } = useStore.getState().presence
    const elapsed = useStore.getState().sessionElapsed
    const themeKey = useStore.getState().settings.theme
    const theme = getActiveThemeColors(themeKey, elapsed)

    // Ambient: 0.02 -> 0.15 based on sessionDepth
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.02 + sessionDepth * 0.13
    }

    // Point lights fade in with sessionDepth
    lightsRef.current.forEach((light, i) => {
      if (!light) return
      light.color.copy(theme.lights[i % theme.lights.length])
      light.intensity = sessionDepth * 3
    })
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.02} />
      {lightPositions.map((pos, i) => (
        <pointLight
          key={i}
          ref={(el) => { if (el) lightsRef.current[i] = el }}
          position={pos}
          intensity={0}
          distance={15}
          decay={2}
        />
      ))}
      <Environment preset="night" environmentIntensity={0.1} />
    </>
  )
}
```

- [ ] **Step 2: Add LightingRig to App.tsx**

Import and add `<LightingRig />` inside `<XR>`. Remove the existing `<ambientLight>` test light.

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```

Confirm: scene starts very dark (sessionDepth is 0). The environment map should give crystals subtle reflections. Point lights are off initially — they'll activate when the session arc drives sessionDepth up.

- [ ] **Step 4: Commit**

```bash
git add src/components/LightingRig.tsx src/App.tsx
git commit -m "feat: add dynamic lighting rig with theme color cycling"
```

---

## Task 8: Reactivity Engine

**Files:**
- Create: `src/systems/ReactivityEngine.tsx`

- [ ] **Step 1: Create the reactivity engine**

Create `src/systems/ReactivityEngine.tsx`:

```tsx
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useXRInputSourceState } from '@react-three/xr'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { ExponentialSmoother, RollingAverage } from '../utils/smoothing'
import { CONFIG } from '../config'

// Note: Check Context7 for useXRInputSourceState API before implementing.
// This may need adjustment based on actual @react-three/xr v6 API.

export function ReactivityEngine() {
  const { camera } = useThree()

  // Smoothers
  const stillnessSmoother = useRef(new ExponentialSmoother(0, 1.5))
  const focusSmoother = useRef(new ExponentialSmoother(0, 2))
  const engagementSmoother = useRef(new ExponentialSmoother(0, 1))

  // Head tracking
  const lastHeadQuat = useRef(new THREE.Quaternion())
  const headVelocityAvg = useRef(new RollingAverage(CONFIG.reactivity.stillnessSmoothingWindow))

  // Gaze tracking
  const lastGazeHit = useRef(new THREE.Vector3())
  const gazeStableTime = useRef(0)

  // Session time
  const sessionStartTime = useRef<number | null>(null)

  const setPresence = useStore.getState().setPresence
  const setSessionElapsed = useStore.getState().setSessionElapsed

  useFrame((state, delta) => {
    // Clamp delta to avoid spikes
    const dt = Math.min(delta, 0.1)

    // --- Session depth ---
    if (sessionStartTime.current === null) {
      sessionStartTime.current = state.clock.elapsedTime
    }
    const elapsed = state.clock.elapsedTime - sessionStartTime.current
    setSessionElapsed(elapsed)

    const sessionMode = useStore.getState().settings.sessionMode
    const arcDuration = CONFIG.session.arcDuration
    let sessionDepth: number

    if (sessionMode === 'arc') {
      // Arc: 0→1 over first 75% of duration, then 1→0.2 over last 25%
      const progress = (elapsed % arcDuration) / arcDuration
      if (progress < 0.75) {
        sessionDepth = progress / 0.75
      } else {
        sessionDepth = 1 - ((progress - 0.75) / 0.25) * 0.8
      }
    } else {
      // Freeform: climb to 1 and stay
      sessionDepth = Math.min(1, elapsed / (arcDuration * 0.75))
    }

    // --- Stillness ---
    const currentQuat = camera.quaternion.clone()
    const angularDiff = lastHeadQuat.current.angleTo(currentQuat)
    const angularVelocity = dt > 0 ? angularDiff / dt : 0
    lastHeadQuat.current.copy(currentQuat)

    const avgVelocity = headVelocityAvg.current.push(angularVelocity)
    const rawStillness = avgVelocity < CONFIG.reactivity.stillnessThreshold
      ? 1
      : Math.max(0, 1 - (avgVelocity - CONFIG.reactivity.stillnessThreshold) * 5)
    const stillness = stillnessSmoother.current.update(rawStillness, dt)

    // --- Focus ---
    // Simple gaze stability check using camera forward direction
    const gazeDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    const gazePoint = camera.position.clone().add(gazeDir.multiplyScalar(5))

    if (gazePoint.distanceTo(lastGazeHit.current) < CONFIG.reactivity.focusSphereRadius) {
      gazeStableTime.current += dt
    } else {
      gazeStableTime.current = 0
    }
    lastGazeHit.current.copy(gazePoint)

    const rawFocus = gazeStableTime.current > CONFIG.reactivity.focusBuildDelay
      ? Math.min(1, (gazeStableTime.current - CONFIG.reactivity.focusBuildDelay) / 5)
      : 0
    const focus = focusSmoother.current.update(rawFocus, dt)

    // --- Engagement ---
    // For now, engagement is driven by head movement (inverse of stillness)
    // Hand tracking will be added in the interaction task
    const rawEngagement = 1 - rawStillness
    const engagement = engagementSmoother.current.update(rawEngagement, dt)

    // --- Write to store ---
    setPresence({ stillness, focus, engagement, sessionDepth })
  })

  return null
}
```

- [ ] **Step 2: Add ReactivityEngine to App.tsx**

Import and add `<ReactivityEngine />` inside `<XR>`.

- [ ] **Step 3: Verify presence values are updating**

Open browser console. After a few seconds of not moving the camera, `stillness` should climb toward 1. Moving the camera rapidly should drop it. `sessionDepth` should slowly climb from 0.

```js
setInterval(() => {
  const p = document.querySelector('#root').__r$?.getState?.() // or use React DevTools
  console.log('presence:', p?.presence)
}, 2000)
```

- [ ] **Step 4: Commit**

```bash
git add src/systems/ReactivityEngine.tsx src/App.tsx
git commit -m "feat: add reactivity engine computing presence state"
```

---

## Task 9: Session Arc Manager

**Files:**
- Create: `src/systems/SessionArc.tsx`

- [ ] **Step 1: Create session arc component**

Create `src/systems/SessionArc.tsx`:

```tsx
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'

const STAGE_THRESHOLDS = [0, 0.25, 0.5, 0.75] as const
const STAGES = CONFIG.mandala.stages

/**
 * Manages mandala stage progression based on sessionDepth + stillness.
 * sessionDepth determines target stage, stillness controls morph speed.
 */
export function SessionArc() {
  const setMandalaStage = useStore.getState().setMandalaStage
  const setMandalaProgress = useStore.getState().setMandalaProgress

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const { sessionDepth, stillness } = useStore.getState().presence

    // Determine target stage from sessionDepth
    let targetStageIndex = 0
    for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
      if (sessionDepth >= STAGE_THRESHOLDS[i]) {
        targetStageIndex = i
        break
      }
    }

    const currentStage = useStore.getState().mandalaStage
    const currentStageIndex = STAGES.indexOf(currentStage)
    const currentProgress = useStore.getState().mandalaProgress

    if (currentStageIndex < targetStageIndex) {
      // Morphing to next stage — speed modulated by stillness
      const morphSpeed = (1 / CONFIG.mandala.morphDuration) * (0.2 + stillness * 0.8)
      const newProgress = Math.min(1, currentProgress + morphSpeed * dt)

      if (newProgress >= 1) {
        // Advance to next stage
        const nextIndex = Math.min(currentStageIndex + 1, STAGES.length - 1)
        setMandalaStage(STAGES[nextIndex])
        setMandalaProgress(0)
      } else {
        setMandalaProgress(newProgress)
      }
    } else if (currentStageIndex > targetStageIndex) {
      // Regressing (arc mode fade-back) — always slow
      const regressSpeed = 1 / (CONFIG.mandala.morphDuration * 2)
      const newProgress = currentProgress - regressSpeed * dt

      if (newProgress <= 0) {
        const prevIndex = Math.max(currentStageIndex - 1, 0)
        setMandalaStage(STAGES[prevIndex])
        setMandalaProgress(1)
      } else {
        setMandalaProgress(newProgress)
      }
    }
  })

  return null
}
```

- [ ] **Step 2: Add SessionArc to App.tsx**

Import and add `<SessionArc />` inside `<XR>`.

- [ ] **Step 3: Verify stage progression**

Fast-forward test: temporarily set `arcDuration` to 60 seconds in config.ts. Watch mandala stage change from 'seed' → 'flower' → 'metatron' → 'sriYantra' over ~45 seconds. Revert config after testing.

- [ ] **Step 4: Commit**

```bash
git add src/systems/SessionArc.tsx src/App.tsx
git commit -m "feat: add session arc manager for mandala stage progression"
```

---

## Task 10: Sacred Geometry Mandala

**Files:**
- Create: `src/shaders/mandala.vert`, `src/shaders/mandala.frag`, `src/components/SacredMandala.tsx`

- [ ] **Step 1: Create mandala vertex shader**

Create `src/shaders/mandala.vert`:

```glsl
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

- [ ] **Step 2: Create mandala fragment shader**

Create `src/shaders/mandala.frag`:

```glsl
uniform float uTime;
uniform float uStage;        // 0=seed, 1=flower, 2=metatron, 3=sriYantra
uniform float uMorphProgress; // 0-1 between stages
uniform vec3 uColor;
uniform float uEmissiveIntensity;
uniform float uBreathPhase;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

// Distance from point to circle
float circle(vec2 p, vec2 center, float radius) {
  return abs(length(p - center) - radius);
}

// Distance from point to line segment
float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// Seed of Life: 7 circles
float seedOfLife(vec2 p, float r) {
  float d = circle(p, vec2(0.0), r);
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0;
    vec2 center = vec2(cos(angle), sin(angle)) * r;
    d = min(d, circle(p, center, r));
  }
  return d;
}

// Flower of Life: seed + outer ring
float flowerOfLife(vec2 p, float r) {
  float d = seedOfLife(p, r);
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0;
    vec2 center = vec2(cos(angle), sin(angle)) * r * 2.0;
    d = min(d, circle(p, center, r));
  }
  // Intermediate circles
  for (int i = 0; i < 6; i++) {
    float angle = (float(i) + 0.5) * TAU / 6.0;
    vec2 center = vec2(cos(angle), sin(angle)) * r * 1.732;
    d = min(d, circle(p, center, r));
  }
  return d;
}

// Metatron's Cube: circles + connecting lines
float metatronsCube(vec2 p, float r) {
  float d = 1000.0;
  // 13 circles: center + inner hex + outer hex
  vec2 points[13];
  points[0] = vec2(0.0);
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0;
    points[i + 1] = vec2(cos(angle), sin(angle)) * r;
    points[i + 7] = vec2(cos(angle), sin(angle)) * r * 2.0;
  }
  // Circles at each point
  for (int i = 0; i < 13; i++) {
    d = min(d, circle(p, points[i], r * 0.3));
  }
  // Lines connecting all points
  for (int i = 0; i < 13; i++) {
    for (int j = i + 1; j < 13; j++) {
      d = min(d, segment(p, points[i], points[j]));
    }
  }
  return d;
}

// Sri Yantra: interlocking triangles
float sriYantra(vec2 p, float r) {
  float d = 1000.0;
  // Concentric triangles pointing up and down
  for (int layer = 0; layer < 4; layer++) {
    float scale = 1.0 - float(layer) * 0.22;
    float offset = float(layer) * 0.05;
    // Upward triangle
    for (int i = 0; i < 3; i++) {
      float a1 = (float(i) * TAU / 3.0) - PI / 2.0;
      float a2 = (float(i + 1) * TAU / 3.0) - PI / 2.0;
      vec2 p1 = vec2(cos(a1), sin(a1)) * r * scale + vec2(0.0, offset);
      vec2 p2 = vec2(cos(a2), sin(a2)) * r * scale + vec2(0.0, offset);
      d = min(d, segment(p, p1, p2));
    }
    // Downward triangle
    for (int i = 0; i < 3; i++) {
      float a1 = (float(i) * TAU / 3.0) + PI / 2.0;
      float a2 = (float(i + 1) * TAU / 3.0) + PI / 2.0;
      vec2 p1 = vec2(cos(a1), sin(a1)) * r * scale - vec2(0.0, offset);
      vec2 p2 = vec2(cos(a2), sin(a2)) * r * scale - vec2(0.0, offset);
      d = min(d, segment(p, p1, p2));
    }
  }
  // Central bindu
  d = min(d, length(p) - r * 0.05);
  // Outer circles
  d = min(d, circle(p, vec2(0.0), r * 0.95));
  d = min(d, circle(p, vec2(0.0), r));
  return d;
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0; // -1 to 1

  // Outer circle mask
  float outerMask = 1.0 - smoothstep(0.9, 1.0, length(uv));

  float r = 0.35;

  // Compute current and next stage distances
  float currentD, nextD;

  int stage = int(uStage);

  if (stage == 0) {
    currentD = seedOfLife(uv, r);
    nextD = flowerOfLife(uv, r);
  } else if (stage == 1) {
    currentD = flowerOfLife(uv, r);
    nextD = metatronsCube(uv, r);
  } else if (stage == 2) {
    currentD = metatronsCube(uv, r);
    nextD = sriYantra(uv, r);
  } else {
    currentD = sriYantra(uv, r);
    nextD = sriYantra(uv, r); // at peak, no next
  }

  // Morph between stages
  float d = mix(currentD, nextD, uMorphProgress);

  // Line rendering with glow
  float lineWidth = 0.008;
  float glowWidth = 0.04;
  float line = 1.0 - smoothstep(0.0, lineWidth, d);
  float glow = 1.0 - smoothstep(lineWidth, glowWidth, d);

  // Breathing modulation
  float breath = sin(uBreathPhase * TAU) * 0.5 + 0.5;
  float intensity = uEmissiveIntensity * (0.7 + breath * 0.3);

  vec3 color = uColor * intensity;
  float alpha = (line + glow * 0.4) * outerMask * intensity;

  gl_FragColor = vec4(color, alpha);
}
```

- [ ] **Step 3: Create SacredMandala component**

Create `src/components/SacredMandala.tsx`:

```tsx
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'
import { getActiveThemeColors } from './LightingRig'
import mandalaVert from '../shaders/mandala.vert'
import mandalaFrag from '../shaders/mandala.frag'

const STAGE_TO_INDEX: Record<string, number> = {
  seed: 0,
  flower: 1,
  metatron: 2,
  sriYantra: 3,
}

export function SacredMandala() {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uStage: { value: 0 },
      uMorphProgress: { value: 0 },
      uColor: { value: new THREE.Color('#ffeaa7') },
      uEmissiveIntensity: { value: 0.5 },
      uBreathPhase: { value: 0 },
    }),
    [],
  )

  useFrame((state) => {
    const { sessionDepth } = useStore.getState().presence
    const mandalaStage = useStore.getState().mandalaStage
    const mandalaProgress = useStore.getState().mandalaProgress
    const breathPhase = useStore.getState().breathPhase
    const elapsed = useStore.getState().sessionElapsed
    const themeKey = useStore.getState().settings.theme

    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uStage.value = STAGE_TO_INDEX[mandalaStage] ?? 0
    uniforms.uMorphProgress.value = mandalaProgress
    uniforms.uBreathPhase.value = breathPhase

    // Mandala color from stage
    const stageIndex = STAGE_TO_INDEX[mandalaStage] ?? 0
    const stageColor = CONFIG.mandala.stageColors[stageIndex]
    uniforms.uColor.value.copy(stageColor)

    // Emissive intensity scales with sessionDepth
    uniforms.uEmissiveIntensity.value = 0.3 + sessionDepth * 0.7

    // Slow dual-axis rotation
    if (meshRef.current) {
      const breathSpeed = 0.8 + Math.sin(breathPhase * Math.PI * 2) * 0.2
      meshRef.current.rotation.y += 0.0003 * breathSpeed
      meshRef.current.rotation.z += 0.0002 * breathSpeed
    }

    // Point light from mandala
    if (lightRef.current) {
      lightRef.current.color.copy(stageColor)
      lightRef.current.intensity = sessionDepth * 5
    }
  })

  const { radiusY } = CONFIG.cathedral
  const mandalaY = radiusY * 0.7 // Near the top of the cathedral

  return (
    <group position={[0, mandalaY, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CONFIG.mandala.diameter, CONFIG.mandala.diameter]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={mandalaVert}
          fragmentShader={mandalaFrag}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        intensity={0}
        distance={25}
        decay={1.5}
      />
    </group>
  )
}
```

- [ ] **Step 4: Add SacredMandala to App.tsx**

Import and add `<SacredMandala />` inside `<XR>`.

- [ ] **Step 5: Verify visually**

```bash
npm run dev
```

Confirm: sacred geometry pattern visible near the top of the cathedral, glowing with the stage color, slowly rotating. As sessionDepth increases, it should brighten and the pattern should morph between stages.

To test quickly, temporarily set `arcDuration` to 120 seconds in config.ts.

- [ ] **Step 6: Commit**

```bash
git add src/shaders/ src/components/SacredMandala.tsx src/App.tsx
git commit -m "feat: add evolving sacred geometry mandala with custom shader"
```

---

## Task 11: Post-Processing

**Files:**
- Create: `src/components/PostProcessing.tsx`

- [ ] **Step 1: Create post-processing component**

Look up `@react-three/postprocessing` via Context7 for current API (EffectComposer, Bloom, ChromaticAberration, Vignette, Noise).

Create `src/components/PostProcessing.tsx`:

```tsx
import { useStore } from '../store/useStore'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { Vector2 } from 'three'

export function PostProcessing() {
  const qualityTier = useStore((s) => s.qualityTier)

  const showChromatic = qualityTier === 'high'
  const showNoise = qualityTier === 'high'
  const showBloom = qualityTier !== 'low'
  const bloomResolution = qualityTier === 'high' ? 512 : 256

  return (
    <EffectComposer>
      {showBloom && (
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
          resolutionX={bloomResolution}
          resolutionY={bloomResolution}
        />
      )}
      {showChromatic && (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new Vector2(0.003, 0.003)}
          radialModulation={false}
          modulationOffset={0}
        />
      )}
      <Vignette
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
      {showNoise && (
        <Noise
          blendFunction={BlendFunction.SOFT_LIGHT}
          opacity={0.15}
        />
      )}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
```

- [ ] **Step 2: Add PostProcessing to App.tsx**

Import and add `<PostProcessing />` inside `<XR>`, after all scene components.

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```

Confirm: bloom visible on emissive crystals and mandala. Subtle chromatic aberration at edges. Vignette darkening at screen edges. Noise grain barely visible.

- [ ] **Step 4: Commit**

```bash
git add src/components/PostProcessing.tsx src/App.tsx
git commit -m "feat: add post-processing stack with adaptive quality support"
```

---

## Task 12: Adaptive Quality System

**Files:**
- Create: `src/systems/AdaptiveQuality.tsx`

- [ ] **Step 1: Create adaptive quality component**

Create `src/systems/AdaptiveQuality.tsx`:

```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'
import { RollingAverage } from '../utils/smoothing'

const TIER_ORDER: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low']

export function AdaptiveQuality() {
  const fpsAvg = useRef(new RollingAverage(2, 90))
  const belowThresholdTime = useRef(0)
  const aboveThresholdTime = useRef(0)

  useFrame((_, delta) => {
    const override = useStore.getState().settings.qualityOverride
    if (override !== 'auto') {
      useStore.getState().setQualityTier(override)
      return
    }

    const dt = Math.min(delta, 0.1)
    const fps = dt > 0 ? 1 / dt : 90
    const avgFps = fpsAvg.current.push(fps)

    const currentTier = useStore.getState().qualityTier
    const currentIndex = TIER_ORDER.indexOf(currentTier)
    const currentThreshold = CONFIG.quality[currentTier].fpsThreshold

    // Check for downgrade
    if (avgFps < currentThreshold && currentIndex < TIER_ORDER.length - 1) {
      belowThresholdTime.current += dt
      aboveThresholdTime.current = 0
      if (belowThresholdTime.current > CONFIG.quality.downgradeDelay) {
        useStore.getState().setQualityTier(TIER_ORDER[currentIndex + 1])
        belowThresholdTime.current = 0
      }
    }
    // Check for upgrade
    else if (currentIndex > 0) {
      const higherTier = TIER_ORDER[currentIndex - 1]
      const upgradeThreshold = CONFIG.quality[higherTier].fpsThreshold + CONFIG.quality.hysteresis
      if (avgFps > upgradeThreshold) {
        aboveThresholdTime.current += dt
        belowThresholdTime.current = 0
        if (aboveThresholdTime.current > CONFIG.quality.upgradeDelay) {
          useStore.getState().setQualityTier(higherTier)
          aboveThresholdTime.current = 0
        }
      } else {
        aboveThresholdTime.current = 0
        belowThresholdTime.current = 0
      }
    } else {
      belowThresholdTime.current = 0
      aboveThresholdTime.current = 0
    }
  })

  return null
}
```

- [ ] **Step 2: Add AdaptiveQuality to App.tsx**

Import and add `<AdaptiveQuality />` inside `<XR>`.

- [ ] **Step 3: Verify tier switching**

Open console, monitor `qualityTier`. On desktop it should stay 'high'. To test downgrade, temporarily lower the threshold in config.ts to e.g. 120fps and confirm it drops to 'medium'.

- [ ] **Step 4: Commit**

```bash
git add src/systems/AdaptiveQuality.tsx src/App.tsx
git commit -m "feat: add adaptive quality FPS monitor with tier management"
```

---

## Task 13: Particle System

**Files:**
- Create: `src/components/ParticleField.tsx`

- [ ] **Step 1: Create the reactive particle field**

Look up `@react-three/drei` Sparkles and Points components via Context7 before implementing.

Create `src/components/ParticleField.tsx`:

```tsx
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'
import { getActiveThemeColors } from './LightingRig'

const DUST_COUNT = 500
const ASCENDING_COUNT = 300

function createParticlePositions(count: number, spread: number, yMin: number, yMax: number): Float32Array {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * spread
    positions[i3] = Math.cos(angle) * radius
    positions[i3 + 1] = yMin + Math.random() * (yMax - yMin)
    positions[i3 + 2] = Math.sin(angle) * radius
  }
  return positions
}

function AmbientDust() {
  const pointsRef = useRef<THREE.Points>(null)
  const { radiusX, radiusY } = CONFIG.cathedral

  const positions = useMemo(
    () => createParticlePositions(DUST_COUNT, radiusX * 0.8, -radiusY * 0.7, radiusY * 0.8),
    [radiusX, radiusY],
  )

  const velocities = useMemo(() => {
    const v = new Float32Array(DUST_COUNT * 3)
    for (let i = 0; i < DUST_COUNT; i++) {
      const i3 = i * 3
      v[i3] = (Math.random() - 0.5) * 0.02
      v[i3 + 1] = (Math.random() - 0.5) * 0.01
      v[i3 + 2] = (Math.random() - 0.5) * 0.02
    }
    return v
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const dt = Math.min(delta, 0.1)
    const { sessionDepth } = useStore.getState().presence
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array

    for (let i = 0; i < DUST_COUNT; i++) {
      const i3 = i * 3
      // Brownian motion
      arr[i3] += velocities[i3] * dt * 60
      arr[i3 + 1] += velocities[i3 + 1] * dt * 60
      arr[i3 + 2] += velocities[i3 + 2] * dt * 60

      // Randomize velocity slightly each frame
      velocities[i3] += (Math.random() - 0.5) * 0.002
      velocities[i3 + 1] += (Math.random() - 0.5) * 0.001
      velocities[i3 + 2] += (Math.random() - 0.5) * 0.002

      // Dampen
      velocities[i3] *= 0.99
      velocities[i3 + 1] *= 0.99
      velocities[i3 + 2] *= 0.99

      // Contain within bounds
      const dist = Math.sqrt(arr[i3] ** 2 + arr[i3 + 2] ** 2)
      if (dist > radiusX * 0.8) {
        velocities[i3] *= -0.5
        velocities[i3 + 2] *= -0.5
      }
    }
    pos.needsUpdate = true

    // Opacity scales with sessionDepth
    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = 0.2 + sessionDepth * 0.6
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={DUST_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffeaa7"
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

function AscendingStreams() {
  const pointsRef = useRef<THREE.Points>(null)
  const { radiusX, radiusY } = CONFIG.cathedral

  const positions = useMemo(
    () => createParticlePositions(ASCENDING_COUNT, radiusX * 0.5, -radiusY * 0.7, -radiusY * 0.3),
    [radiusX, radiusY],
  )

  const speeds = useMemo(() => {
    const s = new Float32Array(ASCENDING_COUNT)
    for (let i = 0; i < ASCENDING_COUNT; i++) {
      s[i] = 0.3 + Math.random() * 0.7
    }
    return s
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const dt = Math.min(delta, 0.1)
    const { sessionDepth } = useStore.getState().presence
    const mandalaStage = useStore.getState().mandalaStage
    const stageMultiplier = ['seed', 'flower', 'metatron', 'sriYantra'].indexOf(mandalaStage) + 1

    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const mandalaY = radiusY * 0.7

    for (let i = 0; i < ASCENDING_COUNT; i++) {
      const i3 = i * 3
      // Rise toward mandala
      arr[i3 + 1] += speeds[i] * dt * stageMultiplier * 0.5

      // Slight drift toward center as they rise
      arr[i3] *= 1 - dt * 0.1
      arr[i3 + 2] *= 1 - dt * 0.1

      // Reset when reaching mandala
      if (arr[i3 + 1] > mandalaY) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * radiusX * 0.5
        arr[i3] = Math.cos(angle) * radius
        arr[i3 + 1] = -radiusY * 0.7
        arr[i3 + 2] = Math.sin(angle) * radius
      }
    }
    pos.needsUpdate = true

    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = sessionDepth * 0.8
    mat.size = 0.02 + (stageMultiplier / 4) * 0.03
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={ASCENDING_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#55efc4"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

export function ParticleField() {
  const qualityTier = useStore((s) => s.qualityTier)
  const particleLayers = CONFIG.quality[qualityTier].particles

  return (
    <>
      <AmbientDust />
      {particleLayers >= 2 && <AscendingStreams />}
    </>
  )
}
```

- [ ] **Step 2: Add ParticleField to App.tsx**

Import and add `<ParticleField />` inside `<XR>`.

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```

Confirm: tiny dust motes floating in the space with slow Brownian motion. Ascending particles rising from floor toward mandala (visible once sessionDepth > 0). Particle density should increase as session progresses.

- [ ] **Step 4: Commit**

```bash
git add src/components/ParticleField.tsx src/App.tsx
git commit -m "feat: add reactive particle system with dust and ascending streams"
```

---

## Task 14: Scene Composition

**Files:**
- Create: `src/components/Scene.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Scene component to compose everything**

Create `src/components/Scene.tsx`:

```tsx
import { GeodeChamber } from './GeodeChamber'
import { CrystalFormation } from './CrystalFormation'
import { HeroCrystals } from './HeroCrystals'
import { SacredMandala } from './SacredMandala'
import { LightingRig } from './LightingRig'
import { ParticleField } from './ParticleField'
import { PostProcessing } from './PostProcessing'
import { BreathingPulse } from '../systems/BreathingPulse'
import { ReactivityEngine } from '../systems/ReactivityEngine'
import { AdaptiveQuality } from '../systems/AdaptiveQuality'
import { SessionArc } from '../systems/SessionArc'

export function Scene() {
  return (
    <>
      {/* Systems (no visual output) */}
      <BreathingPulse />
      <ReactivityEngine />
      <AdaptiveQuality />
      <SessionArc />

      {/* Environment */}
      <LightingRig />
      <GeodeChamber />

      {/* Crystals */}
      <CrystalFormation />
      <HeroCrystals />

      {/* Mandala */}
      <SacredMandala />

      {/* Particles */}
      <ParticleField />

      {/* Post-processing */}
      <PostProcessing />
    </>
  )
}
```

- [ ] **Step 2: Simplify App.tsx**

Update `src/App.tsx` to use Scene:

```tsx
import { Canvas } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'
import { OrbitControls } from '@react-three/drei'
import { Scene } from './components/Scene'
import { CONFIG } from './config'

const xrStore = createXRStore({
  emulate: 'metaQuest3',
  hand: true,
  controller: true,
  frameRate: 'high',
})

const playerY = -CONFIG.cathedral.radiusY * 0.35

export default function App() {
  return (
    <>
      <button
        onClick={() => xrStore.enterVR()}
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          zIndex: 10,
          background: '#6c5ce7',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Enter VR
      </button>
      <Canvas
        camera={{ position: [0, playerY, 0], fov: 75 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <XR store={xrStore}>
          <OrbitControls target={[0, playerY + 2, 0]} />
          <Scene />
        </XR>
      </Canvas>
    </>
  )
}
```

- [ ] **Step 3: Verify full scene**

```bash
npm run dev
```

Confirm: full scene visible — dark geode chamber, crystals on walls, hero crystals glowing, mandala at top, particles, bloom, all slowly awakening as session progresses.

- [ ] **Step 4: Commit**

```bash
git add src/components/Scene.tsx src/App.tsx
git commit -m "feat: compose full scene with all visual systems"
```

---

## Task 15: Locomotion — Gaze Drift

**Files:**
- Create: `src/interaction/GazeDrift.tsx`

- [ ] **Step 1: Create gaze drift locomotion**

Create `src/interaction/GazeDrift.tsx`:

```tsx
import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'

const _direction = new THREE.Vector3()
const _forward = new THREE.Vector3(0, 0, -1)

export function GazeDrift() {
  const { camera } = useThree()
  const rigRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    const locomotion = useStore.getState().settings.locomotion
    if (locomotion !== 'gaze') return

    const dt = Math.min(delta, 0.1)

    // Get gaze direction projected onto horizontal plane
    _direction.copy(_forward).applyQuaternion(camera.quaternion)
    _direction.y = 0
    const horizontalMagnitude = _direction.length()
    _direction.normalize()

    // Speed proportional to how far you look from center (horizontal component)
    // Looking straight = ~0 horizontal, looking sideways = high horizontal
    const speed = horizontalMagnitude * CONFIG.locomotion.maxDriftSpeed * dt

    // Move camera rig
    const newX = camera.position.x + _direction.x * speed
    const newZ = camera.position.z + _direction.z * speed

    // Soft boundary
    const distFromCenter = Math.sqrt(newX * newX + newZ * newZ)
    const maxDist = CONFIG.cathedral.radiusX - CONFIG.locomotion.boundaryDistance
    if (distFromCenter < maxDist) {
      camera.position.x = newX
      camera.position.z = newZ
    } else {
      // Reduce speed as we approach boundary
      const boundaryFactor = Math.max(0, 1 - (distFromCenter - maxDist * 0.8) / (maxDist * 0.2))
      camera.position.x += _direction.x * speed * boundaryFactor
      camera.position.z += _direction.z * speed * boundaryFactor
    }
  })

  return null
}
```

- [ ] **Step 2: Add GazeDrift to Scene.tsx**

Import and add `<GazeDrift />` in the systems section of Scene.tsx.

- [ ] **Step 3: Verify movement**

```bash
npm run dev
```

In VR or with emulated controls, looking left/right should cause a very slow drift in that direction. Looking straight ahead/down should not move. The boundary should prevent going through the walls.

- [ ] **Step 4: Commit**

```bash
git add src/interaction/GazeDrift.tsx src/components/Scene.tsx
git commit -m "feat: add drift-toward-gaze locomotion with soft boundaries"
```

---

## Task 16: Audio System

**Files:**
- Create: `src/audio/AudioManager.tsx`, `src/audio/AmbientDrone.tsx`, `src/audio/CrystalSounds.tsx`, `src/audio/tracks.ts`

- [ ] **Step 1: Create tracks metadata**

Create `src/audio/tracks.ts`:

```ts
export interface TrackMeta {
  name: string
  url: string
  mode: 'lofi' | 'nature'
}

// Placeholder URLs — replace with actual royalty-free tracks
// Download from Pixabay Music / Freesound.org and place in public/audio/
export const TRACKS: TrackMeta[] = [
  { name: 'Lofi Chill', url: '/audio/lofi-chill.mp3', mode: 'lofi' },
  { name: 'Cave Ambience', url: '/audio/cave-ambience.mp3', mode: 'nature' },
  { name: 'Dripping Water', url: '/audio/dripping.mp3', mode: 'nature' },
]
```

- [ ] **Step 2: Create ambient drone with Tone.js**

Look up Tone.js via Context7 for current API before implementing.

Create `src/audio/AmbientDrone.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useStore } from '../store/useStore'

export function AmbientDrone() {
  const isActive = useStore((s) => s.settings.audioMode === 'drone')
  const volume = useStore((s) => s.settings.volume)
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const filterRef = useRef<Tone.AutoFilter | null>(null)

  useEffect(() => {
    if (!isActive) {
      synthRef.current?.releaseAll()
      return
    }

    const setupDrone = async () => {
      await Tone.start()

      const reverb = new Tone.Reverb({ decay: 10, wet: 0.8 }).toDestination()
      const filter = new Tone.AutoFilter({
        frequency: 0.05,
        baseFrequency: 100,
        octaves: 4,
      }).connect(reverb).start()

      const synth = new Tone.PolySynth(Tone.FMSynth, {
        volume: -20,
        envelope: { attack: 4, decay: 2, sustain: 0.8, release: 8 },
        modulationIndex: 2,
        harmonicity: 1.5,
      }).connect(filter)

      reverbRef.current = reverb
      filterRef.current = filter
      synthRef.current = synth

      // Play evolving drone chord
      const notes = ['C2', 'G2', 'C3', 'E3']
      synth.triggerAttack(notes)
    }

    setupDrone()

    return () => {
      synthRef.current?.releaseAll()
      synthRef.current?.dispose()
      filterRef.current?.dispose()
      reverbRef.current?.dispose()
    }
  }, [isActive])

  // Volume control
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = -30 + volume * 20 // -30 to -10 dB
    }
  }, [volume])

  return null
}
```

- [ ] **Step 3: Create crystal sounds component**

Create `src/audio/CrystalSounds.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

// Pentatonic scale notes at different octaves
const PENTATONIC = ['C', 'D', 'E', 'G', 'A']
const OCTAVES = [3, 4, 5]

export function CrystalSounds() {
  const enabled = useStore((s) => s.settings.crystalSounds)
  const volume = useStore((s) => s.settings.volume)
  const { camera } = useThree()
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const lastTriggerTime = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const setup = async () => {
      await Tone.start()
      const reverb = new Tone.Reverb({ decay: 6, wet: 0.7 }).toDestination()
      const synth = new Tone.PolySynth(Tone.Synth, {
        volume: -25,
        envelope: { attack: 0.5, decay: 1, sustain: 0.3, release: 3 },
        oscillator: { type: 'sine' },
      }).connect(reverb)
      synthRef.current = synth
    }
    setup()

    return () => {
      synthRef.current?.releaseAll()
      synthRef.current?.dispose()
    }
  }, [enabled])

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = -35 + volume * 15
    }
  }, [volume])

  // Trigger notes based on gaze (simplified — not spatial yet)
  useFrame((state) => {
    if (!enabled || !synthRef.current) return
    const now = state.clock.elapsedTime
    if (now - lastTriggerTime.current < 3) return // Max one note per 3 seconds

    const focus = useStore.getState().presence.focus
    if (focus > 0.3) {
      const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)]
      const octave = OCTAVES[Math.floor(Math.random() * OCTAVES.length)]
      synthRef.current.triggerAttackRelease(`${note}${octave}`, '2n')
      lastTriggerTime.current = now
    }
  })

  return null
}
```

- [ ] **Step 4: Create audio manager**

Create `src/audio/AudioManager.tsx`:

```tsx
import { AmbientDrone } from './AmbientDrone'
import { CrystalSounds } from './CrystalSounds'

export function AudioManager() {
  return (
    <>
      <AmbientDrone />
      <CrystalSounds />
      {/* Lo-fi and Nature modes use HTML5 Audio — add in polish phase */}
    </>
  )
}
```

- [ ] **Step 5: Add AudioManager to Scene.tsx**

Import and add `<AudioManager />` in Scene.tsx.

- [ ] **Step 6: Create public/audio directory**

```bash
mkdir -p /Users/robeyjoyce/Documents/Development/crystal-game/public/audio
```

- [ ] **Step 7: Verify audio**

```bash
npm run dev
```

Click anywhere to trigger Tone.js audio context. With drone mode active, you should hear a deep evolving pad sound. When focus builds (steady gaze for >2s), crystal tones should play.

- [ ] **Step 8: Commit**

```bash
git add src/audio/ public/audio src/components/Scene.tsx
git commit -m "feat: add audio system with procedural drone and crystal sounds"
```

---

## Task 17: Hand Interaction

**Files:**
- Create: `src/interaction/HandInteraction.tsx`, `src/interaction/GazeFocus.tsx`

- [ ] **Step 1: Create gaze focus interaction**

Create `src/interaction/GazeFocus.tsx`:

```tsx
import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../store/useStore'

const _raycaster = new THREE.Raycaster()
const _direction = new THREE.Vector3()

/**
 * Gaze focus: steady gaze on a crystal for >2s brightens it.
 * Reads focus value from presence state.
 * Implementation: finds nearest crystal mesh to gaze ray and modifies its emissive.
 */
export function GazeFocus() {
  const { camera, scene } = useThree()
  const lastHit = useRef<THREE.Object3D | null>(null)
  const originalEmissive = useRef(new THREE.Color())

  useFrame(() => {
    const focus = useStore.getState().presence.focus

    // Reset previous hit
    if (lastHit.current && focus < 0.1) {
      const mat = (lastHit.current as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (mat?.emissive) {
        mat.emissive.copy(originalEmissive.current)
      }
      lastHit.current = null
    }

    if (focus < 0.2) return

    // Cast ray from camera
    _direction.set(0, 0, -1).applyQuaternion(camera.quaternion)
    _raycaster.set(camera.position, _direction)
    _raycaster.far = 20

    const intersects = _raycaster.intersectObjects(scene.children, true)
    const crystalHit = intersects.find(
      (hit) => hit.object instanceof THREE.InstancedMesh || hit.object.name?.includes('crystal'),
    )

    if (crystalHit) {
      const obj = crystalHit.object as THREE.Mesh
      const mat = obj.material as THREE.MeshStandardMaterial
      if (mat?.emissive) {
        if (lastHit.current !== obj) {
          originalEmissive.current.copy(mat.emissive)
          lastHit.current = obj
        }
        // Brighten based on focus
        mat.emissiveIntensity = 0.5 + focus * 2
      }
    }
  })

  return null
}
```

- [ ] **Step 2: Create hand interaction stub**

Create `src/interaction/HandInteraction.tsx`:

```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'

/**
 * Hand interaction: trails, crystal touch ripples, mandala gestures.
 * Requires @react-three/xr hand tracking input.
 *
 * Check Context7 for useXRInputSourceState / useXRControllerState API
 * to get hand/controller positions in the current @react-three/xr version.
 *
 * For now, this is a stub that will be connected to XR hand input
 * once testing on Quest 3.
 */
export function HandInteraction() {
  // TODO: Connect to XR hand tracking input sources
  // - Read hand joint positions from useXRInputSourceState
  // - Compute hand velocity for engagement metric
  // - Detect crystal proximity for touch ripple
  // - Detect spread gesture for mandala push
  // - Emit particle trails from hand positions

  return null
}
```

- [ ] **Step 3: Add both to Scene.tsx**

Import and add `<GazeFocus />` and `<HandInteraction />` to Scene.tsx.

- [ ] **Step 4: Verify gaze focus**

```bash
npm run dev
```

Look steadily at a crystal cluster for a few seconds. It should gradually brighten. Looking away should let it fade back.

- [ ] **Step 5: Commit**

```bash
git add src/interaction/ src/components/Scene.tsx
git commit -m "feat: add gaze focus interaction and hand interaction stub"
```

---

## Task 18: VR Menu

**Files:**
- Create: `src/ui/VRMenu.tsx`, `src/ui/DesktopOverlay.tsx`, `src/ui/EnterVRButton.tsx`

- [ ] **Step 1: Create desktop overlay for testing**

Create `src/ui/DesktopOverlay.tsx`:

```tsx
import { useStore, AudioMode, LocomotionMode, SessionMode, QualityOverride, BreathingSpeed, ThemeKey } from '../store/useStore'

const buttonStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 8px',
  fontSize: '11px',
  background: active ? '#6c5ce7' : '#2d2d44',
  color: active ? '#fff' : '#b2bec3',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
})

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '10px', color: '#636e72', textTransform: 'uppercase', marginBottom: '3px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

export function DesktopOverlay() {
  const settings = useStore((s) => s.settings)
  const setSetting = useStore((s) => s.setSetting)
  const qualityTier = useStore((s) => s.qualityTier)
  const presence = useStore((s) => s.presence)
  const mandalaStage = useStore((s) => s.mandalaStage)

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        background: 'rgba(13, 13, 26, 0.9)',
        borderRadius: '12px',
        padding: '12px',
        color: '#dfe6e9',
        fontSize: '12px',
        width: '220px',
        zIndex: 10,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(108, 92, 231, 0.3)',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>Settings</div>

      <SettingRow label="Audio">
        {(['drone', 'lofi', 'nature', 'spatialFx'] as AudioMode[]).map((m) => (
          <button key={m} style={buttonStyle(settings.audioMode === m)} onClick={() => setSetting('audioMode', m)}>
            {m === 'spatialFx' ? 'FX' : m}
          </button>
        ))}
      </SettingRow>

      <SettingRow label="Volume">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.volume}
          onChange={(e) => setSetting('volume', parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </SettingRow>

      <SettingRow label="Crystal Sounds">
        <button
          style={buttonStyle(settings.crystalSounds)}
          onClick={() => setSetting('crystalSounds', !settings.crystalSounds)}
        >
          {settings.crystalSounds ? 'ON' : 'OFF'}
        </button>
      </SettingRow>

      <SettingRow label="Theme">
        {(['auto', 'amethyst', 'celestial', 'rose', 'citrine'] as ThemeKey[]).map((t) => (
          <button key={t} style={buttonStyle(settings.theme === t)} onClick={() => setSetting('theme', t)}>
            {t}
          </button>
        ))}
      </SettingRow>

      <SettingRow label="Breathing">
        {(['slow', 'medium', 'fast'] as BreathingSpeed[]).map((s) => (
          <button key={s} style={buttonStyle(settings.breathingSpeed === s)} onClick={() => setSetting('breathingSpeed', s)}>
            {s}
          </button>
        ))}
      </SettingRow>

      <SettingRow label="Movement">
        {(['gaze', 'teleport', 'static'] as LocomotionMode[]).map((m) => (
          <button key={m} style={buttonStyle(settings.locomotion === m)} onClick={() => setSetting('locomotion', m)}>
            {m}
          </button>
        ))}
      </SettingRow>

      <SettingRow label="Session">
        {(['arc', 'freeform'] as SessionMode[]).map((m) => (
          <button key={m} style={buttonStyle(settings.sessionMode === m)} onClick={() => setSetting('sessionMode', m)}>
            {m}
          </button>
        ))}
      </SettingRow>

      <SettingRow label="Quality">
        {(['auto', 'high', 'medium', 'low'] as QualityOverride[]).map((q) => (
          <button key={q} style={buttonStyle(settings.qualityOverride === q)} onClick={() => setSetting('qualityOverride', q)}>
            {q}
          </button>
        ))}
      </SettingRow>

      {/* Debug info */}
      <div style={{ borderTop: '1px solid #2d2d44', paddingTop: '8px', marginTop: '8px', fontSize: '10px', color: '#636e72' }}>
        <div>Quality: {qualityTier} | Mandala: {mandalaStage}</div>
        <div>Depth: {presence.sessionDepth.toFixed(2)} | Still: {presence.stillness.toFixed(2)}</div>
        <div>Focus: {presence.focus.toFixed(2)} | Engage: {presence.engagement.toFixed(2)}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create styled Enter VR button**

Create `src/ui/EnterVRButton.tsx`:

```tsx
interface Props {
  onEnterVR: () => void
}

export function EnterVRButton({ onEnterVR }: Props) {
  return (
    <button
      onClick={onEnterVR}
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '1rem 2rem',
        fontSize: '1.2rem',
        zIndex: 10,
        background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 'bold',
        letterSpacing: '0.05em',
        boxShadow: '0 4px 20px rgba(108, 92, 231, 0.4)',
      }}
    >
      Enter VR
    </button>
  )
}
```

- [ ] **Step 3: Create VR menu stub**

Create `src/ui/VRMenu.tsx`:

```tsx
/**
 * In-VR floating settings panel using @react-three/uikit.
 *
 * Check Context7 for @react-three/uikit API before implementing.
 * This requires testing in an actual VR session.
 *
 * Controls to implement:
 * - Audio Mode: Drone / Lo-fi / Nature / FX
 * - Volume: Slider
 * - Crystal Sounds: Toggle
 * - Color Theme: Auto / Amethyst / Celestial / Rose / Citrine
 * - Breathing Speed: Slow / Med / Fast
 * - Movement: Gaze / Teleport / Static
 * - Session: Arc / Freeform
 * - Quality: Auto / High / Med / Low
 *
 * Toggled by controller menu button.
 */
export function VRMenu() {
  // TODO: Implement with @react-three/uikit once testing in VR
  return null
}
```

- [ ] **Step 4: Update App.tsx to use new UI components**

Update App.tsx to use `<EnterVRButton>` and `<DesktopOverlay>`:

```tsx
import { Canvas } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'
import { OrbitControls } from '@react-three/drei'
import { Scene } from './components/Scene'
import { DesktopOverlay } from './ui/DesktopOverlay'
import { EnterVRButton } from './ui/EnterVRButton'
import { CONFIG } from './config'

const xrStore = createXRStore({
  emulate: 'metaQuest3',
  hand: true,
  controller: true,
  frameRate: 'high',
})

const playerY = -CONFIG.cathedral.radiusY * 0.35

export default function App() {
  return (
    <>
      <EnterVRButton onEnterVR={() => xrStore.enterVR()} />
      <DesktopOverlay />
      <Canvas
        camera={{ position: [0, playerY, 0], fov: 75 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <XR store={xrStore}>
          <OrbitControls target={[0, playerY + 2, 0]} />
          <Scene />
        </XR>
      </Canvas>
    </>
  )
}
```

- [ ] **Step 5: Verify UI controls**

```bash
npm run dev
```

Confirm: desktop overlay visible in top-right with all settings. Clicking buttons changes settings. Debug info shows presence values updating. Enter VR button is styled.

- [ ] **Step 6: Commit**

```bash
git add src/ui/ src/App.tsx
git commit -m "feat: add desktop settings overlay and Enter VR button"
```

---

## Task 19: Integration Test & Polish

**Files:**
- Modify: various files for fixes found during testing

- [ ] **Step 1: Full desktop integration test**

```bash
npm run dev
```

Verify the full experience on desktop:
1. Scene loads with dark geode chamber
2. Crystals visible on walls, hero crystals have iridescence
3. Mandala visible at top, slowly rotating
4. Over ~1 minute (with reduced arcDuration for testing), scene awakens:
   - Lights brighten
   - Mandala evolves through stages
   - Particles intensify
5. Breathing pulse animates crystal emissive intensity
6. Settings panel controls work (change audio mode, theme, etc.)
7. No console errors or warnings

- [ ] **Step 2: Test quality tier switching**

From desktop overlay, switch quality to 'low':
- Bloom should disappear
- Chromatic aberration should disappear
- Only dust particles should remain
- Fewer hero crystals visible

Switch to 'high' — everything returns.

- [ ] **Step 3: Test audio**

1. Click anywhere to start audio context
2. Drone mode: deep pad sound should play
3. Crystal sounds on: steady gaze should trigger pentatonic tones
4. Toggle crystal sounds off: tones stop
5. Volume slider changes loudness

- [ ] **Step 4: Test theme switching**

Switch between Amethyst, Celestial, Rose, Citrine. Crystal emissive colors, light colors should change. Auto-cycle should slowly transition between all four.

- [ ] **Step 5: Fix any issues found**

Address any bugs, visual issues, or console errors discovered during testing.

- [ ] **Step 6: Add .gitignore entries**

Ensure `.gitignore` includes:

```
node_modules/
dist/
.superpowers/
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix: integration testing polish and fixes"
```

---

## Task 20: Quest 3 VR Testing

**Files:**
- Modify: as needed for VR-specific fixes

- [ ] **Step 1: Access from Quest 3**

Start dev server and note the local IP:

```bash
npm run dev
```

On Quest 3 browser, navigate to `https://<your-local-ip>:5173`. Accept the self-signed certificate warning.

- [ ] **Step 2: Enter VR and verify**

Press "Enter VR" button. Verify:
1. Scene renders in stereo
2. You're positioned inside the geode looking up at crystal vault
3. Head tracking works (look around)
4. Crystals render on all surfaces
5. Mandala visible overhead
6. No major framerate issues (check Quest performance overlay)

- [ ] **Step 3: Check framerate and adjust**

If framerate is low:
- Check which quality tier the adaptive system selected
- Try forcing 'low' quality from desktop overlay before entering VR
- Note which effects are most expensive

- [ ] **Step 4: Test controllers**

Verify controller input works:
- Point at objects
- Test teleport if locomotion mode set to 'teleport'

- [ ] **Step 5: Fix VR-specific issues**

Address any rendering, performance, or interaction issues found.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix: Quest 3 VR testing adjustments"
```

---

## Summary

| Task | Component | Key Files |
|------|-----------|-----------|
| 1 | Project Scaffolding | vite.config.ts, App.tsx, main.tsx |
| 2 | Store & Config | store/useStore.ts, config.ts, utils/smoothing.ts |
| 3 | Breathing Pulse | systems/BreathingPulse.tsx |
| 4 | Geode Chamber | components/GeodeChamber.tsx |
| 5 | Crystal Instancing | components/CrystalFormation.tsx, utils/crystalDistribution.ts |
| 6 | Hero Crystals | components/HeroCrystals.tsx |
| 7 | Lighting Rig | components/LightingRig.tsx |
| 8 | Reactivity Engine | systems/ReactivityEngine.tsx |
| 9 | Session Arc | systems/SessionArc.tsx |
| 10 | Sacred Mandala | components/SacredMandala.tsx, shaders/mandala.* |
| 11 | Post-Processing | components/PostProcessing.tsx |
| 12 | Adaptive Quality | systems/AdaptiveQuality.tsx |
| 13 | Particle System | components/ParticleField.tsx |
| 14 | Scene Composition | components/Scene.tsx |
| 15 | Gaze Drift | interaction/GazeDrift.tsx |
| 16 | Audio System | audio/AudioManager.tsx, AmbientDrone.tsx, CrystalSounds.tsx |
| 17 | Hand Interaction | interaction/HandInteraction.tsx, GazeFocus.tsx |
| 18 | UI / Menu | ui/DesktopOverlay.tsx, EnterVRButton.tsx, VRMenu.tsx |
| 19 | Integration Test | Various fixes |
| 20 | Quest 3 VR Test | VR-specific fixes |

**Stubs for future work** (not in this plan):
- `VRMenu.tsx` — full @react-three/uikit implementation (needs VR testing)
- `HandInteraction.tsx` — XR hand tracking trails, crystal touch, mandala gestures
- `TeleportSystem.tsx` — controller teleport with arc indicator and fade-to-black
- Interaction Sparks particle layer (Layer 3 — hand trails, crystal touch bursts, mandala gesture rings)
- Lo-fi and Nature audio modes (pre-recorded track playback)
- Caustic light projections shader
