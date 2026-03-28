import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/**
 * On first load, particles form the words "Corlia, I love you"
 * then scatter outward like fireflies and fade away.
 */

const MESSAGE = 'Corlia, I love you'
const PARTICLE_SIZE = 0.06
const HOLD_DURATION = 4.0     // seconds to hold the text
const SCATTER_DURATION = 3.0  // seconds to scatter
const FADE_DURATION = 2.0     // seconds to fade out after scatter

// Sample text positions from an offscreen canvas
function sampleTextPositions(text: string, maxParticles: number): Float32Array {
  const canvas = document.createElement('canvas')
  const scale = 2
  canvas.width = 1024 * scale
  canvas.height = 128 * scale
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${48 * scale}px Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  // Collect all white pixel positions
  const candidates: [number, number][] = []
  const step = 2
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const idx = (y * canvas.width + x) * 4
      if (pixels[idx] > 128) {
        candidates.push([x, y])
      }
    }
  }

  // Randomly sample down to maxParticles
  const count = Math.min(candidates.length, maxParticles)
  const positions = new Float32Array(count * 3)

  // Shuffle and take first `count`
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  const textWidth = 6.0  // world units width
  const textHeight = textWidth * (canvas.height / canvas.width)

  for (let i = 0; i < count; i++) {
    const [px, py] = candidates[i]
    // Map canvas coords to world space, centered
    positions[i * 3] = (px / canvas.width - 0.5) * textWidth
    positions[i * 3 + 1] = -(py / canvas.height - 0.5) * textHeight
    positions[i * 3 + 2] = 0
  }

  return positions
}

const PARTICLE_COUNT = 2000

const vertexShader = /* glsl */ `
  attribute vec3 aTarget;
  attribute float aSpeed;
  attribute float aPhase;

  uniform float uProgress;   // 0 = text, 1 = scattered
  uniform float uOpacity;
  uniform float uTime;

  varying float vAlpha;
  varying float vGlow;

  void main() {
    // Interpolate from text position to scattered target
    vec3 pos = mix(position, aTarget, uProgress);

    // Add gentle floating motion when scattered
    if (uProgress > 0.0) {
      pos.x += sin(uTime * aSpeed * 0.5 + aPhase) * 0.15 * uProgress;
      pos.y += cos(uTime * aSpeed * 0.4 + aPhase * 1.3) * 0.1 * uProgress;
      pos.z += sin(uTime * aSpeed * 0.3 + aPhase * 0.7) * 0.1 * uProgress;
    }

    // Gentle sparkle when in text form
    float sparkle = sin(uTime * 3.0 + aPhase * 6.28) * 0.5 + 0.5;
    vGlow = sparkle;
    vAlpha = uOpacity;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size: slightly larger when scattered (firefly effect)
    float baseSize = ${PARTICLE_SIZE.toFixed(3)} * (1.0 + uProgress * 1.5);
    // Sparkle size variation
    baseSize *= (0.8 + sparkle * 0.4);
    gl_PointSize = baseSize * (300.0 / -mvPosition.z);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform float uTime;

  varying float vAlpha;
  varying float vGlow;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft glow with bright core
    float soft = exp(-dist * dist * 8.0);
    float core = exp(-dist * dist * 40.0);

    // Color shifts between warm gold and soft pink
    vec3 color = mix(uColor, uColor2, vGlow * 0.4);
    // Brighter core
    color += vec3(1.0, 0.95, 0.8) * core * 0.8;

    float alpha = (soft * 0.7 + core * 0.3) * vAlpha;

    gl_FragColor = vec4(color, alpha);
  }
`

export function LoveMessage() {
  const pointsRef = useRef<THREE.Points>(null)
  const startTime = useRef<number | null>(null)
  const [visible, setVisible] = useState(true)

  // Generate text positions and scatter targets
  const { textPositions, targets, speeds, phases } = useMemo(() => {
    const textPositions = sampleTextPositions(MESSAGE, PARTICLE_COUNT)
    const count = textPositions.length / 3
    const targets = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Scatter outward in a sphere, like fireflies dispersing
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 2 + Math.random() * 5
      targets[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
      targets[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.6
      targets[i * 3 + 2] = Math.cos(phi) * radius * 0.5 - 1

      speeds[i] = 0.5 + Math.random() * 2.0
      phases[i] = Math.random() * Math.PI * 2
    }

    return { textPositions, targets, speeds, phases }
  }, [])

  const uniforms = useMemo(() => ({
    uProgress: { value: 0.0 },
    uOpacity: { value: 0.0 },
    uTime: { value: 0.0 },
    uColor: { value: new THREE.Color('#ffd700') },   // warm gold
    uColor2: { value: new THREE.Color('#ff9ff3') },   // soft pink
  }), [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(textPositions, 3))
    geo.setAttribute('aTarget', new THREE.BufferAttribute(targets, 3))
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    return geo
  }, [textPositions, targets, speeds, phases])

  useFrame((state) => {
    if (!visible) return

    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime
    }

    const elapsed = state.clock.elapsedTime - startTime.current
    uniforms.uTime.value = state.clock.elapsedTime

    // Phase 1: Fade in text (0 - 1s)
    if (elapsed < 1.0) {
      uniforms.uOpacity.value = elapsed / 1.0
      uniforms.uProgress.value = 0
    }
    // Phase 2: Hold text (1s - 1s + HOLD)
    else if (elapsed < 1.0 + HOLD_DURATION) {
      uniforms.uOpacity.value = 1.0
      uniforms.uProgress.value = 0
    }
    // Phase 3: Scatter (HOLD+1 - HOLD+1+SCATTER)
    else if (elapsed < 1.0 + HOLD_DURATION + SCATTER_DURATION) {
      const scatterProgress = (elapsed - 1.0 - HOLD_DURATION) / SCATTER_DURATION
      // Ease out cubic
      uniforms.uProgress.value = 1 - Math.pow(1 - scatterProgress, 3)
      uniforms.uOpacity.value = 1.0
    }
    // Phase 4: Fade out (after scatter)
    else if (elapsed < 1.0 + HOLD_DURATION + SCATTER_DURATION + FADE_DURATION) {
      const fadeProgress = (elapsed - 1.0 - HOLD_DURATION - SCATTER_DURATION) / FADE_DURATION
      uniforms.uProgress.value = 1.0
      uniforms.uOpacity.value = 1.0 - fadeProgress
    }
    // Done
    else {
      setVisible(false)
    }
  })

  if (!visible) return null

  // Position directly in front of the camera, close enough to read
  return (
    <points ref={pointsRef} geometry={geometry} position={[0, -4, -2.5]}>
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
