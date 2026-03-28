import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { getActiveThemeColors } from './LightingRig'
import type { GLTF } from 'three-stdlib'

// -------------------------------------------------------------------------
// Type helper for the stylized cluster GLB
// -------------------------------------------------------------------------
type StylizedClusterGLTF = GLTF & {
  nodes: { Crystal_Crystal_MAT_0: THREE.Mesh }
  materials: { Crystal_MAT: THREE.MeshStandardMaterial }
}

// -------------------------------------------------------------------------
// Cluster placement data — 5 accent positions around the chamber floor,
// close enough to the player to feel present but spread for depth.
// positions: [x, y, z], rotation Y (radians), scale
// -------------------------------------------------------------------------
const CLUSTER_PLACEMENTS = [
  { position: [-3.5, -4.2, -4.0] as [number, number, number], rotY: 0.4,  scale: 1.4 },
  { position: [ 4.2, -4.5, -3.0] as [number, number, number], rotY: -0.8, scale: 1.1 },
  { position: [-1.0, -4.8,  5.5] as [number, number, number], rotY: 1.2,  scale: 1.6 },
  { position: [ 5.0, -4.0,  2.5] as [number, number, number], rotY: -0.3, scale: 0.9 },
  { position: [-5.5, -3.8,  1.0] as [number, number, number], rotY: 2.1,  scale: 1.2 },
]

/**
 * CrystalClusters — 5 decorative cluster models placed near the player using the
 * stylized_crystal_cluster.glb model and its own PBR material. The emissive
 * component of the material pulses in sync with the breathing system.
 */
export function CrystalClusters() {
  const gltf = useGLTF('/models/stylized_crystal_cluster.glb') as StylizedClusterGLTF
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  const { nodes } = gltf
  const geometry = nodes.Crystal_Crystal_MAT_0?.geometry as THREE.BufferGeometry | undefined

  useFrame(() => {
    const breathPhase = useStore.getState().breathPhase
    const breathValue = Math.sin(breathPhase * Math.PI * 2) * 0.5 + 0.5
    const sessionDepth = useStore.getState().presence.sessionDepth
    const elapsed = useStore.getState().sessionElapsed
    const themeKey = useStore.getState().settings.theme
    const theme = getActiveThemeColors(themeKey, elapsed)

    meshRefs.current.forEach((mesh) => {
      if (!mesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity =
        (0.2 + breathValue * 0.4) * (0.3 + sessionDepth * 0.7)
      mat.emissive.copy(theme.emissive)
    })
  })

  // Don't render until geometry is available
  if (!geometry) return null

  return (
    <group>
      {CLUSTER_PLACEMENTS.map((placement, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
          geometry={geometry}
          position={placement.position}
          rotation={[0, placement.rotY, 0]}
          scale={placement.scale}
        >
          {/*
           * Use the model's own material but clone it so we can mutate
           * emissiveIntensity independently per mesh in useFrame.
           * We add a slight emissive base so the breathing pulse is visible.
           */}
          <meshStandardMaterial
            ref={(mat) => {
              if (mat) {
                // Copy relevant PBR properties from original material for visual fidelity
                const orig = gltf.materials.Crystal_MAT
                if (orig) {
                  if ((orig as THREE.MeshStandardMaterial).map) {
                    mat.map = (orig as THREE.MeshStandardMaterial).map
                  }
                  if ((orig as THREE.MeshStandardMaterial).normalMap) {
                    mat.normalMap = (orig as THREE.MeshStandardMaterial).normalMap
                  }
                  if ((orig as THREE.MeshStandardMaterial).roughnessMap) {
                    mat.roughnessMap = (orig as THREE.MeshStandardMaterial).roughnessMap
                  }
                  mat.roughness = (orig as THREE.MeshStandardMaterial).roughness ?? 0.3
                  mat.metalness = (orig as THREE.MeshStandardMaterial).metalness ?? 0.6
                  mat.color.copy((orig as THREE.MeshStandardMaterial).color)
                }
                mat.emissive = new THREE.Color('#6c5ce7')
                mat.emissiveIntensity = 0.2
                mat.needsUpdate = true
              }
            }}
            roughness={0.3}
            metalness={0.6}
            envMapIntensity={2.0}
          />
        </mesh>
      ))}
    </group>
  )
}

// Preload for fast initial render
useGLTF.preload('/models/stylized_crystal_cluster.glb')
