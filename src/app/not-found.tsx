import Link from "next/link";
import { NightSky } from "@/components/NightSky";

export default function NotFound() {
  return (
    <NightSky>
      {/* 404 워터마크 + 제목 (겹쳐서 은은하게) */}
      <div className="relative flex flex-col items-center">
        <span
          aria-hidden
          className="text-[72px] sm:text-[96px] font-black leading-none text-[#3D3A5C] select-none"
        >
          404
        </span>
        <h1 className="-mt-5 sm:-mt-7 text-[22px] font-extrabold text-[#FBF9F6]">
          길을 잃었나 봐요
        </h1>
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-[#C9C3E8]">
        찾으시는 페이지가 없어요.
        <br />
        대신 재미있는 동화는 많아요!
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center h-12 px-7 rounded-full bg-primary text-white font-bold text-[15px] hover:bg-primary-dark transition shadow-lg shadow-primary/30"
      >
        홈으로 돌아가기
      </Link>
    </NightSky>
  );
}
