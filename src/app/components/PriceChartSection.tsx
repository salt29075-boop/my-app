"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useHoldings } from "../contexts/HoldingsContext";
import SectionCard from "./SectionCard";

type PricePoint = { t: number; c: number };

const RANGE = "3mo";
const RANGE_LABEL = "최근 3개월";
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { points: PricePoint[]; at: number }>();

const W = 640;
const H = 220;
const PAD_LEFT = 56;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PLOT_W = W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = H - PAD_TOP - PAD_BOTTOM;

function formatDate(tSec: number) {
  return new Date(tSec * 1000).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

export default function PriceChartSection() {
  const { holdings } = useHoldings();
  const [selected, setSelected] = useState("");
  const [points, setPoints] = useState<PricePoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const effectiveSelected = holdings.some((h) => h.ticker === selected) ? selected : holdings[0]?.ticker ?? "";
  const current = holdings.find((h) => h.ticker === effectiveSelected);

  // 선택 종목이 바뀌면 이전 종목의 호버 상태를 초기화 (렌더 중 상태 조정 — effect 불필요)
  const [hoverResetFor, setHoverResetFor] = useState(effectiveSelected);
  if (hoverResetFor !== effectiveSelected) {
    setHoverResetFor(effectiveSelected);
    setHoverIndex(null);
  }

  useEffect(() => {
    if (!effectiveSelected) return;

    const cached = cache.get(effectiveSelected);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setPoints(cached.points);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/history?ticker=${effectiveSelected}&range=${RANGE}`)
      .then((res) => res.json())
      .then((data: { points: PricePoint[] }) => {
        if (cancelled) return;
        if (!data.points || data.points.length === 0) {
          setError(true);
          setPoints(null);
        } else {
          cache.set(effectiveSelected, { points: data.points, at: Date.now() });
          setPoints(data.points);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setPoints(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveSelected]);

  const geometry = useMemo(() => {
    if (!points || points.length === 0) return null;
    const closes = points.map((p) => p.c);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = max - min || max * 0.01 || 1;
    const yPad = span * 0.1;
    const yMin = min - yPad;
    const yMax = max + yPad;

    const xAt = (i: number) => (points.length === 1 ? PAD_LEFT : PAD_LEFT + (i / (points.length - 1)) * PLOT_W);
    const yAt = (c: number) => PAD_TOP + (1 - (c - yMin) / (yMax - yMin)) * PLOT_H;

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)},${yAt(p.c).toFixed(2)}`).join(" ");
    const areaPath = `${linePath} L${xAt(points.length - 1).toFixed(2)},${PAD_TOP + PLOT_H} L${xAt(0).toFixed(2)},${PAD_TOP + PLOT_H} Z`;

    const first = closes[0];
    const last = closes[closes.length - 1];
    const changePct = ((last - first) / first) * 100;
    const isUp = last >= first;

    return { min, max, xAt, yAt, linePath, areaPath, first, last, changePct, isUp };
  }, [points]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!points || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (relX - PAD_LEFT) / PLOT_W;
    const i = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, i)));
  };

  const sym = current?.currency === "USD" ? "$" : "₩";
  const gradientId = `price-gradient-${effectiveSelected || "none"}`;
  const hover = hoverIndex !== null && points ? points[hoverIndex] : null;

  return (
    <SectionCard
      title="주가"
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
          종목을 추가하면 주가 차트를 표시합니다.
        </div>
      ) : (
        <>
          <div className="px-4 pt-3 pb-1 flex items-baseline justify-between">
            <div>
              <p className="text-base font-semibold">{current.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{RANGE_LABEL}</p>
            </div>
            {geometry && (
              <div className="text-right">
                <p className="font-mono font-semibold">{sym}{geometry.last.toLocaleString()}</p>
                <p className="text-xs font-mono" style={{ color: geometry.isUp ? "var(--green)" : "var(--red)" }}>
                  {geometry.isUp ? "+" : ""}{geometry.changePct.toFixed(2)}%
                </p>
              </div>
            )}
          </div>

          {loading && !points && (
            <div className="flex items-center justify-center py-16 text-sm" style={{ color: "var(--text-secondary)" }}>
              차트 불러오는 중...
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center justify-center py-16 text-sm" style={{ color: "var(--text-secondary)" }}>
              차트 데이터를 불러오지 못했습니다.
            </div>
          )}

          {geometry && !error && (
            <div className="relative px-2 pb-2">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={geometry.isUp ? "var(--green)" : "var(--red)"} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={geometry.isUp ? "var(--green)" : "var(--red)"} stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* y축 보조선 & 라벨 (최고/최저) */}
                <line x1={PAD_LEFT} y1={PAD_TOP} x2={W - PAD_RIGHT} y2={PAD_TOP} stroke="var(--border)" strokeWidth="1" />
                <line x1={PAD_LEFT} y1={PAD_TOP + PLOT_H} x2={W - PAD_RIGHT} y2={PAD_TOP + PLOT_H} stroke="var(--border)" strokeWidth="1" />
                <text x={PAD_LEFT - 8} y={PAD_TOP + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
                  {sym}{geometry.max.toLocaleString()}
                </text>
                <text x={PAD_LEFT - 8} y={PAD_TOP + PLOT_H + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
                  {sym}{geometry.min.toLocaleString()}
                </text>

                {/* x축 라벨 (시작/끝 날짜) */}
                <text x={PAD_LEFT} y={H - 8} textAnchor="start" fontSize="10" fill="var(--text-secondary)">
                  {formatDate(points![0].t)}
                </text>
                <text x={W - PAD_RIGHT} y={H - 8} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
                  {formatDate(points![points!.length - 1].t)}
                </text>

                {/* 영역 채우기 & 라인 */}
                <path d={geometry.areaPath} fill={`url(#${gradientId})`} />
                <path
                  d={geometry.linePath}
                  fill="none"
                  stroke={geometry.isUp ? "var(--green)" : "var(--red)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* 마지막 값 강조 점 */}
                <circle
                  cx={geometry.xAt(points!.length - 1)}
                  cy={geometry.yAt(geometry.last)}
                  r="3"
                  fill={geometry.isUp ? "var(--green)" : "var(--red)"}
                />

                {/* 호버 크로스헤어 */}
                {hover && hoverIndex !== null && (
                  <>
                    <line
                      x1={geometry.xAt(hoverIndex)}
                      y1={PAD_TOP}
                      x2={geometry.xAt(hoverIndex)}
                      y2={PAD_TOP + PLOT_H}
                      stroke="var(--text-secondary)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={geometry.xAt(hoverIndex)}
                      cy={geometry.yAt(hover.c)}
                      r="3.5"
                      fill="var(--background)"
                      stroke={geometry.isUp ? "var(--green)" : "var(--red)"}
                      strokeWidth="2"
                    />
                  </>
                )}
              </svg>

              {hover && hoverIndex !== null && (
                <div
                  className="absolute top-2 px-2 py-1 rounded-md text-xs font-mono pointer-events-none whitespace-nowrap"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    left: `${Math.min(88, Math.max(12, (hoverIndex / Math.max(1, points!.length - 1)) * 100))}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div style={{ color: "var(--text-secondary)" }}>{formatDate(hover.t)}</div>
                  <div className="font-semibold">{sym}{hover.c.toLocaleString()}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
