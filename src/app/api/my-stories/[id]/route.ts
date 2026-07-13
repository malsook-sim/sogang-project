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
  const dbId = Number(id.replace(/^my-/, ""));
  if (!dbId) {
    return NextResponse.json({ error: "잘못된 동화 id 예요." }, { status: 400 });
  }

  const { title, content } = await req.json();
  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
  }

  if (typeof content === "string" && content.trim()) {
    await db.query(
      "UPDATE user_stories SET title = ?, content = ? WHERE user_id = ? AND id = ?",
      [String(title).trim().slice(0, 200), String(content).trim(), user.id, dbId]
    );
    // 내용이 바뀌면 만들어둔 오디오 캐시를 비워 다음 재생 때 재합성되게
    await db.query("DELETE FROM audio_cache WHERE story_id = ?", [id]);
  } else {
    await db.query(
      "UPDATE user_stories SET title = ? WHERE user_id = ? AND id = ?",
      [String(title).trim().slice(0, 200), user.id, dbId]
    );
  }

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
  const dbId = Number(id.replace(/^my-/, ""));
  if (!dbId) {
    return NextResponse.json({ error: "잘못된 동화 id 예요." }, { status: 400 });
  }

  await db.query("DELETE FROM user_stories WHERE user_id = ? AND id = ?", [
    user.id,
    dbId,
  ]);

  // 이 동화에 매달린 파생 데이터 정리 (story_id 는 다형성이라 FK cascade 가 없음)
  // 모두 user_id + story_id 로만 특정해 지우는 타깃 삭제
  await Promise.all([
    db.query("DELETE FROM bookmarks WHERE user_id = ? AND story_id = ?", [
      user.id,
      id,
    ]),
    db.query("DELETE FROM play_history WHERE user_id = ? AND story_id = ?", [
      user.id,
      id,
    ]),
    db.query("DELETE FROM audio_cache WHERE user_id = ? AND story_id = ?", [
      user.id,
      id,
    ]),
  ]);

  return NextResponse.json({ ok: true });
}
