"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { defaultVoices } from "@/data/voices";
import { useMyVoices } from "@/lib/useMyVoices";
import { ChevronLeft, ChevronRight, Mic, Play, Trash } from "@/components/Icon";

export default function VoiceSelectPage() {
  return (
    <Suspense>
      <VoiceSelectContent />
    </Suspense>
  );
}

function VoiceSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams.get("storyId");
  const [selected, setSelected] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const { voices: clonedVoices, refresh: refreshVoices } = useMyVoices();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  const handlePreview = async (voiceId: string) => {
    const reqId = ++reqRef.current;
    stopPreview();
    setPreviewing(voiceId);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "옛날 옛날에, 작은 마을에 마음씨 착한 아이가 살았어요.",
          voiceId,
        }),
      });

      if (!res.ok) {
        if (reqId === reqRef.current) setPreviewing(null);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // 응답을 기다리는 동안 다른 목소리를 눌렀으면 이 결과는 폐기
      if (reqId !== reqRef.current) {
        URL.revokeObjectURL(url);
        return;
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      urlRef.current = url;
      audio.onended = () => {
        if (reqId === reqRef.current) {
          stopPreview();
          setPreviewing(null);
        }
      };
      audio.play().catch(() => {});
    } catch {
      if (reqId === reqRef.current) setPreviewing(null);
    }
  };

  const handleDeleteCloned = async (id: string) => {
    if (!confirm("이 목소리를 삭제할까요?")) return;
    await fetch(`/api/voices/${id}`, { method: "DELETE" });
    if (selected === id) setSelected(null);
    refreshVoices();
  };

  const handleConfirm = () => {
    if (!selected) return;
    if (storyId) {
      router.push(`/player/${storyId}?voiceId=${selected}`);
    } else {
      router.push(`/?voiceId=${selected}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-lg lg:max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-foreground transition"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-sm tracking-tight">목소리 고르기</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg lg:max-w-3xl mx-auto px-5 py-6">
        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted font-semibold mb-2">
            Voice
          </p>
          <h2 className="text-xl font-extrabold mb-2 tracking-tight">
            어떤 목소리로 들려줄까요?
          </h2>
          <p className="text-sm text-muted">
            미리 듣기를 눌러서 목소리를 들어보세요
          </p>
        </div>

        {clonedVoices.length > 0 && (
          <section className="mb-7">
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted font-bold mb-3 pl-1">
              내가 녹음한 목소리
            </p>
            <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2">
              {clonedVoices.map((voice) => (
                <VoiceRow
                  key={voice.id}
                  voiceId={voice.id}
                  name={voice.name}
                  description="내가 녹음한 목소리"
                  emoji={voice.emoji}
                  tone="primary"
                  isSelected={selected === voice.id}
                  isPreviewing={previewing === voice.id}
                  onSelect={() => setSelected(voice.id)}
                  onPreview={() => handlePreview(voice.id)}
                  onDelete={() => handleDeleteCloned(voice.id)}
                />
              ))}
            </div>
          </section>
        )}

        <button
          onClick={() => router.push("/record")}
          className="w-full bg-surface rounded-2xl p-4 border border-dashed border-border-strong hover:border-primary hover:bg-primary-light/40 transition flex items-center gap-4 mb-7 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
            <Mic size={20} filled />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-sm">
              {clonedVoices.length > 0
                ? "새 목소리 추가 녹음하기"
                : "내 목소리로 녹음하기"}
            </p>
            <p className="text-xs text-muted mt-0.5">
              30초 녹음으로 나만의 목소리를 만들어요
            </p>
          </div>
          <ChevronRight size={18} className="text-muted group-hover:text-primary transition" />
        </button>

        <section className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.15em] text-muted font-bold mb-3 pl-1">
            기본 목소리
          </p>
          <div className="flex flex-col gap-2.5">
            {defaultVoices.map((voice) => (
              <VoiceRow
                key={voice.id}
                voiceId={voice.id}
                name={voice.name}
                description={voice.description}
                emoji={voice.emoji}
                tone="neutral"
                isSelected={selected === voice.id}
                isPreviewing={previewing === voice.id}
                onSelect={() => setSelected(voice.id)}
                onPreview={() => handlePreview(voice.id)}
              />
            ))}
          </div>
        </section>

        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary-dark transition shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          이 목소리로 듣기
        </button>
      </div>

    </>
  );
}

function VoiceRow({
  name,
  description,
  emoji,
  tone,
  isSelected,
  isPreviewing,
  onSelect,
  onPreview,
  onDelete,
}: {
  voiceId: string;
  name: string;
  description: string;
  emoji: string;
  tone: "primary" | "neutral";
  isSelected: boolean;
  isPreviewing: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`w-full card card-interactive p-4 flex items-center gap-3.5 cursor-pointer ${
        isSelected ? "!border-primary ring-1 ring-primary/30" : ""
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition ${
          isSelected
            ? "bg-primary text-white"
            : tone === "primary"
            ? "bg-primary-light"
            : "bg-surface-soft"
        }`}
      >
        {emoji}
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{name}</p>
        <p className="text-xs text-muted mt-0.5 truncate">{description}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
        disabled={isPreviewing}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition ${
          isPreviewing
            ? "bg-primary text-white"
            : "bg-surface-soft text-muted hover:text-primary hover:bg-primary-light"
        }`}
        aria-label="미리듣기"
      >
        {isPreviewing ? (
          <span className="inline-flex items-end gap-[2px] h-3">
            <span className="eq-bar" />
            <span className="eq-bar" />
            <span className="eq-bar" />
          </span>
        ) : (
          <Play size={14} />
        )}
      </button>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition flex-shrink-0"
          aria-label="삭제"
        >
          <Trash size={16} />
        </button>
      )}
    </div>
  );
}
