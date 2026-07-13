import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ voices: [] });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT v.elevenlabs_voice_id, v.name, v.emoji, v.description,
            UNIX_TIMESTAMP(v.created_at) AS created_at,
            (SELECT COUNT(DISTINCT ac.story_id) FROM audio_cache ac
               WHERE ac.user_id = v.user_id
                 AND ac.voice_id = v.elevenlabs_voice_id) AS usage_count
     FROM voices v WHERE v.user_id = ? ORDER BY v.created_at DESC`,
    [user.id]
  );

  const voices = rows.map((r) => ({
    id: r.elevenlabs_voice_id as string,
    name: r.name as string,
    emoji: r.emoji as string,
    description: (r.description ?? "") as string,
    createdAt: Number(r.created_at) * 1000,
    usageCount: Number(r.usage_count) || 0,
    isDefault: false,
  }));

  // 명시된 기본 목소리가 있으면 그것, 없으면 가장 최근 목소리를 기본으로
  const defaultId =
    voices.find((v) => v.id === user.defaultVoiceId)?.id ??
    voices[0]?.id ??
    null;
  voices.forEach((v) => {
    v.isDefault = v.id === defaultId;
  });

  return NextResponse.json({ voices });
}
