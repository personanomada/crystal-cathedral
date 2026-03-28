import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'
import { getActiveThemeColors } from './LightingRig'

const ASCENDING_COUNT = 150

// Soft glowing particle shader
const particleVertex = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
  }
`

const particleFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    // Soft gaussian-like falloff
    float alpha = exp(-dist * dist * 8.0) * vAlpha * uOpacity;
    // Add a bright core
    float core = exp(-dist * dist * 32.0) * 0.5;
    gl_FragColor = vec4(uColor * (1.0 + core * 2.0), alpha + core * uOpacity);
  }
`

function AscendingStreams() {
  const pointsRef = useRef<THREE.Points>(null)
  const { radiusX, radiusY } = CONFIG.cathedral

  const { positions, sizes, alphas } = useMemo(() => {
    const positions = new Float32Array(ASCENDING_COUNT * 3)
    const sizes = new Float32Array(ASCENDING_COUNT)
    const alphas = new Float32Array(ASCENDING_COUNT)
    for (let i = 0; i < ASCENDING_COUNT; i++) {
      const i3 = i * 3
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * radiusX * 0.4
      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = -radiusY * 0.6 + Math.random() * radiusY * 1.2
      positions[i3 + 2] = Math.sin(angle) * radius
      sizes[i] = 3.0 + Math.random() * 8.0
      alphas[i] = 0.3 + Math.random() * 0.7
    }
    return { positions, sizes, alphas }
  }, [radiusX, radiusY])

  const speeds = useMemo(() => {
    const s = new Float32Array(ASCENDING_COUNT)
    for (let i = 0; i < ASCENDING_COUNT; i++) s[i] = 0.2 + Math.random() * 0.5
    return s
  }, [])

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color('#a29bfe') },
    uOpacity: { value: 0.0 },
  }), [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const dt = Math.min(delta, 0.1)
    const { sessionDepth } = useStore.getState().presence
    const mandalaStage = useStore.getState().mandalaStage
    const stageMultiplier = (['seed', 'flower', 'metatron', 'sriYantra'] as const).indexOf(mandalaStage) + 1
    const elapsed = useStore.getState().sessionElapsed
    const themeKey = useStore.getState().settings.theme
    const theme = getActiveThemeColors(themeKey, elapsed)

    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const mandalaY = radiusY * 0.7

    for (let i = 0; i < ASCENDING_COUNT; i++) {
      const i3 = i * 3
      arr[i3 + 1] += speeds[i] * dt * stageMultiplier * 0.3
      // Gentle spiral toward center
      const angle = Math.atan2(arr[i3 + 2], arr[i3]) + dt * 0.05
      const dist = Math.sqrt(arr[i3] ** 2 + arr[i3 + 2] ** 2)
      const newDist = dist * (1 - dt * 0.08)
      arr[i3] = Math.cos(angle) * newDist
      arr[i3 + 2] = Math.sin(angle) * newDist

      if (arr[i3 + 1] > mandalaY) {
        const newAngle = Math.random() * Math.PI * 2
        const newRadius = Math.random() * radiusX * 0.4
        arr[i3] = Math.cos(newAngle) * newRadius
        arr[i3 + 1] = -radiusY * 0.6
        arr[i3 + 2] = Math.sin(newAngle) * newRadius
      }
    }
    pos.needsUpdate = true

    uniforms.uOpacity.value = 0.2 + sessionDepth * 0.6
    uniforms.uColor.value.copy(theme.particle)
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
    return geo
  }, [positions, sizes, alphas])

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function ParticleField() {
  const { radiusX, radiusY } = CONFIG.cathedral

  return (
    <>
      {/* Ambient dust — large, slow, dreamy */}
      <Sparkles
        count={200}
        scale={[radiusX * 1.4, radiusY * 1.2, radiusX * 1.4]}
        size={6}
        speed={0.1}
        opacity={0.4}
        color="#c8bfff"
        noise={1}
      />
      {/* Ascending streams toward mandala */}
      <AscendingStreams />
    </>
  )
}
