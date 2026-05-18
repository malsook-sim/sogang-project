import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const incoming = await req.formData();
  const name = (incoming.get("name") as string | null) ?? "내 목소리";
  const description =
    (incoming.get("description") as string | null) ??
    "마이보이스스토리에서 녹음한 보호자 목소리";
  const files = incoming.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "녹음 파일이 필요합니다." },
      { status: 400 }
    );
  }

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
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
    return NextResponse.json(
      { error: "Voice Cloning 실패", status: res.status, detail },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { voice_id: string };
  return NextResponse.json({ voiceId: data.voice_id, name });
}
