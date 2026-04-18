import { useState } from "react";
import { useLocation } from "wouter";
import menuIcon from "@assets/windows_104558_1776473182467.webp";

const MAIN_TABS = ["Desempenho", "Liq. Diária", "Liq. Períodos", "Consolidados"];
const SUB_TABS = ["Vend. Diárias", "Pagamentos", "Vend. Novas", "Rec/Desp", "Clientes", "Agendados", "Roteirizar", "Notas", "GPS", "Relatórios"];

function Row({ label, children, bold }: { label: string; children: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center border-b border-gray-100" style={{ minHeight: "22px", fontSize: "12px", paddingLeft: "350px" }}>
      <span className={`shrink-0 pr-3 py-0.5 text-gray-800 whitespace-nowrap ${bold ? "font-bold" : "font-normal"}`} style={{ width: "200px" }}>{label}:</span>
      <span className={`px-2 py-0.5 flex items-center gap-1 flex-wrap leading-tight ${bold ? "font-bold text-gray-900" : "text-gray-700"}`}>{children}</span>
    </div>
  );
}

const CalIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-gray-400 shrink-0">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
  </svg>
);
const PersonIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-gray-400 shrink-0">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

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
        {/* spacer pushes funnel to right */}
        <div className="flex-1" />
        <button className="flex items-center justify-center w-9 h-8 rounded" style={{ background: "#2563eb", color: "#fff" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"/></svg>
        </button>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-hidden flex">
        {showContent ? (
          <>
            {/* LEFT: Tree */}
            <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
              {/* BRASIL */}
              <div className="px-3 py-2 flex items-center gap-1.5 text-gray-800 font-bold text-sm cursor-pointer hover:bg-gray-50">
                {/* person-add icon */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                {/* globe icon */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                BRASIL
              </div>
              {/* SAO LUIS */}
              <div className="pl-6 py-2 flex items-center gap-1.5 text-gray-600 text-sm cursor-pointer hover:bg-gray-50">
                {/* minus-circle icon */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>
                {/* pin/location icon */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-400 shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                SAO LUIS
              </div>
              {/* Rota Cred Bank */}
              <div className="pl-12 py-2 flex items-center pr-2 cursor-pointer bg-blue-50 border-l-2 border-blue-500">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0 mr-1.5"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <span className="text-gray-700 text-sm whitespace-nowrap">Rota Cred Bank -</span>
                <span className="flex-1 ml-2 text-center text-[11px] bg-green-500 text-white py-0.5 rounded font-medium">2026-04-17</span>
              </div>
            </div>

            {/* CENTER: Flat data rows */}
            <div className="flex-1 overflow-y-auto bg-white border-r border-gray-200">
              {/* Filter indicator row */}
              <div className="flex items-center py-0.5 border-b border-gray-200 bg-gray-50" style={{ paddingLeft: "350px" }}>
                <button className="flex items-center justify-center w-5 h-5 rounded" style={{ background: "#2563eb" }}>
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"/></svg>
                </button>
              </div>
              <Row label="Vendedor">
                Rota Cred Bank - &nbsp; Cod: 10600
                <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer">XLS</span>
              </Row>
              <Row label="Data de Início de Cobrança">
                <CalIcon />
                <span className="bg-cyan-500 text-white px-1.5 rounded text-[11px] font-medium">2026-04-17 00:41:52</span>
              </Row>
              <Row label="Data de Fechamento de Cobrança">
                <CalIcon /> Sistema sem Fechar
              </Row>
              <Row label="Último Acesso Móvel">
                <CalIcon /> 2026-04-17 00:41:52
              </Row>
              <Row label="Clientes Iniciais">
                <PersonIcon /> 20 &nbsp;<span className="text-gray-400">( 1 Sincronizados / 20 )</span>
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-blue-400 cursor-pointer"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
              </Row>
              <Row label="Clientes Novos/Renovados">
                <PersonIcon /> 0 <span className="text-gray-400">(0/0)</span>
              </Row>
              <Row label="Pag. Adiado Próx. Dia">
                <PersonIcon /> 0
              </Row>
              <Row label="Clientes Cancelados">
                <PersonIcon /> 0
              </Row>
              <Row label="Total de Clientes">
                <PersonIcon /> 20
              </Row>
              <Row label="Caixa Inicial" bold>$ 2.979,00</Row>
              <Row label="Carteira Inicial" bold>$ 12.660,00</Row>
              <Row label="Recebimento Previsto do Dia">$ 1.245,00 &nbsp;<span className="text-gray-400">( 100 % )</span></Row>
              <Row label="Recebimento Atual do Dia">
                $ 200,00 &nbsp;<span className="text-gray-400">( 16,1 % )</span>
                &nbsp; Pagos: <strong className="text-gray-800">1</strong>
                &nbsp; No Pagos: <strong className="text-red-500">0</strong>
              </Row>
              <Row label="Recebimento por Tipo Pagto">
                $ &nbsp;Efetivo : ( <span className="text-red-500">200,00</span> ) &nbsp; Transferência : ( <span className="text-red-500">0,00</span> )
              </Row>
              <Row label="Vendas">
                $ 0,00 &nbsp;<span className="text-gray-400">( Interes $ 0,00 )</span>
              </Row>
              <Row label="Ingressos"><span className="text-blue-600 font-bold">+</span> 0,00</Row>
              <Row label="Retiradas"><span className="text-gray-500 font-bold">−</span> 0,00</Row>
              <Row label="Egresos"><span className="text-gray-500 font-bold">−</span> 0,00</Row>
              <Row label="Caixa Final" bold>
                $ 3.179,00
                <span className="text-red-500 text-base leading-none cursor-pointer" title="Info">❓</span>
              </Row>
              <Row label="Carteira Final" bold>
                $ 12.460,00 &nbsp;<span className="font-normal text-gray-600">( Sanção 0,00 )</span>
                <span className="text-red-500 text-base leading-none cursor-pointer" title="Info">❓</span>
              </Row>
            </div>

            {/* RIGHT: Action buttons + Micro Seguro */}
            <div className="w-48 shrink-0 bg-gray-50 flex flex-col gap-1.5 p-2 overflow-y-auto">
              {[
                "⚙ Configurações",
                "📊 Relatório Monitor",
                "👥 Lista Clientes",
                "🔒 Bloquear Unidade",
                "💰 M. Juros",
                "📈 Ganância ( $0.00 )",
              ].map((label) => (
                <button key={label}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded text-white hover:opacity-90"
                  style={{ background: "#6b7280" }}>
                  {label}
                </button>
              ))}

              <div className="mt-2 border border-gray-200 rounded bg-white p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-gray-700">MICRO SEGURO</span>
                  <span className="text-[10px] bg-red-500 text-white px-1 rounded font-bold">●</span>
                </div>
                <div className="text-[11px] text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>Ingresso Seguros:</span><span className="font-medium">$ 0,00</span></div>
                  <div className="flex justify-between"><span>Retirada Seguros:</span><span className="font-medium">$ 0,00</span></div>
                  <div className="flex justify-between"><span>Caixa Seguros:</span><span className="font-medium text-red-500">( $ -250,00 )</span></div>
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
