import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'

const MESSAGE = 'Corlia, I love you'
const PARTICLE_COUNT = 3000
const GATHER_DURATION = 4.0    // slow, graceful gathering
const HOLD_DURATION = 5.0      // linger on the words
const DISSOLVE_DURATION = 5.0  // slow dissolve upward like embers
const FADE_DURATION = 3.0      // gentle fade

function sampleTextPositions(text: string, maxParticles: number): Float32Array {
  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = 1024 * scale
  canvas.height = 128 * scale
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.font = `italic bold ${48 * scale}px Georgia, "Times New Roman", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  const candidates: [number, number][] = []
  const step = 2
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const idx = (y * canvas.width + x) * 4
      if (pixels[idx] > 128) candidates.push([x, y])
    }
  }

  const count = Math.min(candidates.length, maxParticles)
  const positions = new Float32Array(count * 3)

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  const textWidth = 4.5
  const textHeight = textWidth * (canvas.height / canvas.width)

  for (let i = 0; i < count; i++) {
    const [px, py] = candidates[i]
    positions[i * 3] = (px / canvas.width - 0.5) * textWidth
    positions[i * 3 + 1] = -(py / canvas.height - 0.5) * textHeight
    positions[i * 3 + 2] = 0
  }

  return positions
}

// Each particle has its own delay before it starts dissolving,
// creating a wave that sweeps across the text rather than
// everything exploding at once
const vertexShader = /* glsl */ `
  attribute vec3 aStartPos;
  attribute float aSpeed;
  attribute float aPhase;
  attribute float aDissolveDelay; // 0-1, staggered dissolve timing

  uniform float uGatherProgress;   // 0=scattered, 1=text formed
  uniform float uDissolveProgress; // 0=text, 1=fully dissolved
  uniform float uOpacity;
  uniform float uTime;
  uniform float uBreathPhase;

  varying float vAlpha;
  varying float vWarmth; // 0=gold, 1=pink

  // Smooth ease
  float easeOutCubic(float t) {
    return 1.0 - pow(1.0 - t, 3.0);
  }
  float easeInOutQuad(float t) {
    return t < 0.5 ? 2.0 * t * t : 1.0 - pow(-2.0 * t + 2.0, 2.0) / 2.0;
  }

  void main() {
    vec3 textPos = position;
    vec3 pos;

    if (uGatherProgress < 1.0) {
      // Phase 1: Gather — particles drift in from start positions
      float g = easeOutCubic(uGatherProgress);
      pos = mix(aStartPos, textPos, g);
      // Gentle spiral motion during gather
      float spiralAngle = (1.0 - g) * aPhase * 2.0 + uTime * 0.5;
      float spiralRadius = (1.0 - g) * 0.3;
      pos.x += cos(spiralAngle) * spiralRadius;
      pos.y += sin(spiralAngle) * spiralRadius;
    }
    else if (uDissolveProgress <= 0.0) {
      // Phase 2: Hold — gentle breathing shimmer
      pos = textPos;
      float breath = sin(uBreathPhase * 6.28) * 0.5 + 0.5;
      // Tiny floating motion, like the text is alive
      pos.x += sin(uTime * 1.5 + aPhase * 3.0) * 0.008;
      pos.y += cos(uTime * 1.2 + aPhase * 2.5) * 0.008;
      pos.z += sin(uTime * 0.8 + aPhase * 4.0) * 0.005;
    }
    else {
      // Phase 3: Dissolve — each particle lifts off at its own time
      // like embers rising from a fire, not an explosion
      float myProgress = clamp((uDissolveProgress - aDissolveDelay) / (1.0 - aDissolveDelay + 0.01), 0.0, 1.0);
      float ease = easeInOutQuad(myProgress);

      pos = textPos;
      // Rise upward gently
      pos.y += ease * (2.0 + aSpeed * 3.0);
      // Drift outward slightly
      pos.x += ease * sin(aPhase * 6.28) * (0.5 + aSpeed * 1.5);
      pos.z += ease * cos(aPhase * 6.28) * 0.5;
      // Gentle floating
      pos.x += sin(uTime * aSpeed + aPhase) * 0.15 * ease;
      pos.z += cos(uTime * aSpeed * 0.7 + aPhase) * 0.1 * ease;
    }

    // Sparkle / twinkle
    float sparkle = sin(uTime * 3.0 + aPhase * 6.28) * 0.5 + 0.5;
    float pulse = sin(uTime * 1.5 + aPhase * 3.14) * 0.5 + 0.5;
    vWarmth = pulse;

    // Alpha: particles that have dissolved more are dimmer
    float dissolveAlpha = 1.0;
    if (uDissolveProgress > 0.0) {
      float myProgress = clamp((uDissolveProgress - aDissolveDelay) / (1.0 - aDissolveDelay + 0.01), 0.0, 1.0);
      dissolveAlpha = 1.0 - myProgress * 0.7; // don't fully disappear yet
    }
    vAlpha = uOpacity * dissolveAlpha;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size
    float baseSize = 0.045;
    // Bigger during gather (firefly), smaller in text (crisp), bigger during dissolve (ember)
    if (uGatherProgress < 1.0) {
      baseSize = mix(0.07, 0.04, easeOutCubic(uGatherProgress));
    } else if (uDissolveProgress > 0.0) {
      float myProgress = clamp((uDissolveProgress - aDissolveDelay) / (1.0 - aDissolveDelay + 0.01), 0.0, 1.0);
      baseSize = mix(0.04, 0.06, myProgress);
    }
    baseSize *= (0.75 + sparkle * 0.5);
    gl_PointSize = baseSize * (250.0 / -mvPosition.z);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColorGold;
  uniform vec3 uColorPink;
  uniform vec3 uColorWhite;

  varying float vAlpha;
  varying float vWarmth;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft warm glow
    float soft = exp(-dist * dist * 5.0);
    // Hot bright core
    float core = exp(-dist * dist * 60.0);

    // Shift between gold and pink
    vec3 baseColor = mix(uColorGold, uColorPink, vWarmth * 0.4);
    // White-hot core
    vec3 color = mix(baseColor, uColorWhite, core * 0.9);

    float alpha = (soft * 0.5 + core * 0.5) * vAlpha;
    gl_FragColor = vec4(color, alpha);
  }
`

const CONFIG_RADIUS_Y = 12.5

export function LoveMessage() {
  const pointsRef = useRef<THREE.Points>(null)
  const startTime = useRef<number | null>(null)
  const [visible, setVisible] = useState(true)
  const setIntroComplete = useStore((s) => s.setIntroComplete)

  const { textPositions, startPositions, speeds, phases, dissolveDelays } = useMemo(() => {
    const textPositions = sampleTextPositions(MESSAGE, PARTICLE_COUNT)
    const count = textPositions.length / 3
    const startPositions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const phases = new Float32Array(count)
    const dissolveDelays = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Start positions: scattered like fireflies in the dark
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 1.5 + Math.random() * 4
      startPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
      startPositions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.4
      startPositions[i * 3 + 2] = Math.cos(phi) * radius * 0.3

      speeds[i] = 0.2 + Math.random() * 1.0
      phases[i] = Math.random() * Math.PI * 2

      // Dissolve delay: based on x position in the text so it sweeps left to right
      // with some randomness
      const textX = textPositions[i * 3]
      dissolveDelays[i] = (textX + 2.25) / 4.5 * 0.6 + Math.random() * 0.4
      dissolveDelays[i] = Math.max(0, Math.min(0.8, dissolveDelays[i]))
    }

    return { textPositions, startPositions, speeds, phases, dissolveDelays }
  }, [])

  const uniforms = useMemo(() => ({
    uGatherProgress: { value: 0.0 },
    uDissolveProgress: { value: 0.0 },
    uOpacity: { value: 0.0 },
    uTime: { value: 0.0 },
    uBreathPhase: { value: 0.0 },
    uColorGold: { value: new THREE.Color('#ffd700') },
    uColorPink: { value: new THREE.Color('#ffb6c1') },
    uColorWhite: { value: new THREE.Color('#fffaf0') },
  }), [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(textPositions, 3))
    geo.setAttribute('aStartPos', new THREE.BufferAttribute(startPositions, 3))
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geo.setAttribute('aDissolveDelay', new THREE.BufferAttribute(dissolveDelays, 1))
    return geo
  }, [textPositions, startPositions, speeds, phases, dissolveDelays])

  useFrame((state) => {
    if (!visible) return

    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime
    }

    const elapsed = state.clock.elapsedTime - startTime.current
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uBreathPhase.value = useStore.getState().breathPhase

    const t1 = GATHER_DURATION                    // end of gather
    const t2 = t1 + HOLD_DURATION                 // end of hold
    const t3 = t2 + DISSOLVE_DURATION             // end of dissolve
    const t4 = t3 + FADE_DURATION                 // end of fade

    if (elapsed < t1) {
      // Gather: fireflies drift together into text
      uniforms.uGatherProgress.value = elapsed / t1
      uniforms.uDissolveProgress.value = 0
      uniforms.uOpacity.value = Math.min(1, elapsed / 1.5)
    }
    else if (elapsed < t2) {
      // Hold: text breathes gently
      uniforms.uGatherProgress.value = 1.0
      uniforms.uDissolveProgress.value = 0
      uniforms.uOpacity.value = 1.0
    }
    else if (elapsed < t3) {
      // Dissolve: particles lift off like embers, sweeping left to right
      const t = (elapsed - t2) / DISSOLVE_DURATION
      uniforms.uGatherProgress.value = 1.0
      uniforms.uDissolveProgress.value = t
      uniforms.uOpacity.value = 1.0
      // Release camera after dissolve is well underway
      if (t > 0.3) {
        setIntroComplete(true)
      }
    }
    else if (elapsed < t4) {
      // Fade out remaining embers
      const t = (elapsed - t3) / FADE_DURATION
      uniforms.uGatherProgress.value = 1.0
      uniforms.uDissolveProgress.value = 1.0
      uniforms.uOpacity.value = 1.0 - t
      setIntroComplete(true)
    }
    else {
      setVisible(false)
      setIntroComplete(true)
    }
  })

  if (!visible) return null

  const playerY = -CONFIG_RADIUS_Y * 0.35

  return (
    <points ref={pointsRef} geometry={geometry} position={[0, playerY, -2.5]}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
