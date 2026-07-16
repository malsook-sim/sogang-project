import type { ReactNode } from "react";
import type { Story } from "@/data/stories";
import {
  pickTemplate,
  pickAnimal,
  variation,
  type TemplateId,
  type AnimalId,
} from "@/lib/coverScene";

type Pal = { sky: string; back: string; front: string };
type Var = ReturnType<typeof variation>;

// ── 하늘: 플랫 단색 4종 (그라데이션 금지) ──────────────────
const SKY = {
  dawn: "#DCD7F0", // 새벽
  noon: "#CFE0F2", // 한낮
  dusk: "#F0D9C8", // 노을
  night: "#3A3760", // 밤
} as const;

// ── 언덕/지면 허용 3색 (초록 채도 #8FA882 초과 금지) ────────
const HILL = {
  green: "#C9D9C0", // 연녹
  sand: "#E0D5C4", // 모래
  slate: "#B8C4E0", // 청회
} as const;

// 해·달은 항상 골드 (테마 무관 — 일러스트 전용, --star와 동일값. shade() 계산에 쓰여 hex 유지)
const GOLD = "#F4C566";

// 오브젝트 채도: 손그림 씬 전체를 완만하게 탈채도
const DESAT_FILTER = "saturate(0.82)";

// back을 front보다 살짝 어둡게 만들기 위한 shade 값(rgb 각 채널 - amt)
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// 하늘색 → 어울리는 언덕 색 (front) 매핑
function hillFor(sky: string): { back: string; front: string } {
  let front: string;
  if (sky === SKY.night) front = HILL.slate; // 밤 → 청회
  else if (sky === SKY.dusk) front = HILL.sand; // 노을 → 모래
  else front = HILL.green; // 그 외 → 연녹
  return { front, back: shade(front, 22) };
}

// story.category / id 기반 하늘색 결정 (deterministic)
function skyFor(story: { id: string; category?: string }): string {
  const c = story.category;
  if (c === "bedtime") return SKY.night;
  if (c === "adventure" || c === "nature") return SKY.noon;
  if (c === "classic") return SKY.dusk;
  // world / english / undefined / 생성동화(my-*) → 새벽
  return SKY.dawn;
}

// id만 아는 컨텍스트(coverColor 등)에서 하늘색 결정
function skyForId(id: string, category?: string): string {
  return skyFor({ id, category });
}

// 밤하늘 계열인지 (별/달 씬 판단용)
function isNightSky(sky: string): boolean {
  return sky === SKY.night;
}

function Hills({ back, front }: { back: string; front: string }) {
  return (
    <>
      <ellipse cx="54" cy="212" rx="124" ry="80" fill={back} />
      <ellipse cx="162" cy="224" rx="128" ry="76" fill={front} />
    </>
  );
}

function Spark({
  x,
  y,
  s = 1,
  fill = "#FFF3C4",
  o = 1,
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
  o?: number;
}) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -7L1.9 -1.9L7 0L1.9 1.9L0 7L-1.9 1.9L-7 0L-1.9 -1.9Z"
      fill={fill}
      opacity={o}
    />
  );
}

function Sun({
  cx,
  cy,
  r,
}: {
  cx: number;
  cy: number;
  r: number;
  // fill prop은 호환을 위해 받아들이되 무시 — 해·달은 항상 골드
  fill?: string;
}) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r + 9} fill={GOLD} opacity={0.22} />
      <circle cx={cx} cy={cy} r={r} fill={GOLD} />
    </>
  );
}

function Bear({
  cx,
  cy,
  r,
  body,
}: {
  cx: number;
  cy: number;
  r: number;
  body: string;
}) {
  const er = r * 0.46;
  return (
    <g>
      <circle cx={cx - r * 0.62} cy={cy - r * 0.78} r={er} fill={body} />
      <circle cx={cx + r * 0.62} cy={cy - r * 0.78} r={er} fill={body} />
      <circle cx={cx} cy={cy} r={r} fill={body} />
      <ellipse
        cx={cx}
        cy={cy + r * 0.34}
        rx={r * 0.56}
        ry={r * 0.42}
        fill="#F2E2C8"
      />
      <ellipse
        cx={cx}
        cy={cy + r * 0.14}
        rx={r * 0.16}
        ry={r * 0.13}
        fill="#3A2A1E"
      />
      <circle cx={cx - r * 0.36} cy={cy - r * 0.18} r={r * 0.12} fill="#3A2A1E" />
      <circle cx={cx + r * 0.36} cy={cy - r * 0.18} r={r * 0.12} fill="#3A2A1E" />
    </g>
  );
}

// ═══════════ 8종 씬 템플릿 엔진 (id 1~9 커스텀 씬 외 전부 여기로) ═══════════
const SIL = "#6E6152"; // 오브젝트 실루엣 단색 톤다운

// 해/달 — 위치(좌/중/우)·낮밤 반영
function Light({ pos, night }: { pos: Var["lightPos"]; night: boolean }) {
  const cx = pos === "left" ? 46 : pos === "right" ? 156 : 100;
  return night ? (
    <>
      <circle cx={cx} cy={46} r={19} fill={GOLD} opacity={0.22} />
      <circle cx={cx} cy={46} r={17} fill={GOLD} />
      <circle cx={cx - 5} cy={42} r={3.2} fill={shade(GOLD, 24)} />
      <circle cx={cx + 4} cy={51} r={2.2} fill={shade(GOLD, 24)} />
    </>
  ) : (
    <Sun cx={cx} cy={46} r={17} />
  );
}

function Stars({ n }: { n: number }) {
  const pts = [
    [72, 34], [120, 28], [168, 54], [40, 62], [148, 82],
  ];
  return (
    <>
      {pts.slice(0, n).map(([x, y], i) => (
        <Spark key={i} x={x} y={y} s={0.5} fill="#FFF0C2" />
      ))}
    </>
  );
}

function treeXs(n: number): number[] {
  if (n <= 1) return [100];
  const step = 116 / (n - 1);
  return Array.from({ length: n }, (_, i) => 42 + i * step);
}

function Forest({ pal, v, night }: { pal: Pal; v: Var; night: boolean }) {
  return (
    <>
      <Light pos={v.lightPos} night={night} />
      {night && <Stars n={v.starCount} />}
      <Hills back={pal.back} front={pal.front} />
      {treeXs(v.treeCount).map((x, i) => (
        <g key={i}>
          <rect x={x - 3} y={116} width={6} height={30} rx={3} fill="#6E5A44" />
          <path d={`M${x} 80 L${x - 20} 124 L${x + 20} 124 Z`} fill="#5E8C4A" />
          <path d={`M${x} 96 L${x - 15} 128 L${x + 15} 128 Z`} fill="#73A35C" />
        </g>
      ))}
    </>
  );
}

function HillPath({ pal, v, night }: { pal: Pal; v: Var; night: boolean }) {
  return (
    <>
      <Light pos={v.lightPos} night={night} />
      {night && <Stars n={v.starCount} />}
      {v.hillLayers >= 3 && (
        <ellipse cx="36" cy="206" rx="128" ry="76" fill={shade(pal.back, 16)} />
      )}
      <ellipse cx="150" cy="218" rx="130" ry="74" fill={pal.back} />
      <ellipse cx="86" cy="236" rx="142" ry="70" fill={pal.front} />
      <path
        d="M98 200 Q58 170 100 150 Q142 130 104 104"
        stroke="#F2E6C8"
        strokeWidth="13"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M98 200 Q58 170 100 150 Q142 130 104 104"
        stroke="#E4D3AE"
        strokeWidth="13"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="1 12"
      />
    </>
  );
}

function Waterside({ pal, v, night }: { pal: Pal; v: Var; night: boolean }) {
  const refX = v.lightPos === "left" ? 70 : v.lightPos === "right" ? 130 : 100;
  return (
    <>
      <Light pos={v.lightPos} night={night} />
      {night && <Stars n={v.starCount} />}
      <Hills back={pal.back} front={pal.front} />
      <ellipse cx="100" cy="176" rx="66" ry="21" fill="#6D9BBD" />
      <ellipse cx="100" cy="171" rx="56" ry="13" fill="#86B0CC" opacity="0.6" />
      <ellipse cx={refX} cy="178" rx="12" ry="3.4" fill="#F1ECD8" opacity="0.5" />
      {[52, 61, 150, 160].map((x, i) => (
        <g key={i}>
          <path
            d={`M${x} 176 Q${x - 4} 150 ${x + 2} 132`}
            stroke="#3F5E4F"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx={x + 2} cy="132" rx="3" ry="7.2" fill="#5A4632" />
        </g>
      ))}
    </>
  );
}

function Mountain({ pal, v, night }: { pal: Pal; v: Var; night: boolean }) {
  return (
    <>
      <Light pos={v.lightPos} night={night} />
      {night && <Stars n={v.starCount} />}
      <path d="M-10 152 L54 96 L120 152 Z" fill={shade(pal.back, 12)} />
      {v.hillLayers >= 3 && (
        <path d="M96 158 L156 104 L214 158 Z" fill={shade(pal.back, 4)} />
      )}
      <path d="M28 178 L104 108 L184 178 Z" fill={pal.front} />
      <path
        d="M104 108 L90 122 L99 124 L93 132 L115 132 L109 124 L118 122 Z"
        fill="#F1ECDD"
        opacity="0.78"
      />
      <Hills back={pal.back} front={pal.front} />
    </>
  );
}

function Field({ pal, v, night }: { pal: Pal; v: Var; night: boolean }) {
  const flowers = [
    [46, 158], [70, 168], [96, 160], [124, 170],
    [150, 158], [172, 166], [58, 178], [134, 182],
  ];
  return (
    <>
      <Light pos={v.lightPos} night={night} />
      {night && <Stars n={v.starCount} />}
      <ellipse cx="100" cy="232" rx="150" ry="72" fill={pal.front} />
      {v.treeCount >= 4 && (
        <g>
          <rect x={155} y={120} width={6} height={28} rx={3} fill="#6E5A44" />
          <circle cx={158} cy={112} r={18} fill="#5E8C4A" />
        </g>
      )}
      {flowers.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.6" fill={i % 2 ? "#F2C0D0" : "#FBE39A"} />
          <circle cx={x} cy={y} r="1" fill="#FFFFFF" />
        </g>
      ))}
    </>
  );
}

function Village({ pal, v, night }: { pal: Pal; v: Var; night: boolean }) {
  const houses: [number, string][] = [
    [46, "#B5654A"], [86, "#9A7B52"], [126, "#A85C46"], [162, "#8F6A4A"],
  ];
  return (
    <>
      <Light pos={v.lightPos} night={night} />
      {night && <Stars n={v.starCount} />}
      <Hills back={pal.back} front={pal.front} />
      {houses.slice(0, v.hillLayers >= 3 ? 4 : 3).map(([x, roof], i) => (
        <g key={i}>
          <rect x={x - 15} y={128} width={30} height={30} fill="#EFE3CC" />
          <path d={`M${x - 19} 128 L${x} 108 L${x + 19} 128 Z`} fill={roof} />
          <rect
            x={x - 5}
            y={138}
            width={10}
            height={11}
            rx={1.5}
            fill={night ? "#F6CB5C" : "#8B5A3B"}
          />
        </g>
      ))}
    </>
  );
}

function SkyScene({ pal, v, night }: { pal: Pal; v: Var; night: boolean }) {
  const clouds: [number, number, number][] = [
    [64, 88, 1], [138, 70, 0.8], [104, 120, 0.7],
  ];
  return (
    <>
      <Light pos={v.lightPos} night={night} />
      {night && <Stars n={Math.max(3, v.starCount)} />}
      {clouds.map(([x, y, s], i) => (
        <g
          key={i}
          transform={`translate(${x} ${y}) scale(${s})`}
          fill="#FFFFFF"
          opacity={night ? 0.5 : 0.85}
        >
          <ellipse cx="0" cy="0" rx="22" ry="12" />
          <circle cx="-14" cy="2" r="9" />
          <circle cx="12" cy="1" r="11" />
          <circle cx="-2" cy="-7" r="10" />
        </g>
      ))}
      <ellipse cx="100" cy="240" rx="150" ry="58" fill={pal.front} />
    </>
  );
}

function Sea({ v, night }: { pal: Pal; v: Var; night: boolean }) {
  const refX = v.lightPos === "left" ? 46 : v.lightPos === "right" ? 156 : 100;
  return (
    <>
      <Light pos={v.lightPos} night={night} />
      {night && <Stars n={v.starCount} />}
      <rect x="0" y="128" width="200" height="72" fill="#5E93B4" />
      <rect x="0" y="128" width="200" height="10" fill="#76A8C6" />
      {[150, 168, 186].slice(0, v.hillLayers >= 3 ? 3 : 2).map((y, i) => (
        <path
          key={i}
          d={`M0 ${y} Q25 ${y - 6} 50 ${y} T100 ${y} T150 ${y} T200 ${y}`}
          stroke="#9AC3DB"
          strokeWidth="2.4"
          fill="none"
          opacity="0.7"
        />
      ))}
      <ellipse cx={refX} cy="150" rx="10" ry="20" fill="#F1ECD8" opacity="0.28" />
    </>
  );
}

const TEMPLATES: Record<
  TemplateId,
  (p: { pal: Pal; v: Var; night: boolean }) => ReactNode
> = {
  forest: Forest,
  hillpath: HillPath,
  waterside: Waterside,
  mountain: Mountain,
  field: Field,
  village: Village,
  sky: SkyScene,
  sea: Sea,
};

// 동물 실루엣 (단색, 캔버스 15% 이하)
function Animal({
  id,
  x,
  y,
  s,
  flip,
}: {
  id: AnimalId;
  x: number;
  y: number;
  s: number;
  flip: boolean;
}) {
  const t = `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
  switch (id) {
    case "rabbit":
      return (
        <g transform={t} fill={SIL}>
          <ellipse cx="0" cy="6" rx="9" ry="7" />
          <circle cx="8" cy="-1" r="5" />
          <ellipse cx="6" cy="-11" rx="1.8" ry="6.5" />
          <ellipse cx="10" cy="-11" rx="1.8" ry="6.5" />
          <circle cx="-9" cy="7" r="2.6" />
        </g>
      );
    case "turtle":
      return (
        <g transform={t} fill={SIL}>
          <path d="M-13 6 Q-13 -8 0 -8 Q13 -8 13 6 Z" />
          <ellipse cx="0" cy="7" rx="14" ry="3.5" />
          <circle cx="15" cy="3" r="3.4" />
          <rect x="-12" y="7" width="3.5" height="5" rx="1.5" />
          <rect x="9" y="7" width="3.5" height="5" rx="1.5" />
        </g>
      );
    case "bear":
      return (
        <g transform={t} fill={SIL}>
          <circle cx="0" cy="4" r="10" />
          <circle cx="0" cy="-8" r="7" />
          <circle cx="-6" cy="-14" r="3" />
          <circle cx="6" cy="-14" r="3" />
        </g>
      );
    case "fox":
      return (
        <g transform={t} fill={SIL}>
          <path d="M-12 8 Q-17 -3 -8 -2 L6 6 Z" />
          <ellipse cx="2" cy="4" rx="9" ry="6" />
          <path d="M8 -2 L16 2 L9 7 Z" />
          <path d="M6 -4 L9 -11 L11 -4 Z" />
          <path d="M11 -3 L14 -10 L15 -3 Z" />
        </g>
      );
    case "tiger":
      return (
        <g transform={t} fill={SIL}>
          <ellipse cx="-2" cy="4" rx="12" ry="7" />
          <circle cx="10" cy="-1" r="6" />
          <path d="M6 -6 L8 -11 L11 -7 Z" />
          <path d="M12 -7 L15 -11 L16 -6 Z" />
          <path
            d="M-13 2 Q-20 -2 -17 6"
            stroke={SIL}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    case "sheep":
      return (
        <g transform={t} fill={SIL}>
          <circle cx="-4" cy="2" r="5" />
          <circle cx="2" cy="-2" r="6" />
          <circle cx="6" cy="4" r="5.5" />
          <circle cx="-2" cy="6" r="5.5" />
          <circle cx="10" cy="-2" r="3.4" />
          <rect x="-4" y="9" width="2" height="4" />
          <rect x="5" y="9" width="2" height="4" />
        </g>
      );
    case "bird":
      return (
        <g transform={t} fill={SIL}>
          <ellipse cx="0" cy="0" rx="7" ry="4" />
          <circle cx="6" cy="-3" r="3" />
          <path d="M8 -3 L12 -2 L8 -1 Z" />
          <path d="M-2 -1 Q-8 -8 -12 -4 Q-6 -2 -2 -1 Z" />
        </g>
      );
  }
}

function TemplateScene({
  story,
  pal,
  night,
}: {
  story: Story;
  pal: Pal;
  night: boolean;
}) {
  const t = pickTemplate(story);
  const animal = pickAnimal(story);
  const v = variation(story.id);
  const Tpl = TEMPLATES[t];
  const ax = v.flip ? 140 : 60;
  return (
    <>
      <Tpl pal={pal} v={v} night={night} />
      {animal &&
        (animal === "bird" ? (
          <Animal id="bird" x={v.flip ? 150 : 50} y={64} s={1.2} flip={v.flip} />
        ) : (
          <Animal id={animal} x={ax} y={152} s={1.15} flip={v.flip} />
        ))}
    </>
  );
}

function Scene({
  story,
  pal,
  forceNight,
}: {
  story: Story;
  pal: Pal;
  forceNight?: boolean;
}) {
  const id = story.id;
  const hills = <Hills back={pal.back} front={pal.front} />;

  switch (id) {
    // 토끼와 거북이 — 언덕길 경주
    case "1":
      return (
        <>
          <Sun cx={44} cy={44} r={18} fill="#FFE08A" />
          {hills}
          <path
            d="M20 200 Q58 168 96 173 Q142 179 150 132"
            stroke="#F2E6C8"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          {/* 거북이 */}
          <g>
            <ellipse cx="74" cy="175" rx="16" ry="5.5" fill="#C9A06A" />
            <circle cx="91" cy="170" r="5" fill="#C9A06A" />
            <circle cx="92.5" cy="169" r="1.1" fill="#3A2A1E" />
            <path
              d="M58 172 Q60 153 74 152 Q88 153 90 172 Z"
              fill="#5F8C4A"
            />
            <circle cx="74" cy="162" r="3" fill="#46703A" />
            <circle cx="66" cy="168" r="2.4" fill="#46703A" />
            <circle cx="82" cy="168" r="2.4" fill="#46703A" />
          </g>
          {/* 토끼 */}
          <g>
            <ellipse cx="120" cy="153" rx="11" ry="9" fill="#F4EEE3" />
            <circle cx="110" cy="153" r="3.6" fill="#FFFFFF" />
            <circle cx="129" cy="146" r="6.5" fill="#F4EEE3" />
            <ellipse cx="126" cy="134" rx="2.6" ry="8" fill="#F4EEE3" />
            <ellipse cx="132" cy="135" rx="2.6" ry="8" fill="#F4EEE3" />
            <ellipse cx="126" cy="135" rx="1" ry="4" fill="#E7A9B6" />
            <circle cx="131" cy="145" r="1.2" fill="#3A2A1E" />
          </g>
          {/* 결승 깃발 */}
          <rect x="147" y="88" width="3.4" height="50" rx="1.7" fill="#6E5A44" />
          <rect x="150" y="90" width="24" height="16" fill="#FFFFFF" />
          <rect x="150" y="90" width="8" height="8" fill="#3C3C3C" />
          <rect x="166" y="90" width="8" height="8" fill="#3C3C3C" />
          <rect x="158" y="98" width="8" height="8" fill="#3C3C3C" />
        </>
      );

    // 해와 달이 된 오누이 — 해·달·동아줄
    case "2":
      return (
        <>
          <Sun cx={46} cy={48} r={18} />
          <circle cx="156" cy="44" r="15" fill={GOLD} />
          <circle cx="151" cy="40" r="3" fill={shade(GOLD, 24)} />
          <circle cx="160" cy="49" r="2.2" fill={shade(GOLD, 24)} />
          <Spark x={172} y={80} s={0.8} fill="#FFF6D6" />
          <Spark x={138} y={28} s={0.6} fill="#FFF6D6" />
          <Spark x={180} y={112} s={0.55} fill="#FFF6D6" />
          <circle cx="120" cy="64" r="1.6" fill="#FFFFFF" opacity="0.8" />
          <circle cx="186" cy="58" r="1.4" fill="#FFFFFF" opacity="0.7" />
          {/* 동아줄 */}
          <path
            d="M100 -6 Q113 36 100 76 Q87 116 100 158"
            stroke="#D7B57E"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M100 -6 Q113 36 100 76 Q87 116 100 158"
            stroke="#9C7A48"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="2 8"
          />
          <path
            d="M100 -6 Q113 36 100 76 Q87 116 100 158"
            stroke="#EFD9AE"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
          />
          {hills}
        </>
      );

    // 콩쥐 팥쥐 — 잃어버린 꽃신
    case "3":
      return (
        <>
          <Spark x={44} y={46} s={1} fill="#FFE9A6" />
          <Spark x={160} y={40} s={0.9} fill="#FFE9A6" />
          <Spark x={168} y={104} s={0.7} fill="#FFE9A6" />
          <Spark x={36} y={118} s={0.65} fill="#FFE9A6" />
          <Spark x={96} y={28} s={0.5} fill="#FFE9A6" />
          {hills}
          <ellipse cx="100" cy="160" rx="52" ry="13" fill="#FFFFFF" opacity="0.5" />
          {/* 꽃신 */}
          <path
            d="M54 150 C52 138 58 132 74 130 C96 127 120 130 142 138 C152 141 154 148 146 150 C146 150 88 153 70 153 C60 153 55 154 54 150 Z"
            fill="#E8688A"
          />
          <ellipse cx="84" cy="131" rx="21" ry="6.5" fill="#C44E6C" />
          <path
            d="M74 132 Q92 119 110 133"
            stroke="#E8688A"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="110" cy="133" r="2.6" fill="#FFE9A6" />
          <path
            d="M57 151 Q100 158 146 150"
            stroke="#B23E5E"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          {/* 꽃 장식 */}
          <g>
            {[0, 72, 144, 216, 288].map((a) => {
              const rad = (a * Math.PI) / 180;
              return (
                <circle
                  key={a}
                  cx={128 + Math.cos(rad) * 5.4}
                  cy={138 + Math.sin(rad) * 5.4}
                  r="3.4"
                  fill="#FFFFFF"
                />
              );
            })}
            <circle cx="128" cy="138" r="3" fill="#FFCF5E" />
          </g>
        </>
      );

    // 흥부와 놀부 — 박과 제비
    case "4":
      return (
        <>
          <Sun cx={42} cy={44} r={15} fill="#F5D873" />
          {/* 제비 */}
          <path
            d="M132 56 Q144 44 149 57 Q154 44 166 56 Q154 55 149 67 Q144 55 132 56 Z"
            fill="#38324E"
          />
          <path
            d="M170 38 Q175 33 178 39 Q175 39 173 44 Q172 39 170 38 Z"
            fill="#38324E"
            opacity="0.7"
          />
          {hills}
          {/* 박 */}
          <ellipse cx="96" cy="139" rx="33" ry="34" fill="#EDF1DA" />
          <ellipse cx="107" cy="148" rx="25" ry="25" fill="#000000" opacity="0.05" />
          <ellipse cx="85" cy="126" rx="11" ry="8" fill="#FFFFFF" opacity="0.55" />
          <path
            d="M96 106 Q88 139 96 172"
            stroke="#CBD6A8"
            strokeWidth="2.6"
            fill="none"
          />
          <path
            d="M96 107 Q94 97 86 92"
            stroke="#6E9457"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse
            cx="80"
            cy="89"
            rx="9"
            ry="5.5"
            fill="#6E9457"
            transform="rotate(-32 80 89)"
          />
          <path
            d="M104 109 Q117 103 112 93 Q110 89 116 90"
            stroke="#7DA063"
            strokeWidth="2.4"
            fill="none"
          />
          {/* 보물 */}
          <circle cx="120" cy="166" r="6.5" fill="#F4CE5E" />
          <circle cx="120" cy="166" r="3.4" fill="#FFE39A" />
          <circle cx="73" cy="168" r="5.5" fill="#F4CE5E" />
          <circle cx="73" cy="168" r="2.8" fill="#FFE39A" />
          <Spark x={134} y={150} s={0.7} fill="#FFEFB0" />
        </>
      );

    // 선녀와 나무꾼 — 달밤 연못
    case "5":
      return (
        <>
          <circle cx="148" cy="52" r="22" fill={GOLD} opacity="0.25" />
          <circle cx="148" cy="52" r="22" fill={GOLD} />
          <circle cx="142" cy="46" r="3.6" fill={shade(GOLD, 24)} />
          <circle cx="154" cy="58" r="2.6" fill={shade(GOLD, 24)} />
          <Spark x={70} y={40} s={0.6} fill="#FBF4D6" />
          <Spark x={108} y={28} s={0.5} fill="#FBF4D6" />
          <circle cx="44" cy="58" r="1.6" fill="#FFFFFF" opacity="0.8" />
          {/* 날개옷 깃털 */}
          <path
            d="M92 86 Q98 64 111 55 Q105 75 99 90 Q95 90 92 86 Z"
            fill="#FBFAF2"
            opacity="0.92"
          />
          <path
            d="M95 87 Q101 71 109 57"
            stroke="#D8D2BE"
            strokeWidth="1.3"
            fill="none"
          />
          {hills}
          {/* 갈대 */}
          {[
            { x: 48, h: 132 },
            { x: 57, h: 138 },
            { x: 150, h: 136 },
            { x: 160, h: 130 },
          ].map((r) => (
            <g key={r.x}>
              <path
                d={`M${r.x} 176 Q${r.x - 4} ${(176 + r.h) / 2} ${r.x + 2} ${r.h}`}
                stroke="#3F5E4F"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <ellipse cx={r.x + 2} cy={r.h - 2} rx="3.1" ry="7.5" fill="#5A4632" />
            </g>
          ))}
          {/* 연못 */}
          <ellipse cx="100" cy="174" rx="64" ry="20" fill="#6D9BBD" />
          <ellipse cx="100" cy="170" rx="58" ry="13" fill="#86B0CC" opacity="0.6" />
          <ellipse cx="124" cy="176" rx="13" ry="4" fill="#F1ECD8" opacity="0.55" />
        </>
      );

    // 금도끼 은도끼 — 연못 속 도끼
    case "6":
      return (
        <>
          <Sun cx={44} cy={44} r={17} fill="#FFE08A" />
          {hills}
          {/* 연못 */}
          <ellipse cx="100" cy="178" rx="60" ry="17" fill="#74A6C6" />
          <ellipse
            cx="100"
            cy="178"
            rx="44"
            ry="12"
            fill="none"
            stroke="#A6CBE0"
            strokeWidth="2"
            opacity="0.8"
          />
          <ellipse
            cx="100"
            cy="178"
            rx="28"
            ry="7.5"
            fill="none"
            stroke="#C2DCEC"
            strokeWidth="1.8"
            opacity="0.8"
          />
          {/* 도끼 */}
          <rect x="95.5" y="96" width="9" height="84" rx="4.5" fill="#8A6A45" />
          <rect x="98" y="100" width="2.4" height="74" rx="1.2" fill="#A78057" />
          <path
            d="M99 78 C82 75 62 82 58 99 C62 117 86 119 100 110 C104 108 106 103 106 99 C106 92 104 82 99 78 Z"
            fill="#FFD45E"
          />
          <path
            d="M64 92 C69 107 88 110 99 104"
            stroke="#FFF1B4"
            strokeWidth="3.4"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="92" y="84" width="16" height="24" rx="3" fill="#E6B23F" />
          <Spark x={74} y={70} s={0.95} fill="#FFEFB0" />
          <Spark x={52} y={88} s={0.7} fill="#FFEFB0" />
          <Spark x={90} y={62} s={0.65} fill="#FFEFB0" />
        </>
      );

    // 잠자는 숲속의 공주 — 성
    case "7":
      return (
        <>
          <Spark x={150} y={42} s={1} fill="#FFF0D6" />
          <Spark x={42} y={54} s={0.7} fill="#FFF0D6" />
          <Spark x={170} y={96} s={0.6} fill="#FFF0D6" />
          <circle cx="64" cy="36" r="1.6" fill="#FFFFFF" opacity="0.8" />
          {hills}
          {/* 성 */}
          <rect x="56" y="100" width="24" height="62" fill="#EBCDD6" />
          <path d="M53 100 L68 78 L83 100 Z" fill="#C96E88" />
          <rect x="120" y="100" width="24" height="62" fill="#EBCDD6" />
          <path d="M117 100 L132 78 L147 100 Z" fill="#C96E88" />
          <rect x="68" y="116" width="64" height="46" fill="#F4DFE5" />
          {[68, 84, 100, 116].map((x) => (
            <rect key={x} x={x} y="110" width="10" height="8" fill="#F4DFE5" />
          ))}
          <rect x="86" y="82" width="28" height="80" fill="#F7E6EB" />
          <path d="M82 82 L100 50 L118 82 Z" fill="#C96E88" />
          <rect x="99" y="36" width="2.6" height="16" fill="#9B5870" />
          <path d="M101.6 38 L113 42 L101.6 47 Z" fill="#E89BB0" />
          <path
            d="M92 162 L92 146 A8 8 0 0 1 108 146 L108 162 Z"
            fill="#9B5870"
          />
          <circle cx="62" cy="120" r="3.4" fill="#A86C82" />
          <circle cx="132" cy="120" r="3.4" fill="#A86C82" />
          <circle cx="100" cy="98" r="3.6" fill="#A86C82" />
          {/* 가시 넝쿨 */}
          <path
            d="M70 162 Q60 140 74 122 Q84 108 77 92"
            stroke="#5E7A4E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="74" cy="120" r="2.6" fill="#E58FA6" />
          <circle cx="79" cy="98" r="2.4" fill="#E58FA6" />
        </>
      );

    // 아기 곰 세 마리 — 통나무집과 곰
    case "8":
      return (
        <>
          <Sun cx={100} cy={32} r={12} fill="#FFE08A" />
          {hills}
          {/* 집 */}
          <rect x="112" y="118" width="62" height="48" fill="#F1E3CB" />
          <path d="M106 118 L143 86 L180 118 Z" fill="#B5654A" />
          <rect x="156" y="92" width="11" height="22" fill="#9A5640" />
          <circle cx="161" cy="86" r="4" fill="#FFFFFF" opacity="0.7" />
          <circle cx="165" cy="78" r="3" fill="#FFFFFF" opacity="0.55" />
          <circle cx="168" cy="71" r="2.4" fill="#FFFFFF" opacity="0.4" />
          <rect x="120" y="140" width="18" height="26" rx="2" fill="#8B5A3B" />
          <circle cx="134" cy="153" r="1.4" fill="#F1E3CB" />
          <rect x="146" y="130" width="18" height="18" rx="2" fill="#F6CB5C" />
          <path
            d="M155 130 V148 M146 139 H164"
            stroke="#B5654A"
            strokeWidth="1.6"
          />
          {/* 곰 셋 */}
          <Bear cx={42} cy={146} r={19} body="#9C6B45" />
          <Bear cx={72} cy={152} r={14.5} body="#B07F54" />
          <Bear cx={95} cy={158} r={10.5} body="#C49770" />
        </>
      );

    // 별이 된 아이 — 밤하늘의 큰 별
    case "9":
      return (
        <>
          <path
            d="M52 26 A20 20 0 1 0 52 66 A15 15 0 1 1 52 26 Z"
            fill={GOLD}
          />
          <Spark x={156} y={40} s={0.8} fill="#FFF0C2" />
          <Spark x={172} y={88} s={0.55} fill="#FFF0C2" />
          <Spark x={132} y={26} s={0.5} fill="#FFF0C2" />
          {[
            [80, 30],
            [118, 52],
            [38, 92],
            [168, 120],
            [150, 70],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#FFFFFF" opacity="0.85" />
          ))}
          {hills}
          {/* 큰 별 */}
          <circle cx="100" cy="98" r="44" fill="#FFE9A0" opacity="0.14" />
          <circle cx="100" cy="98" r="30" fill="#FFE9A0" opacity="0.16" />
          <g transform="translate(100 98)">
            <path
              d="M0 -34L8.23 -11.32L32.34 -10.51L13.31 4.33L19.98 27.51L0 14L-19.98 27.51L-13.31 4.33L-32.34 -10.51L-8.23 -11.32Z"
              fill="#FFE69A"
            />
            <path
              d="M0 -34L8.23 -11.32L32.34 -10.51L13.31 4.33L0 14Z"
              fill="#FFF1C2"
            />
          </g>
        </>
      );

    // 그 외 동화(id 10+, 생성 동화 등) — 8종 템플릿 엔진으로 결정론적 배정
    default:
      return <TemplateScene story={story} pal={pal} night={!!forceNight} />;
  }
}

// 동화별 대표색(플랫 하늘색) — 틴트 시스템에서 사용. 시그니처 유지.
export function coverColor(id: string): string {
  return skyForId(id);
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
  const sky = skyFor(story);
  const night = isNightSky(sky);
  const { back, front } = hillFor(sky);
  const pal: Pal = { sky, back, front };

  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      className={`story-cover ${className ?? ""}`}
      style={{ filter: DESAT_FILTER }}
      role="img"
      aria-label={story.title}
    >
      {/* 하늘: 플랫 단색 */}
      <rect width="200" height="200" fill={sky} />

      <circle cx="34" cy="32" r="46" fill="#FFFFFF" opacity="0.08" />
      <circle cx="178" cy="176" r="54" fill="#FFFFFF" opacity="0.06" />

      {showTitle ? (
        <Scene story={story} pal={pal} forceNight={night} />
      ) : (
        <Hills back={pal.back} front={pal.front} />
      )}

      {/* 잠자기(밤) 톤 통일 오버레이 — CSS로 opacity 제어(라이트 0 / 잠자기 0.45) */}
      <rect
        className="cover-night-overlay"
        width="200"
        height="200"
        fill="#14132A"
      />
    </svg>
  );
}
