"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, User, FileText, Refresh } from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { saveMyStory } from "@/lib/myStories";

// 섹션 제목 아이콘 배지 — primary-soft 원 + primary 아이콘 (라이트/다크 토큰 자동 대응)
function TileIcon({ children }: { children: ReactNode }) {
  return (
    <span className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center shrink-0 text-primary">
      {children}
    </span>
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

  const [plot, setPlot] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("5");
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [storyLength, setStoryLength] = useState<"short" | "normal">("normal");
  const [exampleOffset, setExampleOffset] = useState(0);
  const [error, setError] = useState("");

  const [hasProfile, setHasProfile] = useState(false);
  const [editProfile, setEditProfile] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
      })
      .catch(() => {});
  }, []);

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

  const stages = [
    `${childName || "우리 아이"}를 위한 동화를 쓰고 있어요`,
    "동화에 그림을 그리고 있어요",
    "동화를 예쁘게 마무리하고 있어요",
  ];

  const canGenerate = plot.trim().length >= 5;

  // 예시 칩 탭 → 줄거리 채우고 텍스트영역 포커스
  const fillPlot = (text: string) => {
    setPlot(text.slice(0, MAX_PLOT));
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

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
      // 완성되면 상세 화면으로 (목소리는 거기서 고름)
      router.push(`/stories/${saved.id}`);
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

      {/* 단일 컬럼 센터 — 위에서 아래로 한 방향 진행 */}
      <div className="max-w-[720px] mx-auto px-5 py-6 space-y-4">
        {/* 1. 아이 프로필 바 */}
        {hasProfile && !editProfile ? (
          <div className="card relative overflow-hidden px-4 py-3 flex items-center justify-between gap-3">
            <svg
              width="26"
              height="9"
              viewBox="0 0 26 9"
              className="absolute right-2 top-1 pointer-events-none opacity-70"
              aria-hidden
            >
              <path
                d="M5 1.5 l0.8 1.7 1.7 0.8 -1.7 0.8 -0.8 1.7 -0.8 -1.7 -1.7 -0.8 1.7 -0.8z"
                fill="var(--star)"
              />
              <circle cx="20" cy="4" r="1.2" fill="var(--star)" opacity="0.8" />
            </svg>
            <p className="text-sm text-foreground">
              <span className="font-bold">
                {childName}
                {childAge ? `(${childAge}세)` : ""}
              </span>
              의 이야기로 만들어요
            </p>
            <button
              onClick={() => setEditProfile(true)}
              className="relative text-[13px] font-semibold text-[var(--primary-deep)] hover:underline shrink-0"
            >
              변경
            </button>
          </div>
        ) : (
          <div className="card p-4">
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
                  className="text-[13px] font-semibold text-[var(--primary-deep)] hover:underline shrink-0"
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
                className="flex-1 min-w-0 h-11 px-3.5 rounded-[10px] bg-field border border-border text-sm text-foreground placeholder:text-[var(--muted-soft)] focus:outline-none focus:border-[1.5px] focus:border-primary focus:ring-[3px] focus:ring-primary-light transition"
              />
              <div className="shrink-0 flex items-center h-11 rounded-[10px] bg-field border border-border overflow-hidden">
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

        {/* 2. 줄거리 입력 카드 — textarea + 글자수 + 예시 칩까지 한 덩어리 */}
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <TileIcon>
                <FileText size={15} />
              </TileIcon>
              어떤 이야기를 만들까요?
            </h3>
            {/* 언어 미니 토글 */}
            <div className="flex gap-0.5 bg-field border border-border rounded-lg p-0.5 shrink-0">
              {(["ko", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                    language === l
                      ? "bg-primary text-white"
                      : "text-[var(--muted)] hover:text-foreground"
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
            ref={textareaRef}
            placeholder="줄거리를 자유롭게 적어주세요&#10;예: 숲속에서 길을 잃은 토끼가 친구들의 도움으로 집을 찾아가는 이야기"
            value={plot}
            onChange={(e) => setPlot(e.target.value.slice(0, MAX_PLOT))}
            className="w-full min-h-[150px] px-3.5 py-3 rounded-[10px] bg-field border border-border text-sm leading-relaxed resize-y text-foreground placeholder:text-[var(--muted-soft)] focus:outline-none focus:border-[1.5px] focus:border-primary focus:ring-[3px] focus:ring-primary-light transition"
          />
          <p className="text-right text-[11px] text-muted mt-1.5 tabular-nums">
            {plot.length} / {MAX_PLOT}자
          </p>

          {/* 예시 칩 — 박스로 감싸 아래에, 줄바꿈으로 전부 보이게 (가로 스크롤 X) */}
          <div className="mt-3 rounded-xl bg-background border border-border p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[11px] font-bold text-muted">
                이런 이야기는 어때요?
              </p>
              <button
                type="button"
                onClick={() =>
                  setExampleOffset((o) => (o + 4) % plotPool.length)
                }
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted hover:text-primary transition shrink-0"
              >
                <Refresh size={13} />
                다른 줄거리
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => fillPlot(ex)}
                  className="text-left inline-flex items-start gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border text-[13px] leading-snug text-[var(--text-body)] hover:border-[var(--primary-deep)] transition"
                >
                  <Sparkles
                    size={13}
                    filled
                    className="text-[var(--star)] shrink-0 mt-0.5"
                  />
                  <span>{ex}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. 이야기 길이 — 카드 없이 라벨 + 세그먼트 컨트롤 한 줄 */}
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-sm font-bold text-foreground">이야기 길이</span>
          <div className="flex gap-1 bg-field border border-border rounded-xl p-1 shrink-0">
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
                  type="button"
                  onClick={() => setStoryLength(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${
                    active
                      ? "bg-primary text-white font-bold"
                      : "text-[var(--text-body)] hover:text-foreground"
                  }`}
                >
                  {opt.label}
                  <span className="tabular-nums opacity-75"> {opt.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. CTA — 전체 폭, 흐름의 끝 */}
        <div className="pt-1">
          {generating ? (
            <>
              <button
                type="button"
                disabled
                className="w-full h-14 rounded-[14px] bg-primary text-white font-bold text-[15px] flex items-center justify-center gap-2 cursor-wait opacity-90"
              >
                <span className="w-5 h-5 shrink-0 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span className="truncate">{stages[stageIndex]}</span>
              </button>
              <p className="text-center text-[12px] text-muted mt-2.5">
                동화를 만들고 있어요 · 30초 정도 걸려요
              </p>
            </>
          ) : (
            <>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`w-full h-14 rounded-[14px] font-extrabold text-[15px] transition flex items-center justify-center gap-2 ${
                  canGenerate
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "bg-field text-muted cursor-not-allowed"
                }`}
              >
                {canGenerate && (
                  <span className="flex">
                    <Sparkles size={18} filled />
                  </span>
                )}
                동화 만들기
              </button>
              <p className="text-center text-[12px] text-muted mt-2.5">
                {canGenerate
                  ? "약 30초~1분 정도 걸려요"
                  : "줄거리를 입력하면 만들 수 있어요"}
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25">
            <p className="text-xs text-danger leading-relaxed">{error}</p>
          </div>
        )}
      </div>
    </>
  );
}
