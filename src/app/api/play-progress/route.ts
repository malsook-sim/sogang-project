import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// 내 재생 이력 (이어 듣기용)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ history: [] });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT story_id, progress_sec, duration_sec,
            UNIX_TIMESTAMP(updated_at) AS updated_at
     FROM play_history
     WHERE user_id = ?
     ORDER BY updated_at DESC
     LIMIT 20`,
    [user.id]
  );

  return NextResponse.json({
    history: rows.map((r) => ({
      storyId: r.story_id,
      progressSec: Number(r.progress_sec),
      durationSec: Number(r.duration_sec),
      updatedAt: Number(r.updated_at) * 1000,
    })),
  });
}

// 재생 위치 저장 + (count 플래그 시) 재생수 증가
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { storyId, progressSec, durationSec, count } = await req.json();
  if (!storyId || typeof storyId !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // 재생수 증가 — 기본 카탈로그 동화만 (AI 생성 동화 my- 는 제외)
  if (count === true && !storyId.startsWith("my-")) {
    await db.query(
      "UPDATE stories SET play_count = play_count + 1 WHERE id = ?",
      [storyId]
    );
  }

  // 재생 진행 위치 upsert
  if (typeof progressSec === "number") {
    await db.query(
      `INSERT INTO play_history (user_id, story_id, progress_sec, duration_sec)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         progress_sec = VALUES(progress_sec),
         duration_sec = VALUES(duration_sec)`,
      [
        user.id,
        storyId,
        Math.max(0, Math.round(progressSec)),
        Math.max(0, Math.round(durationSec || 0)),
      ]
    );
  }

  return NextResponse.json({ ok: true });
}
