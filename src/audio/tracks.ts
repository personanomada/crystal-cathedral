export interface TrackMeta {
  name: string
  url: string
  mode: 'lofi' | 'nature'
}

export const TRACKS: TrackMeta[] = [
  { name: 'Lofi Chill', url: '/audio/lofi-chill.mp3', mode: 'lofi' },
  { name: 'Cave Ambience', url: '/audio/cave-ambience.mp3', mode: 'nature' },
  { name: 'Dripping Water', url: '/audio/dripping.mp3', mode: 'nature' },
]
