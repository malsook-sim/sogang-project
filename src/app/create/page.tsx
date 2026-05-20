"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Sparkles,
  User,
  FileText,
  Refresh,
  Play,
} from "@/components/Icon";
import { saveMyStory, type GeneratedStory } from "@/lib/myStories";

const plotExamples = [
  "숲속에서 길을 잃은 아이가 동물 친구들의 도움으로 집을 찾아가는 이야기",
  "하늘을 날고 싶은 펭귄이 꿈을 이루는 이야기",
  "서로 싸우던 형제가 협동해서 보물을 찾는 이야기",
  "무서운 것이 많았던 아이가 용기를 내는 이야기",
];

export default function CreateStoryPage() {
  const router = useRouter();
  const [plot, setPlot] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("5");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedStory | null>(null);
  const [source, setSource] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const handleSave = async () => {
    if (savedId || !result) return;
    const saved = await saveMyStory(result);
    if (saved) setSavedId(saved.id);
    else setError("동화를 저장하지 못했어요. 다시 시도해 주세요.");
  };

  const handleListen = async () => {
    if (!result) return;
    let id = savedId;
    if (!id) {
      const saved = await saveMyStory(result);
      if (!saved) {
        setError("동화를 저장하지 못했어요. 다시 시도해 주세요.");
        return;
      }
      id = saved.id;
      setSavedId(id);
    }
    router.push(`/voices?storyId=${id}`);
  };

  const resetForm = () => {
    setResult(null);
    setSource("");
    setPlot("");
    setExpanded(false);
    setSavedId(null);
  };

  const handleGenerate = async () => {
    if (plot.trim().length < 5) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plot, childName, childAge }),
      });
      const data = await res.json();
      if (data.story) {
        setResult(data.story);
        setSource(data.source);
      } else {
        setError(data.error || "동화 생성에 실패했어요. 다시 시도해주세요.");
      }
    } catch {
      setError("동화 생성에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-lg lg:max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-foreground transition"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-sm tracking-tight">동화 만들기</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg lg:max-w-3xl mx-auto px-5 py-6">
        {!result ? (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-secondary-light text-secondary flex items-center justify-center">
                <Sparkles size={24} filled />
              </div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted font-semibold mb-2">
                AI Story Maker
              </p>
              <h2 className="text-xl font-extrabold mb-2 tracking-tight">
                우리 아이만의 동화를 만들어요
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                간단한 줄거리만 알려주시면<br />
                AI가 따뜻한 동화로 만들어드려요
              </p>
            </div>

            <div className="card p-5 mb-3.5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <User size={16} className="text-muted" />
                아이 정보
                <span className="text-muted font-normal text-xs">(선택)</span>
              </h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] text-muted mb-1 block">이름</label>
                  <input
                    type="text"
                    placeholder="예: 지우"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-soft text-sm focus:outline-none focus:border-primary focus:bg-surface transition"
                  />
                </div>
                <div className="w-24">
                  <label className="text-[11px] text-muted mb-1 block">나이</label>
                  <select
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-soft text-sm focus:outline-none focus:border-primary transition"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((age) => (
                      <option key={age} value={age}>
                        {age}세
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card p-5 mb-5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <FileText size={16} className="text-muted" />
                어떤 이야기를 만들까요?
              </h3>
              <textarea
                placeholder="줄거리를 자유롭게 적어주세요&#10;예: 숲속에서 길을 잃은 토끼가 친구들의 도움으로 집을 찾아가는 이야기"
                value={plot}
                onChange={(e) => setPlot(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface-soft text-sm leading-relaxed resize-none focus:outline-none focus:border-primary focus:bg-surface transition"
              />
              <p className="text-right text-[11px] text-muted mt-1.5 tabular-nums">
                {plot.length}자
              </p>
            </div>

            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.15em] text-muted font-bold mb-3 pl-1">
                이런 줄거리는 어때요?
              </p>
              <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2">
                {plotExamples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPlot(example)}
                    className={`text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                      plot === example
                        ? "bg-primary-light border-primary text-primary font-medium"
                        : "bg-surface border-border text-foreground/75 hover:border-border-strong"
                    }`}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3.5 rounded-xl bg-danger/10 border border-danger/25">
                <p className="text-[13px] font-bold text-danger mb-0.5">
                  동화를 만들 수 없어요
                </p>
                <p className="text-xs text-danger/85 leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || plot.trim().length < 5}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary-dark transition shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  동화를 만들고 있어요...
                </>
              ) : (
                <>
                  <Sparkles size={18} filled />
                  동화 만들기
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted font-semibold mb-2">
                Your Story
              </p>
              <h2 className="text-2xl font-extrabold mb-3 tracking-tight">
                {result.title}
              </h2>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <span className="text-xs text-foreground/70 bg-surface px-2.5 py-1 rounded-full border border-border">
                  {result.ageMin}~{result.ageMax}세
                </span>
                {result.morals.map((m) => (
                  <span
                    key={m}
                    className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-semibold"
                  >
                    {m}
                  </span>
                ))}
                {source === "fallback" && (
                  <span className="text-[10px] bg-accent-light text-accent px-2 py-0.5 rounded-full font-semibold">
                    DEMO
                  </span>
                )}
              </div>
            </div>

            <div className="card p-6 mb-5">
              <div className="text-[15px] text-foreground/85 leading-[1.95] whitespace-pre-line">
                {expanded
                  ? result.content
                  : result.content.split("\n\n").slice(0, 3).join("\n\n") + "…"}
              </div>
              {result.content.split("\n\n").length > 3 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-4 text-primary text-sm font-semibold hover:underline"
                >
                  {expanded ? "접기 ▲" : "동화 전체 보기 ▼"}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleListen}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Play size={18} filled />
                목소리 골라 듣기
              </button>
              <button
                onClick={handleSave}
                disabled={savedId !== null}
                className="w-full py-3.5 rounded-2xl border border-primary text-primary font-semibold text-sm hover:bg-primary-light transition disabled:border-border disabled:text-muted disabled:hover:bg-transparent"
              >
                {savedId ? "내 서재에 저장했어요" : "이 동화 저장하기"}
              </button>
              <button
                onClick={resetForm}
                className="w-full py-3.5 rounded-2xl border border-border font-semibold text-sm hover:bg-surface transition flex items-center justify-center gap-1.5"
              >
                <Refresh size={16} />
                다른 동화 만들기
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-2xl text-muted text-sm hover:text-foreground transition"
              >
                홈으로 돌아가기
              </button>
            </div>
          </>
        )}
      </div>

    </>
  );
}
