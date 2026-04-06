"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function MyPage() {
  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-50">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center">
          <h1 className="font-bold">내 서재</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center text-2xl">
              👶
            </div>
            <div>
              <p className="font-bold text-lg">로그인해 주세요</p>
              <p className="text-xs text-muted">
                로그인하면 목소리를 등록할 수 있어요
              </p>
            </div>
          </div>
          <button className="w-full mt-4 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition">
            로그인 / 회원가입
          </button>
        </div>

        {/* Voice status */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-1.5">
            🎙️ 등록된 목소리
          </h2>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-muted/20 rounded-full flex items-center justify-center text-lg">
              🔇
            </div>
            <div>
              <p className="text-sm font-medium text-muted">
                등록된 목소리가 없어요
              </p>
              <p className="text-xs text-gray-300">
                목소리를 녹음해서 등록해보세요
              </p>
            </div>
          </div>
          <Link
            href="/record"
            className="block text-center w-full mt-3 py-2.5 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary-light transition"
          >
            목소리 녹음하러 가기
          </Link>
        </div>

        {/* Bookmarks placeholder */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-1.5">
            ❤️ 저장한 동화
          </h2>
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📚</p>
            <p className="text-sm text-muted">아직 저장한 동화가 없어요</p>
            <p className="text-xs text-gray-300 mt-1">
              마음에 드는 동화에 하트를 눌러보세요!
            </p>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <h2 className="font-bold text-sm px-5 pt-4 pb-2 flex items-center gap-1.5">
            ⚙️ 설정
          </h2>
          {[
            { icon: "👶", label: "자녀 정보 관리" },
            { icon: "🔔", label: "알림 설정" },
            { icon: "🔒", label: "개인정보 처리방침" },
            { icon: "📋", label: "서비스 이용약관" },
          ].map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition text-left border-t border-gray-50"
            >
              <span>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              <span className="ml-auto text-gray-300 text-xs">→</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
