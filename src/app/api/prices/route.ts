import { NextRequest, NextResponse } from "next/server";

function toYahooSymbol(ticker: string) {
  return /^\d{6}$/.test(ticker) ? `${ticker}.KS` : ticker;
}

export async function GET(req: NextRequest) {
  const tickers = req.nextUrl.searchParams.get("tickers")?.split(",").filter(Boolean) ?? [];
  if (tickers.length === 0) return NextResponse.json({});

  const results: Record<string, number | null> = {};

  // Yahoo Finance chart API: 한국/미국 모두 지원, 키 불필요, 병렬 호출
  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${toYahooSymbol(ticker)}?interval=1d&range=1d`,
          {
            headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
            next: { revalidate: 60 }, // 1분 서버 캐시
          }
        );
        const data = await res.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        results[ticker] = typeof price === "number" ? price : null;
      } catch {
        results[ticker] = null;
      }
    })
  );

  return NextResponse.json(results);
}
