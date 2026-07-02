import { useState } from "react";

type TipoLancamento = "despesa" | "rendimento";

const conceitosRendimento = [
  "Aporte ao Caixa", "Recuperação de Crédito", "Outros Rendimentos",
];
const conceitosDespesa = [
  "Ajuste de Caixa", "Alimentação", "Adiantamento Salarial",
  "Manutenção de Transporte", "Aluguel", "Energia", "Água",
  "Troca de Óleo", "Celular", "Comissões", "Diferença de Caixa",
  "Desconto de Multa", "Combustível", "Mensalidade do Sistema",
  "Multas", "Outros", "Pagamento de Supervisor", "Outra Cobrança",
  "Recargas", "Retirada de Caixa", "Salário", "Diárias de Viagem",
  "Internet", "Comissão de Cobrador", "Bonificação de Funcionário",
  "Material de Limpeza", "Manutenção de Veículos", "Rastreamento Veicular",
];

const ChevronDown = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const ArrowDown = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);
const ArrowUp = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);
const Check = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);
const Spin = () => (
  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export function LancamentoFinanceiro({ onAddDespesa, onAddRendimento, onSalvo }: { onAddDespesa?: (categoria: string, valor: number, observacao: string) => void; onAddRendimento?: (categoria: string, valor: number, observacao: string) => void; onSalvo?: () => void }) {
  const [tipo, setTipo] = useState<TipoLancamento>("despesa");
  const [conceito, setConceito] = useState("");
  const [valor, setValor] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const conceitos = tipo === "rendimento" ? conceitosRendimento : conceitosDespesa;

  const handleValor = (e: React.ChangeEvent<HTMLInputElement>) =>
    setValor(e.target.value.replace(/\D/g, ""));

  const formatBRL = (raw: string) =>
    raw ? (parseInt(raw) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

  const handleSalvar = async () => {
    if (!conceito || !valor) return;
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 900));
    const valorNum = parseInt(valor) / 100;
    if (tipo === "despesa") onAddDespesa?.(conceito, valorNum, observacoes);
    else onAddRendimento?.(conceito, valorNum, observacoes);
    setSalvando(false);
    setSalvo(true);
    onSalvo?.();
    setTimeout(() => { setSalvo(false); setConceito(""); setValor(""); setObservacoes(""); }, 2000);
  };

  const canSave = conceito && valor && !salvando;

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80, background: "#f0f2f5" }}>
      <div className="w-full max-w-[390px] mx-auto px-3 pt-3 space-y-2.5">

        {/* TIPO */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-600 overflow-hidden">
          <div className="px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-blue-600 mb-1.5">Tipo de Lançamento</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setTipo("despesa"); setConceito(""); }}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold transition-all duration-200"
                style={{
                  background: tipo === "despesa" ? "#dc2626" : "#fef2f2",
                  color: tipo === "despesa" ? "#fff" : "#dc2626",
                  border: "1.5px solid #dc2626",
                  boxShadow: tipo === "despesa" ? "0 2px 8px rgba(220,38,38,0.35)" : "none",
                }}
              >
                <ArrowDown /> Despesa
              </button>
              <button
                onClick={() => { setTipo("rendimento"); setConceito(""); }}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold transition-all duration-200"
                style={{
                  background: tipo === "rendimento" ? "#16a34a" : "#f0fdf4",
                  color: tipo === "rendimento" ? "#fff" : "#16a34a",
                  border: "1.5px solid #16a34a",
                  boxShadow: tipo === "rendimento" ? "0 2px 8px rgba(22,163,74,0.35)" : "none",
                }}
              >
                <ArrowUp /> Rendimento
              </button>
            </div>
          </div>
        </div>

        {/* VALORES */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-amber-400 overflow-hidden">
          <div className="px-3 py-2 space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500">Valores</p>

            <div className="flex gap-2">
              {/* Categoria */}
              <div className="flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-600 mb-0.5">
                  Categoria <span className="text-red-400">*</span>
                </p>
                <div className="relative border rounded-md transition-all duration-200"
                  style={{ borderColor: "rgba(245,158,11,0.55)", background: conceito ? "#fffbf0" : "#f5f5f5" }}>
                  <select
                    value={conceito}
                    onChange={(e) => setConceito(e.target.value)}
                    className="w-full appearance-none bg-transparent px-2 py-1.5 text-[11px] focus:outline-none cursor-pointer"
                    style={{ color: conceito ? "#111827" : "#9ca3af" }}
                  >
                    <option value="">selecione</option>
                    {conceitos.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <ChevronDown />
                  </span>
                </div>
              </div>

              {/* Valor */}
              <div className="w-36">
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-600 mb-0.5">
                  Valor <span className="text-red-400">*</span>
                </p>
                <div className="border rounded-md transition-all duration-200"
                  style={{ borderColor: "rgba(245,158,11,0.55)", background: "#fffbf0" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatBRL(valor) ? `R$ ${formatBRL(valor)}` : ""}
                    onChange={handleValor}
                    placeholder="R$ 0,00"
                    className="w-full bg-transparent px-2 py-1.5 text-[12px] font-black focus:outline-none"
                    style={{ color: valor ? "#111827" : "#9ca3af" }}
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-gray-600 mb-0.5">Observações</p>
              <div className="border rounded-md transition-all bg-[#f5f5f5]" style={{ borderColor: "rgba(245,158,11,0.55)" }}>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione uma observação..."
                  rows={2}
                  className="w-full bg-transparent px-2 py-1.5 text-[11px] text-gray-700 placeholder-gray-300 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Salvar */}
            <div className="flex justify-end border-t border-gray-100 pt-1.5">
              <button
                onClick={handleSalvar}
                disabled={!canSave}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: salvo ? "#16a34a" : canSave ? "#1e2d3d" : "#d1d5db",
                  color: canSave ? "#fff" : "#9ca3af",
                  boxShadow: canSave ? "0 2px 6px rgba(30,45,61,0.25)" : "none",
                }}
              >
                {salvando ? <><Spin /> Salvando...</>
                  : salvo ? <><Check /> Salvo!</>
                  : <><Check /> Salvar</>}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
