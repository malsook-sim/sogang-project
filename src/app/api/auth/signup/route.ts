import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, childName, childAge } = await req.json();

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

  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO users (email, password_hash, child_name, child_age) VALUES (?, ?, ?, ?)",
    [email, passwordHash, childName || null, age]
  );

  await createSession(result.insertId);

  return NextResponse.json({
    user: {
      id: result.insertId,
      email,
      childName: childName || null,
      childAge: age,
    },
  });
}
