import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "mvk_session";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

// 로그인 없이 볼 수 있는 화면 (소개 랜딩 + 로그인/가입)
const PUBLIC_PATHS = ["/landing", "/login"];

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await hasValidSession(req);
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // 로그아웃 상태 — 서비스 소개 랜딩 페이지로 보냄
  if (!authed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/landing";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 로그인 상태 — 랜딩/로그인 화면은 건너뜀
  if (authed && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.startsWith("/login") ? "/mypage" : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
