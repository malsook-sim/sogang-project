import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, nickname, childName, childAge, agreedPrivacy } =
    await req.json();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "올바른 이메일을 입력해 주세요." },
      { status: 400 }
    );
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "비밀번호는 6자 이상으로 해주세요." },
      { status: 400 }
    );
  }
  // 이용약관·개인정보 처리방침 동의는 필수
  if (agreedPrivacy !== true) {
    return NextResponse.json(
      { error: "이용약관 및 개인정보 처리방침 동의가 필요해요." },
      { status: 400 }
    );
  }

  const [existing] = await db.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "이미 가입된 이메일이에요." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const age = childAge ? Number(childAge) : null;
  const nick =
    typeof nickname === "string" && nickname.trim()
      ? nickname.trim().slice(0, 50)
      : null;

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO users (email, password_hash, nickname, child_name, child_age, privacy_agreed_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [email, passwordHash, nick, childName || null, age]
  );

  await createSession(result.insertId);

  return NextResponse.json({
    user: {
      id: result.insertId,
      email,
      nickname: nick,
      childName: childName || null,
      childAge: age,
    },
  });
}
