import * as THREE from 'three'
import { CONFIG } from '../config'

export interface CrystalPlacement {
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  surfaceNormal: THREE.Vector3
}

export function generateCrystalPlacements(
  count: number,
  seed: number = 42,
): CrystalPlacement[] {
  const { radiusX, radiusY } = CONFIG.cathedral
  const placements: CrystalPlacement[] = []
  let s = seed
  const random = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }

  for (let i = 0; i < count; i++) {
    const u = random()
    const v = random()
    const theta = u * Math.PI * 2
    const phi = Math.acos(1 - 2 * Math.pow(v, 0.6))
    const nx = Math.sin(phi) * Math.cos(theta)
    const ny = Math.cos(phi)
    const nz = Math.sin(phi) * Math.sin(theta)
    const px = nx * radiusX
    const py = ny * radiusY
    const pz = nz * radiusX
    if (py < -radiusY * 0.75) continue
    // Normal points inward (toward center)
    const normal = new THREE.Vector3(-nx, -ny, -nz).normalize()
    // Push crystal base into the wall so it appears to grow from the surface
    const embedDepth = 0.3 + random() * 0.4
    const up = new THREE.Vector3(0, 1, 0)
    const quat = new THREE.Quaternion().setFromUnitVectors(up, normal)
    const euler = new THREE.Euler().setFromQuaternion(quat)
    euler.z += random() * Math.PI * 2
    const heightFactor = (py + radiusY) / (2 * radiusY)
    const baseScale = 0.2 + random() * 0.5
    const heightScale = 0.5 + heightFactor * 1.5
    const scaleY = baseScale * heightScale * (0.8 + random() * 1.5)
    const scaleXZ = baseScale * heightScale * (0.3 + random() * 0.4)
    placements.push({
      position: new THREE.Vector3(
        px + normal.x * embedDepth,
        py + normal.y * embedDepth,
        pz + normal.z * embedDepth,
      ),
      rotation: euler,
      scale: new THREE.Vector3(scaleXZ, scaleY, scaleXZ),
      surfaceNormal: normal,
    })
  }
  return placements
}
