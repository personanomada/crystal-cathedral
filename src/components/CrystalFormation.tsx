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
 * Create a crystal-shaped geometry: hexagonal prism body with a pointed tip.
 * Looks like a real quartz crystal point.
 */
function createCrystalGeometry(
  radius: number,
  bodyHeight: number,
  tipHeight: number,
): THREE.BufferGeometry {
  const body = new THREE.CylinderGeometry(radius, radius * 1.05, bodyHeight, 6, 1)
  const tip = new THREE.ConeGeometry(radius, tipHeight, 6, 1)
  tip.translate(0, bodyHeight / 2 + tipHeight / 2, 0)

  // Merge geometries
  const merged = new THREE.BufferGeometry()
  const bodyPos = body.attributes.position
  const tipPos = tip.attributes.position
  const bodyNorm = body.attributes.normal
  const tipNorm = tip.attributes.normal

  const totalVerts = bodyPos.count + tipPos.count
  const positions = new Float32Array(totalVerts * 3)
  const normals = new Float32Array(totalVerts * 3)

  // Copy body
  for (let i = 0; i < bodyPos.count; i++) {
    positions[i * 3] = bodyPos.getX(i)
    positions[i * 3 + 1] = bodyPos.getY(i)
    positions[i * 3 + 2] = bodyPos.getZ(i)
    normals[i * 3] = bodyNorm.getX(i)
    normals[i * 3 + 1] = bodyNorm.getY(i)
    normals[i * 3 + 2] = bodyNorm.getZ(i)
  }
  // Copy tip
  const offset = bodyPos.count
  for (let i = 0; i < tipPos.count; i++) {
    positions[(offset + i) * 3] = tipPos.getX(i)
    positions[(offset + i) * 3 + 1] = tipPos.getY(i)
    positions[(offset + i) * 3 + 2] = tipPos.getZ(i)
    normals[(offset + i) * 3] = tipNorm.getX(i)
    normals[(offset + i) * 3 + 1] = tipNorm.getY(i)
    normals[(offset + i) * 3 + 2] = tipNorm.getZ(i)
  }

  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3))

  // Merge index buffers
  const bodyIdx = body.index!
  const tipIdx = tip.index!
  const totalIndices = bodyIdx.count + tipIdx.count
  const indices = new Uint16Array(totalIndices)
  for (let i = 0; i < bodyIdx.count; i++) {
    indices[i] = bodyIdx.getX(i)
  }
  for (let i = 0; i < tipIdx.count; i++) {
    indices[bodyIdx.count + i] = tipIdx.getX(i) + offset
  }
  merged.setIndex(new THREE.BufferAttribute(indices, 1))

  body.dispose()
  tip.dispose()

  return merged
}

// Three crystal types: thin pointed, chunky, needle
const CRYSTAL_GEOMETRIES = [
  () => createCrystalGeometry(0.06, 0.6, 0.4),   // Thin with long tip
  () => createCrystalGeometry(0.1, 0.5, 0.25),    // Chunky with short tip
  () => createCrystalGeometry(0.04, 0.8, 0.5),    // Needle with sharp point
]

// Color palettes for crystal variety
const CRYSTAL_HUES = [
  { h: 0.75, s: 0.6, l: 0.25 },  // Purple
  { h: 0.78, s: 0.5, l: 0.3 },   // Blue-purple
  { h: 0.72, s: 0.7, l: 0.2 },   // Deep violet
  { h: 0.55, s: 0.4, l: 0.3 },   // Teal
  { h: 0.85, s: 0.5, l: 0.25 },  // Pink-purple
  { h: 0.6, s: 0.3, l: 0.35 },   // Pale blue
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
            color="#3d3d5c"
            emissive="#6c5ce7"
            emissiveIntensity={0.3}
            roughness={0.15}
            metalness={0.6}
            transparent
            opacity={0.9}
            envMapIntensity={1.5}
          />
        </instancedMesh>
      ))}
    </>
  )
}
