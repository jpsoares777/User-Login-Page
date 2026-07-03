import { useState, useRef } from "react";
import "./ClienteDetalhe.css";
import { loadFotos, saveFotoCliente, compressToBase64 } from "../lib/storage";

type StatusType = "pago" | "pendente" | "atrasado";
type AbaAtiva = "detalhes" | "pagamentos" | "fotos" | "agendar";
export type MetodoPagamento = "Parcela" | "Abono" | "Sem pagamento";
export type FormaPagamento = "Dinheiro" | "PIX";

export interface Pagamento {
  id: number;
  data: string;
  parcela: number;
  valor: number;
  metodo: MetodoPagamento;
  forma?: FormaPagamento;
}

export interface CreditoRecord {
  dataInicio: string;
  dataCancelamento: string;
  valor: number;
  parcelas: number;
  pagas: number;
  naoPagas: number;
  juros: number;
  duracao: number;
  status: "Quitado" | "Cancelado";
}

export interface ClienteItem {
  id: number;
  nome: string;
  consecutivo?: string;
  parcela: number;
  saldo: number;
  status: string;
  endereco: string;
  parcelasPagas: number;
  totalParcelas: number;
  telefone: string;
  frequencia?: string;
  pagamentos?: Pagamento[];
  cpf?: string;
  cep?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  creditoStartTimestamp?: number;
  taxaJuros?: number;
  pagamentoAdiantado?: boolean;
  historicoCreditos?: CreditoRecord[];
}

function StatusBadge({ status, onClick, ativo }: { status: StatusType; onClick?: () => void; ativo?: boolean }) {
  return (
    <button className={`status-badge-btn ${ativo ? "status-badge-btn--ativo" : ""}`} onClick={onClick}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="status-badge-svg">
        <circle cx="12" cy="12" r="11" fill={ativo ? "#16a34a" : "#22c55e"} />
        <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="phone-icon">
      <circle cx="12" cy="12" r="12" fill="#3b82f6" />
      <path d="M8.5 7.5C8.5 7.5 9 9.5 10.5 11C12 12.5 14 13 14 13L15.5 11.5C15.5 11.5 17 12.5 17.5 13C18 13.5 17.5 15.5 16.5 16C15.5 16.5 12 16 9.5 13.5C7 11 6.5 7.5 7 6.5C7.5 5.5 9.5 5 10 5.5C10.5 6 11.5 7.5 11.5 7.5L10 9C10 9 9 8 8.5 7.5Z" fill="white" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="map-icon">
      <circle cx="12" cy="12" r="12" fill="#ef4444" />
      <path d="M12 5C9.79 5 8 6.79 8 9c0 3.5 4 9 4 9s4-5.5 4-9c0-2.21-1.79-4-4-4zm0 5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="white" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="calendar-icon">
      <rect x="2" y="4" width="20" height="18" rx="3" fill="#6366f1" />
      <rect x="2" y="8" width="20" height="2" fill="white" opacity="0.5" />
      <rect x="7" y="2" width="2" height="4" rx="1" fill="white" />
      <rect x="15" y="2" width="2" height="4" rx="1" fill="white" />
      <rect x="6" y="12" width="3" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="10.5" y="12" width="3" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="15" y="12" width="3" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="6" y="16" width="3" height="2" rx="0.5" fill="white" opacity="0.8" />
      <rect x="10.5" y="16" width="3" height="2" rx="0.5" fill="white" opacity="0.8" />
    </svg>
  );
}

function ParcelaIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="metodo-icon">
      <circle cx="10" cy="10" r="10" fill="#22c55e" />
      <path d="M6 10.5l2.5 2.5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AbonoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="metodo-icon">
      <circle cx="10" cy="10" r="10" fill="#f59e0b" />
      <path d="M10 5v10M7 8l3-3 3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SemPagamentoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="metodo-icon">
      <circle cx="10" cy="10" r="10" fill="#ef4444" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MetodoIcon({ metodo }: { metodo: Metodo }) {
  if (metodo === "Abono") return <AbonoIcon />;
  if (metodo === "Sem pagamento") return <SemPagamentoIcon />;
  return <ParcelaIcon />;
}

interface RowProps {
  label: string;
  value?: string;
  highlight?: boolean;
  isPhone?: boolean;
  isAddress?: boolean;
}

function InfoRow({ label, value, highlight, isPhone, isAddress }: RowProps) {
  return (
    <div className={`info-row ${highlight ? "info-row--highlight" : ""}`}>
      <div className="info-row__label">{label}</div>
      <div className="info-row__value">
        {isPhone && value && (
          <span className="info-row__phone-wrap">
            <PhoneIcon />
            <span className="info-row__phone-number">{value}</span>
          </span>
        )}
        {isAddress && value && (
          <span className="info-row__address-wrap">
            <MapIcon />
            <span className="info-row__address-text">{value}</span>
          </span>
        )}
        {!isPhone && !isAddress && (
          <span className={highlight ? "info-row__value--emphasis" : ""}>{value}</span>
        )}
      </div>
    </div>
  );
}

const METODO_CLASSE: Record<Metodo, string> = {
  "Parcela": "parcela",
  "Abono": "abono",
  "Sem pagamento": "sem-pagamento",
};

const METODO_LABEL: Record<Metodo, string> = {
  "Parcela": "Parc.",
  "Abono": "Abono",
  "Sem pagamento": "S/Pag.",
};

function ListaPagamentos({ pagamentos }: { pagamentos: Pagamento[] }) {
  const total = pagamentos.reduce((s, p) => s + p.valor, 0);

  return (
    <div className="pg-lista">
      <div className="pg-lista__header">
        <div className="pg-lista__col pg-lista__col--data">Data</div>
        <div className="pg-lista__col pg-lista__col--parcela">Parc.</div>
        <div className="pg-lista__col pg-lista__col--valor">Valor</div>
        <div className="pg-lista__col pg-lista__col--metodo">Método</div>
      </div>

      <div className="pg-lista__rows">
        {pagamentos.map((p) => {
          const semPagamento = p.metodo === "Sem pagamento";
          const abono = p.metodo === "Abono";
          return (
            <div key={p.id} className={`pg-lista__row ${semPagamento ? "pg-lista__row--nao-pago" : ""} ${abono ? "pg-lista__row--abono" : ""}`}>
              <div className="pg-lista__col pg-lista__col--data">
                <span className="pg-data">{p.data}</span>
              </div>
              <div className="pg-lista__col pg-lista__col--parcela">
                <span className="pg-parcela">#{p.parcela}</span>
              </div>
              <div className="pg-lista__col pg-lista__col--valor">
                {semPagamento
                  ? <span className="pg-valor pg-valor--nao-pago">—</span>
                  : <span className={`pg-valor ${abono ? "pg-valor--abono" : ""}`}>R$ {p.valor.toFixed(2)}</span>
                }
              </div>
              <div className="pg-lista__col pg-lista__col--metodo">
                <span className="pg-metodo-wrap">
                  <MetodoIcon metodo={p.metodo} />
                  <span className={`pg-metodo-label pg-metodo-label--${METODO_CLASSE[p.metodo]}`}>
                    {METODO_LABEL[p.metodo]}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pg-lista__footer">
        <span className="pg-footer__label">Total pago</span>
        <span className="pg-footer__valor">R$ {total.toFixed(2)}</span>
      </div>
    </div>
  );
}

interface FotoItem {
  id: number;
  url: string;
  nome: string;
  tipo: "perfil" | "documento";
}

function GaleriaFotos({ clienteId }: { clienteId: number }) {
  const [fotos, setFotos] = useState<FotoItem[]>(() => {
    const stored = loadFotos();
    const clienteFotos = stored[clienteId];
    if (clienteFotos && clienteFotos.length > 0) {
      return clienteFotos.map(f => ({ id: f.id, url: f.base64, nome: f.nome, tipo: "documento" as const }));
    }
    return [];
  });
  const [ampliada, setAmpliada] = useState<FotoItem | null>(null);
  const inputDocRef = useRef<HTMLInputElement>(null);

  const docs = fotos.filter(f => f.tipo === "documento");

  async function handleAnexar(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const novas: FotoItem[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const base64 = await compressToBase64(files[i]);
        novas.push({ id: Date.now() + i, url: base64, nome: files[i].name.replace(/\.[^.]+$/, ""), tipo: "documento" as const });
      } catch {}
    }
    setFotos(prev => {
      const next = [...prev, ...novas];
      saveFotoCliente(clienteId, next.map(f => ({ id: f.id, nome: f.nome, base64: f.url })));
      return next;
    });
    e.target.value = "";
  }

  function remover(id: number) {
    setFotos(prev => {
      const next = prev.filter(f => f.id !== id);
      saveFotoCliente(clienteId, next.map(f => ({ id: f.id, nome: f.nome, base64: f.url })));
      return next;
    });
    if (ampliada?.id === id) setAmpliada(null);
  }

  return (
    <div className="gf-wrapper">
      <div className="gf-section">
        <div className="gf-section__header">
          <div className="gf-section__titulo">Documentos Anexados</div>
          <span className="gf-section__contagem">{docs.length}</span>
        </div>

        <div className="gf-docs-grid">
          {docs.map(doc => (
            <div key={doc.id} className="gf-doc-item">
              <div className="gf-doc-img-wrap" onClick={() => setAmpliada(doc)}>
                <img src={doc.url} alt={doc.nome} className="gf-doc-img" />
                <div className="gf-doc-overlay">
                  <svg viewBox="0 0 24 24" fill="none" className="gf-overlay-icon gf-overlay-icon--sm">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" />
                  </svg>
                </div>
                <button className="gf-doc-remover" onClick={e => { e.stopPropagation(); remover(doc.id); }}>
                  <svg viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="10" fill="#ef4444" />
                    <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <span className="gf-doc-nome">{doc.nome}</span>
            </div>
          ))}

          <div className="gf-doc-item">
            <button className="gf-doc-adicionar" onClick={() => inputDocRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" className="gf-add-icon">
                <path d="M12 5v14M5 12h14" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <span className="gf-add-texto">Anexar</span>
            </button>
          </div>
        </div>

        <input ref={inputDocRef} type="file" accept="image/*" multiple className="gf-input-hidden" onChange={handleAnexar} />
      </div>

      {ampliada && (
        <div className="gf-modal" onClick={() => setAmpliada(null)}>
          <div className="gf-modal__box" onClick={e => e.stopPropagation()}>
            <button className="gf-modal__fechar" onClick={() => setAmpliada(null)}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <img src={ampliada.url} alt={ampliada.nome} className="gf-modal__img" />
            <p className="gf-modal__nome">{ampliada.nome}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export interface Agendamento {
  id: number;
  data: string;
  hora: string;
  observacao: string;
  nomeCliente?: string;
}

function AgendarView({ onAddAgendamento, nomeCliente }: { onAddAgendamento: (a: Agendamento) => void; nomeCliente: string }) {
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function salvar() {
    if (!data || !hora) { setErro(true); return; }
    onAddAgendamento({ id: Date.now(), data, hora, observacao: obs.trim() || "—", nomeCliente });
    setData(""); setHora(""); setObs(""); setErro(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="ag-wrapper">
      <div className="ag-form">
        <div className="ag-form__titulo">Novo agendamento</div>
        <div className="ag-form__row">
          <div className="ag-field">
            <label className="ag-label">Data {erro && !data && <span className="ag-erro">*</span>}</label>
            <input type="date" className={`ag-input ${erro && !data ? "ag-input--erro" : ""}`} value={data} onChange={e => { setData(e.target.value); setErro(false); }} />
          </div>
          <div className="ag-field">
            <label className="ag-label">Hora {erro && !hora && <span className="ag-erro">*</span>}</label>
            <input type="time" className={`ag-input ${erro && !hora ? "ag-input--erro" : ""}`} value={hora} onChange={e => { setHora(e.target.value); setErro(false); }} />
          </div>
        </div>
        <div className="ag-field">
          <label className="ag-label">Observação</label>
          <textarea className="ag-textarea" placeholder="Descreva o motivo do agendamento..." rows={3} value={obs} onChange={e => setObs(e.target.value)} />
        </div>
        <button className="ag-btn-salvar" onClick={salvar} style={salvo ? { backgroundColor: "#16A34A" } : {}}>
          {salvo ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="ag-btn-icon">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Agendado no calendário!
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="ag-btn-icon">
                <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3M16 3H8v8h8V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Salvar agendamento
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function fmtTs(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function RegistroCreditos({ cliente }: { cliente: ClienteItem }) {
  const historico: CreditoRecord[] = cliente.historicoCreditos ?? [];

  // Crédito ativo: derivado dos dados atuais do cliente
  const pagAtivos = (cliente.pagamentos ?? []).filter(p =>
    !cliente.creditoStartTimestamp || (p.id !== undefined && p.id >= cliente.creditoStartTimestamp)
  );
  const naoPagasAtivo = pagAtivos.filter(p => p.metodo === "Sem pagamento").length;
  const duracaoAtivo = cliente.creditoStartTimestamp
    ? Math.round((Date.now() - cliente.creditoStartTimestamp) / (1000 * 60 * 60 * 24))
    : 0;

  type CreditoAll = (CreditoRecord & { status: string });
  const creditoAtivo: CreditoAll = {
    dataInicio: cliente.creditoStartTimestamp ? fmtTs(cliente.creditoStartTimestamp) : "—",
    dataCancelamento: "—",
    valor: cliente.parcela * cliente.totalParcelas,
    parcelas: cliente.totalParcelas,
    pagas: cliente.parcelasPagas,
    naoPagas: naoPagasAtivo,
    juros: cliente.taxaJuros ?? 0,
    duracao: duracaoAtivo,
    status: "Ativo",
  };

  const todos: CreditoAll[] = [...historico, creditoAtivo];
  const [aberto, setAberto] = useState<number | null>(null);

  return (
    <div style={{ padding: "10px 12px 10px" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {todos.map((cr, i) => {
          const isAtivo = cr.status === "Ativo";
          const expanded = aberto === i;
          return (
            <div
              key={i}
              onClick={() => setAberto(expanded ? null : i)}
              style={{
                width: 44, height: 44, borderRadius: 8, cursor: "pointer",
                backgroundColor: isAtivo ? "#EFF6FF" : "#F1F5F9",
                border: `2px solid ${expanded ? (isAtivo ? "#2563EB" : "#10B981") : (isAtivo ? "#93c5fd" : "#CBD5E1")}`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                boxShadow: expanded ? "0 2px 8px rgba(37,99,235,0.18)" : "none",
                transition: "border-color 0.15s",
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: isAtivo ? "#1d4ed8" : "#475569", lineHeight: 1 }}>
                #{String(i + 1).padStart(2, "0")}
              </span>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", marginTop: 3,
                backgroundColor: isAtivo ? "#2563EB" : "#10B981",
              }} />
            </div>
          );
        })}
      </div>

      {aberto !== null && (() => {
        const cr = todos[aberto];
        const isAtivo = cr.status === "Ativo";
        return (
          <div style={{
            backgroundColor: "#fff", borderRadius: 8,
            border: `1.5px solid ${isAtivo ? "#93c5fd" : "#E2E8F0"}`,
            overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "5px 10px", backgroundColor: isAtivo ? "#EFF6FF" : "#F8FAFC",
              borderBottom: `1px solid ${isAtivo ? "#bfdbfe" : "#E2E8F0"}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isAtivo ? "#1d4ed8" : "#475569" }}>
                Crédito #{String(aberto + 1).padStart(2, "0")}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20,
                backgroundColor: isAtivo ? "#2563EB" : "#10B981", color: "#fff",
              }}>{cr.status}</span>
            </div>
            <div style={{ padding: "4px 10px 6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
              {[
                { l: "Juros", v: `${cr.juros}%` },
                { l: "Valor Total", v: `R$ ${cr.valor.toFixed(2)}` },
                { l: "Início", v: cr.dataInicio },
                { l: "Cancelamento", v: cr.dataCancelamento },
                { l: "Pagas", v: `${cr.pagas}x` },
                { l: "Não Pagas", v: `${cr.naoPagas}x` },
                { l: "Total Parcelas", v: `${cr.parcelas}x` },
                { l: "Duração", v: cr.duracao ? `${cr.duracao} dias` : "—" },
              ].map(({ l, v }) => (
                <div key={l} style={{ display: "flex", flexDirection: "column", padding: "2px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 9.5, color: "#9CA3AF", fontWeight: 500 }}>{l}</span>
                  <span style={{ fontSize: 11, color: "#1E293B", fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div style={{ textAlign: "center", paddingTop: 6 }}>
        <span style={{ fontSize: 10.5, color: "#9CA3AF" }}>
          {todos.length} crédito{todos.length !== 1 ? "s" : ""} registrado{todos.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

export function ClienteDetalheRenovacao({ cliente, onClose, onAddAgendamento }: { cliente: ClienteItem; onClose: () => void; onAddAgendamento: (a: Agendamento) => void }) {
  const [aba, setAba] = useState<"detalhes" | "registro" | "fotos" | "agendar">("detalhes");
  const pendentes = cliente.totalParcelas - cliente.parcelasPagas;

  return (
    <div className="cd-card" style={{ borderRadius: 0, boxShadow: "none", border: "none", maxWidth: "none" }}>
      <div className="cd-header">
        <div className="cd-status-bar">
          <div className={`cd-status-item cd-status-item--btn ${aba === "registro" ? "cd-status-item--ativo" : ""}`} onClick={() => setAba(aba === "registro" ? "detalhes" : "registro")}>
            <StatusBadge status="pago" ativo={aba === "registro"} />
            <span className="cd-status-label">registro</span>
          </div>
          <div className={`cd-status-item cd-status-item--btn ${aba === "fotos" ? "cd-status-item--ativo" : ""}`} onClick={() => setAba(aba === "fotos" ? "detalhes" : "fotos")}>
            <StatusBadge status="pago" ativo={aba === "fotos"} />
            <span className="cd-status-label">fotos</span>
          </div>
          <div className={`cd-status-item cd-status-item--btn ${aba === "agendar" ? "cd-status-item--ativo" : ""}`} onClick={() => setAba(aba === "agendar" ? "detalhes" : "agendar")}>
            <CalendarIcon />
            <span className="cd-status-label">agendar</span>
          </div>
        </div>
      </div>
      {aba === "detalhes" && (() => {
        const dataCriacao = new Date(2026, 2, 10); // 10/03/2026
        const dataInicio = new Date(dataCriacao); dataInicio.setDate(dataInicio.getDate() + 1);
        const dataEnc = new Date(dataInicio); dataEnc.setDate(dataEnc.getDate() + cliente.totalParcelas - 1);
        const fmt = (d: Date) => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
        return (
          <div className="cd-body">
            <InfoRow label="Nº de Identificação" value={`#${cliente.id}`} highlight />
            <InfoRow label="CPF" value={cliente.cpf || "—"} />
            <InfoRow label="Telefone" value={cliente.telefone} isPhone />
            <InfoRow label="Endereço" value={cliente.endereco} isAddress />
            <InfoRow label="Data do Empréstimo" value={fmt(dataCriacao)} highlight />
            <InfoRow label="Início dos Pagamentos" value={fmt(dataInicio)} />
            <InfoRow label="Encerramento do Crédito" value={fmt(dataEnc)} highlight />
            <InfoRow label="Quitado em" value={`${cliente.totalParcelas} dias`} />
          </div>
        );
      })()}
      {aba === "registro" && <RegistroCreditos cliente={cliente} />}
      {aba === "fotos" && <GaleriaFotos clienteId={cliente.id} />}
      {aba === "agendar" && <AgendarView onAddAgendamento={onAddAgendamento} nomeCliente={cliente.nome} />}
    </div>
  );
}

export function ClienteDetalhe({ cliente, onClose, onAddAgendamento }: { cliente: ClienteItem; onClose: () => void; onAddAgendamento: (a: Agendamento) => void }) {
  const [aba, setAba] = useState<"detalhes" | "pagamentos" | "fotos" | "agendar">("detalhes");

  const pendentes = cliente.totalParcelas - cliente.parcelasPagas;

  const todosPagamentos: Pagamento[] = cliente.pagamentos ?? [];
  const cutoff = cliente.creditoStartTimestamp ?? 0;
  const pagamentosCredito = cutoff
    ? todosPagamentos.filter(p => p.id >= cutoff)
    : todosPagamentos;
  const pagamentosOrdenados = [...pagamentosCredito].sort((a, b) => a.id - b.id);
  const pagamentos: Pagamento[] = pagamentosOrdenados
    .map((p, i) => ({ ...p, parcela: i + 1 }))
    .reverse();
  const atrasadas = pagamentosCredito.filter(p => p.metodo === "Sem pagamento").length;
  const visitas = pagamentosCredito.length;

  return (
    <div className="cd-card" style={{ borderRadius: 0, boxShadow: "none", border: "none", maxWidth: "none" }}>
      <div className="cd-header">
        <div className="cd-status-bar">
          <div className={`cd-status-item cd-status-item--btn ${aba === "pagamentos" ? "cd-status-item--ativo" : ""}`} onClick={() => setAba(aba === "pagamentos" ? "detalhes" : "pagamentos")}>
            <StatusBadge status="pago" ativo={aba === "pagamentos"} />
            <span className="cd-status-label">pagamentos</span>
          </div>
          <div className={`cd-status-item cd-status-item--btn ${aba === "fotos" ? "cd-status-item--ativo" : ""}`} onClick={() => setAba(aba === "fotos" ? "detalhes" : "fotos")}>
            <StatusBadge status="pago" ativo={aba === "fotos"} />
            <span className="cd-status-label">fotos</span>
          </div>
          <div className={`cd-status-item cd-status-item--btn ${aba === "agendar" ? "cd-status-item--ativo" : ""}`} onClick={() => setAba(aba === "agendar" ? "detalhes" : "agendar")}>
            <CalendarIcon />
            <span className="cd-status-label">agendar</span>
          </div>
        </div>
      </div>
      {aba === "detalhes" && (
        <div className="cd-body">
          <InfoRow label="Nº De Registro" value={`#${cliente.id}`} />
          <InfoRow label="Data Do Crédito" value="30/03/2026" highlight />
          <InfoRow label="CPF" value={cliente.cpf || "—"} />
          <InfoRow label="Valor" value={`R$ ${(cliente.parcela * cliente.totalParcelas).toFixed(2)}`} highlight />
          <InfoRow label="Parcelas Pendentes" value={String(pendentes)} />
          <InfoRow label="Atrasadas" value={String(atrasadas)} />
          <InfoRow label="Visitas" value={String(visitas)} />
          <InfoRow label="Telefone" value={cliente.telefone} isPhone />
          <InfoRow label="Frequência" value="DIÁRIO" highlight />
          <InfoRow label="Endereço" value={cliente.endereco} isAddress />
        </div>
      )}
      {aba === "pagamentos" && <ListaPagamentos pagamentos={pagamentos} />}
      {aba === "fotos" && <GaleriaFotos clienteId={cliente.id} />}
      {aba === "agendar" && <AgendarView onAddAgendamento={onAddAgendamento} nomeCliente={cliente.nome} />}
    </div>
  );
}
