import Link from "next/link";
import type { Story } from "@/data/stories";
import { StoryCover } from "@/components/StoryCover";
import { moralKeywords } from "@/lib/morals";

// 동화 카드 — 홈 큐레이션 / 탐색(/stories) 공용
export function StoryCard({
  story,
  variant = "grid",
}: {
  story: Story;
  variant?: "carousel" | "grid" | "responsive";
}) {
  const sizing =
    variant === "carousel"
      ? "min-w-[160px] w-[160px]"
      : variant === "responsive"
      ? "min-w-[160px] w-[160px] lg:min-w-0 lg:w-auto"
      : "";
  return (
    <Link
      href={`/stories/${story.id}`}
      className={`group block card card-interactive overflow-hidden ${sizing}`}
    >
      <div className="relative aspect-square bg-surface-soft overflow-hidden">
        <StoryCover
          story={story}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        {story.isPremium && (
          <span className="absolute top-2 left-2 bg-[#F4C566] text-[#5C4400] text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
            PRO
          </span>
        )}
        <div className="absolute bottom-2 right-2 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm font-medium">
          {story.durationMin}분
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
          {story.title}
        </h3>
        <p className="text-[11px] text-muted">
          {story.ageMin}~{story.ageMax}세
        </p>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {moralKeywords(story.morals, 2).map((moral) => (
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
