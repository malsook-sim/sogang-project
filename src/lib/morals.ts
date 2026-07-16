// 교훈 배열에서 키워드 칩과 문장형 요약을 분리
// (공백 포함 10자 이하 = 키워드 칩, 초과 = 문장형)

// 영어 교훈 키워드 → 한글 표기 매핑 (앱 UI는 한국어 전용, 영문 태그 노출 금지)
const TAG_KO: Record<string, string> = {
  kindness: "친절",
  sharing: "나눔",
  courage: "용기",
  bravery: "용기",
  honesty: "정직",
  friendship: "우정",
  patience: "인내",
  perseverance: "끈기",
  love: "사랑",
  gratitude: "감사",
  manners: "예절",
  respect: "존중",
  responsibility: "책임",
  teamwork: "협동",
  cooperation: "협동",
  generosity: "베풂",
  forgiveness: "용서",
  humility: "겸손",
  diligence: "끈기",
  wisdom: "지혜",
  hope: "희망",
  trust: "신뢰",
  empathy: "공감",
  caring: "배려",
  helpfulness: "도움",
  creativity: "창의력",
  curiosity: "호기심",
  confidence: "자신감",
  family: "가족",
  dream: "꿈",
  dreams: "꿈",
};

// 태그 1개를 한글로. 매핑에 있으면 한글, 이미 한글이면 그대로,
// 매핑에 없는 영문이면 로그만 남기고 null (표시 숨김 — 영문 태그 노출 금지)
export function koTag(tag: string): string | null {
  const t = tag.trim();
  if (!t) return null;
  const mapped = TAG_KO[t.toLowerCase()];
  if (mapped) return mapped;
  if (!/[a-zA-Z]/.test(t)) return t; // 이미 한글 등
  if (typeof console !== "undefined") {
    console.warn(`[morals] 매핑에 없는 영문 태그 숨김: "${t}"`);
  }
  return null;
}

// 표시용 한글 태그 배열 (매핑 실패한 영문은 제외, 최대 max개)
export function koTags(morals: string[] | undefined, max = 3): string[] {
  if (!morals) return [];
  const out: string[] = [];
  for (const m of morals) {
    const t = m.trim();
    if (!t || t.length > 10) continue; // 문장형 제외
    const ko = koTag(t);
    if (ko) out.push(ko);
    if (out.length >= max) break;
  }
  return out;
}

export function moralKeywords(morals: string[] | undefined, max = 3): string[] {
  if (!morals) return [];
  return morals.filter((m) => m.trim().length > 0 && m.trim().length <= 10).slice(0, max);
}

export function moralSentences(morals: string[] | undefined): string[] {
  if (!morals) return [];
  return morals.filter((m) => m.trim().length > 10);
}

// 상세/요약용 문장형 교훈 (전용 컬럼 우선, 없으면 morals에서 추출), 최대 2문장
export function moralSummaryLines(
  morals: string[] | undefined,
  moralSummary?: string | null,
  max = 2
): string[] {
  if (moralSummary && moralSummary.trim()) {
    return moralSummary
      .split(/(?<=[.!?。])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, max);
  }
  return moralSentences(morals).slice(0, max);
}

// 상세용 교훈 캡션 — moral_summary(또는 문장형 morals)를 그대로 출력.
// 키워드 조립 폴백 금지: 요약이 없으면 빈 배열 → 호출부에서 교훈 섹션 숨김.
export function moralCaption(
  morals: string[] | undefined,
  moralSummary?: string | null,
  max = 2
): string[] {
  return moralSummaryLines(morals, moralSummary, max);
}
