import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rowToMyStory } from "@/lib/storyRow";
import { estimateDuration } from "@/lib/duration";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ stories: [] });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, title, content, content_ko, morals, moral_summary, age_min, age_max,
            duration_min, UNIX_TIMESTAMP(created_at) AS created_at
     FROM user_stories WHERE user_id = ? ORDER BY created_at DESC`,
    [user.id]
  );

  return NextResponse.json({ stories: rows.map(rowToMyStory) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { title, content, contentKo, morals, moralSummary, ageMin, ageMax } =
    await req.json();
  if (!title || !content) {
    return NextResponse.json(
      { error: "동화 제목과 내용이 필요해요." },
      { status: 400 }
    );
  }

  const min = Number(ageMin) || 4;
  const max = Number(ageMax) || 7;
  const durationMin = estimateDuration(String(content));
  const summary =
    typeof moralSummary === "string" && moralSummary.trim()
      ? moralSummary.trim().slice(0, 200)
      : null;

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO user_stories
       (user_id, title, content, content_ko, morals, moral_summary, age_min, age_max,
        duration_min)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      title,
      content,
      contentKo || null,
      JSON.stringify(Array.isArray(morals) ? morals : []),
      summary,
      min,
      max,
      durationMin,
    ]
  );

  return NextResponse.json({
    story: {
      id: `my-${result.insertId}`,
      title,
      content,
      contentKo: contentKo || undefined,
      thumbnailUrl: "",
      ageMin: min,
      ageMax: max,
      morals: Array.isArray(morals) ? morals : [],
      moralSummary: summary || undefined,
      isPremium: false,
      category: "custom",
      durationMin,
      createdAt: Date.now(),
    },
  });
}
