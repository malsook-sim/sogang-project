import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ storyIds: [] });

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT story_id FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC",
    [user.id]
  );

  return NextResponse.json({ storyIds: rows.map((r) => r.story_id) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { storyId } = await req.json();
  if (!storyId || typeof storyId !== "string") {
    return NextResponse.json({ error: "storyId가 필요해요." }, { status: 400 });
  }

  const [existing] = await db.query<RowDataPacket[]>(
    "SELECT 1 FROM bookmarks WHERE user_id = ? AND story_id = ? LIMIT 1",
    [user.id, storyId]
  );

  if (existing.length > 0) {
    await db.query(
      "DELETE FROM bookmarks WHERE user_id = ? AND story_id = ?",
      [user.id, storyId]
    );
    return NextResponse.json({ bookmarked: false });
  }

  await db.query(
    "INSERT INTO bookmarks (user_id, story_id) VALUES (?, ?)",
    [user.id, storyId]
  );
  return NextResponse.json({ bookmarked: true });
}
