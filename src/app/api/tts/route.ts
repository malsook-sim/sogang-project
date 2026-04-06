import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text, voiceId } = await req.json();

  if (!text || !voiceId) {
    return NextResponse.json(
      { error: "text와 voiceId가 필요합니다." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // 텍스트가 너무 길면 앞부분만 (비용 절약)
  const trimmed = text.slice(0, 2000);

  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: trimmed,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!ttsRes.ok) {
    const err = await ttsRes.text();
    return NextResponse.json(
      { error: "TTS 생성 실패", detail: err },
      { status: ttsRes.status }
    );
  }

  const audioBuffer = await ttsRes.arrayBuffer();

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audioBuffer.byteLength),
    },
  });
}
