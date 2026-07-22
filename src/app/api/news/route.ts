import { NextRequest, NextResponse } from "next/server";

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  tickers: string[];
};

function relativeTime(unixTs: number): string {
  const diff = (Date.now() - unixTs * 1000) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

const BULLISH = ["beat", "surge", "rally", "gain", "rise", "record", "growth", "strong", "bullish", "upgrade", "profit", "exceed", "상승", "급등", "호실적", "매수", "상향"];
const BEARISH = ["miss", "drop", "fall", "decline", "loss", "weak", "bearish", "downgrade", "concern", "risk", "cut", "below", "하락", "급락", "부진", "우려", "매도", "하향"];

function detectSentiment(text: string): { sentiment: NewsItem["sentiment"]; score: number } {
  const lower = text.toLowerCase();
  const b = BULLISH.filter((w) => lower.includes(w)).length;
  const r = BEARISH.filter((w) => lower.includes(w)).length;
  if (b > r) return { sentiment: "bullish", score: b / (b + r) };
  if (r > b) return { sentiment: "bearish", score: -(r / (b + r)) };
  return { sentiment: "neutral", score: 0 };
}

function toYahooSymbol(ticker: string) {
  return /^\d{6}$/.test(ticker) ? `${ticker}.KS` : ticker;
}

async function fetchFinnhubNews(ticker: string, key: string): Promise<(NewsItem & { ts: number })[]> {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 86400 * 1000).toISOString().slice(0, 10);
  const res = await fetch(
    `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${key}`,
    { next: { revalidate: 3600 } }
  );
  const articles = await res.json();
  if (!Array.isArray(articles)) return [];
  return articles.map((a: Record<string, unknown>) => {
    const { sentiment, score } = detectSentiment(`${a.headline} ${a.summary}`);
    return {
      title: String(a.headline ?? ""),
      url: String(a.url ?? ""),
      source: String(a.source ?? ""),
      publishedAt: relativeTime(Number(a.datetime)),
      summary: String(a.summary ?? ""),
      sentiment,
      sentimentScore: score,
      tickers: [ticker],
      ts: Number(a.datetime),
    };
  });
}

async function fetchYahooNews(ticker: string): Promise<(NewsItem & { ts: number })[]> {
  const symbol = toYahooSymbol(ticker);
  const res = await fetch(
    `https://query2.finance.yahoo.com/v1/finance/search?q=${symbol}&quotesCount=0&newsCount=10&enableFuzzyQuery=false`,
    {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
      next: { revalidate: 3600 },
    }
  );
  const data = await res.json();
  const items: Record<string, unknown>[] = data.news ?? [];
  return items.map((a) => {
    const ts = Number(a.providerPublishTime ?? 0);
    const { sentiment, score } = detectSentiment(String(a.title ?? ""));
    return {
      title: String(a.title ?? ""),
      url: String(a.link ?? ""),
      source: String(a.publisher ?? ""),
      publishedAt: ts ? relativeTime(ts) : "",
      summary: "",
      sentiment,
      sentimentScore: score,
      tickers: [ticker],
      ts,
    };
  });
}

export async function GET(req: NextRequest) {
  const tickers = req.nextUrl.searchParams.get("tickers")?.split(",").filter(Boolean) ?? [];
  const finnhubKey = process.env.FINNHUB_KEY ?? "";

  const seen = new Set<string>();
  const allArticles: (NewsItem & { ts: number })[] = [];

  await Promise.all(
    tickers.map(async (ticker) => {
      const isKorean = /^\d{6}$/.test(ticker);
      try {
        const articles = isKorean
          ? await fetchYahooNews(ticker)
          : finnhubKey
          ? await fetchFinnhubNews(ticker, finnhubKey)
          : await fetchYahooNews(ticker);

        for (const a of articles) {
          if (!a.url || seen.has(a.url)) continue;
          seen.add(a.url);
          allArticles.push(a);
        }
      } catch {
        // 개별 실패 무시
      }
    })
  );

  const top5 = allArticles
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5)
    .map(({ ts: _ts, ...item }) => item);

  return NextResponse.json({ items: top5 });
}
