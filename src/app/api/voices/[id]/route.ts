import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // name / description 중 들어온 것만 수정
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  if (typeof body.name === "string" && body.name.trim()) {
    sets.push("name = ?");
    vals.push(body.name.trim().slice(0, 100));
  }
  if (typeof body.description === "string") {
    sets.push("description = ?");
    vals.push(body.description.trim().slice(0, 255));
  }
  if (sets.length === 0) {
    return NextResponse.json(
      { error: "변경할 내용이 없어요." },
      { status: 400 }
    );
  }

  vals.push(user.id, id);
  await db.query(
    `UPDATE voices SET ${sets.join(", ")}
     WHERE user_id = ? AND elevenlabs_voice_id = ?`,
    vals
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await params;

  // 이 사용자의 목소리인지 확인
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM voices WHERE user_id = ? AND elevenlabs_voice_id = ? LIMIT 1",
    [user.id, id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ ok: true });
  }

  // ElevenLabs 에서도 삭제해 목소리 슬롯을 비움
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (apiKey) {
    try {
      await fetch(`https://api.elevenlabs.io/v1/voices/${id}`, {
        method: "DELETE",
        headers: { "xi-api-key": apiKey },
      });
    } catch {
      // ElevenLabs 삭제 실패해도 DB 레코드는 정리
    }
  }

  await db.query(
    "DELETE FROM voices WHERE user_id = ? AND elevenlabs_voice_id = ?",
    [user.id, id]
  );

  return NextResponse.json({ ok: true });
}
