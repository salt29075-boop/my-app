import OverviewSection from "./components/OverviewSection";
import NewsSection from "./components/NewsSection";
import CheckSection from "./components/CheckSection";
import EarningsSection from "./components/EarningsSection";

export default function Dashboard() {
  const now = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <span className="text-lg font-bold tracking-tight">📈 내 주식 대시보드</span>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{now}</span>
          <span
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
            style={{ background: "rgba(63,185,80,0.12)", color: "var(--green)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            장중
          </span>
        </div>
      </header>

      {/* 메인 그리드: 좌(2fr) + 우(1fr) */}
      <main className="flex-1 p-4 grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* 현황 */}
        <OverviewSection />

        {/* 뉴스 — 우측 2행에 걸쳐 */}
        <div className="row-span-2">
          <NewsSection />
        </div>

        {/* 체크 + 실적 — 하단 좌측을 반반 */}
        <div className="grid grid-cols-2 gap-4">
          <CheckSection />
          <EarningsSection />
        </div>
      </main>
    </div>
  );
}
