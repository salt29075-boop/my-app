"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useHoldings, Holding } from "../contexts/HoldingsContext";

type FormState = { name: string; ticker: string; qty: string; avgPrice: string; currentPrice: string; currency: "KRW" | "USD" };
const EMPTY: FormState = { name: "", ticker: "", qty: "", avgPrice: "", currentPrice: "", currency: "KRW" };

export default function HoldingsManager() {
  const { holdings, add, update, remove, importJSON, exportJSON } = useHoldings();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => { setForm(EMPTY); setEditId(null); setError(""); };

  const openEdit = (h: Holding) => {
    setForm({
      name: h.name,
      ticker: h.ticker,
      qty: String(h.qty),
      avgPrice: String(h.avgPrice),
      currentPrice: String(h.currentPrice),
      currency: h.currency,
    });
    setEditId(h.id);
    setError("");
  };

  const handleSubmit = () => {
    if (!form.name || !form.ticker || !form.qty || !form.avgPrice || !form.currentPrice) {
      setError("모든 항목을 입력해주세요.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      ticker: form.ticker.trim().toUpperCase(),
      qty: Number(form.qty),
      avgPrice: Number(form.avgPrice),
      currentPrice: Number(form.currentPrice),
      currency: form.currency,
    };
    if (editId) {
      update({ ...payload, id: editId });
    } else {
      add(payload);
    }
    resetForm();
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importJSON(ev.target?.result as string);
        setError("");
      } catch {
        setError("JSON 파일 형식이 올바르지 않습니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1 rounded-lg transition-colors hover:opacity-80 font-medium"
        style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
      >
        종목 관리
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); resetForm(); } }}
        >
          <div
            className="w-full max-w-2xl rounded-xl border flex flex-col max-h-[90vh]"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
              <span className="font-semibold">종목 관리</span>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity"
                  style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                >
                  JSON 가져오기
                </button>
                <button
                  onClick={exportJSON}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-80 transition-opacity"
                  style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                >
                  JSON 내보내기
                </button>
                <button
                  onClick={() => { setOpen(false); resetForm(); }}
                  className="text-lg leading-none ml-1 hover:opacity-60 transition-opacity"
                  style={{ color: "var(--text-secondary)" }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {/* 입력 폼 */}
              <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                  {editId ? "종목 수정" : "종목 추가"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "name", label: "종목명", placeholder: "삼성전자" },
                    { key: "ticker", label: "티커", placeholder: "005930" },
                    { key: "qty", label: "수량", placeholder: "10", type: "number" },
                    { key: "avgPrice", label: "매수가", placeholder: "71200", type: "number" },
                    { key: "currentPrice", label: "현재가", placeholder: "76300", type: "number" },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</label>
                      <input
                        type={type ?? "text"}
                        placeholder={placeholder}
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                        className="text-sm px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                        style={{ background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: "var(--text-secondary)" }}>통화</label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value as "KRW" | "USD" }))}
                      className="text-sm px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                    >
                      <option value="KRW">KRW (원)</option>
                      <option value="USD">USD (달러)</option>
                    </select>
                  </div>
                </div>
                {error && <p className="text-xs mt-2" style={{ color: "var(--red)" }}>{error}</p>}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSubmit}
                    className="text-sm px-4 py-2 rounded-lg font-medium hover:opacity-80 transition-opacity"
                    style={{ background: "var(--blue)", color: "#fff" }}
                  >
                    {editId ? "수정 완료" : "추가"}
                  </button>
                  {editId && (
                    <button
                      onClick={resetForm}
                      className="text-sm px-4 py-2 rounded-lg font-medium hover:opacity-80 transition-opacity"
                      style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>

              {/* 보유 종목 목록 */}
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid var(--border)` }}>
                    {["종목", "수량", "매수가", "현재가", "통화", ""].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                        보유 종목이 없습니다.
                      </td>
                    </tr>
                  )}
                  {holdings.map((h, i) => (
                    <tr
                      key={h.id}
                      style={{
                        borderBottom: i < holdings.length - 1 ? `1px solid var(--border)` : undefined,
                        background: editId === h.id ? "rgba(56,139,253,0.08)" : undefined,
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{h.name}</div>
                        <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{h.ticker}</div>
                      </td>
                      <td className="px-4 py-3 font-mono">{h.qty.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono">{h.avgPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono">{h.currentPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{h.currency}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(h)}
                            className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
                            style={{ background: "var(--surface-2)", color: "var(--blue)", border: "1px solid var(--border)" }}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => { if (confirm(`${h.name}을(를) 삭제할까요?`)) remove(h.id); }}
                            className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
                            style={{ background: "var(--surface-2)", color: "var(--red)", border: "1px solid var(--border)" }}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
