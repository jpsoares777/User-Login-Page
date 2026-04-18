import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import menuIcon from "@assets/windows_104558_1776473182467.webp";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Label,
} from "recharts";

const MAIN_TABS = ["Desempenho", "Liq. Diária", "Liq. Períodos", "Consolidados"];
const SUB_TABS = ["Vend. Diárias", "Pagamentos", "Vend. Novas", "Rec/Desp", "Clientes", "Agendados", "Roteirizar", "Notas", "GPS", "Relatórios"];

// ── Helper components ─────────────────────────────────────────────────────────

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 select-none sticky top-0 z-10"
      style={{ background: "#f0f4f8", borderBottom: "2px solid " + color, borderTop: "1px solid #e2e8f0" }}>
      <div className="w-1 h-4 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>{title}</span>
    </div>
  );
}

function Row({ label, children, bold, index = 0 }: { label: string; children: React.ReactNode; bold?: boolean; index?: number }) {
  const even = index % 2 === 0;
  return (
    <div
      className="flex items-center group transition-colors"
      style={{ minHeight: "24px", fontSize: "12px", paddingLeft: "12px", background: even ? "#ffffff" : "#f9fafb", borderBottom: "1px solid #edf0f3" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
      onMouseLeave={e => (e.currentTarget.style.background = even ? "#ffffff" : "#f9fafb")}
    >
      <span className="shrink-0 pr-3 py-1 whitespace-nowrap font-bold" style={{ width: "230px", fontSize: "11.5px", color: "#374151" }}>{label}</span>
      <div className="w-px self-stretch bg-gray-200 mr-3 shrink-0" />
      <span className={`px-1 py-1 flex items-center gap-1.5 leading-tight flex-wrap ${bold ? "font-bold text-gray-900 text-[13px]" : "text-gray-700"}`}>
        {children}
      </span>
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

// ── Chart card wrapper ────────────────────────────────────────────────────────

function ChartCard({ children, year = "2026", subtitle }: { children: React.ReactNode; year?: string; subtitle?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded flex flex-col flex-1 min-w-0 min-h-0" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-2 py-1 border-b border-gray-100 shrink-0">
        <button className="flex items-center justify-center rounded shrink-0" style={{ background: "#16a34a", width: 22, height: 22 }}>
          <svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }} className="fill-white">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
        <select className="text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700 cursor-pointer">
          <option>Rota Cred Bank -</option>
        </select>
        <select className="text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700 cursor-pointer">
          <option>{year}</option>
          <option>{String(Number(year) - 1)}</option>
        </select>
        <div className="flex-1" />
        <button className="text-gray-500 hover:text-gray-700 text-base leading-none px-0.5">≡</button>
      </div>
      {/* Title area */}
      {subtitle && (
        <div className="px-2 pt-1 pb-0">
          <div className="text-xs font-bold text-gray-800">{year}</div>
          <div className="text-[10px] text-gray-500">{subtitle}</div>
        </div>
      )}
      {/* Chart body */}
      <div className="flex-1 min-h-0 px-0.5">
        {children}
      </div>
      {/* Watermark */}
      <div className="text-right pr-1.5 pb-0.5 shrink-0">
        <span className="text-gray-300 text-[8px]">Highcharts.com</span>
      </div>
    </div>
  );
}

// ── Desempenho data ───────────────────────────────────────────────────────────

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sept.", "Octu.", "Nov.", "Dic."];

const clientesData = MONTHS.map((m, i) => ({
  mes: m,
  "Clientes 2026": [0, 0, 5, 12, 0, 0, 0, 0, 0, 0, 0, 0][i],
  "Clientes 2025": [0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0][i],
}));

const ventasData = MONTHS.map((m, i) => ({
  mes: m,
  "Ventas 2026": [0, 500, 15000, 6800, 600, 0, 0, 0, 0, 0, 0, 0][i],
  "Ventas 2025": [200, 400, 1500, 200, 100, 0, 0, 0, 0, 0, 0, 0][i],
}));

const gastosIngresosData = MONTHS.map((m, i) => ({
  mes: m,
  Ingresos: [0, 0, 8500, 3200, 0, 0, 0, 0, 0, 0, 0, 0][i],
  Gastos:   [0, 0, 2500, 1800, 0, 0, 0, 0, 0, 0, 0, 0][i],
}));

const gastosPieData = [
  { name: "Ajuste Caja (1300)", value: 1300, color: "#aec7e8" },
  { name: "Otros (590)", value: 590, color: "#98df8a" },
  { name: "Retiro Caja Seguros (250)", value: 250, color: "#ffbb78" },
  { name: "Retiros de caja (251)", value: 251, color: "#555" },
];

const ingresosPieData = [
  { name: "Aporte Caja (5610)", value: 5610, color: "#aec7e8" },
  { name: "Outro (3780)", value: 3780, color: "#444" },
];

// Custom y-axis label rotated
const RotatedYLabel = ({ value, viewBox }: any) => {
  const { x, y, width = 0, height } = viewBox;
  const cx = x + width / 2;
  const cy = y + height / 2;
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="middle"
      transform={`rotate(-90, ${cx}, ${cy})`}
      fontSize={8}
      fill="#888"
    >
      {value}
    </text>
  );
};

function DesempenhoContent() {
  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: "#f0f2f5", gap: 16, padding: 12 }}>

      {/* Row 1: 3 bar charts */}
      <div className="flex min-h-0" style={{ flex: 1, gap: 16 }}>

        <ChartCard>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clientesData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf2" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#888" }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              <Bar dataKey="Clientes 2026" fill="#5b9bd5" radius={[2,2,0,0]} maxBarSize={22} />
              <Bar dataKey="Clientes 2025" fill="#2c2c2c" radius={[2,2,0,0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ventasData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf2" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#888" }} axisLine={false} tickLine={false} width={30}
                domain={[0, 20000]} ticks={[0, 5000, 10000, 15000, 20000]}
                tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : String(v)} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => `$ ${v.toLocaleString("pt-BR")}`} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              <Bar dataKey="Ventas 2026" fill="#5b9bd5" radius={[2,2,0,0]} maxBarSize={22} />
              <Bar dataKey="Ventas 2025" fill="#2c2c2c" radius={[2,2,0,0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gastosIngresosData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf2" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#888" }} axisLine={false} tickLine={false} width={30}
                tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : String(v)} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => `$ ${v.toLocaleString("pt-BR")}`} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              <Bar dataKey="Ingresos" fill="#5b9bd5" radius={[2,2,0,0]} maxBarSize={22} />
              <Bar dataKey="Gastos" fill="#2c2c2c" radius={[2,2,0,0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Row 2: 2 pie charts + empty third */}
      <div className="flex min-h-0" style={{ flex: 1, gap: 16 }}>

        <ChartCard subtitle="Gastos por Concepto 2026" year="2026">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gastosPieData}
                cx="50%"
                cy="50%"
                outerRadius="45%"
                dataKey="value"
                label={({ cx, cy, midAngle, outerRadius, index }) => {
                  const RADIAN = Math.PI / 180;
                  const r = (outerRadius as number) + 22;
                  const x = (cx as number) + r * Math.cos(-midAngle * RADIAN);
                  const y = (cy as number) + r * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} textAnchor={x > (cx as number) ? "start" : "end"} dominantBaseline="central" fontSize={9} fill="#444">
                      {gastosPieData[index].name}
                    </text>
                  );
                }}
                labelLine={{ stroke: "#ccc", strokeWidth: 1 }}
              >
                {gastosPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => `$ ${v.toLocaleString("pt-BR")}`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard subtitle="Ingresos por Concepto 2026" year="2026">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ingresosPieData}
                cx="50%"
                cy="50%"
                outerRadius="45%"
                dataKey="value"
                label={({ cx, cy, midAngle, outerRadius, index }) => {
                  const RADIAN = Math.PI / 180;
                  const r = (outerRadius as number) + 22;
                  const x = (cx as number) + r * Math.cos(-midAngle * RADIAN);
                  const y = (cy as number) + r * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} textAnchor={x > (cx as number) ? "start" : "end"} dominantBaseline="central" fontSize={9} fill="#444">
                      {ingresosPieData[index].name}
                    </text>
                  );
                }}
                labelLine={{ stroke: "#ccc", strokeWidth: 1 }}
              >
                {ingresosPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => `$ ${v.toLocaleString("pt-BR")}`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Empty third column */}
        <div className="flex-1" />

      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [activeMain, setActiveMain] = useState("Liq. Diária");
  const [activeSub, setActiveSub] = useState("Vend. Diárias");

  const isDesempenho = activeMain === "Desempenho";
  const showContent = activeMain === "Liq. Diária" && activeSub === "Vend. Diárias";

  useEffect(() => {
    const vp = document.getElementById("vp") as HTMLMetaElement | null;
    if (vp) vp.content = "width=1100, initial-scale=1";
    return () => {
      if (vp) vp.content = "width=device-width, initial-scale=1";
    };
  }, []);

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

      {/* ── SUB TABS ROW (hidden on Desempenho) ── */}
      {!isDesempenho && (
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
      )}

      {/* ── FILTER BAR (hidden on Desempenho) ── */}
      {!isDesempenho && (
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
          <div className="flex-1" />
          <button className="flex items-center justify-center w-9 h-8 rounded" style={{ background: "#2563eb", color: "#fff" }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"/></svg>
          </button>
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-hidden flex">
        {isDesempenho ? (
          <DesempenhoContent />
        ) : showContent ? (
          <>
            {/* LEFT: Tree */}
            <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
              <div className="px-3 py-2 flex items-center gap-1.5 text-gray-800 font-bold text-sm cursor-pointer hover:bg-gray-50">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                BRASIL
              </div>
              <div className="pl-6 py-2 flex items-center gap-1.5 text-gray-600 text-sm cursor-pointer hover:bg-gray-50">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-400 shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                SAO LUIS
              </div>
              <div className="pl-12 py-2 flex items-center pr-2 cursor-pointer bg-blue-50 border-l-2 border-blue-500">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0 mr-1.5"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <span className="text-gray-700 text-sm whitespace-nowrap">Rota Cred Bank -</span>
                <span className="flex-1 ml-2 text-center text-[11px] bg-green-500 text-white py-0.5 rounded font-medium">2026-04-17</span>
              </div>
            </div>

            {/* CENTER: Grouped data rows */}
            <div className="flex-1 overflow-y-auto border-r border-gray-200" style={{ background: "#f8fafc" }}>
              <SectionHeader title="Dados do Vendedor" color="#2563eb" />
              <Row label="Vendedor" index={0}>
                <strong className="text-gray-800">Rota Cred Bank</strong>&nbsp;— Cod: 10600
                <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer ml-1">XLS</span>
              </Row>
              <Row label="Data de Início de Cobrança" index={1}>
                <CalIcon />
                <span className="bg-cyan-500 text-white px-2 rounded text-[11px] font-medium">2026-04-17 00:41:52</span>
              </Row>
              <Row label="Data de Fechamento de Cobrança" index={2}>
                <CalIcon /><span className="text-amber-600 font-medium">Sistema sem Fechar</span>
              </Row>
              <Row label="Último Acesso Móvel" index={3}>
                <CalIcon /> 2026-04-17 00:41:52
              </Row>

              <SectionHeader title="Clientes" color="#16a34a" />
              <Row label="Clientes Iniciais" index={0}>
                <PersonIcon /> <strong className="text-gray-800">20</strong>
                <span className="text-gray-400 text-[11px]">( 1 Sincronizados / 20 )</span>
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-blue-400 cursor-pointer shrink-0"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
              </Row>
              <Row label="Clientes Novos/Renovados" index={1}>
                <PersonIcon /> <strong className="text-gray-800">0</strong> <span className="text-gray-400 text-[11px]">(0/0)</span>
              </Row>
              <Row label="Pag. Adiado Próx. Dia" index={2}>
                <PersonIcon /> <strong className="text-gray-800">0</strong>
              </Row>
              <Row label="Clientes Cancelados" index={3}>
                <PersonIcon /> <strong className="text-gray-800">0</strong>
              </Row>
              <Row label="Total de Clientes" index={4}>
                <PersonIcon /> <strong className="text-gray-800">20</strong>
              </Row>

              <SectionHeader title="Financeiro" color="#7c3aed" />
              <Row label="Caixa Inicial" bold index={0}>
                <span className="text-green-700">$ 2.979,00</span>
              </Row>
              <Row label="Carteira Inicial" bold index={1}>
                <span className="text-green-700">$ 12.660,00</span>
              </Row>
              <Row label="Recebimento Previsto do Dia" index={2}>
                <span className="font-semibold text-gray-800">$ 1.245,00</span>
                <span className="text-[11px] bg-blue-100 text-blue-700 px-1.5 rounded font-medium">100 %</span>
              </Row>
              <Row label="Recebimento Atual do Dia" index={3}>
                <span className="font-semibold text-gray-800">$ 200,00</span>
                <span className="text-[11px] bg-orange-100 text-orange-700 px-1.5 rounded font-medium">16,1 %</span>
                <span className="text-[11px] text-gray-500">Pagos: <strong className="text-gray-800">1</strong></span>
                <span className="text-[11px] text-gray-500">No Pagos: <strong className="text-red-500">0</strong></span>
              </Row>
              <Row label="Recebimento por Tipo Pagto" index={4}>
                <span className="text-[11px] text-gray-500">Efetivo:</span>
                <span className="text-red-500 font-semibold">$ 200,00</span>
                <span className="text-gray-300 mx-0.5">|</span>
                <span className="text-[11px] text-gray-500">Transferência:</span>
                <span className="text-red-500 font-semibold">$ 0,00</span>
              </Row>
              <Row label="Vendas" index={5}>
                <span className="font-semibold text-gray-800">$ 0,00</span>
                <span className="text-gray-400 text-[11px]">( Juros: $ 0,00 )</span>
              </Row>
              <Row label="Ingressos" index={6}>
                <span className="text-blue-600 font-bold text-sm">+</span>
                <span className="font-semibold text-blue-700">0,00</span>
              </Row>
              <Row label="Retiradas" index={7}>
                <span className="text-gray-500 font-bold text-sm">−</span>
                <span className="font-semibold text-gray-600">0,00</span>
              </Row>
              <Row label="Egresos" index={8}>
                <span className="text-gray-500 font-bold text-sm">−</span>
                <span className="font-semibold text-gray-600">0,00</span>
              </Row>
              <Row label="Caixa Final" bold index={9}>
                <span className="text-green-700">$ 3.179,00</span>
                <span className="text-red-400 text-sm cursor-pointer ml-1" title="Detalhes do cálculo">❓</span>
              </Row>
              <Row label="Carteira Final" bold index={10}>
                <span className="text-green-700">$ 12.460,00</span>
                <span className="text-[11px] text-gray-500 ml-1">( Sanção: 0,00 )</span>
                <span className="text-red-400 text-sm cursor-pointer ml-1" title="Detalhes do cálculo">❓</span>
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
