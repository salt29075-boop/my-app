import { HoldingsProvider } from "./contexts/HoldingsContext";
import Header from "./components/Header";
import OverviewSection from "./components/OverviewSection";
import NewsSection from "./components/NewsSection";
import PriceChartSection from "./components/PriceChartSection";
import EarningsSection from "./components/EarningsSection";

export default function Dashboard() {
  return (
    <HoldingsProvider>
      <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
        <Header />
        <main className="flex-1 p-4 grid gap-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
          <OverviewSection />
          <div className="row-span-2">
            <NewsSection />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <PriceChartSection />
            <EarningsSection />
          </div>
        </main>
      </div>
    </HoldingsProvider>
  );
}
