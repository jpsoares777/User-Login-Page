import { useState, useEffect, Fragment, type ReactNode } from "react";
import { loadDB, saveDB, getTodayStr } from "../lib/storage";
import { postPagamentoAPI, postMovimentoCaixaAPI, postFechamentoCaixaAPI, postSnapshotVivoAPI, getSaldoInicial, type DadosSnapshot } from "../lib/api";
import { ArrowLeft, Trash2 } from "lucide-react";
import { ParcelaCliente } from "./ParcelaCliente";
import { CadastroCliente } from "./CadastroCliente";
import { LancamentoFinanceiro } from "./LancamentoFinanceiro";
import { RelatorioFinanceiro } from "./RelatorioFinanceiro";
import { EmprestimosDoDia, Emprestimo, emprestimentosIniciais } from "./EmprestimosDoDia";
import { ClienteDetalhe, ClienteDetalheRenovacao, ClienteItem, Agendamento, Pagamento, MetodoPagamento, CreditoRecord } from "./ClienteDetalhe";

const clientesData: ClienteItem[] = [];

const P = {
  bg: "#F2F4F7",
  card: "#FFFFFF",
  border: "#E4E8EF",
  accent: "#3B5998",
  accentLight: "#F0F3FA",
  gold: "#F59E0B",
  goldGlow: "rgba(245,158,11,0.35)",
  emdia: "#16A34A",
  atencao: "#D97706",
  ruim: "#DC2626",
  novo: "#FFFFFF",
  textPrimary: "#1A1F2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  green: "#2E6B4F",
  shadow: "rgba(15,23,42,0.09)",
  headerTop: "#3A5F82",
  headerBot: "#4A6F8E",
};

function computeStatus(
  _parcelasPagas: number,
  _totalParcelas: number,
  creditoStartTimestamp?: number,
  _frequencia?: string,
  pagamentos?: Array<{ metodo: string; id?: number }>
): string {
  // Filtrar apenas pagamentos do ciclo de crédito atual (após renovação)
  const hist = creditoStartTimestamp
    ? (pagamentos ?? []).filter(p => p.id !== undefined ? p.id >= creditoStartTimestamp : true)
    : (pagamentos ?? []);

  // Contagem direta do histórico de pagamentos do ciclo atual
  const semCount = hist.filter(p => p.metodo === "Sem pagamento").length;
  const pagoCount = hist.filter(p => p.metodo !== "Sem pagamento").length;

  // Vermelho: 10 ou mais "Sem pagamento" no ciclo atual
  if (semCount >= 10) return "ruim";

  // Laranja: 5 ou mais "Sem pagamento" no ciclo atual
  if (semCount >= 5) return "atencao";

  // Cinza: sem histórico no ciclo atual (crédito novo ou recém renovado)
  if (pagoCount === 0 && semCount === 0) return "novo";

  // Verde: 6 ou mais pagamentos reais E nenhum "Sem pagamento" no ciclo atual
  if (pagoCount >= 6 && semCount === 0) return "emdia";

  // Cinza: ainda construindo histórico (menos de 6 pagamentos ou tem algum atraso)
  return "novo";
}

function statusColor(s: string) {
  if (s === "ruim") return P.ruim;
  if (s === "atencao") return P.atencao;
  if (s === "novo") return P.novo;
  if (s === "neutro") return "#9CA3AF";
  return P.emdia;
}

function statusBorderColor(s: string) {
  if (s === "ruim") return P.ruim;
  if (s === "atencao") return P.atencao;
  if (s === "novo") return "#9CA3AF";
  if (s === "neutro") return "#9CA3AF";
  return P.emdia;
}

function statusLabel(s: string) {
  if (s === "ruim") return "Ruim";
  if (s === "atencao") return "Atenção";
  if (s === "novo") return "Novo";
  return "Em dia";
}

function PersonBadge({ status, badge }: { status: string; badge: "plus" | "alert" }) {
  const c = statusColor(status);
  const bc = statusBorderColor(status);
  const isNovo = status === "novo";
  const badgeBg = badge === "plus" ? (isNovo ? "#9CA3AF" : c) : P.gold;
  const size = badge === "plus" ? 38 : 30;
  const fillColor = badge === "alert" ? "#1E293B" : (isNovo ? "#CBD5E1" : c);
  const fillOp = badge === "alert" ? 0.85 : (isNovo ? 0.25 : 0.15);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="18" cy="14" r="8" fill={fillColor} fillOpacity={fillOp} stroke={bc} strokeWidth="1.8" />
        <path d="M4 38 C4 28 10 24 18 24 C26 24 32 28 32 38" stroke={bc} strokeWidth="1.8" strokeLinecap="round" fill={fillColor} fillOpacity={fillOp} />
      </svg>
      <div style={{
        position: "absolute", bottom: 0, right: 0,
        width: 13, height: 13, borderRadius: "50%",
        backgroundColor: badgeBg,
        border: "2px solid #fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 1px 4px ${P.shadow}`,
      }}>
        {badge === "plus" ? (
          <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
            <line x1="4" y1="1" x2="4" y2="7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="1" y1="4" x2="7" y2="4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
            <line x1="4" y1="1.5" x2="4" y2="5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="4" cy="6.5" r="0.8" fill="#fff" />
          </svg>
        )}
      </div>
    </div>
  );
}

/* ══════════════════ TELA: LISTA DE CLIENTES ══════════════════ */
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={28} height={28}>
      <polyline points="3 6 5 6 21 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6l-1 14H6L5 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 6V4h6v2" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function criadoHoje(ts?: number): boolean {
  if (!ts) return false;
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function TelaLista({ busca, setBusca, vrf, setVrf, onSelectCliente, onAddAgendamento, ausentes, onAusentar, cobrados, onRemoverCobrado, clientesAdicionais = [], cobradosExtras = [], cobradosValores = [], pagamentosRegistro = {}, clientesBase = clientesData }: {
  busca: string; setBusca: (v: string) => void;
  vrf: boolean; setVrf: (v: boolean) => void;
  onSelectCliente: (c: typeof clientesData[0]) => void;
  onAddAgendamento: (a: Agendamento) => void;
  ausentes?: number[];
  onAusentar: (c: ClienteItem) => void;
  cobrados?: number[];
  onRemoverCobrado: (id: number) => void;
  clientesAdicionais?: ClienteItem[];
  cobradosExtras?: ClienteItem[];
  cobradosValores?: {id: number, valor: number}[];
  pagamentosRegistro?: Record<number, Pagamento[]>;
  clientesBase?: typeof clientesData;
}) {
  const [clienteDetalhe, setClienteDetalhe] = useState<ClienteItem | null>(null);
  const [openCounts, setOpenCounts] = useState<Record<number, number>>({});
  const [vrfRemovidos, setVrfRemovidos] = useState<number[]>([]);
  const [clienteParaRemover, setClienteParaRemover] = useState<ClienteItem | null>(null);
  const ausentesIds = ausentes ?? [];
  const cobradosIds = cobrados ?? [];
  const todosClientes: ClienteItem[] = [...clientesBase, ...clientesAdicionais.filter(a => !clientesBase.some(b => b.id === a.id))];
  const filtrados = todosClientes.filter((c) =>
    c.saldo > 0 &&
    (!criadoHoje(c.creditoStartTimestamp) || c.pagamentoAdiantado) &&
    !ausentesIds.includes(c.id) &&
    !(cobradosIds.includes(c.id) && !vrfRemovidos.includes(c.id)) &&
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );
  const vrfLista = [...new Set(cobradosIds)]
    .filter(id => !vrfRemovidos.includes(id))
    .map(id => todosClientes.find(c => c.id === id) ?? cobradosExtras.find(c => c.id === id)!)
    .filter(Boolean);

  /* ── MODO VRF ── */
  if (vrf) {
    return (
      <>
        <div style={{
          padding: "10px 16px 6px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: P.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
            {vrfLista.length} cobrado{vrfLista.length !== 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: 11, color: P.textMuted, fontWeight: 500 }}>
            Hoje, {new Date().toLocaleDateString("pt-BR")}
          </span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 70, paddingTop: 4, paddingLeft: 10, paddingRight: 10 }}>
          {vrfLista.map((c) => {
            const valorCobrado = cobradosValores.find(x => x.id === c.id)?.valor ?? c.parcela;
            const saldoApos = Math.max(0, c.saldo);
            const sc = statusBorderColor(computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []));
            const clienteAtualizado = { ...c, saldo: saldoApos, pagamentos: pagamentosRegistro[c.id] ?? [] };
            const expandido = clienteDetalhe?.id === c.id;

            const rowContent = (
              <>
                {/* Lixeira */}
                <button onClick={e => { e.stopPropagation(); setClienteParaRemover(c); }} style={{
                  background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
                }}>
                  <TrashIcon />
                </button>
                {/* Bonequinho */}
                <div onClick={e => { e.stopPropagation(); setClienteDetalhe(expandido ? null : clienteAtualizado); }} style={{ cursor: "pointer" }}>
                  {saldoApos <= 0 ? (
                    <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img src={import.meta.env.BASE_URL + "bloqueio.png"} alt="Quitado" style={{ width: 34, height: 34, objectFit: "contain" }} />
                    </div>
                  ) : (
                    <PersonBadge status={computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? [])} badge="plus" />
                  )}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: P.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: 0.1, lineHeight: 1.3 }}>
                      <span style={{ color: P.textMuted, fontWeight: 600, marginRight: 4 }}>{vrfLista.indexOf(c) + 1}.</span>{c.nome}
                    </span>
                    {saldoApos <= 0 && (
                      <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, color: "#fff", background: "#2563eb", borderRadius: 4, padding: "1px 5px", letterSpacing: 0.5, textTransform: "uppercase" }}>QUITADO</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: P.textSecondary }}>
                      Parcela: <strong style={{ color: P.green, fontWeight: 700 }}>R$ {valorCobrado.toFixed(2)}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: P.textSecondary }}>
                      Saldo: <strong style={{ color: saldoApos <= 0 ? "#2563eb" : P.accent, fontWeight: 700 }}>R$ {Math.max(0, saldoApos).toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
                {/* Dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  backgroundColor: computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []) === "novo" ? "#FFFFFF" : sc,
                  flexShrink: 0,
                  border: computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []) === "novo" ? "1.5px solid #9CA3AF" : "none",
                  boxShadow: computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []) === "novo" ? "none" : `0 0 0 3px ${sc}25`,
                }} />
              </>
            );

            return (
              <Fragment key={c.id}>
                {expandido ? (
                  <div style={{
                    marginBottom: 8, borderRadius: 12, border: "1.5px solid #93c5fd",
                    overflow: "hidden", boxShadow: "0 2px 10px rgba(147,197,253,0.25)",
                  }}>
                    <div style={{
                      backgroundColor: P.card, padding: "7px 12px",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      {rowContent}
                    </div>
                    <ClienteDetalhe cliente={clienteAtualizado} onClose={() => setClienteDetalhe(null)} onAddAgendamento={onAddAgendamento} />
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: P.card, marginBottom: 8, borderRadius: 12,
                    border: `1px solid ${P.border}`, padding: "7px 12px",
                    display: "flex", alignItems: "center", gap: 10,
                    boxShadow: "0 2px 6px rgba(15,23,42,0.07)",
                  }}>
                    {rowContent}
                  </div>
                )}
              </Fragment>
            );
          })}
          {vrfLista.length === 0 && (
            <div style={{ padding: 56, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: P.textMuted }}>Nenhum cliente cobrado.</div>
            </div>
          )}
        </div>

        {/* Modal confirmação excluir */}
        {clienteParaRemover && (
          <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 16px 14px", width: "100%", maxWidth: 300, boxShadow: "0 10px 40px rgba(15,23,42,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polyline points="3 6 5 6 21 6" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 6l-1 14H6L5 6" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 11v6M14 11v6" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round"/>
                    <path d="M9 6V4h6v2" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1B2236" }}>Remover da lista?</div>
              </div>
              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5, marginBottom: 14, paddingLeft: 44 }}>
                <strong style={{ color: "#334155" }}>{clienteParaRemover.nome.split(" ").slice(0, 3).join(" ")}</strong>{" "}
                será removido dos <strong style={{ color: "#dc2626" }}>cobrados de hoje</strong> e voltará para a lista.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setClienteParaRemover(null)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { onRemoverCobrado(clienteParaRemover.id); setVrfRemovidos(prev => [...prev, clienteParaRemover.id]); setClienteParaRemover(null); setClienteDetalhe(null); setVrf(false); }}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "1.5px solid #fca5a5", background: "#fff1f2", fontSize: 12, fontWeight: 600, color: "#dc2626", cursor: "pointer" }}
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ── MODO NORMAL ── */
  return (
    <>
      <div style={{
        padding: "10px 16px 6px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: P.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
          {filtrados.length} cliente{filtrados.length !== 1 ? "s" : ""}
        </span>
        {busca ? (
          <span style={{ fontSize: 11, color: P.accent, fontWeight: 600 }}>Filtrando: "{busca}"</span>
        ) : (
          <span style={{ fontSize: 11, color: P.textMuted, fontWeight: 500 }}>
            Hoje, {new Date().toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 70, paddingTop: 6, paddingLeft: 10, paddingRight: 10 }}>
        {filtrados.map((cliente, index) => {
          const sc = statusBorderColor(computeStatus(cliente.parcelasPagas ?? 0, cliente.totalParcelas ?? 1, cliente.creditoStartTimestamp, cliente.frequencia, pagamentosRegistro[cliente.id] ?? []));
          const expandido = clienteDetalhe?.id === cliente.id;
          const rowContent = (
            <>
              <div onClick={e => { e.stopPropagation(); if (expandido) { setClienteDetalhe(null); } else { setOpenCounts(prev => ({ ...prev, [cliente.id]: (prev[cliente.id] ?? 0) + 1 })); setClienteDetalhe(cliente); } }} style={{ cursor: "pointer" }}>
                <PersonBadge status={computeStatus(cliente.parcelasPagas ?? 0, cliente.totalParcelas ?? 1, cliente.creditoStartTimestamp, cliente.frequencia, pagamentosRegistro[cliente.id] ?? [])} badge="plus" />
              </div>
              <div onClick={e => { e.stopPropagation(); onAusentar(cliente); }} style={{ cursor: "pointer" }}>
                <PersonBadge status={computeStatus(cliente.parcelasPagas ?? 0, cliente.totalParcelas ?? 1, cliente.creditoStartTimestamp, cliente.frequencia, pagamentosRegistro[cliente.id] ?? [])} badge="alert" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: P.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: 0.1, lineHeight: 1.3, display: "block" }}>
                    <span style={{ color: P.textMuted, fontWeight: 600, marginRight: 4 }}>{index + 1}.</span>{cliente.nome}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: P.textSecondary }}>
                    Parcela: <strong style={{ color: P.green, fontWeight: 700 }}>R$ {cliente.parcela.toFixed(2)}</strong>
                  </span>
                  <span style={{ fontSize: 11, color: P.textSecondary }}>
                    Saldo: <strong style={{ color: P.accent, fontWeight: 700 }}>R$ {cliente.saldo.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                backgroundColor: computeStatus(cliente.parcelasPagas ?? 0, cliente.totalParcelas ?? 1, cliente.creditoStartTimestamp, cliente.frequencia, pagamentosRegistro[cliente.id] ?? []) === "novo" ? "#FFFFFF" : statusBorderColor(computeStatus(cliente.parcelasPagas ?? 0, cliente.totalParcelas ?? 1, cliente.creditoStartTimestamp, cliente.frequencia, pagamentosRegistro[cliente.id] ?? [])),
                flexShrink: 0,
                border: computeStatus(cliente.parcelasPagas ?? 0, cliente.totalParcelas ?? 1, cliente.creditoStartTimestamp, cliente.frequencia, pagamentosRegistro[cliente.id] ?? []) === "novo" ? "1.5px solid #9CA3AF" : "none",
                boxShadow: computeStatus(cliente.parcelasPagas ?? 0, cliente.totalParcelas ?? 1, cliente.creditoStartTimestamp, cliente.frequencia, pagamentosRegistro[cliente.id] ?? []) === "novo" ? "none" : `0 0 0 3px ${sc}25`,
              }} />
            </>
          );

          return (
            <Fragment key={cliente.id}>
              <div
                onClick={() => onSelectCliente(cliente)}
                style={{
                  backgroundColor: P.card, marginBottom: 8, borderRadius: 12,
                  overflow: "hidden",
                  border: expandido ? "1.5px solid #93c5fd" : `1px solid ${P.border}`,
                  boxShadow: expandido ? "0 2px 10px rgba(147,197,253,0.25)" : "0 2px 6px rgba(15,23,42,0.07)",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={!expandido ? e => { e.currentTarget.style.background = P.accentLight; } : undefined}
                onMouseLeave={!expandido ? e => { e.currentTarget.style.background = P.card; } : undefined}
              >
                <div style={{ padding: "7px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                  {rowContent}
                </div>
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    maxHeight: expandido ? "800px" : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.25s ease",
                  }}
                >
                  <ClienteDetalhe key={`${cliente.id}-${openCounts[cliente.id] ?? 0}`} cliente={{ ...cliente, pagamentos: pagamentosRegistro[cliente.id] ?? [] }} onClose={() => setClienteDetalhe(null)} onAddAgendamento={onAddAgendamento} />
                </div>
              </div>
            </Fragment>
          );
        })}
        {filtrados.length === 0 && (
          <div style={{ padding: 56, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: P.textMuted }}>Nenhum cliente encontrado.</div>
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════ TELA: ROTA ══════════════════ */
function TelaRota() {
  const [visitados, setVisitados] = useState<number[]>([]);
  const toggle = (id: number) => setVisitados(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 70, paddingTop: 4 }}>
      <div style={{ padding: "8px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: P.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
          Rota do dia — {clientesData.length} paradas
        </span>
        <span style={{ fontSize: 11, color: P.emdia, fontWeight: 600 }}>
          {visitados.length}/{clientesData.length} visitados
        </span>
      </div>
      {/* Barra de progresso */}
      <div style={{ margin: "0 16px 12px", height: 6, borderRadius: 3, backgroundColor: "#E4E8EF", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 3,
          backgroundColor: P.emdia,
          width: `${(visitados.length / clientesData.length) * 100}%`,
          transition: "width 0.3s ease",
        }} />
      </div>
      <div style={{ paddingLeft: 10, paddingRight: 10 }}>
        {clientesData.map((cliente, index) => {
          const visited = visitados.includes(cliente.id);
          return (
            <div key={cliente.id} style={{
              backgroundColor: visited ? "#F0FDF4" : P.card,
              marginBottom: 8, borderRadius: 12,
              border: `1px solid ${visited ? "#BBF7D0" : P.border}`,
              padding: "11px 14px",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 2px 6px rgba(15,23,42,0.07)",
              opacity: visited ? 0.7 : 1,
            }} onClick={() => toggle(cliente.id)}>
              {/* Número da parada */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                backgroundColor: visited ? P.emdia : P.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {visited ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <polyline points="2,7 5.5,10.5 12,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{index + 1}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: visited ? P.emdia : P.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: visited ? "line-through" : "none" }}>
                  {cliente.nome}
                </div>
                <div style={{ fontSize: 11, color: P.textSecondary, marginTop: 2 }}>
                  📍 {cliente.endereco}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: P.green }}>R$ {cliente.parcela.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: P.textMuted, marginTop: 1 }}>{statusLabel(cliente.status)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════ TELA: EMPRÉSTIMO ══════════════════ */
function TelaEmprestimo() {
  const [form, setForm] = useState({ cliente: "", valor: "", parcelas: "12", vencimento: "", observacao: "" });
  const [salvo, setSalvo] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const salvar = () => {
    if (!form.cliente || !form.valor) return;
    setSalvo(true);
    setTimeout(() => { setSalvo(false); setForm({ cliente: "", valor: "", parcelas: "12", vencimento: "", observacao: "" }); }, 2500);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    border: `1.5px solid ${P.border}`, borderRadius: 10,
    padding: "10px 13px", fontSize: 13, outline: "none",
    color: P.textPrimary, backgroundColor: P.card,
    fontFamily: "inherit", transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: P.textMuted,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, display: "block",
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80, paddingTop: 4 }}>
      <div style={{ padding: "8px 16px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: P.textPrimary, marginBottom: 2 }}>Novo Empréstimo</div>
        <div style={{ fontSize: 11, color: P.textMuted }}>Preencha os dados para registrar</div>
      </div>

      <div style={{ paddingLeft: 14, paddingRight: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Cliente</label>
          <select value={form.cliente} onChange={e => set("cliente", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
            <option value="">Selecione o cliente...</option>
            {clientesData.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Valor (R$)</label>
            <input type="number" placeholder="0,00" value={form.valor} onChange={e => set("valor", e.target.value)}
              style={inputStyle} onFocus={e => e.target.style.borderColor = P.accent} onBlur={e => e.target.style.borderColor = P.border} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Parcelas</label>
            <select value={form.parcelas} onChange={e => set("parcelas", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
              {[3, 6, 9, 12, 18, 24].map(n => <option key={n} value={n}>{n}x</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Data de Vencimento</label>
          <input type="date" value={form.vencimento} onChange={e => set("vencimento", e.target.value)}
            style={inputStyle} onFocus={e => e.target.style.borderColor = P.accent} onBlur={e => e.target.style.borderColor = P.border} />
        </div>

        <div>
          <label style={labelStyle}>Observação</label>
          <textarea placeholder="Detalhes adicionais..." value={form.observacao} onChange={e => set("observacao", e.target.value)}
            rows={3} style={{ ...inputStyle, resize: "none" as const }}
            onFocus={e => e.target.style.borderColor = P.accent} onBlur={e => e.target.style.borderColor = P.border} />
        </div>

        {/* Resumo */}
        {form.valor && (
          <div style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: P.accent, marginBottom: 6 }}>RESUMO</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: P.textSecondary, marginBottom: 4 }}>
              <span>Valor total:</span>
              <strong style={{ color: P.textPrimary }}>R$ {parseFloat(form.valor || "0").toFixed(2)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: P.textSecondary }}>
              <span>Parcela mensal:</span>
              <strong style={{ color: P.green }}>R$ {(parseFloat(form.valor || "0") / parseInt(form.parcelas)).toFixed(2)}</strong>
            </div>
          </div>
        )}

        <button onClick={salvar} style={{
          width: "100%", padding: "13px", borderRadius: 12, border: "none",
          background: salvo ? P.emdia : `linear-gradient(135deg, ${P.headerTop}, ${P.headerBot})`,
          color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
          transition: "all 0.3s", boxShadow: "0 4px 12px rgba(58,95,130,0.35)",
        }}>
          {salvo ? "✓ Empréstimo Salvo!" : "Salvar Empréstimo"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════ TELA: GASTOS ══════════════════ */
function TelaGastos() {
  const [gastos, setGastos] = useState(gastosData);
  const [novoGasto, setNovoGasto] = useState({ descricao: "", valor: "", categoria: "Transporte" });
  const [adicionando, setAdicionando] = useState(false);

  const total = gastos.reduce((s, g) => s + g.valor, 0);
  const categorias = ["Transporte", "Escritório", "Pessoal", "Serviços", "Outros"];

  const categoriaColor: Record<string, string> = {
    Transporte: "#3B82F6", Escritório: "#8B5CF6", Pessoal: "#EC4899",
    Serviços: "#F59E0B", Outros: "#6B7280",
  };

  const adicionar = () => {
    if (!novoGasto.descricao || !novoGasto.valor) return;
    const hoje = new Date().toLocaleDateString("pt-BR");
    setGastos(g => [...g, { id: Date.now(), descricao: novoGasto.descricao, valor: parseFloat(novoGasto.valor), data: hoje, categoria: novoGasto.categoria }]);
    setNovoGasto({ descricao: "", valor: "", categoria: "Transporte" });
    setAdicionando(false);
  };

  const remover = (id: number) => setGastos(g => g.filter(x => x.id !== id));

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80, paddingTop: 4 }}>
      {/* Header resumo */}
      <div style={{ margin: "8px 14px 10px", background: `linear-gradient(135deg, ${P.headerTop}, ${P.headerBot})`, borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>TOTAL DE GASTOS</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>R$ {total.toFixed(2)}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{gastos.length} registros em abril/2026</div>
      </div>

      {/* Botão adicionar */}
      <div style={{ paddingLeft: 14, paddingRight: 14, marginBottom: 10 }}>
        {!adicionando ? (
          <button onClick={() => setAdicionando(true)} style={{
            width: "100%", padding: "10px", borderRadius: 10, border: `1.5px dashed ${P.accent}`,
            backgroundColor: P.accentLight, color: P.accent, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>+ Adicionar gasto</button>
        ) : (
          <div style={{ backgroundColor: P.card, borderRadius: 12, border: `1px solid ${P.border}`, padding: "12px 14px" }}>
            <input placeholder="Descrição" value={novoGasto.descricao} onChange={e => setNovoGasto(n => ({ ...n, descricao: e.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${P.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, marginBottom: 8, outline: "none", fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="number" placeholder="Valor" value={novoGasto.valor} onChange={e => setNovoGasto(n => ({ ...n, valor: e.target.value }))}
                style={{ flex: 1, border: `1px solid ${P.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
              <select value={novoGasto.categoria} onChange={e => setNovoGasto(n => ({ ...n, categoria: e.target.value }))}
                style={{ flex: 1, border: `1px solid ${P.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, outline: "none", fontFamily: "inherit" }}>
                {categorias.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={adicionar} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", backgroundColor: P.headerTop, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
              <button onClick={() => setAdicionando(false)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${P.border}`, backgroundColor: "#fff", color: P.textSecondary, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de gastos */}
      <div style={{ paddingLeft: 10, paddingRight: 10 }}>
        {gastos.map(g => (
          <div key={g.id} style={{
            backgroundColor: P.card, marginBottom: 8, borderRadius: 12,
            border: `1px solid ${P.border}`, padding: "11px 14px",
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 2px 6px rgba(15,23,42,0.06)",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              backgroundColor: `${categoriaColor[g.categoria] || "#6B7280"}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1.5px solid ${categoriaColor[g.categoria] || "#6B7280"}40`,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: categoriaColor[g.categoria] || "#6B7280" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: P.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.descricao}</div>
              <div style={{ fontSize: 11, color: P.textMuted, marginTop: 1 }}>{g.categoria} · {g.data}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: P.ruim }}>- R$ {g.valor.toFixed(2)}</span>
              <button onClick={() => remover(g.id)} style={{
                width: 24, height: 24, borderRadius: 6, border: "none",
                backgroundColor: "#FEE2E2", color: P.ruim, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700,
              }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════ TELA: CALENDÁRIO ══════════════════ */
function TelaCalendario({ agendamentos }: { agendamentos: Agendamento[] }) {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());

  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  // Dias com agendamentos do usuário (parse direto da string YYYY-MM-DD para evitar fuso)
  const diasAgendamento: Record<number, Agendamento[]> = {};
  agendamentos.forEach(a => {
    const [aAno, aMes, aDia] = a.data.split("-").map(Number);
    if ((aMes - 1) === mes && aAno === ano) {
      if (!diasAgendamento[aDia]) diasAgendamento[aDia] = [];
      diasAgendamento[aDia].push(a);
    }
  });

  const prevMes = () => { if (mes === 0) { setMes(11); setAno(y => y - 1); } else setMes(m => m - 1); };
  const nextMes = () => { if (mes === 11) { setMes(0); setAno(y => y + 1); } else setMes(m => m + 1); };

  const cells: (number | null)[] = [...Array(primeiroDia).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)];

  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const agendamentosDia = diaSelecionado ? (diasAgendamento[diaSelecionado] || []) : [];

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80, paddingTop: 4 }}>
      {/* Navegação mês */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
        <button onClick={prevMes} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${P.border}`, backgroundColor: P.card, cursor: "pointer", fontSize: 16, color: P.textSecondary }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: P.textPrimary }}>{meses[mes]} {ano}</span>
        <button onClick={nextMes} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${P.border}`, backgroundColor: P.card, cursor: "pointer", fontSize: 16, color: P.textSecondary }}>›</button>
      </div>

      {/* Grade dias semana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, padding: "0 12px", marginBottom: 4 }}>
        {diasSemana.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: P.textMuted, padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Grade dias */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, padding: "0 12px" }}>
        {cells.map((dia, i) => {
          if (!dia) return <div key={i} />;
          const temAgendamento = !!diasAgendamento[dia];
          const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
          const isSelecionado = dia === diaSelecionado;

          return (
            <div key={i} onClick={() => setDiaSelecionado(temAgendamento ? (isSelecionado ? null : dia) : null)} style={{
              aspectRatio: "1", borderRadius: 8, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", cursor: temAgendamento ? "pointer" : "default",
              backgroundColor: isSelecionado ? P.headerTop : isHoje ? "#EFF6FF" : temAgendamento ? "#EFF6FF" : "transparent",
              border: isHoje ? `2px solid ${P.accent}` : isSelecionado ? `2px solid ${P.headerTop}` : temAgendamento ? `1px solid #bfdbfe` : "none",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 12, fontWeight: isHoje || isSelecionado ? 800 : 500, color: isSelecionado ? "#fff" : isHoje ? P.accent : P.textPrimary }}>
                {dia}
              </span>
              {temAgendamento && (
                <div style={{ width: 4, height: 4, borderRadius: "50%", marginTop: 2, backgroundColor: isSelecionado ? "rgba(255,255,255,0.8)" : "#2563EB" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Agendamentos do dia selecionado */}
      {diaSelecionado && agendamentosDia.length > 0 && (
        <div style={{ margin: "14px 12px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
            Agendamentos — dia {diaSelecionado}
          </div>
          {agendamentosDia.map(a => (
            <div key={a.id} style={{
              backgroundColor: "#EFF6FF", borderRadius: 10, border: "1px solid #bfdbfe",
              padding: "9px 14px", marginBottom: 6,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" width={14} height={14}>
                  <rect x="3" y="4" width="18" height="18" rx="3" stroke="#fff" strokeWidth="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1E3A8A" }}>{a.hora} — {a.nomeCliente || "Cliente"}</div>
                <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 1 }}>{a.observacao}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {diaSelecionado && agendamentosDia.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: P.textMuted, fontSize: 12 }}>Sem agendamentos neste dia</div>
      )}
    </div>
  );
}

/* ══════════════════ MODAL: GRÁFICO / DASHBOARD ══════════════════ */
function ModalGrafico({ onClose }: { onClose: () => void }) {
  const totalSaldo = clientesData.reduce((s, c) => s + c.saldo, 0);
  const totalParcelas = clientesData.reduce((s, c) => s + c.parcela, 0);
  const emdia = clientesData.filter(c => c.status === "emdia").length;
  const atencao = clientesData.filter(c => c.status === "atencao").length;
  const ruim = clientesData.filter(c => c.status === "ruim").length;
  const novo = clientesData.filter(c => c.status === "novo").length;
  const total = clientesData.length;

  const stats = [
    { label: "Em dia", count: emdia, color: P.emdia, pct: Math.round((emdia / total) * 100) },
    { label: "Atenção", count: atencao, color: P.atencao, pct: Math.round((atencao / total) * 100) },
    { label: "Ruim", count: ruim, color: P.ruim, pct: Math.round((ruim / total) * 100) },
    { label: "Novo", count: novo, color: "#9CA3AF", pct: Math.round((novo / total) * 100) },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15,23,42,0.5)", zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ backgroundColor: P.bg, borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: P.textPrimary }}>Dashboard</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${P.border}`, backgroundColor: P.card, cursor: "pointer", fontSize: 16, color: P.textSecondary }}>×</button>
        </div>
        {/* Cards de totais */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Saldo Total", value: `R$ ${totalSaldo.toFixed(0)}`, color: P.accent },
            { label: "Receber/mês", value: `R$ ${totalParcelas.toFixed(0)}`, color: P.emdia },
          ].map((card, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: P.card, borderRadius: 12, padding: "12px 14px", border: `1px solid ${P.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
        {/* Status dos clientes */}
        <div style={{ backgroundColor: P.card, borderRadius: 12, padding: "14px", border: `1px solid ${P.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: P.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Status dos Clientes</div>
          {stats.map(s => (
            <div key={s.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: P.textPrimary }}>{s.label}</span>
                <span style={{ color: P.textMuted }}>{s.count} ({s.pct}%)</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, backgroundColor: "#E4E8EF", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, backgroundColor: s.color, width: `${s.pct}%`, transition: "width 0.5s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ MODAL: MENU ══════════════════ */
/* ── sub-páginas do menu ─────────────────────────────── */
type LancamentoItem = { id: number; data: string; categoria: string; valor: number; observacao?: string };

const despesasIniciais: LancamentoItem[] = [];

function RelatorioDespesas({ onVoltar, despesas = [], onDelete }: { onVoltar: () => void; despesas?: LancamentoItem[]; onDelete?: (id: number) => void }) {
  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
  const [aberto, setAberto] = useState<number | null>(null);
  return (
    <div style={{ fontFamily: "Roboto, sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(160deg, #3A5F82 0%, #4A6F8E 100%)", padding: "16px 16px 14px", boxShadow: "0 4px 20px rgba(15,23,42,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 42, height: 42, background: "linear-gradient(145deg, #B91C1C, #EF4444)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(185,28,28,0.5)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>MN</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 1.2, whiteSpace: "nowrap" }}>Gerenciamento de Despesas</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2 }}>Sistema de Cobrança</div>
          </div>
        </div>
        <button onClick={onVoltar} style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 10, cursor: "pointer", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ backgroundColor: "white", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ display: "flex", padding: "10px 12px", backgroundColor: "#EEEEEE", fontSize: 12, fontWeight: 600, color: "#616161" }}>
            <span style={{ flex: 2 }}>Categoria</span>
            <span style={{ flex: 1, textAlign: "center" }}>Data</span>
            <span style={{ flex: 1, textAlign: "right" }}>Valor</span>
            <span style={{ width: 28 }} />
          </div>
          {despesas.map((d, i) => {
            const expandido = aberto === d.id;
            return (
              <div key={d.id}>
                <div style={{ display: "flex", alignItems: "center", padding: "5px 12px", fontSize: 12, backgroundColor: expandido ? "#FFF8F8" : "white" }}>
                  <span onClick={() => setAberto(expandido ? null : d.id)} style={{ flex: 2, color: "#212121", cursor: "pointer" }}>{d.categoria}</span>
                  <span onClick={() => setAberto(expandido ? null : d.id)} style={{ flex: 1, textAlign: "center", color: "#757575", fontSize: 12, cursor: "pointer" }}>{d.data}</span>
                  <span onClick={() => setAberto(expandido ? null : d.id)} style={{ flex: 1, textAlign: "right", color: "#C62828", fontWeight: 500, cursor: "pointer" }}>R$ {d.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  <button onClick={() => { if (confirm("Excluir esta despesa?")) { onDelete?.(d.id); if (aberto === d.id) setAberto(null); } }}
                    style={{ width: 28, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 5, cursor: "pointer", color: "#C62828", flexShrink: 0, marginLeft: 10 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {expandido && (
                  <div style={{ padding: "6px 12px 10px 12px", backgroundColor: "#FFF8F8", borderTop: "1px dashed #FFCDD2" }}>
                    {d.observacao
                      ? <span style={{ fontSize: 12, color: "#555", fontStyle: "italic" }}>📝 {d.observacao}</span>
                      : <span style={{ fontSize: 12, color: "#BDBDBD", fontStyle: "italic" }}>Sem observação</span>}
                  </div>
                )}
                {i < despesas.length - 1 && <div style={{ height: 1, backgroundColor: "#F0F0F0" }} />}
              </div>
            );
          })}
          <div style={{ display: "flex", padding: "10px 12px", borderTop: "1px solid #DDD", backgroundColor: "#FAFAFA" }}>
            <span style={{ flex: 2, fontWeight: 600, color: "#424242", fontSize: 13 }}>Total</span>
            <span style={{ flex: 2, textAlign: "right", fontWeight: 700, color: "#C62828", fontSize: 14 }}>R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const rendimentosIniciais: LancamentoItem[] = [];

function RelatorioRendimentos({ onVoltar, rendimentos = [], onDelete }: { onVoltar: () => void; rendimentos?: LancamentoItem[]; onDelete?: (id: number) => void }) {
  const totalRendimentos = rendimentos.reduce((s, r) => s + r.valor, 0);
  const [aberto, setAberto] = useState<number | null>(null);
  return (
    <div style={{ fontFamily: "Roboto, sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(160deg, #3A5F82 0%, #4A6F8E 100%)", padding: "16px 16px 14px", boxShadow: "0 4px 20px rgba(15,23,42,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 42, height: 42, background: "linear-gradient(145deg, #B91C1C, #EF4444)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(185,28,28,0.5)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>MN</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.3, lineHeight: 1.2, whiteSpace: "nowrap" }}>Gerenciamento de Rendimentos</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2 }}>Sistema de Cobrança</div>
          </div>
        </div>
        <button onClick={onVoltar} style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 10, cursor: "pointer", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ backgroundColor: "white", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ display: "flex", padding: "10px 12px", backgroundColor: "#EEEEEE", fontSize: 12, fontWeight: 600, color: "#616161" }}>
            <span style={{ flex: 2 }}>Categoria</span>
            <span style={{ flex: 1, textAlign: "center" }}>Data</span>
            <span style={{ flex: 1, textAlign: "right" }}>Valor</span>
            <span style={{ width: 28 }} />
          </div>
          {rendimentos.map((r, i) => {
            const expandido = aberto === r.id;
            return (
              <div key={r.id}>
                <div style={{ display: "flex", alignItems: "center", padding: "5px 12px", fontSize: 12, backgroundColor: expandido ? "#F1F8E9" : "white" }}>
                  <span onClick={() => setAberto(expandido ? null : r.id)} style={{ flex: 2, color: "#212121", cursor: "pointer" }}>{r.categoria}</span>
                  <span onClick={() => setAberto(expandido ? null : r.id)} style={{ flex: 1, textAlign: "center", color: "#757575", fontSize: 12, cursor: "pointer" }}>{r.data}</span>
                  <span onClick={() => setAberto(expandido ? null : r.id)} style={{ flex: 1, textAlign: "right", color: "#2E7D32", fontWeight: 500, cursor: "pointer" }}>R$ {r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  <button onClick={() => { if (confirm("Excluir este rendimento?")) { onDelete?.(r.id); if (aberto === r.id) setAberto(null); } }}
                    style={{ width: 28, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F8E9", border: "1px solid #C8E6C9", borderRadius: 5, cursor: "pointer", color: "#2E7D32", flexShrink: 0, marginLeft: 10 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {expandido && (
                  <div style={{ padding: "6px 12px 10px 12px", backgroundColor: "#F1F8E9", borderTop: "1px dashed #C8E6C9" }}>
                    {r.observacao
                      ? <span style={{ fontSize: 12, color: "#555", fontStyle: "italic" }}>📝 {r.observacao}</span>
                      : <span style={{ fontSize: 12, color: "#BDBDBD", fontStyle: "italic" }}>Sem observação</span>}
                  </div>
                )}
                {i < rendimentos.length - 1 && <div style={{ height: 1, backgroundColor: "#F0F0F0" }} />}
              </div>
            );
          })}
          <div style={{ display: "flex", padding: "10px 12px", borderTop: "1px solid #DDD", backgroundColor: "#FAFAFA" }}>
            <span style={{ flex: 2, fontWeight: 600, color: "#424242", fontSize: 13 }}>Total</span>
            <span style={{ flex: 2, textAlign: "right", fontWeight: 700, color: "#2E7D32", fontSize: 14 }}>R$ {totalRendimentos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── renovação de clientes ────────────────────────────── */
const clientesInativos = clientesData.filter(c => c.status !== "emdia");

function RenovacaoClientes({ onBack, onAddAgendamento, onRenovar, clientesQuitados = [], todosClientes = [] }: { onBack: () => void; onAddAgendamento: (a: Agendamento) => void; onRenovar: (c: ClienteItem) => void; clientesQuitados?: ClienteItem[]; todosClientes?: ClienteItem[] }) {
  const vistos = new Set<number>();
  const base = [
    ...todosClientes,
    ...clientesQuitados,
    ...clientesInativos,
  ].filter(c => { if (vistos.has(c.id)) return false; vistos.add(c.id); return true; });
  const filtrados = base;
  const [clienteExpandido, setClienteExpandido] = useState<typeof clientesData[0] | null>(null);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", backgroundColor: "#F2F4F7" }}>
      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12, paddingTop: 4, paddingLeft: 10, paddingRight: 10 }}>
        {filtrados.length === 0 && (
          <div style={{ padding: 56, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: P.textMuted }}>Nenhum cliente encontrado.</div>
          </div>
        )}
        {filtrados.map((c, index) => {
          const expandido = clienteExpandido?.id === c.id;
          const cardRow = (
            <div style={{
              backgroundColor: P.card, padding: "11px 14px 11px 12px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div
                onClick={e => { e.stopPropagation(); setClienteExpandido(expandido ? null : c); }}
                style={{ position: "relative", width: 38, height: 38, flexShrink: 0, cursor: "pointer" }}
              >
                <svg width={38} height={38} viewBox="0 0 40 40" fill="none">
                  <circle cx="18" cy="14" r="8" fill="#9CA3AF" fillOpacity={0.15} stroke="#9CA3AF" strokeWidth="1.8" />
                  <path d="M4 38 C4 28 10 24 18 24 C26 24 32 28 32 38" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" fill="#9CA3AF" fillOpacity={0.15} />
                </svg>
                <div style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 13, height: 13, borderRadius: "50%",
                  backgroundColor: P.emdia,
                  border: "2px solid #fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 1px 4px ${P.shadow}`,
                }}>
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                    <line x1="4" y1="1" x2="4" y2="7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="1" y1="4" x2="7" y2="4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div
                onClick={e => { e.stopPropagation(); onRenovar(c); }}
                style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#2563EB", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: 0.1, lineHeight: 1.3, display: "block", textDecorationLine: "underline", textDecorationStyle: "dotted" }}>
                  {c.nome}
                </span>
                <span style={{ fontSize: 11, color: P.textSecondary }}>
                  Valor: <strong style={{ fontWeight: 700 }}>R$ {(c.parcela * c.totalParcelas).toFixed(2)}</strong>
                </span>
              </div>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                backgroundColor: "#9CA3AF",
                flexShrink: 0,
                boxShadow: "0 0 0 3px #9CA3AF25",
              }} />
            </div>
          );

          return expandido ? (
            <div key={c.id} style={{
              marginBottom: 8, borderRadius: 12,
              border: "1.5px solid #93c5fd",
              overflow: "hidden",
              boxShadow: "0 2px 10px rgba(147,197,253,0.25)",
            }}>
              {cardRow}
              <ClienteDetalheRenovacao cliente={c} onClose={() => setClienteExpandido(null)} onAddAgendamento={onAddAgendamento} />
            </div>
          ) : (
            <div key={c.id} style={{
              backgroundColor: P.card, marginBottom: 8, borderRadius: 12,
              border: `1px solid ${P.border}`,
              boxShadow: "0 2px 6px rgba(15,23,42,0.07)",
              overflow: "hidden",
            }}>
              {cardRow}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── sincronizar / reordenar clientes ───────────────── */
function SincronizarClientes({ onBack, salvo, ordemInicial, onOrdemChange }: { onBack: () => void; salvo: boolean; ordemInicial?: number[]; onOrdemChange: (ordem: number[]) => void }) {
  const [ordem, setOrdem] = useState<number[]>(ordemInicial ?? clientesData.map(c => c.id));
  const [busca, setBusca] = useState("");

  const listaFiltrada = ordem
    .map(id => clientesData.find(c => c.id === id)!)
    .filter(c => c && c.nome.toLowerCase().includes(busca.toLowerCase()));

  const moveUp = (id: number) => {
    const idx = ordem.indexOf(id);
    if (idx <= 0) return;
    const next = [...ordem];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setOrdem(next);
    onOrdemChange(next);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f5f5f5", overflowY: "hidden" }}>
      {/* Barra de busca */}
      <div style={{ padding: "10px 12px 8px", background: "#fff", borderBottom: "1px solid #e4e8ef", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#94a3b8" strokeWidth="1.4" />
            <path d="M10 10l2 2" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Procurar cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 10px 7px 30px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#334155" }}
          />
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
        {listaFiltrada.map(c => {
          const globalIdx = ordem.indexOf(c.id);
          const isFirst = globalIdx === 0;
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "6px 12px", borderBottom: "1px solid #eeeeee", background: "#fff", marginBottom: 1 }}>
              {/* Seta para cima */}
              <button
                onClick={() => moveUp(c.id)}
                disabled={isFirst}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: isFirst ? "#e0e0e0" : "#43A047",
                  border: "none", cursor: isFirst ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginRight: 8, flexShrink: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 19V5M5 12l7-7 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {/* Número */}
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                border: "1.5px solid #D4AF37", background: "#FFFDE7",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#5D4037",
                flexShrink: 0, marginRight: 6,
              }}>
                {globalIdx + 1}
              </div>
              {/* Ícone seta direita */}
              <span style={{ marginRight: 6, color: "#9e9e9e", fontSize: 13, flexShrink: 0 }}>➜</span>
              {/* Nome */}
              <span style={{ fontSize: 13, fontWeight: 500, color: "#212121", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.nome}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── empréstimos em outras datas ────────────────────── */
const outrasDatasData = clientesData.map((c, i) => ({
  ...c,
  frequencia: (i % 3 === 0 ? "Semanal" : "Mensal") as "Semanal" | "Mensal",
  parcelaOutra: parseFloat((c.parcela * (i % 3 === 0 ? 3.5 : 14)).toFixed(2)),
  saldoOutra: parseFloat((c.saldo * 1.1).toFixed(2)),
}));

function EmprestimosOutrasDatas({ onAddAgendamento, onSelectCliente, novosClientes = [], pagamentosRegistro = {} }: { onAddAgendamento: (a: Agendamento) => void; onSelectCliente: (c: ClienteItem) => void; novosClientes?: ClienteItem[]; pagamentosRegistro?: Record<number, Pagamento[]> }) {
  const [busca, setBusca] = useState("");
  const [clienteDetalhe, setClienteDetalhe] = useState<ClienteItem | null>(null);
  const todosOutras = [
    ...novosClientes.map(c => ({ ...c, frequencia: (c.frequencia ?? "Semanal") as "Semanal" | "Mensal", parcelaOutra: c.parcela, saldoOutra: c.saldo })),
    ...outrasDatasData,
  ];
  const filtrados = todosOutras.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      {/* Barra de busca */}
      <div style={{ backgroundColor: P.bg, padding: "10px 14px 8px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, borderBottom: `1px solid ${P.border}` }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#94a3b8" strokeWidth="1.4" />
            <path d="M10 10l2 2" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Procurar cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: "100%", border: `1.5px solid ${P.border}`, borderRadius: 9, padding: "8px 10px 8px 30px", fontSize: 13, outline: "none", boxSizing: "border-box", color: P.textPrimary, backgroundColor: "#fff" }}
          />
        </div>
      </div>

      {/* Contagem */}
      <div style={{ padding: "10px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: P.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
          {filtrados.length} cliente{filtrados.length !== 1 ? "s" : ""}
        </span>
        <span style={{ fontSize: 11, color: P.textMuted, fontWeight: 500 }}>Mensal · Semanal</span>
      </div>

      {/* Lista — idêntica ao TelaLista modo normal */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 70, paddingTop: 6, paddingLeft: 10, paddingRight: 10 }}>
        {filtrados.map((c, idx) => {
          const sc = statusBorderColor(computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []));
          const expandido = clienteDetalhe?.id === c.id;
          const clienteView: ClienteItem = { ...c, parcela: c.parcelaOutra, saldo: c.saldoOutra };

          const rowContent = (
            <>
              <div onClick={e => { e.stopPropagation(); setClienteDetalhe(expandido ? null : clienteView); }} style={{ cursor: "pointer" }}>
                <PersonBadge status={computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? [])} badge="plus" />
              </div>
              <PersonBadge status={computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? [])} badge="alert" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: P.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: 0.1, lineHeight: 1.3, display: "block" }}>
                    <span style={{ color: P.textMuted, fontWeight: 600, marginRight: 4 }}>{idx + 1}.</span>{c.nome}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: P.textSecondary }}>
                    Parcela: <strong style={{ color: P.green, fontWeight: 700 }}>R$ {c.parcelaOutra.toFixed(2)}</strong>
                  </span>
                  <span style={{ fontSize: 11, color: P.textSecondary }}>
                    Saldo: <strong style={{ color: P.accent, fontWeight: 700 }}>R$ {c.saldoOutra.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                backgroundColor: computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []) === "novo" ? "#FFFFFF" : statusBorderColor(computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? [])),
                flexShrink: 0,
                border: computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []) === "novo" ? "1.5px solid #9CA3AF" : "none",
                boxShadow: computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []) === "novo" ? "none" : `0 0 0 3px ${sc}25`,
              }} />
            </>
          );

          return (
            <Fragment key={c.id}>
              {expandido ? (
                <div style={{ marginBottom: 8, borderRadius: 12, border: "1.5px solid #93c5fd", overflow: "hidden", boxShadow: "0 2px 10px rgba(147,197,253,0.25)" }}>
                  <div onClick={() => onSelectCliente(clienteView)} style={{ backgroundColor: P.card, padding: "7px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    {rowContent}
                  </div>
                  <ClienteDetalhe cliente={clienteView} onClose={() => setClienteDetalhe(null)} onAddAgendamento={onAddAgendamento} />
                </div>
              ) : (
                <div onClick={() => onSelectCliente(clienteView)} style={{
                  backgroundColor: P.card, marginBottom: 8, borderRadius: 12,
                  border: `1px solid ${P.border}`, padding: "7px 12px",
                  display: "flex", alignItems: "center", gap: 10,
                  cursor: "pointer", transition: "all 0.15s",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.07)",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = P.accentLight; e.currentTarget.style.boxShadow = "0 4px 14px rgba(15,23,42,0.13)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = P.card; e.currentTarget.style.boxShadow = "0 2px 6px rgba(15,23,42,0.07)"; }}
                >
                  {rowContent}
                </div>
              )}
            </Fragment>
          );
        })}
        {filtrados.length === 0 && (
          <div style={{ padding: 56, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: P.textMuted }}>Nenhum cliente encontrado.</div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── menu lateral ────────────────────────────────────── */
type FlatItem = { id: number; label: string; color: string; icon: ReactNode; action?: "despesas" | "rendimentos"; isSair?: boolean; isRelatorio?: boolean; isEmprestimos?: boolean; isRenovacao?: boolean; isSincronizar?: boolean; isOutrasDatas?: boolean };

const flatItems: FlatItem[] = [
  { id: 1,  label: "Relatório diário",            color: "#2E7D32", icon: <img src={import.meta.env.BASE_URL + "icons/icone-relatorio-diario.png"} width={24} height={24} style={{ objectFit: "contain" }} />, isRelatorio: true },
  { id: 2,  label: "Novos empréstimos",           color: "#1565C0", icon: <img src={import.meta.env.BASE_URL + "icons/icone-novos-emprestimos.png"} width={24} height={24} style={{ objectFit: "contain" }} />, isEmprestimos: true },
  { id: 3,  label: "Gerenciamento de despesas",   color: "#388E3C", icon: <img src={import.meta.env.BASE_URL + "icons/icone-gerenc-despesas.png"} width={24} height={24} style={{ objectFit: "contain" }} />, action: "despesas" },
  { id: 4,  label: "Gerenciamento de rendimentos",color: "#1B5E20", icon: <img src={import.meta.env.BASE_URL + "icons/icone-gerenc-rendimentos.png"} width={24} height={24} style={{ objectFit: "contain" }} />, action: "rendimentos" },
  { id: 5,  label: "Renovação de empréstimos",    color: "#F57C00", icon: <img src={import.meta.env.BASE_URL + "icons/icone-renovacao.png"} width={24} height={24} style={{ objectFit: "contain" }} />, isRenovacao: true },
  { id: 6,  label: "Sincronizar",                 color: "#0288D1", icon: <img src={import.meta.env.BASE_URL + "icons/icone-sincronizar.png"} width={24} height={24} style={{ objectFit: "contain" }} />, isSincronizar: true },
  { id: 7,  label: "Empréstimo de outras datas",  color: "#5C6BC0", icon: <img src={import.meta.env.BASE_URL + "icons/icone-outras-datas.png"} width={26} height={26} style={{ objectFit: "contain" }} />, isOutrasDatas: true },
  { id: 9,  label: "Clientes ausentes",           color: "#6D4C41", icon: <img src={import.meta.env.BASE_URL + "icons/icone-clientes-ausentes.png"} width={28} height={28} style={{ objectFit: "contain" }} /> },
  { id: 12, label: "Sair",                        color: "#C62828", icon: <img src={import.meta.env.BASE_URL + "icons/icone-sair.png"} width={24} height={24} style={{ objectFit: "contain" }} />, isSair: true },
];

function ClientesAusentes({ ausentes, onReativar, onAddAgendamento, onSelectCliente, clientesBase = clientesData, pagamentosRegistro = {} }: { ausentes: number[]; onReativar: (id: number) => void; onAddAgendamento: (a: Agendamento) => void; onSelectCliente: (c: ClienteItem) => void; clientesBase?: typeof clientesData; pagamentosRegistro?: Record<number, Pagamento[]> }) {
  const [busca, setBusca] = useState("");
  const [clienteDetalhe, setClienteDetalhe] = useState<ClienteItem | null>(null);
  const lista = clientesBase.filter(c => ausentes.includes(c.id) && c.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <>
      {/* Barra de busca */}
      <div style={{ backgroundColor: P.bg, padding: "10px 14px 8px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, borderBottom: `1px solid ${P.border}` }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#94a3b8" strokeWidth="1.4" />
            <path d="M10 10l2 2" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Procurar cliente ausente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: "100%", border: `1.5px solid ${P.border}`, borderRadius: 9, padding: "8px 10px 8px 30px", fontSize: 13, outline: "none", boxSizing: "border-box", color: P.textPrimary, backgroundColor: "#fff" }}
          />
        </div>
      </div>

      {/* Contagem */}
      <div style={{ padding: "10px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: P.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
          {lista.length} ausente{lista.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 70, paddingTop: 6, paddingLeft: 10, paddingRight: 10 }}>
        {lista.length === 0 && (
          <div style={{ padding: 56, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🏠</div>
            <div style={{ fontSize: 13, color: P.textMuted, fontWeight: 600 }}>Nenhum cliente ausente</div>
            <div style={{ fontSize: 11, color: P.textMuted, marginTop: 4 }}>Clientes marcados como ausentes aparecerão aqui.</div>
          </div>
        )}
        {lista.map((c, idx) => {
          const sc = statusBorderColor(computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []));
          const isOpen = clienteDetalhe?.id === c.id;
          return (
            <div key={c.id} style={{
              backgroundColor: P.card, marginBottom: 8, borderRadius: 12,
              border: isOpen ? "1.5px solid #3b82f6" : `1px solid ${P.border}`,
              boxShadow: isOpen ? "0 0 0 3px rgba(59,130,246,0.12), 0 4px 14px rgba(15,23,42,0.13)" : "0 2px 6px rgba(15,23,42,0.07)",
              transition: "all 0.15s", overflow: "hidden",
            }}>
              {/* Linha principal */}
              <div style={{ padding: "7px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                onClick={() => onSelectCliente(c)}
                onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.background = P.accentLight; } }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <div onClick={e => { e.stopPropagation(); setClienteDetalhe(isOpen ? null : c); }} style={{ cursor: "pointer" }} title="Ver detalhes">
                  <PersonBadge status={computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? [])} badge="plus" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: 3 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: P.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: 0.1, lineHeight: 1.3, display: "block" }}>
                      <span style={{ color: P.textMuted, fontWeight: 600, marginRight: 4 }}>{idx + 1}.</span>{c.nome}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: P.textSecondary }}>
                      Parcela: <strong style={{ color: P.green, fontWeight: 700 }}>R$ {c.parcela.toFixed(2)}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: P.textSecondary }}>
                      Saldo: <strong style={{ color: P.accent, fontWeight: 700 }}>R$ {c.saldo.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  backgroundColor: computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []) === "novo" ? "#FFFFFF" : statusBorderColor(computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? [])),
                  flexShrink: 0,
                  border: computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []) === "novo" ? "1.5px solid #9CA3AF" : "none",
                  boxShadow: computeStatus(c.parcelasPagas ?? 0, c.totalParcelas ?? 1, c.creditoStartTimestamp, c.frequencia, pagamentosRegistro[c.id] ?? []) === "novo" ? "none" : `0 0 0 3px ${sc}25`,
                }} />
              </div>
              {/* Painel de detalhe (mesmo que a lista principal) */}
              {isOpen && (
                <div style={{ borderTop: "1px solid #e0edff", background: "#f0f6ff", padding: "12px 14px 14px" }}>
                  <ClienteDetalhe cliente={c} onAddAgendamento={onAddAgendamento} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ModalMenu({ onClose, onRelatorio, onEmprestimos, onRenovacao, onSincronizar, onOutrasDatas, onAusentes, onSair, despesas, rendimentos, onDeleteDespesa, onDeleteRendimento }: { onClose: () => void; onRelatorio: () => void; onEmprestimos: () => void; onRenovacao: () => void; onSincronizar: () => void; onOutrasDatas: () => void; onAusentes: () => void; onSair: () => void; despesas: LancamentoItem[]; rendimentos: LancamentoItem[]; onDeleteDespesa: (id: number) => void; onDeleteRendimento: (id: number) => void }) {
  const [page, setPage] = useState<"menu" | "despesas" | "rendimentos">("menu");

  if (page === "despesas") {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 50, backgroundColor: "#f5f5f5", overflowY: "auto" }}>
        <RelatorioDespesas onVoltar={() => setPage("menu")} despesas={despesas} onDelete={onDeleteDespesa} />
      </div>
    );
  }
  if (page === "rendimentos") {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 50, backgroundColor: "#f5f5f5", overflowY: "auto" }}>
        <RelatorioRendimentos onVoltar={() => setPage("menu")} rendimentos={rendimentos} onDelete={onDeleteRendimento} />
      </div>
    );
  }

  return (
    <>
      {/* Backdrop transparente — fecha ao tocar fora */}
      <div style={{ position: "absolute", inset: 0, zIndex: 49 }} onClick={onClose} />

      {/* Painel flutuante abaixo do cabeçalho */}
      <div
        style={{
          position: "absolute", top: 14, right: 8, zIndex: 50,
          width: "58%", backgroundColor: "#fff",
          borderRadius: 10, overflow: "hidden",
          boxShadow: "0 6px 24px rgba(0,0,0,0.22)",
        }}
      >
        {flatItems.map((item, i) => (
          <Fragment key={item.id}>
            <button
              onClick={() => { if (item.isRelatorio) { onRelatorio(); onClose(); } else if (item.isEmprestimos) { onEmprestimos(); onClose(); } else if (item.isRenovacao) { onRenovacao(); onClose(); } else if (item.isSincronizar) { onSincronizar(); onClose(); } else if (item.isOutrasDatas) { onOutrasDatas(); onClose(); } else if (item.id === 9) { onAusentes(); onClose(); } else if (item.action) setPage(item.action); else if (item.isSair) { onClose(); onSair(); } }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 12px", border: "none", backgroundColor: "transparent",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: item.color }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 13, color: item.isSair ? "#C62828" : "#212121", fontFamily: "Roboto, sans-serif" }}>
                {item.label}
              </span>
            </button>
            {i < flatItems.length - 1 && <div style={{ height: 1, backgroundColor: "#EEEEEE" }} />}
          </Fragment>
        ))}
      </div>
    </>
  );
}

/* ══════════════════ APP PRINCIPAL ══════════════════ */
export function ListaClientes({ onSair, cobradorId = 0 }: { onSair?: () => void; cobradorId?: number }) {
  const [busca, setBusca] = useState("");
  const [vrf, setVrf] = useState(false);
  const [activeNav, setActiveNav] = useState(0);
  const [modal, setModal] = useState<"menu" | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<typeof clientesData[0] | null>(null);
  const [verRelatorio, setVerRelatorio] = useState(false);
  const [caixaFechadoHoje, setCaixaFechadoHoje] = useState(false);
  const [verEmprestimentos, setVerEmprestimentos] = useState(false);
  const [verRenovacao, setVerRenovacao] = useState(false);
  const [verSincronizar, setVerSincronizar] = useState(false);
  const [verOutrasDatas, setVerOutrasDatas] = useState(false);
  const [verAusentes, setVerAusentes] = useState(false);
  const [ausentes, setAusentes] = useState<number[]>(() => {
    const db = loadDB(); const hoje = getTodayStr();
    return (db && db.lastDate === hoje) ? (db.ausentes ?? []) : [];
  });
  const [cobrados, setCobrados] = useState<number[]>(() => {
    const db = loadDB(); const hoje = getTodayStr();
    return (db && db.lastDate === hoje) ? (db.cobrados ?? []) : [];
  });
  const [cobradosValores, setCobradosValores] = useState<{id: number, valor: number}[]>(() => {
    const db = loadDB(); const hoje = getTodayStr();
    return (db && db.lastDate === hoje) ? (db.cobradosValores ?? []) : [];
  });
  const [registroPagamentos, setRegistroPagamentos] = useState<Record<number, Pagamento[]>>(() => {
    const db = loadDB();
    return (db?.registroPagamentos as Record<number, Pagamento[]>) ?? {};
  });
  const [historicoPagamentos, setHistoricoPagamentos] = useState<Record<number, Pagamento[]>>(() => {
    const db = loadDB();
    return (db?.historicoPagamentos as Record<number, Pagamento[]>) ?? {};
  });
  const [quitadosClientes, setQuitadosClientes] = useState<ClienteItem[]>(() => {
    const db = loadDB();
    return (db?.quitadosClientes as ClienteItem[]) ?? [];
  });
  const [clientes, setClientes] = useState<typeof clientesData>(() => {
    const db = loadDB();
    const raw = (db?.clientes as typeof clientesData)?.length ? (db!.clientes as typeof clientesData) : clientesData;
    const deduped = raw.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
    return deduped.map(c => ({ ...c, saldo: c.parcela * (c.totalParcelas - (c.parcelasPagas ?? 0)) }));
  });
  const [ordemClientesIds, setOrdemClientesIds] = useState<number[]>(() => {
    const db = loadDB();
    const ids = db?.ordemClientesIds?.length ? db.ordemClientesIds : clientesData.map(c => c.id);
    return ids.filter((id, i, arr) => arr.indexOf(id) === i);
  });
  const clientesOrdenados = ordemClientesIds.map(id => clientes.find(c => c.id === id)!).filter(Boolean) as typeof clientesData;
  const [cobradosExtras, setCobradosExtras] = useState<ClienteItem[]>(() => {
    const db = loadDB();
    return (db?.cobradosExtras as ClienteItem[]) ?? [];
  });
  const [caixaInicial, setCaixaInicial] = useState<number>(() => {
    const db = loadDB();
    return db?.caixaInicial ?? getSaldoInicial();
  });
  const [clienteParaAusentar, setClienteParaAusentar] = useState<ClienteItem | null>(null);
  const [salvoSinc, setSalvoSinc] = useState(false);
  const salvarSinc = () => { setSalvoSinc(true); setTimeout(() => setSalvoSinc(false), 2000); };
  const [emprestimentos, setEmprestimentos] = useState<Emprestimo[]>(() => {
    const db = loadDB();
    if (db?.clientes?.length) return (db?.emprestimentos as Emprestimo[]) ?? [];
    return (db?.emprestimentos as Emprestimo[])?.length ? (db!.emprestimentos as Emprestimo[]) : emprestimentosIniciais;
  });
  const [novosClientesIds, setNovosClientesIds] = useState<Set<number>>(() => {
    const db = loadDB();
    if (db?.clientes?.length) return new Set<number>(db.novosClientesIds ?? []);
    return new Set<number>(emprestimentosIniciais.map(e => e.id));
  });
  const [renovacoesIds, setRenovacoesIds] = useState<Set<number>>(() => {
    const db = loadDB();
    return new Set<number>(db?.renovacoesIds ?? []);
  });
  const [clientesAdicionaisHoje, setClientesAdicionaisHoje] = useState<ClienteItem[]>(() => {
    const db = loadDB();
    const raw = (db?.clientesAdicionaisHoje as ClienteItem[]) ?? [];
    // Recalcula o saldo pela dívida real (parcela × parcelas restantes), corrigindo
    // registros antigos que gravaram apenas o capital emprestado sem os juros.
    return raw.map(c => ({ ...c, saldo: c.parcela * (c.totalParcelas - (c.parcelasPagas ?? 0)) }));
  });
  const [novosClientesOutras, setNovosClientesOutras] = useState<ClienteItem[]>(() => {
    const db = loadDB();
    return (db?.novosClientesOutras as ClienteItem[]) ?? [];
  });
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(() => {
    const db = loadDB();
    return (db?.agendamentos as Agendamento[]) ?? [];
  });
  const addAgendamento = (a: Agendamento) => setAgendamentos(prev => [...prev, a]);
  const [clienteParaRenovar, setClienteParaRenovar] = useState<ClienteItem | null>(null);
  const [historicoCreditos, setHistoricoCreditos] = useState<Record<number, CreditoRecord[]>>(() => {
    const db = loadDB();
    return (db?.historicoCreditos as Record<number, CreditoRecord[]>) ?? {};
  });
  const enrichCliente = (c: ClienteItem): ClienteItem => ({ ...c, historicoCreditos: historicoCreditos[c.id] ?? [] });
  const clientesEnriquecidos = clientes.map(enrichCliente);
  const clientesOrdenadosEnriquecidos = clientesOrdenados.map(enrichCliente);
  const [despesas, setDespesas] = useState<LancamentoItem[]>(() => {
    const db = loadDB(); const hoje = getTodayStr();
    return (db && db.lastDate === hoje && (db.despesas as LancamentoItem[])?.length) ? (db.despesas as LancamentoItem[]) : despesasIniciais;
  });
  const [rendimentos, setRendimentos] = useState<LancamentoItem[]>(() => {
    const db = loadDB(); const hoje = getTodayStr();
    return (db && db.lastDate === hoje && (db.rendimentos as LancamentoItem[])?.length) ? (db.rendimentos as LancamentoItem[]) : rendimentosIniciais;
  });
  const hoje = new Date().toLocaleDateString("pt-BR");
  const addDespesa = (categoria: string, valor: number, observacao: string) =>
    setDespesas(prev => [...prev, { id: Date.now(), data: hoje, categoria, valor, observacao: observacao || undefined }]);
  const addRendimento = (categoria: string, valor: number, observacao: string) =>
    setRendimentos(prev => [...prev, { id: Date.now(), data: hoje, categoria, valor, observacao: observacao || undefined }]);

  // Reabertura no mesmo dia: o caixaInicial foi "carimbado" com o saldo no fechamento
  // (ja com os emprestimos descontados). Como PinLogin so deixa entrar com o caixa aberto,
  // estar aqui com fechamentoDia === hoje significa reabertura same-day: revertemos o
  // caixaInicial ao valor pre-fechamento p/ evitar contar os emprestimos em dobro.
  useEffect(() => {
    const db = loadDB();
    if (db?.fechamentoDia === getTodayStr() && typeof db?.caixaInicialPreFechamento === "number") {
      const preFechamento = db.caixaInicialPreFechamento;
      setCaixaInicial(preFechamento);
      saveDB({ caixaInicial: preFechamento, caixaInicialPreFechamento: undefined, fechamentoDia: undefined });
    }
  }, []);

  // Virada de dia: o saldo de caixa do dia anterior (caixaFinal) vira o caixaInicial de hoje.
  // Assim o saldo de caixa continua de um dia para o outro, mesmo sem fechar o caixa manualmente.
  // Guarda por lastDate !== hoje garante que so dispara em dia novo genuino (nao na reabertura
  // same-day, tratada pelo efeito acima). Idempotente/StrictMode-safe: carimba lastDate = hoje.
  useEffect(() => {
    const db = loadDB();
    const hoje = getTodayStr();
    if (db && db.lastDate && db.lastDate !== hoje && typeof db.caixaFinal === "number") {
      setCaixaInicial(db.caixaFinal);
      saveDB({ caixaInicial: db.caixaFinal, lastDate: hoje, caixaInicialPreFechamento: undefined, fechamentoDia: undefined });
    }
  }, []);

  useEffect(() => {
    if (caixaFechadoHoje) return;
    // Saldo de caixa corrente (mesma formula do RelatorioFinanceiro): persistimos como
    // caixaFinal para que, na virada de dia, ele vire o caixaInicial do proximo dia.
    const cobrancaDiariaVal = cobradosValores.reduce((s, x) => s + x.valor, 0);
    const totalRendimentosVal = rendimentos.reduce((s, r) => s + r.valor, 0);
    const novosEmprestimosVal = emprestimentos.filter(e => criadoHoje(new Date(e.criadoEm).getTime())).reduce((s, e) => s + (e.valorEmprestado ?? 0), 0);
    const retiradaCaixaVal = despesas.filter(d => d.categoria === "Retirada de Caixa").reduce((s, d) => s + d.valor, 0);
    const totalDespesasVal = despesas.filter(d => d.categoria !== "Retirada de Caixa").reduce((s, d) => s + d.valor, 0);
    const caixaFinalVal = caixaInicial + cobrancaDiariaVal + totalRendimentosVal - novosEmprestimosVal - retiradaCaixaVal - totalDespesasVal;
    saveDB({
      lastDate: getTodayStr(),
      cobrados,
      ausentes,
      cobradosValores,
      registroPagamentos,
      historicoPagamentos,
      quitadosClientes,
      ordemClientesIds,
      cobradosExtras,
      emprestimentos,
      novosClientesIds: Array.from(novosClientesIds),
      renovacoesIds: Array.from(renovacoesIds),
      clientesAdicionaisHoje,
      novosClientesOutras,
      agendamentos,
      despesas,
      rendimentos,
      clientes,
      historicoCreditos,
      caixaFinal: caixaFinalVal,
    });
  }, [cobrados, ausentes, cobradosValores, registroPagamentos, historicoPagamentos, quitadosClientes,
      ordemClientesIds, cobradosExtras, emprestimentos, novosClientesIds, renovacoesIds,
      clientesAdicionaisHoje, novosClientesOutras, agendamentos, despesas, rendimentos, clientes, historicoCreditos, caixaInicial]);

  // Monta o snapshot dos dados da rota a partir do estado atual. Usado tanto no
  // fechamento do caixa quanto no envio AO VIVO (tempo real). Mantido em um unico
  // lugar para que a web sempre receba os mesmos numeros que o app calcula.
  const buildDadosSnapshot = (dataStr: string): { snapshot: DadosSnapshot; caixaFinal: number } => {
    const recebAtualSnap = cobradosValores.reduce((s, x) => s + x.valor, 0);
    const totalDespesasSnap = despesas.filter(d => d.categoria !== "Retirada de Caixa").reduce((s, d) => s + d.valor, 0);
    const retiradaSnap = despesas.filter(d => d.categoria === "Retirada de Caixa").reduce((s, d) => s + d.valor, 0);
    const totalRendimentosSnap = rendimentos.reduce((s, r) => s + r.valor, 0);
    const novosEmpHojeSnap = emprestimentos.filter(e => criadoHoje(new Date(e.criadoEm).getTime()));
    const novosEmpSnap = novosEmpHojeSnap.reduce((s, e) => s + (e.valorEmprestado ?? 0), 0);
    const jurosSnap = novosEmpHojeSnap.reduce((s, e) => s + (Number(e.valorEmprestado) || 0) * ((Number(e.taxaJuros) || 0) / 100), 0);
    const caixaFinalSnap = caixaInicial + recebAtualSnap + totalRendimentosSnap - novosEmpSnap - totalDespesasSnap - retiradaSnap;
    const carteiraInicialSnap = clientes.filter(c => c.saldo > 0).reduce((s, c) => s + c.saldo, 0);
    // Total a receber dos empréstimos novos de hoje (principal + juros). Excluímos:
    // (a) renovações — já atualizam o saldo do cliente em `clientes`;
    // (b) empréstimos cujo cliente já está em `clientes` (merge de reabertura same-day)
    //     — senão o valor seria contado duas vezes (em carteiraInicialSnap e aqui).
    const carteiraNovosSnap = novosEmpHojeSnap
      .filter(e => !e.renovacao && !clientes.some(c => c.id === e.id))
      .reduce((s, e) => s + (Number(e.valorEmprestado) || 0) * (1 + (Number(e.taxaJuros) || 0) / 100), 0);
    const carteiraFinalSnap = carteiraInicialSnap + carteiraNovosSnap;
    // Divisão dos clientes novos de hoje: regulares (frente) x pagamento adiantado (atrás).
    const novosNaoRenovSnap = novosEmpHojeSnap.filter(e => !e.renovacao);
    const clientesNovosAdiantadosSnap = novosNaoRenovSnap.filter(e => e.pagamentoAdiantado).length;
    const clientesNovosRegularesSnap = novosNaoRenovSnap.length - clientesNovosAdiantadosSnap;
    // Clientes elegíveis para cobrança HOJE (mesma regra da UI): normais (não criados
    // hoje) + adiantados criados hoje, vindos de `clientes` e `clientesAdicionaisHoje`,
    // sem duplicar por id. Fonte ÚNICA para "previsto", "pagos" e "não pagos".
    const elegiveisCobrancaSnap = [
      ...clientes.filter(c => c.saldo > 0 && (!criadoHoje(c.creditoStartTimestamp) || c.pagamentoAdiantado)),
      ...clientesAdicionaisHoje.filter(c => c.saldo > 0 && (!criadoHoje(c.creditoStartTimestamp) || c.pagamentoAdiantado) && !clientes.some(k => k.id === c.id)),
    ];
    const recebPrevisto = elegiveisCobrancaSnap.reduce((s, c) => s + c.parcela, 0);
    // "pagos"/"não pagos" contam APENAS clientes efetivamente cobrados hoje — ou seja,
    // aqueles em que o cobrador já passou: registrou pagamento, deu Abono, marcou
    // "Sem pagamento" (fica em `cobrados` com valor 0) ou marcou ausente (`ausentes`).
    // Clientes ainda NÃO visitados não entram: só aparecem depois que o cobrador passa
    // neles. Por isso NÃO usamos os elegíveis aqui (senão contaria antes de cobrar).
    // PAGO = teve pagamento real (valor > 0) OU deu Abono hoje (o abono é registrado
    // com valor 0, mas CONTA como pago). Só "Sem pagamento" (valor 0 e sem abono) e
    // ausentes contam como NÃO pago.
    const deuAbonoHoje = (id: number) => (registroPagamentos[id] ?? []).some(p => p.metodo === "Abono");
    const pagouHojeSnap = (id: number) => (cobradosValores.find(x => x.id === id)?.valor ?? 0) > 0 || deuAbonoHoje(id);
    const pagosSnap = cobrados.filter(pagouHojeSnap).length;
    const semPagamentoSnap = cobrados.length - pagosSnap;
    const noPagosSnap = ausentes.length + semPagamentoSnap;
    return {
      caixaFinal: caixaFinalSnap,
      snapshot: {
        cod: cobradorId,
        dataInicio: dataStr,
        dataFechamento: dataStr,
        ultimoAcesso: new Date().toISOString(),
        clientesIniciais: clientes.filter(c => c.saldo > 0).length,
        sincronizados: clientes.filter(c => c.saldo > 0).length,
        clientesNovos: novosNaoRenovSnap.length,
        clientesNovosRegulares: clientesNovosRegularesSnap,
        clientesNovosAdiantados: clientesNovosAdiantadosSnap,
        renovados: renovacoesIds.size,
        cancelados: quitadosClientes.length,
        caixaInicial,
        carteiraInicial: carteiraInicialSnap,
        recebPrevisto,
        recebAtual: recebAtualSnap,
        pagos: pagosSnap,
        noPagos: noPagosSnap,
        efetivo: 0,
        transferencia: 0,
        novosEmp: novosEmpSnap,
        juros: jurosSnap,
        rendimentos: totalRendimentosSnap,
        despesas: totalDespesasSnap,
        retirada: retiradaSnap,
        caixaFinal: caixaFinalSnap,
        carteiraFinal: carteiraFinalSnap,
        sancao: 0,
      },
    };
  };

  // TEMPO REAL: enquanto o caixa estiver aberto, envia o snapshot ao vivo para a
  // web a cada mudanca relevante e a cada 15s. Assim cada movimentacao do cobrador
  // aparece na plataforma sem precisar fechar o caixa.
  useEffect(() => {
    if (caixaFechadoHoje || !(cobradorId > 0)) return;
    const enviar = () => {
      const h = new Date();
      const dataStr = `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,"0")}-${String(h.getDate()).padStart(2,"0")}`;
      const { snapshot } = buildDadosSnapshot(dataStr);
      postSnapshotVivoAPI({ cobradorId, dadosSnapshot: snapshot });
    };
    enviar();
    const interval = setInterval(enviar, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caixaFechadoHoje, cobradorId, cobrados, ausentes, cobradosValores, despesas, rendimentos,
      emprestimentos, clientes, caixaInicial, novosClientesIds, renovacoesIds, quitadosClientes]);

  const handleCaixaFechado = () => {
    const emprestimentosComoClientes = emprestimentos
      .filter(e => !e.renovacao && !clientes.some(c => c.id === e.id))
      .map(e => ({
        id: e.id,
        nome: e.nomeCliente,
        parcela: e.valorParcela,
        // Saldo = dívida real (capital + juros) = valor da parcela × total de parcelas.
        saldo: e.valorParcela * e.quantidadeParcelas,
        status: "novo" as const,
        endereco: e.endereco ?? "",
        parcelasPagas: 0,
        totalParcelas: e.quantidadeParcelas,
        telefone: e.telefone ?? "",
        frequencia: e.frequencia,
        cpf: e.cpf,
        cep: e.cep,
        numero: e.numero,
        bairro: e.bairro,
        cidade: e.cidade,
        uf: e.uf,
        taxaJuros: e.taxaJuros,
        creditoStartTimestamp: e.id,
        pagamentoAdiantado: e.pagamentoAdiantado,
      }));
    const clientesAdicionaisComoClientes = clientesAdicionaisHoje
      .filter(c => !clientes.some(e => e.id === c.id) && !emprestimentosComoClientes.some(e => e.id === c.id));
    const clientesMerged = [...clientes, ...emprestimentosComoClientes, ...clientesAdicionaisComoClientes];
    const novosIds = [...emprestimentosComoClientes, ...clientesAdicionaisComoClientes]
      .map(c => c.id)
      .filter(id => !ordemClientesIds.includes(id));
    const novaOrdem = [...ordemClientesIds, ...novosIds];
    if (cobradorId > 0) {
      const hoje2 = new Date();
      const dataStr2 = `${hoje2.getFullYear()}-${String(hoje2.getMonth()+1).padStart(2,"0")}-${String(hoje2.getDate()).padStart(2,"0")}`;
      despesas.forEach(d => {
        postMovimentoCaixaAPI({
          cobradorId,
          tipo: "saida",
          categoria: d.categoria,
          valor: d.valor,
          observacao: d.observacao,
          data: dataStr2,
        });
      });
      rendimentos.forEach(r => {
        postMovimentoCaixaAPI({
          cobradorId,
          tipo: "entrada",
          categoria: r.categoria,
          valor: r.valor,
          observacao: r.observacao,
          data: dataStr2,
        });
      });

      const { snapshot, caixaFinal: caixaFinalSnap } = buildDadosSnapshot(dataStr2);
      postFechamentoCaixaAPI({
        cobradorId,
        dataFechamento: dataStr2,
        saldoFinal: caixaFinalSnap,
        dadosSnapshot: snapshot,
      }).then(ok => {
        if (!ok) console.error("[FechamentoCaixa] Falha ao enviar snapshot para a API");
      });
      saveDB({ caixaFechadoData: dataStr2 });
    }
    setCaixaFechadoHoje(true);
    setClientes(clientesMerged);
    setOrdemClientesIds(novaOrdem);
    setCobrados([]);
    setAusentes([]);
    setCobradosValores([]);
    setRegistroPagamentos({});
    setCobradosExtras([]);
    setNovosClientesIds(new Set());
    setRenovacoesIds(new Set());
    setEmprestimentos([]);
    setClientesAdicionaisHoje([]);
    setQuitadosClientes([]);
    setDespesas([]);
    setRendimentos([]);
    saveDB({
      lastDate: getTodayStr(),
      clientes: clientesMerged,
      ordemClientesIds: novaOrdem,
      cobrados,
      ausentes,
      cobradosValores,
      registroPagamentos,
      cobradosExtras,
      novosClientesIds: [...novosClientesIds],
      renovacoesIds: [...renovacoesIds],
      clientesAdicionaisHoje,
      emprestimentos,
      quitadosClientes,
      despesas,
      rendimentos,
      caixaInicialPreFechamento: caixaInicial,
      fechamentoDia: getTodayStr(),
    });
  };

  if (clienteSelecionado) {
    return <ParcelaCliente cliente={{ ...clienteSelecionado, pagamentos: historicoPagamentos[clienteSelecionado.id] ?? [] }} onBack={() => setClienteSelecionado(null)} onSaved={(valor, metodo) => {
      const id = clienteSelecionado!.id;
      setCobrados(prev => prev.includes(id) ? prev : [id, ...prev]);
      setCobradosValores(prev => { const existing = prev.find(x => x.id === id); return existing ? prev.map(x => x.id === id ? { id, valor: x.valor + valor } : x) : [{ id, valor }, ...prev]; });
      setAusentes(prev => prev.filter(x => x !== id));
      const deOutrasDatas = outrasDatasData.some(c => c.id === id) || novosClientesOutras.some(c => c.id === id);
      if (deOutrasDatas) {
        setCobradosExtras(prev => prev.find(c => c.id === id) ? prev : [clienteSelecionado!, ...prev]);
      }
      const saldoFormula = clienteSelecionado!.parcela * (clienteSelecionado!.totalParcelas - (clienteSelecionado!.parcelasPagas ?? 0));
      const saldoAposCobranca = Math.max(0, saldoFormula - valor);
      const parcelasNoPagamento = Math.round(valor / (clienteSelecionado!.parcela || 1));
      const novasPagas = Math.min(clienteSelecionado!.totalParcelas, (clienteSelecionado!.parcelasPagas ?? 0) + parcelasNoPagamento);
      setClientes(prev => prev.map(c => c.id === id
        ? { ...c, saldo: saldoAposCobranca, parcelasPagas: novasPagas }
        : c
      ));
      if (saldoAposCobranca <= 0) {
        setQuitadosClientes(prev => prev.some(q => q.id === id) ? prev : [{ ...clienteSelecionado!, saldo: 0 }, ...prev]);
      }
      const hoje = new Date();
      const dataStr = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;
      const novoPag: Pagamento = { id: Date.now(), data: dataStr, parcela: (clienteSelecionado!.parcelasPagas ?? 0) + 1, valor, metodo };
      setRegistroPagamentos(prev => ({ ...prev, [id]: [novoPag, ...(prev[id] ?? [])] }));
      setHistoricoPagamentos(prev => ({ ...prev, [id]: [novoPag, ...(prev[id] ?? [])] }));
      if (cobradorId > 0) {
        postPagamentoAPI({
          emprestimoId: id,
          clienteId: id,
          cobradorId,
          valor,
          dataPagamento: dataStr,
          formaPagamento: metodo,
        });
      }
      setClienteSelecionado(null);
      setVerOutrasDatas(false);
      setActiveNav(0);
    }} />;
  }

  if (clienteParaRenovar) {
    const nomeParts = clienteParaRenovar.nome.split(" ");
    const primeiroNome = nomeParts[0] ?? "";
    const sobrenome = nomeParts.slice(1).join(" ");
    return (
      <CadastroCliente
        onBack={() => setClienteParaRenovar(null)}
        onSalvar={(emp) => {
          const idOriginal = clienteParaRenovar!.id;
          const novaParcela = emp.valorParcela;
          const novoTotal = emp.quantidadeParcelas;
          const novoSaldo = novaParcela * novoTotal;
          const renovacaoTs = Date.now();

          // Finaliza crédito antigo
          const pagsCiclo = (historicoPagamentos[idOriginal] ?? []).filter(p =>
            !clienteParaRenovar!.creditoStartTimestamp || p.id >= clienteParaRenovar!.creditoStartTimestamp!
          );
          const pagasAntes = pagsCiclo.filter(p => p.metodo !== "Sem pagamento").length;
          const naoPagasAntes = pagsCiclo.filter(p => p.metodo === "Sem pagamento").length;
          const fmtD = (ts: number) => { const d = new Date(ts); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
          const duracaoAntes = clienteParaRenovar!.creditoStartTimestamp
            ? Math.round((renovacaoTs - clienteParaRenovar!.creditoStartTimestamp!) / (1000 * 60 * 60 * 24))
            : 0;
          const creditoFinalizado: CreditoRecord = {
            dataInicio: clienteParaRenovar!.creditoStartTimestamp ? fmtD(clienteParaRenovar!.creditoStartTimestamp!) : fmtD(renovacaoTs),
            dataCancelamento: fmtD(renovacaoTs),
            valor: clienteParaRenovar!.parcela * clienteParaRenovar!.totalParcelas,
            parcelas: clienteParaRenovar!.totalParcelas,
            pagas: pagasAntes,
            naoPagas: naoPagasAntes,
            juros: clienteParaRenovar!.taxaJuros ?? 0,
            duracao: duracaoAntes,
            status: "Quitado",
          };
          setHistoricoCreditos(prev => ({
            ...prev,
            [idOriginal]: [...(prev[idOriginal] ?? []), creditoFinalizado],
          }));
          // Limpa histórico de pagamentos do ciclo antigo
          setHistoricoPagamentos(prev => ({ ...prev, [idOriginal]: [] }));

          setClientes(prev => prev.map(c => c.id === idOriginal
            ? { ...c, parcela: novaParcela, totalParcelas: novoTotal, parcelasPagas: 0, saldo: novoSaldo, creditoStartTimestamp: renovacaoTs, frequencia: emp.frequencia ?? c.frequencia, taxaJuros: emp.taxaJuros, pagamentoAdiantado: emp.pagamentoAdiantado }
            : c
          ));
          setQuitadosClientes(prev => prev.filter(q => q.id !== idOriginal));
          if (!emp.pagamentoAdiantado) {
            setCobrados(prev => prev.includes(idOriginal) ? prev : [...prev, idOriginal]);
          }
          setRenovacoesIds(prev => new Set([...prev, idOriginal]));
          setEmprestimentos(prev => [...prev, {
            id: Date.now(),
            nomeCliente: clienteParaRenovar!.nome,
            diario: emp.diario,
            frequencia: emp.frequencia,
            criadoEm: new Date().toISOString(),
            valorEmprestado: novoSaldo,
            valorParcela: novaParcela,
            taxaJuros: emp.taxaJuros,
            quantidadeParcelas: novoTotal,
            telefone: emp.telefone,
            cpf: emp.cpf,
            endereco: emp.endereco,
            cep: emp.cep,
            numero: emp.numero,
            bairro: emp.bairro,
            cidade: emp.cidade,
            uf: emp.uf,
            renovacao: true,
            clienteId: idOriginal,
          }]);
          setTimeout(() => { setClienteParaRenovar(null); setVerRenovacao(false); setActiveNav(0); }, 1600);
        }}
        initialData={{
          nome: primeiroNome,
          sobrenome,
          telefone: clienteParaRenovar.telefone,
          cpf: clienteParaRenovar.cpf,
          endereco: clienteParaRenovar.endereco,
          cep: clienteParaRenovar.cep,
          numero: clienteParaRenovar.numero,
          bairro: clienteParaRenovar.bairro,
          cidade: clienteParaRenovar.cidade,
          uf: clienteParaRenovar.uf,
          valorEmprestado: clienteParaRenovar.saldo.toFixed(2),
          valorParcela: clienteParaRenovar.parcela.toFixed(2),
        }}
      />
    );
  }

  const navTabs = [
    { src: import.meta.env.BASE_URL + "icons/icone-rota3.png", alt: "Rota" },
    { src: import.meta.env.BASE_URL + "icons/icone-emprestimo.png", alt: "Empréstimo" },
    { src: import.meta.env.BASE_URL + "icons/icone-gastos2.png", alt: "Gastos" },
    { src: import.meta.env.BASE_URL + "icons/icone-calendario.png", alt: "Calendário" },
  ];

  const tituloTela = ["Clientes", "Novo Empréstimo", "Gastos", "Calendário"][activeNav];

  return (
    <div style={{
      width: "100%", maxWidth: 390, margin: "0 auto",
      height: "100vh", backgroundColor: P.bg,
      display: "flex", flexDirection: "column",
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      position: "relative", overflow: "hidden",
    }}>

      {/* HEADER */}
      <div style={{
        background: `linear-gradient(160deg, ${P.headerTop} 0%, ${P.headerBot} 100%)`,
        padding: "16px 16px 14px",
        boxShadow: "0 4px 20px rgba(15,23,42,0.3)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{
              width: 42, height: 42,
              background: "linear-gradient(145deg, #B91C1C, #EF4444)",
              borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(185,28,28,0.5)",
              border: "1.5px solid rgba(255,255,255,0.15)",
            }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>MN</span>
            </div>
            {verRelatorio ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 1.2 }}>Rota Cred Bank</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2 }}>Relatório Diário · {new Date().toLocaleDateString("pt-BR")}</div>
              </div>
            ) : verEmprestimentos ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 1.2 }}>Novos Empréstimos</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2, textTransform: "capitalize" }}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</div>
              </div>
            ) : verSincronizar ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 1.2 }}>Sincronizar</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2 }}>Ordenar clientes</div>
              </div>
            ) : verOutrasDatas ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 1.2 }}>Outras Datas</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2 }}>Mensal · Semanal</div>
              </div>
            ) : verAusentes ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 1.2 }}>Clientes Ausentes</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2 }}>{ausentes.length} ausente{ausentes.length !== 1 ? "s" : ""}</div>
              </div>
            ) : verRenovacao ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 1.2 }}>Lista de Clientes</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2 }}>Renovação de empréstimos</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 1.2 }}>
                  {activeNav === 0 ? "SystemPay" : tituloTela}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2 }}>
                  Sistema de Cobrança
                </div>
              </div>
            )}
          </div>

          {(verRenovacao || verRelatorio || verEmprestimentos || verSincronizar || verOutrasDatas || verAusentes) ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {verSincronizar && (
                <button onClick={salvarSinc} style={{
                  background: salvoSinc ? "rgba(22,163,74,0.85)" : "rgba(255,255,255,0.15)",
                  border: `1.5px solid ${salvoSinc ? "rgba(134,239,172,0.5)" : "rgba(255,255,255,0.25)"}`,
                  borderRadius: 10, cursor: "pointer", width: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s, border-color 0.2s",
                }}>
                  {salvoSinc
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="4,12 9,17 20,7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <img src={import.meta.env.BASE_URL + "icons/icone-salvar.png"} width={20} height={20} alt="Salvar" style={{ objectFit: "contain" }} />
                  }
                </button>
              )}
              <button onClick={() => {
                if (verRelatorio && caixaFechadoHoje) { onSair?.(); return; }
                setVerRenovacao(false); setVerRelatorio(false); setVerEmprestimentos(false); setVerSincronizar(false); setVerOutrasDatas(false); setVerAusentes(false);
              }} style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 10, cursor: "pointer", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowLeft size={18} color="#fff" />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {[
                { src: import.meta.env.BASE_URL + "icons/icone-grafico.png", w: 26, filter: "none", onClick: () => setVerRelatorio(true) },
                { src: import.meta.env.BASE_URL + "icons/icone-contato.png", w: 24, filter: "brightness(0) invert(1)", onClick: () => setVerEmprestimentos(true) },
                { src: import.meta.env.BASE_URL + "icons/icone-menu.png", w: 22, filter: "brightness(0) invert(1)", onClick: () => setModal(modal === "menu" ? null : "menu") },
              ].map((ico, i) => (
                <button key={i} onClick={ico.onClick} style={{
                  width: 36, height: 36, background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  cursor: "pointer", borderRadius: 10, display: "flex",
                  alignItems: "center", justifyContent: "center", transition: "background 0.15s",
                }}>
                  <img src={ico.src} width={ico.w} height={ico.w} alt="" style={{ objectFit: "contain", filter: ico.filter, opacity: 0.9 }} />
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Barra de busca — abaixo do cabeçalho, só na tela de clientes */}
      {activeNav === 0 && !verEmprestimentos && !verRelatorio && !verSincronizar && !verOutrasDatas && !verAusentes && (
        <div style={{
          backgroundColor: P.bg,
          padding: "10px 14px 8px",
          display: "flex", alignItems: "center", gap: 8,
          flexShrink: 0,
          borderBottom: "1px solid #e4e8ef",
        }}>
          <label style={{ display: verRenovacao ? "none" : "flex", alignItems: "center", gap: 5, cursor: "pointer", userSelect: "none", flexShrink: 0 }}>
            <div onClick={() => setVrf(!vrf)} style={{
              width: 17, height: 17,
              border: `2px solid ${vrf ? P.gold : "#CBD5E1"}`,
              borderRadius: 5, backgroundColor: vrf ? P.gold : "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", cursor: "pointer",
            }}>
              {vrf && (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <polyline points="1,4.5 3.5,7 8,2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 11.5, color: P.textSecondary, fontWeight: 600, letterSpacing: 0.3 }}>Vrf</span>
          </label>

          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.5" />
                <line x1="10" y1="10" x2="13" y2="13" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <input type="text" placeholder="Procurar cliente..." value={busca} onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                border: `1.5px solid ${busca ? P.gold : "#E4E8EF"}`,
                borderRadius: 10, padding: "8px 11px 8px 32px",
                fontSize: 13, outline: "none", color: P.textPrimary,
                backgroundColor: "#FFFFFF", transition: "all 0.18s", fontFamily: "inherit",
              }} />
          </div>

          <button style={{
            width: 38, height: 38, backgroundColor: "#FFFFFF",
            border: "1px solid #E4E8EF", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="5.5" y="1" width="5" height="8" rx="2.5" fill="#6B7280" />
              <path d="M3 7.5a5 5 0 0 0 10 0" stroke="#6B7280" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <line x1="8" y1="12.5" x2="8" y2="15" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="5.5" y1="15" x2="10.5" y2="15" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* CONTEÚDO */}
      {verAusentes
        ? <ClientesAusentes ausentes={ausentes} onReativar={(id) => setAusentes(prev => prev.filter(x => x !== id))} onAddAgendamento={addAgendamento} onSelectCliente={setClienteSelecionado} clientesBase={clientesEnriquecidos} pagamentosRegistro={historicoPagamentos} />
        : verOutrasDatas
        ? <EmprestimosOutrasDatas onAddAgendamento={addAgendamento} onSelectCliente={setClienteSelecionado} novosClientes={novosClientesOutras} pagamentosRegistro={historicoPagamentos} />
        : verSincronizar
        ? <SincronizarClientes onBack={() => setVerSincronizar(false)} salvo={salvoSinc} ordemInicial={ordemClientesIds} onOrdemChange={setOrdemClientesIds} />
        : verEmprestimentos
        ? <EmprestimosDoDia
            lista={emprestimentos.filter(e => criadoHoje(new Date(e.criadoEm).getTime()))}
            onDelete={(id) => {
              if (confirm("Confirmar exclusão deste registro?")) {
                const emp = emprestimentos.find(e => e.id === id);
                const clienteAlvoId = emp?.clienteId ?? id;
                setEmprestimentos(prev => prev.filter(e => e.id !== id));

                if (emp?.renovacao && emp.clienteId) {
                  // Renovação: reverte o cliente para estado quitado (saldo=0)
                  // e remove o último crédito registrado no histórico
                  setRenovacoesIds(prev => { const s = new Set(prev); s.delete(clienteAlvoId); return s; });
                  setHistoricoCreditos(prev => {
                    const lista = prev[clienteAlvoId] ?? [];
                    return { ...prev, [clienteAlvoId]: lista.slice(0, -1) };
                  });
                  setClientes(prev => prev.map(c => {
                    if (c.id !== clienteAlvoId) return c;
                    const ultimoCredito = (historicoCreditos[clienteAlvoId] ?? []).at(-1);
                    const totalOriginal = ultimoCredito?.parcelas ?? c.totalParcelas;
                    return { ...c, parcelasPagas: totalOriginal, saldo: 0, creditoStartTimestamp: undefined };
                  }));
                  setCobrados(prev => prev.filter(cid => cid !== clienteAlvoId));
                  setCobradosValores(prev => prev.filter(x => x.id !== clienteAlvoId));
                  setCobradosExtras(prev => prev.filter(c => c.id !== clienteAlvoId));
                  setQuitadosClientes(prev => prev.filter(q => q.id !== clienteAlvoId));
                } else {
                  // Novo cliente: remove completamente do sistema
                  setNovosClientesIds(prev => { const s = new Set(prev); s.delete(clienteAlvoId); return s; });
                  setClientesAdicionaisHoje(prev => prev.filter(c => c.id !== clienteAlvoId));
                  setNovosClientesOutras(prev => prev.filter(c => c.id !== clienteAlvoId));
                  setClientes(prev => prev.filter(c => c.id !== clienteAlvoId));
                  setOrdemClientesIds(prev => prev.filter(oid => oid !== clienteAlvoId));
                  setCobrados(prev => prev.filter(cid => cid !== clienteAlvoId));
                  setCobradosValores(prev => prev.filter(x => x.id !== clienteAlvoId));
                  setCobradosExtras(prev => prev.filter(c => c.id !== clienteAlvoId));
                  setHistoricoPagamentos(prev => { const next = { ...prev }; delete next[clienteAlvoId]; return next; });
                }
              }
            }}
            onBack={() => setVerEmprestimentos(false)}
          />
        : verRelatorio
        ? <RelatorioFinanceiro
            onBack={() => setVerRelatorio(false)}
            onSair={onSair}
            onCaixaFechado={handleCaixaFechado}
            caixaInicial={caixaInicial}
            onCaixaInicialChange={(v) => { setCaixaInicial(v); saveDB({ caixaInicial: v }); }}
            totalDespesas={despesas.filter(d => d.categoria !== "Retirada de Caixa").reduce((s, d) => s + d.valor, 0)}
            totalRendimentos={rendimentos.reduce((s, r) => s + r.valor, 0)}
            totalClientes={clientes.filter(c => c.saldo > 0).length + [...novosClientesIds].filter(id => !clientes.some(c => c.id === id && c.saldo > 0)).length + renovacoesIds.size}
            clientesParaCobranca={clientes.filter(c => c.saldo > 0 && (!criadoHoje(c.creditoStartTimestamp) || c.pagamentoAdiantado)).length + clientesAdicionaisHoje.filter(c => c.saldo > 0 && (!criadoHoje(c.creditoStartTimestamp) || c.pagamentoAdiantado) && !clientes.some(k => k.id === c.id)).length}
            adicionaisCount={clientes.filter(c => c.saldo > 0 && criadoHoje(c.creditoStartTimestamp) && c.pagamentoAdiantado).length + clientesAdicionaisHoje.filter(c => c.saldo > 0 && criadoHoje(c.creditoStartTimestamp) && c.pagamentoAdiantado && !clientes.some(k => k.id === c.id)).length}
            cobradosCount={cobrados.length}
            ausentesCount={ausentes.length}
            novosCount={[...novosClientesIds].filter(id => criadoHoje(id)).length}
            renovacoesCount={renovacoesIds.size}
            renovacoesValor={emprestimentos.filter(e => (e as any).renovacao).reduce((s, e) => s + (e.valorEmprestado ?? 0), 0)}
            cobrancaDiaria={cobradosValores.reduce((s, x) => s + x.valor, 0)}
            cobrancaEsperada={clientes.filter(c => c.saldo > 0 && (!criadoHoje(c.creditoStartTimestamp) || c.pagamentoAdiantado)).reduce((s, c) => s + c.parcela, 0) + clientesAdicionaisHoje.filter(c => c.saldo > 0 && (!criadoHoje(c.creditoStartTimestamp) || c.pagamentoAdiantado) && !clientes.some(k => k.id === c.id)).reduce((s, c) => s + c.parcela, 0)}
            novosEmprestimos={emprestimentos.filter(e => criadoHoje(new Date(e.criadoEm).getTime())).reduce((s, e) => s + (e.valorEmprestado ?? 0), 0)}
            retiradaCaixa={despesas.filter(d => d.categoria === "Retirada de Caixa").reduce((s, d) => s + d.valor, 0)}
            onSemPagamentos={() => {
              const elegiveis = [
                ...clientesOrdenados.filter(c => !criadoHoje(c.creditoStartTimestamp) || c.pagamentoAdiantado),
                ...clientesAdicionaisHoje.filter(c => (!criadoHoje(c.creditoStartTimestamp) || c.pagamentoAdiantado) && !clientesOrdenados.some(k => k.id === c.id)),
              ];
              const pendentes = elegiveis.filter(c => !cobrados.includes(c.id) && !ausentes.includes(c.id) && c.saldo > 0);
              if (pendentes.length === 0) return;
              const hoje = new Date().toLocaleDateString("pt-BR");
              setCobrados(prev => {
                const novos = pendentes.map(c => c.id).filter(id => !prev.includes(id));
                return [...prev, ...novos];
              });
              setCobradosValores(prev => {
                const novos = pendentes.filter(c => !prev.some(x => x.id === c.id)).map(c => ({ id: c.id, valor: 0 }));
                return [...prev, ...novos];
              });
              setRegistroPagamentos(prev => {
                const next = { ...prev };
                pendentes.forEach(c => {
                  if (!next[c.id]) next[c.id] = [];
                  if (!next[c.id].some((p: Pagamento) => p.metodo === "Sem pagamento")) {
                    next[c.id] = [...next[c.id], { data: hoje, valor: 0, metodo: "Sem pagamento" as MetodoPagamento }];
                  }
                });
                return next;
              });
            }}
          />
        : verRenovacao
        ? <RenovacaoClientes onBack={() => setVerRenovacao(false)} onAddAgendamento={addAgendamento} onRenovar={setClienteParaRenovar} clientesQuitados={[]} todosClientes={[...clientesOrdenados, ...clientesAdicionaisHoje].filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i && c.saldo === 0)} />
        : activeNav === 0 ? <TelaLista busca={busca} setBusca={setBusca} vrf={vrf} setVrf={setVrf} onSelectCliente={setClienteSelecionado} onAddAgendamento={addAgendamento} ausentes={ausentes} onAusentar={setClienteParaAusentar} cobrados={cobrados} onRemoverCobrado={(id) => { setCobrados(prev => prev.filter(x => x !== id)); setCobradosExtras(prev => prev.filter(x => x.id !== id)); setCobradosValores(prev => prev.filter(x => x.id !== id)); setRegistroPagamentos(prev => { const next = { ...prev }; delete next[id]; return next; }); setHistoricoPagamentos(prev => { const next = { ...prev }; if (next[id]?.length) next[id] = next[id].slice(1); return next; }); setQuitadosClientes(prev => prev.filter(x => x.id !== id)); setRenovacoesIds(prev => { const s = new Set(prev); s.delete(id); return s; }); setClientes(prev => prev.map(c => { if (c.id !== id) return c; const valorPago = cobradosValores.find(x => x.id === id)?.valor ?? c.parcela; const parcelasReverter = Math.round(valorPago / (c.parcela || 1)); const pp = Math.max(0, c.parcelasPagas - parcelasReverter); const saldoRestaurado = c.parcela * (c.totalParcelas - pp); return { ...c, parcelasPagas: pp, saldo: saldoRestaurado }; })); }} clientesAdicionais={clientesAdicionaisHoje.map(enrichCliente)} cobradosExtras={cobradosExtras} cobradosValores={cobradosValores} pagamentosRegistro={historicoPagamentos} clientesBase={clientesOrdenadosEnriquecidos} />
        : activeNav === 1 ? <CadastroCliente onBack={() => setActiveNav(0)} onSalvar={(emp) => {
            setEmprestimentos(prev => [emp, ...prev]);
            setNovosClientesIds(prev => new Set([...prev, emp.id]));
            const novoCliente: ClienteItem = {
              id: emp.id,
              nome: emp.nomeCliente,
              parcela: emp.valorParcela,
              // Saldo = dívida real (capital + juros) = valor da parcela × total de parcelas.
              saldo: emp.valorParcela * emp.quantidadeParcelas,
              status: "novo",
              endereco: emp.endereco ?? "",
              parcelasPagas: 0,
              totalParcelas: emp.quantidadeParcelas,
              telefone: emp.telefone ?? "",
              frequencia: emp.frequencia,
              cpf: emp.cpf,
              cep: emp.cep,
              numero: emp.numero,
              bairro: emp.bairro,
              cidade: emp.cidade,
              uf: emp.uf,
              creditoStartTimestamp: emp.id,
              pagamentoAdiantado: emp.pagamentoAdiantado,
            };
            if (emp.pagamentoAdiantado) {
              setClientesAdicionaisHoje(prev => prev.some(c => c.id === novoCliente.id) ? prev : [novoCliente, ...prev]);
            }
            if (!emp.diario) {
              setNovosClientesOutras(prev => [novoCliente, ...prev]);
            }
            setTimeout(() => setActiveNav(0), 1600);
          }} />
        : activeNav === 2 ? <LancamentoFinanceiro onAddDespesa={addDespesa} onAddRendimento={addRendimento} onSalvo={() => setTimeout(() => setActiveNav(0), 1500)} />
        : <TelaCalendario agendamentos={agendamentos} />
      }

      {/* BARRA INFERIOR */}
      {!verRelatorio && !verEmprestimentos && !verRenovacao && !verSincronizar && !verOutrasDatas && !verAusentes && <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: `linear-gradient(160deg, ${P.headerTop} 0%, ${P.headerBot} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "space-around",
        height: 66, boxShadow: "0 -4px 20px rgba(15,23,42,0.30)", zIndex: 10,
      }}>
        {navTabs.map((ico, i) => {
          const isActive = activeNav === i;
          return (
            <button key={i} onClick={() => setActiveNav(i)} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 58, height: 48, borderRadius: 14, border: "none", cursor: "pointer",
              backgroundColor: isActive ? P.gold : "transparent",
              boxShadow: isActive ? `0 4px 14px ${P.goldGlow}` : "none",
              transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
              transform: isActive ? "translateY(-2px)" : "none",
              position: "relative",
            }}>
              <img src={ico.src} width={36} height={36} alt={ico.alt} style={{
                objectFit: "contain", filter: "brightness(0) invert(1)",
                opacity: isActive ? 1 : 0.55, transition: "opacity 0.2s",
              }} />
              {/* Coin badge on the hand/empréstimo button */}
              {i === 1 && (
                <div style={{
                  position: "absolute", top: 4, right: 6,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "linear-gradient(145deg, #F59E0B, #D97706)",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                }}>
                  <span style={{ color: "white", fontSize: 7, fontWeight: 800, lineHeight: 1 }}>R$</span>
                </div>
              )}
            </button>
          );
        })}
      </div>}

      {/* MODAIS */}
      {modal === "menu" && <ModalMenu onClose={() => setModal(null)} onRelatorio={() => { setVerRelatorio(true); setModal(null); }} onEmprestimos={() => { setVerEmprestimentos(true); setModal(null); }} onRenovacao={() => { setVerRenovacao(true); setModal(null); }} onSincronizar={() => { setVerSincronizar(true); setModal(null); }} onOutrasDatas={() => { setVerOutrasDatas(true); setModal(null); }} onAusentes={() => { setVerAusentes(true); setModal(null); }} onSair={() => { setModal(null); onSair?.(); }} despesas={despesas} rendimentos={rendimentos} onDeleteDespesa={(id) => setDespesas(prev => prev.filter(d => d.id !== id))} onDeleteRendimento={(id) => setRendimentos(prev => prev.filter(r => r.id !== id))} />}

      {/* Modal confirmação ausentar */}
      {clienteParaAusentar && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 16px 14px", width: "100%", maxWidth: 300, boxShadow: "0 10px 40px rgba(15,23,42,0.25)" }}>
            {/* Ícone + título na mesma linha */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="#d97706" strokeWidth="2.2"/>
                  <line x1="23" y1="11" x2="17" y2="11" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1B2236" }}>Ausentar cliente?</div>
            </div>
            {/* Descrição */}
            <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5, marginBottom: 14, paddingLeft: 44 }}>
              <strong style={{ color: "#334155" }}>{clienteParaAusentar.nome.split(" ").slice(0, 3).join(" ")}</strong>{" "}
              será removido da cobrança e irá para <strong style={{ color: "#d97706" }}>Clientes Ausentes</strong>.
            </div>
            {/* Botões */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setClienteParaAusentar(null)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { setAusentes(prev => [...prev, clienteParaAusentar.id]); setClienteParaAusentar(null); }}
                style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #f59e0b, #d97706)", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
