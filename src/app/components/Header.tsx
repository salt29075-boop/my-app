"use client";

import { useHoldings } from "../contexts/HoldingsContext";
import HoldingsManager from "./HoldingsManager";

export default function Header() {
  const { isMarketOpen } = useHoldings();

  const now = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b shrink-0"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <span className="text-lg font-bold tracking-tight">📈 내 주식 대시보드</span>
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{now}</span>
        {isMarketOpen ? (
          <span
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
            style={{ background: "rgba(63,185,80,0.12)", color: "var(--green)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            장중
          </span>
        ) : (
          <span
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
            style={{ background: "rgba(139,148,158,0.12)", color: "var(--text-secondary)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--text-secondary)" }} />
            장마감
          </span>
        )}
        <HoldingsManager />
      </div>
    </header>
  );
}
