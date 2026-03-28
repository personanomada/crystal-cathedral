import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { createXRStore, XR, useXR } from '@react-three/xr'
import { OrbitControls } from '@react-three/drei'
import { Scene } from './components/Scene'
import { DesktopOverlay } from './ui/DesktopOverlay'
import { EnterVRButton } from './ui/EnterVRButton'
import { CONFIG } from './config'
import { useStore } from './store/useStore'

const xrStore = createXRStore({
  emulate: 'metaQuest3',
  hand: true,
  controller: true,
  frameRate: 'high',
})

const playerY = -CONFIG.cathedral.radiusY * 0.35

function DesktopControls() {
  const session = useXR((xr) => xr.session)
  const controlsRef = useRef<any>(null)
  const introComplete = useStore((s) => s.introComplete)
  const targetY = useRef(playerY) // Start looking straight ahead (same Y as camera)

  useFrame((_, delta) => {
    if (!controlsRef.current) return
    // Smoothly transition camera target upward after intro
    const goalY = introComplete ? playerY + 5 : playerY
    targetY.current += (goalY - targetY.current) * Math.min(1, delta * 0.5)
    controlsRef.current.target.set(0, targetY.current, -2)
    controlsRef.current.update()
  })

  if (session) return null
  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, playerY, -2]}
      enableDamping={false}
    />
  )
}

export default function App() {
  return (
    <>
      <EnterVRButton onEnterVR={() => xrStore.enterVR()} />
      <DesktopOverlay />
      <Canvas
        camera={{ position: [0, playerY, 0], fov: 75 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <XR store={xrStore}>
          <DesktopControls />
          <Scene />
        </XR>
      </Canvas>
    </>
  )
}
