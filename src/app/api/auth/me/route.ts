import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  // 요청 본문에 실제로 들어온 필드만 부분 업데이트 (다른 필드 보존)
  const body = (await req.json()) as Record<string, unknown>;
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];

  if ("nickname" in body) {
    const nick =
      typeof body.nickname === "string" && body.nickname.trim()
        ? body.nickname.trim().slice(0, 50)
        : null;
    sets.push("nickname = ?");
    vals.push(nick);
  }
  if ("childName" in body) {
    const name =
      typeof body.childName === "string" && body.childName.trim()
        ? body.childName.trim().slice(0, 50)
        : null;
    sets.push("child_name = ?");
    vals.push(name);
  }
  if ("childAge" in body) {
    const ageNum =
      body.childAge === "" || body.childAge == null
        ? NaN
        : Number(body.childAge);
    const age =
      Number.isFinite(ageNum) && ageNum >= 0 && ageNum <= 12 ? ageNum : null;
    sets.push("child_age = ?");
    vals.push(age);
  }
  if ("childGender" in body) {
    // 'boy' | 'girl' 만 허용, 그 외/미선택은 null
    const gender =
      body.childGender === "boy" || body.childGender === "girl"
        ? body.childGender
        : null;
    sets.push("child_gender = ?");
    vals.push(gender);
  }

  if (sets.length > 0) {
    vals.push(user.id);
    await db.query<ResultSetHeader>(
      `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
      vals
    );
  }

  const updated = await getCurrentUser();
  return NextResponse.json({ user: updated });
}
