"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { categories, type Story } from "@/data/stories";
import { useCatalog } from "@/lib/useCatalog";
import { useMyStories } from "@/lib/myStories";
import { Search, User } from "@/components/Icon";
import { StoryCover } from "@/components/StoryCover";

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

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeAge, setActiveAge] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [childName, setChildName] = useState<string | null>(null);
  const [history, setHistory] = useState<PlayRow[]>([]);
  const catalog = useCatalog();
  const myStories = useMyStories();

  useEffect(() => {
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

  const grouped =
    activeCategory === "all"
      ? categories
          .filter((c) => c.id !== "all")
          .map((cat) => ({
            ...cat,
            stories: filtered.filter((s) => s.category === cat.id),
          }))
          .filter((g) => g.stories.length > 0)
      : [
          {
            ...categories.find((c) => c.id === activeCategory)!,
            stories: filtered,
          },
        ];

  // 필터·검색 없는 기본 화면에서만 추천/이어듣기/인기 섹션 노출
  const isDefaultView =
    activeCategory === "all" && activeAge === "all" && searchQuery === "";

  // 이어 듣기 — 듣다 만 동화 (진행률 3~95%)
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
        .slice(0, 8)
    : [];

  // 오늘의 추천 — 날짜 기준으로 매일 바뀜
  const featured =
    isDefaultView && catalog.length > 0
      ? catalog[Math.floor(Date.now() / 86_400_000) % catalog.length]
      : null;

  // 인기 동화 — 재생수 순 (한 번이라도 재생된 것만)
  const popular = isDefaultView
    ? [...catalog]
        .filter((s) => (s.playCount ?? 0) > 0)
        .sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0))
        .slice(0, 10)
    : [];

  return (
    <>
      <header className="sticky top-0 z-40 glass">
        <div className="max-w-lg lg:max-w-6xl mx-auto px-5 pt-6 pb-3">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-semibold mb-1.5">
                MyVoiceStory for kids
              </p>
              <h1 className="text-[22px] font-extrabold leading-none tracking-tight">
                <span className="text-primary">마이보이스스토리</span>
              </h1>
              <p className="text-xs text-muted mt-1.5">
                {childName
                  ? `${withVocative(childName)}, 오늘은 어떤 이야기?`
                  : "오늘은 어떤 이야기 들을까?"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-10 h-10 rounded-full bg-surface border border-border hover:border-border-strong flex items-center justify-center text-muted hover:text-foreground transition"
                aria-label="검색"
              >
                <Search size={18} />
              </button>
              <Link
                href="/mypage"
                className="w-10 h-10 rounded-full bg-primary-light text-primary border border-primary/10 flex items-center justify-center transition hover:bg-primary hover:text-white"
                aria-label="내 서재"
              >
                <User size={18} />
              </Link>
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-surface text-muted border-border hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  <span className={active ? "" : "opacity-80"}>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 mt-2">
            {ageGroups.map((g) => {
              const active = activeAge === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveAge(g.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-muted border-border hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  <span className={active ? "" : "opacity-80"}>{g.emoji}</span>
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-lg lg:max-w-6xl mx-auto px-5 pt-5 pb-4">
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

        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 mb-7 lg:grid lg:grid-cols-2 lg:gap-5 lg:mx-0 lg:px-0 lg:overflow-visible">
          <Link
            href="/create"
            className="min-w-[280px] lg:min-w-0 bg-hero-secondary rounded-2xl p-5 lg:p-7 text-white relative overflow-hidden card-interactive"
          >
            <div className="relative z-10">
              <p className="text-[11px] font-semibold tracking-wider uppercase opacity-70 mb-2">
                AI Story Maker
              </p>
              <h2 className="text-[17px] font-bold mb-1.5 leading-snug">
                우리 아이만의 동화를<br />만들어요
              </h2>
              <p className="text-xs opacity-70">줄거리만 알려주세요</p>
              <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold opacity-90">
                만들러 가기 <span aria-hidden>→</span>
              </span>
            </div>
            <svg
              viewBox="0 0 200 200"
              className="absolute -right-6 -bottom-6 w-44 h-44 opacity-15"
              aria-hidden
            >
              <circle cx="100" cy="100" r="80" fill="white" />
              <circle cx="60" cy="60" r="18" fill="white" />
              <circle cx="150" cy="50" r="10" fill="white" />
            </svg>
          </Link>
          <Link
            href="/record"
            className="min-w-[280px] lg:min-w-0 bg-hero-primary rounded-2xl p-5 lg:p-7 text-white relative overflow-hidden card-interactive"
          >
            <div className="relative z-10">
              <p className="text-[11px] font-semibold tracking-wider uppercase opacity-70 mb-2">
                Voice Clone
              </p>
              <h2 className="text-[17px] font-bold mb-1.5 leading-snug">
                내 목소리로<br />동화 들려주기
              </h2>
              <p className="text-xs opacity-70">30초 녹음이면 충분해요</p>
              <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold opacity-90">
                녹음하러 가기 <span aria-hidden>→</span>
              </span>
            </div>
            <svg
              viewBox="0 0 200 200"
              className="absolute -right-2 bottom-0 w-36 h-36 opacity-20"
              aria-hidden
            >
              <rect x="80" y="40" width="40" height="80" rx="20" fill="white" />
              <path
                d="M55 100a45 45 0 0 0 90 0"
                stroke="white"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
              <path d="M100 145v25" stroke="white" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {featured && (
          <section className="mb-8">
            <h2 className="text-base font-bold mb-3.5 flex items-center gap-2">
              <span className="text-lg">⭐</span>
              오늘의 추천
            </h2>
            <Link
              href={`/stories/${featured.id}`}
              className="card card-interactive overflow-hidden flex bg-accent-light/50"
            >
              <div className="w-28 sm:w-36 flex-shrink-0 aspect-square bg-surface-soft">
                <StoryCover story={featured} className="w-full h-full" />
              </div>
              <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.15em] text-accent font-bold mb-1">
                  Today&apos;s Pick
                </p>
                <h3 className="font-extrabold text-base sm:text-lg mb-1 truncate">
                  {featured.title}
                </h3>
                <p className="text-xs text-muted mb-2.5 truncate">
                  {featured.morals.join(" · ")} · {featured.ageMin}~
                  {featured.ageMax}세
                </p>
                <span className="text-xs font-bold text-primary inline-flex items-center gap-0.5">
                  지금 들어보기 <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          </section>
        )}

        {popular.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold mb-3.5 flex items-center gap-2">
              <span className="text-lg">🔥</span>
              인기 동화
            </h2>
            <div className="flex gap-3.5 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
              {popular.map((story) => (
                <StoryCard key={story.id} story={story} variant="carousel" />
              ))}
            </div>
          </section>
        )}

        {grouped.map((group) => (
          <section key={group.id} className="mb-8">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-base font-bold flex items-center gap-2">
                <span className="text-lg">{group.emoji}</span>
                {group.label}
              </h2>
              {activeCategory === "all" && (
                <button
                  onClick={() => setActiveCategory(group.id)}
                  className="text-[11px] text-muted hover:text-primary font-semibold transition flex items-center gap-0.5"
                >
                  전체보기 <span aria-hidden>→</span>
                </button>
              )}
            </div>

            {activeCategory === "all" ? (
              <div className="flex gap-3.5 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
                {group.stories.map((story) => (
                  <StoryCard key={story.id} story={story} variant="carousel" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                {group.stories.map((story) => (
                  <StoryCard key={story.id} story={story} variant="grid" />
                ))}
              </div>
            )}
          </section>
        ))}

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
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-foreground/20">
          <div
            className="h-full bg-primary"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
      <div className="p-2.5">
        <h3 className="font-bold text-xs mb-0.5 group-hover:text-primary transition-colors truncate">
          {story.title}
        </h3>
        <p className="text-[10px] text-muted">{Math.round(pct)}% 들었어요</p>
      </div>
    </Link>
  );
}

function StoryCard({
  story,
  variant,
}: {
  story: Story;
  variant: "carousel" | "grid";
}) {
  return (
    <Link
      href={`/stories/${story.id}`}
      className={`group block card card-interactive overflow-hidden ${
        variant === "carousel" ? "min-w-[160px] w-[160px]" : ""
      }`}
    >
      <div className="relative aspect-square bg-surface-soft overflow-hidden">
        <StoryCover
          story={story}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        {story.isPremium && (
          <span className="absolute top-2 left-2 bg-foreground/85 text-background text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm tracking-wider">
            PRO
          </span>
        )}
        <div className="absolute bottom-2 right-2 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm font-medium">
          {story.durationMin}분
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors truncate">
          {story.title}
        </h3>
        <p className="text-[11px] text-muted">
          {story.ageMin}~{story.ageMax}세
        </p>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {story.morals.slice(0, 2).map((moral) => (
            <span
              key={moral}
              className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded-full font-semibold"
            >
              {moral}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
