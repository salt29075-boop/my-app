"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

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
  livePrices: Record<string, number>;
  pricesUpdatedAt: Date | null;
  pricesLoading: boolean;
  isMarketOpen: boolean;
  add: (h: Omit<Holding, "id">) => void;
  update: (h: Holding) => void;
  remove: (id: string) => void;
  importJSON: (json: string) => void;
  exportJSON: () => void;
  refreshPrices: () => Promise<void>;
};

const HoldingsContext = createContext<HoldingsContextType | null>(null);

const PRICE_CACHE_KEY = "livePricesCache";
const CACHE_TTL_MS = 90 * 1000;        // 클라이언트 캐시 90초
const AUTO_REFRESH_MS = 60 * 1000;     // 자동 새로고침 60초

// 한국/미국 장 중 여부 (KST 09:00–15:30, EST 09:30–16:00)
function checkMarketOpen(): boolean {
  const now = new Date();
  const kstMin = ((now.getUTCHours() + 9) % 24) * 60 + now.getUTCMinutes();
  const day = new Date(now.getTime() + 9 * 3600 * 1000).getUTCDay();
  const krOpen = day >= 1 && day <= 5 && kstMin >= 9 * 60 && kstMin < 15 * 60 + 30;

  const estOffset = -5; // EST (서머타임 미적용, 근사치)
  const estMin = ((now.getUTCHours() + 24 + estOffset) % 24) * 60 + now.getUTCMinutes();
  const usDay = new Date(now.getTime() + estOffset * 3600 * 1000).getUTCDay();
  const usOpen = usDay >= 1 && usDay <= 5 && estMin >= 9 * 60 + 30 && estMin < 16 * 60;

  return krOpen || usOpen;
}

function loadPriceCache(): { prices: Record<string, number>; at: number } | null {
  try {
    const raw = localStorage.getItem(PRICE_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (Date.now() - cache.at < CACHE_TTL_MS) return cache;
  } catch {}
  return null;
}

export function HoldingsProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [pricesUpdatedAt, setPricesUpdatedAt] = useState<Date | null>(null);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("holdings");
    if (saved) {
      try { setHoldings(JSON.parse(saved)); } catch {}
    }
    const cache = loadPriceCache();
    if (cache) {
      setLivePrices(cache.prices);
      setPricesUpdatedAt(new Date(cache.at));
    }
    setIsMarketOpen(checkMarketOpen());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("holdings", JSON.stringify(holdings));
  }, [holdings, loaded]);

  const refreshPrices = useCallback(async () => {
    if (loadingRef.current) return;
    const tickers = holdings.map((h) => h.ticker).join(",");
    if (!tickers) return;
    loadingRef.current = true;
    setPricesLoading(true);
    try {
      const res = await fetch(`/api/prices?tickers=${encodeURIComponent(tickers)}`);
      const data: Record<string, number | null> = await res.json();
      const valid: Record<string, number> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== null) valid[k] = v;
      }
      if (Object.keys(valid).length > 0) {
        setLivePrices(valid);
        const now = Date.now();
        setPricesUpdatedAt(new Date(now));
        localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify({ prices: valid, at: now }));
      }
    } catch {
      // 실패 시 기존 값 유지
    } finally {
      loadingRef.current = false;
      setPricesLoading(false);
    }
  }, [holdings]);

  // 최초 로드
  useEffect(() => {
    if (loaded) refreshPrices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // 장 중 자동 새로고침 (60초 주기)
  useEffect(() => {
    if (!loaded) return;

    const tick = () => {
      const open = checkMarketOpen();
      setIsMarketOpen(open);
      if (open) refreshPrices();
    };

    const id = setInterval(tick, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [loaded, refreshPrices]);

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
    <HoldingsContext.Provider value={{
      holdings, livePrices, pricesUpdatedAt, pricesLoading, isMarketOpen,
      add, update, remove, importJSON, exportJSON, refreshPrices,
    }}>
      {children}
    </HoldingsContext.Provider>
  );
}

export function useHoldings() {
  const ctx = useContext(HoldingsContext);
  if (!ctx) throw new Error("useHoldings must be used within HoldingsProvider");
  return ctx;
}
