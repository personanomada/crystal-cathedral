import { GeodeChamber } from './GeodeChamber'
import { Crystals } from './Crystals'
import { SacredMandala } from './SacredMandala'
import { LightingRig } from './LightingRig'
import { ParticleField } from './ParticleField'
import { PostProcessing } from './PostProcessing'
import { LoveMessage } from './LoveMessage'
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
      {/* Systems — always running */}
      <BreathingPulse />
      <ReactivityEngine />
      <AdaptiveQuality />
      <SessionArc />
      <GazeDrift />
      <GazeFocus />
      <HandInteraction />
      <AudioManager />

      {/* Love message intro — shows first, then triggers scene reveal */}
      <LoveMessage />

      {/* Cathedral scene — fades in after intro */}
      <LightingRig />
      <GeodeChamber />
      <Crystals />
      <SacredMandala />
      <ParticleField />
      <PostProcessing />
    </>
  )
}
