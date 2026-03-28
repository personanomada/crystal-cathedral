import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { generateCrystalPlacements } from '../utils/crystalDistribution'
import { CONFIG } from '../config'
import { getActiveThemeColors } from './LightingRig'

// Use 3 visually distinct crystal shapes from the model pack
// Sharp = pointed, Crystal = clustered, Standing = upright
const HERO_MODEL_NODES = ['Object_4', 'Object_132', 'Object_408']

export function HeroCrystals() {
  const materialsRef = useRef<THREE.MeshPhysicalMaterial[]>([])
  const qualityTier = useStore((s) => s.qualityTier)
  const heroCount = CONFIG.quality[qualityTier].heroCount
  const gltf = useGLTF('/models/crystal_pack/scene.gltf')

  const heroData = useMemo(() => {
    const allPlacements = generateCrystalPlacements(400, 42)
    const playerPos = new THREE.Vector3(0, -CONFIG.cathedral.radiusY * 0.35, 0)
    const sorted = [...allPlacements].sort(
      (a, b) => a.position.distanceTo(playerPos) - b.position.distanceTo(playerPos),
    )
    return sorted.slice(0, 15)
  }, [])

  // Extract and normalize model geometries
  const geometries = useMemo(() => {
    return HERO_MODEL_NODES.map((nodeName) => {
      const node = (gltf as any)?.nodes?.[nodeName]
      if (node?.geometry) {
        const geo = (node.geometry as THREE.BufferGeometry).clone()
        geo.computeBoundingBox()
        const box = geo.boundingBox!
        const height = box.max.y - box.min.y
        // Normalize to ~1.5 units tall for hero crystals
        const scaleFactor = 1.5 / height
        geo.scale(scaleFactor, scaleFactor, scaleFactor)
        geo.computeBoundingBox()
        const newBox = geo.boundingBox!
        geo.translate(
          -(newBox.min.x + newBox.max.x) / 2,
          -newBox.min.y,
          -(newBox.min.z + newBox.max.z) / 2,
        )
        return geo
      }
      // Fallback
      const geo = new THREE.OctahedronGeometry(0.18, 0)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) * 2.5)
      geo.translate(0, 0.45, 0)
      geo.computeVertexNormals()
      return geo
    })
  }, [gltf])

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
          geometry={geometries[i % geometries.length]}
          position={placement.position}
          rotation={placement.rotation}
          scale={placement.scale.clone().multiplyScalar(1.2)}
        >
          <meshPhysicalMaterial
            ref={(mat) => {
              if (mat) materialsRef.current[i] = mat
            }}
            color="#c0b8ff"
            transmission={0.85}
            thickness={2.0}
            roughness={0.02}
            ior={2.2}
            iridescence={1}
            iridescenceIOR={1.5}
            iridescenceThicknessRange={[100, 400]}
            attenuationColor="#6c5ce7"
            attenuationDistance={1.5}
            emissive="#6c5ce7"
            emissiveIntensity={0.5}
            transparent
            envMapIntensity={3.0}
            metalness={0.05}
            specularIntensity={1}
            clearcoat={1}
            clearcoatRoughness={0.02}
          />
        </mesh>
      ))}
    </group>
  )
}

useGLTF.preload('/models/crystal_pack/scene.gltf')
