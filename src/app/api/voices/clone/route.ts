import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요해요." },
      { status: 401 }
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const incoming = await req.formData();
  const name = (incoming.get("name") as string | null) ?? "내 목소리";
  const emoji = (incoming.get("emoji") as string | null) ?? "🎙️";
  const description =
    (incoming.get("description") as string | null) ??
    "마이보이스키즈에서 녹음한 보호자 목소리";
  const files = incoming
    .getAll("files")
    .filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "녹음 파일이 필요합니다." },
      { status: 400 }
    );
  }

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  console.log(
    `[voices/clone] files=${files.length} totalBytes=${totalBytes} ` +
      `types=${files.map((f) => f.type).join(",")}`
  );
  if (totalBytes < 50_000) {
    return NextResponse.json(
      { error: "녹음 길이가 너무 짧아요. 30초 이상 녹음해주세요." },
      { status: 400 }
    );
  }

  const outgoing = new FormData();
  outgoing.append("name", name);
  outgoing.append("description", description);
  for (const file of files) {
    outgoing.append("files", file, file.name || "sample.webm");
  }

  const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: outgoing,
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(
      "[voices/clone] ElevenLabs add 실패:",
      res.status,
      detail
    );
    let msg = "목소리를 만들지 못했어요. 잠시 후 다시 시도해주세요.";
    const lowered = detail.toLowerCase();
    if (lowered.includes("voice_limit") || lowered.includes("voice limit")) {
      msg =
        "보관할 수 있는 목소리 개수가 가득 찼어요. 기존 목소리를 지우고 다시 해주세요.";
    } else if (
      lowered.includes("instant_voice_cloning") ||
      lowered.includes("can_not_use")
    ) {
      msg = "현재 계정에서는 목소리 복제를 사용할 수 없어요.";
    } else if (res.status === 401) {
      msg = "음성 서비스 인증에 실패했어요. 잠시 후 다시 시도해주세요.";
    }
    return NextResponse.json({ error: msg }, { status: res.status });
  }

  const data = (await res.json()) as { voice_id: string };

  await db.query<ResultSetHeader>(
    "INSERT INTO voices (user_id, elevenlabs_voice_id, name, emoji) VALUES (?, ?, ?, ?)",
    [user.id, data.voice_id, name, emoji]
  );

  return NextResponse.json({ voiceId: data.voice_id, name });
}
