"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, User, FileText, Refresh, ChevronDown } from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { VoiceAvatar } from "@/components/VoiceAvatar";
import { saveMyStory } from "@/lib/myStories";
import { useMyVoices } from "@/lib/useMyVoices";
import { defaultVoices, englishVoices } from "@/data/voices";

function Check({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12l5 5 9-11"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const plotPool = [
  "숲속에서 길을 잃은 아이가 동물 친구들의 도움으로 집을 찾아가는 이야기",
  "하늘을 날고 싶은 펭귄이 꿈을 이루는 이야기",
  "서로 싸우던 형제가 협동해서 보물을 찾는 이야기",
  "무서운 것이 많았던 아이가 용기를 내는 이야기",
  "달나라로 소풍 간 토끼가 겪는 신나는 모험",
  "말을 못 하던 인형이 하루 동안 살아나는 이야기",
  "비 오는 날 우산을 잃어버린 아이를 도와주는 구름 친구",
  "작은 씨앗이 큰 나무로 자라며 만나는 친구들",
];

const MAX_PLOT = 300;

export default function CreateStoryPage() {
  const router = useRouter();
  const { voices: clonedVoices } = useMyVoices();

  const [plot, setPlot] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("5");
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [storyLength, setStoryLength] = useState<"short" | "normal">("normal");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [exampleOffset, setExampleOffset] = useState(0);
  const [error, setError] = useState("");

  const [hasProfile, setHasProfile] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [defaultVoiceId, setDefaultVoiceId] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => {
        const u = d.user;
        if (u?.childName) {
          setChildName(u.childName);
          if (u.childAge) setChildAge(String(u.childAge));
          setHasProfile(true);
        }
        if (u?.defaultVoiceId) setDefaultVoiceId(u.defaultVoiceId);
      })
      .catch(() => {});
  }, []);

  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const baseVoices = language === "en" ? englishVoices : defaultVoices;
  const voiceOptions = [
    ...clonedVoices.map((v) => ({ id: v.id, name: v.name, emoji: v.emoji, mine: true })),
    ...baseVoices.map((v) => ({ id: v.id, name: v.name, emoji: v.emoji, mine: false })),
  ];
  const selectedOption = voiceOptions.find((o) => o.id === selectedVoice);

  // 선택된 목소리가 없거나 목록에 없으면 기본값으로
  useEffect(() => {
    const ids = voiceOptions.map((o) => o.id);
    if (!selectedVoice || !ids.includes(selectedVoice)) {
      setSelectedVoice(
        defaultVoiceId && ids.includes(defaultVoiceId)
          ? defaultVoiceId
          : clonedVoices[0]?.id ?? baseVoices[0].id
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceOptions.length, language, defaultVoiceId]);

  // 생성 중 페이지 이탈 방지
  useEffect(() => {
    if (!generating) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [generating]);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, []);

  const examples = [
    plotPool[exampleOffset % plotPool.length],
    plotPool[(exampleOffset + 1) % plotPool.length],
    plotPool[(exampleOffset + 2) % plotPool.length],
    plotPool[(exampleOffset + 3) % plotPool.length],
  ];

  const selectedVoiceName =
    voiceOptions.find((o) => o.id === selectedVoice)?.name || "내 목소리";

  const stages = [
    `${childName || "우리 아이"}를 위한 동화를 쓰고 있어요`,
    "동화에 그림을 그리고 있어요",
    `${selectedVoiceName} 목소리를 입히고 있어요`,
  ];

  const canGenerate = plot.trim().length >= 5;

  const handleGenerate = async () => {
    if (!canGenerate || generating) return;
    setError("");
    setGenerating(true);
    setStageIndex(0);
    stageTimer.current = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, stages.length - 1));
    }, 2800);

    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plot,
          childName,
          childAge,
          language,
          length: storyLength,
        }),
      });
      const data = await res.json();
      if (!data.story) {
        throw new Error(data.error || "동화 생성에 실패했어요.");
      }
      const saved = await saveMyStory(data.story);
      if (stageTimer.current) clearInterval(stageTimer.current);
      if (!saved) throw new Error("동화를 저장하지 못했어요.");
      try {
        localStorage.setItem("mvk.lastVoiceId", selectedVoice);
      } catch {
        // 무시
      }
      router.push(`/player/${saved.id}?voiceId=${selectedVoice}`);
    } catch (e) {
      if (stageTimer.current) clearInterval(stageTimer.current);
      setError(e instanceof Error ? e.message : "동화 생성에 실패했어요.");
      setGenerating(false);
    }
  };

  return (
    <>
      <PageHeader
        title="동화 만들기"
        subtitle="줄거리만 알려주면 AI가 동화로 만들어드려요"
      />

      <div className="max-w-[1120px] mx-auto px-5 lg:px-8 py-6 lg:grid lg:grid-cols-[60%_40%] lg:gap-6 lg:items-start">
        {/* 좌: 입력 */}
        <div>
          {/* 아이 정보 */}
          {hasProfile && !editProfile ? (
            <div className="card px-4 py-3 mb-3.5 flex items-center justify-between gap-3">
              <p className="text-sm text-foreground">
                <span className="font-bold">
                  {childName}
                  {childAge ? `(${childAge}세)` : ""}
                </span>
                의 이야기로 만들어요
              </p>
              <button
                onClick={() => setEditProfile(true)}
                className="text-[13px] font-semibold text-primary hover:underline shrink-0"
              >
                변경
              </button>
            </div>
          ) : (
            <div className="card p-4 mb-3.5">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <User size={16} className="text-muted" />
                  아이 정보
                  <span className="text-muted font-normal text-xs">(선택)</span>
                </h3>
                {hasProfile && (
                  <button
                    type="button"
                    onClick={() => setEditProfile(false)}
                    className="text-[13px] font-semibold text-primary hover:underline shrink-0"
                  >
                    완료
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="이름 (예: 지우)"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="flex-1 min-w-0 h-11 px-3.5 rounded-[10px] bg-background border border-border text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-[1.5px] focus:border-primary focus:ring-[3px] focus:ring-primary-light transition"
                />
                <div className="shrink-0 flex items-center h-11 rounded-[10px] bg-background border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setChildAge(String(Math.max(2, Number(childAge) - 1)))
                    }
                    className="w-9 h-full flex items-center justify-center text-muted hover:text-primary text-lg leading-none transition"
                    aria-label="나이 줄이기"
                  >
                    −
                  </button>
                  <span className="w-11 text-center text-sm font-semibold tabular-nums">
                    {childAge}세
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setChildAge(String(Math.min(8, Number(childAge) + 1)))
                    }
                    className="w-9 h-full flex items-center justify-center text-muted hover:text-primary text-lg leading-none transition"
                    aria-label="나이 늘리기"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 줄거리 */}
          <div className="card p-4 mb-3.5">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText size={16} className="text-muted" />
                어떤 이야기를 만들까요?
              </h3>
              <div className="flex gap-0.5 bg-surface-soft rounded-lg p-0.5 shrink-0">
                {(["ko", "en"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLanguage(l)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                      language === l ? "bg-primary text-white" : "text-muted"
                    }`}
                  >
                    {l === "ko" ? "한국어" : "English"}
                  </button>
                ))}
              </div>
            </div>
            {language === "en" && (
              <p className="text-[11px] text-secondary mb-2 font-medium">
                줄거리는 한국어로 적어도 영어 동화로 만들어드려요.
              </p>
            )}
            <textarea
              placeholder="줄거리를 자유롭게 적어주세요&#10;예: 숲속에서 길을 잃은 토끼가 친구들의 도움으로 집을 찾아가는 이야기"
              value={plot}
              onChange={(e) => setPlot(e.target.value.slice(0, MAX_PLOT))}
              className="w-full min-h-[160px] px-3.5 py-3 rounded-[10px] bg-background border border-border text-sm leading-relaxed resize-y text-foreground placeholder:text-muted/60 focus:outline-none focus:border-[1.5px] focus:border-primary focus:ring-[3px] focus:ring-primary-light transition"
            />
            <p className="text-right text-[11px] text-muted mt-1.5 tabular-nums">
              {plot.length} / {MAX_PLOT}자
            </p>
          </div>

          {/* 추천 줄거리 칩 */}
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setPlot(ex.slice(0, MAX_PLOT))}
                className="text-left text-[13px] px-3.5 py-2 rounded-full border border-border bg-surface text-[var(--text-body)] hover:border-primary hover:text-primary transition"
              >
                {ex}
              </button>
            ))}
            <button
              onClick={() => setExampleOffset((o) => (o + 4) % plotPool.length)}
              className="text-[13px] px-3.5 py-2 rounded-full border border-dashed border-border-strong text-muted hover:text-primary hover:border-primary transition inline-flex items-center gap-1.5"
            >
              <Refresh size={14} />
              다른 줄거리
            </button>
          </div>
        </div>

        {/* 우: 설정 + 실행 */}
        <div className="mt-4 lg:mt-0 lg:sticky lg:top-20 space-y-3.5">
          {/* 목소리 */}
          <div className="card p-4">
            <h3 className="font-bold text-sm mb-2.5">들려줄 목소리</h3>
            <div className="relative">
              <button
                type="button"
                onClick={() => setVoiceMenuOpen((v) => !v)}
                className="w-full h-12 pl-2.5 pr-3 rounded-[10px] bg-background border border-border hover:border-border-strong flex items-center gap-2.5 text-left transition"
              >
                <VoiceAvatar emoji={selectedOption?.emoji} size={30} />
                <span className="flex-1 min-w-0 text-sm font-semibold truncate">
                  {selectedOption?.name || "목소리 선택"}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-muted transition-transform ${
                    voiceMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {voiceMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setVoiceMenuOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-surface border border-border rounded-xl shadow-lg py-1.5 max-h-72 overflow-y-auto">
                    {clonedVoices.length > 0 && (
                      <p className="px-3 pt-1 pb-1 text-[11px] font-bold text-muted uppercase tracking-wider">
                        내 목소리
                      </p>
                    )}
                    {[...clonedVoices, ...baseVoices].map((v, idx) => {
                      const active = selectedVoice === v.id;
                      const firstBase = idx === clonedVoices.length;
                      return (
                        <div key={v.id}>
                          {firstBase && (
                            <p className="px-3 pt-2 pb-1 text-[11px] font-bold text-muted uppercase tracking-wider">
                              기본 목소리
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVoice(v.id);
                              setVoiceMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                              active ? "bg-primary-light" : "hover:bg-surface-soft"
                            }`}
                          >
                            <VoiceAvatar emoji={v.emoji} size={28} />
                            <span
                              className={`flex-1 min-w-0 text-sm truncate ${
                                active
                                  ? "font-bold text-primary"
                                  : "font-medium"
                              }`}
                            >
                              {v.name}
                            </span>
                            {active && (
                              <span className="text-primary shrink-0">
                                <Check size={15} />
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 이야기 길이 */}
          <div className="card p-4">
            <h3 className="font-bold text-sm mb-2.5">이야기 길이</h3>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "short", label: "짧게", sub: "약 3분" },
                  { id: "normal", label: "보통", sub: "약 5분" },
                ] as const
              ).map((opt) => {
                const active = storyLength === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setStoryLength(opt.id)}
                    className={`py-2.5 rounded-xl border text-center transition ${
                      active
                        ? "bg-primary-light border-[1.5px] border-primary"
                        : "bg-surface border-border hover:border-border-strong"
                    }`}
                  >
                    <span className="block text-sm font-bold">{opt.label}</span>
                    <span className="block text-[11px] text-muted tabular-nums">
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 실행 카드 */}
          <div className="relative overflow-hidden rounded-2xl bg-primary-light border border-primary/15 p-4">
            <svg
              viewBox="0 0 300 200"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden
            >
              <circle cx="34" cy="26" r="2" fill="#F4C566">
                {generating && (
                  <animate
                    attributeName="opacity"
                    values="0.4;1;0.4"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              <circle cx="258" cy="38" r="1.6" fill="#F4C566" opacity="0.9">
                {generating && (
                  <animate
                    attributeName="opacity"
                    values="1;0.4;1"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              <circle cx="180" cy="150" r="1.8" fill="#6E5FD6" opacity="0.35">
                {generating && (
                  <animate
                    attributeName="opacity"
                    values="0.2;0.5;0.2"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            </svg>

            <div className="relative z-10">
              {generating ? (
                <div className="py-2 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 border-2 border-primary/25 border-t-primary rounded-full animate-spin" />
                  <p className="text-foreground font-bold text-[15px] mb-1">
                    {stages[stageIndex]}
                  </p>
                  <p className="text-[12px] text-[var(--text-body)]">
                    조금만 기다려 주세요…
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="w-full h-12 rounded-xl bg-[var(--star)] text-[var(--night)] font-extrabold text-[15px] shadow-md shadow-[#C99A2E]/30 hover:brightness-[1.05] active:brightness-95 transition disabled:bg-white disabled:text-muted disabled:border disabled:border-border disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} filled />
                    동화 만들기
                  </button>
                  <p className="text-center text-[11px] text-[var(--text-body)] mt-3">
                    {canGenerate
                      ? "약 30초~1분 정도 걸려요"
                      : "줄거리를 입력하면 만들 수 있어요"}
                  </p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25">
              <p className="text-xs text-danger leading-relaxed">{error}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
