"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categories, type Story } from "@/data/stories";
import { useCatalog } from "@/lib/useCatalog";
import { useMyStories } from "@/lib/myStories";
import { Search, Bell, Moon } from "@/components/Icon";
import { StoryCover } from "@/components/StoryCover";
import { StoryCard } from "@/components/StoryCard";
import { moralKeywords } from "@/lib/morals";

// 나이대 필터 — 동화 권장연령의 중간값으로 한 묶음에만 속하게 분류
const ageGroups = [
  { id: "all", label: "전체 나이", emoji: "👶" },
  { id: "young", label: "3~5세", emoji: "🍼" },
  { id: "mid", label: "5~7세", emoji: "🧸" },
  { id: "old", label: "6~8세", emoji: "🎒" },
];

function ageBandOf(story: Story): "young" | "mid" | "old" {
  const mid = (story.ageMin + story.ageMax) / 2;
  if (mid <= 4.5) return "young";
  if (mid <= 6.5) return "mid";
  return "old";
}

interface PlayRow {
  storyId: string;
  progressSec: number;
  durationSec: number;
  updatedAt: number;
}

// 한국어 호격 조사 (받침 있으면 "아", 없으면 "야")
function withVocative(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const last = trimmed.charCodeAt(trimmed.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  const hasJongseong = isHangul && (last - 0xac00) % 28 !== 0;
  return trimmed + (hasJongseong ? "아" : "야");
}

// 시간대별 인사말 + 추천 서브카피
function timeGreeting(hour: number): { tail: string; sub: string } {
  if (hour >= 5 && hour < 11)
    return {
      tail: "좋은 아침이야!",
      sub: "상쾌한 아침, 어떤 이야기로 하루를 열어볼까?",
    };
  if (hour >= 11 && hour < 17)
    return {
      tail: "오늘은 어떤 이야기?",
      sub: "나른한 오후엔 신나는 모험 이야기 어때?",
    };
  if (hour >= 17 && hour < 21)
    return {
      tail: "오늘 하루 어땠어?",
      sub: "저녁 먹고 도란도란, 이야기 한 편 골라봤어",
    };
  return {
    tail: "이제 잘 준비 할까?",
    sub: "잠들기 전 딱 좋은 포근한 동화를 골라봤어요",
  };
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeAge, setActiveAge] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [childName, setChildName] = useState<string | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [history, setHistory] = useState<PlayRow[]>([]);
  const catalog = useCatalog();
  const myStories = useMyStories();
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  useEffect(() => {
    setHour(new Date().getHours());
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setChildName(d.user?.childName ?? null))
      .catch(() => {});
    fetch("/api/play-progress")
      .then((r) => (r.ok ? r.json() : { history: [] }))
      .then((d) => setHistory(Array.isArray(d.history) ? d.history : []))
      .catch(() => {});
  }, []);

  const filtered = catalog
    .filter((story) => {
      const matchesCategory =
        activeCategory === "all" || story.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        story.title.includes(searchQuery) ||
        story.morals.some((m) => m.includes(searchQuery));
      const matchesAge =
        activeAge === "all" || ageBandOf(story) === activeAge;
      return matchesCategory && matchesSearch && matchesAge;
    })
    // 어린 나이대 동화부터 보이도록 정렬
    .sort((a, b) => a.ageMin - b.ageMin || a.ageMax - b.ageMax);

  // 필터·검색 없으면 큐레이션 뷰, 아니면 전체 그리드
  const isDefaultView =
    activeCategory === "all" && activeAge === "all" && searchQuery === "";

  // 이어 듣기 — 듣다 만 동화 (진행률 3~95%), 최대 6개
  const continueList = isDefaultView
    ? history
        .map((h) => {
          const story = h.storyId.startsWith("my-")
            ? myStories.find((s) => s.id === h.storyId)
            : catalog.find((s) => s.id === h.storyId);
          const pct =
            h.durationSec > 0 ? (h.progressSec / h.durationSec) * 100 : 0;
          return story && pct > 3 && pct < 95 ? { story, pct } : null;
        })
        .filter((x): x is { story: Story; pct: number } => x !== null)
        .slice(0, 6)
    : [];

  // 오늘의 추천 — 날짜 기준으로 매일 바뀜
  const featured =
    isDefaultView && catalog.length > 0
      ? catalog[Math.floor(Date.now() / 86_400_000) % catalog.length]
      : null;

  // 중복 노출 방지 (오늘의 추천 + 이어 듣기는 다른 줄에서 제외)
  const excludeIds = new Set<string>(
    [featured?.id, ...continueList.map((c) => c.story.id)].filter(
      (x): x is string => Boolean(x)
    )
  );

  // 인기 동화 — 재생수 순, 6개 고정
  const popular = isDefaultView
    ? [...catalog]
        .filter((s) => (s.playCount ?? 0) > 0 && !excludeIds.has(s.id))
        .sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0))
        .slice(0, 6)
    : [];

  // 새로 온 동화 — 최근 추가순 6개 (콘텐츠 12개 이상일 때만)
  const newArrivals =
    isDefaultView && catalog.length >= 12
      ? [...catalog]
          .reverse()
          .filter((s) => !excludeIds.has(s.id))
          .slice(0, 6)
      : [];

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-lg lg:max-w-[1280px] mx-auto px-5 lg:px-8 pt-[28px] pb-3">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="min-w-0">
              <h1 className="text-[19px] sm:text-[20px] lg:text-[22px] font-extrabold text-foreground tracking-tight leading-snug">
                {childName
                  ? `${withVocative(childName)}, ${timeGreeting(hour ?? 20).tail}`
                  : timeGreeting(hour ?? 20).tail}
              </h1>
              <p className="text-[13px] text-muted mt-1">
                {timeGreeting(hour ?? 20).sub}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  setNotifOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-surface border border-border hover:border-border-strong flex items-center justify-center text-muted hover:text-foreground transition"
                aria-label="검색"
              >
                <Search size={18} />
              </button>
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition ${
                    notifOpen
                      ? "bg-primary-light border-primary/30 text-primary"
                      : "bg-surface border-border hover:border-border-strong text-muted hover:text-foreground"
                  }`}
                  aria-label="알림"
                >
                  <Bell size={18} />
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-2xl shadow-lg p-4 z-50">
                    <p className="text-sm font-bold mb-2">알림</p>
                    <div className="flex flex-col items-center text-center py-6 text-muted">
                      <Moon size={26} />
                      <p className="text-[13px] mt-2">아직 새로운 알림이 없어요</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {searchOpen && (
            <div className="mb-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  placeholder="어떤 동화를 찾아볼까요?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm placeholder:text-muted/70 focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
            {categories.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-[var(--text-body)] border-border hover:border-border-strong"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 mt-1.5">
            {ageGroups.map((g) => {
              const active = activeAge === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveAge(g.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-[var(--text-body)] border-border hover:border-border-strong"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-lg lg:max-w-[1280px] mx-auto px-5 lg:px-8 pt-5 pb-4">
        {isDefaultView ? (
          <>
            {/* 1. 이어 듣기 */}
            {continueList.length > 0 && (
              <section className="mb-7">
                <h2 className="text-base font-bold mb-3.5 flex items-center gap-2">
                  <span className="text-lg">🎧</span>
                  이어 듣기
                </h2>
                <div className="flex gap-3.5 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
                  {continueList.map(({ story, pct }) => (
                    <ContinueCard key={story.id} story={story} pct={pct} />
                  ))}
                </div>
              </section>
            )}

            {/* 2. TODAY'S PICK */}
            {featured && (
              <section className="mb-8">
                <h2 className="text-base font-bold mb-3.5 flex items-center gap-2">
                  <span className="text-lg">⭐</span>
                  오늘의 추천
                </h2>
                <Link
                  href={`/stories/${featured.id}`}
                  className="card card-interactive overflow-hidden flex bg-primary-light"
                >
                  <div className="w-28 sm:w-40 lg:w-56 flex-shrink-0 aspect-square bg-surface-soft">
                    <StoryCover story={featured} className="w-full h-full" />
                  </div>
                  <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold mb-1.5">
                      Today&apos;s Pick
                    </p>
                    <h3 className="font-extrabold text-base sm:text-xl lg:text-2xl mb-1.5 truncate">
                      {featured.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted mb-3">
                      {featured.ageMin}~{featured.ageMax}세 · {featured.durationMin}분
                    </p>
                    <div className="hidden sm:flex gap-1.5 mb-4 flex-wrap">
                      {moralKeywords(featured.morals, 3).map((m) => (
                        <span
                          key={m}
                          className="text-[11px] bg-primary-light text-primary px-2.5 py-0.5 rounded-full font-semibold"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1.5 self-start bg-primary text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full">
                      지금 들어보기 <span aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              </section>
            )}

            {/* 3. 인기 동화 */}
            {popular.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3.5">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    인기 동화
                  </h2>
                  <Link
                    href="/stories"
                    className="text-[11px] text-muted hover:text-primary font-semibold transition flex items-center gap-0.5"
                  >
                    전체보기 <span aria-hidden>→</span>
                  </Link>
                </div>
                <div className="flex gap-3.5 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
                  {popular.map((story) => (
                    <StoryCard key={story.id} story={story} variant="carousel" />
                  ))}
                </div>
              </section>
            )}

            {/* 4. 프로모 배너 */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 mb-8 lg:grid lg:grid-cols-2 lg:gap-5 lg:mx-0 lg:px-0 lg:overflow-visible">
              <Link
                href="/create"
                className="min-w-[280px] lg:min-w-0 bg-[var(--night)] rounded-2xl p-6 lg:p-7 lg:min-h-[180px] lg:flex lg:flex-col lg:justify-center relative overflow-hidden card-interactive"
              >
                <svg
                  viewBox="0 0 100 100"
                  className="absolute -top-6 -right-4 w-24 h-24 pointer-events-none"
                  aria-hidden
                >
                  <circle cx="50" cy="50" r="34" fill="#F4C566" />
                  <circle cx="63" cy="41" r="30" fill="#2C2A45" />
                </svg>
                <span
                  className="absolute w-1 h-1 rounded-full bg-[#F4C566] pointer-events-none"
                  style={{ top: "52%", right: "15%" }}
                  aria-hidden
                />
                <span
                  className="absolute w-1 h-1 rounded-full bg-[#EDE9F7] opacity-70 pointer-events-none"
                  style={{ top: "72%", right: "8%" }}
                  aria-hidden
                />
                <div className="relative z-10">
                  <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--night-caption)] mb-2">
                    AI Story Maker
                  </p>
                  <h2 className="text-[18px] lg:text-[20px] font-extrabold mb-1.5 leading-snug text-white">
                    우리 아이만의 동화를<br />만들어요
                  </h2>
                  <p className="text-[13px] text-white/55">줄거리만 알려주세요</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-[13px] font-bold text-[var(--star)]">
                    만들러 가기 <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>

              <Link
                href="/record"
                className="min-w-[280px] lg:min-w-0 bg-primary-light rounded-2xl p-6 lg:p-7 lg:min-h-[180px] lg:flex lg:flex-col lg:justify-center relative overflow-hidden card-interactive"
              >
                <div className="relative z-10">
                  <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-2">
                    Voice Clone
                  </p>
                  <h2 className="text-[18px] lg:text-[20px] font-extrabold mb-1.5 leading-snug text-[#3C3489]">
                    내 목소리로<br />동화 들려주기
                  </h2>
                  <p className="text-[13px] text-[var(--text-body)]">30초 녹음이면 충분해요</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-[13px] font-bold text-primary">
                    녹음하러 가기 <span aria-hidden>→</span>
                  </span>
                </div>
                <svg
                  viewBox="0 0 200 200"
                  className="absolute -right-6 -bottom-8 w-40 h-40 text-primary opacity-[0.16] pointer-events-none"
                  fill="currentColor"
                  aria-hidden
                >
                  <rect x="80" y="40" width="40" height="80" rx="20" />
                  <path
                    d="M55 100a45 45 0 0 0 90 0"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path d="M100 145v25" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </Link>
            </div>

            {/* 5. 새로 온 동화 */}
            {newArrivals.length > 0 && (
              <section className="mb-8">
                <h2 className="text-base font-bold mb-3.5 flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  새로 온 동화
                </h2>
                <div className="flex gap-3.5 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
                  {newArrivals.map((story) => (
                    <StoryCard key={story.id} story={story} variant="carousel" />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
              {filtered.map((story) => (
                <StoryCard key={story.id} story={story} variant="grid" />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3 opacity-50">📚</p>
                <p className="text-foreground/80 text-base font-semibold">
                  동화를 찾을 수 없어요
                </p>
                <p className="text-muted text-xs mt-1">
                  다른 나이대나 분류로 찾아보세요
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function ContinueCard({ story, pct }: { story: Story; pct: number }) {
  return (
    <Link
      href={`/player/${story.id}`}
      className="group block card card-interactive overflow-hidden min-w-[150px] w-[150px]"
    >
      <div className="relative aspect-square bg-surface-soft overflow-hidden">
        <StoryCover
          story={story}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-2.5">
        <h3 className="font-bold text-xs mb-1.5 group-hover:text-primary transition-colors truncate">
          {story.title}
        </h3>
        <div className="h-1 rounded-full bg-primary-light overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted mt-1.5">
          {Math.round(pct)}% 들었어요
        </p>
      </div>
    </Link>
  );
}
