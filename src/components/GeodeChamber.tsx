import { useMemo } from 'react'
import * as THREE from 'three'
import { CONFIG } from '../config'
import { createNoise3D } from 'simplex-noise'

export function GeodeChamber() {
  const geometry = useMemo(() => {
    const { radiusX, radiusY, subdivisions } = CONFIG.cathedral
    const geo = new THREE.IcosahedronGeometry(1, subdivisions)
    const pos = geo.attributes.position
    const noise3D = createNoise3D()

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const len = Math.sqrt(x * x + y * y + z * z)
      const nx = x / len
      const ny = y / len
      const nz = z / len
      const noiseScale = 0.8
      const noiseAmount = 0.15
      const displacement =
        1 +
        noise3D(nx * noiseScale * 3, ny * noiseScale * 3, nz * noiseScale * 3) *
          noiseAmount
      pos.setXYZ(
        i,
        nx * radiusX * displacement,
        ny * radiusY * displacement,
        nz * radiusX * displacement,
      )
    }

    // Flatten floor
    const floorY = -radiusY * 0.85
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < floorY) {
        const floorNoise =
          noise3D(pos.getX(i) * 0.5, floorY, pos.getZ(i) * 0.5) * 0.3
        pos.setY(i, floorY + floorNoise)
      }
    }

    geo.computeVertexNormals()

    // Flip normals inward
    const normals = geo.attributes.normal
    for (let i = 0; i < normals.count; i++) {
      normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i))
    }

    // Flip face winding
    const index = geo.index!
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i)
      const c = index.getX(i + 2)
      index.setX(i, c)
      index.setX(i + 2, a)
    }

    return geo
  }, [])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#1a1a2e"
        roughness={0.9}
        metalness={0.1}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}
