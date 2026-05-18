"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import {
  User,
  Mic,
  Heart,
  Bell,
  Lock,
  FileText,
  Sliders,
  ChevronRight,
} from "@/components/Icon";

export default function MyPage() {
  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center">
          <h1 className="font-bold tracking-tight">내 서재</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6">
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-light text-primary rounded-2xl flex items-center justify-center">
              <User size={26} filled />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base">로그인해 주세요</p>
              <p className="text-xs text-muted mt-0.5">
                로그인하면 목소리를 등록할 수 있어요
              </p>
            </div>
          </div>
          <button className="w-full mt-4 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition shadow-sm shadow-primary/20">
            로그인 / 회원가입
          </button>
        </div>

        <div className="card p-5 mb-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Mic size={16} className="text-primary" />
            등록된 목소리
          </h2>
          <div className="flex items-center gap-3 p-3 bg-surface-soft border border-border rounded-xl">
            <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center text-muted">
              <Mic size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground/80">
                등록된 목소리가 없어요
              </p>
              <p className="text-xs text-muted mt-0.5">
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

        <div className="card p-5 mb-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Heart size={16} className="text-primary" />
            저장한 동화
          </h2>
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-soft border border-border flex items-center justify-center text-muted">
              <Heart size={20} />
            </div>
            <p className="text-sm text-foreground/75 font-medium">
              아직 저장한 동화가 없어요
            </p>
            <p className="text-xs text-muted mt-1">
              마음에 드는 동화에 하트를 눌러보세요
            </p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <h2 className="font-bold text-sm px-5 pt-4 pb-3 flex items-center gap-2">
            <Sliders size={16} className="text-muted" />
            설정
          </h2>
          {[
            { Icon: User, label: "자녀 정보 관리" },
            { Icon: Bell, label: "알림 설정" },
            { Icon: Lock, label: "개인정보 처리방침" },
            { Icon: FileText, label: "서비스 이용약관" },
          ].map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-soft transition text-left border-t border-border"
            >
              <item.Icon size={18} className="text-muted" />
              <span className="text-sm">{item.label}</span>
              <ChevronRight size={16} className="ml-auto text-muted/60" />
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
