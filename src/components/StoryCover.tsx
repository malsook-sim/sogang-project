import type { Story } from "@/data/stories";

type CoverPalette = {
  from: string;
  to: string;
  ink: string;
};

const palette: Record<string, CoverPalette> = {
  "1": { from: "#E89E7A", to: "#B85339", ink: "#FFFFFF" },
  "2": { from: "#D8A35B", to: "#5B4F80", ink: "#FFFFFF" },
  "3": { from: "#B5A4D4", to: "#5B4F80", ink: "#FFFFFF" },
  "4": { from: "#A8C49C", to: "#5E7E55", ink: "#FFFFFF" },
  "5": { from: "#9BBDD4", to: "#4F7592", ink: "#FFFFFF" },
  "6": { from: "#E0BE7A", to: "#A88539", ink: "#FFFFFF" },
  "7": { from: "#E5AABB", to: "#A85F75", ink: "#FFFFFF" },
  "8": { from: "#D2A87E", to: "#8E6B4A", ink: "#FFFFFF" },
  "9": { from: "#8A8AB8", to: "#3F3A6B", ink: "#FFFFFF" },
};

const fallback: CoverPalette = { from: "#C26A4F", to: "#913E27", ink: "#FFFFFF" };

function getPalette(id: string): CoverPalette {
  return palette[id] ?? fallback;
}

export function StoryCover({
  story,
  className,
  showTitle = true,
}: {
  story: Story;
  className?: string;
  showTitle?: boolean;
}) {
  const { from, to, ink } = getPalette(story.id);
  const initial = story.title.slice(0, 2);
  const gradId = `cover-grad-${story.id}`;

  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={story.title}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gradId})`} />

      <circle cx="35" cy="35" r="48" fill={ink} opacity="0.10" />
      <circle cx="180" cy="170" r="58" fill={ink} opacity="0.08" />
      <circle cx="178" cy="48" r="22" fill={ink} opacity="0.07" />

      <circle cx="170" cy="25" r="2" fill={ink} opacity="0.75" />
      <circle cx="155" cy="38" r="1.4" fill={ink} opacity="0.55" />
      <circle cx="30" cy="172" r="2.4" fill={ink} opacity="0.65" />
      <circle cx="44" cy="184" r="1.4" fill={ink} opacity="0.5" />
      <circle cx="148" cy="155" r="1.6" fill={ink} opacity="0.4" />

      {showTitle && (
        <text
          x="100"
          y="120"
          textAnchor="middle"
          fontFamily='"Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
          fontSize="62"
          fontWeight="900"
          fill={ink}
          opacity="0.96"
          letterSpacing="-3"
          style={{ fontFeatureSettings: "'ss06', 'ss07'" }}
        >
          {initial}
        </text>
      )}
    </svg>
  );
}
