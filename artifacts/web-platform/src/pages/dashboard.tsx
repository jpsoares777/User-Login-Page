import { useState } from "react";
import { useLocation } from "wouter";
import logoImg from "@assets/ChatGPT_Image_17_de_abr._de_2026,_20_49_18_(2)_1776469795366.png";

const MAIN_TABS = ["Desempenho", "Liq. Diária", "Liq. Períodos", "Consolidados"];
const SUB_TABS = ["Vend. Diárias", "Pagamentos", "Vend. Novas", "Rec/Desp", "Clientes", "Agendados", "Roteirizar", "Notas", "GPS", "Relatórios"];

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [activeMain, setActiveMain] = useState("Liq. Diária");
  const [activeSub, setActiveSub] = useState("Vend. Diárias");

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "system-ui, sans-serif", background: "#f4f4f4" }}>

      {/* ── TOP BAR (logo + ações) ── */}
      <div className="flex items-center justify-between h-12 px-3" style={{ background: "#0c1d38" }}>
        <img
          src={logoImg}
          alt="SystemPay"
          className="h-10 w-auto object-contain select-none"
          style={{ mixBlendMode: "screen" }}
          draggable={false}
        />
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 h-7 text-xs font-semibold rounded text-white"
            style={{ background: "#c0392b" }}>
            ▶ Tutoriais
          </button>
          <button className="px-3 h-7 text-xs font-semibold rounded text-white"
            style={{ background: "#e67e22" }}>
            Admin
          </button>
          <button className="flex items-center gap-1 px-3 h-7 text-xs font-medium rounded"
            style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
            🔑 Alterar Senha
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 px-3 h-7 text-xs font-medium rounded"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            ⏻ Sair
          </button>
        </div>
      </div>

      {/* ── MAIN TABS ROW ── */}
      <div className="flex items-end px-0 gap-0" style={{ background: "#1e3a5f", borderBottom: "3px solid #2563eb" }}>
        {MAIN_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveMain(tab)}
            className="px-6 h-10 text-sm font-medium transition-all border-r"
            style={{
              background: activeMain === tab ? "#2563eb" : "transparent",
              color: activeMain === tab ? "#fff" : "rgba(255,255,255,0.65)",
              borderRightColor: "rgba(255,255,255,0.1)",
              borderTop: activeMain === tab ? "3px solid #60a5fa" : "3px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── SUB TABS ROW ── */}
      <div className="flex items-center gap-0 px-0" style={{ background: "#fff", borderBottom: "1px solid #ddd" }}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSub(tab)}
            className="px-5 h-10 text-sm font-medium transition-all border-r"
            style={{
              background: activeSub === tab ? "#2563eb" : "#fff",
              color: activeSub === tab ? "#fff" : "#444",
              borderRightColor: "#e5e7eb",
              borderBottom: activeSub === tab ? "3px solid #1d4ed8" : "3px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="flex items-center h-11 px-3 gap-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        {/* País */}
        <button className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded"
          style={{ background: "#2563eb", color: "#fff" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white opacity-90">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          País
        </button>

        {/* Refresh */}
        <button className="flex items-center justify-center w-8 h-8 rounded"
          style={{ background: "#16a34a", color: "#fff" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>

        {/* Vendedor */}
        <button className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded"
          style={{ background: "#2563eb", color: "#fff" }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white opacity-90">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          Vendedor
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white opacity-70">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          <span className="ml-1 text-xs bg-white/25 rounded-full w-5 h-5 flex items-center justify-center font-bold">1</span>
        </button>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-5xl mb-4 opacity-20">📊</div>
          <p className="text-gray-400 text-sm">Nenhum dado encontrado para os filtros selecionados.</p>
          <p className="text-gray-300 text-xs mt-1">Selecione um vendedor ou ajuste os filtros acima.</p>
        </div>
      </div>

    </div>
  );
}
