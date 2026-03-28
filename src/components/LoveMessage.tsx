import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'

const MESSAGE = 'Corlia, I love you'
const PARTICLE_COUNT = 2500
const GATHER_DURATION = 3.0    // seconds for particles to fly together into text
const HOLD_DURATION = 4.0      // seconds to hold readable text
const SCATTER_DURATION = 3.5   // seconds to explode outward
const FADE_DURATION = 2.0      // seconds to fade out

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
      if (pixels[idx] > 128) candidates.push([x, y])
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
  attribute vec3 aStartPos;   // random scattered start
  attribute vec3 aEndPos;     // random scattered end (firefly target)
  attribute float aSpeed;
  attribute float aPhase;

  uniform float uGatherProgress;  // 0 = scattered start, 1 = text formed
  uniform float uScatterProgress; // 0 = text, 1 = scattered end
  uniform float uOpacity;
  uniform float uTime;

  varying float vAlpha;
  varying float vGlow;

  // Smooth ease in-out
  float easeInOut(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    vec3 textPos = position; // the text position is stored in position attribute

    // Phase 1: gather from scattered start to text
    vec3 pos = mix(aStartPos, textPos, easeInOut(uGatherProgress));

    // Phase 2: scatter from text to firefly end positions
    if (uScatterProgress > 0.0) {
      pos = mix(textPos, aEndPos, easeInOut(uScatterProgress));
      // Add floating firefly motion
      pos.x += sin(uTime * aSpeed * 0.5 + aPhase) * 0.25 * uScatterProgress;
      pos.y += cos(uTime * aSpeed * 0.4 + aPhase * 1.3) * 0.2 * uScatterProgress;
      pos.z += sin(uTime * aSpeed * 0.3 + aPhase * 0.7) * 0.2 * uScatterProgress;
    }

    // Twinkling
    float sparkle = sin(uTime * 4.0 + aPhase * 6.28) * 0.5 + 0.5;
    vGlow = sparkle;
    vAlpha = uOpacity;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size: bigger when scattered, smaller when forming text
    float gathered = uGatherProgress * (1.0 - uScatterProgress);
    float baseSize = mix(0.07, 0.04, gathered);
    baseSize *= (0.7 + sparkle * 0.5);
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

    float soft = exp(-dist * dist * 6.0);
    float core = exp(-dist * dist * 50.0);

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
  const { textPositions, startPositions, endPositions, speeds, phases } = useMemo(() => {
    const textPositions = sampleTextPositions(MESSAGE, PARTICLE_COUNT)
    const count = textPositions.length / 3
    const startPositions = new Float32Array(count * 3)
    const endPositions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Start: scattered randomly in a sphere around the text area
      const sTheta = Math.random() * Math.PI * 2
      const sPhi = Math.acos(2 * Math.random() - 1)
      const sRadius = 2 + Math.random() * 5
      startPositions[i * 3] = Math.sin(sPhi) * Math.cos(sTheta) * sRadius
      startPositions[i * 3 + 1] = Math.sin(sPhi) * Math.sin(sTheta) * sRadius * 0.5
      startPositions[i * 3 + 2] = Math.cos(sPhi) * sRadius * 0.3 - 1

      // End: scatter outward like fireflies
      const eTheta = Math.random() * Math.PI * 2
      const ePhi = Math.acos(2 * Math.random() - 1)
      const eRadius = 3 + Math.random() * 7
      endPositions[i * 3] = Math.sin(ePhi) * Math.cos(eTheta) * eRadius
      endPositions[i * 3 + 1] = Math.sin(ePhi) * Math.sin(eTheta) * eRadius * 0.5 + 2
      endPositions[i * 3 + 2] = Math.cos(ePhi) * eRadius * 0.4 - 3

      speeds[i] = 0.3 + Math.random() * 1.5
      phases[i] = Math.random() * Math.PI * 2
    }

    return { textPositions, startPositions, endPositions, speeds, phases }
  }, [])

  const uniforms = useMemo(() => ({
    uGatherProgress: { value: 0.0 },
    uScatterProgress: { value: 0.0 },
    uOpacity: { value: 0.0 },
    uTime: { value: 0.0 },
    uColor: { value: new THREE.Color('#ffd700') },
    uColor2: { value: new THREE.Color('#ff9ff3') },
  }), [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(textPositions, 3))
    geo.setAttribute('aStartPos', new THREE.BufferAttribute(startPositions, 3))
    geo.setAttribute('aEndPos', new THREE.BufferAttribute(endPositions, 3))
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    return geo
  }, [textPositions, startPositions, endPositions, speeds, phases])

  useFrame((state) => {
    if (!visible) return

    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime
    }

    const elapsed = state.clock.elapsedTime - startTime.current
    uniforms.uTime.value = state.clock.elapsedTime

    const t1 = GATHER_DURATION
    const t2 = t1 + HOLD_DURATION
    const t3 = t2 + SCATTER_DURATION
    const t4 = t3 + FADE_DURATION

    if (elapsed < t1) {
      // Phase 1: Particles gather from random positions into text
      const t = elapsed / t1
      uniforms.uGatherProgress.value = t
      uniforms.uScatterProgress.value = 0
      uniforms.uOpacity.value = Math.min(1, elapsed / 1.0) // fade in over first second
    }
    else if (elapsed < t2) {
      // Phase 2: Hold text
      uniforms.uGatherProgress.value = 1.0
      uniforms.uScatterProgress.value = 0
      uniforms.uOpacity.value = 1.0
      // Start revealing cathedral partway through
      if (elapsed > t2 - 1.5) {
        setIntroComplete(true)
      }
    }
    else if (elapsed < t3) {
      // Phase 3: Explode outward like fireflies
      const t = (elapsed - t2) / SCATTER_DURATION
      uniforms.uGatherProgress.value = 1.0
      uniforms.uScatterProgress.value = t
      uniforms.uOpacity.value = 1.0
      setIntroComplete(true)
    }
    else if (elapsed < t4) {
      // Phase 4: Fade out
      const t = (elapsed - t3) / FADE_DURATION
      uniforms.uGatherProgress.value = 1.0
      uniforms.uScatterProgress.value = 1.0
      uniforms.uOpacity.value = 1.0 - t
    }
    else {
      setVisible(false)
    }
  })

  if (!visible) return null

  // Position in front of camera, at eye level
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

// Import just the Y radius for positioning
const CONFIG_RADIUS_Y = 12.5
