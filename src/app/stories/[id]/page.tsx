"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getStoryById, stories } from "@/data/stories";
import BottomNav from "@/components/BottomNav";
import { ChevronLeft, Heart, Play, Mic, FileText } from "@/components/Icon";
import { StoryCover } from "@/components/StoryCover";

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const story = getStoryById(params.id as string);
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  if (!story) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <p className="text-4xl mb-4 opacity-50">📚</p>
        <p className="text-foreground/80 text-base font-semibold">
          동화를 찾을 수 없어요
        </p>
        <Link
          href="/"
          className="inline-block mt-6 text-primary font-semibold hover:underline"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const paragraphs = story.content.split("\n\n");
  const preview = paragraphs.slice(0, 3).join("\n\n");

  const related = stories
    .filter(
      (s) =>
        s.id !== story.id && s.morals.some((m) => story.morals.includes(m))
    )
    .slice(0, 4);

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-foreground transition"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-sm truncate max-w-[200px] tracking-tight">
            {story.title}
          </h1>
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
              bookmarked
                ? "text-primary"
                : "text-muted hover:text-foreground hover:bg-surface"
            }`}
            aria-label={bookmarked ? "북마크 해제" : "북마크"}
          >
            <Heart size={20} filled={bookmarked} />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        <div className="relative aspect-[4/3] bg-surface-soft overflow-hidden">
          <StoryCover story={story} className="w-full h-full" />
          {story.isPremium && (
            <span className="absolute top-4 left-4 bg-foreground/90 text-background text-xs font-bold px-3 py-1 rounded-full tracking-wider backdrop-blur-sm">
              PRO
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="px-5 -mt-8 relative z-10">
          <div className="mb-5">
            <h1 className="text-2xl font-extrabold mb-2.5 tracking-tight">
              {story.title}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-foreground/70 bg-surface px-2.5 py-1 rounded-full border border-border">
                {story.ageMin}~{story.ageMax}세
              </span>
              <span className="text-xs text-foreground/70 bg-surface px-2.5 py-1 rounded-full border border-border tabular-nums">
                {story.durationMin}분
              </span>
              {story.morals.map((moral) => (
                <span
                  key={moral}
                  className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-semibold"
                >
                  {moral}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-4 mb-5">
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted font-bold mb-1.5">
              이 동화의 교훈
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              이 동화를 통해{" "}
              <strong className="text-primary">
                {story.morals.join(", ")}
              </strong>
              의 소중함을 배울 수 있어요.
            </p>
          </div>

          <div className="flex gap-2.5 mb-6">
            <Link
              href={`/player/${story.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl text-sm font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
            >
              <Play size={16} />
              바로 듣기
            </Link>
            <Link
              href={`/voices?storyId=${story.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white py-4 rounded-2xl text-sm font-bold hover:opacity-90 transition shadow-lg shadow-secondary/20"
            >
              <Mic size={16} filled />
              목소리 선택
            </Link>
          </div>

          <div className="card p-5 mb-7">
            <h2 className="font-bold mb-3 flex items-center gap-2 text-sm">
              <FileText size={16} className="text-muted" />
              동화 전문
            </h2>
            <div className="text-[15px] text-foreground/85 leading-[1.95] whitespace-pre-line">
              {expanded ? story.content : preview + "…"}
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-4 text-primary text-sm font-semibold hover:underline"
            >
              {expanded ? "접기 ▲" : "전문 보기 ▼"}
            </button>
          </div>

          {related.length > 0 && (
            <section className="mb-8">
              <h2 className="font-bold text-base mb-3.5 tracking-tight">비슷한 동화</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
                {related.map((s) => (
                  <Link
                    key={s.id}
                    href={`/stories/${s.id}`}
                    className="min-w-[130px] w-[130px] card card-interactive overflow-hidden group"
                  >
                    <div className="aspect-square bg-surface-soft overflow-hidden">
                      <StoryCover
                        story={s}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                        {s.title}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5 tabular-nums">
                        {s.durationMin}분
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
