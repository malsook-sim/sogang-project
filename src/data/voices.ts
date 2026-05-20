export interface Voice {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: "premade" | "cloned";
}

// 동화 낭독에 어울리는 한국어 보이스
export const defaultVoices: Voice[] = [
  {
    id: "ZjAPD4f11zlnEnZpKDgo",
    name: "다정한 엄마",
    description: "포근하고 다정한 엄마 목소리로 읽어줘요",
    emoji: "👩",
    type: "premade",
  },
  {
    id: "5n5gqmaQi9Ewevrz7bOS",
    name: "상냥한 언니",
    description: "상냥하고 친근한 언니 목소리로 들려줘요",
    emoji: "👧",
    type: "premade",
  },
  {
    id: "1W00IGEmNmwmsDeYy7ag",
    name: "밝은 이야기꾼",
    description: "밝고 경쾌한 목소리로 신나게 읽어줘요",
    emoji: "🌟",
    type: "premade",
  },
  {
    id: "FQ3MuLxZh0jHcZmA5vW1",
    name: "나긋한 목소리",
    description: "부드럽고 나긋나긋하게 이야기를 들려줘요",
    emoji: "🌸",
    type: "premade",
  },
  {
    id: "r2b2z8wPmZeh7CQksHSs",
    name: "차분한 목소리",
    description: "차분하고 안정적인 목소리로 편안하게 읽어줘요",
    emoji: "🌙",
    type: "premade",
  },
  {
    id: "Lb7qkOn5hF8p7qfCDH8q",
    name: "포근한 엄마",
    description: "엄마가 들려주듯 포근하고 다정한 목소리예요",
    emoji: "🤱",
    type: "premade",
  },
  {
    id: "74i8I1pZi98ZjmmYLdaF",
    name: "잠자리 목소리",
    description: "잠들기 전 듣기 좋은 나른하고 차분한 목소리예요",
    emoji: "😴",
    type: "premade",
  },
  {
    id: "n2fbxG88jqAoaVPUy3IG",
    name: "또박또박 낭독",
    description: "또박또박 정성껏 읽어주는 낭독 목소리예요",
    emoji: "📖",
    type: "premade",
  },
];

// 영어 동화 낭독용 영어 보이스
export const englishVoices: Voice[] = [
  {
    id: "qSeXEcewz7tA0Q0qk9fH",
    name: "엄마 목소리",
    description: "다정한 엄마의 영어 목소리로 읽어줘요",
    emoji: "👩",
    type: "premade",
  },
  {
    id: "auq43ws1oslv0tO4BDa7",
    name: "아빠 목소리",
    description: "듬직한 아빠의 영어 목소리로 읽어줘요",
    emoji: "👨",
    type: "premade",
  },
  {
    id: "3AMU7jXQuQa3oRvRqUmb",
    name: "원어민 선생님",
    description: "또렷한 원어민 발음으로 읽어줘요",
    emoji: "🌎",
    type: "premade",
  },
  {
    id: "e5WNhrdI30aXpS2RSGm1",
    name: "나긋한 목소리",
    description: "부드럽고 나긋한 영어 목소리로 들려줘요",
    emoji: "🌸",
    type: "premade",
  },
  {
    id: "ZthjuvLPty3kTMaNKVKb",
    name: "할아버지 목소리",
    description: "포근한 할아버지의 영어 목소리로 읽어줘요",
    emoji: "👴",
    type: "premade",
  },
  {
    id: "sANWqF1bCMzR6eyZbCGw",
    name: "할머니 목소리",
    description: "따뜻한 할머니의 영어 목소리로 들려줘요",
    emoji: "👵",
    type: "premade",
  },
];

// 동화 언어에 맞는 기본 보이스 목록
export function voicesForLang(lang: "ko" | "en"): Voice[] {
  return lang === "en" ? englishVoices : defaultVoices;
}

export function getVoiceById(id: string): Voice | undefined {
  return (
    defaultVoices.find((v) => v.id === id) ??
    englishVoices.find((v) => v.id === id)
  );
}
