import type { ReactNode } from "react";
import { ChevronLeft } from "@/components/Icon";

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
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 -ml-1 shrink-0 rounded-full hover:bg-surface flex items-center justify-center text-muted hover:text-foreground transition"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} />
          </button>
        )}

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
              <p className="text-[13px] text-muted truncate hidden sm:block">
                {subtitle}
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
