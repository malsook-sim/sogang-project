import { NextRequest, NextResponse } from "next/server";
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
  const { name } = await req.json();
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
  }

  await db.query(
    "UPDATE voices SET name = ? WHERE user_id = ? AND elevenlabs_voice_id = ?",
    [String(name).trim().slice(0, 100), user.id, id]
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
  await db.query(
    "DELETE FROM voices WHERE user_id = ? AND elevenlabs_voice_id = ?",
    [user.id, id]
  );

  return NextResponse.json({ ok: true });
}
