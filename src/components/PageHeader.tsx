import type { ReactNode } from "react";
import BackButton from "@/components/BackButton";

// 서브페이지 공통 상단 헤더 — sticky glass 바, 상단 28px / 하단 20px 패딩 통일
export default function PageHeader({
  title,
  subtitle,
  onBack,
  actions,
  truncateTitle = false,
  containerClassName = "max-w-[1120px] mx-auto px-5 lg:px-8",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  truncateTitle?: boolean;
  containerClassName?: string;
}) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className={`${containerClassName} pt-[28px] pb-5 flex items-center gap-2`}>
        {onBack && <BackButton onClick={onBack} />}

        {truncateTitle ? (
          <h1 className="flex-1 min-w-0 text-[18px] font-extrabold truncate tracking-tight">
            {title}
          </h1>
        ) : (
          <div className="flex items-baseline gap-2 min-w-0 flex-1">
            <h1 className="text-[18px] font-extrabold tracking-tight shrink-0">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[13px] text-muted min-w-0 hidden sm:flex items-center gap-1">
                {/* 시그니처 초승달 (전 서브페이지 공통) */}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  className="shrink-0"
                  aria-hidden
                >
                  <path
                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                    fill="#F4C566"
                  />
                </svg>
                <span className="truncate">{subtitle}</span>
              </p>
            )}
          </div>
        )}

        {actions && (
          <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );
}
