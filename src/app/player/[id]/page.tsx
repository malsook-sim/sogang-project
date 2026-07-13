"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Story } from "@/data/stories";
import { defaultVoices, englishVoices, getVoiceById } from "@/data/voices";
import { bgmTracks } from "@/data/bgm";
import { ChevronLeft, Moon, Play, Pause, Refresh } from "@/components/Icon";
import { StoryCover } from "@/components/StoryCover";
import { VoiceAvatar } from "@/components/VoiceAvatar";
import { useCatalog } from "@/lib/useCatalog";
import { useMyVoices } from "@/lib/useMyVoices";
import { moralKeywords } from "@/lib/morals";

export default function PlayerPage() {
  return (
    <Suspense>
      <PlayerContent />
    </Suspense>
  );
}

// 목소리 메타용 짧은 녹음 날짜 (예: 5.20 녹음)
function formatVoiceDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}.${d.getDate()} 녹음`;
}

function PlayerContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = params.id as string;
  const [story, setStory] = useState<Story | null>(null);
  const [storyResolved, setStoryResolved] = useState(false);
  // 본문에 한글이 없으면 영어 동화로 판단
  const isEnglish = story
    ? !/[가-힣]/.test(story.content.slice(0, 200))
    : false;
  const { voices: clonedVoices } = useMyVoices();
  const [voiceOverride, setVoiceOverride] = useState<string | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const voiceId =
    voiceOverride ||
    searchParams.get("voiceId") ||
    (isEnglish ? englishVoices[0].id : defaultVoices[0].id);
  const clonedVoice = clonedVoices.find((v) => v.id === voiceId);
  const baseVoice = getVoiceById(voiceId);
  const voiceName = clonedVoice?.name ?? baseVoice?.name ?? "기본 목소리";
  const modalVoices = [
    ...clonedVoices.map((v) => ({
      id: v.id,
      name: v.name,
      emoji: v.emoji,
      mine: true,
      meta: formatVoiceDate(v.createdAt),
      isDefault: v.isDefault,
    })),
    ...(isEnglish ? englishVoices : defaultVoices).map((v) => ({
      id: v.id,
      name: v.name,
      emoji: v.emoji,
      mine: false,
      meta: v.description,
      isDefault: false,
    })),
  ];
  const catalog = useCatalog();

  // 마지막으로 고른 목소리 기억 (동화 상세의 "이 목소리로 듣기"가 재사용)
  useEffect(() => {
    const vid = searchParams.get("voiceId");
    if (vid) {
      try {
        localStorage.setItem("mvk.lastVoiceId", vid);
      } catch {
        // 무시
      }
    }
  }, [searchParams]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  const [bgmId, setBgmId] = useState<string | null>(null);
  const [showBgmMenu, setShowBgmMenu] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [finished, setFinished] = useState(false);
  // 잠자기 타이머 → 밤 모드. bedtime: 타이머 종료 시 작별 인사 표시
  const [nightMode, setNightMode] = useState(false);
  const [bedtime, setBedtime] = useState(false);
  // 목소리 팝업 미리듣기
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const previewReqRef = useRef(0);

  const scriptRef = useRef<HTMLDivElement | null>(null);
  const paraRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepEndsAtRef = useRef(0);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const resumeRef = useRef(0); // 이어 들을 위치 (초)
  const lastSaveRef = useRef(0); // 마지막으로 저장한 재생 위치
  const countedRef = useRef(false); // 재생수 중복 카운트 방지

  // 재생 위치를 서버에 저장 (이어 듣기용)
  const saveProgress = (opts?: { ended?: boolean }) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    fetch("/api/play-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyId: idParam,
        progressSec: opts?.ended ? audio.duration : audio.currentTime,
        durationSec: audio.duration,
      }),
      keepalive: true,
    }).catch(() => {});
  };

  const paragraphs = story?.content.split("\n\n") || [];
  const koParagraphs = story?.contentKo?.split("\n\n") ?? [];

  const generateAndPlay = async () => {
    if (!story) return;
    setFinished(false);
    setLoading(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: story.content,
          voiceId,
          storyId: idParam,
        }),
      });

      if (!res.ok) throw new Error("TTS 실패");

      const blob = await res.blob();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.playbackRate = speed;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        // 저장된 위치가 있으면 이어 듣기
        const resume = resumeRef.current;
        if (resume > 5 && audio.duration > 0 && resume < audio.duration * 0.95) {
          audio.currentTime = resume;
          setProgress(resume);
          lastSaveRef.current = resume;
        }
        resumeRef.current = 0;
      };

      audio.ontimeupdate = () => {
        setProgress(audio.currentTime);
        if (audio.duration > 0) {
          const pct = audio.currentTime / audio.duration;
          const idx = Math.floor(pct * paragraphs.length);
          setCurrentParagraph(Math.min(idx, paragraphs.length - 1));
        }
        // 10초마다 진행 위치 저장
        if (Math.abs(audio.currentTime - lastSaveRef.current) > 10) {
          lastSaveRef.current = audio.currentTime;
          saveProgress();
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentParagraph(0);
        setFinished(true);
        saveProgress({ ended: true });
      };

      await audio.play();
      setIsPlaying(true);

      // 재생수는 동화당 한 번만 카운트
      if (!countedRef.current) {
        countedRef.current = true;
        fetch("/api/play-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId: idParam, count: true }),
        }).catch(() => {});
      }
    } catch {
      alert("음성 생성에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) {
      generateAndPlay();
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      saveProgress();
    } else {
      if (finished || audio.ended) audio.currentTime = 0;
      audio.play();
      setIsPlaying(true);
      setFinished(false);
      setBedtime(false);
    }
  };

  // 목소리 팝업 미리듣기 (샘플만 재생 — 선택 처리 아님)
  const stopPreviewAudio = () => {
    previewReqRef.current++;
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewId(null);
  };

  const handlePreview = async (id: string) => {
    if (previewId === id) {
      stopPreviewAudio();
      return;
    }
    const reqId = ++previewReqRef.current;
    previewAudioRef.current?.pause();
    setPreviewId(id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: isEnglish
            ? "Hello! Shall I read you a story tonight?"
            : "안녕, 오늘은 어떤 이야기를 들려줄까?",
          voiceId: id,
        }),
      });
      if (!res.ok || reqId !== previewReqRef.current) {
        if (reqId === previewReqRef.current) setPreviewId(null);
        return;
      }
      const blob = await res.blob();
      if (reqId !== previewReqRef.current) return;
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.onended = () => {
        if (reqId === previewReqRef.current) stopPreviewAudio();
      };
      audio.play().catch(() => {});
    } catch {
      if (reqId === previewReqRef.current) setPreviewId(null);
    }
  };

  // 재생 중 목소리 교체 — 현재 오디오 정리 후 새 목소리로 재합성
  const changeVoice = (id: string) => {
    stopPreviewAudio();
    setVoiceModalOpen(false);
    if (id === voiceId) return;
    try {
      localStorage.setItem("mvk.lastVoiceId", id);
    } catch {
      // 무시
    }
    audioRef.current?.pause();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioRef.current = null;
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setCurrentParagraph(0);
    setFinished(false);
    countedRef.current = false;
    setVoiceOverride(id);
  };

  // 목소리 교체 시 새 목소리로 재합성+재생
  useEffect(() => {
    if (voiceOverride) void generateAndPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceOverride]);

  const seek = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  };

  const seekTo = (pct: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = pct * audio.duration;
  };

  const changeSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const idx = speeds.indexOf(speed);
    const next = speeds[(idx + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const selectBgm = (id: string) => {
    const track = bgmTracks.find((t) => t.id === id);
    if (!track) return;
    if (bgmRef.current) bgmRef.current.pause();
    const bgm = new Audio(track.file);
    bgm.loop = true;
    bgm.volume = 0.18;
    bgmRef.current = bgm;
    setBgmId(id);
    setShowBgmMenu(false);
  };

  const turnOffBgm = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current = null;
    }
    setBgmId(null);
    setShowBgmMenu(false);
  };

  const clearSleepTimer = () => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    sleepTimerRef.current = null;
    setSleepTimer(null);
    setSleepRemaining(0);
    // 수동으로 끄면 원래 동화 틴트로 복귀
    setNightMode(false);
    setBedtime(false);
  };

  // 타이머 만료 — 볼륨을 서서히 줄이며 멈춤 (스르르 잠들도록)
  const fadeOutAndStop = () => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    sleepTimerRef.current = null;
    setSleepTimer(null);
    setSleepRemaining(0);
    // 타이머 종료 시엔 밤 모드를 유지하고 작별 인사를 띄움
    setBedtime(true);
    const audio = audioRef.current;
    if (!audio) return;
    const startVol = audio.volume;
    let step = 0;
    const fade = setInterval(() => {
      step += 1;
      audio.volume = Math.max(0, startVol * (1 - step / 20));
      if (step >= 20) {
        clearInterval(fade);
        audio.pause();
        audio.volume = startVol; // 다음 재생을 위해 복원
        setIsPlaying(false);
      }
    }, 150);
  };

  const startSleepTimer = (minutes: number) => {
    clearSleepTimer();
    setSleepTimer(minutes);
    setSleepRemaining(minutes * 60);
    setShowSleepMenu(false);
    // 타이머 설정 시 밤 모드 진입
    setNightMode(true);
    setBedtime(false);
    sleepEndsAtRef.current = Date.now() + minutes * 60 * 1000;
    sleepTimerRef.current = setInterval(() => {
      const left = Math.round((sleepEndsAtRef.current - Date.now()) / 1000);
      if (left <= 0) {
        fadeOutAndStop();
      } else {
        setSleepRemaining(left);
      }
    }, 1000);
  };

  useEffect(() => {
    let active = true;
    fetch(`/api/stories/${idParam}`)
      .then((r) => (r.ok ? r.json() : { story: null }))
      .then((d) => {
        if (active) {
          setStory(d.story ?? null);
          setStoryResolved(true);
        }
      })
      .catch(() => {
        if (active) setStoryResolved(true);
      });
    return () => {
      active = false;
    };
  }, [idParam]);

  // 저장된 재생 위치 불러오기 (이어 듣기)
  useEffect(() => {
    fetch("/api/play-progress")
      .then((r) => (r.ok ? r.json() : { history: [] }))
      .then((d) => {
        const row = (d.history || []).find(
          (h: { storyId: string }) => h.storyId === idParam
        );
        if (row) resumeRef.current = row.progressSec;
      })
      .catch(() => {});
  }, [idParam]);

  // 배경음악을 내레이션 재생 상태에 맞춰 켜고 끔
  useEffect(() => {
    const bgm = bgmRef.current;
    if (!bgm) return;
    if (isPlaying) bgm.play().catch(() => {});
    else bgm.pause();
  }, [isPlaying, bgmId]);

  // 현재 문단을 스크립트 패널 중앙으로 부드럽게 자동 스크롤
  useEffect(() => {
    if (finished) return;
    const el = paraRefs.current[currentParagraph];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentParagraph, finished]);

  useEffect(() => {
    return () => {
      saveProgress();
      audioRef.current?.pause();
      bgmRef.current?.pause();
      previewAudioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!storyResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted text-sm">동화를 불러오는 중...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">동화를 찾을 수 없어요</p>
      </div>
    );
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  // 스크립트/추천 패널 배경 (밤 모드 반전)
  const panelCls = nightMode
    ? "bg-[rgba(44,42,69,0.6)] border-white/10"
    : "bg-white/80 border-border";

  // 하단 바 보조 버튼 (밤 모드 반전)
  const secBtnCls = nightMode
    ? "bg-[#3D3A5C] border-white/10 text-[#C9C3E8] hover:bg-[#474269]"
    : "bg-surface border-border text-foreground/80 hover:bg-surface-soft";

  // 칩 공통 스타일 (초소형 360px 이하에서 11px로 축소)
  const chipCls =
    "text-xs max-[360px]:text-[11px] font-bold border px-2.5 max-[360px]:px-2 py-1.5 rounded-full transition";

  // 속도 칩
  const speedChip = (
    <button
      onClick={changeSpeed}
      className={`${chipCls} tabular-nums ${secBtnCls}`}
    >
      {speed}x
    </button>
  );

  // 배경음악 칩 + 드롭다운
  const bgmControl = (
    <div className="relative">
      <button
        onClick={() => setShowBgmMenu((v) => !v)}
        className={`${chipCls} ${
          bgmId
            ? "bg-primary-light text-primary border-primary/30"
            : secBtnCls
        }`}
      >
        배경음악
      </button>
      {showBgmMenu && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowBgmMenu(false)}
          />
          <div className="absolute bottom-full mb-2 left-0 w-60 bg-surface border border-border rounded-2xl shadow-lg p-3.5 z-40">
            <p className="text-sm font-bold mb-2.5">배경음악</p>
            <div className="grid grid-cols-2 gap-2">
              {bgmTracks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectBgm(t.id)}
                  className={`py-2 rounded-lg text-sm font-semibold transition ${
                    bgmId === t.id
                      ? "bg-primary text-white"
                      : "bg-surface-soft text-foreground/80 hover:bg-primary-light"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {bgmId && (
              <button
                onClick={turnOffBgm}
                className="w-full mt-2 py-2 rounded-lg text-sm font-semibold bg-surface-soft hover:bg-danger/10 text-danger"
              >
                끄기
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  // 목소리 바꾸기 칩 — 모바일/데스크톱 공통 재사용 (텍스트 라벨 필수)
  const voiceChip = (
    <button
      onClick={() => setVoiceModalOpen(true)}
      className={`${chipCls} inline-flex items-center gap-1.5 whitespace-nowrap ${secBtnCls}`}
    >
      <Refresh size={14} />
      <span>목소리 바꾸기</span>
    </button>
  );

  // -15 / 재생 / +15 재생 컨트롤
  const playbackControls = (
    <div className="flex items-center justify-center gap-5 lg:gap-4">
      <button
        onClick={() => seek(-15)}
        className={`w-11 h-11 rounded-full border flex items-center justify-center text-xs font-bold transition tabular-nums ${secBtnCls}`}
      >
        -15
      </button>
      <button
        onClick={togglePlay}
        disabled={loading}
        className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary-dark transition active:scale-95 disabled:opacity-60"
        aria-label={isPlaying ? "멈추기" : "듣기"}
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause size={24} />
        ) : (
          <Play size={24} filled />
        )}
      </button>
      <button
        onClick={() => seek(15)}
        className={`w-11 h-11 rounded-full border flex items-center justify-center text-xs font-bold transition tabular-nums ${secBtnCls}`}
      >
        +15
      </button>
    </div>
  );

  const recommendations = catalog
    .filter(
      (s) =>
        s.id !== story.id &&
        !s.id.startsWith("my-") &&
        s.morals.some((m) => story.morals.includes(m))
    )
    .slice(0, 3);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* 배경: 동화 틴트 ↔ 밤 모드 크로스페이드 */}
      <div className="absolute inset-0 z-0">
        {/* 동화별 배경 틴트 */}
        <div
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
            nightMode ? "opacity-0" : "opacity-100"
          }`}
        >
          <StoryCover
            story={story}
            showTitle={false}
            className="w-full h-full scale-125 blur-3xl opacity-60"
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
        {/* 밤 모드 배경 (#2C2A45 + 별 + 초승달) */}
        <div
          className={`absolute inset-0 bg-[#2C2A45] transition-opacity duration-[1200ms] ease-in-out ${
            nightMode ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        >
          {/* 초승달 (우상단) */}
          <svg
            className="absolute top-8 right-8 w-12 h-12"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              d="M28 6 A15 15 0 1 0 28 34 A11.5 11.5 0 1 1 28 6 Z"
              fill="#F4C566"
            />
          </svg>
          {/* 별 (은은한 twinkle, reduced-motion 시 정지) */}
          {[
            { top: "14%", left: "12%", s: 2, c: "#F4C566", d: "0s" },
            { top: "22%", left: "78%", s: 1.5, c: "#EDE9F7", d: "0.6s" },
            { top: "38%", left: "30%", s: 1, c: "#EDE9F7", d: "1.2s" },
            { top: "48%", left: "88%", s: 2, c: "#F4C566", d: "0.3s" },
            { top: "62%", left: "18%", s: 1.5, c: "#EDE9F7", d: "1.6s" },
            { top: "70%", left: "60%", s: 1, c: "#EDE9F7", d: "0.9s" },
            { top: "80%", left: "40%", s: 2, c: "#F4C566", d: "2s" },
          ].map((st, i) => (
            <span
              key={i}
              className="lp-twinkle absolute rounded-full"
              style={{
                top: st.top,
                left: st.left,
                width: st.s,
                height: st.s,
                backgroundColor: st.c,
                animationDelay: st.d,
              }}
            />
          ))}
        </div>
      </div>

      {/* 상단 바 */}
      <header className="relative z-20 shrink-0 flex items-center justify-between gap-3 px-5 lg:px-8 h-14 max-w-6xl mx-auto w-full">
        <button
          onClick={() => {
            audioRef.current?.pause();
            router.back();
          }}
          className="w-10 h-10 shrink-0 rounded-full bg-surface/70 backdrop-blur border border-border flex items-center justify-center text-foreground/80 hover:bg-surface transition"
          aria-label="뒤로"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center min-w-0">
          <p
            className={`text-[10px] uppercase tracking-[0.18em] font-semibold transition-colors duration-[1200ms] ${
              nightMode ? "text-[#C9C3E8]/70" : "text-muted"
            }`}
          >
            지금 듣는 중
          </p>
          <p
            className={`text-xs font-semibold tracking-tight mt-0.5 truncate transition-colors duration-[1200ms] ${
              nightMode ? "text-[#FBF9F6]" : "text-foreground"
            }`}
          >
            {voiceName}
          </p>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSleepMenu((v) => !v)}
            className={`h-10 px-3 rounded-full border flex items-center gap-1.5 text-xs font-bold tabular-nums transition duration-[1200ms] ${
              nightMode
                ? "bg-[#3D3A5C] border-white/10 text-[#F4C566]"
                : sleepTimer
                ? "bg-primary-light border-primary/30 text-primary"
                : "bg-surface/70 border-border text-foreground/80 hover:bg-surface"
            }`}
            aria-label="잠자기 타이머"
          >
            <Moon size={15} filled={!!sleepTimer} />
            {sleepTimer ? formatTime(sleepRemaining) : "잠자기"}
          </button>
          {showSleepMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowSleepMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-2xl shadow-lg p-3.5 z-40">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Moon size={14} className="text-primary" />
                  <p className="text-sm font-bold">잠자기 타이머</p>
                </div>
                <p className="text-[11px] text-muted mb-2.5">
                  정한 시간이 지나면 동화가 스르르 멈춰요
                </p>
                <div className="flex gap-2">
                  {[15, 30, 60].map((min) => (
                    <button
                      key={min}
                      onClick={() => startSleepTimer(min)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition tabular-nums ${
                        sleepTimer === min
                          ? "bg-primary text-white"
                          : "bg-surface-soft text-foreground/80 hover:bg-primary-light"
                      }`}
                    >
                      {min}분
                    </button>
                  ))}
                </div>
                {sleepTimer && (
                  <button
                    onClick={() => {
                      clearSleepTimer();
                      setShowSleepMenu(false);
                    }}
                    className="w-full mt-2 py-2 rounded-lg text-sm font-semibold bg-surface-soft hover:bg-danger/10 text-danger"
                  >
                    타이머 끄기
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* 본문 2열 */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[38%_1fr] lg:gap-10 lg:items-stretch max-w-6xl mx-auto w-full px-5 lg:px-8 pt-2 lg:pt-4 pb-2">
        {/* 좌: 앨범아트 + 제목 */}
        <div className="shrink-0 flex flex-col items-center lg:justify-center text-center">
          <div
            className="w-full max-w-[180px] lg:max-w-[320px] aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60 transition-[filter] duration-[1200ms] ease-in-out"
            style={nightMode ? { filter: "brightness(0.75)" } : undefined}
          >
            <StoryCover story={story} className="w-full h-full" />
          </div>
          <h1
            className={`text-xl lg:text-2xl font-extrabold mt-4 mb-2 tracking-tight transition-colors duration-[1200ms] ${
              nightMode ? "text-[#FBF9F6]" : "text-foreground"
            }`}
          >
            {story.title}
          </h1>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {moralKeywords(story.morals, 2).map((m) => (
              <span
                key={m}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors duration-[1200ms] ${
                  nightMode
                    ? "bg-[#3D3A5C] text-[#C9C3E8]"
                    : "bg-primary-light text-primary"
                }`}
              >
                {m}
              </span>
            ))}
            <span
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors duration-[1200ms] ${
                nightMode
                  ? "bg-[#3D3A5C] text-[#C9C3E8] border-white/10"
                  : "text-foreground/70 bg-surface/70 backdrop-blur border-border"
              }`}
            >
              {story.ageMin}~{story.ageMax}세
            </span>
          </div>
          {koParagraphs.length > 0 && !finished && (
            <button
              onClick={() => setShowSubtitle((v) => !v)}
              className={`mt-3 text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                showSubtitle
                  ? "bg-primary text-white border-primary"
                  : nightMode
                  ? "bg-[#3D3A5C] text-[#C9C3E8] border-white/10"
                  : "bg-surface text-muted border-border"
              }`}
            >
              한글 자막 {showSubtitle ? "끄기" : "보기"}
            </button>
          )}
        </div>

        {/* 우: 스크립트 or 추천 */}
        <div className="flex-1 min-h-0 mt-4 lg:mt-0 flex flex-col">
          {bedtime ? (
            <div
              className={`flex-1 min-h-0 flex flex-col items-center justify-center text-center backdrop-blur border rounded-2xl p-6 transition-colors duration-[1200ms] ${panelCls}`}
            >
              <Moon size={44} filled className="text-[#F4C566]" />
              <p className="mt-4 text-lg font-extrabold text-[#FBF9F6]">
                오늘은 여기까지, 잘 자요
              </p>
              <p className="mt-1.5 text-sm text-[#8B86A3]">
                내일 또 재미있는 이야기를 들려줄게요
              </p>
            </div>
          ) : finished ? (
            <div
              className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide backdrop-blur border rounded-2xl p-5 lg:p-6 transition-colors duration-[1200ms] ${panelCls}`}
            >
              <p
                className={`font-extrabold text-base mb-1 ${
                  nightMode ? "text-[#FBF9F6]" : "text-foreground"
                }`}
              >
                다른 동화 들어볼까요?
              </p>
              <p
                className={`text-xs mb-4 ${
                  nightMode ? "text-[#8B86A3]" : "text-muted"
                }`}
              >
                방금 들은 동화와 결이 비슷한 이야기예요
              </p>
              {recommendations.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {recommendations.map((s) => (
                    <Link key={s.id} href={`/stories/${s.id}`} className="group">
                      <div className="aspect-square rounded-xl overflow-hidden bg-surface-soft">
                        <StoryCover
                          story={s}
                          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <p
                        className={`text-xs font-bold truncate mt-1.5 transition-colors ${
                          nightMode
                            ? "text-[#C9C3E8] group-hover:text-[#F4C566]"
                            : "group-hover:text-primary"
                        }`}
                      >
                        {s.title}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p
                  className={`text-sm ${
                    nightMode ? "text-[#8B86A3]" : "text-muted"
                  }`}
                >
                  추천할 동화를 찾고 있어요.
                </p>
              )}
              <button
                onClick={() => togglePlay()}
                className={`w-full mt-5 py-3 rounded-xl border text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                  nightMode
                    ? "border-white/10 bg-[#3D3A5C] text-[#C9C3E8] hover:bg-[#474269]"
                    : "border-border hover:bg-surface"
                }`}
              >
                <Refresh size={15} />
                다시 듣기
              </button>
            </div>
          ) : (
            <div
              ref={scriptRef}
              className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide backdrop-blur border rounded-2xl p-4 lg:p-6 transition-colors duration-[1200ms] ${panelCls}`}
            >
              {paragraphs.map((p, i) => (
                <div key={i} className="mb-1.5 last:mb-0">
                  <p
                    ref={(el) => {
                      paraRefs.current[i] = el;
                    }}
                    onClick={() => seekTo(i / paragraphs.length)}
                    className={`text-[15px] lg:text-base leading-[1.9] rounded-lg px-2 py-1 cursor-pointer transition-colors duration-300 ${
                      i === currentParagraph
                        ? nightMode
                          ? "text-[#FBF9F6] font-semibold bg-[rgba(110,95,214,0.35)]"
                          : "text-[var(--primary-deep)] font-semibold bg-primary-light"
                        : nightMode
                        ? "text-[#8B86A3]"
                        : i < currentParagraph
                        ? "text-muted"
                        : "text-foreground/35"
                    }`}
                  >
                    {p}
                  </p>
                  {showSubtitle && koParagraphs[i] && (
                    <p
                      className={`text-xs leading-relaxed mt-1 px-2 ${
                        nightMode ? "text-[#8B86A3]" : "text-muted/90"
                      }`}
                    >
                      {koParagraphs[i]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div
        className={`relative z-20 shrink-0 backdrop-blur border-t transition-colors duration-[1200ms] ${
          nightMode
            ? "bg-[rgba(44,42,69,0.9)] border-white/10"
            : "bg-white/80 border-border"
        }`}
      >
        <div className="max-w-4xl mx-auto px-5 lg:px-8 pt-3 pb-6 lg:pb-4">
          {/* 진행바 */}
          <div
            className={`w-full h-1.5 rounded-full cursor-pointer relative ${
              nightMode ? "bg-white/15" : "bg-primary-light"
            }`}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekTo((e.clientX - rect.left) / rect.width);
            }}
          >
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md"
              style={{ left: `calc(${progressPct}% - 8px)` }}
            />
          </div>
          <div
            className={`flex justify-between mt-1.5 text-[11px] tabular-nums ${
              nightMode ? "text-[#8B86A3]" : "text-muted"
            }`}
          >
            <span>{formatTime(progress)}</span>
            <span>
              {duration > 0 ? formatTime(duration) : `~${story.durationMin}:00`}
            </span>
          </div>

          {/* 모바일 컨트롤 (lg 미만): 1행 칩 3개 + 2행 재생 */}
          <div className="lg:hidden flex flex-col items-center gap-3 mt-3">
            <div className="flex items-center justify-center gap-2 max-[360px]:gap-1.5">
              {speedChip}
              {bgmControl}
              {voiceChip}
            </div>
            {playbackControls}
          </div>

          {/* 데스크톱 컨트롤 (lg 이상): 3분할 [속도·배경음악] --- [재생] --- [목소리] */}
          <div className="hidden lg:grid grid-cols-3 items-center mt-3 gap-x-2">
            <div className="flex items-center gap-2 justify-self-start">
              {speedChip}
              {bgmControl}
            </div>
            {playbackControls}
            <div className="justify-self-end">{voiceChip}</div>
          </div>

          {loading && (
            <p className="text-center text-xs text-primary mt-3 animate-pulse">
              목소리를 만들고 있어요...
            </p>
          )}
        </div>
      </div>

      {/* 목소리 변경 팝업 (모바일 바텀시트 / 768px+ 중앙 다이얼로그) */}
      {voiceModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              stopPreviewAudio();
              setVoiceModalOpen(false);
            }}
          />
          <div className="relative z-10 w-full md:max-w-[480px] bg-surface rounded-t-2xl md:rounded-2xl shadow-xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <p className="font-bold text-[15px]">목소리 바꾸기</p>
              <button
                onClick={() => {
                  stopPreviewAudio();
                  setVoiceModalOpen(false);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-surface-soft transition text-lg"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-2.5 py-2 flex flex-col gap-1.5">
              {clonedVoices.length > 0 && (
                <p className="px-2 pt-1 pb-0.5 text-xs font-bold text-muted">
                  내 목소리
                </p>
              )}
              {modalVoices.map((v, i) => {
                const firstBase = i === clonedVoices.length;
                const active = voiceId === v.id;
                return (
                  <div key={v.id} className="flex flex-col gap-1.5">
                    {firstBase && (
                      <p className="px-2 pt-2 pb-0.5 text-xs font-bold text-muted">
                        기본 목소리
                      </p>
                    )}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => changeVoice(v.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") changeVoice(v.id);
                      }}
                      className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left cursor-pointer transition border ${
                        active
                          ? "bg-primary-light border-[1.5px] border-primary"
                          : "border-transparent hover:bg-surface-soft"
                      }`}
                    >
                      <VoiceAvatar emoji={v.emoji} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm truncate ${
                              active ? "font-bold text-primary" : "font-medium"
                            }`}
                          >
                            {v.name}
                          </span>
                          {v.isDefault && (
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F4C566] text-[#5C4400]">
                              기본
                            </span>
                          )}
                        </div>
                        {v.meta && (
                          <p className="text-[11px] text-muted truncate mt-0.5">
                            {v.meta}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(v.id);
                        }}
                        className="shrink-0 w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center hover:bg-primary/15 transition"
                        aria-label="미리듣기"
                      >
                        {previewId === v.id ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} filled />
                        )}
                      </button>

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
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 하단 고정 footer */}
            <div className="shrink-0 border-t border-border px-5 py-3">
              <button
                onClick={() => {
                  stopPreviewAudio();
                  router.push("/record");
                }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                새 목소리 녹음하기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
