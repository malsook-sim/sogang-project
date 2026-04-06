export interface Voice {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: "premade" | "cloned";
}

// ElevenLabs 기본 제공 보이스 중 동화 낭독에 적합한 것들
export const defaultVoices: Voice[] = [
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "따뜻한 이야기꾼",
    description: "다정하고 포근한 목소리로 동화를 읽어줘요",
    emoji: "🧔",
    type: "premade",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "다정한 엄마",
    description: "차분하고 안정적인 목소리의 여성 성우",
    emoji: "👩",
    type: "premade",
  },
  {
    id: "FGY2WhTYpPnrIDTdsKH5",
    name: "밝은 언니",
    description: "밝고 활기찬 목소리로 신나게 읽어줘요",
    emoji: "👧",
    type: "premade",
  },
  {
    id: "IKne3meq5aSn9XLyUdCD",
    name: "듬직한 아빠",
    description: "깊고 안정감 있는 남성 목소리",
    emoji: "👨",
    type: "premade",
  },
];

export function getVoiceById(id: string): Voice | undefined {
  return defaultVoices.find((v) => v.id === id);
}
