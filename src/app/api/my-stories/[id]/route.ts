import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { id } = await params;
  const dbId = Number(id.replace(/^my-/, ""));
  if (!dbId) {
    return NextResponse.json({ error: "잘못된 동화 id 예요." }, { status: 400 });
  }

  await db.query("DELETE FROM user_stories WHERE user_id = ? AND id = ?", [
    user.id,
    dbId,
  ]);

  return NextResponse.json({ ok: true });
}
