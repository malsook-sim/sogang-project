// 앱 전체에서 내레이션(동화) 오디오는 항상 "단 하나"만 존재하도록 보장하는 싱글톤.
// new Audio()를 매번 만들면 플레이어 전환/뒤로가기 때 이전 인스턴스가 살아남아
// 소리가 겹쳐 재생되던 버그가 있었음. 하나의 엘리먼트를 재사용해 구조적으로 1개를 강제한다.

let el: HTMLAudioElement | null = null;

// 싱글톤 오디오 엘리먼트 (없으면 생성)
export function narrationAudio(): HTMLAudioElement {
  if (!el && typeof Audio !== "undefined") el = new Audio();
  return el as HTMLAudioElement;
}

// 재생 중지 + 소스/핸들러 완전 정리. 인스턴스 자체는 재사용을 위해 유지.
// (플레이어 언마운트, 동화 전환, 목소리 변경 시 반드시 호출)
export function stopNarration() {
  const a = el;
  if (!a) return;
  try {
    a.pause();
    a.onended = null;
    a.ontimeupdate = null;
    a.onloadedmetadata = null;
    a.onerror = null;
    a.onpause = null;
    a.onplay = null;
    try {
      a.currentTime = 0;
    } catch {
      // 일부 브라우저에서 src 없이 currentTime 설정 시 예외 — 무시
    }
    a.volume = 1; // 잠자기 페이드로 낮아진 볼륨 원복
    a.removeAttribute("src");
    a.src = "";
    a.load(); // 버퍼/네트워크 연결 해제
  } catch {
    // 정리 실패는 무시 (다음 재생이 src를 덮어씀)
  }
}
