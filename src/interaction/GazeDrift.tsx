import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'

const _direction = new THREE.Vector3()
const _forward = new THREE.Vector3(0, 0, -1)

export function GazeDrift() {
  const { camera } = useThree()

  useFrame((_, delta) => {
    const locomotion = useStore.getState().settings.locomotion
    if (locomotion !== 'gaze') return
    const dt = Math.min(delta, 0.1)
    _direction.copy(_forward).applyQuaternion(camera.quaternion)
    _direction.y = 0
    const horizontalMagnitude = _direction.length()
    _direction.normalize()
    const speed = horizontalMagnitude * CONFIG.locomotion.maxDriftSpeed * dt
    const newX = camera.position.x + _direction.x * speed
    const newZ = camera.position.z + _direction.z * speed
    const distFromCenter = Math.sqrt(newX * newX + newZ * newZ)
    const maxDist = CONFIG.cathedral.radiusX - CONFIG.locomotion.boundaryDistance
    if (distFromCenter < maxDist) {
      camera.position.x = newX
      camera.position.z = newZ
    } else {
      const boundaryFactor = Math.max(0, 1 - (distFromCenter - maxDist * 0.8) / (maxDist * 0.2))
      camera.position.x += _direction.x * speed * boundaryFactor
      camera.position.z += _direction.z * speed * boundaryFactor
    }
  })

  return null
}
