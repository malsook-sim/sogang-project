"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface GeneratedStory {
  title: string;
  content: string;
  morals: string[];
  ageMin: number;
  ageMax: number;
}

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

  const handleGenerate = async () => {
    if (plot.trim().length < 5) return;
    setLoading(true);
    setResult(null);

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
      }
    } catch {
      alert("동화 생성에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="font-bold text-sm">동화 만들기</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6">
        {!result ? (
          <>
            {/* Intro */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">✨</div>
              <h2 className="text-xl font-extrabold mb-2">
                우리 아이만의 동화를 만들어요
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                간단한 줄거리를 알려주시면
                <br />
                AI가 따뜻한 동화로 만들어드려요
              </p>
            </div>

            {/* Child info */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                👶 아이 정보 <span className="text-muted font-normal">(선택)</span>
              </h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted mb-1 block">이름</label>
                  <input
                    type="text"
                    placeholder="예: 지우"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-muted mb-1 block">나이</label>
                  <select
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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

            {/* Plot input */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                📝 어떤 이야기를 만들까요?
              </h3>
              <textarea
                placeholder="줄거리를 자유롭게 적어주세요&#10;예: 숲속에서 길을 잃은 토끼가 친구들의 도움으로 집을 찾아가는 이야기"
                value={plot}
                onChange={(e) => setPlot(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-right text-[11px] text-muted mt-1">
                {plot.length}자
              </p>
            </div>

            {/* Plot examples */}
            <div className="mb-6">
              <p className="text-xs text-muted mb-2 font-semibold">
                💡 이런 줄거리는 어때요?
              </p>
              <div className="flex flex-col gap-2">
                {plotExamples.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPlot(example)}
                    className={`text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                      plot === example
                        ? "bg-primary-light border-primary text-primary font-medium"
                        : "bg-white border-gray-100 text-gray-600 hover:border-primary/30"
                    }`}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading || plot.trim().length < 5}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary-dark transition shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  동화를 만들고 있어요...
                </>
              ) : (
                <>✨ 동화 만들기</>
              )}
            </button>
          </>
        ) : (
          /* Result */
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📖</div>
              <h2 className="text-xl font-extrabold mb-1">{result.title}</h2>
              <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
                <span className="text-xs text-muted bg-white px-2.5 py-1 rounded-lg border border-gray-100">
                  {result.ageMin}~{result.ageMax}세
                </span>
                {result.morals.map((m) => (
                  <span
                    key={m}
                    className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-lg font-semibold"
                  >
                    {m}
                  </span>
                ))}
                {source === "fallback" && (
                  <span className="text-[10px] bg-accent-light text-yellow-700 px-2 py-0.5 rounded-lg">
                    더미 생성
                  </span>
                )}
              </div>
            </div>

            {/* Story text */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
              <div className="text-sm text-gray-700 leading-[1.9] whitespace-pre-line">
                {expanded
                  ? result.content
                  : result.content.split("\n\n").slice(0, 3).join("\n\n") + "…"}
              </div>
              {result.content.split("\n\n").length > 3 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-3 text-primary text-sm font-semibold hover:underline"
                >
                  {expanded ? "접기 ▲" : "전문 보기 ▼"}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                🎙️ 이 동화를 내 목소리로 듣기
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setPlot("");
                  setExpanded(false);
                }}
                className="w-full py-3.5 rounded-2xl border border-gray-200 font-semibold text-sm hover:bg-gray-50 transition"
              >
                🔄 다른 동화 만들기
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3.5 rounded-2xl text-muted text-sm hover:text-primary transition"
              >
                홈으로 돌아가기
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </>
  );
}
