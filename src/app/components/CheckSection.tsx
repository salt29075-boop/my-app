"use client";

import { useState } from "react";
import SectionCard from "./SectionCard";

const initialItems = [
  { id: 1, label: "분기 실적 확인 (삼성전자 Q2)", done: true },
  { id: 2, label: "NVIDIA 실적 발표 대응 전략 수립", done: false },
  { id: 3, label: "카카오 손절 여부 재검토", done: false },
  { id: 4, label: "환헤지 비중 점검", done: true },
  { id: 5, label: "배당락일 캘린더 업데이트", done: false },
  { id: 6, label: "SK하이닉스 목표가 상향 검토", done: false },
  { id: 7, label: "신규 종목 리서치 (2차전지)", done: false },
];

export default function CheckSection() {
  const [items, setItems] = useState(initialItems);
  const [newLabel, setNewLabel] = useState("");

  const toggle = (id: number) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));

  const add = () => {
    const label = newLabel.trim();
    if (!label) return;
    setItems((prev) => [...prev, { id: Date.now(), label, done: false }]);
    setNewLabel("");
  };

  const done = items.filter((it) => it.done).length;

  return (
    <SectionCard
      title="체크"
      action={
        <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
          {done}/{items.length}
        </span>
      }
    >
      {/* 진행 바 */}
      <div className="px-4 pt-3 pb-2">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(done / items.length) * 100}%`, background: "var(--green)" }}
          />
        </div>
      </div>

      {/* 항목 */}
      <ul className="px-4 pb-2 flex flex-col gap-1">
        {items.map((item) => (
          <li
            key={item.id}
            onClick={() => toggle(item.id)}
            className="flex items-center gap-3 py-2 cursor-pointer group"
          >
            <span
              className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
              style={{
                borderColor: item.done ? "var(--green)" : "var(--border)",
                background: item.done ? "var(--green)" : "transparent",
              }}
            >
              {item.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L4 7L9 1" stroke="#0d1117" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span
              className="text-sm transition-colors"
              style={{ color: item.done ? "var(--text-secondary)" : "var(--text-primary)", textDecoration: item.done ? "line-through" : "none" }}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {/* 새 항목 추가 */}
      <div className="px-4 pb-4 pt-1 flex gap-2 border-t mt-1" style={{ borderColor: "var(--border)" }}>
        <input
          className="flex-1 text-sm px-3 py-1.5 rounded-lg outline-none focus:ring-1"
          style={{ background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          placeholder="새 항목 추가..."
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button
          onClick={add}
          className="text-sm px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--blue)", color: "#fff" }}
        >
          추가
        </button>
      </div>
    </SectionCard>
  );
}
