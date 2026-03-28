import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'

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
      arr[i3] += velocities[i3] * dt * 60
      arr[i3 + 1] += velocities[i3 + 1] * dt * 60
      arr[i3 + 2] += velocities[i3 + 2] * dt * 60
      velocities[i3] += (Math.random() - 0.5) * 0.002
      velocities[i3 + 1] += (Math.random() - 0.5) * 0.001
      velocities[i3 + 2] += (Math.random() - 0.5) * 0.002
      velocities[i3] *= 0.99
      velocities[i3 + 1] *= 0.99
      velocities[i3 + 2] *= 0.99
      const dist = Math.sqrt(arr[i3] ** 2 + arr[i3 + 2] ** 2)
      if (dist > radiusX * 0.8) {
        velocities[i3] *= -0.5
        velocities[i3 + 2] *= -0.5
      }
    }
    pos.needsUpdate = true
    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = 0.2 + sessionDepth * 0.6
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
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
    for (let i = 0; i < ASCENDING_COUNT; i++) s[i] = 0.3 + Math.random() * 0.7
    return s
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const dt = Math.min(delta, 0.1)
    const { sessionDepth } = useStore.getState().presence
    const mandalaStage = useStore.getState().mandalaStage
    const stageMultiplier = (['seed', 'flower', 'metatron', 'sriYantra'] as const).indexOf(mandalaStage) + 1
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
    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = sessionDepth * 0.8
    mat.size = 0.02 + (stageMultiplier / 4) * 0.03
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
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
