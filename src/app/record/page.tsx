"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Lock, Mic, Refresh, ChevronRight } from "@/components/Icon";

const scripts = [
  "옛날 옛날에 작은 마을이 있었어요.",
  "하늘은 높고 파란 가을이었답니다.",
  "토끼가 깡충깡충 뛰어서 숲속으로 갔어요.",
  "엄마가 따뜻한 목소리로 말했어요. 사랑한다, 우리 아가.",
  "그래서 모두 함께 행복하게 살았답니다.",
];

type RecordingState = "idle" | "recording" | "done";
type SubmitState = "ready" | "submitting" | "success" | "error";

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return "";
}

export default function RecordPage() {
  const router = useRouter();
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [currentScript, setCurrentScript] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [completedScripts, setCompletedScripts] = useState<number[]>([]);
  const [recordings, setRecordings] = useState<(Blob | null)[]>(
    () => Array(scripts.length).fill(null)
  );
  const [seconds, setSeconds] = useState(0);
  const [submitState, setSubmitState] = useState<SubmitState>("ready");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState("내 목소리");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef<string>("");

  const allDone = completedScripts.length === scripts.length;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
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

  const submitForCloning = async () => {
    setSubmitState("submitting");
    setErrorMsg(null);
    try {
      const form = new FormData();
      form.append("name", voiceName || "내 목소리");
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
      setTimeout(() => router.push("/voices"), 1200);
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
            onClick={() => router.back()}
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
        {!privacyAgreed && (
          <div className="mb-6">
            <div className="card p-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-light text-primary flex items-center justify-center">
                  <Lock size={24} />
                </div>
                <h2 className="text-lg font-extrabold mb-1 tracking-tight">
                  목소리 데이터 수집 동의
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  녹음된 목소리는 AI 음성 합성에만 사용되며,<br />
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
                onClick={() => setPrivacyAgreed(true)}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20"
              >
                동의하고 녹음 시작
              </button>
              <button
                onClick={() => router.back()}
                className="w-full py-2 mt-2 text-sm text-muted hover:text-foreground transition"
              >
                다음에 할게요
              </button>
            </div>
          </div>
        )}

        {privacyAgreed && (
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
                    <div className="flex gap-3 w-full">
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
                  ) : (
                    <div className="relative">
                      <button
                        onClick={handleRecord}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                          recordingState === "recording"
                            ? "bg-danger text-white shadow-danger/30 pulse-ring"
                            : "bg-primary text-white shadow-primary/30"
                        }`}
                        aria-label={recordingState === "recording" ? "녹음 멈추기" : "녹음 시작"}
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
                      내 목소리를 만들고 있어요.<br />
                      잠시만 기다려주세요 (약 10~30초)
                    </p>
                    <div className="card p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-primary-light text-primary rounded-full flex items-center justify-center">
                          <Mic size={20} filled />
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
                      onClick={() => router.push("/voices")}
                      className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20"
                    >
                      목소리 고르러 가기 →
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
                      onClick={() => router.push("/voices")}
                      className="w-full py-3 rounded-xl border border-border font-semibold text-sm hover:bg-surface transition"
                    >
                      홈으로 돌아가기
                    </button>
                  </>
                )}

                {submitState === "ready" && (
                  <>
                    <h2 className="text-xl font-extrabold mb-2 tracking-tight">
                      거의 다 됐어요
                    </h2>
                    <div className="mb-6 text-left">
                      <label className="text-xs text-muted font-semibold block mb-2">
                        목소리 이름
                      </label>
                      <input
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-primary transition"
                        placeholder="예: 엄마 목소리"
                      />
                    </div>
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
