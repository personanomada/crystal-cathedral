import { GeodeChamber } from './GeodeChamber'
import { CrystalFormation } from './CrystalFormation'
import { HeroCrystals } from './HeroCrystals'
import { SacredMandala } from './SacredMandala'
import { LightingRig } from './LightingRig'
import { ParticleField } from './ParticleField'
import { PostProcessing } from './PostProcessing'
import { BreathingPulse } from '../systems/BreathingPulse'
import { ReactivityEngine } from '../systems/ReactivityEngine'
import { AdaptiveQuality } from '../systems/AdaptiveQuality'
import { SessionArc } from '../systems/SessionArc'
import { GazeDrift } from '../interaction/GazeDrift'
import { GazeFocus } from '../interaction/GazeFocus'
import { HandInteraction } from '../interaction/HandInteraction'
import { AudioManager } from '../audio/AudioManager'

export function Scene() {
  return (
    <>
      {/* Systems */}
      <BreathingPulse />
      <ReactivityEngine />
      <AdaptiveQuality />
      <SessionArc />
      <GazeDrift />
      <GazeFocus />
      <HandInteraction />
      <AudioManager />
      {/* Scene elements */}
      <LightingRig />
      <GeodeChamber />
      <CrystalFormation />
      <HeroCrystals />
      <SacredMandala />
      <ParticleField />
      <PostProcessing />
    </>
  )
}
