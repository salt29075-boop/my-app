"use client";

import { useHoldings } from "../contexts/HoldingsContext";
import SectionCard from "./SectionCard";

function pnl(avg: number, cur: number) {
  return ((cur - avg) / avg) * 100;
}

export default function OverviewSection() {
  const { holdings } = useHoldings();

  const totalEval = holdings.reduce((sum, h) => {
    if (h.currency === "KRW") return sum + h.qty * h.currentPrice;
    return sum + h.qty * h.currentPrice * 1380; // 임시 환율
  }, 0);

  const totalCost = holdings.reduce((sum, h) => {
    if (h.currency === "KRW") return sum + h.qty * h.avgPrice;
    return sum + h.qty * h.avgPrice * 1380;
  }, 0);

  const totalGain = totalEval - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const fmt = (n: number) =>
    n >= 0 ? `+₩${Math.round(n).toLocaleString()}` : `-₩${Math.round(Math.abs(n)).toLocaleString()}`;

  return (
    <SectionCard
      title="현황"
      action={
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
          실시간
        </span>
      }
    >
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-px border-b" style={{ borderColor: "var(--border)", background: "var(--border)" }}>
        {[
          { label: "총 평가금액", value: `₩${Math.round(totalEval).toLocaleString()}`, neutral: true },
          { label: "총 손익", value: fmt(totalGain), positive: totalGain >= 0 },
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
              const rate = pnl(h.avgPrice, h.currentPrice);
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
                    {sym}{h.currentPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-right" style={{ color: "var(--text-secondary)" }}>
                    {sym}{h.avgPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-right font-semibold" style={{ color }}>
                    {isPositive ? "+" : ""}{rate.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 font-mono text-right">
                    {sym}{(h.qty * h.currentPrice).toLocaleString()}
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
