// 교훈 배열에서 키워드 칩과 문장형 요약을 분리
// (공백 포함 10자 이하 = 키워드 칩, 초과 = 문장형)

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
