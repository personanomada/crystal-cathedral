import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { generateCrystalPlacements } from '../utils/crystalDistribution'
import { CONFIG } from '../config'

export function HeroCrystals() {
  const materialsRef = useRef<THREE.MeshPhysicalMaterial[]>([])
  const qualityTier = useStore((s) => s.qualityTier)
  const heroCount = CONFIG.quality[qualityTier].heroCount

  const heroData = useMemo(() => {
    const allPlacements = generateCrystalPlacements(600, 42)
    const playerPos = new THREE.Vector3(
      0,
      -CONFIG.cathedral.radiusY * 0.35,
      0,
    )
    const sorted = allPlacements.sort(
      (a, b) =>
        a.position.distanceTo(playerPos) - b.position.distanceTo(playerPos),
    )
    return sorted.slice(0, 15)
  }, [])

  const geometry = useMemo(
    () => new THREE.CylinderGeometry(0.12, 0.18, 1.5, 6, 1),
    [],
  )

  useFrame(() => {
    const breathPhase = useStore.getState().breathPhase
    const breathValue = Math.sin(breathPhase * Math.PI * 2) * 0.5 + 0.5
    const sessionDepth = useStore.getState().presence.sessionDepth
    materialsRef.current.forEach((mat) => {
      mat.emissiveIntensity =
        (0.5 + breathValue * 0.5) * (0.3 + sessionDepth * 0.7)
    })
  })

  return (
    <group>
      {heroData.slice(0, heroCount).map((placement, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={placement.position}
          rotation={placement.rotation}
          scale={placement.scale.clone().multiplyScalar(1.3)}
        >
          <meshPhysicalMaterial
            ref={(mat) => {
              if (mat) materialsRef.current[i] = mat
            }}
            transmission={1}
            thickness={0.5}
            roughness={0.05}
            ior={2.4}
            iridescence={1}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[100, 400]}
            emissive="#6c5ce7"
            emissiveIntensity={0.5}
            transparent
            envMapIntensity={1}
          />
        </mesh>
      ))}
    </group>
  )
}
