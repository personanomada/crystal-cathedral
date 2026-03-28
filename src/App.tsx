import { Canvas } from '@react-three/fiber'
import { createXRStore, XR } from '@react-three/xr'

const xrStore = createXRStore({
  emulate: 'metaQuest3',
  hand: true,
  controller: true,
  frameRate: 'high',
})

export default function App() {
  return (
    <>
      <button
        onClick={() => xrStore.enterVR()}
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '1rem 2rem',
          fontSize: '1.2rem',
          zIndex: 10,
          background: '#6c5ce7',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Enter VR
      </button>
      <Canvas
        camera={{ position: [0, 1.5, 0], fov: 75 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <XR store={xrStore}>
          <ambientLight intensity={0.1} />
          <mesh position={[0, 1.5, -3]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#6c5ce7" />
          </mesh>
        </XR>
      </Canvas>
    </>
  )
}
