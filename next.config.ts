import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["logpxai.co.kr"],
  // 좌하단 개발용 오버레이(N 아이콘) 숨김 — 프로덕션 빌드에는 원래 포함되지 않음
  devIndicators: false,
};

export default nextConfig;
