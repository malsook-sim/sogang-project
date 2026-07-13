"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories, type Story } from "@/data/stories";
import { useCatalog } from "@/lib/useCatalog";
import PageHeader from "@/components/PageHeader";
import { StoryCard } from "@/components/StoryCard";

const ageGroups = [
  { id: "all", label: "전체 나이" },
  { id: "young", label: "3~5세" },
  { id: "mid", label: "5~7세" },
  { id: "old", label: "6~8세" },
];

function ageBandOf(story: Story): "young" | "mid" | "old" {
  const mid = (story.ageMin + story.ageMax) / 2;
  if (mid <= 4.5) return "young";
  if (mid <= 6.5) return "mid";
  return "old";
}

export default function StoriesBrowsePage() {
  const router = useRouter();
  const catalog = useCatalog();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeAge, setActiveAge] = useState("all");

  const filtered = catalog
    .filter((s) => {
      const matchCat = activeCategory === "all" || s.category === activeCategory;
      const matchAge = activeAge === "all" || ageBandOf(s) === activeAge;
      return matchCat && matchAge;
    })
    .sort((a, b) => a.ageMin - b.ageMin || a.ageMax - b.ageMax);

  const chip = (
    key: string,
    active: boolean,
    label: string,
    onClick: () => void
  ) => (
    <button
      key={key}
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-surface text-[var(--text-body)] border-border hover:border-border-strong"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader
        title="동화 둘러보기"
        subtitle="원하는 동화를 골라보세요"
        onBack={() => router.back()}
        containerClassName="max-w-[1280px] mx-auto px-5 lg:px-8"
      />

      <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 mb-1.5">
          {categories.map((c) =>
            chip(c.id, activeCategory === c.id, c.label, () =>
              setActiveCategory(c.id)
            )
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 mb-6">
          {ageGroups.map((g) =>
            chip(g.id, activeAge === g.id, g.label, () => setActiveAge(g.id))
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
            {filtered.map((s) => (
              <StoryCard key={s.id} story={s} variant="grid" />
            ))}
          </div>
        ) : (
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
