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
            duration_min, series_id, series_title, episode_no, parent_story_id,
            episode_summary, new_facts,
            UNIX_TIMESTAMP(created_at) AS created_at
     FROM user_stories WHERE user_id = ? ORDER BY created_at DESC`,
    [user.id]
  );

  return NextResponse.json({ stories: rows.map(rowToMyStory) });
}

// "my-5" → 5, 그 외/유효하지 않으면 null
function toDbId(id: unknown): number | null {
  if (typeof id !== "string") return null;
  const m = id.match(/^my-(\d+)$/);
  return m ? Number(m[1]) : null;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const {
    title,
    content,
    contentKo,
    morals,
    moralSummary,
    ageMin,
    ageMax,
    episodeSummary, // 이 편 줄거리 요약 (후속편 문맥용)
    newFacts, // 이 편에서 새로 생긴 사실
    episode_summary: episodeSummarySnake, // 생성 라우트가 snake_case로 줄 수도 있어 함께 수용
    new_facts: newFactsSnake,
    parentStoryId, // 이어 만들기: 직전 편 id ("my-N"). 없으면 단독 생성.
  } = await req.json();
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
  const epSummaryRaw = episodeSummary ?? episodeSummarySnake;
  const newFactsRaw = newFacts ?? newFactsSnake;
  const epSummary =
    typeof epSummaryRaw === "string" && epSummaryRaw.trim()
      ? epSummaryRaw.trim().slice(0, 600)
      : null;
  const facts = Array.isArray(newFactsRaw)
    ? newFactsRaw
        .filter((f: unknown) => typeof f === "string" && f.trim())
        .map((f: string) => f.trim().slice(0, 120))
        .slice(0, 8)
    : [];

  // 시리즈 필드 계산 (이어 만들기일 때만)
  let seriesId: number | null = null;
  let seriesTitle: string | null = null;
  let episodeNo = 1;
  let parentDbId: number | null = null;

  const parentIdNum = toDbId(parentStoryId);
  if (parentIdNum != null) {
    const [prows] = await db.query<RowDataPacket[]>(
      `SELECT id, title, series_id, series_title FROM user_stories
       WHERE id = ? AND user_id = ? LIMIT 1`,
      [parentIdNum, user.id]
    );
    const parent = prows[0];
    if (parent) {
      parentDbId = parent.id;
      if (parent.series_id == null) {
        // 첫 후속편: 부모(1편)에 시리즈 발급
        seriesId = parent.id;
        seriesTitle = parent.title;
        episodeNo = 2;
        await db.query(
          `UPDATE user_stories
           SET series_id = ?, series_title = ?, episode_no = 1
           WHERE id = ? AND user_id = ?`,
          [parent.id, parent.title, parent.id, user.id]
        );
      } else {
        // 기존 시리즈에 이어 붙임 — 편 번호는 max+1 (삭제된 번호 재사용 안 함)
        seriesId = parent.series_id;
        seriesTitle = parent.series_title ?? parent.title;
        const [mrows] = await db.query<RowDataPacket[]>(
          `SELECT COALESCE(MAX(episode_no), 1) AS mx FROM user_stories
           WHERE series_id = ? AND user_id = ?`,
          [parent.series_id, user.id]
        );
        episodeNo = Number(mrows[0].mx) + 1;
      }
    }
  }

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO user_stories
       (user_id, title, content, content_ko, morals, moral_summary, age_min, age_max,
        duration_min, series_id, series_title, episode_no, parent_story_id,
        episode_summary, new_facts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      seriesId,
      seriesTitle,
      episodeNo,
      parentDbId,
      epSummary,
      JSON.stringify(facts),
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
      seriesId: seriesId != null ? `my-${seriesId}` : null,
      seriesTitle,
      episodeNo,
      parentStoryId: parentDbId != null ? `my-${parentDbId}` : null,
      episodeSummary: epSummary,
      newFacts: facts,
      createdAt: Date.now(),
    },
  });
}
