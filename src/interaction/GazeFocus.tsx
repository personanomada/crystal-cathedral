import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../store/useStore'

const _raycaster = new THREE.Raycaster()
const _direction = new THREE.Vector3()

export function GazeFocus() {
  const { camera, scene } = useThree()
  const lastHit = useRef<THREE.Object3D | null>(null)
  const originalEmissive = useRef(new THREE.Color())

  useFrame(() => {
    const focus = useStore.getState().presence.focus
    if (lastHit.current && focus < 0.1) {
      const mat = (lastHit.current as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (mat?.emissive) mat.emissive.copy(originalEmissive.current)
      lastHit.current = null
    }
    if (focus < 0.2) return
    _direction.set(0, 0, -1).applyQuaternion(camera.quaternion)
    _raycaster.set(camera.position, _direction)
    _raycaster.far = 20
    const intersects = _raycaster.intersectObjects(scene.children, true)
    const crystalHit = intersects.find(
      (hit) =>
        hit.object instanceof THREE.InstancedMesh ||
        hit.object.name?.includes('crystal'),
    )
    if (crystalHit) {
      const obj = crystalHit.object as THREE.Mesh
      const mat = obj.material as THREE.MeshStandardMaterial
      if (mat?.emissive) {
        if (lastHit.current !== obj) {
          originalEmissive.current.copy(mat.emissive)
          lastHit.current = obj
        }
        mat.emissiveIntensity = 0.5 + focus * 2
      }
    }
  })

  return null
}
