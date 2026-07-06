import { useState } from "react";
import { getRotaSessao } from "../lib/api";

type RowDef =
  | { type: "row"; label: string; value: string; valueColor?: string; bold?: boolean; highlight?: boolean; editable?: boolean }
  | { type: "toggle"; label: string; on: boolean };

type Section = {
  title: string;
  dot: string;
  accent: string;
  headerBg: string;
  headerText: string;
  rows: RowDef[];
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });


function ToggleSwitch({ on }: { on: boolean }) {
  const [active, setActive] = useState(on);
  return (
    <div
      onClick={() => setActive(p => !p)}
      className="w-9 h-5 rounded-full relative cursor-pointer transition-colors duration-200"
      style={{ background: active ? "#3b82f6" : "#d1d5db" }}
    >
      <div className={`absolute top-[3px] w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all duration-200 ${active ? "right-[3px]" : "left-[3px]"}`} />
    </div>
  );
}

export function RelatorioFinanceiro({
  onBack,
  onSair,
  onCaixaFechado,
  caixaInicial = 3000,
  onCaixaInicialChange,
  totalDespesas = 0,
  totalRendimentos = 0,
  totalClientes = 0,
  clientesParaCobranca = 0,
  adicionaisCount = 0,
  cobradosCount = 0,
  ausentesCount = 0,
  novosCount = 0,
  renovacoesCount = 0,
  cobrancaDiaria = 0,
  cobrancaEsperada = 0,
  novosEmprestimos = 0,
  renovacoesValor = 0,
  retiradaCaixa = 0,
  onSemPagamentos,
}: {
  onBack: () => void;
  onSair?: () => void;
  onCaixaFechado?: () => void;
  caixaInicial?: number;
  onCaixaInicialChange?: (v: number) => void;
  totalDespesas?: number;
  totalRendimentos?: number;
  totalClientes?: number;
  clientesParaCobranca?: number;
  adicionaisCount?: number;
  cobradosCount?: number;
  ausentesCount?: number;
  novosCount?: number;
  renovacoesCount?: number;
  cobrancaDiaria?: number;
  cobrancaEsperada?: number;
  novosEmprestimos?: number;
  renovacoesValor?: number;
  retiradaCaixa?: number;
  onSemPagamentos?: () => void;
}) {
  const [modalFechamento, setModalFechamento] = useState(false);
  const [caixaFechado, setCaixaFechado] = useState(false);
  const [modalSemPag, setModalSemPag] = useState(false);
  const [modalRelatorio, setModalRelatorio] = useState(false);
  const [snap, setSnap] = useState<{ caixaInicial: number; cobrancaDiaria: number; novosEmprestimos: number; totalDespesas: number; totalRendimentos: number; novosCount: number; saldo: number; renovacoesCount: number; retiradaCaixa: number } | null>(null);

  const saldo = caixaInicial + cobrancaDiaria + totalRendimentos - novosEmprestimos - retiradaCaixa - totalDespesas;
  const todosCorados = clientesParaCobranca === 0 || cobradosCount >= clientesParaCobranca;

  const hoje = new Date();
  const dataStr = hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const [compartilhando, setCompartilhando] = useState(false);

  const compartilharImagem = async () => {
    const el = document.getElementById("relatorio-pdf-content");
    if (!el) return;
    setCompartilhando(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) { setCompartilhando(false); return; }
        const file = new File([blob], `relatorio-${dataStr.replace(/\//g, "-")}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Relatório Diário" });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
        }
        setCompartilhando(false);
      }, "image/png");
    } catch {
      setCompartilhando(false);
    }
  };

  const handleFecharCaixa = () => {
    setSnap({ caixaInicial, cobrancaDiaria, novosEmprestimos, totalDespesas, totalRendimentos, novosCount, saldo, renovacoesCount, retiradaCaixa });
    onCaixaInicialChange?.(saldo);
    onCaixaFechado?.();
    setCaixaFechado(true);
    setModalFechamento(false);
    setTimeout(() => setModalRelatorio(true), 200);
  };

  const sections: Section[] = [
    {
      title: "Clientes",
      dot: "bg-indigo-500", accent: "#6366f1",
      headerBg: "bg-indigo-50", headerText: "text-indigo-700",
      rows: [
        { type: "row", label: "Número de Clientes",  value: String(totalClientes) },
        { type: "row", label: "Clientes Novos",       value: String(novosCount),  valueColor: "text-emerald-600" },
        { type: "row", label: "Clientes Ausentes",    value: String(ausentesCount) },
        { type: "row", label: "Renovação de Cliente", value: String(renovacoesCount) },
        { type: "row", label: "Cobranças Feitas",     value: `${cobradosCount} / ${Math.max(0, clientesParaCobranca - adicionaisCount)}  —  Adicionais: ${adicionaisCount}` },
      ],
    },
    {
      title: "Cobranças",
      dot: "bg-emerald-500", accent: "#10b981",
      headerBg: "bg-emerald-50", headerText: "text-emerald-700",
      rows: [
        { type: "row", label: "Cobrança Esperada",        value: `R$ ${fmt(cobrancaEsperada)} (100%)` },
        { type: "row", label: "Cobrança Diária",          value: `R$ ${fmt(cobrancaDiaria)} (${cobrancaEsperada > 0 ? (cobrancaDiaria / cobrancaEsperada * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : 0}%)`, valueColor: "text-emerald-600" },
        { type: "row", label: "Dinheiro / Transferência", value: `R$ ${fmt(cobrancaDiaria)} / R$ 0,00` },
      ],
    },
    {
      title: "Financeiro",
      dot: "bg-blue-500", accent: "#3b82f6",
      headerBg: "bg-blue-50", headerText: "text-blue-700",
      rows: [
        { type: "row", label: "Caixa Inicial",      value: `R$ ${fmt(caixaInicial)}`, editable: true },
        { type: "row", label: "Total de Empréstimos", value: `R$ ${fmt(novosEmprestimos)}` },
        { type: "row", label: "Retirada de Caixa",  value: `R$ ${fmt(retiradaCaixa)}`, valueColor: retiradaCaixa > 0 ? "text-red-500" : undefined },
        { type: "row", label: "Despesas",            value: `R$ ${fmt(totalDespesas)}`, valueColor: "text-red-500" },
        { type: "row", label: "Rendimento",          value: `R$ ${fmt(totalRendimentos)}`, valueColor: "text-emerald-600" },
        { type: "row", label: "Saldo de Caixa",      value: `R$ ${fmt(saldo)}`, bold: true, highlight: true },
      ],
    },
    {
      title: "Sistema",
      dot: "bg-slate-400", accent: "#94a3b8",
      headerBg: "bg-slate-100", headerText: "text-slate-600",
      rows: [{ type: "toggle", label: "Sincronização Automática", on: true }],
    },
  ];

  return (
    <div className="flex flex-col bg-slate-100" style={{ flex: 1, overflowY: "auto", paddingBottom: 80, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div className="px-3 pt-3 space-y-2">
        {sections.map((section) => (
          <div key={section.title} className="bg-white rounded-lg overflow-hidden shadow-sm border border-slate-100">
            <div className="h-[2px]" style={{ background: section.accent }} />
            <div className={`${section.headerBg} px-3 py-1.5 flex items-center gap-1.5 border-b border-slate-100`}>
              <div className={`w-2 h-2 rounded-full ${section.dot}`} />
              <span className={`text-[9px] font-bold uppercase tracking-widest ${section.headerText}`}>{section.title}</span>
            </div>
            {section.rows.map((row, ri) => {
              if (row.type === "toggle") {
                return (
                  <div key={ri} className="flex items-center justify-between px-3 py-2">
                    <span className="text-[11px] font-bold text-slate-800">{row.label}</span>
                    <ToggleSwitch on={row.on} />
                  </div>
                );
              }
              const bg = row.highlight ? "bg-blue-50" : ri % 2 === 0 ? "bg-white" : "bg-slate-50/60";
              return (
                <div key={ri} className={`flex items-center justify-between px-3 py-[5px] border-t border-slate-100 ${bg}`}>
                  <span className="text-[10px] font-bold text-slate-800 w-[55%]">{row.label}</span>
                  <span className={`text-[10px] text-right tabular-nums ${row.bold ? "font-bold text-blue-700" : "font-medium"} ${row.valueColor ?? "text-slate-700"}`}>
                    {row.value}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            onClick={() => onSemPagamentos && setModalSemPag(true)}
            disabled={!onSemPagamentos}
            className="bg-slate-900 text-white rounded-lg py-1.5 text-[10px] font-semibold shadow-sm flex items-center justify-center gap-1.5"
            style={{ opacity: !onSemPagamentos ? 0.5 : 1 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Sem Pagamentos
          </button>
          <button className="bg-slate-900 text-white rounded-lg py-1.5 text-[10px] font-semibold shadow-sm flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            Configurações
          </button>
        </div>

        {todosCorados && (
          <div className="grid grid-cols-1 gap-2 pt-0">
            {!caixaFechado ? (
              <button
                onClick={() => setModalFechamento(true)}
                className="bg-slate-900 text-white rounded-lg py-1.5 text-[10px] font-semibold shadow-sm flex items-center justify-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                Fechar Caixa
              </button>
            ) : (
              <div className="rounded-lg py-1.5 text-[10px] font-semibold flex items-center justify-center gap-1.5" style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#16a34a" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <polyline points="4,12 9,17 20,7" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Caixa Fechado
              </div>
            )}
          </div>
        )}
      </div>

      {modalSemPag && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 13, padding: "13px 15px 12px", width: 248, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#16a34a" strokeWidth="2" /><path d="M12 7v5l3 3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Sem Pagamentos</span>
            </div>
            <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 11px", lineHeight: 1.45, paddingLeft: 34 }}>
              Registrar <strong>Sem pagamento</strong> para todos os clientes não cobrados?
            </p>
            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={() => setModalSemPag(false)} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => { onSemPagamentos?.(); setModalSemPag(false); }} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid #86efac", background: "#fff", fontSize: 11, fontWeight: 700, color: "#16a34a", cursor: "pointer" }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {modalFechamento && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 13, padding: "13px 15px 12px", width: 248, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="#dc2626" strokeWidth="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" /></svg>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Fechar Caixa</span>
            </div>
            <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 11px", lineHeight: 1.45, paddingLeft: 34 }}>
              {clientesParaCobranca === 0 ? "Nenhum cliente na lista. Confirma o fechamento?" : `Todos os ${clientesParaCobranca} clientes cobrados. Confirma o fechamento?`}
            </p>
            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={() => setModalFechamento(false)} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleFecharCaixa} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid #fca5a5", background: "#fff", fontSize: 11, fontWeight: 700, color: "#dc2626", cursor: "pointer" }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {modalRelatorio && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "stretch", justifyContent: "center" }}>
          <div style={{ background: "#f8fafc", width: "100%", maxWidth: 430, display: "flex", flexDirection: "column" }}>

            {/* Cabeçalho */}
            <div style={{ background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 12px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Relatório Diário</span>
              </div>
              <button onClick={() => { setModalRelatorio(false); onSair?.(); }} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Conteúdo rolável */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              <div id="relatorio-pdf-content">

                {/* Título */}
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#3A5F82" }}>📊 Resumo de Caixa</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{getRotaSessao()?.rota || "Rota"} · Sistema de Cobrança</div>
                </div>

                {/* Info geral */}
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 12, overflow: "hidden" }}>
                  {[
                    { l: "Status de Liquidação", v: "✓ Correto", green: true },
                    { l: "Sincronização", v: getRotaSessao()?.rota || "Rota", green: false },
                    { l: "Data", v: dataStr, green: false },
                  ].map((r, i, arr) => (
                    <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{r.l}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: r.green ? "#16a34a" : "#1e293b" }}>{r.v}</span>
                    </div>
                  ))}
                </div>

                {/* Movimentação */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6, paddingLeft: 2 }}>💰 Movimentação Financeira</div>
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    {[
                      { l: "Caixa Inicial", v: `R$ ${fmt(snap?.caixaInicial ?? caixaInicial)}` },
                      { l: "Novos Clientes", v: String(snap?.novosCount ?? novosCount) },
                      { l: "Renovação de Clientes", v: String(snap?.renovacoesCount ?? renovacoesCount) },
                      { l: "Total de Empréstimos", v: `R$ ${fmt(snap?.novosEmprestimos ?? novosEmprestimos)}` },
                      { l: "Retiradas de Caixa", v: `R$ ${fmt(snap?.retiradaCaixa ?? retiradaCaixa)}` },
                      { l: "Despesas", v: `R$ ${fmt(snap?.totalDespesas ?? totalDespesas)}` },
                      { l: "Rendimentos", v: `R$ ${fmt(snap?.totalRendimentos ?? totalRendimentos)}` },
                    ].map((r, i, arr) => (
                      <div key={r.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{r.l}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cobranças */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6, paddingLeft: 2 }}>📥 Cobranças</div>
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px" }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>Total Cobrado</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>R$ {fmt(snap?.cobrancaDiaria ?? cobrancaDiaria)}</span>
                    </div>
                  </div>
                </div>

                {/* Saldo Final */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6, paddingLeft: 2 }}>📦 Saldo Final</div>
                  <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Caixa Final</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#15803d" }}>R$ {fmt(snap?.saldo ?? saldo)}</span>
                  </div>
                </div>

                <div style={{ fontSize: 10, color: "#cbd5e1", textAlign: "center", marginTop: 8, paddingBottom: 4 }}>
                  Gerado em {hoje.toLocaleString("pt-BR")} · Sistema de Cobrança
                </div>
              </div>
            </div>

            {/* Botão */}
            <div style={{ background: "#fff", padding: "12px 16px 20px", borderTop: "1px solid #e2e8f0" }}>
              <button
                onClick={compartilharImagem}
                disabled={compartilhando}
                style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: compartilhando ? "#94a3b8" : "#25D366", color: "#fff", fontSize: 13, fontWeight: 700, cursor: compartilhando ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}
              >
                {compartilhando ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2.5" strokeDasharray="31 63" strokeLinecap="round"/></svg>
                    Gerando imagem...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.17 1.6 5.99L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.24-1.44l-.38-.22-3.67.96.98-3.58-.25-.4A9.95 9.95 0 0 1 2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm5.44-7.34c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.08-.12-.27-.2-.57-.35z" fill="#fff"/></svg>
                    Enviar pelo WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
