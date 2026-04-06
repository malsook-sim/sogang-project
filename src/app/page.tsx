"use client";

import { useState } from "react";
import Link from "next/link";
import { stories, categories } from "@/data/stories";
import BottomNav from "@/components/BottomNav";

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

  // 카테고리별 그룹핑 (전체 탭이면 카테고리별로 섹션 나눔)
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg">
        <div className="max-w-lg mx-auto px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold">
                <span className="text-primary">동화야</span>
              </h1>
              <p className="text-xs text-muted mt-0.5">
                오늘은 어떤 이야기 들을까?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-lg"
              >
                🔍
              </button>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                👶
              </div>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="mb-3">
              <input
                type="text"
                placeholder="동화 제목이나 교훈을 검색해보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
          )}

          {/* Category tabs - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-white text-gray-500 border border-gray-100"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-lg mx-auto px-5 pt-4 pb-4">
        {/* Banner cards */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 mb-6">
          <Link
            href="/create"
            className="min-w-[260px] bg-gradient-to-r from-secondary to-purple-500 rounded-2xl p-5 text-white relative overflow-hidden"
          >
            <div className="relative z-10">
              <p className="text-xs font-medium opacity-80 mb-1">
                AI 동화 만들기
              </p>
              <h2 className="text-base font-bold mb-1">
                우리 아이만의 동화를 만들어요
              </h2>
              <p className="text-xs opacity-70">줄거리만 입력하면 OK</p>
            </div>
            <div className="absolute right-3 bottom-2 text-5xl opacity-20">
              ✨
            </div>
          </Link>
          <Link
            href="/record"
            className="min-w-[260px] bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-5 text-white relative overflow-hidden"
          >
            <div className="relative z-10">
              <p className="text-xs font-medium opacity-80 mb-1">
                목소리 등록
              </p>
              <h2 className="text-base font-bold mb-1">
                내 목소리로 동화 들려주기
              </h2>
              <p className="text-xs opacity-70">30초만 녹음하면 완성</p>
            </div>
            <div className="absolute right-3 bottom-2 text-5xl opacity-20">
              🎤
            </div>
          </Link>
        </div>

        {/* Story sections */}
        {grouped.map((group) => (
          <section key={group.id} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-1.5">
                <span>{group.emoji}</span>
                {group.label}
              </h2>
              {activeCategory === "all" && (
                <button
                  onClick={() => setActiveCategory(group.id)}
                  className="text-xs text-muted hover:text-primary transition"
                >
                  전체보기 →
                </button>
              )}
            </div>

            {/* Horizontal carousel for "all" view, grid for category view */}
            {activeCategory === "all" ? (
              <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
                {group.stories.map((story) => (
                  <StoryCard key={story.id} story={story} variant="carousel" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {group.stories.map((story) => (
                  <StoryCard key={story.id} story={story} variant="grid" />
                ))}
              </div>
            )}
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-muted text-lg font-medium">
              동화를 찾을 수 없어요
            </p>
            <p className="text-gray-300 text-sm mt-1">
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
      className={`group block bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-50 ${
        variant === "carousel" ? "min-w-[160px] w-[160px]" : ""
      }`}
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={story.thumbnailUrl}
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {story.isPremium && (
          <span className="absolute top-2 left-2 bg-accent text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            PRO
          </span>
        )}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
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
              className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium"
            >
              {moral}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
