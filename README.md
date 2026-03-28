# Crystal Geode Cathedral

A trippy, meditative WebXR experience. Step inside a massive crystalline geode cathedral where iridescent crystal formations surround you, sacred geometry evolves overhead, and the entire space breathes and responds to your presence.

Built for Quest 3. Works on desktop.

## Quick Start

```bash
npm install
npm run dev
```

Open `https://localhost:5173` in your browser. On Quest 3, open the same URL using your local network IP.

## What It Is

This is a visual meditation space — put on a headset, sit back, and lose yourself for 20 minutes. The space is alive:

- **Sacred geometry mandala** evolves from Seed of Life to Sri Yantra as you settle in
- **Lighting awakens** from near-darkness to full luminosity over a session arc
- **Crystals respond** to your gaze, glowing brighter when you focus
- **Particles drift** upward toward the mandala, intensifying as the experience deepens
- **Everything breathes** on a slow synchronized pulse

## Features

**Reactive Systems** — A centralized reactivity engine tracks your stillness, focus, and engagement, driving every visual system in sync.

**Adaptive Quality** — FPS monitor automatically adjusts visual fidelity across three tiers (high/medium/low) to maintain smooth performance on Quest 3.

**Procedural Audio** — Ambient drone generated via Tone.js with spatial crystal tones triggered by gaze focus. Four audio modes: Drone, Lo-fi, Nature, Spatial FX.

**Color Themes** — Amethyst, Celestial, Rose, Citrine, or auto-cycle through all four.

**Session Modes** — Arc mode (20-minute journey from dark to luminous and back) or Freeform (stay at peak).

## Controls

**Desktop:** Settings panel in the top-right corner. Orbit with mouse.

**VR:** Press "Enter VR" to start. Drift-toward-gaze locomotion (look where you want to go). Controller teleport and static mode also available.

## Tech Stack

React Three Fiber, @react-three/xr, @react-three/drei, @react-three/postprocessing, Three.js, Zustand, Tone.js, custom GLSL shaders, Vite, TypeScript.

## Quest 3 Development

The dev server runs with HTTPS (required for WebXR). Access from Quest 3 browser via your local network IP:

```bash
# Server starts on both localhost and network
npm run dev
# Open https://<your-ip>:5173 on Quest 3
```

## License

MIT
