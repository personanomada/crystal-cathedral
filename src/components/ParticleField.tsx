import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'
import { getActiveThemeColors } from './LightingRig'

const ASCENDING_COUNT = 300

// Vertex shader for ascending particles
const ascendingVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSpeed;
  attribute float aOffset;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    vAlpha = aSpeed * 0.8;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (300.0 / -gl_Position.z);
  }
`

// Fragment shader for soft circular particles
const ascendingFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    gl_FragColor = vec4(uColor, alpha * uOpacity * vAlpha);
  }
`

function AscendingStreams() {
  const pointsRef = useRef<THREE.Points>(null)
  const { radiusX, radiusY } = CONFIG.cathedral

  const { positions, speeds, offsets } = useMemo(() => {
    const positions = new Float32Array(ASCENDING_COUNT * 3)
    const speeds = new Float32Array(ASCENDING_COUNT)
    const offsets = new Float32Array(ASCENDING_COUNT)
    for (let i = 0; i < ASCENDING_COUNT; i++) {
      const i3 = i * 3
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * radiusX * 0.5
      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = -radiusY * 0.7 + Math.random() * radiusY * 1.4
      positions[i3 + 2] = Math.sin(angle) * radius
      speeds[i] = 0.3 + Math.random() * 0.7
      offsets[i] = Math.random()
    }
    return { positions, speeds, offsets }
  }, [radiusX, radiusY])

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#a29bfe') },
      uOpacity: { value: 0.0 },
      uSize: { value: 4.0 },
    }),
    [],
  )

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const dt = Math.min(delta, 0.1)
    const { sessionDepth } = useStore.getState().presence
    const mandalaStage = useStore.getState().mandalaStage
    const stageMultiplier =
      (['seed', 'flower', 'metatron', 'sriYantra'] as const).indexOf(mandalaStage) + 1
    const elapsed = useStore.getState().sessionElapsed
    const themeKey = useStore.getState().settings.theme
    const theme = getActiveThemeColors(themeKey, elapsed)

    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const mandalaY = radiusY * 0.7

    for (let i = 0; i < ASCENDING_COUNT; i++) {
      const i3 = i * 3
      arr[i3 + 1] += speeds[i] * dt * stageMultiplier * 0.5
      arr[i3] *= 1 - dt * 0.1
      arr[i3 + 2] *= 1 - dt * 0.1
      if (arr[i3 + 1] > mandalaY) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * radiusX * 0.5
        arr[i3] = Math.cos(angle) * radius
        arr[i3 + 1] = -radiusY * 0.7
        arr[i3 + 2] = Math.sin(angle) * radius
      }
    }
    pos.needsUpdate = true

    uniforms.uOpacity.value = sessionDepth * 0.8
    uniforms.uColor.value.copy(theme.particle)
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
    geo.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1))
    return geo
  }, [positions, speeds, offsets])

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={ascendingVertexShader}
        fragmentShader={ascendingFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function AmbientDustSparkles() {
  const { radiusX, radiusY } = CONFIG.cathedral
  const elapsed = useStore((s) => s.sessionElapsed)
  const themeKey = useStore((s) => s.settings.theme)
  const theme = getActiveThemeColors(themeKey, elapsed)

  return (
    <Sparkles
      count={400}
      scale={[radiusX * 1.6, radiusY * 1.4, radiusX * 1.6]}
      size={3}
      speed={0.2}
      opacity={0.6}
      color={theme.particle}
      noise={0.5}
    />
  )
}

export function ParticleField() {
  const qualityTier = useStore((s) => s.qualityTier)
  const particleLayers = CONFIG.quality[qualityTier].particles
  return (
    <>
      <AmbientDustSparkles />
      {particleLayers >= 2 && <AscendingStreams />}
    </>
  )
}
