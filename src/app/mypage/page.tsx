"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ListenCalendar from "@/components/ListenCalendar";
import { StoryCover } from "@/components/StoryCover";
import {
  User,
  Mic,
  Heart,
  Lock,
  FileText,
  Sliders,
  Sparkles,
  ChevronRight,
  Trash,
  Pencil,
} from "@/components/Icon";
import { VoiceCard } from "@/components/VoiceCard";
import { useMyVoices } from "@/lib/useMyVoices";
import { useCurrentUser, displayName } from "@/lib/useCurrentUser";
import { useBookmarks, toggleBookmark } from "@/lib/bookmarks";
import {
  useMyStories,
  removeMyStory,
  renameMyStory,
  type MyStory,
} from "@/lib/myStories";
import { type Story } from "@/data/stories";
import { useCatalog } from "@/lib/useCatalog";

export default function MyPage() {
  const { user, loading: authLoading, refresh: refreshUser } = useCurrentUser();
  const { voices, refresh: refreshVoices } = useMyVoices();
  const myStories = useMyStories();
  const catalog = useCatalog();
  const [showAllVoices, setShowAllVoices] = useState(false);
  const [openSeriesId, setOpenSeriesId] = useState<string | null>(null);
  // "다음 편 자동 재생" 설정 (localStorage, 기본 켬) — 플레이어 완료 화면 카운트다운에 사용
  const [autoplayNext, setAutoplayNext] = useState(true);
  useEffect(() => {
    try {
      setAutoplayNext(localStorage.getItem("mvk.autoplayNext") !== "0");
    } catch {
      // 무시
    }
  }, []);
  const toggleAutoplayNext = () => {
    setAutoplayNext((v) => {
      const nv = !v;
      try {
        localStorage.setItem("mvk.autoplayNext", nv ? "1" : "0");
      } catch {
        // 무시
      }
      return nv;
    });
  };

  // 내가 만든 동화를 시리즈 단위로 묶음 (시리즈는 카드 1개 = 1편 대표 + N편 배지)
  type MyEntry =
    | { kind: "single"; story: MyStory }
    | { kind: "series"; seriesId: string; title: string; episodes: MyStory[] };
  const myEntries = useMemo<MyEntry[]>(() => {
    const seen = new Set<string>();
    const out: MyEntry[] = [];
    for (const s of myStories) {
      if (s.seriesId) {
        if (seen.has(s.seriesId)) continue;
        seen.add(s.seriesId);
        const eps = myStories
          .filter((x) => x.seriesId === s.seriesId)
          .sort((a, b) => (a.episodeNo ?? 1) - (b.episodeNo ?? 1));
        out.push({
          kind: "series",
          seriesId: s.seriesId,
          title: eps[0]?.seriesTitle || eps[0]?.title || "시리즈",
          episodes: eps,
        });
      } else {
        out.push({ kind: "single", story: s });
      }
    }
    return out;
  }, [myStories]);
  const openSeries = myEntries.find(
    (e) => e.kind === "series" && e.seriesId === openSeriesId
  ) as Extract<MyEntry, { kind: "series" }> | undefined;

  // 우리 아이 정보 인라인 편집
  const [childOpen, setChildOpen] = useState(false);
  const [childNameInput, setChildNameInput] = useState("");
  const [childAgeInput, setChildAgeInput] = useState<number | null>(null);
  const [childGenderInput, setChildGenderInput] = useState<
    "boy" | "girl" | null
  >(null);
  const [savingChild, setSavingChild] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(""); // 설정 폼용 보호자 호칭

  // 보호자 호칭 인라인 편집 (계정 카드)
  const [nickOpen, setNickOpen] = useState(false);
  const [nickInput, setNickInput] = useState("");
  const [savingNick, setSavingNick] = useState(false);

  const startNickEdit = () => {
    setNickInput(user?.nickname ?? "");
    setNickOpen(true);
  };
  const saveNick = async () => {
    if (savingNick) return;
    setSavingNick(true);
    try {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickInput.trim() }),
      });
      await refreshUser();
      setNickOpen(false);
    } catch {
      // 무시
    } finally {
      setSavingNick(false);
    }
  };

  const toggleChildEdit = () => {
    if (childOpen) {
      setChildOpen(false);
      return;
    }
    setNicknameInput(user?.nickname ?? "");
    setChildNameInput(user?.childName ?? "");
    setChildAgeInput(user?.childAge ?? null);
    setChildGenderInput(
      user?.childGender === "boy" || user?.childGender === "girl"
        ? user.childGender
        : null
    );
    setChildOpen(true);
  };

  const saveChild = async () => {
    if (savingChild) return;
    setSavingChild(true);
    try {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nicknameInput.trim(),
          childName: childNameInput.trim(),
          childAge: childAgeInput ?? "",
          childGender: childGenderInput ?? "",
        }),
      });
      await refreshUser();
      setChildOpen(false);
    } catch {
      // 저장 실패해도 조용히 무시
    } finally {
      setSavingChild(false);
    }
  };
  const saved = useBookmarks()
    .map((id) => catalog.find((s) => s.id === id))
    .filter((s): s is Story => Boolean(s));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/");
  };

  const handleRenameStory = (id: string, current: string) => {
    const title = window.prompt("동화 제목을 바꿔주세요", current);
    if (!title || !title.trim()) return;
    renameMyStory(id, title.trim());
  };

  return (
    <>
      <PageHeader
        title="내 서재"
        containerClassName="max-w-lg lg:max-w-[1120px] mx-auto px-5 lg:px-8"
      />

      <div className="max-w-lg lg:max-w-[1120px] mx-auto px-5 lg:px-8 py-6 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6 lg:items-start">
        <aside className="lg:sticky lg:top-6">
        {user ? (
          <div className="card p-5 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-light text-primary rounded-2xl flex items-center justify-center">
                <User size={26} filled />
              </div>
              <div className="flex-1 min-w-0">
                {nickOpen ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={nickInput}
                      onChange={(e) => setNickInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveNick()}
                      autoFocus
                      maxLength={50}
                      placeholder="예: 지우 엄마"
                      className="flex-1 min-w-0 h-8 px-2.5 rounded-[8px] border border-primary bg-field text-sm focus:outline-none focus:ring-[3px] focus:ring-primary-light"
                    />
                    <button
                      onClick={saveNick}
                      disabled={savingNick}
                      className="text-xs font-bold text-primary px-1.5 shrink-0 disabled:opacity-50"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setNickOpen(false)}
                      className="text-xs text-muted px-1 shrink-0"
                    >
                      취소
                    </button>
                  </div>
                ) : user.nickname ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="font-bold text-base truncate">
                      {displayName(user)}
                    </p>
                    <button
                      onClick={startNickEdit}
                      aria-label="호칭 수정"
                      className="shrink-0 text-muted hover:text-primary transition"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startNickEdit}
                    className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition"
                  >
                    <Pencil size={13} /> 호칭을 설정해 보세요
                  </button>
                )}
                <p className="text-xs text-muted mt-0.5 truncate">
                  {user.email}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  {user.childName
                    ? `${user.childName} · ${user.childAge ?? "?"}세`
                    : "아이 정보가 아직 없어요"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="shrink-0 text-[13px] font-semibold text-muted hover:text-foreground transition"
              >
                로그아웃
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-5 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-light text-primary rounded-2xl flex items-center justify-center">
                <User size={26} filled />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">
                  {authLoading ? "불러오는 중..." : "로그인해 주세요"}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  로그인하면 목소리를 등록할 수 있어요
                </p>
              </div>
            </div>
            {!authLoading && (
              <Link
                href="/login"
                className="block text-center w-full mt-4 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition shadow-sm shadow-primary/20"
              >
                로그인 / 회원가입
              </Link>
            )}
          </div>
        )}
        {user && <ListenCalendar />}
        </aside>

        <div className="lg:min-w-0">
        <div className="card p-5 mb-5">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Mic size={16} className="text-primary" />
              내 목소리
              {voices.length > 0 && (
                <span className="text-xs text-muted font-semibold">
                  {voices.length}
                </span>
              )}
            </h2>
            {voices.length > 0 && (
              <Link
                href="/record"
                className="text-[13px] font-semibold text-primary hover:underline shrink-0"
              >
                전체 관리 →
              </Link>
            )}
          </div>

          {voices.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(voices.length > 6 && !showAllVoices
                  ? voices.slice(0, 4)
                  : voices
                ).map((v) => (
                  <VoiceCard key={v.id} voice={v} onChanged={refreshVoices} />
                ))}
              </div>
              {voices.length > 6 && (
                <button
                  onClick={() => setShowAllVoices((s) => !s)}
                  className="w-full mt-3 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted hover:bg-surface transition"
                >
                  {showAllVoices ? "접기" : `더보기 (${voices.length - 4}개)`}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-surface-soft border border-border rounded-xl">
                <div className="w-10 h-10 rounded-full bg-border/50 flex items-center justify-center text-muted">
                  <Mic size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground/80">
                    아직 목소리가 없어요
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    목소리를 녹음해 보세요
                  </p>
                </div>
              </div>
              <Link
                href="/record"
                className="block text-center w-full mt-3 py-2.5 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary-light transition"
              >
                목소리 녹음하러 가기
              </Link>
            </>
          )}
        </div>

        <div className="card p-5 mb-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Heart size={16} className="text-primary" />
            저장한 동화
            {saved.length > 0 && (
              <span className="text-xs text-muted font-semibold">
                {saved.length}
              </span>
            )}
          </h2>

          {saved.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {saved.map((story) => (
                <div key={story.id} className="relative">
                  <Link
                    href={`/stories/${story.id}`}
                    className="block card card-interactive overflow-hidden group"
                  >
                    <div className="aspect-square bg-surface-soft overflow-hidden">
                      <StoryCover
                        story={story}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                        {story.title}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {story.ageMin}~{story.ageMax}세
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggleBookmark(story.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/65 backdrop-blur-sm text-white flex items-center justify-center hover:bg-danger transition"
                    aria-label="저장 해제"
                  >
                    <Heart size={15} filled />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-soft border border-border flex items-center justify-center text-muted">
                <Heart size={20} />
              </div>
              <p className="text-sm text-foreground/75 font-medium">
                아직 저장한 동화가 없어요
              </p>
              <p className="text-xs text-muted mt-1">
                마음에 드는 동화에 하트를 눌러보세요
              </p>
            </div>
          )}
        </div>

        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Sparkles size={16} className="text-secondary" />
              내가 만든 동화
              {myStories.length > 0 && (
                <span className="text-xs text-muted font-semibold">
                  {myStories.length}
                </span>
              )}
            </h2>
          </div>

          {myStories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {myEntries.map((entry) => {
                // 시리즈 — 1편 대표 카드 + N편 배지, 탭하면 편 목록 시트
                if (entry.kind === "series") {
                  const rep = entry.episodes[0];
                  return (
                    <button
                      key={`series-${entry.seriesId}`}
                      onClick={() => setOpenSeriesId(entry.seriesId)}
                      className="relative text-left card card-interactive overflow-hidden group"
                    >
                      <div className="aspect-square bg-surface-soft overflow-hidden">
                        <StoryCover
                          story={rep}
                          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                          {entry.title}
                        </p>
                        <p className="text-[10px] text-muted mt-0.5">
                          시리즈 · {rep.ageMin}~{rep.ageMax}세
                        </p>
                      </div>
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white shadow-sm">
                        {entry.episodes.length}편
                      </span>
                    </button>
                  );
                }
                const story = entry.story;
                return (
                <div key={story.id} className="relative">
                  <Link
                    href={`/stories/${story.id}`}
                    className="block card card-interactive overflow-hidden group"
                  >
                    <div className="aspect-square bg-surface-soft overflow-hidden">
                      <StoryCover
                        story={story}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                        {story.title}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {story.ageMin}~{story.ageMax}세
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRenameStory(story.id, story.title)}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full bg-foreground/65 backdrop-blur-sm text-white flex items-center justify-center hover:bg-primary transition"
                    aria-label="제목 변경"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => removeMyStory(story.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/65 backdrop-blur-sm text-white flex items-center justify-center hover:bg-danger transition"
                    aria-label="동화 삭제"
                  >
                    <Trash size={15} />
                  </button>
                </div>
                );
              })}

              {/* 만들기 카드 — 그리드 마지막에 추가 */}
              <Link
                href="/create"
                className="flex flex-col items-center justify-center text-center gap-1.5 p-4 min-h-[180px] rounded-[14px] border-[1.5px] border-dashed border-border bg-background hover:border-primary hover:bg-primary-light transition group"
              >
                <Sparkles
                  size={24}
                  className="text-primary transition-transform duration-200 group-hover:scale-110"
                />
                <span className="text-[13px] font-semibold text-[var(--text-body)]">
                  새 동화 만들기
                </span>
                <span className="text-[11px] text-muted">줄거리만 있으면 돼요</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/create"
              className="flex flex-col items-center justify-center text-center gap-2 py-14 rounded-[14px] border-[1.5px] border-dashed border-border bg-background hover:border-primary hover:bg-primary-light transition group"
            >
              <Sparkles
                size={28}
                className="text-primary transition-transform duration-200 group-hover:scale-110"
              />
              <span className="text-sm font-semibold text-[var(--text-body)]">
                첫 동화를 만들어볼까요?
              </span>
              <span className="text-xs text-muted">줄거리만 있으면 돼요</span>
            </Link>
          )}
        </div>

        <div className="card overflow-hidden">
          <h2 className="font-bold text-sm px-5 pt-4 pb-3 flex items-center gap-2">
            <Sliders size={16} className="text-muted" />
            설정
          </h2>
          {/* 우리 아이 정보 — 펼쳐서 편집 */}
          <button
            onClick={toggleChildEdit}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-soft transition text-left border-t border-border"
          >
            <User size={18} className="text-muted" />
            <span className="text-sm">우리 아이 정보</span>
            <span className="ml-auto flex items-center gap-2 min-w-0">
              {user?.childName && !childOpen && (
                <span className="text-[13px] text-muted truncate">
                  {user.childName}
                  {user.childAge ? ` · ${user.childAge}세` : ""}
                </span>
              )}
              <ChevronRight
                size={16}
                className={`shrink-0 text-muted/60 transition-transform ${
                  childOpen ? "rotate-90" : ""
                }`}
              />
            </span>
          </button>

          {/* 다음 편 자동 재생 토글 */}
          <div className="w-full flex items-center gap-3 px-5 py-3.5 border-t border-border">
            <Sparkles size={18} className="text-muted" />
            <span className="text-sm">다음 편 자동 재생</span>
            <button
              onClick={toggleAutoplayNext}
              role="switch"
              aria-checked={autoplayNext}
              aria-label="다음 편 자동 재생"
              className={`ml-auto w-11 h-6 rounded-full transition relative shrink-0 ${
                autoplayNext ? "bg-primary" : "bg-border-strong"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  autoplayNext ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {childOpen && (
            <div className="px-5 pt-1 pb-4 border-t border-border bg-surface-soft/40">
              <label className="block text-[13px] font-semibold text-muted mt-3 mb-1.5">
                보호자 호칭
              </label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="예: 지우 엄마"
                maxLength={50}
                className="w-full h-11 px-3.5 rounded-[10px] bg-white border border-border text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-[1.5px] focus:border-primary focus:ring-[3px] focus:ring-primary-light transition"
              />

              <label className="block text-[13px] font-semibold text-muted mt-4 mb-1.5">
                아이 이름
              </label>
              <input
                type="text"
                value={childNameInput}
                onChange={(e) => setChildNameInput(e.target.value)}
                placeholder="예: 지우"
                maxLength={20}
                className="w-full h-11 px-3.5 rounded-[10px] bg-white border border-border text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-[1.5px] focus:border-primary focus:ring-[3px] focus:ring-primary-light transition"
              />

              <label className="block text-[13px] font-semibold text-muted mt-4 mb-2">
                아이 나이
              </label>
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 6, 7, 8].map((a) => {
                  const active = childAgeInput === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setChildAgeInput(active ? null : a)}
                      className={`px-3.5 h-9 rounded-full text-[13px] font-semibold border transition ${
                        active
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-foreground border-border hover:border-primary"
                      }`}
                    >
                      {a}세
                    </button>
                  );
                })}
              </div>

              <label className="block text-[13px] font-semibold text-muted mt-4 mb-2">
                성별
              </label>
              <div className="flex gap-2">
                {(
                  [
                    { id: "boy", label: "남자아이" },
                    { id: "girl", label: "여자아이" },
                  ] as const
                ).map((g) => {
                  const active = childGenderInput === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() =>
                        setChildGenderInput(active ? null : g.id)
                      }
                      className={`px-4 h-9 rounded-full text-[13px] font-semibold border transition ${
                        active
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-foreground border-border hover:border-primary"
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setChildOpen(false)}
                  className="flex-1 h-10 rounded-[10px] border border-border text-sm font-semibold text-muted hover:bg-surface transition"
                >
                  취소
                </button>
                <button
                  onClick={saveChild}
                  disabled={savingChild}
                  className="flex-1 h-10 rounded-[10px] bg-primary text-white text-sm font-bold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingChild ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          )}

          {[
            { Icon: Lock, label: "개인정보 처리방침", href: "/privacy" },
            { Icon: FileText, label: "서비스 이용약관", href: "/terms" },
          ].map((item, i) => {
            const cls =
              "w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-soft transition text-left border-t border-border";
            const inner = (
              <>
                <item.Icon size={18} className="text-muted" />
                <span className="text-sm">{item.label}</span>
                <ChevronRight size={16} className="ml-auto text-muted/60" />
              </>
            );
            return item.href ? (
              <a
                key={i}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cls}
              >
                {inner}
              </a>
            ) : (
              <button key={i} className={cls}>
                {inner}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* 시리즈 편 목록 시트 */}
      {openSeries && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-[rgba(44,42,69,0.5)]"
            onClick={() => setOpenSeriesId(null)}
          />
          <div className="relative z-10 w-full md:max-w-[440px] bg-surface rounded-t-2xl md:rounded-2xl shadow-xl max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-primary">
                  시리즈 · {openSeries.episodes.length}편
                </p>
                <p className="font-bold text-[15px] truncate">
                  {openSeries.title}
                </p>
              </div>
              <button
                onClick={() => setOpenSeriesId(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-soft transition text-lg shrink-0"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-1.5">
              {openSeries.episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/stories/${ep.id}`}
                  onClick={() => setOpenSeriesId(null)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-soft transition"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                    <StoryCover story={ep} className="w-full h-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-primary">
                      {ep.episodeNo}편
                    </p>
                    <p className="text-sm font-bold truncate">{ep.title}</p>
                    <p className="text-[11px] text-muted tabular-nums">
                      {ep.durationMin}분
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
