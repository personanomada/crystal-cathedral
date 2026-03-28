import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'
import mandalaVert from '../shaders/mandala.vert'
import mandalaFrag from '../shaders/mandala.frag'

const STAGE_TO_INDEX: Record<string, number> = {
  seed: 0, flower: 1, metatron: 2, sriYantra: 3,
}

export function SacredMandala() {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uStage: { value: 0 },
    uMorphProgress: { value: 0 },
    uColor: { value: new THREE.Color('#ffeaa7') },
    uEmissiveIntensity: { value: 0.5 },
    uBreathPhase: { value: 0 },
  }), [])

  useFrame((state) => {
    const { sessionDepth } = useStore.getState().presence
    const mandalaStage = useStore.getState().mandalaStage
    const mandalaProgress = useStore.getState().mandalaProgress
    const breathPhase = useStore.getState().breathPhase

    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uStage.value = STAGE_TO_INDEX[mandalaStage] ?? 0
    uniforms.uMorphProgress.value = mandalaProgress
    uniforms.uBreathPhase.value = breathPhase

    const stageIndex = STAGE_TO_INDEX[mandalaStage] ?? 0
    const stageColor = CONFIG.mandala.stageColors[stageIndex]
    uniforms.uColor.value.copy(stageColor)
    uniforms.uEmissiveIntensity.value = 0.3 + sessionDepth * 0.7

    if (meshRef.current) {
      const breathSpeed = 0.8 + Math.sin(breathPhase * Math.PI * 2) * 0.2
      meshRef.current.rotation.y += 0.0003 * breathSpeed
      meshRef.current.rotation.z += 0.0002 * breathSpeed
    }

    if (lightRef.current) {
      lightRef.current.color.copy(stageColor)
      lightRef.current.intensity = sessionDepth * 5
    }
  })

  const { radiusY } = CONFIG.cathedral
  const mandalaY = radiusY * 0.7

  return (
    <group position={[0, mandalaY, 0]}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CONFIG.mandala.diameter, CONFIG.mandala.diameter]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={mandalaVert}
          fragmentShader={mandalaFrag}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight ref={lightRef} intensity={0} distance={25} decay={1.5} />
    </group>
  )
}
