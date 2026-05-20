"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { Story } from "@/data/stories";
import { defaultVoices, englishVoices, getVoiceById } from "@/data/voices";
import { bgmTracks } from "@/data/bgm";
import { ChevronDown, Moon, Play, Pause } from "@/components/Icon";
import { StoryCover } from "@/components/StoryCover";

export default function PlayerPage() {
  return (
    <Suspense>
      <PlayerContent />
    </Suspense>
  );
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
  const voiceId =
    searchParams.get("voiceId") ||
    (isEnglish ? englishVoices[0].id : defaultVoices[0].id);
  const voice = getVoiceById(voiceId);

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
    setLoading(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: story.content,
          voiceId,
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
      audio.play();
      setIsPlaying(true);
    }
  };

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
  };

  // 타이머 만료 — 볼륨을 서서히 줄이며 멈춤 (스르르 잠들도록)
  const fadeOutAndStop = () => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    sleepTimerRef.current = null;
    setSleepTimer(null);
    setSleepRemaining(0);
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

  useEffect(() => {
    return () => {
      saveProgress();
      audioRef.current?.pause();
      bgmRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <StoryCover
          story={story}
          showTitle={false}
          className="w-full h-full scale-125 blur-3xl opacity-60"
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button
            onClick={() => {
              audioRef.current?.pause();
              router.back();
            }}
            className="w-10 h-10 rounded-full bg-surface/70 backdrop-blur border border-border flex items-center justify-center text-foreground/80 hover:bg-surface transition"
            aria-label="닫기"
          >
            <ChevronDown size={20} />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted font-semibold">
              지금 듣는 중
            </p>
            <p className="text-xs font-semibold tracking-tight mt-0.5">
              {voice?.emoji} {voice?.name || "기본 목소리"}
            </p>
          </div>
          <button
            onClick={() => setShowSleepMenu(!showSleepMenu)}
            className={`h-10 px-3 rounded-full border backdrop-blur flex items-center gap-1.5 text-xs font-bold tabular-nums transition ${
              sleepTimer
                ? "bg-secondary text-white border-secondary"
                : "bg-surface/70 border-border text-foreground/80 hover:bg-surface"
            }`}
            aria-label="잠자기 타이머"
          >
            <Moon size={15} filled={!!sleepTimer} />
            {sleepTimer ? formatTime(sleepRemaining) : "잠자기"}
          </button>
        </div>

        {showSleepMenu && (
          <div className="mx-5 mb-3 card shadow-md p-3.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Moon size={14} className="text-secondary" />
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
                      ? "bg-secondary text-white"
                      : "bg-surface-soft text-foreground/80 hover:bg-secondary-light"
                  }`}
                >
                  {min}분
                </button>
              ))}
              {sleepTimer && (
                <button
                  onClick={() => {
                    clearSleepTimer();
                    setShowSleepMenu(false);
                  }}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold bg-surface-soft hover:bg-danger/10 text-danger"
                >
                  끄기
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-shrink-0 px-16 py-4">
          <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60">
            <StoryCover story={story} className="w-full h-full" />
          </div>
        </div>

        <div className="text-center px-5 mb-3">
          <h1 className="text-xl font-extrabold mb-1 tracking-tight">
            {story.title}
          </h1>
          <p className="text-sm text-muted">
            {story.morals.join(" · ")} · {story.ageMin}~{story.ageMax}세
          </p>
        </div>

        {koParagraphs.length > 0 && (
          <div className="px-5 mb-1.5 flex justify-end">
            <button
              onClick={() => setShowSubtitle((v) => !v)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                showSubtitle
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-muted border-border"
              }`}
            >
              한글 자막 {showSubtitle ? "끄기" : "보기"}
            </button>
          </div>
        )}

        <div className="flex-1 px-5 mb-3 max-h-[180px] overflow-y-auto scrollbar-hide">
          <div className="bg-surface/70 backdrop-blur border border-border rounded-2xl p-4">
            {paragraphs.map((p, i) => (
              <div key={i} className="mb-2.5 last:mb-0">
                <p
                  className={`text-sm leading-relaxed transition-all duration-300 ${
                    i === currentParagraph
                      ? "text-primary font-semibold"
                      : i < currentParagraph
                      ? "text-muted"
                      : "text-foreground/30"
                  }`}
                >
                  {p}
                </p>
                {showSubtitle && koParagraphs[i] && (
                  <p className="text-xs text-muted/90 leading-relaxed mt-1">
                    {koParagraphs[i]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 mb-3">
          <div
            className="w-full h-1.5 bg-border rounded-full cursor-pointer relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seekTo(pct);
            }}
          >
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md transition-all"
              style={{ left: `calc(${progressPct}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-muted tabular-nums">
            <span>{formatTime(progress)}</span>
            <span>
              {duration > 0 ? formatTime(duration) : `~${story.durationMin}:00`}
            </span>
          </div>
        </div>

        <div className="px-5 pb-8">
          {showBgmMenu && (
            <div className="card shadow-md p-3.5 mb-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">🎵</span>
                <p className="text-sm font-bold">배경음악</p>
              </div>
              <p className="text-[11px] text-muted mb-2.5">
                동화에 잔잔한 음악을 깔아줘요
              </p>
              <div className="grid grid-cols-2 gap-2">
                {bgmTracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectBgm(t.id)}
                    className={`py-2 rounded-lg text-sm font-semibold transition ${
                      bgmId === t.id
                        ? "bg-secondary text-white"
                        : "bg-surface-soft text-foreground/80 hover:bg-secondary-light"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
              {bgmId && (
                <button
                  onClick={turnOffBgm}
                  className="w-full mt-2 py-2 rounded-lg text-sm font-semibold bg-surface-soft hover:bg-danger/10 text-danger"
                >
                  배경음악 끄기
                </button>
              )}
            </div>
          )}

          <div className="flex justify-center gap-2 mb-5 flex-wrap">
            <button
              onClick={changeSpeed}
              className="text-xs font-bold text-foreground/80 bg-surface/70 backdrop-blur border border-border px-3 py-1.5 rounded-full tabular-nums hover:bg-surface transition"
            >
              {speed}x
            </button>
            <button
              onClick={() => setShowBgmMenu(!showBgmMenu)}
              className={`text-xs font-bold border px-3 py-1.5 rounded-full transition ${
                bgmId
                  ? "bg-secondary text-white border-secondary"
                  : "text-foreground/80 bg-surface/70 backdrop-blur border-border hover:bg-surface"
              }`}
            >
              {bgmId
                ? `${bgmTracks.find((t) => t.id === bgmId)?.emoji} 배경음악`
                : "🎵 배경음악"}
            </button>
            <button
              onClick={() => {
                audioRef.current?.pause();
                router.push(
                  `/voices?storyId=${story.id}&lang=${
                    isEnglish ? "en" : "ko"
                  }`
                );
              }}
              className="text-xs font-bold text-foreground/80 bg-surface/70 backdrop-blur border border-border px-3 py-1.5 rounded-full hover:bg-surface transition"
            >
              {voice?.emoji} 목소리 바꾸기
            </button>
          </div>

          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => seek(-15)}
              className="w-12 h-12 rounded-full bg-surface/70 backdrop-blur border border-border flex items-center justify-center text-xs font-bold text-foreground/80 hover:bg-surface transition tabular-nums"
            >
              -15
            </button>

            <button
              onClick={togglePlay}
              disabled={loading}
              className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary-dark transition active:scale-95 disabled:opacity-60"
              aria-label={isPlaying ? "멈추기" : "듣기"}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={26} />
              ) : (
                <Play size={26} />
              )}
            </button>

            <button
              onClick={() => seek(15)}
              className="w-12 h-12 rounded-full bg-surface/70 backdrop-blur border border-border flex items-center justify-center text-xs font-bold text-foreground/80 hover:bg-surface transition tabular-nums"
            >
              +15
            </button>
          </div>

          {loading && (
            <p className="text-center text-xs text-primary mt-3 animate-pulse">
              목소리를 만들고 있어요...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
