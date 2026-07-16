"use client";

import { useRef, useState } from "react";
import { VoiceAvatar } from "@/components/VoiceAvatar";
import { Play, Pause, Pencil, Trash } from "@/components/Icon";
import type { MyVoice } from "@/lib/useMyVoices";

function Kebab() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  );
}

function shortDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

// 목소리 카드 — 녹음/내 서재 공용. 미리듣기·이름변경·설명·기본설정·삭제 자체 처리.
export function VoiceCard({
  voice,
  onChanged,
}: {
  voice: MyVoice;
  onChanged: () => void;
}) {
  const [previewing, setPreviewing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(voice.name);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const reqRef = useRef(0);

  const stopPreview = () => {
    reqRef.current++;
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setPreviewing(false);
  };

  const preview = async () => {
    if (previewing) {
      stopPreview();
      return;
    }
    const reqId = ++reqRef.current;
    setPreviewing(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "안녕, 오늘은 어떤 이야기를 들려줄까?",
          voiceId: voice.id,
        }),
      });
      if (!res.ok || reqId !== reqRef.current) {
        if (reqId === reqRef.current) setPreviewing(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (reqId !== reqRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      urlRef.current = url;
      audio.onended = () => reqId === reqRef.current && stopPreview();
      audio.play().catch(() => {});
    } catch {
      if (reqId === reqRef.current) setPreviewing(false);
    }
  };

  const patch = async (body: Record<string, unknown>) => {
    try {
      await fetch(`/api/voices/${voice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onChanged();
    } catch {
      // 무시
    }
  };

  const saveRename = () => {
    const n = name.trim();
    if (!n) return;
    setEditing(false);
    patch({ name: n });
  };

  const setDefault = () => {
    setMenuOpen(false);
    patch({ makeDefault: true });
  };

  const del = async () => {
    setMenuOpen(false);
    if (!confirm("이 목소리를 삭제할까요?")) return;
    try {
      await fetch(`/api/voices/${voice.id}`, { method: "DELETE" });
      onChanged();
    } catch {
      // 무시
    }
  };

  return (
    <div className="card p-3.5 flex items-center gap-3">
      <VoiceAvatar emoji={voice.emoji} size={38} />
      {editing ? (
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="flex-1 min-w-0 h-9 px-2.5 rounded-[10px] border border-primary bg-white text-sm focus:outline-none focus:ring-[3px] focus:ring-primary-light"
          />
          <button
            onClick={saveRename}
            className="text-xs font-bold text-primary px-1.5 py-1.5 shrink-0"
          >
            저장
          </button>
          <button
            onClick={() => {
              setName(voice.name);
              setEditing(false);
            }}
            className="text-xs text-muted px-1 py-1.5 shrink-0"
          >
            취소
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="font-bold text-sm truncate min-w-0">{voice.name}</p>
              {voice.isDefault && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                  style={{ background: "var(--star)", color: "#5C4400" }}
                >
                  기본
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted mt-0.5 truncate">
              {shortDate(voice.createdAt)} 녹음
              {voice.usageCount > 0 ? ` · 동화 ${voice.usageCount}편에 사용` : ""}
            </p>
          </div>

          <button
            onClick={preview}
            className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 transition ${
              previewing
                ? "bg-primary text-white pulse-ring"
                : "bg-primary-light text-primary hover:bg-primary hover:text-white"
            }`}
            aria-label={previewing ? "정지" : "미리듣기"}
          >
            {previewing ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-soft transition"
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
                <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-xl shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      setName(voice.name);
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[13px] hover:bg-surface-soft transition flex items-center gap-2"
                  >
                    <Pencil size={14} /> 이름 변경
                  </button>
                  {!voice.isDefault && (
                    <button
                      onClick={setDefault}
                      className="w-full text-left px-3.5 py-2 text-[13px] hover:bg-surface-soft transition"
                    >
                      기본으로 설정
                    </button>
                  )}
                  <button
                    onClick={del}
                    className="w-full text-left px-3.5 py-2 text-[13px] text-danger hover:bg-danger/10 transition flex items-center gap-2"
                  >
                    <Trash size={14} /> 삭제
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
