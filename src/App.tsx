import { Canvas } from '@react-three/fiber'
import { createXRStore, XR, useXR } from '@react-three/xr'
import { OrbitControls } from '@react-three/drei'
import { Scene } from './components/Scene'
import { DesktopOverlay } from './ui/DesktopOverlay'
import { EnterVRButton } from './ui/EnterVRButton'
import { CONFIG } from './config'

const xrStore = createXRStore({
  emulate: 'metaQuest3',
  hand: true,
  controller: true,
  frameRate: 'high',
})

const playerY = -CONFIG.cathedral.radiusY * 0.35

function DesktopControls() {
  const session = useXR((xr) => xr.session)
  if (session) return null
  return <OrbitControls target={[0, playerY + 5, 0]} />
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
