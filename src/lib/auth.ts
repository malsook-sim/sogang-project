import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { db } from "./db";

const COOKIE = "mvk_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일
const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export interface SessionUser {
  id: number;
  email: string;
  nickname: string | null;
  childName: string | null;
  childAge: number | null;
  childGender: string | null;
  defaultVoiceId: string | null;
}

// 표시용 이름 — 보호자 호칭이 없으면 이메일 앞부분으로 폴백
export function displayName(user: {
  nickname: string | null;
  email: string;
}): string {
  return user.nickname?.trim() || user.email.split("@")[0];
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number): Promise<void> {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const store = await cookies();
  // 앱이 http://localhost 와 https://logpxai.co.kr 양쪽에서 열려서
  // Secure 를 켜면 localhost(http)에서 쿠키가 저장되지 않음 → false 로 둠
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const uid = Number(payload.uid);
    if (!uid) return null;

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, email, nickname, child_name, child_age, child_gender, default_voice_id FROM users WHERE id = ? LIMIT 1",
      [uid]
    );
    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      nickname: row.nickname ?? null,
      childName: row.child_name,
      childAge: row.child_age,
      childGender: row.child_gender ?? null,
      defaultVoiceId: row.default_voice_id ?? null,
    };
  } catch {
    return null;
  }
}
