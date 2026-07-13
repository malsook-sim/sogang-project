import Link from "next/link";
import { ChevronLeft } from "@/components/Icon";

// 전 화면 공통 뒤로가기 — 원형 배경/테두리 없이 chevron-left 아이콘만.
// 히트 영역은 44x44 투명, 아이콘만 중앙(패딩으로 확보). hover는 배경 없이 색만 진하게.
// - 밝은 배경: --text-body(#5C5680) → hover --foreground(#2C2A45)
// - 밤/네이비 배경: --night-text(#C9C3E8) → hover --night-surface(#F8F7FC)
export default function BackButton({
  onClick,
  href,
  night = false,
  ariaLabel = "뒤로",
  className = "",
}: {
  onClick?: () => void;
  href?: string;
  night?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const cls = `w-11 h-11 -ml-2.5 shrink-0 flex items-center justify-center bg-transparent transition-colors ${
    night
      ? "text-[var(--night-text)] hover:text-[var(--night-surface)]"
      : "text-[var(--text-body)] hover:text-foreground"
  } ${className}`;
  const icon = <ChevronLeft size={22} />;

  return href ? (
    <Link href={href} aria-label={ariaLabel} className={cls}>
      {icon}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={cls}>
      {icon}
    </button>
  );
}
