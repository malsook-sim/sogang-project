import { User } from "@/components/Icon";
import { voiceColor } from "@/lib/relationships";

// 이모지 대신 컬러 원 + 흰색 라인 아이콘 아바타
export function VoiceAvatar({
  emoji,
  size = 44,
  iconSize,
}: {
  emoji?: string | null;
  size?: number;
  iconSize?: number;
}) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white shrink-0"
      style={{ width: size, height: size, background: voiceColor(emoji) }}
    >
      <User size={iconSize ?? Math.round(size * 0.48)} filled />
    </div>
  );
}
