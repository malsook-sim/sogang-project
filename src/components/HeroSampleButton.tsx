"use client";

import { useRef, useState } from "react";
import { defaultVoices } from "@/data/voices";
import { Play, Pause } from "@/components/Icon";

// 히어로의 "샘플 들어보기" — 기본 목소리로 짧은 문장을 TTS 재생
export function HeroSampleButton() {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setState("idle");
  };

  const handleClick = async () => {
    if (state === "playing" || state === "loading") {
      stop();
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "오늘 밤엔 어떤 이야기를 들려줄까? 포근하게 잘 자렴.",
          voiceId: defaultVoices[0].id,
        }),
      });
      if (!res.ok) throw new Error("tts");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      urlRef.current = url;
      audio.onended = stop;
      await audio.play();
      setState("playing");
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface border border-border text-foreground px-7 py-3.5 rounded-full text-[15px] font-bold hover:border-border-strong transition"
    >
      {state === "playing" ? <Pause size={16} /> : <Play size={16} filled />}
      {state === "loading"
        ? "준비 중..."
        : state === "playing"
        ? "멈추기"
        : "샘플 들어보기"}
    </button>
  );
}
