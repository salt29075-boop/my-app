import { NextRequest, NextResponse } from "next/server";

const HEADERS = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };

export type PricePoint = { t: number; c: number };

async function fetchYahooHistory(symbol: string, range: string): Promise<PricePoint[] | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`,
      { headers: HEADERS, next: { revalidate: 300 } }
    );
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] | undefined = result?.timestamp;
    const closes: (number | null)[] | undefined = result?.indicators?.quote?.[0]?.close;
    if (!timestamps || !closes) return null;

    const points: PricePoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (typeof c === "number") points.push({ t: timestamps[i], c });
    }
    return points.length > 0 ? points : null;
  } catch {
    return null;
  }
}

async function resolveKoreanHistory(ticker: string, range: string): Promise<PricePoint[] | null> {
  const [ks, kq] = await Promise.all([
    fetchYahooHistory(`${ticker}.KS`, range),
    fetchYahooHistory(`${ticker}.KQ`, range),
  ]);
  // 더 많은 데이터가 조회된(=실제 상장된) 거래소 쪽 채택
  if (!ks && !kq) return null;
  if (!ks) return kq;
  if (!kq) return ks;
  return ks.length >= kq.length ? ks : kq;
}

const ALLOWED_RANGES = new Set(["1mo", "3mo", "6mo", "1y"]);

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker") ?? "";
  const range = req.nextUrl.searchParams.get("range") ?? "3mo";
  if (!ticker || !ALLOWED_RANGES.has(range)) {
    return NextResponse.json({ points: [] }, { status: 400 });
  }

  const points = /^\d{6}$/.test(ticker)
    ? await resolveKoreanHistory(ticker, range)
    : await fetchYahooHistory(ticker, range);

  return NextResponse.json({ points: points ?? [] });
}
