import { NextRequest, NextResponse } from "next/server";

const HEADERS = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };

type Quote = { price: number; time: number };

const toNum = (s: unknown) => (typeof s === "string" ? Number(s.replace(/,/g, "")) : NaN);
const toTime = (s: unknown) => (typeof s === "string" ? Date.parse(s) / 1000 : 0);

// 네이버 실시간 시세 (지연 없음, NXT 프리/애프터마켓 08:00–20:00 포함). 여러 종목 한 번에 조회.
async function fetchNaverQuotes(codes: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (codes.length === 0) return out;
  try {
    const res = await fetch(
      `https://polling.finance.naver.com/api/realtime/domestic/stock/${codes.join(",")}`,
      { headers: HEADERS, cache: "no-store" }
    );
    const data = await res.json();
    for (const d of data?.datas ?? []) {
      let price = toNum(d.closePrice);
      let time = toTime(d.localTradedAt);
      const over = d.overMarketPriceInfo;
      if (over) {
        const overPrice = toNum(over.overPrice);
        const overTime = toTime(over.localTradedAt);
        if (overPrice > 0 && overTime > time) {
          price = overPrice;
          time = overTime;
        }
      }
      if (price > 0) out[d.itemCode] = price;
    }
  } catch {}
  return out;
}

// Yahoo 차트 (프리/애프터마켓 포함 마지막 체결가)
async function fetchYahooChart(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d&includePrePost=true`,
      { headers: HEADERS, cache: "no-store" }
    );
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta) return null;

    let price: number = meta.regularMarketPrice;
    let time: number = meta.regularMarketTime ?? 0;

    const ts: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
    for (let i = closes.length - 1; i >= 0; i--) {
      const c = closes[i];
      if (typeof c === "number" && c > 0) {
        if (ts[i] > time) {
          price = c;
          time = ts[i];
        }
        break;
      }
    }
    return typeof price === "number" && price > 0 ? { price, time } : null;
  } catch {
    return null;
  }
}

async function resolveKoreanPriceYahoo(ticker: string): Promise<number | null> {
  const [ks, kq] = await Promise.all([
    fetchYahooChart(`${ticker}.KS`),
    fetchYahooChart(`${ticker}.KQ`),
  ]);
  if (!ks && !kq) return null;
  if (!ks) return kq!.price;
  if (!kq) return ks.price;
  return ks.time >= kq.time ? ks.price : kq.price;
}

export async function GET(req: NextRequest) {
  const tickers = req.nextUrl.searchParams.get("tickers")?.split(",").filter(Boolean) ?? [];
  if (tickers.length === 0) return NextResponse.json({});

  const krTickers = tickers.filter((t) => /^\d{6}$/.test(t));
  const usTickers = tickers.filter((t) => !/^\d{6}$/.test(t));

  const results: Record<string, number | null> = {};

  const naver = await fetchNaverQuotes(krTickers);

  await Promise.all([
    // 한국: 네이버 우선, 실패 시 Yahoo(약 20분 지연) 폴백
    ...krTickers.map(async (t) => {
      results[t] = naver[t] ?? (await resolveKoreanPriceYahoo(t));
    }),
    ...usTickers.map(async (t) => {
      results[t] = (await fetchYahooChart(t))?.price ?? null;
    }),
  ]);

  return NextResponse.json(results, { headers: { "Cache-Control": "no-store" } });
}
