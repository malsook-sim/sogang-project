"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import {
  Lock,
  Mic,
  Refresh,
  ChevronRight,
  Pencil,
  Play,
  Pause,
  Trash,
} from "@/components/Icon";
import { VoiceAvatar } from "@/components/VoiceAvatar";
import { RELATIONSHIPS } from "@/lib/relationships";
import { useMyVoices } from "@/lib/useMyVoices";

const scriptPool = [
  "옛날 옛날 깊은 산속에 작고 아늑한 오두막 한 채가 있었어요. 그곳에는 마음씨 착한 할머니와 귀여운 강아지가 함께 살았답니다.",
  "햇살이 따뜻한 어느 봄날 아침이었어요. 들판에는 노란 꽃들이 활짝 피어났고, 작은 나비들이 춤을 추듯 사뿐사뿐 날아다녔지요.",
  "아기 곰은 엄마 손을 꼭 잡고 숲길을 걸어갔어요. 나무 사이로 새들이 즐겁게 노래를 불렀고, 시냇물은 졸졸졸 맑은 소리를 냈답니다.",
  "별빛이 반짝이는 고요한 밤이 찾아왔어요. 달님은 창문 너머로 아이들을 가만히 지켜보며 포근하고 달콤한 잠을 선물해 주었답니다.",
  "용감한 소녀는 깊게 숨을 들이쉬고 한 걸음씩 앞으로 나아갔어요. 조금 무섭기도 했지만, 포기하지 않으면 분명 길이 보일 거라 믿었거든요.",
  "토끼는 깡충깡충 신나게 언덕을 올라갔어요. 언덕 위에서 내려다본 마을은 작고 평화로웠고, 바람은 살랑살랑 부드럽게 불어왔지요.",
  "엄마는 다정한 목소리로 아이에게 속삭였어요. 오늘도 정말 잘했어 우리 아가, 사랑한단다, 하고 이마에 살며시 입을 맞추었답니다.",
  "작은 씨앗 하나가 흙 속에서 쏙 고개를 내밀었어요. 따뜻한 햇살과 시원한 빗방울을 먹고 씨앗은 무럭무럭 자라나기 시작했답니다.",
  "친구들은 손을 잡고 둥글게 모여 빙글빙글 춤을 추었어요. 모두의 환한 웃음소리가 온 들판에 퍼져 하루가 더없이 즐거웠지요.",
  "하얀 눈이 소복소복 내려앉은 겨울밤이었어요. 아이는 따뜻한 이불 속에서 오늘 있었던 일을 떠올리며 행복한 미소를 지었답니다.",
];

function pickRandomScripts(): string[] {
  return [...scriptPool].sort(() => Math.random() - 0.5).slice(0, 3);
}

// 등록일 표기 (예: 5월 26일)
function longDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const CONSENT_KEY = "mvk.recordConsent";
const MIN_SECONDS = 30;
const BAR_COUNT = 32;

type RecordingState = "idle" | "recording" | "done";
type SubmitState = "ready" | "submitting" | "success" | "error";
type Mode = "list" | "theme" | "consent" | "recording";

function Check({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12l5 5 9-11"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Kebab() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="19" r="1.7" />
    </svg>
  );
}

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const mime of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(mime)
    ) {
      return mime;
    }
  }
  return "";
}

export default function RecordPage() {
  const router = useRouter();
  const { voices, refresh: refreshVoices } = useMyVoices();
  const [mode, setMode] = useState<Mode>("list");
  const [scripts, setScripts] = useState<string[]>(() => scriptPool.slice(0, 3));
  const [currentScript, setCurrentScript] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [completedScripts, setCompletedScripts] = useState<number[]>([]);
  const [recordings, setRecordings] = useState<(Blob | null)[]>(() =>
    Array(scripts.length).fill(null)
  );
  const [seconds, setSeconds] = useState(0);
  const [submitState, setSubmitState] = useState<SubmitState>("ready");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState("내 목소리");
  const [voiceEmoji, setVoiceEmoji] = useState("🎙️");
  const [themeId, setThemeId] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  // 목록 미리듣기용 (복제 목소리 TTS 재생 — 원본 샘플은 서버 미저장)
  const prevAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevUrlRef = useRef<string | null>(null);
  const prevReqRef = useRef(0);

  const stopPreview = () => {
    prevReqRef.current++;
    if (prevAudioRef.current) {
      prevAudioRef.current.pause();
      prevAudioRef.current = null;
    }
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
    setPreviewingId(null);
  };

  const handlePreview = async (voiceId: string) => {
    if (previewingId === voiceId) {
      stopPreview();
      return;
    }
    const reqId = ++prevReqRef.current;
    if (prevAudioRef.current) prevAudioRef.current.pause();
    setPreviewingId(voiceId);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "안녕, 오늘은 어떤 이야기를 들려줄까?",
          voiceId,
        }),
      });
      if (!res.ok || reqId !== prevReqRef.current) {
        if (reqId === prevReqRef.current) setPreviewingId(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (reqId !== prevReqRef.current) {
        URL.revokeObjectURL(url);
        return;
      }
      const audio = new Audio(url);
      prevAudioRef.current = audio;
      prevUrlRef.current = url;
      audio.onended = () => {
        if (reqId === prevReqRef.current) stopPreview();
      };
      audio.play().catch(() => {});
    } catch {
      if (reqId === prevReqRef.current) setPreviewingId(null);
    }
  };

  const handleSetDefaultVoice = async (id: string) => {
    setMenuId(null);
    try {
      await fetch(`/api/voices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ makeDefault: true }),
      });
      refreshVoices();
    } catch {
      // 무시
    }
  };

  const recorderRef = useRef<MediaRecorder | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef<string>("");

  // Web Audio 레벨미터
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  const allDone = completedScripts.length === scripts.length;
  const reachedMin = seconds >= MIN_SECONDS;

  const stopMeter = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    freqRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    barRefs.current.forEach((el) => {
      if (el) el.style.height = "4px";
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      previewRef.current?.pause();
      prevAudioRef.current?.pause();
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      stopMeter();
    };
  }, []);

  useEffect(() => {
    if (allDone && submitState === "ready") {
      void submitForCloning();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const startMeter = (stream: MediaStream) => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = BAR_COUNT * 2;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      freqRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      const tick = () => {
        const a = analyserRef.current;
        const f = freqRef.current;
        if (a && f) {
          a.getByteFrequencyData(f);
          for (let i = 0; i < BAR_COUNT; i++) {
            const v = (f[i] ?? 0) / 255;
            const el = barRefs.current[i];
            if (el) el.style.height = `${4 + v * 44}px`;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // 레벨미터 실패해도 녹음은 진행
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startMeter(stream);
      const mime = pickMimeType();
      mimeRef.current = mime;
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeRef.current || "audio/webm",
        });
        setRecordings((prev) => {
          const next = [...prev];
          next[currentScript] = blob;
          return next;
        });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecordingState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      setErrorMsg(
        err instanceof Error && err.name === "NotAllowedError"
          ? "마이크 권한을 허용해주세요."
          : "마이크에 접근할 수 없어요. 브라우저 설정을 확인해주세요."
      );
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopMeter();
    setRecordingState("done");
  };

  const handleRecord = () => {
    if (recordingState === "idle") {
      void startRecording();
    } else if (recordingState === "recording") {
      stopRecording();
    }
  };

  const handleNext = () => {
    if (!completedScripts.includes(currentScript)) {
      setCompletedScripts([...completedScripts, currentScript]);
    }
    if (currentScript < scripts.length - 1) {
      setCurrentScript(currentScript + 1);
      setRecordingState("idle");
      setSeconds(0);
    }
  };

  const handleRetry = () => {
    setRecordingState("idle");
    setSeconds(0);
    setRecordings((prev) => {
      const next = [...prev];
      next[currentScript] = null;
      return next;
    });
  };

  const playRecording = () => {
    const blob = recordings[currentScript];
    if (!blob) return;
    if (previewRef.current) previewRef.current.pause();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    previewRef.current = audio;
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play().catch(() => {});
  };

  const saveRename = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    setEditingId(null);
    try {
      await fetch(`/api/voices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      refreshVoices();
    } catch {
      // 무시
    }
  };

  // 이름 중복 방지 자동 넘버링 ("엄마 목소리" 있으면 "엄마 목소리 2")
  const uniqueVoiceName = (base: string) => {
    const names = new Set(voices.map((v) => v.name));
    if (!names.has(base)) return base;
    let n = 2;
    while (names.has(`${base} ${n}`)) n++;
    return `${base} ${n}`;
  };

  const handleDeleteVoice = async (id: string, usageCount = 0) => {
    const msg =
      usageCount > 0
        ? `이 목소리를 삭제할까요?\n동화 ${usageCount}편이 기본 목소리로 바뀌어요.`
        : "이 목소리를 삭제할까요?";
    if (!confirm(msg)) return;
    try {
      await fetch(`/api/voices/${id}`, { method: "DELETE" });
      refreshVoices();
    } catch {
      // 무시
    }
  };

  const resetRecording = () => {
    setCurrentScript(0);
    setRecordingState("idle");
    setCompletedScripts([]);
    setRecordings(Array(scripts.length).fill(null));
    setSeconds(0);
    setSubmitState("ready");
    setErrorMsg(null);
    setVoiceName("내 목소리");
    setVoiceEmoji("🎙️");
    setThemeId(null);
  };

  const startNewRecording = () => {
    setScripts(pickRandomScripts());
    resetRecording();
    setMode("theme");
  };

  const proceedFromTheme = () => {
    if (!themeId) return;
    let consented = false;
    try {
      consented = localStorage.getItem(CONSENT_KEY) === "1";
    } catch {
      consented = false;
    }
    setMode(consented ? "recording" : "consent");
  };

  const agreeConsent = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      // localStorage 사용 불가 시에도 진행
    }
    setMode("recording");
  };

  const backToList = () => {
    setMode("list");
    refreshVoices();
  };

  const submitForCloning = async () => {
    setSubmitState("submitting");
    setErrorMsg(null);
    try {
      const form = new FormData();
      form.append("name", voiceName || "내 목소리");
      form.append("emoji", voiceEmoji);
      const ext = mimeRef.current.includes("mp4") ? "mp4" : "webm";
      recordings.forEach((blob, i) => {
        if (blob) form.append("files", blob, `sample-${i + 1}.${ext}`);
      });
      const res = await fetch("/api/voices/clone", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "목소리를 만들지 못했어요.");
      }
      setSubmitState("success");
    } catch (err) {
      setSubmitState("error");
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
    }
  };

  const containerW = "max-w-[960px]";

  return (
    <>
      <PageHeader
        title="목소리 녹음"
        subtitle={
          mode === "list"
            ? "엄마·아빠 목소리로 동화를 들려줄 수 있어요"
            : undefined
        }
        onBack={mode !== "list" ? () => setMode("list") : undefined}
        containerClassName="max-w-[960px] mx-auto px-5"
      />

      <div className={`${containerW} mx-auto px-5 py-6`}>
        {mode === "list" && (
          <>
            {/* 새 목소리 등록 히어로 — 목소리가 하나라도 있을 때만.
                비어 있으면 아래 "첫 목소리를 등록해보세요" 안내만 노출 */}
            {voices.length > 0 && (
            <div className="record-hero relative overflow-hidden rounded-2xl bg-[var(--primary-light)] p-5 sm:p-6 mb-6">
              {/* 우상단 마이크 워터마크 */}
              <div className="absolute top-3 right-4 text-primary opacity-[0.12] pointer-events-none">
                <Mic size={64} filled />
              </div>
              {/* 우측 파형 그래픽 */}
              <div className="absolute right-5 sm:right-7 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-[4px] h-10 pointer-events-none">
                {[14, 26, 38, 22, 32, 18].map((h, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-primary/50"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[#3C3489] font-extrabold text-[17px] mb-1">
                    새 목소리 등록하기
                  </h2>
                  <p className="text-[13px] text-[#5C5680] leading-relaxed">
                    조용한 곳에서 30초면 충분해요
                    <br className="sm:hidden" /> · 가족 누구든 좋아요
                  </p>
                </div>
                <button
                  onClick={startNewRecording}
                  className="shrink-0 bg-primary text-white font-bold text-sm px-5 h-10 rounded-full hover:bg-primary-dark transition inline-flex items-center gap-1.5"
                >
                  <Mic size={16} filled />
                  녹음 시작
                </button>
              </div>
            </div>
            )}

            {voices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {voices.map((v) => (
                  <div
                    key={v.id}
                    className="card p-3.5 flex items-center gap-3"
                  >
                    <VoiceAvatar emoji={v.emoji} size={38} />
                    {editingId === v.id ? (
                      <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          className="flex-1 min-w-0 h-9 px-2.5 rounded-[10px] border border-primary bg-white text-sm focus:outline-none focus:ring-[3px] focus:ring-primary-light"
                        />
                        <button
                          onClick={() => saveRename(v.id)}
                          className="text-xs font-bold text-primary px-1.5 py-1.5 shrink-0"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-muted px-1 py-1.5 shrink-0"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="font-bold text-sm truncate min-w-0">
                              {v.name}
                            </p>
                            {v.isDefault && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                                style={{ background: "var(--star)", color: "#5C4400" }}
                              >
                                기본
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted mt-0.5 truncate">
                            {longDate(v.createdAt)} 등록
                            {v.usageCount > 0
                              ? ` · 동화 ${v.usageCount}편에서 사용 중`
                              : ""}
                          </p>
                        </div>

                        {/* 미리듣기 */}
                        <button
                          onClick={() => handlePreview(v.id)}
                          className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 transition text-[var(--primary-deep)] ${
                            previewingId === v.id
                              ? "bg-surface-2 pulse-ring"
                              : "bg-surface-2 hover:brightness-95"
                          }`}
                          aria-label={previewingId === v.id ? "정지" : "미리듣기"}
                        >
                          {previewingId === v.id ? (
                            <Pause size={13} />
                          ) : (
                            <Play size={13} />
                          )}
                        </button>

                        {/* 케밥 메뉴 */}
                        <div className="relative shrink-0">
                          <button
                            onClick={() =>
                              setMenuId(menuId === v.id ? null : v.id)
                            }
                            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-soft transition"
                            aria-label="더보기"
                          >
                            <Kebab />
                          </button>
                          {menuId === v.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setMenuId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-xl shadow-lg py-1 z-50">
                                {!v.isDefault && (
                                  <button
                                    onClick={() => handleSetDefaultVoice(v.id)}
                                    className="w-full text-left px-3.5 py-2 text-[13px] hover:bg-surface-soft transition flex items-center gap-2"
                                  >
                                    <Check size={14} /> 기본 목소리로 설정
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingId(v.id);
                                    setEditName(v.name);
                                    setMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[13px] hover:bg-surface-soft transition flex items-center gap-2"
                                >
                                  <Pencil size={14} /> 이름 바꾸기
                                </button>
                                <button
                                  onClick={() => {
                                    setMenuId(null);
                                    handlePreview(v.id);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[13px] hover:bg-surface-soft transition flex items-center gap-2"
                                >
                                  <Play size={14} /> 미리 듣기
                                </button>
                                <button
                                  onClick={() => {
                                    setMenuId(null);
                                    handleDeleteVoice(v.id, v.usageCount);
                                  }}
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
                ))}
              </div>
            ) : (
              <div className="card p-10 text-center border-dashed">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
                  <Mic size={30} filled />
                </div>
                <p className="text-base text-foreground font-bold">
                  첫 목소리를 등록해보세요
                </p>
                <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
                  엄마·아빠 목소리로 동화를 들려줄 수 있어요
                </p>
                <button
                  onClick={startNewRecording}
                  className="mt-5 inline-flex items-center gap-1.5 bg-primary text-white font-bold text-sm px-5 h-11 rounded-full hover:bg-primary-dark transition"
                >
                  <Mic size={16} filled /> 목소리 등록하기
                </button>
              </div>
            )}
          </>
        )}

        {mode === "theme" && (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
                <Mic size={24} filled />
              </div>
              <h2 className="text-lg font-extrabold mb-1 tracking-tight">
                누구 목소리인가요?
              </h2>
              <p className="text-sm text-muted">
                녹음할 목소리의 주인공을 골라주세요
              </p>
            </div>
            {/* auto-fit 중앙 정렬 (7개면 4+3이 가운데로) */}
            <div className="flex flex-wrap justify-center gap-2.5 mb-4">
              {RELATIONSHIPS.map((t) => {
                const selected = themeId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setThemeId(t.id);
                      setVoiceEmoji(t.emoji);
                      setVoiceName(t.id === "etc" ? "" : uniqueVoiceName(t.name));
                      if (t.id !== "etc") setCustomRole("");
                    }}
                    className={`relative w-[80px] rounded-2xl p-3 flex flex-col items-center gap-2 transition ${
                      selected
                        ? "bg-primary-light border-2 border-primary"
                        : "bg-surface border border-border hover:border-border-strong"
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                        <Check size={10} />
                      </span>
                    )}
                    <VoiceAvatar emoji={t.emoji} size={40} />
                    <span className="text-xs font-bold">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 기타 선택 시 관계 직접 입력 */}
            {themeId === "etc" && (
              <input
                value={customRole}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomRole(val);
                  setVoiceName(
                    val.trim() ? uniqueVoiceName(`${val.trim()} 목소리`) : ""
                  );
                }}
                placeholder="관계를 입력해주세요 (예: 이모, 삼촌)"
                maxLength={10}
                autoFocus
                className="w-full max-w-[340px] mx-auto block h-11 px-3.5 mb-4 rounded-[10px] bg-field border border-border text-sm text-center focus:outline-none focus:border-[1.5px] focus:border-primary focus:ring-[3px] focus:ring-primary-light transition"
              />
            )}

            {(!themeId || (themeId === "etc" && !customRole.trim())) && (
              <p className="text-center text-[12px] text-muted mb-2">
                누구 목소리인지 골라주세요
              </p>
            )}
            <div className="flex justify-center">
              <button
                onClick={proceedFromTheme}
                disabled={!themeId || (themeId === "etc" && !customRole.trim())}
                className="w-full max-w-[300px] py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {mode === "consent" && (
          <div className="card p-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
                <Lock size={24} />
              </div>
              <h2 className="text-lg font-extrabold mb-1 tracking-tight">
                목소리 데이터 수집 동의
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                녹음된 목소리는 AI 음성 합성에만 사용되며,
                <br />
                제3자에게 제공되지 않습니다.
              </p>
            </div>
            <div className="bg-surface-soft border border-border rounded-xl p-4 mb-5 text-xs text-foreground/70 leading-relaxed max-h-36 overflow-y-auto space-y-2.5">
              <div>
                <p className="font-bold text-foreground mb-0.5">수집 항목</p>
                <p>· 음성 녹음 파일 (WebM / MP4)</p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-0.5">이용 목적</p>
                <p>· AI 음성 복제 및 동화 낭독 서비스 제공</p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-0.5">보관 기간</p>
                <p>· 회원 탈퇴 또는 삭제 요청 시 즉시 파기</p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-0.5">제3자 제공</p>
                <p>· ElevenLabs (음성 합성 처리, 암호화 전송)</p>
              </div>
            </div>
            <button
              onClick={agreeConsent}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20"
            >
              동의하고 녹음 시작
            </button>
            <button
              onClick={() => setMode("list")}
              className="w-full py-2 mt-2 text-sm text-muted hover:text-foreground transition"
            >
              다음에 할게요
            </button>
          </div>
        )}

        {mode === "recording" && (
          <>
            <div className="flex gap-1.5 mb-8">
              {scripts.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    completedScripts.includes(i)
                      ? "bg-primary"
                      : i === currentScript
                      ? "bg-primary/40"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>

            {!allDone ? (
              <>
                <div className="text-center mb-6">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted font-semibold mb-2">
                    Script {currentScript + 1} / {scripts.length}
                  </p>
                  <h2 className="text-lg font-bold mb-1.5 tracking-tight">
                    아래 문장을 따라 읽어주세요
                  </h2>
                  <p className="text-xs text-muted">
                    조용한 곳에서 또렷하게 읽어주시면 좋아요
                  </p>
                </div>

                <div className="card p-7 mb-6 text-center bg-surface-soft border-dashed">
                  <p className="text-lg leading-relaxed font-medium text-foreground/90 tracking-tight">
                    &ldquo;{scripts[currentScript]}&rdquo;
                  </p>
                </div>

                {/* 실시간 입력 레벨 (Web Audio) */}
                <div className="flex items-end justify-center gap-[3px] h-14 mb-4">
                  {Array.from({ length: BAR_COUNT }).map((_, i) => (
                    <div
                      key={i}
                      ref={(el) => {
                        barRefs.current[i] = el;
                      }}
                      className={`w-[3px] rounded-full transition-colors ${
                        recordingState === "recording"
                          ? "bg-primary"
                          : "bg-border-strong"
                      }`}
                      style={{ height: "4px" }}
                    />
                  ))}
                </div>

                {/* 경과 시간 + 30초 최소 게이지 */}
                {recordingState !== "idle" ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[22px] font-mono font-bold text-primary tabular-nums">
                        {Math.floor(seconds / 60)}:
                        {(seconds % 60).toString().padStart(2, "0")}
                      </span>
                      {reachedMin ? (
                        <span className="inline-flex items-center gap-1 text-[13px] font-bold text-primary">
                          <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                            <Check size={10} />
                          </span>
                          충분해요!
                        </span>
                      ) : (
                        <span className="text-[13px] text-muted tabular-nums">
                          {MIN_SECONDS - seconds}초 더
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full bg-primary-light overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (seconds / MIN_SECONDS) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted mb-6">
                    최소 <span className="font-bold text-foreground">30초</span> 이상
                    녹음이 필요해요
                  </p>
                )}

                {errorMsg && (
                  <p className="text-center text-xs text-danger mb-4">{errorMsg}</p>
                )}

                {recordingState === "done" ? (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={playRecording}
                      className="py-3 rounded-xl border border-border text-[13px] font-semibold hover:bg-surface transition flex flex-col items-center gap-1"
                    >
                      <Play size={16} />
                      다시 듣기
                    </button>
                    <button
                      onClick={handleRetry}
                      className="py-3 rounded-xl border border-border text-[13px] font-semibold hover:bg-surface transition flex flex-col items-center gap-1"
                    >
                      <Refresh size={16} />
                      다시 녹음
                    </button>
                    <button
                      onClick={handleNext}
                      className="py-3 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20 flex flex-col items-center gap-1"
                    >
                      <ChevronRight size={16} />
                      {currentScript < scripts.length - 1 ? "다음" : "완료"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={handleRecord}
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 bg-primary text-white shadow-primary/30 ${
                        recordingState === "recording" ? "pulse-ring" : ""
                      }`}
                      aria-label={
                        recordingState === "recording" ? "녹음 멈추기" : "녹음 시작"
                      }
                    >
                      {recordingState === "recording" ? (
                        <span className="w-6 h-6 bg-white rounded-md" />
                      ) : (
                        <Mic size={28} filled />
                      )}
                    </button>
                    <p
                      className={`text-xs ${
                        recordingState === "recording"
                          ? "text-primary font-medium"
                          : "text-muted"
                      }`}
                    >
                      {recordingState === "recording"
                        ? "녹음 중... 버튼을 눌러 멈추기"
                        : "버튼을 눌러 녹음을 시작하세요"}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                {submitState === "submitting" && (
                  <>
                    <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary-light flex items-center justify-center">
                      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h2 className="text-xl font-extrabold mb-2 tracking-tight">
                      목소리 만드는 중...
                    </h2>
                    <p className="text-sm text-muted leading-relaxed mb-6">
                      내 목소리를 만들고 있어요.
                      <br />
                      잠시만 기다려주세요 (약 10~30초)
                    </p>
                    <div className="card p-4">
                      <div className="flex items-center gap-3">
                        <VoiceAvatar emoji={voiceEmoji} size={44} />
                        <div className="text-left flex-1">
                          <p className="font-bold text-sm">{voiceName}</p>
                          <p className="text-xs text-muted">만드는 중...</p>
                        </div>
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    </div>
                  </>
                )}

                {submitState === "success" && (
                  <>
                    <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary text-white flex items-center justify-center text-3xl">
                      ✓
                    </div>
                    <h2 className="text-xl font-extrabold mb-2 tracking-tight">
                      목소리 완성!
                    </h2>
                    <p className="text-sm text-muted leading-relaxed mb-7">
                      이제 이 목소리로 동화를 들려줄 수 있어요.
                    </p>
                    <button
                      onClick={backToList}
                      className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20"
                    >
                      내 목소리 목록 보기
                    </button>
                  </>
                )}

                {submitState === "error" && (
                  <>
                    <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-danger/10 text-danger flex items-center justify-center text-2xl">
                      !
                    </div>
                    <h2 className="text-xl font-extrabold mb-2 tracking-tight">
                      목소리를 못 만들었어요
                    </h2>
                    <p className="text-sm text-muted leading-relaxed mb-7">
                      {errorMsg || "다시 시도해주세요."}
                    </p>
                    <button
                      onClick={() => submitForCloning()}
                      className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20 mb-2"
                    >
                      다시 해보기
                    </button>
                    <button
                      onClick={backToList}
                      className="w-full py-3 rounded-xl border border-border font-semibold text-sm hover:bg-surface transition"
                    >
                      목록으로 돌아가기
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
