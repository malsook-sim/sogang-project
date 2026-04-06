"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const scripts = [
  "옛날 옛날에 작은 마을이 있었어요.",
  "하늘은 높고 파란 가을이었답니다.",
  "토끼가 깡충깡충 뛰어서 숲속으로 갔어요.",
  "엄마가 따뜻한 목소리로 말했어요. 사랑한다, 우리 아가.",
  "그래서 모두 함께 행복하게 살았답니다.",
];

type RecordingState = "idle" | "recording" | "done";

export default function RecordPage() {
  const router = useRouter();
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [currentScript, setCurrentScript] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [completedScripts, setCompletedScripts] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(0);

  const allDone = completedScripts.length === scripts.length;

  const handleRecord = () => {
    if (recordingState === "idle") {
      setRecordingState("recording");
      setSeconds(0);
      // 시뮬레이션: 녹음 타이머
      const interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
      (window as unknown as Record<string, unknown>).__recInterval = interval;
    } else if (recordingState === "recording") {
      setRecordingState("done");
      const interval = (window as unknown as Record<string, unknown>)
        .__recInterval as ReturnType<typeof setInterval>;
      if (interval) clearInterval(interval);
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
  };

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition text-lg"
          >
            ←
          </button>
          <h1 className="font-bold text-sm">목소리 녹음</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Privacy consent gate */}
        {!privacyAgreed && (
          <div className="mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🔒</div>
                <h2 className="text-lg font-extrabold mb-1">
                  목소리 데이터 수집 동의
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  녹음된 목소리는 AI 음성 합성에만 사용되며,
                  <br />
                  제3자에게 제공되지 않습니다.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-xs text-gray-600 leading-relaxed max-h-32 overflow-y-auto">
                <p className="font-bold mb-1">수집 항목</p>
                <p className="mb-2">· 음성 녹음 파일 (WAV/M4A)</p>
                <p className="font-bold mb-1">이용 목적</p>
                <p className="mb-2">· AI 음성 복제 및 동화 낭독 서비스 제공</p>
                <p className="font-bold mb-1">보관 기간</p>
                <p className="mb-2">· 회원 탈퇴 시 또는 삭제 요청 시 즉시 파기</p>
                <p className="font-bold mb-1">제3자 제공</p>
                <p>· ElevenLabs (음성 합성 처리 목적, 암호화 전송)</p>
              </div>
              <button
                onClick={() => setPrivacyAgreed(true)}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition"
              >
                동의하고 녹음 시작
              </button>
              <button
                onClick={() => router.back()}
                className="w-full py-2 mt-2 text-sm text-muted hover:text-gray-600 transition"
              >
                다음에 할게요
              </button>
            </div>
          </div>
        )}

        {privacyAgreed && <>
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {scripts.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                completedScripts.includes(i)
                  ? "bg-success"
                  : i === currentScript
                  ? "bg-primary"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {!allDone ? (
          <>
            {/* Guide */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 bg-secondary-light text-secondary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                🎙️ {currentScript + 1} / {scripts.length}
              </div>
              <h2 className="text-lg font-bold mb-2">
                아래 문장을 따라 읽어주세요
              </h2>
              <p className="text-xs text-muted">
                조용한 곳에서 또렷하게 읽어주시면 더 좋은 결과를 얻을 수 있어요
              </p>
            </div>

            {/* Script card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8 text-center">
              <p className="text-lg leading-relaxed font-medium text-gray-800">
                &ldquo;{scripts[currentScript]}&rdquo;
              </p>
            </div>

            {/* Waveform placeholder */}
            <div className="flex items-center justify-center gap-1 h-16 mb-6">
              {Array.from({ length: 30 }).map((_, i) => {
                const height =
                  recordingState === "recording"
                    ? Math.random() * 40 + 8
                    : 8;
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      recordingState === "recording"
                        ? "bg-primary"
                        : "bg-gray-200"
                    }`}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>

            {/* Timer */}
            {recordingState !== "idle" && (
              <p className="text-center text-2xl font-mono font-bold mb-6 text-primary">
                {Math.floor(seconds / 60)}:
                {(seconds % 60).toString().padStart(2, "0")}
              </p>
            )}

            {/* Controls */}
            <div className="flex flex-col items-center gap-4">
              {recordingState === "done" ? (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    🔄 다시 녹음
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition shadow-md shadow-primary/20"
                  >
                    {currentScript < scripts.length - 1
                      ? "다음 문장 →"
                      : "✅ 완료"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRecord}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all active:scale-95 ${
                    recordingState === "recording"
                      ? "bg-red-500 text-white shadow-red-500/30 animate-pulse"
                      : "bg-primary text-white shadow-primary/30"
                  }`}
                >
                  {recordingState === "recording" ? "⏹" : "🎙️"}
                </button>
              )}

              {recordingState === "idle" && (
                <p className="text-xs text-muted">
                  버튼을 눌러 녹음을 시작하세요
                </p>
              )}
              {recordingState === "recording" && (
                <p className="text-xs text-red-400 font-medium">
                  녹음 중... 버튼을 눌러 중지하세요
                </p>
              )}
            </div>
          </>
        ) : (
          /* Completion screen */
          <div className="text-center py-10">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-extrabold mb-2">녹음 완료!</h2>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              목소리를 분석하고 있어요.
              <br />
              잠시 후 동화를 들려줄 수 있게 될 거예요.
            </p>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center text-xl">
                  🎙️
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">내 목소리</p>
                  <p className="text-xs text-muted">처리 중...</p>
                </div>
                <div className="ml-auto">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/20"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
        </>}
      </div>

      <BottomNav />
    </>
  );
}
