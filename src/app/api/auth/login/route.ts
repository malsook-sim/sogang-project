import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "이메일과 비밀번호를 입력해 주세요." },
      { status: 400 }
    );
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, email, password_hash, child_name, child_age FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const user = rows[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json(
      { error: "이메일 또는 비밀번호가 올바르지 않아요." },
      { status: 401 }
    );
  }

  await createSession(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      childName: user.child_name,
      childAge: user.child_age,
    },
  });
}
