import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "mvk_session";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

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

  // 로그인 필요한 화면
  const isProtected =
    pathname.startsWith("/create") || pathname.startsWith("/record");

  if (isProtected && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 이미 로그인한 사용자는 로그인 화면으로 안 보냄
  if (pathname === "/login" && authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/mypage";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/create", "/create/:path*", "/record", "/record/:path*", "/login"],
};
