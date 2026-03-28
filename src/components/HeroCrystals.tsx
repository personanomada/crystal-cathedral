import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { generateCrystalPlacements } from '../utils/crystalDistribution'
import { CONFIG } from '../config'
import { getActiveThemeColors } from './LightingRig'

/**
 * Create a crystal cluster: main crystal with 2-3 smaller ones at the base.
 */
function createHeroCrystalGeometry(): THREE.BufferGeometry {
  const main = new THREE.ConeGeometry(0.15, 1.8, 6, 1)
  main.translate(0, 0.9, 0)

  const side1 = new THREE.ConeGeometry(0.08, 1.0, 6, 1)
  side1.rotateZ(0.3)
  side1.translate(0.15, 0.4, 0.05)

  const side2 = new THREE.ConeGeometry(0.07, 0.8, 6, 1)
  side2.rotateZ(-0.25)
  side2.translate(-0.12, 0.3, 0.1)

  // Merge using mergeGeometries
  const merged = mergeBufferGeometries([main, side1, side2])
  main.dispose()
  side1.dispose()
  side2.dispose()
  return merged
}

function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let totalVerts = 0
  let totalIndices = 0
  for (const g of geometries) {
    totalVerts += g.attributes.position.count
    totalIndices += g.index ? g.index.count : g.attributes.position.count
  }

  const positions = new Float32Array(totalVerts * 3)
  const normals = new Float32Array(totalVerts * 3)
  const indices = new Uint16Array(totalIndices)

  let vertOffset = 0
  let idxOffset = 0
  for (const g of geometries) {
    const pos = g.attributes.position
    const norm = g.attributes.normal
    for (let i = 0; i < pos.count; i++) {
      positions[(vertOffset + i) * 3] = pos.getX(i)
      positions[(vertOffset + i) * 3 + 1] = pos.getY(i)
      positions[(vertOffset + i) * 3 + 2] = pos.getZ(i)
      normals[(vertOffset + i) * 3] = norm.getX(i)
      normals[(vertOffset + i) * 3 + 1] = norm.getY(i)
      normals[(vertOffset + i) * 3 + 2] = norm.getZ(i)
    }
    if (g.index) {
      for (let i = 0; i < g.index.count; i++) {
        indices[idxOffset + i] = g.index.getX(i) + vertOffset
      }
      idxOffset += g.index.count
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices[idxOffset + i] = vertOffset + i
      }
      idxOffset += pos.count
    }
    vertOffset += pos.count
  }

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  merged.setIndex(new THREE.BufferAttribute(indices, 1))
  return merged
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

  const geometry = useMemo(() => createHeroCrystalGeometry(), [])

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
            color="#8875d8"
            transmission={0.9}
            thickness={1.2}
            roughness={0.05}
            ior={2.2}
            iridescence={1}
            iridescenceIOR={1.5}
            iridescenceThicknessRange={[100, 400]}
            emissive="#6c5ce7"
            emissiveIntensity={0.5}
            transparent
            envMapIntensity={2}
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
