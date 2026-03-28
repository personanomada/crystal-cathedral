import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { generateCrystalPlacements } from '../utils/crystalDistribution'
import { CONFIG } from '../config'
import { getActiveThemeColors } from './LightingRig'

/**
 * Create a hero crystal geometry using a vertically stretched OctahedronGeometry.
 * Matches the instanced CrystalFormation approach but at larger scale.
 * scaleY controls how elongated/pointy the crystal looks.
 */
function createHeroCrystalGeometry(scaleY: number = 2.5, baseRadius: number = 0.18): THREE.BufferGeometry {
  const geo = new THREE.OctahedronGeometry(baseRadius, 0)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, pos.getY(i) * scaleY)
  }
  geo.translate(0, baseRadius * scaleY, 0)
  geo.computeVertexNormals()
  return geo
}

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

  const geometry = useMemo(() => createHeroCrystalGeometry(2.5, 0.18), [])

  useFrame(() => {
    const breathPhase = useStore.getState().breathPhase
    const breathValue = Math.sin(breathPhase * Math.PI * 2) * 0.5 + 0.5
    const sessionDepth = useStore.getState().presence.sessionDepth
    const elapsed = useStore.getState().sessionElapsed
    const themeKey = useStore.getState().settings.theme
    const theme = getActiveThemeColors(themeKey, elapsed)
    materialsRef.current.forEach((mat) => {
      if (!mat) return
      mat.emissiveIntensity =
        (0.5 + breathValue * 0.5) * (0.3 + sessionDepth * 0.7)
      mat.emissive.copy(theme.emissive)
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
          scale={placement.scale.clone().multiplyScalar(1.5)}
        >
          <meshPhysicalMaterial
            ref={(mat) => {
              if (mat) materialsRef.current[i] = mat
            }}
            color="#b8b0ff"
            transmission={0.9}
            thickness={2.0}
            roughness={0.05}
            ior={2.2}
            iridescence={1}
            iridescenceIOR={1.5}
            iridescenceThicknessRange={[100, 400]}
            attenuationColor="#6c5ce7"
            attenuationDistance={1.0}
            emissive="#6c5ce7"
            emissiveIntensity={0.5}
            transparent
            envMapIntensity={3.0}
            metalness={0.1}
            specularIntensity={1}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
      ))}
    </group>
  )
}
