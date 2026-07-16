// 동화 낭독 시간(분)의 단일 진실 공급원.
// 계수는 실제 ElevenLabs TTS 재생 시간 실측값 (2026-07, scripts/measure-tts.mjs):
//   · 한국어 ≈ 440자/분 (공백 포함, 7.3자/초)
//   · 영어   ≈ 120단어/분
// DB의 duration 컬럼을 신뢰하지 말고 항상 본문에서 이 함수로 계산할 것.

export const KO_CHARS_PER_MIN = 440;
export const EN_WORDS_PER_MIN = 120;

function detectLang(text: string): "ko" | "en" {
  return /[가-힣]/.test(text.slice(0, 300)) ? "ko" : "en";
}

// 본문 → 낭독 시간(분). 분 단위 반올림, 1분 미만은 1분.
export function estimateDuration(
  content: string | null | undefined,
  language?: "ko" | "en"
): number {
  const text = (content ?? "").trim();
  if (!text) return 1;
  const lang = language ?? detectLang(text);
  const minutes =
    lang === "en"
      ? text.split(/\s+/).length / EN_WORDS_PER_MIN
      : (content ?? "").length / KO_CHARS_PER_MIN; // 한국어=공백 포함 글자수
  return Math.max(1, Math.round(minutes));
}

// 한국어 글자수 → 분 (만들기 옵션 라벨/프롬프트 목표가 같은 계수를 쓰도록)
export function minutesForKoChars(chars: number): number {
  return Math.max(1, Math.round(chars / KO_CHARS_PER_MIN));
}

// 만들기 옵션별 목표 분량(한국어 공백 포함 글자수 범위) — 프롬프트 목표와 UI 라벨의 공통 소스
export const LENGTH_TARGET_CHARS = {
  short: { min: 1200, max: 1450 }, // 약 3분 (한국어 440자/분)
  normal: { min: 2000, max: 2400 }, // 약 5분
} as const;

// 옵션의 대표 낭독 시간(분) — 목표 범위의 중앙값 기준
export function targetMinutes(len: "short" | "normal"): number {
  const t = LENGTH_TARGET_CHARS[len];
  return minutesForKoChars((t.min + t.max) / 2);
}
