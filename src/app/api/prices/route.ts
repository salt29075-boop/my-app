import { NextRequest, NextResponse } from "next/server";

// 6자리 숫자 티커 → KRX 종목 (Alpha Vantage 형식)
function toAvTicker(ticker: string) {
  return /^\d{6}$/.test(ticker) ? `${ticker}.KS` : ticker;
}

export async function GET(req: NextRequest) {
  const tickers = req.nextUrl.searchParams.get("tickers")?.split(",").filter(Boolean) ?? [];
  if (tickers.length === 0) return NextResponse.json({});

  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const results: Record<string, number | null> = {};

  // Alpha Vantage 무료 플랜: 분당 5건 — 순차 호출
  for (const ticker of tickers) {
    try {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${toAvTicker(ticker)}&apikey=${key}`,
        { next: { revalidate: 60 } } // 1분 캐시
      );
      const data = await res.json();
      const price = data["Global Quote"]?.["05. price"];
      results[ticker] = price ? parseFloat(price) : null;
    } catch {
      results[ticker] = null;
    }
  }

  return NextResponse.json(results);
}
