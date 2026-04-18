import { useState } from "react";
import { useLocation } from "wouter";
import menuIcon from "@assets/windows_104558_1776473182467.webp";

const MAIN_TABS = ["Desempenho", "Liq. Diária", "Liq. Períodos", "Consolidados"];
const SUB_TABS = ["Vend. Diárias", "Pagamentos", "Vend. Novas", "Rec/Desp", "Clientes", "Agendados", "Roteirizar", "Notas", "GPS", "Relatórios"];

const vendedorData = {
  vendedor: "Rota Cred Bank -   Cod: 10600",
  dataInicio: "2026-04-17 00:41:52",
  dataCierre: "Sistema sem Fechar",
  dataAcesso: "2026-04-17 00:41:52",
  clientesIniciais: "20",
  clientesSincronizados: "1 Sincronizados / 20",
  clientesNovos: "0 (0/0)",
  pagamentoAdiado: "0",
  clientesCancelados: "0",
  totalClientes: "20",
  caixaInicial: "$ 2,979.00",
  carteiraInicial: "$ 12,460.00",
  carteiraPct: "100 %",
  recaudoPretendido: "$ 1,245.00",
  recaudoPct: "100 %",
  recaudoAtual: "$ 200.00",
  recaudoAtualPct: "16.1 %",
  pagamentos: "1",
  noPagamentos: "0",
  recaudoEfetivo: "$ 200.00",
  recaudoTransferencia: "$ 0.00",
  vendas: "$ 0.00",
  juros: "$ 0.00",
  ingressos: "+ 0.00",
  retiradas: "− 0.00",
  egresos: "− 0.00",
  caixaFinal: "$ 3,179.00",
  caixaFinalOk: false,
  carteiraFinal: "$ 12,460.00",
  carteiraFinalOk: false,
  sancao: "0.00",
  microSeguro: {
    ingressoSeguros: "$ 0.00",
    retiradaSeguros: "$ 0.00",
    caixaSeguros: "$ -250.00",
  },
};

function DataRow({ label, children, highlight = false }: { label: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-baseline py-0.5 text-xs border-b border-gray-100 min-h-[22px]">
      <span className="w-52 shrink-0 text-gray-600 pr-2">{label}:</span>
      <span className={`font-medium ${highlight ? "bg-cyan-500 text-white px-1 rounded text-[11px]" : "text-gray-800"}`}>{children}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [activeMain, setActiveMain] = useState("Liq. Diária");
  const [activeSub, setActiveSub] = useState("Vend. Diárias");

  const showContent = activeMain === "Liq. Diária" && activeSub === "Vend. Diárias";

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: "system-ui, sans-serif", background: "#f4f4f4" }}>

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between h-12 px-3 shrink-0" style={{ background: "#2d5474" }}>
        <img src={menuIcon} alt="Menu" className="h-8 w-8 object-contain select-none cursor-pointer" draggable={false} />
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 h-7 text-sm font-semibold rounded text-white" style={{ background: "#c0392b" }}>▶ Tutoriais</button>
          <button className="px-3 h-7 text-sm font-semibold rounded text-white" style={{ background: "#e67e22" }}>Admin</button>
          <button className="flex items-center gap-1 px-3 h-7 text-sm font-medium rounded" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>🔑 Alterar Senha</button>
          <button onClick={() => navigate("/")} className="flex items-center gap-1 px-3 h-7 text-sm font-medium rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>⏻ Sair</button>
        </div>
      </div>

      {/* ── MAIN TABS ROW ── */}
      <div className="flex items-end px-2 gap-1 pt-1 shrink-0" style={{ background: "#2d5474" }}>
        {MAIN_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveMain(tab)}
            className="px-6 h-10 text-sm font-medium transition-all rounded-t"
            style={{
              background: activeMain === tab ? "#2563eb" : "rgba(255,255,255,0.08)",
              color: activeMain === tab ? "#fff" : "rgba(255,255,255,0.65)",
              border: activeMain === tab ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.15)",
              borderBottom: "none",
            }}>
            {tab}
          </button>
        ))}
      </div>
      <div style={{ height: "2px", background: "#2563eb" }} className="shrink-0" />

      {/* ── SUB TABS ROW ── */}
      <div className="flex items-center gap-1 px-2 py-1 shrink-0" style={{ background: "#e8edf2" }}>
        {SUB_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveSub(tab)}
            className="px-4 h-9 text-sm font-medium transition-all rounded"
            style={{
              background: activeSub === tab ? "#2563eb" : "#fff",
              color: activeSub === tab ? "#fff" : "#444",
              border: activeSub === tab ? "1px solid #2563eb" : "1px solid #cdd3da",
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="flex items-center h-11 px-3 gap-2 shrink-0" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <button className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded" style={{ background: "#2563eb", color: "#fff" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white opacity-90"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          País
        </button>
        <button className="flex items-center justify-center w-8 h-8 rounded" style={{ background: "#16a34a", color: "#fff" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        </button>
        <button className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded" style={{ background: "#2563eb", color: "#fff" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white opacity-90"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          Vendedor
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white opacity-70"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          <span className="text-xs bg-white/25 rounded-full w-5 h-5 flex items-center justify-center font-bold">1</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded" style={{ background: "#2563eb", color: "#fff" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white opacity-90"><path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"/></svg>
          <span className="text-xs bg-white/25 rounded-full w-5 h-5 flex items-center justify-center font-bold">1</span>
        </button>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-hidden flex">

        {showContent ? (
          <>
            {/* LEFT: Tree */}
            <div className="w-52 shrink-0 border-r border-gray-200 bg-white overflow-y-auto text-xs">
              <div className="flex items-center gap-1 px-3 py-2 font-semibold text-gray-600 border-b border-gray-100">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-gray-500"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                Vendedores
              </div>
              {/* País */}
              <div className="px-2 py-1.5 flex items-center gap-1 text-gray-700 font-semibold cursor-pointer hover:bg-gray-50">
                <span className="text-base">🌐</span> BRASIL
              </div>
              {/* Cidade */}
              <div className="pl-5 py-1 flex items-center gap-1 text-gray-600 cursor-pointer hover:bg-gray-50">
                <span>📍</span> SAO LUIS
              </div>
              {/* Rota — ativa */}
              <div className="pl-8 py-1.5 flex items-center justify-between pr-2 cursor-pointer bg-blue-50 border-l-2 border-blue-500">
                <div className="flex items-center gap-1 text-blue-700">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-blue-500"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  Rota Cred Bank -
                </div>
                <span className="text-[10px] bg-cyan-500 text-white px-1 rounded font-medium">2026-04-17</span>
              </div>
            </div>

            {/* CENTER: Data */}
            <div className="flex-1 overflow-y-auto bg-white px-4 pt-3 pb-4">
              <DataRow label="Vendedor">
                <span className="flex items-center gap-2">
                  {vendedorData.vendedor}
                  <span className="ml-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer">XLS</span>
                </span>
              </DataRow>
              <DataRow label="Data de Início de Cobrança" highlight>{vendedorData.dataInicio}</DataRow>
              <DataRow label="Data de Fechamento de Cobrança">{vendedorData.dataCierre}</DataRow>
              <DataRow label="Último Acesso Móvel">{vendedorData.dataAcesso}</DataRow>
              <DataRow label="Clientes Iniciais">
                {vendedorData.clientesIniciais} &nbsp;<span className="text-gray-400 font-normal">( {vendedorData.clientesSincronizados} )</span>
              </DataRow>
              <DataRow label="Clientes Novos/Renovados">{vendedorData.clientesNovos}</DataRow>
              <DataRow label="Pagamento Adiado Próx. Dia">{vendedorData.pagamentoAdiado}</DataRow>
              <DataRow label="Clientes Cancelados">{vendedorData.clientesCancelados}</DataRow>
              <DataRow label="Total de Clientes">{vendedorData.totalClientes}</DataRow>
              <DataRow label="Caixa Inicial">{vendedorData.caixaInicial}</DataRow>
              <DataRow label="Carteira Inicial">
                {vendedorData.carteiraInicial} &nbsp;<span className="text-gray-400 font-normal">( {vendedorData.carteiraPct} )</span>
              </DataRow>
              <DataRow label="Recebimento Previsto do Dia">
                {vendedorData.recaudoPretendido} &nbsp;<span className="text-gray-400 font-normal">( {vendedorData.recaudoPct} )</span>
              </DataRow>
              <DataRow label="Recebimento Atual do Dia">
                <span className="flex items-center gap-2">
                  {vendedorData.recaudoAtual}
                  <span className="text-gray-500 font-normal">( {vendedorData.recaudoAtualPct} )</span>
                  <span className="text-gray-500 font-normal">Pagamentos: <strong className="text-gray-800">{vendedorData.pagamentos}</strong></span>
                  <span className="text-gray-500 font-normal">Não Pag: <strong className="text-red-500">{vendedorData.noPagamentos}</strong></span>
                </span>
              </DataRow>
              <DataRow label="Recebimento por Tipo de Pagto">
                Efetivo : ( <span className="text-red-500">{vendedorData.recaudoEfetivo}</span> )&nbsp; Transferência : ( {vendedorData.recaudoTransferencia} )
              </DataRow>
              <DataRow label="Vendas">
                {vendedorData.vendas} &nbsp;<span className="text-gray-400 font-normal">( Juros {vendedorData.juros} )</span>
              </DataRow>
              <DataRow label="Ingressos"><span className="text-green-600">{vendedorData.ingressos}</span></DataRow>
              <DataRow label="Retiradas"><span className="text-orange-500">{vendedorData.retiradas}</span></DataRow>
              <DataRow label="Egresos">{vendedorData.egresos}</DataRow>
              <DataRow label="Caixa Final">
                <span className="flex items-center gap-1">
                  {!vendedorData.caixaFinalOk && <span className="text-red-500">●</span>}
                  {vendedorData.caixaFinal}
                </span>
              </DataRow>
              <DataRow label="Carteira Final">
                <span className="flex items-center gap-1">
                  {!vendedorData.carteiraFinalOk && <span className="text-red-500">●</span>}
                  {vendedorData.carteiraFinal} &nbsp;<span className="text-gray-400 font-normal">( Sanção {vendedorData.sancao} )</span>
                </span>
              </DataRow>
            </div>

            {/* RIGHT: Action buttons + Micro Seguro */}
            <div className="w-48 shrink-0 border-l border-gray-200 bg-gray-50 flex flex-col gap-1 p-2 overflow-y-auto">
              {[
                { label: "⚙ Configurações", color: "#6b7280" },
                { label: "📊 Relatório Monitor", color: "#6b7280" },
                { label: "👥 Lista Clientes", color: "#6b7280" },
                { label: "🔒 Bloquear Unidade", color: "#6b7280" },
                { label: "💰 M. Juros", color: "#6b7280" },
                { label: "📈 Ganância ( $0.00 )", color: "#6b7280" },
              ].map((btn) => (
                <button key={btn.label}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium rounded text-white hover:opacity-90 transition-opacity"
                  style={{ background: btn.color }}>
                  {btn.label}
                </button>
              ))}

              {/* Micro Seguro */}
              <div className="mt-2 border border-gray-200 rounded bg-white p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-gray-700">MICRO SEGURO</span>
                  <span className="text-[10px] bg-red-500 text-white px-1 rounded">●</span>
                </div>
                <div className="text-[11px] text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>Ingresso Seguros:</span><span className="font-medium">$ 0.00</span></div>
                  <div className="flex justify-between"><span>Retirada Seguros:</span><span className="font-medium">$ 0.00</span></div>
                  <div className="flex justify-between"><span>Caixa Seguros:</span><span className="font-medium text-red-500">( $ -250.00 )</span></div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white">
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-20">📊</div>
              <p className="text-gray-400 text-sm">Nenhum dado encontrado para os filtros selecionados.</p>
              <p className="text-gray-300 text-xs mt-1">Selecione um vendedor ou ajuste os filtros acima.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
