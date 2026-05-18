"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getStoryById } from "@/data/stories";
import { defaultVoices, getVoiceById } from "@/data/voices";
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
  const story = getStoryById(params.id as string);
  const voiceId = searchParams.get("voiceId") || defaultVoices[0].id;
  const voice = getVoiceById(voiceId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const paragraphs = story?.content.split("\n\n") || [];

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
      };

      audio.ontimeupdate = () => {
        setProgress(audio.currentTime);
        if (audio.duration > 0) {
          const pct = audio.currentTime / audio.duration;
          const idx = Math.floor(pct * paragraphs.length);
          setCurrentParagraph(Math.min(idx, paragraphs.length - 1));
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentParagraph(0);
      };

      await audio.play();
      setIsPlaying(true);
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

  const startSleepTimer = (minutes: number) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    setSleepTimer(minutes);
    setShowSleepMenu(false);
    sleepTimerRef.current = setTimeout(() => {
      audioRef.current?.pause();
      setIsPlaying(false);
      setSleepTimer(null);
    }, minutes * 60 * 1000);
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, []);

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
              Now Playing
            </p>
            <p className="text-xs font-semibold tracking-tight mt-0.5">
              {voice?.emoji} {voice?.name || "기본 목소리"}
            </p>
          </div>
          <button
            onClick={() => setShowSleepMenu(!showSleepMenu)}
            className={`w-10 h-10 rounded-full border backdrop-blur flex items-center justify-center transition ${
              sleepTimer
                ? "bg-secondary text-white border-secondary"
                : "bg-surface/70 border-border text-foreground/80 hover:bg-surface"
            }`}
            aria-label="수면 타이머"
          >
            <Moon size={18} filled={!!sleepTimer} />
          </button>
        </div>

        {showSleepMenu && (
          <div className="mx-5 mb-3 card shadow-md p-3 flex gap-2">
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
                  if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
                  setSleepTimer(null);
                  setShowSleepMenu(false);
                }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-surface-soft hover:bg-danger/10 text-danger"
              >
                해제
              </button>
            )}
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

        <div className="flex-1 px-5 mb-3 max-h-[180px] overflow-y-auto scrollbar-hide">
          <div className="bg-surface/70 backdrop-blur border border-border rounded-2xl p-4">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={`text-sm leading-relaxed mb-2 transition-all duration-300 ${
                  i === currentParagraph
                    ? "text-primary font-semibold"
                    : i < currentParagraph
                    ? "text-muted"
                    : "text-foreground/30"
                }`}
              >
                {p}
              </p>
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
          <div className="flex justify-center gap-2 mb-5">
            <button
              onClick={changeSpeed}
              className="text-xs font-bold text-foreground/80 bg-surface/70 backdrop-blur border border-border px-3 py-1.5 rounded-full tabular-nums hover:bg-surface transition"
            >
              {speed}x
            </button>
            <button
              onClick={() => {
                audioRef.current?.pause();
                router.push(`/voices?storyId=${story.id}`);
              }}
              className="text-xs font-bold text-foreground/80 bg-surface/70 backdrop-blur border border-border px-3 py-1.5 rounded-full hover:bg-surface transition"
            >
              {voice?.emoji} 목소리 변경
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
              aria-label={isPlaying ? "일시정지" : "재생"}
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
