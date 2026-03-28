# Crystal Geode Cathedral

> A trippy, meditative VR experience. You're standing inside a massive crystalline geode cathedral -- iridescent crystal formations surround you, sacred geometry mandalas rotate overhead casting prismatic light patterns, particle mist drifts through the space, and everything pulses with slow, breathing energy.

## Vision

This is not a game. It's a **visual meditation space** -- something you put on the Quest 3, sit back, and lose yourself in for 20 minutes. Think: the intersection of a cathedral, a crystal cave, a DMT trip, and a meditation app. The visuals should be stunning enough that someone takes the headset off and says "holy shit."

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React Three Fiber (R3F) | React-based Three.js -- you know React, this is the fastest path |
| VR | `@react-three/xr` v6+ | First-class WebXR for R3F, Quest 3 tested, hand tracking support |
| Helpers | `@react-three/drei` | Environment maps, Float, MeshTransmission, shaders, etc. |
| Post-processing | `@react-three/postprocessing` (pmndrs) | Bloom, chromatic aberration, vignette, depth of field |
| Particles | `@react-three/drei` Sparkles + custom shaders | GPU instanced particles for performance |
| Audio | Tone.js or Howler.js | Spatial audio, ambient soundscapes, user-selectable tracks |
| State | Zustand | Lightweight store for breathing state, audio, VR settings |
| Shaders | vite-plugin-glsl | Import .glsl files directly in Vite |
| Build | Vite | Fast HMR, handles WASM/workers, you already know it |
| Language | TypeScript | Type safety for shader uniforms and scene graph |
| Deployment | GitHub Pages or Coolify | Quest 3 needs HTTPS to enter WebXR |

### Key Dependencies

```json
{
  "@react-three/fiber": "^9.x",
  "@react-three/drei": "^10.x",
  "@react-three/xr": "^6.x",
  "@react-three/postprocessing": "^3.x",
  "@react-three/uikit": "latest",
  "three": "^0.172.x",
  "postprocessing": "^6.x",
  "tone": "^15.x",
  "zustand": "^5.x",
  "vite": "^6.x",
  "vite-plugin-glsl": "^1.x",
  "typescript": "^5.x"
}
```

> **Check versions at build time** -- these move fast. Use `npm info <package> version` to confirm latest before installing. Tone.js v15 may not yet exist -- fall back to `^14.x` if needed.

## Architecture

```
crystal-geode-cathedral/
├── public/
│   ├── models/           # .glb crystal models from Sketchfab
│   ├── textures/         # HDR environment maps, normal maps
│   ├── audio/            # Ambient tracks (royalty-free)
│   └── draco/            # Draco decoder for compressed glTF
├── src/
│   ├── main.tsx          # Entry point
│   ├── App.tsx           # Canvas + XR setup + post-processing
│   ├── components/
│   │   ├── GeodeChamber.tsx       # Main geode shell geometry
│   │   ├── CrystalFormation.tsx   # Individual crystal cluster (instanced)
│   │   ├── CrystalMaterial.tsx    # Custom iridescent/transmission shader
│   │   ├── SacredGeometry.tsx     # Rotating mandala with light casting
│   │   ├── ParticleField.tsx      # Dust motes, sparkles, mist
│   │   ├── CausticLights.tsx      # Prismatic light projections on walls
│   │   ├── AmbientOrbs.tsx        # Floating light orbs that drift
│   │   └── BreathingPulse.tsx     # Global slow-breathe animation controller
│   ├── audio/
│   │   ├── AudioManager.tsx       # Track selection, spatial audio setup
│   │   └── tracks.ts             # Track metadata
│   ├── ui/
│   │   ├── VRMenu.tsx            # In-VR floating menu (audio, visuals)
│   │   ├── DesktopOverlay.tsx    # Desktop controls overlay
│   │   └── EnterVRButton.tsx     # Styled VR entry button
│   ├── shaders/
│   │   ├── iridescent.glsl      # Crystal iridescence fragment shader
│   │   ├── caustic.glsl         # Caustic light projection
│   │   └── mandala.glsl         # Sacred geometry pattern generation
│   ├── hooks/
│   │   ├── useBreathing.ts      # Synchronized breathing animation (use useFrame delta, not wall clock)
│   │   ├── useAudioReactive.ts  # Optional: visuals respond to audio
│   │   └── useVRLocomotion.ts   # Teleport / drift locomotion
│   ├── store/
│   │   └── useStore.ts          # Zustand store (breathing phase, audio state, VR settings, color theme)
│   └── config.ts               # Tunable parameters (colors, speeds, intensities)
├── index.html
├── vite.config.ts
├── tsconfig.json
└── CLAUDE.md                   # This file
```

## Scene Design

### The Geode Chamber

You're inside a roughly spherical/ovoid chamber about 15-20 meters across. The walls are dark volcanic rock with crystalline formations erupting inward from every surface -- floor, walls, ceiling. The crystals get denser and larger toward the top, forming a cathedral-like vault.

**Geometry approach:**
- Geode shell: Inverted sphere/ellipsoid with displacement mapping for rocky texture
- Crystal formations: Mix of procedural (instanced elongated hexagonal prisms with randomized proportions) and downloaded glTF models from Sketchfab
- Floor: Slightly uneven rocky surface with smaller crystal clusters

### Crystal Materials (THE hero element)

The crystals need to look incredible. This is what sells the experience.

**Material stack:**
1. `MeshPhysicalMaterial` with `transmission: 1`, `thickness`, `roughness: 0.05`, `ior: 2.4` (diamond-like)
2. Custom iridescence via `iridescence: 1`, `iridescenceIOR`, `iridescenceThicknessRange`
3. Or go full custom shader: thin-film interference simulation for rainbow caustics
4. Emissive glow on select crystals (these get selective bloom)
5. Color palette: amethyst purples, celestial blues, rose quartz pinks, citrine golds -- slowly cycling via uniforms

**Performance note for Quest 3:** MeshPhysicalMaterial with transmission is expensive. Start with 3-5 hero crystals closest to the viewer and scale up to 10-15 only if framerate allows. Background crystals use a cheaper approximation -- `MeshStandardMaterial` with an emissive map and faked transparency via alpha. Profile on device after each batch increase.

### Sacred Geometry Mandala

A large (3-5m diameter) sacred geometry pattern floating at the center-top of the cathedral. Options:

- **Metatron's Cube** or **Flower of Life** pattern
- Rendered as thin wireframe geometry or a custom shader on a plane
- Slowly rotates on two axes
- Emits light (acts as a point/area light source)
- Casts shadow patterns through the crystal formations
- Color-shifts over time (golden -> violet -> cyan -> golden)

### Particle Systems

Multiple overlapping particle layers for depth:

1. **Dust motes** -- tiny white/gold particles, slow brownian motion, catch the light (Drei `<Sparkles>`)
2. **Prismatic sparkle** -- occasional bright flashes on crystal surfaces (custom instanced points)
3. **Mist/fog** -- low-lying volumetric fog effect at floor level (could use a noise-driven transparent plane)
4. **Energy wisps** -- slow-moving glowing orbs that drift through the space leaving faint particle trails (Drei `<Float>` wrapped meshes with trail effect)
5. **Ascending particles** -- gentle upward drift from floor, like embers in reverse, toward the mandala

### Lighting

- **Primary:** The sacred geometry mandala as an emissive light source (warm golden)
- **Secondary:** 4-6 colored point lights positioned behind/within crystal clusters (purple, blue, pink, amber)
- **Accent:** Emissive crystals providing localized glow + selective bloom
- **Ambient:** Very low ambient light -- the space should feel dark with pools of color
- **Environment map:** Dark/subtle HDR for reflections on crystal surfaces (studio lighting HDR or a custom dark cave HDR)

### Post-Processing Stack

```
RenderPass
  -> UnrealBloomPass (selective bloom on emissive crystals + mandala)
  -> ChromaticAberration (subtle, 0.002-0.005)
  -> Vignette (medium darkness at edges)
  -> Noise (very subtle film grain)
  -> ToneMapping (ACES filmic)
```

**Quest 3 performance:** Post-processing is rendered per-eye in stereo. Keep the bloom resolution at half or quarter. Test framerate early and often -- 72fps minimum, 90fps target.

### Animation & Breathing

Everything in the scene breathes on a slow cycle (configurable, default ~8 seconds per breath):

- Crystal emissive intensity pulses gently (sine wave, 0.3 -> 1.0)
- Mandala rotation speed subtly accelerates/decelerates
- Particle density waxes and wanes
- Light intensity and color temperature shift
- Optional: tie to actual breathing if using hand tracking (detect chest rise?)

The key is **slowness**. Nothing should move fast. This is meditation, not a rave.

## Audio System

User-selectable audio modes via in-VR menu:

1. **Ambient Drone** -- deep, evolving pad sounds (think: Biosphere, Stars of the Lid)
2. **Lo-fi / Chillhop** -- relaxed beats (use royalty-free tracks or generate with Tone.js)
3. **Nature Sounds** -- cave ambience: dripping water, distant echoes, wind
4. **Spatial Sound Effects Only** -- no music, just spatialized crystal resonance, wind, drips

**Implementation:**
- Use Tone.js for procedural audio (drones, crystal resonance tones)
- Howler.js or HTML5 Audio for pre-recorded tracks
- Spatial audio: position sound emitters at crystal locations using Three.js `PositionalAudio`
- Crystal "singing" -- when the player looks at or approaches a crystal, it emits a harmonic tone (pentatonic scale, random note from the scale)

**Royalty-free audio sources:**
- Freesound.org (cave ambience, drips, wind)
- Pixabay Music (ambient/lo-fi tracks)
- Generate drones procedurally with Tone.js (safer licensing)

## VR Interaction

### Locomotion
- **Primary:** Slow automatic drift/orbit around the center (adjustable speed, including stop)
- **Secondary:** Teleport via controller pointer (for repositioning)
- **Passive mode:** Lock position, just look around

### Hand/Controller Interaction
- Point at a crystal -> it glows brighter and emits a tone
- Grab gesture near floating orbs -> they follow your hand briefly
- Menu access via controller button (floating panel with audio/visual toggles)

### Comfort
- No artificial rotation (prevents motion sickness)
- Slow, smooth movements only
- Vignette intensifies slightly during any movement (comfort mode)
- Seated experience by default

## In-VR Settings Menu

A floating panel (use `@react-three/uikit` or custom 3D UI) with:

- **Audio Mode:** Drone / Lo-fi / Nature / Spatial FX (toggle buttons)
- **Volume:** Slider
- **Color Theme:** Amethyst / Celestial / Rose / Citrine / Auto-cycle
- **Breathing Speed:** Slow / Medium / Fast
- **Particle Density:** Low / Medium / High
- **Bloom Intensity:** Subtle / Medium / Intense
- **Movement:** Orbit / Teleport / Static

## Performance Budget (Quest 3 via WebXR)

| Metric | Target | Hard Limit |
|--------|--------|------------|
| Framerate | 90 fps | 72 fps minimum |
| Draw calls | < 50 | < 100 |
| Triangles | < 150K total | < 300K |
| Textures | < 50MB VRAM | < 100MB |
| JS heap | < 100MB | < 200MB |
| Initial load | < 5s playable | < 10s |

### Optimization Strategies

1. **Instance everything:** Crystal formations should use `InstancedMesh` -- one draw call for hundreds of crystals
2. **LOD:** High-detail crystals near player, simplified versions at distance
3. **Texture atlasing:** Combine crystal textures into atlas sheets
4. **Deferred bloom:** Half-resolution bloom pass
5. **Shader complexity:** Use `MeshPhysicalMaterial` on max 10-15 hero crystals; `MeshStandardMaterial` for the rest
6. **Particles:** GPU instanced, not CPU-driven. Shader-based movement
7. **Baked lighting:** Pre-bake light maps for static elements where possible
8. **Draco compression:** Compress all .glb models
9. **Frustum culling:** Three.js does this by default but ensure it's not disabled
10. **Profile on device:** Use Quest browser's performance overlay early and often
11. **Adaptive quality:** Implement a simple FPS monitor that automatically disables expensive effects (bloom, chromatic aberration, transmission materials) if framerate drops below 72fps for more than 2 seconds

## 3D Asset Sources (Free)

### Crystal Models (Sketchfab -- download as glTF/glb)
- Search: `crystal`, `geode`, `amethyst`, `quartz` on Sketchfab
- Filter by: Downloadable, CC license
- Key finds:
  - "Low-poly Crystal Geode" by Art-Teeves (PBR textures included)
  - "Crystal Pack" by sofyamakingart (22 crystal models, free)
  - Various photogrammetry mineral scans in the "Crystals Non Commercial" collection

### Environment/HDR Maps
- Poly Haven (polyhaven.com) -- free HDR environment maps (CC0)
- Search for dark/moody studio HDRIs or cave environments

### Procedural Generation
- Most of the scene should be procedural:
  - Crystal prisms = elongated `CylinderGeometry` with hexagonal cross-section + random scale/rotation
  - Geode shell = inverted `IcosahedronGeometry` with noise displacement
  - Mandala = programmatic wireframe geometry (circles, lines, polygons)

## Development Phases

### Phase 1: Foundation (Saturday morning, ~2-3 hours)
1. Scaffold Vite + R3F + TypeScript project
2. Basic scene: camera, lighting, orbit controls
3. WebXR setup with `@react-three/xr` -- confirm VR entry works on Quest 3
4. Place a few test crystal geometries with basic PBR material
5. Add HDR environment map

### Phase 2: Crystal Materials & Geode (Saturday afternoon, ~3-4 hours)
1. Build the geode chamber (inverted sphere with displacement)
2. Create the crystal material system (transmission + iridescence)
3. Instance crystal formations around the interior walls
4. Add the sacred geometry mandala (start with wireframe Metatron's Cube)
5. Set up the lighting rig (colored point lights + emissive crystals)

### Phase 3: Post-Processing & Particles (Saturday evening, ~2-3 hours)
1. Add post-processing stack (bloom, chromatic aberration, vignette)
2. Implement selective bloom on emissive elements
3. Add dust mote particles (`<Sparkles>`)
4. Add floating energy orbs with `<Float>`
5. First Quest 3 test -- check performance, adjust

### Phase 4: Animation & Audio (Sunday morning, ~3-4 hours)
1. Implement the breathing pulse system (global sine wave driving uniforms)
2. Color cycling on crystals and mandala
3. Audio system setup (Tone.js for drones, load ambient tracks)
4. Spatial audio positioning
5. Crystal interaction sounds

### Phase 5: VR Polish (Sunday afternoon, ~3-4 hours)
1. In-VR settings menu
2. Locomotion (orbit + teleport)
3. Hand/controller interactions (crystal glow on point)
4. Comfort features (movement vignette)
5. Performance optimization pass
6. Deploy to HTTPS for Quest 3 testing

## Working with Claude Code

### Context7 — always use for docs
**IMPORTANT:** Always use Context7 (MCP) to look up documentation before writing code that uses any library in this project. Do NOT rely on training data for API signatures, component props, or configuration options — they change frequently. This applies to all key dependencies including but not limited to:

- `@react-three/fiber`, `@react-three/drei`, `@react-three/xr`, `@react-three/postprocessing`, `@react-three/uikit`
- `three`, `postprocessing`
- `tone` (Tone.js)
- `zustand`
- `vite`, `vite-plugin-glsl`

**When to query Context7:**
- Before using any component, hook, or API from these libraries
- When configuring Vite plugins or build settings
- When writing shader integration code (e.g. `shaderMaterial` from drei)
- When setting up WebXR features via `@react-three/xr`
- When encountering unexpected behavior or deprecation warnings
- When adding new dependencies to the project

**How:** Use `resolve-library-id` first to get the library ID, then `query-docs` with a specific topic. Be specific in queries (e.g. "MeshPhysicalMaterial transmission" not just "materials").

### Prompting strategy
This project is shader-heavy and visual. When working with Claude Code:

1. **Build incrementally.** Get one crystal looking amazing before instancing hundreds.
2. **Test on Quest 3 early.** Don't wait until Sunday to discover performance issues.
3. **Use the R3F/Drei ecosystem.** Don't write raw Three.js when Drei has a component for it.
4. **Shader iteration:** Ask Claude to write GLSL shaders, paste the visual result back and ask for adjustments. Shaders are perfect for LLM-assisted development.
5. **Performance:** If framerate drops, ask Claude to profile and suggest the specific bottleneck.
6. **Look it up, don't guess.** Always use Context7 to verify API usage before writing code. Training data goes stale — docs don't.

### Key Claude Code commands you'll use
```bash
# Init
npx create-vite crystal-geode-cathedral --template react-ts
cd crystal-geode-cathedral
npm install @react-three/fiber @react-three/drei @react-three/xr @react-three/postprocessing @react-three/uikit three postprocessing tone zustand
npm install -D vite-plugin-glsl

# Dev (local)
npm run dev

# Dev (accessible from Quest 3 on local network)
# Add to vite.config.ts: server: { host: true, https: true }
# Or use ngrok/cloudflared for HTTPS tunnel

# Quest 3 testing
# Open Quest browser -> navigate to https://<your-local-ip>:5173
# Or deploy to GitHub Pages / Coolify for proper HTTPS
```

### HTTPS for Quest 3 Development
WebXR requires a secure context. Options:
1. **Vite with `@vitejs/plugin-basic-ssl`** -- self-signed cert for local dev
2. **ngrok** -- `ngrok http 5173` gives you a public HTTPS URL
3. **Cloudflare Tunnel** -- you already have Coolify, could tunnel through there
4. **GitHub Pages** -- deploy for final testing

## Inspiration References

- [Moment Factory](https://momentfactory.com/) -- immersive light installations
- [TeamLab](https://www.teamlab.art/) -- digital art installations
- Real amethyst geode cathedrals (Google Images: "amethyst cathedral geode")
- [Electric Sheep](https://electricsheep.org/) -- generative fractal art
- Buddhist/Hindu mandala sacred geometry
- Naica Crystal Cave, Mexico (the real thing -- enormous selenite crystals)

## Success Criteria

You'll know it's done when:
- [ ] You put on the Quest 3, enter VR, and go "whoa"
- [ ] The crystals look like they're actually refracting light
- [ ] The space feels alive -- everything breathes and pulses
- [ ] You can sit in it for 10+ minutes and feel relaxed
- [ ] The audio adds to the atmosphere, not distracts
- [ ] Framerate stays above 72fps on Quest 3
- [ ] At least one other person (Corlia) says it looks amazing
