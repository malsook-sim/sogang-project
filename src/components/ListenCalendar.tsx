"use client";

import { useEffect, useState } from "react";
import {
  getListenDates,
  listensOn,
  thisMonthCount,
  dateKey,
  type ListenEntry,
} from "@/lib/listenLog";

// 내 서재 상단 미니 월간 캘린더 — 들은 날 별(--color-star) 점, 오늘 --color-primary 링
export default function ListenCalendar() {
  const [dates, setDates] = useState<Set<string>>(new Set());
  const [monthCount, setMonthCount] = useState(0);
  const [today, setToday] = useState("");
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<ListenEntry[]>([]);

  useEffect(() => {
    const now = new Date();
    setDates(getListenDates());
    setMonthCount(thisMonthCount());
    setToday(dateKey(now));
    setCursor({ y: now.getFullYear(), m: now.getMonth() });
  }, []);

  if (!cursor) return null; // 첫(서버) 렌더에선 그리지 않음 (hydration 안전)

  const { y, m } = cursor;
  const startDow = new Date(y, m, 1).getDay(); // 0=일
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: startDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const onDay = (d: number) => {
    const key = dateKey(new Date(y, m, d));
    if (!dates.has(key)) return;
    setOpen(open === key ? null : key);
    setDetail(listensOn(key));
  };

  return (
    <div className="card p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm">
          이번 달 <span className="text-primary">{monthCount}일</span> 함께했어요
        </h2>
        <span className="text-[11px] text-muted">{m + 1}월</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
          <div key={w} className="text-[10px] text-muted py-1">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = dateKey(new Date(y, m, d));
          const listened = dates.has(key);
          const isToday = key === today;
          return (
            <button
              key={i}
              onClick={() => onDay(d)}
              disabled={!listened}
              className={`relative h-9 lg:h-auto lg:aspect-square flex flex-col items-center justify-center rounded-lg text-[12px] transition ${
                listened ? "hover:bg-surface-soft cursor-pointer" : ""
              }`}
            >
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full leading-none ${
                  isToday ? "ring-1 ring-primary text-primary font-bold" : ""
                } ${listened ? "text-foreground" : "text-muted/40"}`}
              >
                {d}
              </span>
              {listened && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--star)] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[11px] text-muted mb-1.5">
            {Number(open.slice(5, 7))}월 {Number(open.slice(8, 10))}일에 들은 동화
          </p>
          <div className="space-y-1">
            {detail.map((e, i) => (
              <p key={i} className="text-[13px] flex items-center gap-1.5 min-w-0">
                <span aria-hidden>🌙</span>
                <span className="font-medium truncate">{e.title}</span>
                {e.voiceName && (
                  <span className="text-[11px] text-muted shrink-0">
                    · {e.voiceName}
                  </span>
                )}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
