import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import menuIcon from "@assets/windows_104558_1776473182467.webp";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Label, Customized,
} from "recharts";

const MAIN_TABS = ["Desempenho", "Liq. Diária", "Liq. Períodos", "Consolidados"];
const SUB_TABS = ["Vend. Diárias", "Pagamentos", "Vend. Novas", "Rec/Desp", "Clientes", "Agendados", "Relatórios"];

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

function ChartCard({ children, year = "2026", subtitle, showMonth = false }: { children: React.ReactNode; year?: string; subtitle?: string; showMonth?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded flex flex-col flex-1 min-w-0 min-h-0" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 shrink-0">
        <button className="flex items-center justify-center rounded shrink-0" style={{ background: "#16a34a", width: 30, height: 30 }}>
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} className="fill-white">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
        <select className="text-[13px] border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 cursor-pointer">
          <option>Rota Cred Bank -</option>
        </select>
        <select className="text-[13px] border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 cursor-pointer">
          <option>{year}</option>
          <option>{String(Number(year) - 1)}</option>
        </select>
        {showMonth && (
          <select className="text-[13px] border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 cursor-pointer">
            <option value="">--Mes--</option>
            <option>Jan.</option><option>Fev.</option><option>Mar.</option>
            <option>Abr.</option><option>Mai.</option><option>Jun.</option>
            <option>Jul.</option><option>Ago.</option><option>Set.</option>
            <option>Out.</option><option>Nov.</option><option>Dez.</option>
          </select>
        )}
        <div className="flex-1" />
        <button className="text-gray-500 hover:text-gray-700 text-xl leading-none px-1">≡</button>
      </div>
      {/* Title area */}
      {subtitle && (
        <div className="px-1.5 pt-0.5 pb-0">
          <div className="text-[9px] font-bold text-gray-800">{year}</div>
          <div className="text-[8px] text-gray-500">{subtitle}</div>
        </div>
      )}
      {/* Chart body */}
      <div className="flex-1 min-h-0 px-3 py-2">
        {children}
      </div>
      {/* Watermark */}
      <div className="text-right pr-1 pb-0.5 shrink-0">
        <span className="text-gray-300 text-[7px]">Highcharts.com</span>
      </div>
    </div>
  );
}

// ── Desempenho data ───────────────────────────────────────────────────────────

const MONTHS = ["Jan.", "Fev.", "Mar.", "Abr.", "Mai.", "Jun.", "Jul.", "Ago.", "Set.", "Out.", "Nov.", "Dez."];

const clientesData = MONTHS.map((m, i) => ({
  mes: m,
  "Clientes 2026": [8, 10, 5, 12, 9, 14, 11, 7, 13, 6, 10, 8][i],
  "Clientes 2025": [6, 9, 3, 8, 7, 11, 9, 5, 10, 4, 8, 6][i],
}));

const ventasData = MONTHS.map((m, i) => ({
  mes: m,
  "Empréstimo 2026": [4200, 500, 15000, 6800, 8600, 9100, 7400, 5300, 11200, 6700, 4900, 3800][i],
  "Empréstimo 2025": [3200, 400, 1500, 4200, 5100, 7800, 6200, 4100, 9500, 5400, 3800, 2900][i],
}));

const gastosIngresosData = MONTHS.map((m, i) => ({
  mes: m,
  Ingresos: [3800, 4200, 8500, 3200, 6400, 7100, 5900, 4600, 9800, 5700, 4100, 3500][i],
  Gastos:   [1200, 1800, 2500, 1800, 2200, 2900, 2100, 1700, 3400, 2000, 1500, 1300][i],
}));

const gastosPieData = [
  { name: "Ajuste Caixa (1300)", value: 1300, color: "#3d9cd2" },
  { name: "Outros (590)", value: 590, color: "#4cae4c" },

  { name: "Retiradas de Caixa (251)", value: 251, color: "#2e2e2e" },
];

const ingresosPieData = [
  { name: "Aporte Caixa (5610)", value: 5610, color: "#3d9cd2" },
  { name: "Outro (3780)", value: 3780, color: "#2e2e2e" },
];

// ── 3D Pie Chart ─────────────────────────────────────────────────────────────

function expandHex(hex: string) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  return "#" + hex;
}
function darkenColor(hex: string, f = 0.35) {
  hex = expandHex(hex);
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - f)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - f)));
  const b = Math.max(0, Math.round((n & 255) * (1 - f)));
  return `rgb(${r},${g},${b})`;
}

function Pie3DChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const W = 400, H = 300;
  const cx = 185, cy = 138;
  const rx = 112, ry = 68, depth = 22;

  const total = data.reduce((s, d) => s + d.value, 0);
  let cum = -Math.PI / 2;
  const slices = data.map(d => {
    const a1 = cum;
    const sweep = (d.value / total) * 2 * Math.PI;
    cum += sweep;
    const a2 = cum;
    return { ...d, a1, a2, mid: (a1 + a2) / 2 };
  });

  const T = (a: number): [number, number] => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  const B = (a: number): [number, number] => [cx + rx * Math.cos(a), cy + depth + ry * Math.sin(a)];

  const topPath = (a1: number, a2: number) => {
    const [x1, y1] = T(a1), [x2, y2] = T(a2);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return `M ${cx},${cy} L ${x1},${y1} A ${rx},${ry} 0 ${large} 1 ${x2},${y2} Z`;
  };
  const wallPath = (a1: number, a2: number) => {
    const [tx1, ty1] = T(a1), [tx2, ty2] = T(a2);
    const [bx1, by1] = B(a1), [bx2, by2] = B(a2);
    const large = a2 - a1 > Math.PI ? 1 : 0;
    return `M ${tx1},${ty1} A ${rx},${ry} 0 ${large} 1 ${tx2},${ty2} L ${bx2},${by2} A ${rx},${ry} 0 ${large} 0 ${bx1},${by1} Z`;
  };
  const frontParts = (a1: number, a2: number): [number, number][] => {
    const res: [number, number][] = [];
    const s = Math.max(a1, 0), e = Math.min(a2, Math.PI);
    if (s < e) res.push([s, e]);
    return res;
  };

  const sorted = [...slices].sort((a, b) => Math.sin(a.mid) - Math.sin(b.mid));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: "visible" }}>
      {/* Outer walls (back to front) */}
      {sorted.map((s, i) =>
        frontParts(s.a1, s.a2).map(([ps, pe], j) => (
          <path key={`w${i}${j}`} d={wallPath(ps, pe)} fill={darkenColor(s.color)} />
        ))
      )}
      {/* Top faces (back to front) */}
      {sorted.map((s, i) => (
        <path key={`t${i}`} d={topPath(s.a1, s.a2)} fill={s.color} stroke="#fff" strokeWidth={1.5} />
      ))}
      {/* Labels with connector lines */}
      {slices.map((s, i) => {
        const [ex, ey] = T(s.mid);
        const lx = cx + (rx + 36) * Math.cos(s.mid);
        const ly = cy + (ry + 22) * Math.sin(s.mid);
        const anchor = Math.cos(s.mid) >= 0 ? "start" : "end";
        const tx = lx + (Math.cos(s.mid) >= 0 ? 4 : -4);
        return (
          <g key={`l${i}`}>
            <line x1={ex} y1={ey} x2={lx} y2={ly} stroke="#bbb" strokeWidth={0.8} />
            <text x={tx} y={ly} textAnchor={anchor} dominantBaseline="middle"
              fontSize={11} fontWeight="bold" fill="#222">
              {s.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── 3D Grid background ────────────────────────────────────────────────────────

const CHART_DEPTH = 10;

function Background3D(props: any) {
  const { offset, yAxisMap } = props;
  if (!offset) return null;
  const { left, top, width, height } = offset;
  const d = CHART_DEPTH;

  // Get y-axis ticks to draw depth lines on side wall
  const yAxis: any = yAxisMap ? Object.values(yAxisMap)[0] : null;
  const ticks: number[] = yAxis?.niceTicks ?? yAxis?.ticks ?? [];
  const scale = yAxis?.scale;

  return (
    <g style={{ pointerEvents: "none" }}>
      {/* Top roof parallelogram */}
      <polygon
        points={`${left},${top} ${left + d},${top - d} ${left + width + d},${top - d} ${left + width},${top}`}
        fill="#eff3f8" stroke="#c8d0da" strokeWidth={0.5}
      />
      {/* Right side wall parallelogram */}
      <polygon
        points={`${left + width},${top} ${left + width + d},${top - d} ${left + width + d},${top + height - d} ${left + width},${top + height}`}
        fill="#e4eaf2" stroke="#c8d0da" strokeWidth={0.5}
      />
      {/* Horizontal depth lines at each tick on the side wall */}
      {scale && ticks.map((tick: number) => {
        const yPos = scale(tick);
        if (yPos == null || yPos < top - 1 || yPos > top + height + 1) return null;
        return (
          <line key={tick}
            x1={left + width} y1={yPos}
            x2={left + width + d} y2={yPos - d}
            stroke="#c8d0da" strokeWidth={0.5}
          />
        );
      })}
    </g>
  );
}

// ── 3D Bar shape ─────────────────────────────────────────────────────────────

function Bar3D({ x, y, width, height, fill, depth = 10 }: any) {
  if (!height || height <= 0 || !width || width <= 0) return null;
  const d = depth;
  // Lighten top face
  const topFill = fill === "#5b9bd5" ? "#a8d4f0" : fill === "#2c2c2c" ? "#777" : "#ccc";
  const sideFill = fill === "#5b9bd5" ? "#3a78ab" : fill === "#2c2c2c" ? "#1a1a1a" : "#999";
  return (
    <g>
      {/* Front face */}
      <rect x={x} y={y} width={width} height={height} fill={fill} />
      {/* Top face */}
      <polygon
        points={`${x},${y} ${x + d},${y - d} ${x + width + d},${y - d} ${x + width},${y}`}
        fill={topFill}
      />
      {/* Right side face */}
      <polygon
        points={`${x + width},${y} ${x + width + d},${y - d} ${x + width + d},${y + height - d} ${x + width},${y + height}`}
        fill={sideFill}
      />
    </g>
  );
}

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
      fontSize={7}
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
            <BarChart data={clientesData} margin={{ top: 14, right: 20, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="" stroke="#d8dde3" />
              <Customized component={Background3D} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#333", fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#222", fontWeight: "bold" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Legend iconSize={7} iconType="circle" wrapperStyle={{ fontSize: 8, paddingTop: 2 }} />
              <Bar dataKey="Clientes 2026" fill="#5b9bd5" maxBarSize={20} shape={<Bar3D depth={10} />} />
              <Bar dataKey="Clientes 2025" fill="#2c2c2c" maxBarSize={20} shape={<Bar3D depth={10} />} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ventasData} margin={{ top: 14, right: 20, left: 14, bottom: 4 }}>
              <CartesianGrid strokeDasharray="" stroke="#d8dde3" />
              <Customized component={Background3D} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#333", fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#222", fontWeight: "bold" }} axisLine={false} tickLine={false} width={34}
                domain={[0, 20000]} ticks={[0, 5000, 10000, 15000, 20000]}
                tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : String(v)} />
              <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => `$ ${v.toLocaleString("pt-BR")}`} />
              <Legend iconSize={7} iconType="circle" wrapperStyle={{ fontSize: 8, paddingTop: 2 }} />
              <Bar dataKey="Empréstimo 2026" fill="#5b9bd5" maxBarSize={20} shape={<Bar3D depth={10} />} />
              <Bar dataKey="Empréstimo 2025" fill="#2c2c2c" maxBarSize={20} shape={<Bar3D depth={10} />} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gastosIngresosData} margin={{ top: 14, right: 20, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="" stroke="#d8dde3" />
              <Customized component={Background3D} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#333", fontWeight: "bold" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#222", fontWeight: "bold" }} axisLine={false} tickLine={false} width={34}
                tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : String(v)} />
              <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => `$ ${v.toLocaleString("pt-BR")}`} />
              <Legend iconSize={7} iconType="circle" wrapperStyle={{ fontSize: 8, paddingTop: 2 }} />
              <Bar dataKey="Ingresos" fill="#5b9bd5" maxBarSize={20} shape={<Bar3D depth={10} />} />
              <Bar dataKey="Gastos" fill="#2c2c2c" maxBarSize={20} shape={<Bar3D depth={10} />} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Row 2: 2 pie charts + empty third */}
      <div className="flex min-h-0" style={{ flex: 1, gap: 16 }}>

        <ChartCard subtitle="Gastos por Conceito 2026" year="2026" showMonth>
          <Pie3DChart data={gastosPieData} />
        </ChartCard>

        <ChartCard subtitle="Ingressos por Conceito 2026" year="2026" showMonth>
          <Pie3DChart data={ingresosPieData} />
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
            <div className="w-48 shrink-0 bg-gray-50 flex flex-col gap-3 p-2 overflow-y-auto">
              {[
                "⚙ Configurações",
                "📊 Relatório Monitor",
                "👥 Lista Clientes",
                "🔒 Bloquear Unidade",
                "🔑 Código Aprovações",
                "📈 Ganância ( $0.00 )",
              ].map((label) => (
                <button key={label}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded text-white hover:opacity-90"
                  style={{ background: "#6b7280" }}>
                  {label}
                </button>
              ))}
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
