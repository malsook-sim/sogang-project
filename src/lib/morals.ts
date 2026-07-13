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

// 받침 유무 (와/과·을/를용 — josa의 ㄹ받침 예외 없이 순수 받침만 판정)
function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

// 상세용 교훈 캡션 — 문장형 요약이 있으면 그대로, 없으면 키워드로 자연스러운 한 줄 생성
// (catalog 동화처럼 키워드 morals만 있는 경우에도 교훈이 비지 않도록)
export function moralCaption(
  morals: string[] | undefined,
  moralSummary?: string | null,
  max = 2
): string[] {
  const lines = moralSummaryLines(morals, moralSummary, max);
  if (lines.length > 0) return lines;

  const keywords = moralKeywords(morals, 3);
  if (keywords.length === 0) return [];

  const joined = keywords.reduce((acc, word, i) => {
    if (i === 0) return word;
    const connector = hasBatchim(keywords[i - 1]) ? "과 " : "와 ";
    return acc + connector + word;
  }, "");
  const last = keywords[keywords.length - 1];
  const eulReul = hasBatchim(last) ? "을" : "를";
  return [`${joined}${eulReul} 배울 수 있는 이야기예요`];
}
