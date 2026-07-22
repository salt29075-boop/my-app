import SectionCard from "./SectionCard";

const news = [
  {
    title: "삼성전자, 3분기 영업이익 전망치 상향... 반도체 업황 회복 신호",
    source: "한국경제",
    time: "10분 전",
    tag: "005930",
    sentiment: "positive",
  },
  {
    title: "Fed 9월 금리인하 가능성 75%로 상승, 증시 반응 주목",
    source: "Bloomberg",
    time: "32분 전",
    tag: "매크로",
    sentiment: "positive",
  },
  {
    title: "NVIDIA 실적 발표 앞두고 옵션 시장 변동성 급등",
    source: "Reuters",
    time: "1시간 전",
    tag: "NVDA",
    sentiment: "neutral",
  },
  {
    title: "카카오, 플랫폼 규제 강화 우려에 외국인 순매도 지속",
    source: "매일경제",
    time: "2시간 전",
    tag: "035720",
    sentiment: "negative",
  },
  {
    title: "SK하이닉스 HBM3E 양산 확대... 애플·MS 공급계약 임박",
    source: "전자신문",
    time: "3시간 전",
    tag: "000660",
    sentiment: "positive",
  },
  {
    title: "원/달러 환율 1,380원대 등락... 수출주 단기 수혜 예상",
    source: "연합뉴스",
    time: "4시간 전",
    tag: "매크로",
    sentiment: "neutral",
  },
];

const sentimentStyle: Record<string, string> = {
  positive: "var(--green)",
  negative: "var(--red)",
  neutral: "var(--text-secondary)",
};

const sentimentDot: Record<string, string> = {
  positive: "bg-green-500",
  negative: "bg-red-500",
  neutral: "bg-gray-500",
};

export default function NewsSection() {
  return (
    <SectionCard title="뉴스">
      <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
        {news.map((item, i) => (
          <li key={i} className="px-4 py-3 flex flex-col gap-1.5 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-2">
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${sentimentDot[item.sentiment]}`}
              />
              <p className="text-sm leading-snug line-clamp-2">{item.title}</p>
            </div>
            <div className="flex items-center gap-2 pl-3.5">
              <span
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ background: "var(--surface-2)", color: sentimentStyle[item.sentiment] }}
              >
                {item.tag}
              </span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.source}</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>·</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
