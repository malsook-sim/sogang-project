import { useId } from "react";
import type { Story } from "@/data/stories";

type Pal = { sky: [string, string]; back: string; front: string };

const palettes: Record<string, Pal> = {
  "1": { sky: ["#F4BD8E", "#D86F4A"], back: "#9DBA6E", front: "#80A356" },
  "2": { sky: ["#EBBC68", "#494376"], back: "#3F3B64", front: "#2F2C4E" },
  "3": { sky: ["#CBB4E6", "#6E5F9E"], back: "#9683C2", front: "#7E6CA8" },
  "4": { sky: ["#BBD2A8", "#6E8C5C"], back: "#8DAF70", front: "#6F9457" },
  "5": { sky: ["#A9C9DD", "#425972"], back: "#3C5870", front: "#314A60" },
  "6": { sky: ["#EECB89", "#B98F42"], back: "#A6C27D", front: "#88A661" },
  "7": { sky: ["#F0BAC8", "#A85F77"], back: "#9C5A72", front: "#854B61" },
  "8": { sky: ["#E6BD93", "#9A7350"], back: "#BC9468", front: "#9E7850" },
  "9": { sky: ["#9B99C9", "#373260"], back: "#322E58", front: "#262247" },
};

const fallbackPalettes: Pal[] = [
  { sky: ["#F4BD8E", "#D86F4A"], back: "#9DBA6E", front: "#80A356" },
  { sky: ["#A9C9DD", "#425972"], back: "#3C5870", front: "#314A60" },
  { sky: ["#CBB4E6", "#6E5F9E"], back: "#9683C2", front: "#7E6CA8" },
  { sky: ["#BBD2A8", "#6E8C5C"], back: "#8DAF70", front: "#6F9457" },
  { sky: ["#F0BAC8", "#A85F77"], back: "#9C5A72", front: "#854B61" },
  { sky: ["#EECB89", "#B98F42"], back: "#A6C27D", front: "#88A661" },
  { sky: ["#9B99C9", "#373260"], back: "#322E58", front: "#262247" },
  { sky: ["#8FC7C2", "#3F7E79"], back: "#4C8B7F", front: "#3D7569" },
  { sky: ["#F2C078", "#DC6F4E"], back: "#C58A57", front: "#A06D44" },
  { sky: ["#AEC4EA", "#56699E"], back: "#566596", front: "#46527E" },
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
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
  fill = "#FFDD7A",
}: {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
}) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r + 9} fill={fill} opacity={0.22} />
      <circle cx={cx} cy={cy} r={r} fill={fill} />
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

function Scene({ id, pal }: { id: string; pal: Pal }) {
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
          <Sun cx={46} cy={48} r={18} fill="#FFD45E" />
          <circle cx="156" cy="44" r="15" fill="#ECE6F2" />
          <circle cx="151" cy="40" r="3" fill="#D6CFE4" />
          <circle cx="160" cy="49" r="2.2" fill="#D6CFE4" />
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
          <circle cx="148" cy="52" r="22" fill="#F1ECD8" opacity="0.25" />
          <circle cx="148" cy="52" r="22" fill="#F1ECD8" />
          <circle cx="142" cy="46" r="3.6" fill="#DED7BE" />
          <circle cx="154" cy="58" r="2.6" fill="#DED7BE" />
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
            fill="#F0E9C6"
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

    // 그 외 동화 — id 해시로 다양한 기본 풍경
    default: {
      const variant = hashId(id) % 3;

      if (variant === 1) {
        // 밤하늘
        return (
          <>
            <path
              d="M52 26 A20 20 0 1 0 52 66 A15 15 0 1 1 52 26 Z"
              fill="#F0E9C6"
            />
            <Spark x={150} y={44} s={0.7} fill="#FFF0C2" />
            <Spark x={118} y={30} s={0.5} fill="#FFF0C2" />
            {[
              [86, 36],
              [162, 78],
              [40, 96],
              [128, 92],
            ].map(([x, y]) => (
              <circle
                key={`${x}-${y}`}
                cx={x}
                cy={y}
                r="1.7"
                fill="#FFFFFF"
                opacity="0.85"
              />
            ))}
            {hills}
          </>
        );
      }

      if (variant === 2) {
        // 숲속 들판
        return (
          <>
            <Sun cx={150} cy={48} r={16} fill="#FFE08A" />
            <Spark x={54} y={42} s={0.7} fill="#FFF3C4" />
            {hills}
            {[42, 100, 158].map((x) => (
              <g key={x}>
                <rect
                  x={x - 3.5}
                  y="118"
                  width="7"
                  height="32"
                  rx="3"
                  fill="#6E5A44"
                />
                <path
                  d={`M${x} 82 L${x - 21} 126 L${x + 21} 126 Z`}
                  fill="#5E8C4A"
                />
                <path
                  d={`M${x} 98 L${x - 16} 130 L${x + 16} 130 Z`}
                  fill="#73A35C"
                />
              </g>
            ))}
          </>
        );
      }

      // 기본 낮 풍경
      return (
        <>
          <Sun cx={152} cy={46} r={17} fill="#FFE08A" />
          <Spark x={48} y={44} s={0.8} fill="#FFF3C4" />
          <Spark x={100} y={30} s={0.55} fill="#FFF3C4" />
          <Spark x={36} y={94} s={0.6} fill="#FFF3C4" />
          {hills}
          <path
            d="M58 70 Q66 62 72 70 Q78 62 86 70 Q78 69 72 78 Q66 69 58 70 Z"
            fill="#FFFFFF"
            opacity="0.7"
          />
        </>
      );
    }
  }
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
  const gradId = useId();
  const pal =
    palettes[story.id] ??
    fallbackPalettes[hashId(story.id) % fallbackPalettes.length];

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
          <stop offset="0%" stopColor={pal.sky[0]} />
          <stop offset="100%" stopColor={pal.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#${gradId})`} />

      <circle cx="34" cy="32" r="46" fill="#FFFFFF" opacity="0.08" />
      <circle cx="178" cy="176" r="54" fill="#FFFFFF" opacity="0.06" />

      {showTitle ? (
        <Scene id={story.id} pal={pal} />
      ) : (
        <Hills back={pal.back} front={pal.front} />
      )}
    </svg>
  );
}
