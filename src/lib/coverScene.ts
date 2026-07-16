// 썸네일 씬 배정 로직 (순수 함수, JSX 없음). SVG 렌더는 StoryCover.tsx.
// 팔레트 규칙(하늘 4종/언덕 색)은 StoryCover가 담당하고, 여기선 "어떤 씬/오브젝트/변주냐"만 결정.

export type TemplateId =
  | "forest" | "hillpath" | "waterside" | "mountain"
  | "field" | "village" | "sky" | "sea";

export type AnimalId =
  | "rabbit" | "turtle" | "bear" | "fox" | "bird" | "sheep" | "tiger";

// 해시 폴백 순서 (id 해시 % 8)
export const TEMPLATE_ORDER: TemplateId[] = [
  "forest", "hillpath", "waterside", "mountain",
  "field", "village", "sky", "sea",
];

// 우선순위 1: 제목/본문 키워드 → 템플릿 (위에서부터 먼저 매칭. 구체적인 것 우선)
const TEMPLATE_KEYWORDS: { re: RegExp; t: TemplateId }[] = [
  { re: /바다|파도|섬|해변|물결|어부|고래|배를|돛/, t: "sea" },
  { re: /개울|시내|강가|강물|시냇|연못|호수|우물|샘물|물가|냇/, t: "waterside" },
  { re: /산속|산길|산자락|봉우리|절벽|바위산|산꼭대기|골짜기/, t: "mountain" },
  { re: /들판|꽃밭|풀밭|밭에|밭을|논밭|목장|화원|정원|양 떼/, t: "field" },
  { re: /하늘|구름|무지개|별나라|달나라|날개옷/, t: "sky" },
  { re: /먼 길|길을 떠|여행|나그네|고갯길|숲길/, t: "hillpath" },
  { re: /궁궐|궁전|성 안|성문|성벽|왕국|기와집|초가|오두막/, t: "village" },
  { re: /숲|나무|동물|토끼|거북|곰|여우|호랑이|사슴|새들/, t: "forest" },
  { re: /마을|고을|장터/, t: "village" },
];

// 오브젝트 레이어: 동물 실루엣 (위에서부터 먼저 매칭)
const ANIMAL_KEYWORDS: { re: RegExp; a: AnimalId }[] = [
  { re: /토끼/, a: "rabbit" },
  { re: /거북/, a: "turtle" },
  { re: /곰/, a: "bear" },
  { re: /여우/, a: "fox" },
  { re: /호랑이|범/, a: "tiger" },
  { re: /양치기|양 떼|염소|아기 양|양이|양을/, a: "sheep" },
  { re: /제비|까치|참새|비둘기|새가|새들|작은 새/, a: "bird" },
];

export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

// 아발란치 믹싱 — 순차적인 id("26","27"...)가 해시 폴백에서 같은 버킷에 몰리지 않게
function avalanche(h: number): number {
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
}

function fallbackIndex(id: string): number {
  return avalanche(hashId(id)) % TEMPLATE_ORDER.length;
}

function haystack(story: { title?: string; content?: string }): string {
  return `${story.title ?? ""} ${(story.content ?? "").slice(0, 700)}`;
}

// 결정론적 템플릿 배정: 키워드 우선, 없으면 id 해시 % 8
export function pickTemplate(story: {
  id: string;
  title?: string;
  content?: string;
}): TemplateId {
  const hay = haystack(story);
  for (const { re, t } of TEMPLATE_KEYWORDS) if (re.test(hay)) return t;
  return TEMPLATE_ORDER[fallbackIndex(story.id)];
}

// 본문 동물 키워드 → 실루엣 1개 (없으면 null)
export function pickAnimal(story: {
  title?: string;
  content?: string;
}): AnimalId | null {
  const hay = haystack(story);
  for (const { re, a } of ANIMAL_KEYWORDS) if (re.test(hay)) return a;
  return null;
}

// id 해시로 결정하는 변주 파라미터
export function variation(id: string) {
  const h = hashId(id);
  return {
    lightPos: (["left", "center", "right"] as const)[h % 3], // 해/달 위치
    hillLayers: 2 + ((h >> 2) % 2), // 2~3
    starCount: (h >> 4) % 6, // 0~5
    flip: ((h >> 7) & 1) === 1, // 오브젝트 좌우 반전
    treeCount: 3 + ((h >> 8) % 3), // 숲 3~5그루
  };
}
