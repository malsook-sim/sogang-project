"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { defaultVoices } from "@/data/voices";
import BottomNav from "@/components/BottomNav";

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

  const handlePreview = async (voiceId: string) => {
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
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setPreviewing(null);
        };
      }
    } catch {
      setPreviewing(null);
    }
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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition text-lg"
          >
            ←
          </button>
          <h1 className="font-bold text-sm">목소리 선택</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎧</div>
          <h2 className="text-xl font-extrabold mb-2">
            어떤 목소리로 들려줄까요?
          </h2>
          <p className="text-sm text-muted">
            미리 듣기를 눌러 목소리를 확인해보세요
          </p>
        </div>

        {/* 내 목소리 (cloned) */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/record")}
            className="w-full bg-white rounded-2xl p-4 border-2 border-dashed border-gray-200 hover:border-primary transition flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-2xl flex-shrink-0">
              🎙️
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-sm">내 목소리로 녹음하기</p>
              <p className="text-xs text-muted mt-0.5">
                30초 녹음으로 나만의 목소리를 만들어요
              </p>
            </div>
            <span className="text-muted text-sm">→</span>
          </button>
        </div>

        {/* 기본 보이스 목록 */}
        <p className="text-xs text-muted font-semibold mb-3">
          🔊 기본 제공 목소리
        </p>
        <div className="flex flex-col gap-3 mb-8">
          {defaultVoices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => setSelected(voice.id)}
              className={`w-full bg-white rounded-2xl p-4 border-2 transition flex items-center gap-4 ${
                selected === voice.id
                  ? "border-primary shadow-md shadow-primary/10"
                  : "border-transparent shadow-sm hover:shadow-md"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${
                  selected === voice.id
                    ? "bg-primary text-white"
                    : "bg-gray-100"
                }`}
              >
                {voice.emoji}
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-sm">{voice.name}</p>
                <p className="text-xs text-muted mt-0.5">
                  {voice.description}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(voice.id);
                }}
                disabled={previewing === voice.id}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition ${
                  previewing === voice.id
                    ? "bg-primary text-white animate-pulse"
                    : "bg-gray-100 hover:bg-primary-light text-muted hover:text-primary"
                }`}
              >
                {previewing === voice.id ? "♪" : "▶"}
              </button>
            </button>
          ))}
        </div>

        {/* Confirm */}
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary-dark transition shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          이 목소리로 듣기
        </button>
      </div>

      <BottomNav />
    </>
  );
}
