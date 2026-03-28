import { Canvas } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'
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
          <OrbitControls target={[0, playerY + 2, 0]} />
          <Scene />
        </XR>
      </Canvas>
    </>
  )
}
