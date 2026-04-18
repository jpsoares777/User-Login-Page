import { useState } from "react";
import { useLocation } from "wouter";
import logoImg from "@assets/ChatGPT_Image_17_de_abr._de_2026,_20_49_18_(2)_1776469795366.png";

const MAIN_TABS = ["Desempenho", "Liq. Diária", "Liq. Períodos", "Consolidados"];
const SUB_TABS = ["Vend. Diárias", "Pagamentos", "Vend. Novas", "Rec/Desp", "Clientes", "Agendados", "Roteirizar", "Notas", "GPS", "Relatórios"];

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [activeMain, setActiveMain] = useState("Liq. Diária");
  const [activeSub, setActiveSub] = useState("Vend. Diárias");

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100" style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div className="flex items-center h-10 px-2 gap-1" style={{ background: "#0c1d38" }}>

        {/* Logo small */}
        <div className="flex items-center mr-2">
          <img
            src={logoImg}
            alt="SystemPay"
            className="h-8 w-auto object-contain select-none"
            style={{ mixBlendMode: "screen" }}
            draggable={false}
          />
        </div>

        {/* Main tabs */}
        <div className="flex items-center gap-0.5 flex-1">
          {MAIN_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMain(tab)}
              className="px-4 h-7 text-xs font-medium rounded-t transition-all"
              style={{
                background: activeMain === tab ? "#1a73e8" : "transparent",
                color: activeMain === tab ? "#fff" : "rgba(255,255,255,0.55)",
                border: activeMain === tab ? "none" : "none",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5">
          <button className="px-2.5 h-6 text-[10px] font-semibold rounded text-white flex items-center gap-1"
            style={{ background: "#c0392b" }}>
            <span>▶</span> Tutoriais
          </button>
          <button className="px-2.5 h-6 text-[10px] font-semibold rounded text-white"
            style={{ background: "#e67e22" }}>
            Admin
          </button>
          <button className="px-2.5 h-6 text-[10px] font-medium rounded text-white/70 flex items-center gap-1"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            🔑 Alterar Senha
          </button>
          <button
            onClick={handleLogout}
            className="px-2.5 h-6 text-[10px] font-medium rounded flex items-center gap-1"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            ⏻ Sair
          </button>
        </div>
      </div>

      {/* ── SUB TABS ── */}
      <div className="flex items-center h-9 px-2 gap-0.5" style={{ background: "#f0f0f0", borderBottom: "1px solid #ddd" }}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSub(tab)}
            className="px-3 h-7 text-xs font-medium rounded transition-all border"
            style={{
              background: activeSub === tab ? "#1a73e8" : "#fff",
              color: activeSub === tab ? "#fff" : "#333",
              borderColor: activeSub === tab ? "#1a73e8" : "#ccc",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="flex items-center h-9 px-2 gap-1.5" style={{ background: "#f8f8f8", borderBottom: "1px solid #e0e0e0" }}>
        <button className="flex items-center gap-1.5 px-2.5 h-6 text-xs font-medium rounded border"
          style={{ background: "#1a73e8", color: "#fff", borderColor: "#1a73e8" }}>
          <span>🌎</span> País
          <span className="ml-0.5 text-[10px] bg-white/30 rounded-full w-4 h-4 flex items-center justify-center">↺</span>
        </button>
        <button className="flex items-center justify-center w-6 h-6 rounded border text-xs"
          style={{ background: "#1a73e8", color: "#fff", borderColor: "#1a73e8" }}>
          ↺
        </button>
        <button className="flex items-center gap-1.5 px-2.5 h-6 text-xs font-medium rounded border"
          style={{ background: "#fff", color: "#333", borderColor: "#ccc" }}>
          <span>👤</span> Vendedor
          <span className="text-[10px] text-gray-400 ml-0.5">▼</span>
        </button>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 flex flex-col items-center justify-center" style={{ background: "#fff" }}>
        <div className="text-center">
          <div className="text-5xl mb-4 opacity-20">📊</div>
          <p className="text-gray-400 text-sm">Nenhum dado encontrado para os filtros selecionados.</p>
          <p className="text-gray-300 text-xs mt-1">Selecione um vendedor ou ajuste os filtros acima.</p>
        </div>
      </div>

    </div>
  );
}
