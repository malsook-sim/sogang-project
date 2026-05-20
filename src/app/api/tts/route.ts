import { NextRequest, NextResponse } from "next/server";
import { defaultVoices, englishVoices } from "@/data/voices";

// 기본 제공 보이스 ID — 이 목록에 없으면 사용자가 복제한 목소리로 간주
const PREMADE_VOICE_IDS = new Set(
  [...defaultVoices, ...englishVoices].map((v) => v.id)
);

// 같은 동화·목소리 조합은 한 번만 생성하고 메모리에 캐시 — 다시 들을 땐 즉시 응답
const CACHE = new Map<string, ArrayBuffer>();
const CACHE_LIMIT = 40;

function cacheKey(voiceId: string, text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  return `${voiceId}:${text.length}:${hash >>> 0}`;
}

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

  // ElevenLabs 단일 요청 한도 내에서 자름 (긴 동화도 끝까지 재생)
  const trimmed = String(text).slice(0, 5000);
  const key = cacheKey(voiceId, trimmed);

  const cached = CACHE.get(key);
  if (cached) {
    return new NextResponse(cached, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(cached.byteLength),
        "X-Cache": "HIT",
      },
    });
  }

  // 복제한 내 목소리는 음색 재현이 좋은 multilingual_v2로,
  // 기본 보이스는 빠른 turbo로 렌더링
  const isCloned = !PREMADE_VOICE_IDS.has(voiceId);

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
        model_id: isCloned ? "eleven_multilingual_v2" : "eleven_turbo_v2_5",
        voice_settings: isCloned
          ? {
              // 복제 목소리: 원래 목소리에 최대한 가깝게
              stability: 0.5,
              similarity_boost: 0.9,
              style: 0,
              use_speaker_boost: true,
            }
          : {
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

  // 오래된 항목부터 비우고 캐시에 저장
  if (CACHE.size >= CACHE_LIMIT) {
    const oldest = CACHE.keys().next().value;
    if (oldest) CACHE.delete(oldest);
  }
  CACHE.set(key, audioBuffer);

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audioBuffer.byteLength),
      "X-Cache": "MISS",
    },
  });
}
