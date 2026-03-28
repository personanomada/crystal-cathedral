import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useStore } from '../store/useStore'
import {
  generateCrystalPlacements,
  CrystalPlacement,
} from '../utils/crystalDistribution'
import { getActiveThemeColors } from './LightingRig'

const CRYSTAL_COUNT = 400
const TEMP_OBJECT = new THREE.Object3D()
const TEMP_COLOR = new THREE.Color()

// We use 3 different crystal geometries from the model pack.
// These are mesh child node names (Object_N) from crystal_pack/scene.gltf:
//   Sharp family: pointed single crystals (~2-3 units tall)
//   Crystal family: crystal clusters (~2-3 units tall)
//   Standing family: upright formations (~2 units tall)
const MODEL_NODES = ['Object_4', 'Object_132', 'Object_408']

// Color palettes for crystal variety
const CRYSTAL_HUES = [
  { h: 0.75, s: 0.8, l: 0.35 },
  { h: 0.78, s: 0.7, l: 0.40 },
  { h: 0.72, s: 0.9, l: 0.30 },
  { h: 0.55, s: 0.65, l: 0.38 },
  { h: 0.85, s: 0.75, l: 0.38 },
  { h: 0.60, s: 0.55, l: 0.45 },
]

// Fallback procedural geometry
function createFallbackGeometry(scaleY: number, radius: number): THREE.BufferGeometry {
  const geo = new THREE.OctahedronGeometry(radius, 0)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, pos.getY(i) * scaleY)
  }
  geo.translate(0, radius * scaleY, 0)
  geo.computeVertexNormals()
  return geo
}

export function CrystalFormation() {
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([])
  const gltf = useGLTF('/models/crystal_pack/scene.gltf')

  const allPlacements = useMemo(() => generateCrystalPlacements(CRYSTAL_COUNT), [])
  const groups = useMemo(() => {
    const g: CrystalPlacement[][] = [[], [], []]
    allPlacements.forEach((p, i) => g[i % 3].push(p))
    return g
  }, [allPlacements])

  // Extract model geometries or fall back to procedural
  const geometries = useMemo(() => {
    return MODEL_NODES.map((nodeName, i) => {
      const node = (gltf as any)?.nodes?.[nodeName]
      if (node?.geometry) {
        // Clone and normalize the geometry so it's centered and scaled consistently
        const geo = (node.geometry as THREE.BufferGeometry).clone()
        geo.computeBoundingBox()
        const box = geo.boundingBox!
        const height = box.max.y - box.min.y
        // Normalize to roughly 1 unit tall so our placement scales work
        const scaleFactor = 1 / height
        geo.scale(scaleFactor, scaleFactor, scaleFactor)
        // Center on XZ, base at Y=0
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
      return createFallbackGeometry([3, 2, 1.5][i], [0.08, 0.11, 0.13][i])
    })
  }, [gltf])

  useEffect(() => {
    groups.forEach((group, gi) => {
      const mesh = meshRefs.current[gi]
      if (!mesh) return
      group.forEach((placement, i) => {
        TEMP_OBJECT.position.copy(placement.position)
        TEMP_OBJECT.rotation.copy(placement.rotation)
        TEMP_OBJECT.scale.copy(placement.scale)
        TEMP_OBJECT.updateMatrix()
        mesh.setMatrixAt(i, TEMP_OBJECT.matrix)

        const palette = CRYSTAL_HUES[Math.floor(Math.random() * CRYSTAL_HUES.length)]
        TEMP_COLOR.setHSL(
          palette.h + (Math.random() - 0.5) * 0.05,
          palette.s + (Math.random() - 0.5) * 0.1,
          palette.l + (Math.random() - 0.5) * 0.1,
        )
        mesh.setColorAt(i, TEMP_COLOR)
      })
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    })
  }, [groups, geometries])

  useFrame(() => {
    const breathPhase = useStore.getState().breathPhase
    const breathValue = Math.sin(breathPhase * Math.PI * 2) * 0.5 + 0.5
    const sessionDepth = useStore.getState().presence.sessionDepth
    const emissiveIntensity =
      (0.3 + breathValue * 0.7) * (0.4 + sessionDepth * 0.6)
    const elapsed = useStore.getState().sessionElapsed
    const themeKey = useStore.getState().settings.theme
    const theme = getActiveThemeColors(themeKey, elapsed)
    meshRefs.current.forEach((mesh) => {
      if (!mesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = emissiveIntensity
      mat.emissive.copy(theme.emissive)
    })
  })

  return (
    <>
      {geometries.map((geo, i) => (
        <instancedMesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
          args={[geo, undefined, groups[i]?.length ?? 0]}
          frustumCulled={false}
        >
          <meshStandardMaterial
            color="#5a4a8a"
            emissive="#6c5ce7"
            emissiveIntensity={0.3}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.95}
            envMapIntensity={2.0}
          />
        </instancedMesh>
      ))}
    </>
  )
}

useGLTF.preload('/models/crystal_pack/scene.gltf')
