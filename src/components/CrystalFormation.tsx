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

function createHexPrismGeometry(
  radiusTop: number,
  radiusBottom: number,
  height: number,
): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 6, 1)
}

const CRYSTAL_GEOMETRIES = [
  () => createHexPrismGeometry(0.08, 0.12, 1),
  () => createHexPrismGeometry(0.15, 0.15, 1),
  () => createHexPrismGeometry(0.05, 0.18, 1),
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
        TEMP_COLOR.setHSL(0.75 + Math.random() * 0.1, 0.5, 0.15)
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
            color="#2d2d44"
            emissive="#6c5ce7"
            emissiveIntensity={0.3}
            roughness={0.3}
            metalness={0.2}
            transparent
            opacity={0.85}
          />
        </instancedMesh>
      ))}
    </>
  )
}
