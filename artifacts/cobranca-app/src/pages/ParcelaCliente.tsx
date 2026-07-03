import { useState, useRef, useEffect } from "react";

const PAYMENT_METHODS = [
  { id: 1, label: "Dinheiro" },
  { id: 2, label: "PIX" },
];

type Cliente = {
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
  creditoStartTimestamp?: number;
  pagamentos?: { id: number; data: string; parcela: number; valor: number; metodo: string }[];
};

function calcAtrasadas(pagamentos?: { id: number; metodo: string; data: string }[], creditoStartTimestamp?: number): number {
  if (!pagamentos?.length) return 0;
  const hoje = new Date().toISOString().slice(0, 10);
  const cutoff = creditoStartTimestamp ?? 0;
  return pagamentos.filter(p => p.id >= cutoff && p.metodo === "Sem pagamento" && p.data <= hoje).length;
}

function MiniLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wide">{children}</span>;
}

function ValueBox({ label, value, highlight, bold }: {
  label: string; value: string;
  highlight?: "green" | "yellow" | "red"; bold?: boolean;
}) {
  const bg = {
    green: "bg-gradient-to-r from-[#2E7D32] to-[#43A047] text-white border-transparent",
    yellow: "bg-[#FFF8E1] text-[#E65100] border-[#FFE082]",
    red: "bg-[#FFEBEE] text-[#C62828] border-[#EF9A9A]",
  }[highlight ?? ""] ?? "bg-gray-50 text-[#1B2236] border-gray-200";

  return (
    <div className="flex flex-col gap-0.5">
      <MiniLabel>{label}</MiniLabel>
      <div className={`border rounded-lg px-2 py-1.5 text-xs ${bold ? "font-bold" : "font-medium"} ${bg}`}>
        {value}
      </div>
    </div>
  );
}

export function ParcelaCliente({ cliente, onBack, onSaved }: { cliente: Cliente; onBack: () => void; onSaved?: (valor: number, metodo: "Parcela" | "Abono" | "Sem pagamento", forma: "Dinheiro" | "PIX") => void }) {
  const [paymentType, setPaymentType] = useState<"parcela" | "abono" | "sem">("parcela");
  const [valorParcela, setValorParcela] = useState(cliente.parcela);
  const [valorParcelaStr, setValorParcelaStr] = useState(String(cliente.parcela));
  const [numeroParcela, setNumeroParcela] = useState(1);
  const [observacao, setObservacao] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success">("idle");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saldoAtual, setSaldoAtual] = useState(
    cliente.parcela * (cliente.totalParcelas - cliente.parcelasPagas)
  );
  const [saldoModal, setSaldoModal] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalCredito = cliente.parcela * cliente.totalParcelas;
  const penalidade = 0;
  const atrasadas = calcAtrasadas(cliente.pagamentos, cliente.creditoStartTimestamp);
  const novoSaldo =
    paymentType === "parcela" || paymentType === "abono" ? Math.max(0, saldoAtual - valorParcela)
    : saldoAtual;
  const progresso = Math.round((cliente.parcelasPagas / cliente.totalParcelas) * 100);
  const parcelasPendentes = cliente.totalParcelas - cliente.parcelasPagas;
  const nomeExibicao = cliente.nome.split(" ").slice(0, 3).join(" ");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSave() {
    if (saveState !== "idle") return;
    setSaveState("saving");
    setTimeout(() => {
      setSaveState("success");
      const saldoFinal = (paymentType === "parcela" || paymentType === "abono") ? Math.max(0, saldoAtual - valorParcela) : saldoAtual;
      setSaldoModal(saldoFinal);
      setShowSuccessModal(true);
      if (paymentType === "parcela" || paymentType === "abono") setSaldoAtual(saldoFinal);
      setTimeout(() => { setSaveState("idle"); setShowSuccessModal(false); const metodo = paymentType === "sem" ? "Sem pagamento" : paymentType === "abono" ? "Abono" : "Parcela"; const forma = selectedMethod.label as "Dinheiro" | "PIX"; if (onSaved) onSaved(paymentType === "sem" ? 0 : valorParcela, metodo, forma); else onBack(); }, 1500);
    }, 1400);
  }

  return (
    <div style={{
      width: "100%", maxWidth: 390, margin: "0 auto",
      height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      position: "relative", overflow: "hidden",
      backgroundColor: "#F4F6FB",
    }}>

      {/* Success modal */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white w-full rounded-2xl p-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <polyline points="4,12 9,17 20,7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-bold text-[#1B2236] text-sm mb-1">Parcela Registrada!</h3>
            <p className="text-[11px] text-gray-500 mb-0.5">Parcela nº {numeroParcela} de <span className="font-semibold">{nomeExibicao}</span></p>
            <p className="text-[11px] text-gray-500">Novo saldo: <span className="font-bold text-green-600">R$ {(saldoModal ?? novoSaldo).toFixed(2)}</span></p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg, #3A5F82 0%, #4A6F8E 100%)", padding: "16px 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 42, height: 42, background: "linear-gradient(145deg, #B91C1C, #EF4444)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(185,28,28,0.5)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>MN</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: 0.5, lineHeight: 1.2 }}>Parcela do Cliente</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2 }}>Sistema de Cobrança</div>
          </div>
        </div>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 10, cursor: "pointer", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12l6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 16px" }}>

        {/* Client Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2.5 mb-2">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h2 className="font-extrabold text-[#1B2236] text-xs leading-tight truncate">{cliente.nome}</h2>
            <span className="bg-blue-50 text-[#1B2236] text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap flex-shrink-0">
              Nº {cliente.consecutivo ?? "--"}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#3A5F82] to-[#4A6F8E] rounded-full transition-all"
                style={{ width: `${progresso}%` }} />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[9px] text-green-600 font-semibold">{cliente.parcelasPagas} pagas</span>
              <span className="text-[9px] text-gray-400">{parcelasPendentes} restantes</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-1 mb-2">
            {[
              { icon: "✓", iconColor: "#16A34A", value: String(cliente.parcelasPagas), label: "Pagas", color: "text-green-700" },
              { icon: "⏱", iconColor: "#D97706", value: String(parcelasPendentes), label: "Pendentes", color: "text-amber-700" },
              { icon: "!", iconColor: "#DC2626", value: String(atrasadas), label: "Atrasadas", color: "text-red-600" },
              { icon: "R$", iconColor: "#3B5998", value: String(Math.round(saldoAtual)), label: "Saldo", color: "text-blue-700" },
            ].map(({ icon, iconColor, value, label, color }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-1.5 flex flex-col items-center gap-0.5">
                <span style={{ fontSize: 9, color: iconColor, fontWeight: 700 }}>{icon}</span>
                <p className={`text-xs font-bold leading-none ${color}`}>{value}</p>
                <p className="text-[8px] font-bold text-gray-600 text-center leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Phone + WhatsApp */}
          <div className="border-t border-gray-100 pt-1.5 flex gap-2">
            <button onClick={() => window.open(`tel:${cliente.telefone.replace(/\D/g, "")}`, "_self")}
              className="flex-1 flex items-center gap-1.5 hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.08 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-.97a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <p className="text-[8px] font-bold text-gray-600 leading-tight">Telefone</p>
                <p className="text-[9px] font-bold text-[#1B2236] truncate">{cliente.telefone}</p>
              </div>
            </button>

            <button
              onClick={() => window.open(`https://wa.me/${cliente.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${nomeExibicao}, passando para lembrar sobre a parcela em aberto de R$ ${cliente.parcela.toFixed(2)}. Podemos combinar o pagamento?`)}`, "_blank")}
              className="flex-1 flex items-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-2 py-1 transition-colors">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.374 0 0 5.374 0 12c0 2.117.549 4.107 1.51 5.836L.057 23.882l6.204-1.629C7.9 23.107 9.899 23.998 12 24c6.626 0 12-5.374 12-12S18.626 0 12 0zm0 22c-1.89 0-3.668-.51-5.193-1.4l-.372-.221-3.862 1.013 1.031-3.756-.242-.387C2.517 15.669 2 13.9 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <p className="text-[8px] text-green-600 leading-tight font-bold">Cobrar via</p>
                <p className="text-[9px] font-bold text-green-700">WhatsApp</p>
              </div>
            </button>
          </div>
        </div>

        {/* Payment Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2.5 mb-2">
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tipo de Pagamento</p>
          <div className="flex gap-1.5">
            {([
              { val: "parcela", label: "Parcela" },
              { val: "abono", label: "Abono" },
              { val: "sem", label: "Sem Pagamento" },
            ] as const).map(({ val, label }) => (
              <button key={val} onClick={() => { setPaymentType(val); if (val === "abono") { setValorParcela(0); setValorParcelaStr(""); } else if (val === "parcela") { const n = numeroParcela === 0 ? 1 : numeroParcela; setNumeroParcela(n); setValorParcela(n * cliente.parcela); setValorParcelaStr(String(parseFloat((n * cliente.parcela).toFixed(2)))); } else if (val === "sem") { setValorParcela(0); setValorParcelaStr("0"); setNumeroParcela(0); } }}
                className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all border active:scale-95 ${
                  paymentType === val
                    ? "bg-[#1B2236] text-white border-[#1B2236] shadow"
                    : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Fields */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2.5 mb-2">
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Valores</p>
          <div className="grid grid-cols-2 gap-2">
            <ValueBox label="Total Crédito" value={`R$ ${totalCredito.toFixed(2)}`} />
            <ValueBox label="Saldo Atual" value={`R$ ${saldoAtual.toFixed(2)}`} highlight="yellow" />

            <div className="flex flex-col gap-0.5">
              <MiniLabel>Valor da Parcela</MiniLabel>
              <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden focus-within:border-[#1B2236] transition-colors">
                <span className="pl-2 text-xs text-gray-400">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorParcelaStr}
                  disabled={paymentType !== "abono"}
                  onFocus={() => setValorParcelaStr("")}
                  onBlur={() => {
                    const parsed = parseFloat(valorParcelaStr.replace(",", "."));
                    const final = isNaN(parsed) || parsed <= 0 ? cliente.parcela : Math.min(parsed, saldoAtual);
                    setValorParcela(final);
                    setValorParcelaStr(String(final));
                  }}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.,]/g, "");
                    setValorParcelaStr(raw);
                    const parsed = parseFloat(raw.replace(",", "."));
                    if (!isNaN(parsed) && parsed > 0) setValorParcela(Math.min(parsed, saldoAtual));
                  }}
                  className="flex-1 bg-transparent px-1 py-1.5 text-xs font-bold text-[#1B2236] focus:outline-none disabled:text-[#1B2236] w-0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <MiniLabel>Número da Parcela</MiniLabel>
              {paymentType === "sem" ? (
                <div className="border border-gray-200 rounded-lg bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-400">0</div>
              ) : (
                <div className="relative border border-gray-200 rounded-lg bg-gray-50 overflow-hidden focus-within:border-[#1B2236] transition-colors">
                  <select
                    value={numeroParcela}
                    onChange={(e) => {
                      const n = parseInt(e.target.value);
                      const total = parseFloat((n * cliente.parcela).toFixed(2));
                      setNumeroParcela(n);
                      setValorParcela(total);
                      setValorParcelaStr(String(total));
                    }}
                    className="w-full appearance-none bg-transparent px-2 py-1.5 text-xs font-medium text-[#1B2236] focus:outline-none"
                  >
                    {Array.from({ length: Math.max(cliente.totalParcelas, numeroParcela, 60) }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              )}
            </div>

            <ValueBox label="Novo Saldo" value={`R$ ${novoSaldo.toFixed(2)}`} highlight="green" bold />
            <ValueBox label="Penalidade" value={`R$ ${penalidade.toFixed(2)}`} highlight={penalidade > 0 ? "red" : undefined} />
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2.5 mb-2 relative z-20" ref={dropdownRef}>
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Forma de Pagamento</p>
          <button onClick={() => setDropdownOpen(v => !v)}
            className={`w-full flex items-center gap-2 border rounded-lg px-2.5 py-1.5 transition-all text-xs ${
              dropdownOpen ? "border-[#1B2236] bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"
            }`}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="2" stroke="#1B2236" strokeWidth="1.4" />
              <line x1="1" y1="6.5" x2="15" y2="6.5" stroke="#1B2236" strokeWidth="1.4" />
            </svg>
            <span className="text-[#1B2236] font-medium flex-1 text-left">{selectedMethod.id} - {selectedMethod.label}</span>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <path d="M3 5l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute left-2.5 right-2.5 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-30">
              {PAYMENT_METHODS.map((method) => (
                <button key={method.id}
                  onClick={() => { setSelectedMethod(method); setDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                    selectedMethod.id === method.id ? "bg-[#1B2236] text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                    selectedMethod.id === method.id ? "border-white" : "border-gray-300"
                  }`}>{method.id}</span>
                  <span className="font-medium">{method.label}</span>
                  {selectedMethod.id === method.id && (
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="ml-auto">
                      <polyline points="2,7 5.5,10.5 12,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Observations + Save */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2.5">
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mb-1">Observações</p>
          <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 resize-none focus:outline-none focus:border-[#1B2236] transition-colors mb-2"
            rows={2} placeholder="Adicione uma observação..." />

          <button onClick={handleSave} disabled={saveState !== "idle"}
            className={`w-full rounded-lg py-2.5 flex items-center justify-center gap-2 shadow transition-all active:scale-[0.98] ${
              saveState === "success" ? "bg-green-600" : "bg-[#1B2236] hover:bg-[#12182B]"
            } disabled:opacity-90`}>
            {saveState === "saving" && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                <path d="M10 2a8 8 0 0 1 8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            {saveState === "success" && (
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <polyline points="4,10 8,14 16,6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {saveState === "idle" && (
              <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <span className="text-white font-bold text-xs tracking-widest uppercase">
              {saveState === "saving" ? "Salvando..." : saveState === "success" ? "Salvo!" : "Salvar"}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
