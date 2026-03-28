import { useStore } from '../store/useStore'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export function PostProcessing() {
  const qualityTier = useStore((s) => s.qualityTier)
  const bloomResolution = qualityTier === 'high' ? 512 : 256

  if (qualityTier === 'low') {
    return (
      <EffectComposer>
        <Vignette
          offset={0.3}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
        <ToneMapping
          blendFunction={BlendFunction.NORMAL}
          adaptive={true}
          resolution={256}
          middleGrey={0.6}
          maxLuminance={16.0}
          averageLuminance={1.0}
          adaptationRate={1.0}
        />
      </EffectComposer>
    )
  }

  if (qualityTier === 'medium') {
    return (
      <EffectComposer>
        <Bloom
          intensity={3.0}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.95}
          mipmapBlur
          resolutionX={bloomResolution}
          resolutionY={bloomResolution}
        />
        <Vignette
          offset={0.25}
          darkness={0.8}
          blendFunction={BlendFunction.NORMAL}
        />
        <ToneMapping
          blendFunction={BlendFunction.NORMAL}
          adaptive={true}
          resolution={256}
          middleGrey={0.6}
          maxLuminance={16.0}
          averageLuminance={1.0}
          adaptationRate={1.0}
        />
      </EffectComposer>
    )
  }

  // high quality
  return (
    <EffectComposer>
      <Bloom
        intensity={3.5}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.95}
        mipmapBlur
        resolutionX={bloomResolution}
        resolutionY={bloomResolution}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.002, 0.002] as unknown as import('three').Vector2}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette
        offset={0.25}
        darkness={0.8}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.08}
      />
      <ToneMapping
        blendFunction={BlendFunction.NORMAL}
        adaptive={true}
        resolution={256}
        middleGrey={0.6}
        maxLuminance={16.0}
        averageLuminance={1.0}
        adaptationRate={1.0}
      />
    </EffectComposer>
  )
}
