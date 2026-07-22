"use client";

import { useState, useEffect, useCallback } from "react";
import { useHoldings } from "../contexts/HoldingsContext";
import SectionCard from "./SectionCard";
import type { NewsItem } from "../api/news/route";

const CACHE_KEY = "newsCache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

function loadCache(tickers: string): { items: NewsItem[]; at: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (cache.tickers !== tickers) return null; // 종목 변경 시 캐시 무효
    if (Date.now() - cache.at < CACHE_TTL_MS) return cache;
  } catch {}
  return null;
}

const sentimentConfig = {
  bullish: { label: "강세", color: "var(--green)", bg: "rgba(63,185,80,0.12)", dot: "#3fb950" },
  bearish: { label: "약세", color: "var(--red)", bg: "rgba(248,81,73,0.12)", dot: "#f85149" },
  neutral: { label: "중립", color: "var(--text-secondary)", bg: "rgba(139,148,158,0.12)", dot: "#8b949e" },
};

export default function NewsSection() {
  const { holdings } = useHoldings();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const tickers = holdings.map((h) => h.ticker).join(",");

  const fetchNews = useCallback(async (force = false) => {
    if (!tickers) return;
    if (!force) {
      const cache = loadCache(tickers);
      if (cache) {
        setItems(cache.items);
        setUpdatedAt(new Date(cache.at));
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/news?tickers=${encodeURIComponent(tickers)}`);
      const data = await res.json();
      if (data.items?.length > 0) {
        setItems(data.items);
        const now = Date.now();
        setUpdatedAt(new Date(now));
        localStorage.setItem(CACHE_KEY, JSON.stringify({ tickers, items: data.items, at: now }));
      } else {
        setError("뉴스를 불러오지 못했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [tickers]);

  useEffect(() => {
    if (tickers) fetchNews();
  }, [tickers, fetchNews]);

  const updatedLabel = updatedAt
    ? updatedAt.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) +
      " " +
      updatedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <SectionCard
      title="뉴스"
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {updatedLabel && (
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {updatedLabel}
            </span>
          )}
          <button
            onClick={() => fetchNews(true)}
            disabled={loading}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            <span className={loading ? "animate-spin inline-block" : ""}>↻</span>
            {loading ? "조회 중..." : "새로고침"}
          </button>
        </div>
      }
    >
      {/* 로딩 */}
      {loading && items.length === 0 && (
        <div className="flex flex-col gap-3 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-2">
              <div className="h-3 rounded w-full" style={{ background: "var(--surface-2)" }} />
              <div className="h-3 rounded w-2/3" style={{ background: "var(--surface-2)" }} />
              <div className="h-2 rounded w-1/3" style={{ background: "var(--surface-2)" }} />
            </div>
          ))}
        </div>
      )}

      {/* 에러 */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-2 py-10">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error}</p>
          <button
            onClick={() => fetchNews(true)}
            className="text-xs px-3 py-1.5 rounded-lg mt-1 hover:opacity-80"
            style={{ background: "var(--surface-2)", color: "var(--blue)", border: "1px solid var(--border)" }}
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 뉴스 목록 */}
      {!loading && !error && items.length > 0 && (
        <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
          {items.map((item, i) => {
            const cfg = sentimentConfig[item.sentiment];
            return (
              <li key={i} className="flex flex-col gap-2 px-4 py-3 hover:bg-white/5 transition-colors">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 group">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: cfg.dot }}
                  />
                  <p className="text-sm leading-snug group-hover:underline" style={{ color: "var(--text-primary)" }}>
                    {item.title}
                  </p>
                </a>
                <div className="flex items-center flex-wrap gap-1.5 pl-3.5">
                  {/* 감성 배지 */}
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-semibold"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  {/* 관련 티커 */}
                  {item.tickers.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
                    >
                      {t}
                    </span>
                  ))}
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.source}</span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>· {item.publishedAt}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 종목 없음 */}
      {!loading && !error && items.length === 0 && !loading && (
        <div className="flex items-center justify-center py-10 text-sm" style={{ color: "var(--text-secondary)" }}>
          종목을 추가하면 관련 뉴스를 표시합니다.
        </div>
      )}
    </SectionCard>
  );
}
