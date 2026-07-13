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

  const { childName, childAge, childGender } = await req.json();

  const name =
    typeof childName === "string" && childName.trim()
      ? childName.trim().slice(0, 50)
      : null;

  const ageNum = childAge === "" || childAge == null ? NaN : Number(childAge);
  const age =
    Number.isFinite(ageNum) && ageNum >= 0 && ageNum <= 12 ? ageNum : null;

  // 'boy' | 'girl' 만 허용, 그 외/미선택은 null
  const gender =
    childGender === "boy" || childGender === "girl" ? childGender : null;

  await db.query<ResultSetHeader>(
    "UPDATE users SET child_name = ?, child_age = ?, child_gender = ? WHERE id = ?",
    [name, age, gender, user.id]
  );

  return NextResponse.json({
    user: { ...user, childName: name, childAge: age, childGender: gender },
  });
}
