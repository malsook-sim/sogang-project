"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Lock,
  Mic,
  Refresh,
  ChevronRight,
  Pencil,
  Play,
  Trash,
} from "@/components/Icon";
import { useMyVoices } from "@/lib/useMyVoices";

// 한 번에 읽을 짧은 지문 — 3개만 읽어도 복제에 충분하도록 적당히 길게
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

// 녹음 일시 표기 (예: 2026.5.20 15:24)
function formatRecordedAt(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

const CONSENT_KEY = "mvk.recordConsent";

// 녹음 대상자 테마 — 목소리 이름·이모지 기본값을 정함
const VOICE_THEMES = [
  { id: "mom", label: "엄마", emoji: "👩", name: "엄마 목소리" },
  { id: "dad", label: "아빠", emoji: "👨", name: "아빠 목소리" },
  { id: "grandma", label: "할머니", emoji: "👵", name: "할머니 목소리" },
  { id: "grandpa", label: "할아버지", emoji: "👴", name: "할아버지 목소리" },
  { id: "bro", label: "오빠", emoji: "👦", name: "오빠 목소리" },
  { id: "sis", label: "언니", emoji: "👧", name: "언니 목소리" },
  { id: "etc", label: "기타", emoji: "🎙️", name: "내 목소리" },
];

type RecordingState = "idle" | "recording" | "done";
type SubmitState = "ready" | "submitting" | "success" | "error";
type Mode = "list" | "theme" | "consent" | "recording";

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
  const [scripts, setScripts] = useState<string[]>(() =>
    scriptPool.slice(0, 3)
  );
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef<string>("");

  const allDone = completedScripts.length === scripts.length;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      previewRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (allDone && submitState === "ready") {
      void submitForCloning();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
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

  // 방금 녹음한 내 목소리 들어보기
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

  // 녹음된 목소리 이름 바꾸기
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

  // 녹음된 목소리 삭제
  const handleDeleteVoice = async (id: string) => {
    if (!confirm("이 목소리를 삭제할까요?")) return;
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
      const res = await fetch("/api/voices/clone", {
        method: "POST",
        body: form,
      });
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

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="max-w-lg lg:max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => (mode === "list" ? router.back() : setMode("list"))}
            className="w-10 h-10 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-foreground transition"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-sm tracking-tight">목소리 녹음</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg lg:max-w-2xl mx-auto px-5 py-6">
        {mode === "list" && (
          <>
            <div className="text-center mb-7">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
                <Mic size={24} filled />
              </div>
              <h2 className="text-xl font-extrabold mb-1.5 tracking-tight">
                내 목소리
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                녹음한 목소리로 동화를 들려줄 수 있어요
              </p>
            </div>

            {voices.length > 0 ? (
              <div className="space-y-2.5 mb-5">
                {voices.map((v) => (
                  <div
                    key={v.id}
                    className="card p-4 flex items-center gap-3.5"
                  >
                    <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-xl flex-shrink-0">
                      {v.emoji}
                    </div>
                    {editingId === v.id ? (
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-primary bg-surface text-sm focus:outline-none"
                        />
                        <button
                          onClick={() => saveRename(v.id)}
                          className="text-xs font-bold text-primary px-2 py-1.5 flex-shrink-0"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-muted px-1 py-1.5 flex-shrink-0"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">
                            {v.name}
                          </p>
                          <p className="text-xs text-muted">
                            {formatRecordedAt(v.createdAt)} 녹음
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingId(v.id);
                            setEditName(v.name);
                          }}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-primary-light transition flex-shrink-0"
                          aria-label="이름 수정"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteVoice(v.id)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-danger/10 transition flex-shrink-0"
                          aria-label="삭제"
                        >
                          <Trash size={16} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center mb-5 border-dashed">
                <p className="text-sm text-foreground/70 font-medium">
                  아직 녹음한 목소리가 없어요
                </p>
                <p className="text-xs text-muted mt-1">
                  새로 녹음해서 나만의 목소리를 만들어 보세요
                </p>
              </div>
            )}

            <button
              onClick={startNewRecording}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Mic size={18} filled />
              새로 녹음하기
            </button>
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
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {VOICE_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setThemeId(t.id);
                    setVoiceName(t.name);
                    setVoiceEmoji(t.emoji);
                  }}
                  className={`card p-4 flex flex-col items-center gap-1.5 transition ${
                    themeId === t.id
                      ? "!border-primary ring-2 ring-primary/25"
                      : "hover:border-border-strong"
                  }`}
                >
                  <span className="text-3xl">{t.emoji}</span>
                  <span className="text-xs font-bold">{t.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={proceedFromTheme}
              disabled={!themeId}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음
            </button>
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
                <div className="text-center mb-7">
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

                <div className="card p-7 mb-8 text-center bg-surface-soft border-dashed">
                  <p className="text-lg leading-relaxed font-medium text-foreground/90 tracking-tight">
                    &ldquo;{scripts[currentScript]}&rdquo;
                  </p>
                </div>

                <div className="flex items-end justify-center gap-[3px] h-16 mb-6">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const height =
                      recordingState === "recording"
                        ? Math.random() * 44 + 6
                        : 6;
                    return (
                      <div
                        key={i}
                        className={`w-[3px] rounded-full transition-all duration-150 ${
                          recordingState === "recording"
                            ? "bg-primary"
                            : "bg-border-strong"
                        }`}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>

                {recordingState !== "idle" && (
                  <p className="text-center text-2xl font-mono font-bold mb-6 text-primary tabular-nums">
                    {Math.floor(seconds / 60)}:
                    {(seconds % 60).toString().padStart(2, "0")}
                  </p>
                )}

                {errorMsg && (
                  <p className="text-center text-xs text-danger mb-4">
                    {errorMsg}
                  </p>
                )}

                <div className="flex flex-col items-center gap-4">
                  {recordingState === "done" ? (
                    <div className="w-full">
                      <button
                        onClick={playRecording}
                        className="w-full py-3 mb-3 rounded-xl bg-secondary-light text-secondary text-sm font-bold hover:bg-secondary hover:text-white transition flex items-center justify-center gap-1.5"
                      >
                        <Play size={15} />
                        녹음 들어보기
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={handleRetry}
                          className="flex-1 py-3.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition flex items-center justify-center gap-1.5"
                        >
                          <Refresh size={16} />
                          다시 녹음
                        </button>
                        <button
                          onClick={handleNext}
                          className="flex-1 py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20 flex items-center justify-center gap-1.5"
                        >
                          {currentScript < scripts.length - 1 ? (
                            <>
                              다음 문장
                              <ChevronRight size={16} />
                            </>
                          ) : (
                            "완료"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={handleRecord}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                          recordingState === "recording"
                            ? "bg-danger text-white shadow-danger/30 pulse-ring"
                            : "bg-primary text-white shadow-primary/30"
                        }`}
                        aria-label={
                          recordingState === "recording"
                            ? "녹음 멈추기"
                            : "녹음 시작"
                        }
                      >
                        {recordingState === "recording" ? (
                          <span className="w-5 h-5 bg-white rounded-sm" />
                        ) : (
                          <Mic size={28} filled />
                        )}
                      </button>
                    </div>
                  )}

                  {recordingState === "idle" && (
                    <p className="text-xs text-muted">
                      버튼을 눌러 녹음을 시작하세요
                    </p>
                  )}
                  {recordingState === "recording" && (
                    <p className="text-xs text-danger font-medium">
                      녹음 중... 버튼을 눌러 멈추기
                    </p>
                  )}
                </div>
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
                        <div className="w-11 h-11 bg-primary-light rounded-full flex items-center justify-center text-xl">
                          {voiceEmoji}
                        </div>
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
