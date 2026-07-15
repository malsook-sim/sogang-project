import { NextRequest, NextResponse } from "next/server";

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithGemini(apiKey: string, prompt: string) {
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
                temperature: 0.9,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
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
  const { plot, childName, childAge, language, length, previousStory } =
    await req.json();
  const isEn = language === "en";
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
  const short = length === "short";
  const lenKo = short
    ? "공백 포함 1000~1500자 (최소 800자 이상, 너무 짧지 않게)"
    : "공백 포함 1800~2600자 (최소 1000자 이상, 절대 그보다 짧으면 안 됨)";
  const lenEn = short
    ? "about 800-1300 characters, comfortably filled (never too short)"
    : "about 1200-2200 characters, richly filled (never too short)";

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

  const prompt = isEn
    ? `You are a children's storybook author. Write a warm fairy tale in English that matches the conditions below.

Conditions:
- Target age: ${childAge || "4-6"} years old
${childName ? `- Name the main character "${childName}" and use the name naturally several times — UNLESS the plot below already specifies a different protagonist name, in which case keep that name` : ""}
- Use only vocabulary a ${childAge || "4-6"}-year-old can understand
- Plot idea from the parent (it may be written in Korean): ${plotStr || (prev ? "(left blank — continue naturally from the previous story)" : "")}${prev ? `\n- This is a SEQUEL to "${prev.title}". Keep the same characters, setting and tone, and continue naturally WITHOUT recapping/summarizing the previous story.\n- Previous story (for reference):\n${prev.content}` : ""}
- Length: ${lenEn}
- A clear beginning, middle, and end with 4-6 vivid scenes
- Plenty of dialogue, emotion, and gentle description
- Style: simple, warm English suitable for reading aloud to a young child
- Separate paragraphs with a blank line
- Never include violent, scary, or inappropriate content
- Weave a gentle moral in naturally
- The title must fit the story and be fresh each time
- Also provide a natural Korean translation in "contentKo" for young Korean children, with the SAME paragraph structure as "content" (same number of \\n\\n-separated paragraphs, each aligned 1:1)

- Provide the moral in two fields: morals_keywords (1-2 word Korean keywords, max 3, e.g. ["우정","용기"]) and moral_summary (a one-sentence Korean summary, within 40 characters)

Reply with ONLY this JSON, nothing else:
{
  "title": "story title",
  "content": "story body (paragraphs separated by \\n\\n)",
  "contentKo": "Korean translation, same paragraph structure as content",
  "morals_keywords": ["우정", "용기"],
  "moral_summary": "친구를 도우며 진정한 우정을 배워요",
  "ageMin": start age as a number,
  "ageMax": end age as a number
}`
    : `당신은 아이를 위한 동화 작가입니다. 아래 조건에 맞는 따뜻한 동화를 만들어주세요.

조건:
- 대상 연령: ${childAge || "4~6"}세
${childName ? `- 주인공 이름은 "${childName}"(으)로 하고 본문에 자연스럽게 여러 번 등장시킬 것. 단, 아래 줄거리에 이미 다른 주인공 이름이 명시돼 있으면 그 이름을 우선하고 "${childName}"을(를) 강제하지 말 것` : ""}
- ${childAge || "4~6"}세 아이가 이해할 수 있는 쉬운 어휘만 사용
- 부모가 제시한 줄거리: ${plotStr || (prev ? "(비워둠 — 전편에 자연스럽게 이어서 새 이야기를 상상해 주세요)" : "")}${prev ? `\n- 이 이야기는 "${prev.title}"의 후속편입니다. 전편의 등장인물·설정·말투를 그대로 유지하고, 전편 줄거리를 요약하며 시작하지 말고 자연스럽게 이어서 시작하세요.\n- 전편 전문(참고용):\n${prev.content}` : ""}
- 분량: ${lenKo}
- 줄거리가 짧게 주어져도 장면을 풍부하게 상상해서 분량을 충분히 채울 것
- 기승전결이 뚜렷하고, 장면이 4~6개로 풍부하게 이어지도록 구성
- 등장인물의 대화와 감정, 배경 묘사를 충분히 넣어 생생하게 표현
- 문체: 아이에게 읽어주는 부드러운 구어체 ("~했어요", "~했답니다")
- 문단을 빈 줄로 구분
- 폭력적이거나 무서운 장면, 선정적인 표현은 절대 넣지 말 것
- 교훈이 자연스럽게 녹아들도록 해주세요
- 교훈은 두 가지로 나눠서 출력: morals_keywords(1~2단어 키워드 배열, 최대 3개, 예: ["우정","용기"])와 moral_summary(교훈을 요약한 한 문장, 40자 이내)
- 제목(title)은 동화 내용에 꼭 어울리게, 줄거리마다 새롭게 지을 것 ("특별한 하루" 같은 뻔한 제목 금지)

아래 JSON 형식으로만 답변하세요. 다른 텍스트 없이 JSON만 출력하세요:
{
  "title": "동화 제목",
  "content": "동화 본문 (문단 사이 \\n\\n으로 구분)",
  "morals_keywords": ["우정", "용기"],
  "moral_summary": "친구를 도우며 진정한 우정을 배워요",
  "ageMin": 시작연령(숫자),
  "ageMax": 끝연령(숫자)
}`;

  // Gemini 동화 생성 (재시도 + 보조 모델)
  if (apiKey) {
    const story = await generateWithGemini(apiKey, prompt);
    if (story) {
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
