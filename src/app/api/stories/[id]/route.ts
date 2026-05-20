import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rowToCatalogStory, rowToMyStory } from "@/lib/storyRow";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // AI 로 생성한 동화 (로그인한 본인 것만)
  if (id.startsWith("my-")) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ story: null });

    const dbId = Number(id.replace(/^my-/, ""));
    if (!dbId) return NextResponse.json({ story: null });

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, title, content, content_ko, morals, age_min, age_max,
              duration_min, UNIX_TIMESTAMP(created_at) AS created_at
       FROM user_stories WHERE id = ? AND user_id = ? LIMIT 1`,
      [dbId, user.id]
    );
    return NextResponse.json({
      story: rows[0] ? rowToMyStory(rows[0]) : null,
    });
  }

  // 기본 카탈로그 동화
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, title, content, content_ko, age_min, age_max, morals,
            is_premium, category, duration_min
     FROM stories WHERE id = ? LIMIT 1`,
    [id]
  );
  return NextResponse.json({
    story: rows[0] ? rowToCatalogStory(rows[0]) : null,
  });
}
