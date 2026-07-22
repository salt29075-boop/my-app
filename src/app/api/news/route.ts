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

// 6자리 숫자 KRX 종목 → Alpha Vantage 형식
function toAvTicker(ticker: string) {
  return /^\d{6}$/.test(ticker) ? `${ticker}.KS` : ticker;
}

function toSentiment(label: string): NewsItem["sentiment"] {
  if (label.toLowerCase().includes("bullish")) return "bullish";
  if (label.toLowerCase().includes("bearish")) return "bearish";
  return "neutral";
}

function relativeTime(isoStr: string): string {
  const published = new Date(
    isoStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6")
  );
  const diff = (Date.now() - published.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export async function GET(req: NextRequest) {
  const tickers = req.nextUrl.searchParams.get("tickers")?.split(",").filter(Boolean) ?? [];
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const avTickers = tickers.map(toAvTicker).join(",");

  const url =
    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT` +
    `&tickers=${encodeURIComponent(avTickers)}` +
    `&limit=50&sort=RELEVANCE&apikey=${key}`;

  const res = await fetch(url, { next: { revalidate: 3600 } }); // 1시간 서버 캐시
  const data = await res.json();

  if (!data.feed) {
    return NextResponse.json({ items: [] });
  }

  // 관련도 × 감성 강도로 중요도 점수 계산 → 상위 5개
  const scored = (data.feed as Record<string, unknown>[]).map((article) => {
    const tickerSentiments = (article.ticker_sentiment as Record<string, unknown>[]) ?? [];
    const maxRelevance = tickerSentiments.reduce(
      (max: number, ts: Record<string, unknown>) => Math.max(max, parseFloat(String(ts.relevance_score ?? 0))),
      0
    );
    const sentScore = Math.abs(parseFloat(String(article.overall_sentiment_score ?? 0)));
    const importance = maxRelevance * (1 + sentScore);

    const relatedTickers = tickerSentiments
      .filter((ts: Record<string, unknown>) => parseFloat(String(ts.relevance_score ?? 0)) > 0.1)
      .map((ts: Record<string, unknown>) => {
        const t = String(ts.ticker ?? "");
        return t.replace(".KS", "");
      });

    return {
      importance,
      item: {
        title: String(article.title ?? ""),
        url: String(article.url ?? ""),
        source: String(article.source ?? ""),
        publishedAt: relativeTime(String(article.time_published ?? "")),
        summary: String(article.summary ?? ""),
        sentiment: toSentiment(String(article.overall_sentiment_label ?? "")),
        sentimentScore: parseFloat(String(article.overall_sentiment_score ?? 0)),
        tickers: relatedTickers,
      } satisfies NewsItem,
    };
  });

  const top5 = scored
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5)
    .map((s) => s.item);

  return NextResponse.json({ items: top5 });
}
