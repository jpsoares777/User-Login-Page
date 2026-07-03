import { TrendingUp, Users, AlertCircle, Trash2 } from "lucide-react";

export interface Emprestimo {
  id: number;
  nomeCliente: string;
  diario: boolean;
  frequencia?: string;
  criadoEm: string;
  valorEmprestado: number;
  valorParcela: number;
  taxaJuros: number;
  quantidadeParcelas: number;
  pagamentoAdiantado?: boolean;
  telefone?: string;
  cpf?: string;
  endereco?: string;
  cep?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  renovacao?: boolean;
  clienteId?: number;
  consecutivo?: string;
}

export const emprestimentosIniciais: Emprestimo[] = [];

function formatMoney(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  lista: Emprestimo[];
  onDelete: (id: number) => void;
  onBack: () => void;
}

export function EmprestimosDoDia({ lista = [], onDelete, onBack }: Props) {
  const totalEmprestado = lista.reduce((s, e) => s + e.valorEmprestado, 0);
  const totalClientes = lista.length;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#eef1f5", overflowY: "auto", paddingBottom: 80 }}>

      {/* ===== CARDS RESUMO ===== */}
      <div style={{ padding: "6px 12px 0", display: "flex", gap: 8, flexShrink: 0 }}>
        <div style={{
          flex: 1, background: "#fff",
          border: "1px solid #d1fae5", borderRadius: 14,
          padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 2px 8px rgba(16,185,129,0.10)",
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TrendingUp size={13} color="#10b981" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>Total Emprestado</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#047857" }}>{formatMoney(totalEmprestado)}</p>
          </div>
        </div>
        <div style={{
          background: "#fff", border: "1px solid #dbeafe", borderRadius: 14,
          padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 2px 8px rgba(59,130,246,0.10)",
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={13} color="#3b82f6" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>Clientes</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1d4ed8" }}>{totalClientes}</p>
          </div>
        </div>
      </div>

      {/* ===== LISTA ===== */}
      <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {lista.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "#9ca3af" }}>
            <AlertCircle size={36} style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13, margin: 0 }}>Nenhum empréstimo registrado hoje.</p>
          </div>
        ) : (
          lista.map(emp => (
            <div key={emp.id} style={{
              background: "#fff", borderRadius: 14,
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)", overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px 9px", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {emp.nomeCliente}
                  </p>
                  {emp.consecutivo && (
                    <p style={{ margin: "1px 0 0", fontSize: 9, fontWeight: 600, color: "#6b7280", fontFamily: "monospace", letterSpacing: 0.3 }}>
                      Nº {emp.consecutivo}
                    </p>
                  )}
                </div>
                <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: emp.diario ? "#dbeafe" : emp.frequencia === "Semanal" ? "#fef3c7" : "#ede9fe", color: emp.diario ? "#2563eb" : emp.frequencia === "Semanal" ? "#d97706" : "#7c3aed" }}>
                  {emp.frequencia ?? (emp.diario ? "Diário" : "Mensal")}
                </span>
                <span style={{ fontSize: 9, color: "#9ca3af", flexShrink: 0 }}>{formatTime(emp.criadoEm)}</span>
                <button onClick={() => onDelete(emp.id)} style={{ background: "#fee2e2", border: "1px solid #fca5a5", cursor: "pointer", padding: "3px 7px", borderRadius: 6, color: "#dc2626", display: "flex", alignItems: "center", gap: 3, flexShrink: 0, fontWeight: 600, fontSize: 10 }}>
                  <Trash2 size={11} />
                  Excluir
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
                {[
                  { label: "Valor",    value: formatMoney(emp.valorEmprestado), color: "#111827", bold: true },
                  { label: "Parcela",  value: formatMoney(emp.valorParcela),    color: "#374151", bold: false },
                  { label: "Juros",    value: `${emp.taxaJuros}%`,              color: "#b45309", bold: true },
                  { label: "Parcelas", value: `${emp.quantidadeParcelas}×`,     color: "#374151", bold: true },
                ].map((c, i, arr) => (
                  <div key={c.label} style={{ padding: "10px 14px", borderRight: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{c.label}</p>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: c.bold ? 700 : 500, color: c.color }}>{c.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
