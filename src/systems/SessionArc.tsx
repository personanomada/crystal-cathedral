import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import { CONFIG } from '../config'

const STAGE_THRESHOLDS = [0, 0.25, 0.5, 0.75] as const
const STAGES = CONFIG.mandala.stages

export function SessionArc() {
  const setMandalaStage = useStore.getState().setMandalaStage
  const setMandalaProgress = useStore.getState().setMandalaProgress

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const { sessionDepth, stillness } = useStore.getState().presence
    let targetStageIndex = 0
    for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
      if (sessionDepth >= STAGE_THRESHOLDS[i]) { targetStageIndex = i; break }
    }
    const currentStage = useStore.getState().mandalaStage
    const currentStageIndex = STAGES.indexOf(currentStage)
    const currentProgress = useStore.getState().mandalaProgress

    if (currentStageIndex < targetStageIndex) {
      const morphSpeed = (1 / CONFIG.mandala.morphDuration) * (0.2 + stillness * 0.8)
      const newProgress = Math.min(1, currentProgress + morphSpeed * dt)
      if (newProgress >= 1) {
        const nextIndex = Math.min(currentStageIndex + 1, STAGES.length - 1)
        setMandalaStage(STAGES[nextIndex])
        setMandalaProgress(0)
      } else { setMandalaProgress(newProgress) }
    } else if (currentStageIndex > targetStageIndex) {
      const regressSpeed = 1 / (CONFIG.mandala.morphDuration * 2)
      const newProgress = currentProgress - regressSpeed * dt
      if (newProgress <= 0) {
        const prevIndex = Math.max(currentStageIndex - 1, 0)
        setMandalaStage(STAGES[prevIndex])
        setMandalaProgress(1)
      } else { setMandalaProgress(newProgress) }
    }
  })

  return null
}
