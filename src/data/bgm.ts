export interface BgmTrack {
  id: string;
  label: string;
  emoji: string;
  file: string;
}

// 동화 배경음악 — ElevenLabs Sound Effects 로 생성, public/bgm/ 에 정적 저장
export const bgmTracks: BgmTrack[] = [
  { id: "lullaby", label: "자장가", emoji: "🎵", file: "/bgm/lullaby.mp3" },
  { id: "piano", label: "잔잔한 피아노", emoji: "🎹", file: "/bgm/piano.mp3" },
  { id: "forest", label: "숲속", emoji: "🌲", file: "/bgm/forest.mp3" },
  { id: "dream", label: "꿈결", emoji: "✨", file: "/bgm/dream.mp3" },
];
