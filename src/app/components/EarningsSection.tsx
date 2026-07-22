"use client";

import { useState } from "react";
import { useHoldings } from "../contexts/HoldingsContext";
import SectionCard from "./SectionCard";

type EarningsRow = { quarter: string; revenue: number; operatingProfit: number; netProfit: number; eps: number; beat: boolean | null };

const data: Record<string, EarningsRow[]> = {
  "005930": [
    { quarter: "24Q1", revenue: 71900, operatingProfit: 6600, netProfit: 6610, eps: 984, beat: true },
    { quarter: "24Q2", revenue: 74000, operatingProfit: 10400, netProfit: 9830, eps: 1463, beat: true },
    { quarter: "24Q3E", revenue: 82000, operatingProfit: 14000, netProfit: 13200, eps: 1965, beat: null },
  ],
  "000660": [
    { quarter: "24Q1", revenue: 12430, operatingProfit: 2890, netProfit: 2380, eps: 3248, beat: true },
    { quarter: "24Q2", revenue: 16540, operatingProfit: 5470, netProfit: 4210, eps: 5747, beat: true },
    { quarter: "24Q3E", revenue: 19200, operatingProfit: 7100, netProfit: 5500, eps: 7509, beat: null },
  ],
  "NVDA": [
    { quarter: "FY25Q1", revenue: 26000, operatingProfit: 16900, netProfit: 14880, eps: 5.98, beat: true },
    { quarter: "FY25Q2", revenue: 30040, operatingProfit: 19940, netProfit: 16952, eps: 0.68, beat: true },
    { quarter: "FY25Q3E", revenue: 32500, operatingProfit: 21500, netProfit: 17800, eps: 0.72, beat: null },
  ],
  "AAPL": [
    { quarter: "FY24Q2", revenue: 90753, operatingProfit: 27900, netProfit: 23636, eps: 1.53, beat: true },
    { quarter: "FY24Q3", revenue: 85777, operatingProfit: 25400, netProfit: 21448, eps: 1.4, beat: false },
    { quarter: "FY24Q4E", revenue: 94500, operatingProfit: 29800, netProfit: 25200, eps: 1.6, beat: null },
  ],
  "035720": [
    { quarter: "24Q1", revenue: 19100, operatingProfit: 1420, netProfit: 890, eps: 380, beat: false },
    { quarter: "24Q2", revenue: 20050, operatingProfit: 1780, netProfit: 1150, eps: 490, beat: true },
    { quarter: "24Q3E", revenue: 20800, operatingProfit: 1900, netProfit: 1300, eps: 550, beat: null },
  ],
};

const unitByCurrency: Record<"KRW" | "USD", string> = { KRW: "억원", USD: "백만$" };

export default function EarningsSection() {
  const { holdings } = useHoldings();
  const [selected, setSelected] = useState<string>("");

  // 선택된 종목이 보유 목록에 없으면(초기 상태 포함) 첫 번째 종목으로 대체
  const effectiveSelected = holdings.some((h) => h.ticker === selected) ? selected : holdings[0]?.ticker ?? "";

  const current = holdings.find((h) => h.ticker === effectiveSelected);
  const rows = effectiveSelected ? data[effectiveSelected] : undefined;

  return (
    <SectionCard
      title="실적"
      action={
        holdings.length > 0 ? (
          <select
            value={effectiveSelected}
            onChange={(e) => setSelected(e.target.value)}
            className="text-xs px-2 py-1 rounded-md font-mono outline-none"
            style={{ background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            {holdings.map((h) => (
              <option key={h.ticker} value={h.ticker}>
                {h.name} ({h.ticker})
              </option>
            ))}
          </select>
        ) : null
      }
    >
      {!current ? (
        <div className="flex items-center justify-center py-10 text-sm" style={{ color: "var(--text-secondary)" }}>
          종목을 추가하면 실적을 표시합니다.
        </div>
      ) : (
        <>
          <div className="px-4 pt-3 pb-1">
            <p className="text-base font-semibold">{current.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              단위: {unitByCurrency[current.currency]}
            </p>
          </div>

          {!rows ? (
            <div className="flex items-center justify-center py-10 text-sm" style={{ color: "var(--text-secondary)" }}>
              실적 데이터가 없습니다.
            </div>
          ) : (
            <table className="w-full text-xs mt-2">
              <thead>
                <tr style={{ borderBottom: `1px solid var(--border)` }}>
                  {["분기", "매출", "영업익", "순이익", "결과"].map((h) => (
                    <th key={h} className="px-2 py-2 text-left font-medium" style={{ color: "var(--text-secondary)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.quarter}
                    style={{ borderBottom: i < rows.length - 1 ? `1px solid var(--border)` : undefined }}
                  >
                    <td className="px-2 py-2 font-mono font-semibold whitespace-nowrap">
                      <span style={{ color: row.beat === null ? "var(--yellow)" : "var(--text-primary)" }}>
                        {row.quarter}
                      </span>
                      {row.beat === null && (
                        <span className="ml-1 px-1 rounded" style={{ background: "var(--surface-2)", color: "var(--yellow)" }}>
                          예상
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 font-mono">{row.revenue.toLocaleString()}</td>
                    <td className="px-2 py-2 font-mono" style={{ color: "var(--green)" }}>{row.operatingProfit.toLocaleString()}</td>
                    <td className="px-2 py-2 font-mono">{row.netProfit.toLocaleString()}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {row.beat === null ? (
                        <span style={{ color: "var(--text-secondary)" }}>—</span>
                      ) : row.beat ? (
                        <span className="px-1.5 py-0.5 rounded font-semibold whitespace-nowrap" style={{ background: "rgba(63,185,80,0.15)", color: "var(--green)" }}>
                          ↑ 서프라이즈
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded font-semibold whitespace-nowrap" style={{ background: "rgba(248,81,73,0.15)", color: "var(--red)" }}>
                          ↓ 미스
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </SectionCard>
  );
}
