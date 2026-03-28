import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import {
  generateCrystalPlacements,
  CrystalPlacement,
} from '../utils/crystalDistribution'
import { getActiveThemeColors } from './LightingRig'

const CRYSTAL_COUNT = 600
const TEMP_OBJECT = new THREE.Object3D()
const TEMP_COLOR = new THREE.Color()

/**
 * Create a crystal-shaped geometry using a vertically stretched OctahedronGeometry.
 * Natural crystal point shape — no manual mesh merging needed.
 * scaleY stretches the octahedron to make it look like a crystal point.
 */
function createCrystalGeometry(scaleY: number, baseRadius: number): THREE.BufferGeometry {
  const geo = new THREE.OctahedronGeometry(baseRadius, 0)
  // Scale the positions on Y to make it tall and pointy
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, pos.getY(i) * scaleY)
  }
  // Shift so the base sits at y=0
  geo.translate(0, baseRadius * scaleY, 0)
  geo.computeVertexNormals()
  return geo
}

// Three crystal types using stretched octahedra:
// tall-thin, medium, stubby
const CRYSTAL_GEOMETRIES = [
  () => createCrystalGeometry(3.0, 0.08),  // Tall thin — stretched 3x
  () => createCrystalGeometry(2.0, 0.11),  // Medium — stretched 2x
  () => createCrystalGeometry(1.5, 0.13),  // Stubby — stretched 1.5x
]

// Color palettes — more saturated and bright for better visual impact
const CRYSTAL_HUES = [
  { h: 0.75, s: 0.8, l: 0.35 },  // Vivid purple
  { h: 0.78, s: 0.7, l: 0.40 },  // Bright blue-purple
  { h: 0.72, s: 0.9, l: 0.30 },  // Deep saturated violet
  { h: 0.55, s: 0.65, l: 0.38 }, // Vivid teal
  { h: 0.85, s: 0.75, l: 0.38 }, // Hot pink-purple
  { h: 0.60, s: 0.55, l: 0.45 }, // Sky blue
]

export function CrystalFormation() {
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([])

  const allPlacements = useMemo(() => generateCrystalPlacements(CRYSTAL_COUNT), [])
  const groups = useMemo(() => {
    const g: CrystalPlacement[][] = [[], [], []]
    allPlacements.forEach((p, i) => g[i % 3].push(p))
    return g
  }, [allPlacements])

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

        // Varied crystal colors
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
  }, [groups])

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

  const geometries = useMemo(() => CRYSTAL_GEOMETRIES.map((fn) => fn()), [])

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
