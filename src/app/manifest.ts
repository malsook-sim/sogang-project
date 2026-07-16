import type { MetadataRoute } from "next";

// PWA 매니페스트 — Next가 /manifest.webmanifest 로 서빙하고 <link rel="manifest"> 자동 삽입
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "마이보이스스토리 for kids",
    short_name: "마이보이스스토리",
    description: "부모의 목소리로 아이에게 동화를 읽어주는 AI 육아 서비스",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF9F6",
    theme_color: "#2C2A45",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
