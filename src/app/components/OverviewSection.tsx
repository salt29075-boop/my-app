"use client";

import { useHoldings } from "../contexts/HoldingsContext";
import SectionCard from "./SectionCard";

function pnl(avg: number, cur: number) {
  return ((cur - avg) / avg) * 100;
}

export default function OverviewSection() {
  const { holdings, livePrices, pricesUpdatedAt, pricesLoading, refreshPrices } = useHoldings();

  // 실시간 가격 우선, 없으면 저장된 현재가 사용
  const priceOf = (ticker: string, fallback: number) => livePrices[ticker] ?? fallback;

  const totalEval = holdings.reduce((sum, h) => {
    const cur = priceOf(h.ticker, h.currentPrice);
    return sum + h.qty * cur * (h.currency === "USD" ? 1380 : 1);
  }, 0);

  const totalCost = holdings.reduce((sum, h) => {
    return sum + h.qty * h.avgPrice * (h.currency === "USD" ? 1380 : 1);
  }, 0);

  const totalGain = totalEval - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const fmtGain = (n: number) =>
    n >= 0 ? `+₩${Math.round(n).toLocaleString()}` : `-₩${Math.round(Math.abs(n)).toLocaleString()}`;

  const updatedLabel = pricesUpdatedAt
    ? pricesUpdatedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <SectionCard
      title="현황"
      action={
        <div className="flex items-center gap-2">
          {updatedLabel && (
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {updatedLabel} 기준
            </span>
          )}
          <button
            onClick={refreshPrices}
            disabled={pricesLoading}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            <span className={pricesLoading ? "animate-spin inline-block" : ""}>↻</span>
            {pricesLoading ? "조회 중..." : "새로고침"}
          </button>
        </div>
      }
    >
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-px border-b" style={{ borderColor: "var(--border)", background: "var(--border)" }}>
        {[
          { label: "총 평가금액", value: `₩${Math.round(totalEval).toLocaleString()}`, neutral: true },
          { label: "총 손익", value: fmtGain(totalGain), positive: totalGain >= 0 },
          { label: "수익률", value: `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%`, positive: totalPnlPct >= 0 },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-1 px-4 py-3" style={{ background: "var(--surface)" }}>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
            <span
              className="text-base font-bold font-mono"
              style={{ color: item.neutral ? "var(--text-primary)" : item.positive ? "var(--green)" : "var(--red)" }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* 보유 종목 테이블 */}
      {holdings.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm" style={{ color: "var(--text-secondary)" }}>
          보유 종목이 없습니다. 종목 관리에서 추가해주세요.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid var(--border)` }}>
              {["종목", "현재가", "평균단가", "수익률", "평가금액"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => {
              const cur = priceOf(h.ticker, h.currentPrice);
              const isLive = livePrices[h.ticker] !== undefined;
              const rate = pnl(h.avgPrice, cur);
              const isPositive = rate >= 0;
              const color = isPositive ? "var(--green)" : "var(--red)";
              const sym = h.currency === "KRW" ? "₩" : "$";
              return (
                <tr
                  key={h.id}
                  style={{ borderBottom: i < holdings.length - 1 ? `1px solid var(--border)` : undefined }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{h.name}</div>
                    <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{h.ticker}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-right">
                    <div>{sym}{cur.toLocaleString()}</div>
                    {isLive && (
                      <div className="text-xs" style={{ color: "var(--green)" }}>● 실시간</div>
                    )}
                    {!isLive && pricesLoading && (
                      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>조회 중...</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-right" style={{ color: "var(--text-secondary)" }}>
                    {sym}{h.avgPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-right font-semibold" style={{ color }}>
                    {isPositive ? "+" : ""}{rate.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 font-mono text-right">
                    {sym}{(h.qty * cur).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </SectionCard>
  );
}
