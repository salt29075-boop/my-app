import { NextRequest, NextResponse } from "next/server";

const HEADERS = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };

async function fetchYahooChart(symbol: string): Promise<{ price: number; time: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { headers: HEADERS, next: { revalidate: 60 } }
    );
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice;
    const time = meta.regularMarketTime ?? 0;
    return typeof price === "number" && price > 0 ? { price, time } : null;
  } catch {
    return null;
  }
}

async function resolveKoreanPrice(ticker: string): Promise<number | null> {
  // KOSPI(.KS)와 KOSDAQ(.KQ)를 동시에 조회 → regularMarketTime이 더 최신인 쪽 선택
  const [ks, kq] = await Promise.all([
    fetchYahooChart(`${ticker}.KS`),
    fetchYahooChart(`${ticker}.KQ`),
  ]);

  if (!ks && !kq) return null;
  if (!ks) return kq!.price;
  if (!kq) return ks.price;
  // 더 최근에 거래된 거래소의 가격 사용
  return ks.time >= kq.time ? ks.price : kq.price;
}

export async function GET(req: NextRequest) {
  const tickers = req.nextUrl.searchParams.get("tickers")?.split(",").filter(Boolean) ?? [];
  if (tickers.length === 0) return NextResponse.json({});

  const results: Record<string, number | null> = {};

  await Promise.all(
    tickers.map(async (ticker) => {
      if (/^\d{6}$/.test(ticker)) {
        // 한국 주식: KOSPI/KOSDAQ 자동 감지
        results[ticker] = await resolveKoreanPrice(ticker);
      } else {
        // 미국 주식: 직접 조회
        const r = await fetchYahooChart(ticker);
        results[ticker] = r?.price ?? null;
      }
    })
  );

  return NextResponse.json(results);
}
