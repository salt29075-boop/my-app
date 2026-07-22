import SectionCard from "./SectionCard";

const holdings = [
  { name: "삼성전자", ticker: "005930", qty: 50, avgPrice: 71200, currentPrice: 76300, currency: "KRW" },
  { name: "SK하이닉스", ticker: "000660", qty: 10, avgPrice: 182000, currentPrice: 198500, currency: "KRW" },
  { name: "NVIDIA", ticker: "NVDA", qty: 5, avgPrice: 820.4, currentPrice: 950.12, currency: "USD" },
  { name: "Apple", ticker: "AAPL", qty: 8, avgPrice: 172.3, currentPrice: 189.84, currency: "USD" },
  { name: "카카오", ticker: "035720", qty: 30, avgPrice: 58000, currentPrice: 49800, currency: "KRW" },
];

function pnl(avg: number, cur: number) {
  return ((cur - avg) / avg) * 100;
}

export default function OverviewSection() {
  const totalPnlPct =
    holdings.reduce((sum, h) => sum + pnl(h.avgPrice, h.currentPrice), 0) / holdings.length;

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
          { label: "총 평가금액", value: "₩ 24,381,200" },
          { label: "총 수익", value: "+₩ 1,823,400" },
          { label: "평균 수익률", value: `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%` },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-1 px-4 py-3" style={{ background: "var(--surface)" }}>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
            <span
              className="text-base font-bold font-mono"
              style={{ color: item.label === "총 평가금액" ? "var(--text-primary)" : totalPnlPct >= 0 ? "var(--green)" : "var(--red)" }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* 보유 종목 테이블 */}
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: `1px solid var(--border)` }}>
            {["종목", "현재가", "평균단가", "수익률", "평가금액"].map((h) => (
              <th
                key={h}
                className="px-4 py-2 text-left text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
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
            return (
              <tr
                key={h.ticker}
                className="transition-colors"
                style={{
                  borderBottom: i < holdings.length - 1 ? `1px solid var(--border)` : undefined,
                }}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{h.ticker}</div>
                </td>
                <td className="px-4 py-3 font-mono text-right">
                  {h.currency === "KRW" ? `₩${h.currentPrice.toLocaleString()}` : `$${h.currentPrice}`}
                </td>
                <td className="px-4 py-3 font-mono text-right" style={{ color: "var(--text-secondary)" }}>
                  {h.currency === "KRW" ? `₩${h.avgPrice.toLocaleString()}` : `$${h.avgPrice}`}
                </td>
                <td className="px-4 py-3 font-mono text-right font-semibold" style={{ color }}>
                  {isPositive ? "+" : ""}{rate.toFixed(2)}%
                </td>
                <td className="px-4 py-3 font-mono text-right">
                  {h.currency === "KRW"
                    ? `₩${(h.qty * h.currentPrice).toLocaleString()}`
                    : `$${(h.qty * h.currentPrice).toFixed(2)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </SectionCard>
  );
}
