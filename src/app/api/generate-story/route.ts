import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { plot, childName, childAge } = await req.json();

  if (!plot || plot.trim().length < 5) {
    return NextResponse.json(
      { error: "줄거리를 5자 이상 입력해주세요." },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `당신은 아이를 위한 동화 작가입니다. 아래 조건에 맞는 따뜻한 동화를 만들어주세요.

조건:
- 대상 연령: ${childAge || "4~6"}세
${childName ? `- 주인공 이름: ${childName}` : ""}
- 부모가 제시한 줄거리: ${plot}
- 분량: 800~1200자
- 문체: 아이에게 읽어주는 부드러운 구어체 ("~했어요", "~했답니다")
- 문단을 빈 줄로 구분해주세요
- 교훈이 자연스럽게 녹아들도록 해주세요

아래 JSON 형식으로만 답변하세요. 다른 텍스트 없이 JSON만 출력하세요:
{
  "title": "동화 제목",
  "content": "동화 본문 (문단 사이 \\n\\n으로 구분)",
  "morals": ["교훈1", "교훈2"],
  "ageMin": 시작연령(숫자),
  "ageMax": 끝연령(숫자)
}`;

  // Gemini API 호출 시도
  if (apiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // JSON 파싱 (```json ... ``` 감싸기 제거)
        const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const story = JSON.parse(jsonStr);
        return NextResponse.json({ story, source: "gemini" });
      }
    } catch {
      // Gemini 실패 시 fallback
    }
  }

  // Fallback: 더미 동화 생성
  const childNameStr = childName || "작은 아이";
  const story = {
    title: `${childNameStr}의 특별한 하루`,
    content: `옛날 옛날에, ${childNameStr}라는 아이가 살았어요.

${plot}

${childNameStr}는 용기를 내어 한 발짝 앞으로 나아갔어요. 처음에는 무서웠지만, 마음속에서 따뜻한 빛이 반짝였어요.

"할 수 있어!" ${childNameStr}는 스스로에게 말했어요.

그리고 정말로, ${childNameStr}는 해냈어요! 주변의 모든 친구들이 환호하며 박수를 쳐주었답니다.

그날 밤, ${childNameStr}는 이불 속에서 미소를 지으며 생각했어요. "오늘 정말 멋진 하루였어."

엄마가 다가와 이마에 뽀뽀를 해주며 말했어요. "우리 ${childNameStr}, 정말 대단했어. 사랑해."

${childNameStr}는 행복한 꿈나라로 떠났답니다.`,
    morals: ["용기", "자신감"],
    ageMin: Number(childAge) || 4,
    ageMax: (Number(childAge) || 4) + 2,
  };

  return NextResponse.json({ story, source: "fallback" });
}
