"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getStoryById, stories } from "@/data/stories";
import BottomNav from "@/components/BottomNav";

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const story = getStoryById(params.id as string);
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  if (!story) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <p className="text-5xl mb-4">😢</p>
        <p className="text-muted text-lg">동화를 찾을 수 없어요</p>
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

  // 추천 동화 (같은 교훈 중 다른 동화)
  const related = stories
    .filter(
      (s) =>
        s.id !== story.id && s.morals.some((m) => story.morals.includes(m))
    )
    .slice(0, 4);

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition text-lg"
          >
            ←
          </button>
          <h1 className="font-bold text-sm truncate max-w-[200px]">
            {story.title}
          </h1>
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition text-lg"
          >
            {bookmarked ? "❤️" : "🤍"}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Hero image */}
        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
          <img
            src={story.thumbnailUrl}
            alt={story.title}
            className="w-full h-full object-cover"
          />
          {story.isPremium && (
            <span className="absolute top-4 left-4 bg-accent text-xs font-bold px-3 py-1 rounded-full shadow">
              PRO
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="px-5 -mt-6 relative z-10">
          {/* Title & meta */}
          <div className="mb-4">
            <h1 className="text-2xl font-extrabold mb-2">{story.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted bg-white px-2.5 py-1 rounded-lg border border-gray-100">
                {story.ageMin}~{story.ageMax}세
              </span>
              <span className="text-xs text-muted bg-white px-2.5 py-1 rounded-lg border border-gray-100">
                ⏱️ {story.durationMin}분
              </span>
              {story.morals.map((moral) => (
                <span
                  key={moral}
                  className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-lg font-semibold"
                >
                  {moral}
                </span>
              ))}
            </div>
          </div>

          {/* Moral box */}
          <div className="bg-white rounded-2xl p-4 mb-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-xs text-muted mb-1.5 flex items-center gap-1">
              💡 이 동화의 교훈
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              이 동화를 통해{" "}
              <strong className="text-primary">
                {story.morals.join(", ")}
              </strong>
              의 소중함을 배울 수 있어요.
            </p>
          </div>

          {/* Play CTAs */}
          <div className="flex gap-3 mb-5">
            <Link
              href={`/player/${story.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl text-sm font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
            >
              ▶️ 바로 듣기
            </Link>
            <Link
              href={`/voices?storyId=${story.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white py-4 rounded-2xl text-sm font-bold hover:opacity-90 transition shadow-lg shadow-secondary/20"
            >
              🎧 목소리 선택
            </Link>
          </div>

          {/* Story content */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
            <h2 className="font-bold mb-3 flex items-center gap-1.5">
              📖 동화 전문
            </h2>
            <div className="text-sm text-gray-700 leading-[1.9] whitespace-pre-line">
              {expanded ? story.content : preview + "…"}
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-primary text-sm font-semibold hover:underline"
            >
              {expanded ? "접기 ▲" : "전문 보기 ▼"}
            </button>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="mb-8">
              <h2 className="font-bold text-lg mb-3">비슷한 동화</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
                {related.map((s) => (
                  <Link
                    key={s.id}
                    href={`/stories/${s.id}`}
                    className="min-w-[130px] w-[130px] bg-white rounded-xl shadow-sm border border-gray-50 overflow-hidden group"
                  >
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      <img
                        src={s.thumbnailUrl}
                        alt={s.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                        {s.title}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
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
