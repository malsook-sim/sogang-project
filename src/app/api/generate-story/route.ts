import { NextRequest, NextResponse } from "next/server";
import {
  LENGTH_TARGET_CHARS,
  minutesForKoChars,
  EN_WORDS_PER_MIN,
} from "@/lib/duration";

// 아이용 동화로 부적절한 키워드 (선정적 / 고어 / 약물 / 욕설)
const BANNED_KEYWORDS = [
  // 선정적
  "섹스",
  "성관계",
  "성행위",
  "야동",
  "포르노",
  "음란",
  "자위",
  "성폭행",
  "강간",
  "변태",
  "19금",
  "에로",
  "음경",
  "음부",
  "sex",
  "porn",
  "nude",
  "rape",
  "erotic",
  // 폭력 · 고어
  "시체",
  "사체",
  "토막",
  "고문",
  "참수",
  "학살",
  "살인마",
  "연쇄살인",
  "사지절단",
  "내장",
  "피범벅",
  "유혈",
  "엽기",
  "자살",
  "목매",
  "투신",
  "gore",
  "torture",
  "murder",
  // 약물
  "마약",
  "필로폰",
  "히로뽕",
  "코카인",
  // 욕설
  "씨발",
  "시발",
  "개새끼",
  "병신",
  "지랄",
];

function findBannedKeyword(text: string): string | null {
  const lowered = text.toLowerCase();
  return BANNED_KEYWORDS.find((word) => lowered.includes(word)) ?? null;
}

// 혼잡한 모델은 2.5-flash → 2.5-flash-lite 로 넘기고, 각 모델은 한 번 더 재시도
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

// 출력 JSON 구조 강제 (responseSchema) — 프롬프트의 "JSON만 출력" 문구와 이중 안전장치
const STORY_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    content: { type: "STRING" },
    contentKo: { type: "STRING" },
    morals_keywords: { type: "ARRAY", items: { type: "STRING" } },
    moral_summary: { type: "STRING" },
    ageMin: { type: "INTEGER" },
    ageMax: { type: "INTEGER" },
  },
  required: [
    "title",
    "content",
    "morals_keywords",
    "moral_summary",
    "ageMin",
    "ageMax",
  ],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithGemini(
  apiKey: string,
  prompt: string,
  temperature = 0.9
) {
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                responseSchema: STORY_SCHEMA,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const jsonStr = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();
          if (jsonStr) {
            const story = JSON.parse(jsonStr);
            if (story?.title && story?.content) {
              const kw = Array.isArray(story.morals_keywords)
                ? story.morals_keywords
                : Array.isArray(story.morals)
                ? story.morals
                : [];
              return {
                ...story,
                morals: kw
                  .filter((m: unknown) => typeof m === "string" && m.trim())
                  .slice(0, 3),
                moralSummary:
                  typeof story.moral_summary === "string"
                    ? story.moral_summary
                    : typeof story.moralSummary === "string"
                    ? story.moralSummary
                    : undefined,
              };
            }
          }
        } else if (res.status >= 500 || res.status === 429) {
          // 일시적 혼잡 — 잠깐 쉬고 재시도
          await sleep(900);
          continue;
        } else {
          // 그 외 오류는 이 모델 포기하고 다음 모델로
          break;
        }
      } catch {
        // 네트워크 오류 / JSON 파싱 실패 — 재시도
        await sleep(900);
      }
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { plot, childName, childAge, language, length, previousStory, mood } =
    await req.json();
  const isEn = language === "en";
  const isBedtime = mood === "bedtime"; // 기본(미지정)=낮 이야기
  const age = Number(childAge) || 5;
  // 후속편 모드: 원작 { title, content }가 있으면 줄거리 비어도 허용
  const prev =
    previousStory &&
    typeof previousStory.content === "string" &&
    previousStory.content.trim()
      ? {
          title: String(previousStory.title || "이전 이야기"),
          content: String(previousStory.content).slice(0, 4000),
        }
      : null;
  const plotStr = typeof plot === "string" ? plot.trim() : "";
  // 분량 목표·낭독 시간은 duration.ts의 실측 계수(한국어 440자/분, 영어 120단어/분)와 공유.
  // UI "약 N분" 라벨과 동일한 값이 나오도록 같은 소스에서 계산.
  const short = length === "short";
  const lenTarget = LENGTH_TARGET_CHARS[short ? "short" : "normal"];
  const koMin = minutesForKoChars((lenTarget.min + lenTarget.max) / 2);
  const lenKo = `공백 포함 ${lenTarget.min}~${lenTarget.max}자 (약 ${koMin}분 낭독 분량, 이보다 짧으면 안 됨)`;
  // 영어는 단어수 기준 — 한국어와 같은 낭독 시간(분)에 맞춰 단어수 목표 산출
  const enWords = koMin * EN_WORDS_PER_MIN;
  const lenEn = `about ${enWords - 40}-${enWords + 40} words (about a ${koMin}-minute read aloud)`;

  // 후속편 모드가 아니면 줄거리 최소 길이 필요
  if (!prev && plotStr.length < 5) {
    return NextResponse.json(
      { error: "줄거리를 5자 이상 입력해주세요." },
      { status: 400 }
    );
  }

  if (findBannedKeyword(`${plotStr} ${childName ?? ""}`)) {
    return NextResponse.json(
      {
        blocked: true,
        error:
          "아이들이 듣기 좋은 이야기가 아니에요. 폭력적이거나 선정적인 내용은 동화로 만들 수 없어요. 따뜻하고 안전한 줄거리로 다시 적어주세요.",
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // 분위기(mood): 결말 톤 분기
  const moodKo = isBedtime
    ? "이 동화는 아이가 잠들기 전에 듣는 이야기입니다. 절정 이후 마지막 한두 장면은 점점 차분하고 포근하게 가라앉히고, 주인공이 편안해지거나 하루를 마무리하는 장면으로 끝내세요. 결말에 신나거나 긴장되는 사건을 넣지 마세요."
    : "이 동화는 아이가 깨어 있을 때 듣는 이야기입니다. 밝고 활기찬 톤으로 쓰고, 결말에서 주인공이 무언가를 해내거나 새로운 것을 발견하는 장면으로 끝내도 좋습니다. 다만 지나치게 자극적이거나 무서운 전개는 넣지 마세요.";
  // 연령별 문장 가이드
  const ageGuideKo =
    age <= 4
      ? "3~4세 대상이므로 한 문장은 15자 내외의 단문 위주로 쓰세요."
      : age <= 6
      ? "5~6세 대상이므로 한 문장은 25자 내외로 쓰세요."
      : "7세 이상 대상이므로 복문을 써도 되지만 한 문장은 35자 이내로 쓰세요.";
  // 소리내어 읽기(TTS) 규칙
  const ttsKo = `소리내어 읽기 규칙 (성우가 소리 내어 읽어줍니다):
- 괄호·이모지·특수문자·영어 단어를 쓰지 마세요. 숫자는 한글로 풀어 쓰세요 (예: 세 개, 열 밤).
- 의성어·의태어는 동화 전체에서 4~6개만 사용하세요. 모든 문단에 하나씩 균등하게 넣지 말고, 인상적인 장면에만 집중해서 쓰세요. 절반 이상의 문단에는 의성어·의태어가 아예 없어야 자연스럽습니다.
- 한 문장은 소리 내어 읽었을 때 한 호흡에 끝나는 길이로 쓰세요.`;

  const moodEn = isBedtime
    ? "This story is heard right before the child falls asleep. After the climax, let the last one or two scenes grow calm and cozy, ending with the main character feeling at ease or winding down the day. Do not put any exciting or tense events in the ending."
    : "This story is heard while the child is awake. Use a bright, lively tone; the ending may show the character accomplishing something or discovering something new. Avoid overly intense or scary developments.";
  const ttsEn = `Read-aloud rules (a voice actor reads it out loud):
- No parentheses, emojis, or special characters; write numbers as words.
- Use onomatopoeia or mimetic words only 4-6 times in the WHOLE story. Do not put one in every paragraph; concentrate them in the few most striking moments. More than half of the paragraphs should have none at all.
- Keep each sentence short enough to read aloud in a single breath.
- The Korean "contentKo" translation must follow the same rules: no special characters or emojis, and write numbers as Korean words.`;

  const prompt = isEn
    ? `You are a children's storybook author. Write a warm fairy tale in English that matches the conditions below.

${moodEn}

Conditions:
- Target age: ${childAge || "4-6"} years old
${childName ? `- Name the main character "${childName}" and use the name naturally several times — UNLESS the plot below already specifies a different protagonist name, in which case keep that name` : ""}
- Use only vocabulary a ${childAge || "4-6"}-year-old can understand
- Plot idea from the parent (it may be written in Korean): ${plotStr || (prev ? "(left blank — continue naturally from the previous story)" : "")}${prev ? `\n- This is a SEQUEL to "${prev.title}". Keep the same characters, setting and tone, and continue naturally WITHOUT recapping/summarizing the previous story.\n- Previous story (for reference):\n${prev.content}` : ""}
- Length: ${lenEn}
- The heart of the story is the character's emotions, not the plot. Show them feeling joy, curiosity, mistakes, surprise, and courage.
- Don't narrate by explaining — let characters act and talk so the reader can vividly picture each scene.
- Natural dialogue should make up roughly 20-30% of the text.
- Do not use any word or its variants more than three times in the whole story (e.g. "sparkle", "sparkling", "sparkled" all count as one word). Watch especially for repeated words like "sparkle", "pretty", or "carefully"; use different vocabulary for the same idea.
- Limit exclamations like "Wow!", "Yay!", "So pretty!" to at most two in the whole story. Have characters think, ask, or suggest something in dialogue rather than just exclaiming.
- Do NOT use AI-sounding cliché transitions such as "Just then,", "And that was when...", "A little while later,", "One day,...", or "...was what happened." When a scene changes, use a natural connector or move straight into the next scene with no transition phrase.
- Not every scene should go smoothly. Include at least two small, unexpected situations the child can solve alone (e.g. what they were looking for is suddenly out of sight / it slips from their hand / it is colder than expected / something else looks more tempting and they hesitate / a friend grabs it first). These must be everyday-sized hiccups, never big, scary, or dangerous events.
- If a parent or family member appears in the plot, do not leave them as a bystander. Have them do something meaningful at least once — suggest an idea, try together, or encourage after a failure — but they must NOT solve the problem for the child; they only help the child do it themselves. Since a parent reads this story aloud in their own voice, the parent character must have actual lines of dialogue to read.
- Keep sentences short and easy to read; avoid long run-on sentences.
- Follow this four-part structure and keep each part's share of the length:
  1) Setup (~20%) — the main character and today's goal. Compress preparation like waking up or traveling into at most one paragraph.
  2) Attempts and small failures (~30%) — they try but it does not go as planned. At least twice.
  3) Turn (~30%) — they change their approach, find courage, or get help, then try again.
  4) Resolution (~20%) — they reach the goal and express their feelings to close. The setup must never exceed half of the whole story.
- Style: simple, warm English suitable for reading aloud to a young child
- Separate paragraphs with a blank line
- Never include violent, scary, or inappropriate content
- Let any feeling or message come through naturally in the story — never state a moral outright, and avoid explanatory endings like "...decided to always be kind." In the final paragraph, do NOT sum up a lesson ("and so they learned that ..."); show it only through the character's actions and their outcome.
- End with atmosphere or a character's action that lingers. Do NOT use clichéd repetitive endings like "learned a lesson", "realized", or "fell happily asleep".
- Do NOT use common fairy-tale tropes (getting lost in a forest, rainbows, fireflies, a rabbit friend, the moon/stars, ending in a dream) unless they appear in the plot.
- Write a completely fresh story each time; do not reuse familiar settings, plots, endings, or phrasings.
- Title: concrete, including the character and the key event (good: "Jaein and the Missing Blue Ball", "A Kite That Looked Like the Sky"; bad: "A Special Day", "A Happy Adventure")
- Also provide a natural Korean translation in "contentKo" for young Korean children, with the SAME paragraph structure as "content" (same number of \\n\\n-separated paragraphs, each aligned 1:1)

- morals_keywords (1-2 word Korean keywords, max 3, e.g. ["우정","용기"]) and moral_summary (a one-sentence Korean summary, within 40 characters) should be derived naturally from the story, not forced.

${ttsEn}

Reply with ONLY this JSON, nothing else:
{
  "title": "story title",
  "content": "story body (paragraphs separated by \\n\\n)",
  "contentKo": "Korean translation, same paragraph structure as content",
  "morals_keywords": ["우정", "용기"],
  "moral_summary": "작은 용기가 서툰 하루를 바꿔놓아요",
  "ageMin": start age as a number,
  "ageMax": end age as a number
}`
    : `당신은 아이를 위한 동화 작가입니다. 아래 조건에 맞는 따뜻한 동화를 만들어주세요.

${moodKo}

조건:
- 대상 연령: ${childAge || "4~6"}세
${childName ? `- 주인공 이름은 "${childName}"(으)로 하고 본문에 자연스럽게 여러 번 등장시킬 것. 단, 아래 줄거리에 이미 다른 주인공 이름이 명시돼 있으면 그 이름을 우선하고 "${childName}"을(를) 강제하지 말 것` : ""}
- ${childAge || "4~6"}세 아이가 이해할 수 있는 쉬운 어휘만 사용
- 부모가 제시한 줄거리: ${plotStr || (prev ? "(비워둠 — 전편에 자연스럽게 이어서 새 이야기를 상상해 주세요)" : "")}${prev ? `\n- 이 이야기는 "${prev.title}"의 후속편입니다. 전편의 등장인물·설정·말투를 그대로 유지하고, 전편 줄거리를 요약하며 시작하지 말고 자연스럽게 이어서 시작하세요.\n- 전편 전문(참고용):\n${prev.content}` : ""}
- 분량: ${lenKo}
- 줄거리가 짧아도 장면을 스스로 상상해 분량을 충분히 채우되, 억지로 늘리지 말 것
- 동화의 중심은 사건보다 등장인물의 감정입니다. 아이가 기뻐하고, 궁금해하고, 실수하고, 놀라고, 용기 내는 감정의 변화를 충분히 표현하세요
- 상황을 설명으로 서술하지 말고, 등장인물이 직접 행동하고 대화를 주고받으며 눈앞에 장면이 그려질 만큼 생생하게 쓰세요
- 등장인물 간 자연스러운 대화가 본문의 약 20~30%를 차지하도록 하세요
- 같은 단어나 그 변형을 동화 전체에서 세 번을 넘겨 쓰지 마세요 ('반짝반짝', '반짝이는', '반짝였죠'는 모두 같은 단어로 셉니다). 특히 '반짝', '예쁘다', '조심조심' 같은 표현의 반복에 주의하고, 같은 뜻이라도 다른 어휘로 바꿔 쓰세요
- '우와!', '야호!', '예뻐!' 같은 감탄사는 동화 전체에서 두 개 이하로 제한하세요. 대사는 감탄이 아니라 인물이 생각하거나, 묻거나, 무언가를 제안하는 내용으로 쓰세요
- 다음 표현은 사용하지 마세요 (AI가 쓴 티가 나는 상투구입니다): '그때였어요', '바로 그때였어요', '잠시 후였어요', '그러던 어느 날이었어요', '~하는 것이었어요'. 장면 전환이 필요하면 '그런데', '문득', '한참을 ~하다가' 같은 자연스러운 연결로 쓰거나, 연결어 없이 바로 다음 장면으로 넘어가세요
- 모든 장면이 순조롭게 흘러가면 안 됩니다. 아이가 스스로 해결할 수 있는 작고 예상치 못한 상황을 두 개 이상 넣으세요 (예: 찾던 것이 갑자기 안 보인다 / 손에서 놓친다 / 생각보다 차갑다 / 다른 것이 더 좋아 보여 고민한다 / 친구가 먼저 가져간다). 큰 사건이 아니라 아이 일상 크기의 사소한 변수여야 하며, 무섭거나 위험한 상황은 넣지 마세요
- 줄거리에 부모나 가족이 등장하면 관망자로 두지 마세요. 최소 한 번은 의미 있는 행동을 하게 하세요 — 방법을 제안하거나, 함께 시도하거나, 실패했을 때 격려하거나. 단, 문제를 대신 해결해 주면 안 되고 주인공이 스스로 해내도록 거드는 역할이어야 합니다. 이 동화는 부모가 자기 목소리로 읽어주므로 부모 캐릭터에게 실제로 읽을 대사가 있어야 합니다
- ${ageGuideKo}
- 아래 네 단계 구조를 지키고 각 단계의 분량 비중을 준수하세요:
  1) 도입 (약 20%) — 주인공과 오늘의 목표를 보여주세요. 아침에 일어나기, 이동하기 같은 준비 과정은 최대 한 문단으로 압축하세요
  2) 시도와 작은 실패 (약 30%) — 시도하지만 뜻대로 되지 않습니다. 최소 두 번
  3) 전환 (약 30%) — 방법을 바꾸거나, 용기를 내거나, 도움을 받아 다시 시도합니다
  4) 해결 (약 20%) — 목표를 이루고 감정을 표현하며 마무리합니다. 도입이 전체의 절반을 넘으면 안 됩니다
- 문체: 아이에게 읽어주는 부드러운 구어체 ("~했어요", "~했답니다")
- 문단은 빈 줄로 구분하세요
- 폭력적이거나 무서운 장면, 선정적인 표현은 절대 넣지 마세요
- 동화의 핵심 감정이나 메시지는 이야기 속에서 자연스럽게 느껴지게 하고, 노골적으로 교훈을 설명하지 마세요. "~해야겠다고 생각했어요" 같은 설명형 문장은 피하세요. 마지막 문단에서 교훈을 말로 정리하지 마세요 ("그래서 ~라는 것을 배웠답니다" 금지). 교훈은 인물의 행동과 결과로만 보여주세요
- 마지막은 교훈을 직접 말하지 말고, 등장인물의 행동이나 분위기로 여운 있게 마무리하세요. "배웠어요", "깨달았어요", "행복하게 잠이 들었어요" 같은 상투적이고 반복적인 결말을 쓰지 마세요
- 흔한 동화 소재(숲에서 길 잃기, 무지개, 반딧불이, 토끼 친구, 별님, 꿈에서 끝나기 등)는 줄거리에 없는 한 임의로 쓰지 마세요
- 매번 완전히 새로운 동화를 쓴다고 생각하고, 자주 쓰이는 소재·배경·전개·결말·표현을 반복하지 마세요
- 제목은 등장인물과 핵심 사건을 담아 구체적으로 지으세요 (좋은 예: "재인이와 사라진 파란 공", "하늘을 닮은 연", "노란 우산을 찾은 오후" / 나쁜 예: "특별한 하루", "행복한 모험", "소중한 친구")
- morals_keywords(1~2단어 키워드, 최대 3개)와 moral_summary(한 문장)는 억지로 만들지 말고, 이야기에서 자연스럽게 느껴지는 감정·메시지로 작성하세요

${ttsKo}

아래 JSON 형식으로만 답변하세요. 다른 텍스트 없이 JSON만 출력하세요:
{
  "title": "동화 제목",
  "content": "동화 본문 (문단 사이 \\n\\n으로 구분)",
  "morals_keywords": ["우정", "용기"],
  "moral_summary": "작은 용기가 서툰 하루를 바꿔놓아요",
  "ageMin": 시작연령(숫자),
  "ageMax": 끝연령(숫자)
}`;

  // Gemini 동화 생성 — 출력이 깨끗할 때만 채택.
  // 생성 실패/JSON 파싱 실패/출력 금지어면 온도를 낮춰 1회 재시도, 그래도 안 되면 폴백.
  if (apiKey) {
    const isClean = (s: { title?: string; content?: string } | null) =>
      !!s && !findBannedKeyword(`${s.title ?? ""} ${s.content ?? ""}`);
    let story = await generateWithGemini(apiKey, prompt, 0.9);
    if (!isClean(story)) story = await generateWithGemini(apiKey, prompt, 0.7);
    if (isClean(story)) {
      return NextResponse.json({ story, source: "gemini" });
    }
  }

  // Fallback: Gemini 가 계속 실패할 때의 임시 동화
  if (isEn) {
    const nameStr = childName || "the little one";
    const enTitles = [
      `${nameStr}'s Sparkling Adventure`,
      `${nameStr} Finds Some Courage`,
      `${nameStr} and the Kind Friends`,
      `${nameStr}'s Little Miracle`,
      `${nameStr}'s Wonderful Day`,
    ];
    const enStory = {
      title: enTitles[Math.floor(Math.random() * enTitles.length)],
      content: `Once upon a time, in a small and cozy village, there lived a child named ${nameStr}. ${nameStr} was full of curiosity and had a very warm heart.

One bright morning, soft sunlight peeked through the window and tickled ${nameStr}'s cheek. ${nameStr} stretched with a big smile, wondering what the day would bring.

${plot}

When ${nameStr} heard about it, a little heart went thump-thump. "Can I really do this?" ${nameStr} felt a bit worried, but slowly nodded.

Along the way, small troubles appeared one by one. But each time, ${nameStr} took a deep breath and stepped forward, one little step at a time. "If I don't give up, I will surely find a way."

On the path, ${nameStr} met kind and friendly faces. They held ${nameStr}'s hand, laughed together, and cheered each other on. Knowing you are not alone felt very warm.

As the sun began to set, ${nameStr} finally did it! A big, bright courage filled that little heart. The friends clapped their hands with joy.

Back home, ${nameStr} snuggled into a soft, warm blanket. Thinking back on the day, ${nameStr}'s heart felt cozy and happy. "It was scary, but I am so glad I tried until the end."

A gentle voice whispered, "My dear ${nameStr}, you were wonderful today. I love you."

${nameStr} smiled a happy smile and drifted off to dreamland. What other sparkling day might be waiting tomorrow?`,
      morals: ["courage", "patience"],
      moralSummary: "끝까지 용기를 내면 소중한 것을 배울 수 있어요",
      ageMin: Number(childAge) || 4,
      ageMax: (Number(childAge) || 4) + 2,
    };
    return NextResponse.json({ story: enStory, source: "fallback" });
  }

  const childNameStr = childName || "아이";
  const fallbackTitles = [
    `${childNameStr}의 반짝이는 모험`,
    `${childNameStr}, 용기를 내요`,
    `${childNameStr}와 따뜻한 친구들`,
    `${childNameStr}의 작은 기적`,
    `${childNameStr}가 만난 신기한 하루`,
  ];
  const story = {
    title:
      fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)],
    content: `옛날 옛날, 작고 아늑한 마을에 ${childNameStr}라는 아이가 살았어요. ${childNameStr}는 호기심이 반짝반짝, 마음이 따뜻한 아이였답니다.

어느 맑은 아침, 창문으로 들어온 햇살이 ${childNameStr}의 볼을 살며시 간지럽혔어요. ${childNameStr}는 기지개를 쭉 켜며 오늘은 어떤 일이 일어날까 두근거렸지요.

${plot}

그 이야기를 들은 ${childNameStr}는 가슴이 콩닥콩닥 뛰었어요. "내가 잘할 수 있을까?" 조금 걱정도 됐지만, ${childNameStr}는 천천히 고개를 끄덕였어요.

길을 나선 ${childNameStr} 앞에 작은 어려움들이 하나씩 찾아왔어요. 하지만 ${childNameStr}는 그때마다 깊게 숨을 들이쉬고 한 걸음씩 앞으로 나아갔답니다. "포기하지 않으면 분명 길이 보일 거야."

가는 길에 ${childNameStr}는 다정한 친구들을 만났어요. 친구들은 ${childNameStr}의 손을 꼭 잡아주고, 함께 웃고, 서로를 응원해 주었어요. 혼자가 아니라는 건 정말 든든한 일이었지요.

해가 뉘엿뉘엿 기울 무렵, 마침내 ${childNameStr}는 해냈어요! 작은 가슴속에 큰 용기가 가득 차올랐어요. 함께한 친구들도 손뼉을 치며 기뻐했답니다.

집으로 돌아온 ${childNameStr}는 포근한 이불 속으로 쏙 들어갔어요. 오늘 있었던 일들을 하나하나 떠올리니 마음이 사르르 따뜻해졌어요. "무서웠지만 끝까지 해봐서 정말 다행이야."

엄마가 다가와 이마에 살며시 입을 맞추며 속삭였어요. "우리 ${childNameStr}, 오늘 정말 대단했어. 사랑해."

${childNameStr}는 행복한 미소를 지으며 스르르 꿈나라로 떠났답니다. 내일은 또 어떤 반짝이는 하루가 기다리고 있을까요?`,
    morals: ["용기", "끈기"],
    moralSummary: "끝까지 포기하지 않으면 작은 기적이 찾아와요",
    ageMin: Number(childAge) || 4,
    ageMax: (Number(childAge) || 4) + 2,
  };

  return NextResponse.json({ story, source: "fallback" });
}
