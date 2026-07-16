// 브랜드 로딩 오버레이 — 로고 심볼 + 뱅글뱅글 도는 링 + 안내 문구
export default function BrandLoader({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[var(--background)]">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* 뱅글뱅글 도는 링 (낮=보라 / 잠자기=골드) */}
        <span className="absolute inset-0 rounded-full border-[3px] border-primary/15 border-t-primary animate-spin" />
        {/* 로고 심볼 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/symbol.svg" alt="마이보이스스토리" className="brand-logo w-12 h-12" />
      </div>
      {text && (
        <p className="text-sm font-semibold text-foreground/80">{text}</p>
      )}
    </div>
  );
}
