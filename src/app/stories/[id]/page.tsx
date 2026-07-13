"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCatalog, useCatalogLoaded } from "@/lib/useCatalog";
import { useMyStories, editMyStory, removeMyStory } from "@/lib/myStories";
import { useMyVoices } from "@/lib/useMyVoices";
import { toggleBookmark, useBookmarks } from "@/lib/bookmarks";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { getVoiceById, defaultVoices, englishVoices } from "@/data/voices";
import { Heart, Play, Pause, Pencil, Trash, Mic } from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { StoryCover } from "@/components/StoryCover";
import { VoiceAvatar } from "@/components/VoiceAvatar";
import { moralKeywords, moralCaption } from "@/lib/morals";
import { josa } from "@/lib/josa";

const MAX_CONTENT = 4000;

function shortDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function Kebab() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  );
}

export default function StoryDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const catalog = useCatalog();
  const catalogLoaded = useCatalogLoaded();
  const myStories = useMyStories();
  const bookmarks = useBookmarks();
  const { user } = useCurrentUser();
  const { voices: clonedVoices } = useMyVoices();

  const isMine = id.startsWith("my-");
  const story = isMine
    ? myStories.find((s) => s.id === id)
    : catalog.find((s) => s.id === id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastVoiceId, setLastVoiceId] = useState<string | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const previewReqRef = useRef(0);

  useEffect(() => {
    try {
      setLastVoiceId(localStorage.getItem("mvk.lastVoiceId"));
    } catch {
      setLastVoiceId(null);
    }
  }, []);

  // 목소리 팝업 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    if (!voiceModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [voiceModalOpen]);

  // 편집 textarea 자동 높이 확장
  useEffect(() => {
    if (editing && bodyRef.current) {
      bodyRef.current.style.height = "auto";
      bodyRef.current.style.height = bodyRef.current.scrollHeight + "px";
    }
  }, [editing, editContent]);

  if (!story) {
    const stillLoading = isMine ? myStories.length === 0 : !catalogLoaded;
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        {stillLoading ? (
          <p className="text-muted text-sm">동화를 불러오는 중...</p>
        ) : (
          <>
            <p className="text-foreground/80 text-base font-semibold">
              동화를 찾을 수 없어요
            </p>
            <Link
              href="/"
              className="inline-block mt-6 text-primary font-semibold hover:underline"
            >
              ← 홈으로 돌아가기
            </Link>
          </>
        )}
      </div>
    );
  }

  const bookmarked = bookmarks.includes(story.id);
  const paragraphs = story.content.split("\n\n").filter((p) => p.trim());
  const lang = /[가-힣]/.test(story.content) ? "ko" : "en";
  const keywords = moralKeywords(story.morals, 3);
  const summaryLines = moralCaption(story.morals, story.moralSummary, 2);

  // 마지막/기본 목소리 해석
  const clonedMatch = clonedVoices.find((v) => v.id === lastVoiceId);
  const baseMatch = lastVoiceId ? getVoiceById(lastVoiceId) : undefined;
  const lastVoice = clonedMatch
    ? { name: clonedMatch.name, emoji: clonedMatch.emoji }
    : baseMatch
    ? { name: baseMatch.name, emoji: baseMatch.emoji }
    : null;

  // 목소리 변경 팝업용 목록 (내 목소리 + 기본 목소리)
  const modalBaseVoices = lang === "en" ? englishVoices : defaultVoices;
  const mineVoices = clonedVoices.map((v) => ({
    id: v.id,
    name: v.name,
    emoji: v.emoji,
    mine: true,
    createdAt: v.createdAt,
    isDefault: v.isDefault,
  }));
  const baseVoices = modalBaseVoices.map((v) => ({
    id: v.id,
    name: v.name,
    emoji: v.emoji,
    mine: false,
    createdAt: null as number | null,
    isDefault: false,
  }));

  const stopPreview = () => {
    previewReqRef.current++;
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewId(null);
  };

  // 미리듣기: 샘플만 재생, 목소리 선택으로 처리하지 않음
  const previewVoice = async (vid: string) => {
    if (previewId === vid) {
      stopPreview();
      return;
    }
    stopPreview();
    const reqId = ++previewReqRef.current;
    setPreviewId(vid);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "안녕, 오늘은 어떤 이야기를 들려줄까?",
          voiceId: vid,
        }),
      });
      if (!res.ok || reqId !== previewReqRef.current) {
        if (reqId === previewReqRef.current) setPreviewId(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (reqId !== previewReqRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      previewUrlRef.current = url;
      audio.onended = () => reqId === previewReqRef.current && stopPreview();
      audio.play().catch(() => {});
    } catch {
      if (reqId === previewReqRef.current) setPreviewId(null);
    }
  };

  const closeVoiceSheet = () => {
    stopPreview();
    setVoiceModalOpen(false);
  };

  const pickVoice = (id: string) => {
    stopPreview();
    setLastVoiceId(id);
    try {
      localStorage.setItem("mvk.lastVoiceId", id);
    } catch {
      // 무시
    }
    setVoiceModalOpen(false);
  };

  // 시트 목소리 행 (선택 버튼 + 미리듣기 버튼)
  const renderVoiceRow = (v: (typeof baseVoices)[number]) => {
    const active = lastVoiceId === v.id;
    const isPreviewing = previewId === v.id;
    return (
      <div
        key={v.id}
        className={`flex items-center gap-2.5 rounded-xl pl-2.5 pr-2 py-2.5 border-[1.5px] transition ${
          active
            ? "bg-primary-light border-primary"
            : "border-transparent hover:bg-surface-soft"
        }`}
      >
        <button
          onClick={() => pickVoice(v.id)}
          className="flex-1 flex items-center gap-3 min-w-0 text-left"
        >
          <VoiceAvatar emoji={v.emoji} size={36} />
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-sm truncate ${
                  active ? "font-bold text-primary" : "font-medium"
                }`}
              >
                {v.name}
              </span>
              {v.isDefault && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                  style={{ background: "#F4C566", color: "#5C4400" }}
                >
                  기본
                </span>
              )}
            </span>
            {v.mine && v.createdAt && (
              <span className="block text-[11px] text-muted mt-0.5 tabular-nums">
                {shortDate(v.createdAt)} 녹음
              </span>
            )}
          </span>
          {active && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary shrink-0"
              aria-hidden
            >
              <path
                d="M5 12l5 5 9-11"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <button
          onClick={() => previewVoice(v.id)}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary-light text-primary hover:bg-primary hover:text-white transition"
          aria-label={isPreviewing ? "미리듣기 정지" : "미리듣기"}
        >
          {isPreviewing ? <Pause size={13} /> : <Play size={13} />}
        </button>
      </div>
    );
  };

  const playWithLast = () => {
    router.push(`/player/${story.id}?voiceId=${lastVoiceId}`);
  };

  const startEdit = () => {
    setEditTitle(story.title);
    setEditContent(story.content);
    setEditing(true);
    setMenuOpen(false);
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || saving) return;
    if (
      !confirm(
        "동화를 수정하면 만들어둔 오디오가 삭제되고, 다음 재생 때 새로 준비돼요. 저장할까요?"
      )
    )
      return;
    setSaving(true);
    await editMyStory(id, editTitle.trim(), editContent.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (!confirm("이 동화를 삭제할까요? 되돌릴 수 없어요.")) return;
    removeMyStory(id);
    router.push("/mypage");
  };

  return (
    <>
      <PageHeader
        title={editing ? "동화 수정" : story.title}
        truncateTitle
        onBack={() => (editing ? setEditing(false) : router.back())}
        containerClassName="max-w-5xl mx-auto px-5 lg:px-8"
        actions={
          !editing && (
            <>
              <button
                onClick={() => {
                  if (!user) {
                    router.push(`/login?next=/stories/${story.id}`);
                    return;
                  }
                  toggleBookmark(story.id);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 ${
                  bookmarked
                    ? "text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
                aria-label={bookmarked ? "북마크 해제" : "북마크"}
              >
                <Heart size={20} filled={bookmarked} />
              </button>
              {isMine && (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition"
                    aria-label="더보기"
                  >
                    <Kebab />
                  </button>
                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border rounded-xl shadow-lg py-1 z-50">
                        <button
                          onClick={startEdit}
                          className="w-full text-left px-3.5 py-2 text-[13px] hover:bg-surface-soft transition flex items-center gap-2"
                        >
                          <Pencil size={14} /> 수정하기
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full text-left px-3.5 py-2 text-[13px] text-danger hover:bg-danger/10 transition flex items-center gap-2"
                        >
                          <Trash size={14} /> 삭제하기
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )
        }
      />

      <div className="max-w-5xl mx-auto px-5 lg:px-8 pt-6 pb-[88px] lg:pb-6 lg:grid lg:grid-cols-[38%_1fr] lg:gap-8">
        {/* 좌: 표지 + 제목 + 태그 + 교훈 + CTA */}
        <div className="lg:sticky lg:top-24 lg:self-start mb-6 lg:mb-0">
          <div className="relative aspect-[4/3] lg:max-h-[40vh] rounded-2xl bg-surface-soft overflow-hidden mb-4">
            <StoryCover story={story} className="w-full h-full" />
            {story.isPremium && (
              <span className="absolute top-3 left-3 bg-[#F4C566] text-[#5C4400] text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                PRO
              </span>
            )}
          </div>

          {editing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full h-11 px-3.5 mb-3 rounded-[10px] bg-field border border-border text-[16px] font-bold text-foreground focus:outline-none focus:border-[1.5px] focus:border-primary focus:ring-[3px] focus:ring-primary-light transition"
            />
          ) : (
            <h2 className="text-2xl font-extrabold mb-2.5 tracking-tight">
              {story.title}
            </h2>
          )}

          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="text-xs text-foreground/70 bg-surface px-2.5 py-1 rounded-full border border-border">
              {story.ageMin}~{story.ageMax}세
            </span>
            <span className="text-xs text-foreground/70 bg-surface px-2.5 py-1 rounded-full border border-border tabular-nums">
              {story.durationMin}분
            </span>
            {keywords.map((m) => (
              <span
                key={m}
                className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-semibold"
              >
                {m}
              </span>
            ))}
          </div>

          {!editing && summaryLines.length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted font-bold mb-1.5">
                이 동화의 교훈
              </p>
              <div className="bg-primary-light rounded-xl px-4 py-3 space-y-1">
                {summaryLines.map((l, i) => (
                  <p
                    key={i}
                    className="text-[13px] text-[var(--primary-deep)] leading-relaxed"
                  >
                    {l}
                  </p>
                ))}
              </div>
            </div>
          )}

          {!editing && (
            <div className="hidden lg:block">
              {lastVoice ? (
                <div className="flex items-stretch gap-2">
                  <button
                    onClick={playWithLast}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl text-sm font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
                  >
                    <VoiceAvatar emoji={lastVoice.emoji} size={18} />
                    {lastVoice.name}
                    {josa(lastVoice.name, "으로", "로")} 듣기
                  </button>
                  <button
                    onClick={() => setVoiceModalOpen(true)}
                    className="shrink-0 px-4 rounded-2xl border border-border text-muted hover:text-primary hover:border-primary hover:bg-primary-light/40 transition flex flex-col items-center justify-center gap-0.5"
                    aria-label="목소리 바꾸기"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M4 7h13l-3-3M20 17H7l3 3"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[10px] font-bold">변경</span>
                  </button>
                </div>
              ) : clonedVoices.length === 0 ? (
                <>
                  <button
                    onClick={() => router.push("/record")}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl text-sm font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
                  >
                    <Mic size={16} filled />
                    목소리 녹음하고 듣기
                  </button>
                  <button
                    onClick={() => setVoiceModalOpen(true)}
                    className="w-full mt-2 text-[13px] text-muted hover:text-primary transition"
                  >
                    기본 목소리로 먼저 들어볼 수도 있어요
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setVoiceModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl text-sm font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
                >
                  <Play size={16} filled />
                  목소리 선택하고 듣기
                </button>
              )}
            </div>
          )}
        </div>

        {/* 우: 전문 or 편집 (본문 컬럼 최대 640px, 중앙 정렬) */}
        <div className="w-full lg:max-w-[640px] lg:mx-auto">
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted font-bold mb-3">
            동화 이야기
          </p>
          {editing ? (
            <>
              <textarea
                ref={bodyRef}
                value={editContent}
                onChange={(e) =>
                  setEditContent(e.target.value.slice(0, MAX_CONTENT))
                }
                className="w-full block rounded-xl bg-field border border-border text-[15px] lg:text-[16px] text-foreground/90 resize-none overflow-hidden focus:outline-none focus:border-[1.5px] focus:border-primary focus:ring-[3px] focus:ring-primary-light transition"
                style={{ lineHeight: 1.8, padding: 20, minHeight: 320 }}
              />
              <p className="text-right text-[11px] text-muted mt-1.5 tabular-nums">
                {editContent.length} / {MAX_CONTENT}자
              </p>
            </>
          ) : (
            <div className="space-y-4 pb-4">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-[15px] lg:text-[16px] text-foreground/85 leading-[1.95]"
                >
                  {p}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 모바일 하단 고정 듣기 바 (데스크탑은 좌측 sticky CTA 사용) */}
      {!editing && (
        <div
          className="lg:hidden fixed left-0 right-0 z-40 bottom-[calc(68px+env(safe-area-inset-bottom))] px-4 py-3"
          style={{
            background: "var(--background)",
            borderTop: "0.5px solid var(--border-strong)",
          }}
        >
          {lastVoice ? (
            <div className="flex items-center gap-2">
              <button
                onClick={playWithLast}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
              >
                <VoiceAvatar emoji={lastVoice.emoji} size={18} />
                {lastVoice.name}
                {josa(lastVoice.name, "으로", "로")} 듣기
              </button>
              <button
                onClick={() => setVoiceModalOpen(true)}
                className="shrink-0 text-sm font-semibold text-muted hover:text-primary px-3 transition"
              >
                변경
              </button>
            </div>
          ) : clonedVoices.length === 0 ? (
            <button
              onClick={() => router.push("/record")}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
            >
              <Mic size={16} filled />
              목소리 녹음하고 듣기
            </button>
          ) : (
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
            >
              <Play size={16} filled />
              목소리 선택하고 듣기
            </button>
          )}
        </div>
      )}

      {/* 편집 액션 바 (sticky bottom) */}
      {editing && (
        <div className="fixed lg:sticky left-0 right-0 bottom-[calc(68px+env(safe-area-inset-bottom))] lg:bottom-0 z-40 bg-background border-t border-border">
          <div className="max-w-5xl mx-auto px-5 lg:px-8 py-3 flex items-center justify-end gap-3 flex-wrap">
            <p className="text-[12px] text-[var(--text-body)] mr-auto sm:mr-0">
              저장하면 만들어둔 오디오가 새로 준비돼요
            </p>
            <button
              onClick={() => setEditing(false)}
              className="px-5 h-11 rounded-[10px] border border-border font-semibold text-sm hover:bg-surface transition"
            >
              취소
            </button>
            <button
              onClick={saveEdit}
              disabled={!editTitle.trim() || saving}
              className="px-6 h-11 rounded-[10px] bg-primary text-white font-bold text-sm hover:bg-primary-dark transition disabled:opacity-40"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      )}

      {/* 목소리 변경 팝업 (바텀시트/모달) */}
      {voiceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-[rgba(44,42,69,0.5)]"
            onClick={closeVoiceSheet}
          />
          <div className="relative z-10 w-full md:w-[480px] md:max-w-[calc(100vw-3rem)] bg-surface rounded-t-2xl md:rounded-2xl shadow-xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <p className="font-bold text-[15px]">어떤 목소리로 들을까요?</p>
              <button
                onClick={closeVoiceSheet}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-soft transition text-lg"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-2.5 py-2">
              {mineVoices.length > 0 && (
                <>
                  <p className="px-1.5 pt-1 pb-1.5 text-xs font-bold text-muted tracking-wide">
                    내 목소리
                  </p>
                  <div className="space-y-1.5 mb-3">
                    {mineVoices.map(renderVoiceRow)}
                  </div>
                </>
              )}
              <p className="px-1.5 pt-1 pb-1.5 text-xs font-bold text-muted tracking-wide">
                기본 목소리
              </p>
              <div className="space-y-1.5">{baseVoices.map(renderVoiceRow)}</div>
            </div>

            <button
              onClick={() => {
                stopPreview();
                router.push("/record");
              }}
              className="shrink-0 w-full py-3.5 text-[13px] font-semibold text-primary border-t border-border hover:bg-primary-light/40 transition"
            >
              새 목소리 녹음하기 →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
