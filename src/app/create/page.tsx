"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Moon, User, FileText, Refresh } from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import BrandLoader from "@/components/BrandLoader";
import { saveMyStory } from "@/lib/myStories";
import { targetMinutes } from "@/lib/duration";

// 섹션 제목 아이콘 배지 — primary-soft 원 + primary 아이콘 (라이트/다크 토큰 자동 대응)
function TileIcon({ children }: { children: ReactNode }) {
  return (
    <span className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center shrink-0 text-primary">
      {children}
    </span>
  );
}

// 세그먼트 컨트롤 — 트랙 primary-soft pill, 선택 primary+흰색, 높이 34px
function Segment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; sub?: string; moon?: boolean }[];
}) {
  return (
    <div className="seg-track flex items-center gap-0.5 rounded-full p-0.5 h-[34px] shrink-0">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`h-full inline-flex items-center gap-1 px-3 rounded-full text-xs whitespace-nowrap transition-colors ${
              active
                ? "bg-primary text-white font-bold"
                : "text-[var(--text-body)] hover:text-foreground"
            }`}
          >
            {/* 밤 모드 + "밤 이야기" 선택 시에만 달 아이콘(골드) — CSS로 낮 모드 숨김 */}
            {opt.moon && active && (
              <span className="seg-moon">
                <Moon size={13} filled />
              </span>
            )}
            {opt.label}
            {opt.sub && (
              <span className="tabular-nums opacity-75">{opt.sub}</span>
            )}
          </button>
        );
      })}
    </div>
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
  return (
    <Suspense>
      <CreateStoryContent />
    </Suspense>
  );
}

function CreateStoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sequelId = searchParams.get("sequel");
  const [sequelOf, setSequelOf] = useState<{
    id: string; // 직전 편 id (parentStoryId)
    title: string;
    content: string;
    seriesTitle: string; // 시리즈명 (= 1편 제목)
    episodeNo: number; // 이번에 만들 편 번호
    // 지금까지의 편(제목 + 줄거리 요약 + 새로 생긴 사실) — 문맥용
    episodes: { title: string; episodeSummary?: string; newFacts?: string[] }[];
  } | null>(null);

  const [plot, setPlot] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("5");
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [storyLength, setStoryLength] = useState<"short" | "normal">("normal");
  const [mood, setMood] = useState<"bedtime" | "day">("bedtime");
  const [exampleOffset, setExampleOffset] = useState(0);
  const [error, setError] = useState("");

  const [hasProfile, setHasProfile] = useState(false);
  const [editProfile, setEditProfile] = useState(false);

  const [generating, setGenerating] = useState(false);
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

  // 분위기 기본값 — 현재 시각 기준 자동 선택(밤 18시~아침 7시 → 밤 이야기)
  // 마운트 후 설정해 SSR 하이드레이션 불일치 방지
  useEffect(() => {
    const h = new Date().getHours();
    setMood(h >= 18 || h < 7 ? "bedtime" : "day");
  }, []);

  // 후속편 모드: 직전 편 + 시리즈 문맥(이전 편 제목·요약) 불러오기
  useEffect(() => {
    if (!sequelId) return;
    let alive = true;
    (async () => {
      const pd = await fetch(`/api/stories/${sequelId}`)
        .then((r) => (r.ok ? r.json() : { story: null }))
        .catch(() => ({ story: null }));
      const parent = pd.story;
      if (!parent || !alive) return;

      // 시리즈에 속하면 형제 편들을 모아 문맥 구성, 아니면 이 편이 1편이 됨
      type Ep = { title: string; episodeSummary?: string; newFacts?: string[] };
      let episodes: Ep[] = [];
      let seriesTitle: string = parent.title;
      if (parent.seriesId) {
        const md = await fetch("/api/my-stories")
          .then((r) => (r.ok ? r.json() : { stories: [] }))
          .catch(() => ({ stories: [] }));
        const sibs = (md.stories || [])
          .filter((s: { seriesId?: string | null }) => s.seriesId === parent.seriesId)
          .sort(
            (a: { episodeNo?: number }, b: { episodeNo?: number }) =>
              (a.episodeNo ?? 1) - (b.episodeNo ?? 1)
          );
        episodes = sibs.map(
          (s: { title: string; episodeSummary?: string; newFacts?: string[] }) => ({
            title: s.title,
            episodeSummary: s.episodeSummary ?? undefined,
            newFacts: s.newFacts,
          })
        );
        seriesTitle = parent.seriesTitle || parent.title;
      } else {
        episodes = [
          {
            title: parent.title,
            episodeSummary: parent.episodeSummary ?? undefined,
            newFacts: parent.newFacts,
          },
        ];
      }
      if (!alive) return;
      setSequelOf({
        id: parent.id,
        title: parent.title,
        content: parent.content,
        seriesTitle,
        episodeNo: (parent.episodeNo ?? 1) + 1,
        episodes,
      });
    })();
    return () => {
      alive = false;
    };
  }, [sequelId]);

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

  const examples = [
    plotPool[exampleOffset % plotPool.length],
    plotPool[(exampleOffset + 1) % plotPool.length],
    plotPool[(exampleOffset + 2) % plotPool.length],
    plotPool[(exampleOffset + 3) % plotPool.length],
  ];

  const canGenerate = sequelOf ? true : plot.trim().length >= 5;

  // 예시 칩 탭 → 줄거리 채우고 텍스트영역 포커스
  const fillPlot = (text: string) => {
    setPlot(text.slice(0, MAX_PLOT));
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleGenerate = async () => {
    if (!canGenerate || generating) return;
    setError("");
    setGenerating(true);

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
          mood,
          // 직전 편 전문(마지막 편) — 4000자까지 문맥으로 사용
          previousStory: sequelOf
            ? { title: sequelOf.title, content: sequelOf.content }
            : undefined,
          // 시리즈 문맥 — 전편 제목·요약 목록 + 이번 편 번호(제목은 AI가 새로 지음)
          series: sequelOf
            ? {
                title: sequelOf.seriesTitle,
                episodeNo: sequelOf.episodeNo,
                episodes: sequelOf.episodes,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!data.story) {
        throw new Error(data.error || "동화 생성에 실패했어요.");
      }
      // 제목은 AI가 지은 고유 제목 그대로 사용 (" 2" 붙이지 않음).
      // 시리즈 연결은 parentStoryId로 서버가 처리.
      const saved = await saveMyStory(data.story, sequelOf?.id ?? null);
      if (!saved) throw new Error("동화를 저장하지 못했어요.");
      // 완성되면 상세 화면으로 (목소리는 거기서 고름)
      router.push(`/stories/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "동화 생성에 실패했어요.");
      setGenerating(false);
    }
  };

  return (
    <>
      {generating && <BrandLoader text="동화를 만들고 있어요" />}
      <PageHeader
        title="동화 만들기"
        subtitle="줄거리만 알려주면 AI가 동화로 만들어드려요"
      />

      {/* 단일 컬럼 센터 — 위에서 아래로 한 방향 진행 */}
      <div className="max-w-[720px] mx-auto px-5 py-6 space-y-4">
        {/* 이어서 만들기 모드 — 원작 카드 */}
        {sequelOf && (
          <div className="card p-4 flex items-center gap-3 border-primary/30 bg-primary-light/50">
            <span className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Sparkles size={18} filled />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-primary">이어서 만들기</p>
              <p className="text-sm font-bold truncate">
                &lsquo;{sequelOf.title}&rsquo;의 다음 이야기
              </p>
            </div>
          </div>
        )}

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
              <span className="font-bold">{childName}</span>
              {(() => {
                const c = childName.charCodeAt(childName.length - 1);
                const hasB =
                  c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
                return hasB ? "이" : "가";
              })()}{" "}
              주인공인 이야기를 만들어요
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
            placeholder={
              sequelOf
                ? "다음 이야기에서 무슨 일이 일어날까요?\n비워두면 AI가 이어서 상상해요"
                : "줄거리를 자유롭게 적어주세요\n예: 숲속에서 길을 잃은 토끼가 친구들의 도움으로 집을 찾아가는 이야기"
            }
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

        {/* 3. 옵션 + CTA 한 카드 — 줄거리 카드와 동일한 surface+border, radius 12px */}
        <div>
          <div className="bg-surface border border-border rounded-[12px] shadow-sm p-4">
            {/* 이야기 길이 */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-foreground">
                이야기 길이
              </span>
              <Segment
                value={storyLength}
                onChange={setStoryLength}
                options={[
                  { id: "short", label: "짧게", sub: ` 약 ${targetMinutes("short")}분` },
                  { id: "normal", label: "보통", sub: ` 약 ${targetMinutes("normal")}분` },
                ]}
              />
            </div>

            {/* 분위기 — 기본값 현재 시각 기준 자동 선택 */}
            <div className="flex items-center justify-between gap-3 mt-3">
              <span className="text-sm font-bold text-foreground">분위기</span>
              <Segment
                value={mood}
                onChange={setMood}
                options={[
                  { id: "bedtime", label: "밤 이야기", moon: true },
                  { id: "day", label: "낮 이야기" },
                ]}
              />
            </div>

            {/* 구분선 */}
            <div className="border-t border-border my-3.5" />

            {/* 동화 만들기 버튼 — 카드 내부 풀폭, 높이 52px */}
            {generating ? (
              <button
                type="button"
                disabled
                className="cta-loading w-full h-[52px] rounded-[12px] font-bold text-[15px] flex items-center justify-center gap-2 cursor-wait"
              >
                <span className="w-5 h-5 shrink-0 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span className="truncate">동화를 만들고 있어요</span>
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`w-full h-[52px] rounded-[12px] font-bold text-[15px] flex items-center justify-center gap-2 transition-colors duration-200 ${
                  canGenerate
                    ? "cta-active cta-pop cursor-pointer"
                    : "cta-idle cursor-not-allowed"
                }`}
              >
                {canGenerate && (
                  <span className="cta-star flex">
                    <Sparkles size={18} filled />
                  </span>
                )}
                동화 만들기
              </button>
            )}
          </div>

          {/* 캡션 — 카드 아래 */}
          <p className="text-center text-[12px] text-muted mt-2.5">
            {generating
              ? "동화를 만들고 있어요 · 30초 정도 걸려요"
              : canGenerate
                ? "약 30초~1분 정도 걸려요"
                : "줄거리를 입력하면 만들 수 있어요"}
          </p>
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
