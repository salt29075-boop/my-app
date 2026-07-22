"use client";

import { useState } from "react";
import SectionCard from "./SectionCard";

const data: Record<string, { quarter: string; revenue: number; operatingProfit: number; netProfit: number; eps: number; beat: boolean | null }[]> = {
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
};

const tickers = ["005930", "000660", "NVDA"];
const labels: Record<string, string> = { "005930": "삼성전자", "000660": "SK하이닉스", "NVDA": "NVIDIA" };
const units: Record<string, string> = { "005930": "억원", "000660": "억원", "NVDA": "백만$" };

export default function EarningsSection() {
  const [selected, setSelected] = useState("005930");
  const rows = data[selected];

  return (
    <SectionCard
      title="실적"
      action={
        <div className="flex gap-1">
          {tickers.map((t) => (
            <button
              key={t}
              onClick={() => setSelected(t)}
              className="text-xs px-2 py-0.5 rounded-md font-mono transition-colors"
              style={{
                background: selected === t ? "var(--blue)" : "var(--surface-2)",
                color: selected === t ? "#fff" : "var(--text-secondary)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      }
    >
      <div className="px-4 pt-3 pb-1">
        <p className="text-base font-semibold">{labels[selected]}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>단위: {units[selected]}</p>
      </div>

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
    </SectionCard>
  );
}
