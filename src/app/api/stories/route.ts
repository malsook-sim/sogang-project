import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { rowToCatalogStory } from "@/lib/storyRow";

export async function GET() {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, title, content, age_min, age_max, morals, is_premium,
            category, duration_min
     FROM stories ORDER BY sort_order, id`
  );
  return NextResponse.json({ stories: rows.map(rowToCatalogStory) });
}
