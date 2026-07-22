"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type Holding = {
  id: string;
  name: string;
  ticker: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  currency: "KRW" | "USD";
};

const DEFAULTS: Holding[] = [
  { id: "1", name: "삼성전자", ticker: "005930", qty: 50, avgPrice: 71200, currentPrice: 76300, currency: "KRW" },
  { id: "2", name: "SK하이닉스", ticker: "000660", qty: 10, avgPrice: 182000, currentPrice: 198500, currency: "KRW" },
  { id: "3", name: "NVIDIA", ticker: "NVDA", qty: 5, avgPrice: 820.4, currentPrice: 950.12, currency: "USD" },
  { id: "4", name: "Apple", ticker: "AAPL", qty: 8, avgPrice: 172.3, currentPrice: 189.84, currency: "USD" },
  { id: "5", name: "카카오", ticker: "035720", qty: 30, avgPrice: 58000, currentPrice: 49800, currency: "KRW" },
];

type HoldingsContextType = {
  holdings: Holding[];
  add: (h: Omit<Holding, "id">) => void;
  update: (h: Holding) => void;
  remove: (id: string) => void;
  importJSON: (json: string) => void;
  exportJSON: () => void;
};

const HoldingsContext = createContext<HoldingsContextType | null>(null);

export function HoldingsProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("holdings");
    if (saved) {
      try {
        setHoldings(JSON.parse(saved));
      } catch {}
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("holdings", JSON.stringify(holdings));
  }, [holdings, loaded]);

  const add = useCallback((h: Omit<Holding, "id">) => {
    setHoldings((prev) => [...prev, { ...h, id: crypto.randomUUID() }]);
  }, []);

  const update = useCallback((h: Holding) => {
    setHoldings((prev) => prev.map((it) => (it.id === h.id ? h : it)));
  }, []);

  const remove = useCallback((id: string) => {
    setHoldings((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const importJSON = useCallback((json: string) => {
    const parsed = JSON.parse(json) as Holding[];
    const valid = parsed.every(
      (h) => h.name && h.ticker && typeof h.qty === "number" && typeof h.avgPrice === "number"
    );
    if (!valid) throw new Error("올바르지 않은 형식입니다.");
    setHoldings(parsed.map((h) => ({ ...h, id: h.id ?? crypto.randomUUID() })));
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(holdings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "holdings.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [holdings]);

  return (
    <HoldingsContext.Provider value={{ holdings, add, update, remove, importJSON, exportJSON }}>
      {children}
    </HoldingsContext.Provider>
  );
}

export function useHoldings() {
  const ctx = useContext(HoldingsContext);
  if (!ctx) throw new Error("useHoldings must be used within HoldingsProvider");
  return ctx;
}
