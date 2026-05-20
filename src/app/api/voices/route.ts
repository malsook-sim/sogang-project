import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ voices: [] });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT elevenlabs_voice_id, name, emoji, UNIX_TIMESTAMP(created_at) AS created_at
     FROM voices WHERE user_id = ? ORDER BY created_at DESC`,
    [user.id]
  );

  const voices = rows.map((r) => ({
    id: r.elevenlabs_voice_id,
    name: r.name,
    emoji: r.emoji,
    createdAt: Number(r.created_at) * 1000,
  }));

  return NextResponse.json({ voices });
}
