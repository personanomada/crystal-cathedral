import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'
import { getActiveThemeColors } from './LightingRig'

/**
 * Deliberately placed large crystal formations growing from the geode walls.
 * Every crystal gets full MeshPhysicalMaterial — transmission, refraction, glow.
 * Fewer crystals, bigger, more beautiful.
 */

// Hand-picked placements for dramatic effect.
// Each formation: position on the wall, inward normal, scale, which model to use.
const { radiusX, radiusY } = CONFIG.cathedral

interface CrystalDef {
  pos: [number, number, number]
  normal: [number, number, number]
  scale: number
  modelIndex: number
}

function wallPoint(theta: number, phi: number, embedDepth = 0.5): { pos: [number, number, number]; normal: [number, number, number] } {
  const nx = Math.sin(phi) * Math.cos(theta)
  const ny = Math.cos(phi)
  const nz = Math.sin(phi) * Math.sin(theta)
  const px = nx * radiusX
  const py = ny * radiusY
  const pz = nz * radiusX
  // Push inward
  const inward: [number, number, number] = [-nx, -ny, -nz]
  return {
    pos: [px + inward[0] * embedDepth, py + inward[1] * embedDepth, pz + inward[2] * embedDepth],
    normal: inward,
  }
}

// Generate a ring of crystals at a given height (phi angle)
function crystalRing(phiBase: number, count: number, scaleRange: [number, number], modelStart: number, embedDepth = 0.6): CrystalDef[] {
  const defs: CrystalDef[] = []
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2 + (phiBase * 0.7) // offset per ring
    const phi = phiBase + (Math.sin(i * 3.7) * 0.15) // slight variation
    const { pos, normal } = wallPoint(theta, phi, embedDepth)
    const scale = scaleRange[0] + Math.abs(Math.sin(i * 2.3)) * (scaleRange[1] - scaleRange[0])
    defs.push({ pos, normal, scale, modelIndex: (modelStart + i) % 3 })
  }
  return defs
}

// Ceiling vault — large crystals hanging down (dense, dramatic)
const CEILING_CRYSTALS = crystalRing(0.3, 8, [1.5, 3.0], 0, 0.8)
// Upper walls — medium crystals
const UPPER_CRYSTALS = crystalRing(0.8, 7, [1.0, 2.2], 1, 0.7)
// Mid walls — varied
const MID_CRYSTALS = crystalRing(1.2, 6, [0.8, 1.8], 2, 0.6)
// Lower walls — smaller clusters
const LOWER_CRYSTALS = crystalRing(1.8, 5, [0.6, 1.4], 0, 0.5)

const ALL_CRYSTALS = [...CEILING_CRYSTALS, ...UPPER_CRYSTALS, ...MID_CRYSTALS, ...LOWER_CRYSTALS]

// Model node names from crystal_pack — 3 distinct shapes
const MODEL_NODES = ['Object_4', 'Object_132', 'Object_408']

export function Crystals() {
  const materialsRef = useRef<THREE.MeshPhysicalMaterial[]>([])
  const gltf = useGLTF('/models/crystal_pack/scene.gltf')

  // Extract and normalize 3 crystal geometries from the model
  const geometries = useMemo(() => {
    return MODEL_NODES.map((nodeName) => {
      const node = (gltf as any)?.nodes?.[nodeName]
      if (node?.geometry) {
        const geo = (node.geometry as THREE.BufferGeometry).clone()
        geo.computeBoundingBox()
        const box = geo.boundingBox!
        const height = box.max.y - box.min.y
        // Normalize to 1 unit tall
        const s = 1 / Math.max(height, 0.01)
        geo.scale(s, s, s)
        geo.computeBoundingBox()
        const nb = geo.boundingBox!
        geo.translate(-(nb.min.x + nb.max.x) / 2, -nb.min.y, -(nb.min.z + nb.max.z) / 2)
        return geo
      }
      // Fallback: stretched octahedron
      const geo = new THREE.OctahedronGeometry(0.3, 1)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) * 2.5)
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

    const emissiveIntensity = (0.6 + breathValue * 0.4) * (0.5 + sessionDepth * 0.5)

    materialsRef.current.forEach((mat) => {
      if (!mat) return
      mat.emissiveIntensity = emissiveIntensity
      mat.emissive.copy(theme.emissive)
      // Subtly shift attenuation color with theme
      mat.attenuationColor.copy(theme.crystal)
    })
  })

  return (
    <group>
      {ALL_CRYSTALS.map((crystal, i) => {
        const geo = geometries[crystal.modelIndex]
        // Orient crystal to point inward along normal
        const up = new THREE.Vector3(0, 1, 0)
        const normal = new THREE.Vector3(...crystal.normal).normalize()
        const quat = new THREE.Quaternion().setFromUnitVectors(up, normal)
        const euler = new THREE.Euler().setFromQuaternion(quat)

        return (
          <mesh
            key={i}
            geometry={geo}
            position={crystal.pos}
            rotation={euler}
            scale={crystal.scale}
          >
            <meshPhysicalMaterial
              ref={(mat) => { if (mat) materialsRef.current[i] = mat }}
              color="#e0d8ff"
              transmission={0.6}
              thickness={1.5}
              roughness={0.05}
              ior={1.8}
              iridescence={0.15}
              iridescenceIOR={1.3}
              iridescenceThicknessRange={[200, 600]}
              attenuationColor="#7060b0"
              attenuationDistance={3.0}
              emissive="#8070d0"
              emissiveIntensity={0.8}
              transparent
              envMapIntensity={2.0}
              metalness={0.05}
              specularIntensity={0.6}
              clearcoat={0.3}
              clearcoatRoughness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
    </group>
  )
}

useGLTF.preload('/models/crystal_pack/scene.gltf')
