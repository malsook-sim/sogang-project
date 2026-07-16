// 카탈로그 콘텐츠 보강 — 원작 훼손 없이 분량만 늘리는 재화(retelling).
// 사용: node scripts/enrich-catalog.mjs "토끼와 거북이"        (생성만, 출력)
//       node scripts/enrich-catalog.mjs --write "제목1" "제목2"  (검증 통과 시 DB 갱신+백업)
import fs from "node:fs";
import mysql from "mysql2/promise";

const BASE = "http://localhost:3000";
const KO_CHARS_PER_MIN = 440;
const EN_WORDS_PER_MIN = 120;

// .env.local 에서 키 로드
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);
const GEMINI_API_KEY = env.GEMINI_API_KEY;

function estimateDuration(content, lang) {
  const text = (content ?? "").trim();
  if (!text) return 1;
  const minutes =
    lang === "en" ? text.split(/\s+/).length / EN_WORDS_PER_MIN : (content ?? "").length / KO_CHARS_PER_MIN;
  return Math.max(1, Math.round(minutes));
}
const koLen = (t) => (t ?? "").length;
const enWords = (t) => (t ?? "").trim().split(/\s+/).length;

// 의성어·의태어 근사 카운트 (AABB 반복 + 알려진 목록) — 검증용
const MIMETIC = ["살금","반짝","쿨쿨","두근","펄쩍","깡총","깡충","폴짝","찰방","첨벙","졸졸","데굴","또르르","방긋","생긋","빙그","빙긋","훌쩍","퐁당","보글","출렁","찰랑","사르르","스르르","바스락","후두둑","새근","송골","꼬물","살랑","벌렁","벌떡","피식","씽긋","휙","휘","쏜살","말랑","몽글"];
function countMimetic(text) {
  let t = text;
  const found = [];
  // AABB 반복(깡총깡총 등) 먼저 잡고 해당 구간 제거 → 부분문자열 중복 카운트 방지
  (t.match(/([가-힣]{2})\1/g) || []).forEach((m) => { found.push(m); t = t.replace(m, "　".repeat(m.length)); });
  for (const w of MIMETIC) {
    let i = 0;
    while ((i = t.indexOf(w, i)) !== -1) { found.push(w); t = t.slice(0, i) + "　".repeat(w.length) + t.slice(i + w.length); }
  }
  return found;
}

function ageGuideKo(max) {
  if (max <= 4) return "3~4세 대상이므로 한 문장은 15자 내외의 단문 위주로 쓰세요.";
  if (max <= 6) return "5~6세 대상이므로 한 문장은 25자 내외로 쓰세요.";
  return "7세 이상 대상이므로 복문을 써도 되지만 한 문장은 35자 이내로 쓰세요.";
}

function promptKo(story) {
  return `당신은 아이에게 동화를 들려주는 작가입니다. 아래 [원작]은 널리 알려진 전래동화입니다.
이 이야기를 더 생생하고 풍부하게 다시 써 주세요(재화, retelling).

[원작]
${story.content}

[재화 규칙 — 반드시 지킬 것]
- 이것은 널리 알려진 전래동화의 재화입니다. 원작의 줄거리, 등장인물, 결말을 절대 바꾸지 마세요.
- 추가할 수 있는 것은 장면 묘사, 인물의 대사와 감정, 배경 설명뿐입니다. 새로운 사건이나 인물을 만들어내지 마세요.
- 원작에 없는 새 인물을 추가하지 마세요. 심판, 진행자처럼 새 역할을 만들거나, 원작에서 '동물 친구들'처럼 뭉뚱그려 나온 무리에 이름(다람쥐·곰 등)이나 개별 대사를 붙이지 마세요. 그런 무리는 원작 그대로 뭉뚱그려 두세요.
- 분량: 반드시 공백 포함 1400~1500자로 쓰세요. 1300자보다 짧으면 실패입니다. 사건을 새로 만들지 말고, 원작의 각 장면마다 묘사·대사·인물의 감정을 두세 문장씩 더 풀어써서 분량을 충분히 채우세요. 문단 수는 여덟 개 이상이 좋습니다.

[문장·표현 규칙]
- 대상 연령: ${story.ageMin}~${story.ageMax}세. 그 나이가 이해할 쉬운 어휘만 사용.
- ${ageGuideKo(story.ageMax)}
- 의성어·의태어(깡총깡총·스르르·살랑·반짝 같은 표현)는 이야기 전체에서 최대 6개까지만 쓰세요. 이미 여섯 개를 썼다면 그 뒤로는 하나도 더 쓰지 마세요. 모든 문단에 하나씩 넣지 말고 가장 인상적인 장면에만 쓰고, 절반 이상의 문단에는 아예 없어야 합니다.
- 같은 단어나 그 변형을 전체에서 세 번을 넘겨 쓰지 마세요. 같은 뜻이라도 다른 어휘로 바꿔 쓰세요.
- '우와!', '야호!' 같은 감탄사는 전체에서 두 개 이하로 제한하세요.
- 다음 표현은 사용 금지(AI가 쓴 티가 나는 상투구): '그때였어요', '바로 그때였어요', '잠시 후였어요', '그러던 어느 날이었어요', '~하는 것이었어요'. 장면 전환은 '그런데', '문득' 같은 자연스러운 연결이나 연결어 없이 넘어가세요.
- 문체: 아이에게 읽어주는 부드러운 구어체('~했어요', '~했답니다').
- 문단은 빈 줄로 구분하세요.
- 마지막에 교훈을 말로 정리하지 마세요. 인물의 행동과 결과로만 보여주세요.

[소리내어 읽기(TTS) 규칙]
- 괄호·이모지·특수문자·영어 단어를 쓰지 마세요. 숫자는 한글로 풀어 쓰세요.
- 한 문장은 소리 내어 읽었을 때 한 호흡에 끝나는 길이로 쓰세요.

[마지막 자기 점검 — 출력 전 반드시 수행]
- 본문에 쓴 의성어·의태어(깡총깡총, 스르르, 반짝, 쏜살, 살랑, 폴짝, 뚜벅뚜벅 같은 것)를 하나하나 세어 보세요. 여섯 개를 넘으면, 넘는 만큼을 평범한 서술로 바꿔서 여섯 개 이하가 되게 다시 쓰세요. (예: '깡총깡총 뛰었어요' → '가볍게 뛰었어요', '스르르 잠이 들었어요' → '어느새 잠이 들었어요')

제목 "${story.title}"은 그대로 유지합니다. 아래 JSON만 출력하세요:
{ "content": "동화 본문 (문단 사이 빈 줄로 구분)" }`;
}

function promptEn(story) {
  return `You are a children's storybook author. The [ORIGINAL] below is a well-known fable.
Retell it in a richer, more vivid way.

[ORIGINAL]
${story.content}

[RETELLING RULES — must follow]
- This is a retelling of a well-known fable. NEVER change the plot, characters, or ending.
- You may only add scene description, characters' dialogue and emotions, and background detail. Do not invent new events or characters.
- Length: you MUST write 360-400 words. Fewer than 350 words is a failure. Do not add new events; expand each existing scene with two or three more sentences of description, dialogue, and emotion. Aim for eight or more paragraphs.

[STYLE RULES]
- Target age: ${story.ageMin}-${story.ageMax}. Use only vocabulary a child that age understands.
- Use onomatopoeia/mimetic words only 4-6 times in the whole story; more than half the paragraphs should have none.
- Do not use any word or its variants more than three times; use different vocabulary for the same idea.
- Limit exclamations to at most two in the whole story.
- Do NOT use AI-sounding cliché transitions like "Just then,", "Suddenly, that was when...", "A little while later,".
- Warm, simple English suitable for reading aloud. Separate paragraphs with a blank line.
- Do not state a moral outright at the end; show it through actions and outcome.
- No parentheses, emojis, or special characters; write numbers as words.

Keep the title "${story.title}". Also provide a natural Korean translation "contentKo" with the SAME paragraph structure. Output ONLY this JSON:
{ "content": "story body", "contentKo": "한국어 번역, content와 같은 문단 구조" }`;
}

async function callGemini(prompt, isEn) {
  const schema = {
    type: "OBJECT",
    properties: isEn
      ? { content: { type: "STRING" }, contentKo: { type: "STRING" } }
      : { content: { type: "STRING" } },
    required: isEn ? ["content", "contentKo"] : ["content"],
  };
  // 무료 티어 쿼터 절약: 모델당 1회만 시도 (호출당 최대 2요청)
  for (const model of ["gemini-2.5-flash", "gemini-2.5-flash-lite"]) {
    for (let attempt = 0; attempt < 1; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.65,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
          }
        );
        if (!res.ok) { await new Promise((r) => setTimeout(r, 900)); continue; }
        const data = await res.json();
        const txt = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").replace(/```json\n?|```\n?/g, "").trim();
        const obj = JSON.parse(txt);
        if (obj?.content) return obj;
      } catch { await new Promise((r) => setTimeout(r, 900)); }
    }
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 목표 분량 + 의성어≤6 을 만족하는 후보를 최대 6회 시도해 찾음.
// 즉시 통과 없으면 "길이 충족 후보 중 의성어 최소"를 채택, 그것도 없으면 가장 긴 것.
async function enrichOne(story) {
  const isEn = story.category === "english" || !/[가-힣]/.test(story.content.slice(0, 200));
  const lang = isEn ? "en" : "ko";
  const lenOk = (size) => (isEn ? size >= 350 && size <= 430 : size >= 1300 && size <= 1600);
  let best = null; // 길이 충족 후보 중 의성어 최소
  let longest = null;
  for (let i = 0; i < 3; i++) {
    const out = await callGemini(isEn ? promptEn(story) : promptKo(story), isEn);
    if (out) {
      const size = isEn ? enWords(out.content) : koLen(out.content);
      const mim = isEn ? 0 : countMimetic(out.content).length;
      const cand = { ...out, size, lang, isEn, mim };
      if (lenOk(size) && mim <= 6) return cand; // 완벽
      if (lenOk(size) && (!best || mim < best.mim)) best = cand;
      if (!longest || size > longest.size) longest = cand;
    }
    await sleep(1200); // 레이트리밋 완화
  }
  if (best) return { ...best, warn: best.mim > 6 }; // 길이 OK, 의성어만 초과
  return longest ? { ...longest, warn: true } : null;
}

// 10편 대상
const DEFAULT_TARGETS = [
  "선녀와 나무꾼", "흥부와 놀부", "콩쥐 팥쥐", "금도끼 은도끼",
  "토끼와 거북이", "해와 달이 된 오누이",
  "별이 된 아이", "잠자는 숲속의 공주", "아기 곰 세 마리",
  "The Tortoise and the Hare",
];
const lastSentences = (t, n = 2) =>
  (t || "").trim().replace(/\n+/g, " ").split(/(?<=[.!?。요다])\s+/).slice(-n).join(" ").slice(-160);

// ── main ──
const args = process.argv.slice(2);
const write = args.includes("--write");
const titles = args.filter((a) => a !== "--write");
const targetTitles = titles.length ? titles : DEFAULT_TARGETS;

const { stories } = await (await fetch(`${BASE}/api/stories`)).json();

let conn = null;
if (write) {
  conn = await mysql.createConnection(env.DATABASE_URL);
  await conn.query(`CREATE TABLE IF NOT EXISTS stories_content_backup (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id VARCHAR(64), title VARCHAR(255),
    content MEDIUMTEXT, content_ko MEDIUMTEXT, duration_min INT,
    backed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  console.log("백업 테이블 준비 완료 (stories_content_backup)");
}

const report = [];
for (const title of targetTitles) {
  const story = stories.find((s) => s.title === title);
  if (!story) { console.log(`[없음] ${title}`); continue; }
  const isEnStory = story.category === "english" || !/[가-힣]/.test(story.content.slice(0, 200));
  const origSize = isEnStory ? enWords(story.content) : story.content.length;
  const origMin = estimateDuration(story.content, isEnStory ? "en" : "ko");
  process.stdout.write(`\n▶ ${title} 생성 중...`);
  const r = await enrichOne(story);
  if (!r) { console.log(" 실패"); continue; }
  const newMin = estimateDuration(r.content, r.lang);
  const mim = r.isEn ? [] : countMimetic(r.content).length;
  console.log(` ${origSize}${r.isEn?"단어":"자"}/${origMin}분 → ${r.size}${r.isEn?"단어":"자"}/${newMin}분 · 의성어 ${r.isEn?"-":mim} ${r.warn?"⚠️":"✓"}`);

  const row = {
    id: story.id, title, isEn: r.isEn,
    origSize, origMin, newSize: r.size, newMin, mim,
    origEnd: lastSentences(story.content), newEnd: lastSentences(r.content),
    content: r.content, contentKo: r.contentKo || null, warn: !!r.warn,
  };
  report.push(row);

  if (write && conn && r.warn) {
    console.log(`   ↳ ⚠️ 목표 미달로 DB 갱신 건너뜀 (수동 재시도 필요)`);
  } else if (write && conn) {
    // 1) 원본 백업
    await conn.query(
      "INSERT INTO stories_content_backup (story_id, title, content, content_ko, duration_min) SELECT id, title, content, content_ko, duration_min FROM stories WHERE id = ?",
      [story.id]
    );
    // 2) 본문 갱신 (영어는 content_ko도) + duration_min 재계산 저장
    if (r.isEn && r.contentKo) {
      await conn.query("UPDATE stories SET content = ?, content_ko = ?, duration_min = ? WHERE id = ?",
        [r.content, r.contentKo, newMin, story.id]);
    } else {
      await conn.query("UPDATE stories SET content = ?, duration_min = ? WHERE id = ?",
        [r.content, newMin, story.id]);
    }
    console.log(`   ↳ 백업+DB갱신 완료 (id=${story.id})`);
  }
  await sleep(1500); // 스토리 간 간격 (레이트리밋 완화)
}

// 리포트 파일 저장 (본문 전체 보존)
fs.writeFileSync("scripts/enrich-report.json", JSON.stringify(report, null, 2));

// 변경 전/후 대조표
console.log("\n\n════════ 변경 전/후 대조표 ════════");
for (const r of report) {
  console.log(`\n【${r.title}】 ${r.origSize}${r.isEn?"w":"자"}/${r.origMin}분 → ${r.newSize}${r.isEn?"w":"자"}/${r.newMin}분` + (r.isEn?"":` · 의성어 ${r.mim}개`));
  console.log(`  원작 결말: …${r.origEnd}`);
  console.log(`  보강 결말: …${r.newEnd}`);
}

if (conn) await conn.end();

// 전체 34편 분포 재출력
if (write) {
  const { stories: after } = await (await fetch(`${BASE}/api/stories`)).json();
  const dist = {};
  after.forEach((s) => { dist[s.durationMin] = (dist[s.durationMin] || 0) + 1; });
  console.log("\n\n════════ 전체 " + after.length + "편 분량 분포(보강 후) ════════");
  console.log(Object.entries(dist).sort((a,b)=>a[0]-b[0]).map(([m,c])=>`${m}분:${c}편`).join("  "));
}
