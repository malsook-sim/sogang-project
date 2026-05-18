import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
};

function Base({
  size = 22,
  strokeWidth = 1.75,
  className,
  children,
  filled: _filled,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  void _filled;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Home = (props: IconProps) => (
  <Base {...props}>
    {props.filled && (
      <path
        d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1h-4v-6h-7v6h-4a1 1 0 0 1-1-1z"
        fill="currentColor"
        stroke="none"
      />
    )}
    <path d="m3 10.5 9-7 9 7" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V9.5" />
  </Base>
);

export const Sparkles = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <circle cx="12" cy="12" r="2.5" fill={props.filled ? "currentColor" : "none"} />
  </Base>
);

export const Mic = (props: IconProps) => (
  <Base {...props}>
    <rect x="9" y="3" width="6" height="12" rx="3" fill={props.filled ? "currentColor" : "none"} />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3" />
  </Base>
);

export const Library = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 5a2 2 0 0 1 2-2h3v18H6a2 2 0 0 1-2-2z" fill={props.filled ? "currentColor" : "none"} />
    <path d="M9 3h3v18H9z" />
    <path d="m14 4 2.6-.7a1 1 0 0 1 1.2.7l3.1 13a1 1 0 0 1-.7 1.2l-3.5.9z" />
  </Base>
);

export const Search = (props: IconProps) => (
  <Base {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Base>
);

export const User = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="8" r="4" fill={props.filled ? "currentColor" : "none"} />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Base>
);

export const Heart = (props: IconProps) => (
  <Base {...props}>
    <path
      d="M12 20s-7-4.5-9.4-9.1A5.5 5.5 0 0 1 12 5.7a5.5 5.5 0 0 1 9.4 5.2C19 15.5 12 20 12 20z"
      fill={props.filled ? "currentColor" : "none"}
    />
  </Base>
);

export const ChevronLeft = (props: IconProps) => (
  <Base {...props}>
    <path d="m15 6-6 6 6 6" />
  </Base>
);

export const ChevronRight = (props: IconProps) => (
  <Base {...props}>
    <path d="m9 6 6 6-6 6" />
  </Base>
);

export const ChevronDown = (props: IconProps) => (
  <Base {...props}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);

export const Play = (props: IconProps) => (
  <Base {...props}>
    <path d="M6 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
  </Base>
);

export const Pause = (props: IconProps) => (
  <Base {...props}>
    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
  </Base>
);

export const Moon = (props: IconProps) => (
  <Base {...props}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill={props.filled ? "currentColor" : "none"} />
  </Base>
);

export const Trash = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 7h16" />
    <path d="M10 11v6M14 11v6" />
    <path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
  </Base>
);

export const Lock = (props: IconProps) => (
  <Base {...props}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Base>
);

export const Refresh = (props: IconProps) => (
  <Base {...props}>
    <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
    <path d="M3 21v-5h5" />
  </Base>
);

export const Bell = (props: IconProps) => (
  <Base {...props}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </Base>
);

export const Sliders = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 6h10M4 12h6M4 18h13" />
    <circle cx="17" cy="6" r="2" fill={props.filled ? "currentColor" : "none"} />
    <circle cx="13" cy="12" r="2" fill={props.filled ? "currentColor" : "none"} />
    <circle cx="20" cy="18" r="2" fill={props.filled ? "currentColor" : "none"} />
  </Base>
);

export const FileText = (props: IconProps) => (
  <Base {...props}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h8M8 17h5" />
  </Base>
);
