import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'

export function BreathingPulse() {
  const breathingSpeed = useStore((s) => s.settings.breathingSpeed)
  const setBreathPhase = useStore((s) => s.setBreathPhase)

  useFrame((_, delta) => {
    const cycleDuration = CONFIG.breathing[breathingSpeed]
    const phaseIncrement = delta / cycleDuration
    const currentPhase = useStore.getState().breathPhase
    const newPhase = (currentPhase + phaseIncrement) % 1
    setBreathPhase(newPhase)
  })

  return null
}
