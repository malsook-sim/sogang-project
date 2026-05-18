"use client";

import { useState } from "react";
import Link from "next/link";
import { stories, categories } from "@/data/stories";
import BottomNav from "@/components/BottomNav";
import { Search, User } from "@/components/Icon";
import { StoryCover } from "@/components/StoryCover";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const filtered = stories.filter((story) => {
    const matchesCategory =
      activeCategory === "all" || story.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      story.title.includes(searchQuery) ||
      story.morals.some((m) => m.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

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

  return (
    <>
      <header className="sticky top-0 z-40 glass">
        <div className="max-w-lg mx-auto px-5 pt-6 pb-3">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-semibold mb-1.5">
                MyVoiceStory for kids
              </p>
              <h1 className="text-[22px] font-extrabold leading-none tracking-tight">
                <span className="text-primary">마이보이스스토리</span>
              </h1>
              <p className="text-xs text-muted mt-1.5">
                오늘은 어떤 이야기 들을까?
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
                  placeholder="동화 제목이나 교훈을 검색해보세요"
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
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-5 pb-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 mb-7">
          <Link
            href="/create"
            className="min-w-[280px] bg-hero-secondary rounded-2xl p-5 text-white relative overflow-hidden card-interactive"
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
            className="min-w-[280px] bg-hero-primary rounded-2xl p-5 text-white relative overflow-hidden card-interactive"
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
              <div className="grid grid-cols-2 gap-3.5">
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
              다른 키워드로 검색해보세요
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </>
  );
}

function StoryCard({
  story,
  variant,
}: {
  story: (typeof stories)[0];
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
