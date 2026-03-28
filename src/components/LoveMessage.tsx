import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'

/**
 * On first load, glowing particles form "Corlia, I love you"
 * then scatter like fireflies. When done, signals the cathedral to appear.
 */

const MESSAGE = 'Corlia, I love you'
const PARTICLE_COUNT = 2500
const HOLD_DURATION = 5.0
const SCATTER_DURATION = 3.5
const FADE_DURATION = 2.0

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
  ctx.font = `bold ${52 * scale}px Georgia, "Times New Roman", serif`
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
      if (pixels[idx] > 128) {
        candidates.push([x, y])
      }
    }
  }

  const count = Math.min(candidates.length, maxParticles)
  const positions = new Float32Array(count * 3)

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  const textWidth = 4.0
  const textHeight = textWidth * (canvas.height / canvas.width)

  for (let i = 0; i < count; i++) {
    const [px, py] = candidates[i]
    positions[i * 3] = (px / canvas.width - 0.5) * textWidth
    positions[i * 3 + 1] = -(py / canvas.height - 0.5) * textHeight
    positions[i * 3 + 2] = 0
  }

  return positions
}

const vertexShader = /* glsl */ `
  attribute vec3 aTarget;
  attribute float aSpeed;
  attribute float aPhase;

  uniform float uProgress;
  uniform float uOpacity;
  uniform float uTime;

  varying float vAlpha;
  varying float vGlow;

  void main() {
    vec3 pos = mix(position, aTarget, uProgress);

    // Floating firefly motion when scattered
    if (uProgress > 0.0) {
      pos.x += sin(uTime * aSpeed * 0.5 + aPhase) * 0.2 * uProgress;
      pos.y += cos(uTime * aSpeed * 0.4 + aPhase * 1.3) * 0.15 * uProgress;
      pos.z += sin(uTime * aSpeed * 0.3 + aPhase * 0.7) * 0.15 * uProgress;
    }

    // Twinkling sparkle
    float sparkle = sin(uTime * 4.0 + aPhase * 6.28) * 0.5 + 0.5;
    vGlow = sparkle;
    vAlpha = uOpacity;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float baseSize = 0.05 * (1.0 + uProgress * 2.0);
    baseSize *= (0.7 + sparkle * 0.6);
    gl_PointSize = baseSize * (250.0 / -mvPosition.z);
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

    // Soft warm glow with bright hot core
    float soft = exp(-dist * dist * 6.0);
    float core = exp(-dist * dist * 50.0);

    // Warm gold shifting to soft pink
    vec3 color = mix(uColor, uColor2, vGlow * 0.3);
    color += vec3(1.0, 0.95, 0.85) * core;

    float alpha = (soft * 0.6 + core * 0.4) * vAlpha;

    gl_FragColor = vec4(color, alpha);
  }
`

export function LoveMessage() {
  const pointsRef = useRef<THREE.Points>(null)
  const startTime = useRef<number | null>(null)
  const [visible, setVisible] = useState(true)
  const setIntroComplete = useStore((s) => s.setIntroComplete)

  const { textPositions, targets, speeds, phases } = useMemo(() => {
    const textPositions = sampleTextPositions(MESSAGE, PARTICLE_COUNT)
    const count = textPositions.length / 3
    const targets = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 3 + Math.random() * 6
      targets[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
      targets[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.5 + 1
      targets[i * 3 + 2] = Math.cos(phi) * radius * 0.4 - 2

      speeds[i] = 0.3 + Math.random() * 1.5
      phases[i] = Math.random() * Math.PI * 2
    }

    return { textPositions, targets, speeds, phases }
  }, [])

  const uniforms = useMemo(() => ({
    uProgress: { value: 0.0 },
    uOpacity: { value: 0.0 },
    uTime: { value: 0.0 },
    uColor: { value: new THREE.Color('#ffd700') },
    uColor2: { value: new THREE.Color('#ff9ff3') },
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

    // Phase 1: Fade in (0 - 1.5s)
    if (elapsed < 1.5) {
      uniforms.uOpacity.value = elapsed / 1.5
      uniforms.uProgress.value = 0
    }
    // Phase 2: Hold text (1.5s - 1.5s + HOLD)
    else if (elapsed < 1.5 + HOLD_DURATION) {
      uniforms.uOpacity.value = 1.0
      uniforms.uProgress.value = 0
      // Signal cathedral to start appearing midway through hold
      if (elapsed > 1.5 + HOLD_DURATION * 0.6) {
        setIntroComplete(true)
      }
    }
    // Phase 3: Scatter
    else if (elapsed < 1.5 + HOLD_DURATION + SCATTER_DURATION) {
      const t = (elapsed - 1.5 - HOLD_DURATION) / SCATTER_DURATION
      uniforms.uProgress.value = 1 - Math.pow(1 - t, 3)
      uniforms.uOpacity.value = 1.0
      setIntroComplete(true)
    }
    // Phase 4: Fade out
    else if (elapsed < 1.5 + HOLD_DURATION + SCATTER_DURATION + FADE_DURATION) {
      const t = (elapsed - 1.5 - HOLD_DURATION - SCATTER_DURATION) / FADE_DURATION
      uniforms.uProgress.value = 1.0
      uniforms.uOpacity.value = 1.0 - t
    }
    // Done
    else {
      setVisible(false)
    }
  })

  if (!visible) return null

  return (
    <points ref={pointsRef} geometry={geometry} position={[0, -4.3, -2]}>
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
