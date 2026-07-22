"use client";

import { useState } from "react";
import { useHoldings } from "../contexts/HoldingsContext";
import SectionCard from "./SectionCard";

type EarningsRow = {
  quarter: string;
  revenue: number;
  operatingProfit: number | null;
  netProfit: number | null;
  /** 컨센서스 대비 실적 서프라이즈 여부. 비교 데이터가 없으면 null */
  beat: boolean | null;
  /** 아직 발표되지 않아 컨센서스 추정치인 경우 true */
  estimate?: boolean;
};

const data: Record<string, EarningsRow[]> = {
  "005930": [
    { quarter: "24Q1", revenue: 71900, operatingProfit: 6600, netProfit: 6610, beat: true },
    { quarter: "24Q2", revenue: 74000, operatingProfit: 10400, netProfit: 9830, beat: true },
    { quarter: "24Q3E", revenue: 82000, operatingProfit: 14000, netProfit: 13200, beat: null, estimate: true },
  ],
  // SK하이닉스 — 25Q4/26Q1 실제 발표치, 26Q2는 컨센서스(2026.07.29 실적 발표 예정)
  "000660": [
    { quarter: "25Q4", revenue: 328270, operatingProfit: 191700, netProfit: null, beat: true },
    { quarter: "26Q1", revenue: 525763, operatingProfit: 376103, netProfit: 403459, beat: true },
    { quarter: "26Q2E", revenue: 835000, operatingProfit: 641632, netProfit: null, beat: null, estimate: true },
  ],
  // NVIDIA — FY26Q4/FY27Q1 실제 발표치, FY27Q2는 회사 가이던스(2026.08 실적 발표 예정)
  "NVDA": [
    { quarter: "FY26Q4", revenue: 68000, operatingProfit: 44299, netProfit: 43000, beat: true },
    { quarter: "FY27Q1", revenue: 81600, operatingProfit: 53536, netProfit: 58300, beat: true },
    { quarter: "FY27Q2E", revenue: 91000, operatingProfit: null, netProfit: null, beat: null, estimate: true },
  ],
  // Apple — FY26Q1/FY26Q2 실제 발표치, FY26Q3는 컨센서스(2026.07.30 실적 발표 예정)
  "AAPL": [
    { quarter: "FY26Q1", revenue: 143800, operatingProfit: 50900, netProfit: 42100, beat: true },
    { quarter: "FY26Q2", revenue: 111200, operatingProfit: 35885, netProfit: 29578, beat: true },
    { quarter: "FY26Q3E", revenue: 108900, operatingProfit: null, netProfit: null, beat: null, estimate: true },
  ],
  // 카카오 — 25Q4/26Q1 실제 발표치, 26Q2는 컨센서스(2026.08.06 실적 발표 예정)
  "035720": [
    { quarter: "25Q4", revenue: 21332, operatingProfit: 2034, netProfit: 5257, beat: false },
    { quarter: "26Q1", revenue: 19421, operatingProfit: 2114, netProfit: 2268, beat: false },
    { quarter: "26Q2E", revenue: 20500, operatingProfit: null, netProfit: null, beat: null, estimate: true },
  ],
  // 삼성바이오로직스 — 25Q4/26Q1 실제 발표치, 26Q2는 증권사 컨센서스(2026.07.23 실적 발표 예정)
  "207940": [
    { quarter: "25Q4", revenue: 12857, operatingProfit: 5283, netProfit: null, beat: false },
    { quarter: "26Q1", revenue: 12571, operatingProfit: 5808, netProfit: 4692, beat: true },
    { quarter: "26Q2E", revenue: 13100, operatingProfit: null, netProfit: null, beat: null, estimate: true },
  ],
  // 레인보우로보틱스 — 분기별 실제 매출 발표치(영업이익/순이익은 26Q1만 공시 확인)
  "277810": [
    { quarter: "25Q3", revenue: 106.9, operatingProfit: null, netProfit: null, beat: null },
    { quarter: "25Q4", revenue: 130.2, operatingProfit: null, netProfit: null, beat: null },
    { quarter: "26Q1", revenue: 90.6, operatingProfit: -15.7, netProfit: -9.0, beat: null },
  ],
  // 두산로보틱스 — 25Q4/26Q1 실제 발표치, 26Q2는 컨센서스(2026.07.24 실적 발표 예정)
  "454910": [
    { quarter: "25Q4", revenue: 130, operatingProfit: -164.5, netProfit: null, beat: false },
    { quarter: "26Q1", revenue: 153, operatingProfit: -121, netProfit: -92, beat: null },
    { quarter: "26Q2E", revenue: 151.4, operatingProfit: null, netProfit: null, beat: null, estimate: true },
  ],
  // 셀트리온 — 26Q2까지 잠정실적 공시 완료(2026.07.03 발표)
  "068270": [
    { quarter: "25Q4", revenue: 13302, operatingProfit: 4752, netProfit: null, beat: true },
    { quarter: "26Q1", revenue: 11450, operatingProfit: 3219, netProfit: 3498, beat: true },
    { quarter: "26Q2", revenue: 13000, operatingProfit: 4300, netProfit: null, beat: false },
  ],
};

const unitByCurrency: Record<"KRW" | "USD", string> = { KRW: "억원", USD: "백만$" };

function formatCell(value: number | null) {
  return value === null ? "—" : value.toLocaleString();
}

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
                      <span style={{ color: row.estimate ? "var(--yellow)" : "var(--text-primary)" }}>
                        {row.quarter}
                      </span>
                      {row.estimate && (
                        <span className="ml-1 px-1 rounded" style={{ background: "var(--surface-2)", color: "var(--yellow)" }}>
                          예상
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 font-mono">{formatCell(row.revenue)}</td>
                    <td className="px-2 py-2 font-mono" style={{ color: row.operatingProfit === null ? "var(--text-secondary)" : row.operatingProfit >= 0 ? "var(--green)" : "var(--red)" }}>{formatCell(row.operatingProfit)}</td>
                    <td className="px-2 py-2 font-mono" style={{ color: row.netProfit !== null && row.netProfit < 0 ? "var(--red)" : undefined }}>{formatCell(row.netProfit)}</td>
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
