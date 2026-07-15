// 카탈로그 로딩 스켈레톤 / 에러 상태 (홈·둘러보기 공용)

// 동화 카드 한 장 스켈레톤 — StoryCard(grid)와 동일한 형태
export function StoryCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="aspect-square bg-surface-soft" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-4/5 rounded bg-surface-soft" />
        <div className="h-3 w-2/5 rounded bg-surface-soft" />
      </div>
    </div>
  );
}

// 그리드형 스켈레톤 — /stories 및 홈 그리드 뷰용
export function StoryGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-3.5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <StoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

// 카탈로그 로드 실패 — 재시도 버튼 포함
export function CatalogError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3 opacity-50" aria-hidden>
        🌧️
      </p>
      <p className="text-foreground/80 text-base font-semibold">
        동화를 불러오지 못했어요
      </p>
      <p className="text-muted text-xs mt-1 mb-4">
        연결이 잠시 불안정했어요. 다시 시도해 주세요
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-dark transition shadow-sm shadow-primary/20"
      >
        다시 시도
      </button>
    </div>
  );
}
