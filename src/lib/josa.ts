// 한국어 조사 처리 — 단어 마지막 글자의 받침 유무로 '(으)로' 같은 조사를 고름
//   batchim: 받침 있을 때 붙일 조사 (예: '으로')
//   none:    받침 없거나 ㄹ받침일 때 붙일 조사 (예: '로')
// 사용: `${name}${josa(name, "으로", "로")} 듣기`
export function josa(word: string, batchim: string, none: string): string {
  if (!word) return none;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return none; // 한글이 아니면 받침 없음 취급
  const jong = (code - 0xac00) % 28;
  return jong === 0 || jong === 8 ? none : batchim; // ㄹ받침(8)은 '로'
}
