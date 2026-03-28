# Crystal Geode Cathedral — Design Spec

> Refined design for an immersive VR meditation experience. The core theme: **the space is alive and responsive to your presence.**

## 1. Space Geometry

### Cathedral Shape
- **Elongated ellipsoid**, inverted — ~12m wide by ~25m tall
- Height-to-width ratio creates vertical cathedral feel, draws the eye upward
- Inner surface: high-subdivision `IcosahedronGeometry` with simplex noise displacement for rocky texture
- Floor: flattened base with additional noise for uneven rocky ground

### Crystal Distribution
- **Dense, maximal coverage** — crystals encrust nearly every surface
- Density gradient: sparse at floor level, increasingly dense toward the ceiling vault
- 3 crystal geometry types (varying hexagonal prism proportions) × 3 size classes = 9 `InstancedMesh` groups
- All crystals randomized in scale, rotation, and slight color variation within theme

### Player Position
- Starts at center, slightly below vertical midpoint (~1.5m eye height above floor)
- Looking up reveals the full crystal vault and mandala — the intended "whoa" moment

## 2. Crystal Materials

Three material tiers for performance:

### Hero Crystals (10–15 nearest to player)
- `MeshPhysicalMaterial` with `transmission: 1`, `thickness`, `roughness: 0.05`, `ior: 2.4`
- `iridescence: 1` with `iridescenceIOR` and `iridescenceThicknessRange` for rainbow caustics
- Emissive glow with selective bloom
- Count adjustable by adaptive quality system (15 → 8 → 3)

### Mid-tier Crystals (instanced, hundreds)
- `MeshStandardMaterial` with emissive map and faked transparency via alpha
- Color driven by theme uniforms — one draw call per type
- The visual workhorses of the scene

### Background Crystals (distant/ceiling)
- Simplified geometry, emissive-only material
- Contribute to dense vault feeling at minimal GPU cost
- LOD swaps at distance

## 3. Color Themes

Default: **auto-cycle** (full spectrum, transitions between all four themes over ~8 minutes per full cycle via uniform lerping).

User-selectable themes:
- **Amethyst:** purples, deep violets, magenta accents
- **Celestial:** teals, cyans, deep blues, white accents
- **Rose:** pinks, warm whites, soft gold accents
- **Citrine:** amber, gold, warm orange accents

Each theme defines a palette object in `config.ts`: crystal base color, emissive color, point light colors, mandala color, particle color.

## 4. Reactivity Engine (Centralized)

### Architecture
A single `ReactivityEngine` runs every frame in `useFrame` and computes four smoothed presence values (all 0.0–1.0), written to the Zustand store. All visual systems subscribe to these values — no component reads raw XR input directly.

### Presence State Values

| Value | Input Source | Behavior |
|-------|-------------|----------|
| `stillness` | Head rotation velocity, smoothed over 3-second rolling window | High when still. Threshold ~0.1 rad/s — generous, natural micro-movements don't break it |
| `focus` | Raycast from head position + direction | Climbs when gaze hit point stays within ~0.5m sphere for >2 seconds. Encourages but doesn't demand concentration |
| `engagement` | Hand position velocity, gesture detection | High during active interaction, low when hands rest |
| `sessionDepth` | Elapsed time accumulator | Climbs 0→1 over ~15–20 minutes. Drives the narrative arc. In freeform mode, loops at peak instead of fading back |

### How Systems Consume Presence State

| System | Primary Drivers |
|--------|----------------|
| Mandala evolution | `sessionDepth` sets target stage, `stillness` controls morph speed |
| Lighting | `sessionDepth` drives overall brightness/awakening |
| Particles | `engagement` + hand proximity for reactivity, `sessionDepth` for density |
| Crystal glow | `focus` + gaze direction for targeted brightening |
| Audio | Crystal tones triggered by gaze/proximity (independent of presence state) |

## 5. Sacred Geometry Mandala

### Evolution Stages
Progresses through four sacred geometry patterns as `sessionDepth` + `stillness` increase:

1. **Seed of Life** — 7 overlapping circles. Entry state. Simple, subtle.
2. **Flower of Life** — expanded circle pattern. ~5 min settled.
3. **Metatron's Cube** — 13 circles + connecting lines. ~10 min settled.
4. **Sri Yantra** — interlocking triangles with central bindu. ~15 min settled. Peak complexity.

### Progression Mechanics
- `sessionDepth` sets the target stage
- `stillness` controls morph speed — more still = faster transition; fidgeting stalls it
- Morph technique: parametric curve interpolation between stages, 30–60 second transitions with easing
- In **arc mode**: fades back to Seed of Life after peak, loops
- In **freeform mode**: stays at highest unlocked stage, loops continuously

### Rendering
- Custom shader on a circular plane, ~4m diameter
- Wireframe-style lines with emissive glow
- Slow dual-axis rotation, speed breathing-synced
- Acts as primary light source — emissive intensity increases with complexity

### Light Casting
Light color shifts with stage:
- Seed of Life → golden
- Flower of Life → violet
- Metatron's Cube → pink
- Sri Yantra → cyan

Casts prismatic light patterns through crystal formations downward into the cathedral.

## 6. Lighting System

### Dynamic Awakening
Lighting progresses through phases driven by `sessionDepth`:

| Phase | Time | Description |
|-------|------|-------------|
| Arrival | 0–2 min | Near darkness. Faint crystal emissives. Mandala barely visible. Ambient: 0.02 |
| Awakening | 2–7 min | Point lights fade in. Crystal glow intensifies. Colors emerge. Ambient: 0.02→0.08 |
| Luminous | 7–15 min | Full color saturation. Mandala casting light. Caustic projections active. Ambient: 0.08→0.15 |
| Peak/Fade | 15–20 min | Maximum luminosity, then gentle fade-back (arc mode). Ambient: 0.15→peak→0.05 |

### Light Sources
- **Primary:** Mandala — emissive, intensity scales with evolution stage
- **Secondary:** 4–6 colored point lights positioned behind/within crystal clusters (colors from active theme)
- **Accent:** Hero crystal emissives with selective bloom
- **Ambient:** Very low — the space should feel dark with pools of color
- **Environment map:** Dark/subtle HDR for crystal reflections

## 7. Reactive Particles

Three layers (reduced from five in original spec for performance), all responsive to presence:

### Layer 1: Ambient Dust
- Always present. Tiny white/gold motes in slow Brownian motion.
- Density scales with `sessionDepth` (sparse at entry, rich at peak)
- Particles near hands gently scatter outward
- Implementation: GPU instanced points with shader-based movement

### Layer 2: Ascending Streams
- Particles rising from floor toward the mandala
- Stream intensity and speed scales with mandala evolution stage
- At Sri Yantra stage: dense luminous columns of rising light
- Near hands: streams curve toward/around them
- Implementation: GPU instanced with velocity field shader

### Layer 3: Interaction Sparks
- Only appear during active interaction
- Hand movement leaves brief particle trails (colored by theme)
- Crystal touch emits burst of colored sparks
- Mandala gesture (spread hands) sends ring of particles outward
- Implementation: GPU instanced, spawned on events, age-based fade

## 8. Audio System

### Four Audio Modes (user-selectable via menu)

| Mode | Implementation | Description |
|------|---------------|-------------|
| Ambient Drone | Procedural (Tone.js) | Evolving pad sounds — slow filter sweeps, layered oscillators, reverb. Tone shifts with color theme. No licensing concerns. |
| Lo-fi / Chillhop | Pre-recorded (Howler.js) | Royalty-free tracks from Pixabay Music. Looping, crossfaded. Optional vinyl crackle overlay. |
| Nature / Cave | Spatialized samples (PositionalAudio) | Cave ambience from Freesound.org — dripping water at crystal locations, distant echoes, subtle wind. |
| Spatial FX Only | No music | Silence until you interact. Crystal tones + mandala hum only. Most meditative. |

### Crystal Sounds (Independent Toggle)
- Crystals emit harmonic tones (pentatonic scale) on gaze or proximity
- Pitch based on crystal size — larger crystals = lower pitch
- Uses Three.js `PositionalAudio` for spatial placement
- Mandala emits a low continuous hum that evolves in harmonic complexity with geometry stage
- Can be enabled/disabled independently of the audio mode

### Audio + Session Arc
- Selected mode plays throughout the session
- Volume envelope follows the arc subtly (±10%)

## 9. Locomotion & Interaction

### Locomotion Modes (user-selectable)

| Mode | Description |
|------|-------------|
| Drift-toward-gaze (default) | Very slow (~0.3 m/s max) in gaze direction. Speed proportional to how far you look from center. Hands-free. Comfort vignette activates during movement. |
| Teleport | Controller pointer + trigger. Arc indicator. Snap teleport with fade-to-black. For repositioning. |
| Static | Locked at center. Look-only. Best for seated meditation. |

### Movement Boundaries
Soft boundary at ~4m from geode walls. Drift speed reduces to zero as you approach. Nearby crystals glow subtly as a hint. No hard walls, no jarring stops.

### Enhanced Hand Interactions

| Interaction | Visual Response |
|-------------|----------------|
| Hand trail | Moving hands leave fading particle trails (theme-colored). Trail length scales with speed. GPU instanced points with age-based fade. |
| Crystal touch | Hand within ~0.3m of crystal: it glows brighter + emits tone. Glow ripples to crystals within ~2m radius over ~1.5s. Light cascade effect. |
| Mandala gesture | Spreading both hands apart near mandala: increases rotation speed briefly, sends particle ring expanding outward. Gentle "push" on evolution. |
| Gaze focus | Steady gaze on crystal cluster for >2s: cluster gradually brightens, nearby ascending particles bend toward gaze point. Rewards patient looking. |

## 10. Session Design

### Arc Mode (default)
~20 minute cycle through five phases:

1. **Arrival** (0–2 min) — dark, minimal, Seed of Life mandala
2. **Awakening** (2–7 min) — lights fade in, colors emerge, Flower of Life
3. **Luminous** (7–15 min) — full saturation, caustics active, Metatron's Cube
4. **Peak** (15–18 min) — maximum luminosity, Sri Yantra
5. **Settle** (18–20 min) — gentle fade back to calm, mandala returns to Seed of Life, loops

All systems (lighting, mandala, particles, crystal glow) follow the arc in sync.

### Freeform Mode
Same progression but no fade-back. Mandala stays at highest unlocked stage. Loops continuously at peak.

## 11. Adaptive Quality System

### Quality Tiers

| Tier | FPS Threshold | Features Enabled |
|------|--------------|-----------------|
| High | 80+ fps | All: 15 hero crystals, half-res bloom, chromatic aberration, 3 particle layers, hand trails, caustics, full mandala, vignette + noise grain |
| Medium | 65–79 fps | 8 hero crystals, quarter-res bloom, 2 particle layers (no sparks), crystal touch (no cascade), simplified mandala, vignette only |
| Low | <65 fps | 3 hero crystals, no post-processing (except vignette), 1 particle layer (dust only), basic mandala wireframe |

### FPS Monitor Behavior
- **Downgrade:** If average FPS drops below tier threshold for >4 seconds, drop one tier
- **Upgrade:** If average FPS exceeds next tier's threshold for >10 seconds, try upgrading
- **Hysteresis:** 5fps buffer between up/down thresholds
- **User override:** Menu option to lock quality tier

### Degradation Priority (cut first → cut last)
1. Chromatic aberration & noise grain
2. Hand particle trails
3. Caustic light projections
4. Interaction sparks & ripple cascades
5. Hero crystal count (15 → 8 → 3)
6. Bloom resolution (half → quarter → off) — last resort

## 12. VR Menu

Floating panel via `@react-three/uikit`, toggled by controller button.

### Controls
- **Audio Mode:** Drone / Lo-fi / Nature / FX (toggle buttons)
- **Volume:** Slider
- **Crystal Sounds:** On/Off toggle (independent of audio mode)
- **Color Theme:** Auto-cycle / Amethyst / Celestial / Rose / Citrine
- **Breathing Speed:** Slow / Med / Fast
- **Movement:** Gaze / Teleport / Static
- **Session:** Arc / Freeform
- **Quality:** Auto / High / Med / Low

## 13. VR Comfort
- No artificial rotation (ever)
- Vignette intensifies during drift movement
- Fade-to-black on teleport
- Seated experience by default
- All motion is slow and smooth
- 65fps hard floor maintained by adaptive quality (forgiving — prioritizes visual richness)

## 14. Performance Budget

| Metric | Target | Hard Limit |
|--------|--------|------------|
| Framerate | 80 fps | 65 fps (adaptive kicks in) |
| Draw calls | < 50 | < 100 |
| Triangles | < 150K total | < 300K |
| Textures | < 50MB VRAM | < 100MB |
| JS heap | < 100MB | < 200MB |
| Initial load | < 5s playable | < 10s |

### Key Optimization Strategies
1. `InstancedMesh` for all crystals — one draw call per type
2. Three material tiers (hero/mid/background)
3. LOD for distant crystals
4. Half-resolution bloom (quarter at medium tier)
5. GPU instanced particles with shader-based movement
6. Adaptive quality auto-degrades gracefully
7. Draco compression for any .glb models
8. Dark/subtle HDR environment map (small file size)

## 15. Tech Stack

As defined in CLAUDE.md:
- React Three Fiber + @react-three/xr v6+ + @react-three/drei + @react-three/postprocessing
- @react-three/uikit for VR menu
- Tone.js for procedural audio, Howler.js or HTML5 Audio for tracks
- Three.js PositionalAudio for spatial sound
- Zustand for state (presence values, audio state, settings, quality tier)
- Custom GLSL shaders via vite-plugin-glsl (iridescence, caustics, mandala)
- Vite + TypeScript

## 16. Differences from Original CLAUDE.md

| Aspect | Original | Refined |
|--------|----------|---------|
| Shape | Spherical/ovoid, 15–20m across | Elongated cathedral, 12m × 25m |
| Crystal density | Not specified precisely | Dense maximal, gradient toward ceiling |
| Default color | Not specified | Auto-cycle (full spectrum) |
| Mandala | Static Metatron's Cube or Flower of Life | Evolving: Seed → Flower → Metatron → Sri Yantra |
| Mandala behavior | Slow rotation, emits light | Reactive to stillness, evolves with session |
| Lighting | Static colored point lights | Dynamic awakening — starts dark, builds over session |
| Particles | 5 layers (dust, sparkle, mist, wisps, ascending) | 3 reactive layers (dust, ascending, interaction sparks) |
| Particle behavior | Ambient motion | Reactive to presence, hands, mandala state |
| Locomotion | Orbit / teleport / static | Drift-toward-gaze / teleport / static |
| Interaction | Point at crystal, grab orbs | Enhanced: hand trails, crystal ripple cascades, mandala gestures, gaze focus |
| Session structure | Not defined | Arc mode (20 min cycle) + freeform mode |
| Reactivity | Not present | Central reactivity engine with presence state |
| Quality management | Simple FPS monitor | 3-tier adaptive system with defined degradation order |
| FPS thresholds | 90 target / 72 minimum | 80+ high / 65–79 medium / <65 low (forgiving) |
| Crystal sounds | Part of interaction | Independent toggle, separate from audio mode |
