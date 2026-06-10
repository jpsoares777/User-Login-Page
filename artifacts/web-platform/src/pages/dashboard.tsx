import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import menuIcon from "@assets/windows_104558_1776473182467.webp";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Label, Customized,
} from "recharts";

const MAIN_TABS = ["Desempenho", "Liq. Diária", "Liq. Períodos", "Consolidados"];
const SUB_TABS = ["Relatório Diário", "Pagamentos", "Empréstimos Novos", "Despesas", "Rendimentos", "Clientes", "Agendados", "Relatórios"];

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

// ── Pagamentos ────────────────────────────────────────────────────────────────

const pagamentosData = [
  { id: 1, status: "ruim",  consecutivo: "4700627089", cliente: "GEILSON EDUARDO ROSA DE JESUS",  obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "980,00",  sancao: "0,00", saldo: "700,00",  restantes: "10.0", visitas: 13, freq: "Diario" },
  { id: 2, status: "ruim",  consecutivo: "4700627058", cliente: "ALINE LIMA DE ALENCAR",           obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "1.120,00", sancao: "0,00", saldo: "1.040,00",restantes: "13.0", visitas: 4,  freq: "Diario" },
  { id: 3, status: "bom",   consecutivo: "4700627078", cliente: "MARIANA BEATRIZ RABELO BARBOSA",  obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "1.400,00", sancao: "0,00", saldo: "1.400,00",restantes: "4.0",  visitas: 4,  freq: "Diario" },
  { id: 4, status: "bom",   consecutivo: "4700627145", cliente: "BORES VIANA DE SOUZA",            obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "560,00",  sancao: "0,00", saldo: "480,00",  restantes: "12.0", visitas: 5,  freq: "Diario" },
  { id: 5, status: "ruim",  consecutivo: "4700627024", cliente: "ANNY BRIANE PIRES BELFORT",       obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "1.120,00", sancao: "0,00", saldo: "210,00",  restantes: "2.6",  visitas: 23, freq: "Diario" },
  { id: 6, status: "bom",   consecutivo: "4700627090", cliente: "DANIELE TEXEIRA LINDOSO",         obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "1.400,00", sancao: "0,00", saldo: "900,00",  restantes: "9.0",  visitas: 13, freq: "Diario" },
  { id: 7, status: "medio", consecutivo: "4700627023", cliente: "ELAIRA KISLEY CONCEIÇÃO LOPES",   obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "540,00",  sancao: "0,00", saldo: "540,00",  restantes: "9.0",  visitas: 10, freq: "Diario" },
  { id: 8, status: "ruim",  consecutivo: "4700627164", cliente: "ERICK PEREIRA SANTOS",            obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "840,00",  sancao: "0,00", saldo: "780,00",  restantes: "13.0", visitas: 9,  freq: "Diario" },
  { id: 9, status: "bom",   consecutivo: "4700627059", cliente: "PATRICK MICHAEL SÁ MENEZES",      obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "700,00",  sancao: "0,00", saldo: "600,00",  restantes: "12.0", visitas: 16, freq: "Diario" },
  { id:10, status: "bom",   consecutivo: "4700627022", cliente: "KLEITON VIANA GONÇALVES",         obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "1.170,00", sancao: "0,00", saldo: "420,00",  restantes: "4.7",  visitas: 23, freq: "Diario" },
  { id:11, status: "medio", consecutivo: "4700627027", cliente: "ANTÔNIO LEITE NETO",              obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "800,00",  sancao: "0,00", saldo: "750,00",  restantes: "12.5", visitas: 21, freq: "Diario" },
  { id:12, status: "medio", consecutivo: "4700627025", cliente: "BIANCA DE ARAÚJO ALVES",          obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo", valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "420,00",  sancao: "0,00", saldo: "420,00",  restantes: "14.0", visitas: 3,  freq: "Diario" },
];

type PagRow = typeof pagamentosData[0];

function TipoBadge({ tipo }: { tipo: string }) {
  if (tipo === "S/PAG.") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" style={{ width: 9, height: 9, fill: "#fff" }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </span>
      S/PAG.
    </span>
  );
  if (tipo === "ABONO") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#f59e0b", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" style={{ width: 9, height: 9, fill: "#fff" }}><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>
      </span>
      ABONO
    </span>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#22c55e", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" style={{ width: 9, height: 9, fill: "#fff" }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
      </span>
      PARC.
    </span>
  );
}

function HistorialModal({ row, onClose }: { row: PagRow; onClose: () => void }) {
  const hist = [
    { nro: 4, tipo: "S/PAG.", valor: 0.00,  fecha: "2026-05-25", obs: "Operacion Masiva" },
    { nro: 3, tipo: "S/PAG.", valor: 0.00,  fecha: "2026-04-28", obs: "Operacion Masiva" },
    { nro: 2, tipo: "ABONO",  valor: 0.00,  fecha: "2026-04-17", obs: "Operacion Masiva" },
    { nro: 1, tipo: "PARC.",  valor: 80.00, fecha: "2026-04-16", obs: "Cuota"            },
  ];
  const total = hist.reduce((s, h) => s + h.valor, 0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 8, width: 640,
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: "#2d5474", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "0.01em" }}>
            Histórico de Pagamentos
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "#cbd5e1" }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        {/* Client info */}
        <div style={{ padding: "10px 18px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "#2d5474" }}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#b45309" }}>{row.cliente}</span>
          <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>#{row.consecutivo}</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Nro.", "Cliente", "Tipo", "Valor", "Fecha", "Observações"].map(h => (
                  <th key={h} style={{
                    padding: "8px 12px", textAlign: "left", fontSize: 12,
                    fontWeight: 700, color: "#fff", background: "#2d5474",
                    borderRight: "1px solid #3d6a8a", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hist.map((h, i) => (
                <tr key={h.nro} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={{ padding: "7px 12px", fontSize: 12, borderBottom: "1px solid #e9ecef", fontWeight: 600, color: "#6b7280" }}>{h.nro}</td>
                  <td style={{ padding: "7px 12px", fontSize: 12, borderBottom: "1px solid #e9ecef", color: "#b45309", fontWeight: 600 }}>{row.cliente}</td>
                  <td style={{ padding: "7px 12px", fontSize: 12, borderBottom: "1px solid #e9ecef" }}>
                    <TipoBadge tipo={h.tipo} />
                  </td>
                  <td style={{ padding: "7px 12px", fontSize: 12, borderBottom: "1px solid #e9ecef", fontWeight: 600, textAlign: "right", color: h.valor > 0 ? "#059669" : "#374151" }}>
                    R$ {h.valor.toFixed(2).replace(".", ",")}
                  </td>
                  <td style={{ padding: "7px 12px", fontSize: 12, borderBottom: "1px solid #e9ecef", color: "#4b5563" }}>{h.fecha}</td>
                  <td style={{ padding: "7px 12px", fontSize: 12, borderBottom: "1px solid #e9ecef", color: "#6b7280", fontStyle: "italic" }}>{h.obs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 18px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
            TOTAL PAGOS: <span style={{ color: "#059669" }}>R$ {total.toFixed(2).replace(".", ",")}</span>
          </span>
          <button onClick={onClose} style={{
            padding: "6px 20px", borderRadius: 6, border: "1px solid #d1d5db",
            background: "#fff", fontSize: 13, fontWeight: 600, color: "#374151",
            cursor: "pointer",
          }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function PagamentosContent() {
  const [selectedRow, setSelectedRow] = useState<PagRow | null>(null);
  const cols = [
    { label: "Nro.",         w: 52,  align: "center" as const },
    { label: "Nº do Empréstimo", w: 148, align: "left" as const },
    { label: "Cliente",      w: 250, align: "left"   as const },
    { label: "Observações",  w: 150, align: "left"   as const },
    { label: "Pagas",        w: 76,  align: "center" as const },
    { label: "Tipo",         w: 110, align: "center" as const },
    { label: "Forma Pag.",   w: 100, align: "left"   as const },
    { label: "Valor",        w: 86,  align: "right"  as const },
    { label: "Data",         w: 106, align: "center" as const },
    { label: "Hora",         w: 86,  align: "center" as const },
    { label: "Valor Empr.",  w: 170, align: "left"   as const },
    { label: "Saldo",        w: 96,  align: "right"  as const },
    { label: "Parc. Restantes", w: 110, align: "right" as const },
    { label: "Visitas",      w: 70,  align: "center" as const },
    { label: "Frequência",   w: 90,  align: "center" as const },
  ];

  const inputCls = "h-8 border border-gray-300 rounded-md px-3 text-sm bg-white outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-200 placeholder-gray-400 text-gray-700";

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#f0f2f5" }}>

      {/* ── Filter card ── */}
      <div className="shrink-0 mx-3 mt-3 mb-2 rounded-lg bg-white border border-gray-200 shadow-sm px-4 py-3">
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Consecutivo</label>
            <input placeholder="Ex: 4700627089" className={`${inputCls} w-32`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Nome</label>
            <input placeholder="Nome do cliente" className={`${inputCls} w-40`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Sobrenome</label>
            <input placeholder="Sobrenome" className={`${inputCls} w-36`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Documento</label>
            <input placeholder="CPF / RG" className={`${inputCls} w-36`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Forma de Pag.</label>
            <select className={`${inputCls} w-36`} style={{ color: undefined }}>
              <option value="">-- Todas --</option>
              <option>Efectivo</option>
              <option>Transferência</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Frequência</label>
            <select className={`${inputCls} w-32`}>
              <option value="">-- Todas --</option>
              <option>Diario</option>
              <option>Semanal</option>
              <option>Quinzenal</option>
            </select>
          </div>
          <div className="flex gap-2 ml-auto">
            <button className="h-7 px-4 rounded-md text-xs font-semibold border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors">
              Limpar
            </button>
            <button className="h-7 px-4 rounded-md text-xs font-semibold text-white flex items-center gap-1.5 transition-colors hover:opacity-90"
              style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="flex-1 overflow-hidden mx-3 mb-3 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col">

        {/* Toolbar */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-500">
            <span className="text-gray-900 font-bold">{pagamentosData.length}</span> registros encontrados
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Data de referência:</span>
            <span className="text-xs font-bold text-gray-700">2026-05-25</span>
          </div>
        </div>

        {/* Scrollable table */}
        <div className="flex-1 overflow-auto">
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1250, tableLayout: "fixed" }}>
            <colgroup>
              {cols.map(c => <col key={c.label} style={{ width: c.w }} />)}
            </colgroup>
            <thead>
              <tr>
                {cols.map(c => (
                  <th key={c.label} style={{
                    padding: "10px 12px",
                    textAlign: c.align,
                    fontWeight: 700,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    color: "#e2e8f0",
                    background: "#2563eb",
                    borderRight: "1px solid #3b82f6",
                    letterSpacing: "0.02em",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagamentosData.map((r, i) => {
                const even = i % 2 === 1;
                const rowBg = even ? "#f8fafc" : "#ffffff";
                const td = (align: "left"|"right"|"center" = "left", extra?: React.CSSProperties): React.CSSProperties => ({
                  padding: "8px 12px",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: align,
                  borderRight: "1px solid #e9ecef",
                  borderBottom: "1px solid #e9ecef",
                  background: rowBg,
                  color: "#374151",
                  ...extra,
                });
                return (
                  <tr key={r.id} style={{ cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#eff6ff"; Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = "#eff6ff"); }}
                    onMouseLeave={e => { Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach((c,ci) => c.style.background = rowBg); }}>
                    <td style={td("center", { fontWeight: 700, color: "#6b7280", fontSize: 12 })}>{r.id}</td>
                    <td style={td("left", { color: "#2563eb", fontWeight: 700 })}>
                      <span style={{ borderBottom: "1px dashed #93c5fd" }}>{r.consecutivo}</span>
                    </td>
                    <td style={td("left", {
                        color: r.status === "bom" ? "#16a34a" : r.status === "ruim" ? "#dc2626" : "#d97706",
                        fontWeight: 600, cursor: "pointer"
                      })}
                      onClick={() => setSelectedRow(r)}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", textDecoration: "underline", textUnderlineOffset: 2 }}>{r.cliente}</span>
                        <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, fill: "#d1d5db", flexShrink: 0 }}><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
                      </span>
                    </td>
                    <td style={td("left", { color: "#6b7280", fontStyle: "italic" })}>{r.obs}</td>
                    <td style={td("center")}>{r.pagadas}</td>
                    <td style={td("center")}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "#fef2f2", color: "#b91c1c",
                        border: "1px solid #fecaca",
                        fontSize: 12, fontWeight: 700,
                        padding: "3px 9px", borderRadius: 20,
                        letterSpacing: "0.03em",
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0, display:"inline-block" }} />
                        Não Pago
                      </span>
                    </td>
                    <td style={td("left")}>{r.formaPago}</td>
                    <td style={td("right", { fontWeight: 600, color: "#111827" })}>R$ {r.valor}</td>
                    <td style={td("center", { color: "#4b5563" })}>{r.fecha}</td>
                    <td style={td("center", { color: "#6b7280", fontFamily: "monospace" })}>{r.hora}</td>
                    <td style={td("left")}>
                      <span style={{ fontWeight: 600, color: "#111827" }}>R$ {r.valorProd}</span>
                      <span style={{ color: "#9ca3af", fontSize: 12, marginLeft: 4 }}>Sanção ({r.sancao})</span>
                    </td>
                    <td style={td("right", { fontWeight: 700, color: "#059669" })}>R$ {r.saldo}</td>
                    <td style={td("right")}>{r.restantes}</td>
                    <td style={td("center", { fontWeight: 600 })}>{r.visitas}</td>
                    <td style={td("center")}>
                      <span style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", fontSize: 12, fontWeight: 600, padding: "2px 9px", borderRadius: 20 }}>
                        {r.freq}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 flex items-center gap-6 px-4 py-2.5 border-t border-gray-200"
          style={{ background: "#2563eb" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-widest">Recebimento Atual do Dia</span>
            <span className="text-base font-bold text-white">R$ 290,00</span>
          </div>
          <div className="w-px h-5 bg-slate-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white font-bold">Taxa de recebimento</span>
            <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>23,3%</span>
          </div>
          <div className="w-px h-5 bg-slate-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white font-bold">Não pagos</span>
            <span className="text-sm font-bold text-red-400">{pagamentosData.length}</span>
          </div>
          <div className="ml-auto text-xs text-slate-500">
            Referência: 2026-05-25 · 20:12:44
          </div>
        </div>
      </div>

      {selectedRow && <HistorialModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
}

// ── Empréstimos Novos data ─────────────────────────────────────────────────────
const emprestimosData = [
  { id: 1, consec: "4700627026", freq: "Diário", valorAnt: 600.00, cliente: "Andrela de Jesus Costa Araújo", tag: "Renovado", documento: "91633427315", celular: "98985014328", valorProd: 800.00,  parcelas: 14, pctJuros: 40, valorJuros: 320.00, valorParcela: 80.00,  dataVenda: "2026-03-30 14:03:51", parcRest: 0,  saldo: 0.00,   numSeguro: "",  vrSeguro: 0.00, chaveAutor: "" },
  { id: 2, consec: "4700627089", freq: "Diário", valorAnt: 0.00,   cliente: "Geilson Eduardo Rosa de Jesus",  tag: "Novo",     documento: "00503307300", celular: "9885397102",  valorProd: 700.00,  parcelas: 14, pctJuros: 40, valorJuros: 280.00, valorParcela: 70.00,  dataVenda: "2026-03-30 19:39:09", parcRest: 10, saldo: 700.00, numSeguro: "",  vrSeguro: 0.00, chaveAutor: "" },
  { id: 3, consec: "4700627090", freq: "Diário", valorAnt: 0.00,   cliente: "Daniele Texeira Lindoso",        tag: "Novo",     documento: "01148713379", celular: "559899687036",valorProd: 1000.00, parcelas: 14, pctJuros: 40, valorJuros: 400.00, valorParcela: 100.00, dataVenda: "2026-03-30 21:03:29", parcRest: 9,  saldo: 900.00, numSeguro: "",  vrSeguro: 0.00, chaveAutor: "" },
];

type EmpRow = typeof emprestimosData[0];

const pagamentosPorEmprestimo: Record<number, { nro: number; tipo: string; valor: number; data: string; obs: string }[]> = {
  2: [
    { nro: 5, tipo: "S/PAG.",  valor: 0,   data: "2026-05-25", obs: "Operação Masiva" },
    { nro: 4, tipo: "S/PAG.",  valor: 0,   data: "2026-04-28", obs: "Operação Masiva" },
    { nro: 3, tipo: "ABONO",   valor: 0,   data: "2026-04-17", obs: "Operação Masiva" },
    { nro: 2, tipo: "PARC.",   valor: 700, data: "2026-04-16", obs: "" },
    { nro: 1, tipo: "PARC.",   valor: 400, data: "2026-04-15", obs: "" },
  ],
  1: [
    { nro: 4, tipo: "PARC.",   valor: 180, data: "2026-04-10", obs: "" },
    { nro: 3, tipo: "PARC.",   valor: 180, data: "2026-03-27", obs: "" },
    { nro: 2, tipo: "ABONO",   valor: 0,   data: "2026-03-22", obs: "Operação Masiva" },
    { nro: 1, tipo: "PARC.",   valor: 240, data: "2026-03-14", obs: "" },
  ],
};

function PagamentosEmprestimoModal({
  nroEmp, cliente, onClose,
}: { nroEmp: number; cliente: string; onClose: () => void }) {
  const pagamentos = pagamentosPorEmprestimo[nroEmp] ?? [];
  const total = pagamentos.filter(p => p.tipo === "Valor").reduce((a, p) => a + p.valor, 0);

  const thP: React.CSSProperties = {
    padding: "8px 10px", fontSize: 12, fontWeight: 700, color: "#fff",
    background: "#2563eb", borderRight: "1px solid #3b82f6",
    whiteSpace: "nowrap", position: "sticky", top: 0,
  };
  const tdP = (align: "left"|"center"|"right" = "left", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "8px 10px", fontSize: 13, borderBottom: "1px solid #f0f4f8", textAlign: align, ...extra,
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.30)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 8, width: "min(620px, 92vw)", boxShadow: "0 24px 64px rgba(0,0,0,0.40)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: "#2d5474", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Histórico de Pagamentos</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "#cbd5e1" }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        {/* Client info */}
        <div style={{ padding: "10px 18px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "#2d5474" }}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#b45309" }}>{cliente.toUpperCase()}</span>
          <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>Empréstimo #{nroEmp}</span>
        </div>

        {/* Table */}
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...thP, textAlign: "center" }}>Nro.</th>
                <th style={{ ...thP }}>Cliente</th>
                <th style={{ ...thP, textAlign: "center" }}>Tipo</th>
                <th style={{ ...thP, textAlign: "right" }}>Valor</th>
                <th style={{ ...thP, textAlign: "center" }}>Fecha</th>
                <th style={{ ...thP }}>Observações</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={tdP("center", { fontWeight: 700, color: "#374151" })}>{p.nro}</td>
                  <td style={tdP("left", { color: "#2563eb", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{cliente.toUpperCase()}</td>
                  <td style={tdP("center")}>
                    {p.tipo === "S/PAG." && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#fff", background: "#dc2626", borderRadius: 20, padding: "3px 10px" }}>
                        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff", flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
                        S/PAG.
                      </span>
                    )}
                    {p.tipo === "ABONO" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#92400e", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 20, padding: "3px 10px" }}>
                        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#d97706", flexShrink: 0 }}><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8z"/></svg>
                        ABONO
                      </span>
                    )}
                    {p.tipo === "PARC." && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#166534", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 20, padding: "3px 10px" }}>
                        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#16a34a", flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg>
                        PARC.
                      </span>
                    )}
                  </td>
                  <td style={tdP("right", { fontWeight: 700, color: p.valor > 0 ? "#166534" : "#9ca3af" })}>
                    R$ {p.valor.toFixed(2).replace(".", ",")}
                  </td>
                  <td style={tdP("center", { color: "#4b5563" })}>{p.data}</td>
                  <td style={tdP("left", { color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{p.obs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 18px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
            TOTAL PAGOS: <span style={{ color: "#166534" }}>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </span>
          <button onClick={onClose} style={{ padding: "6px 22px", background: "#64748b", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function HistorialVendasModal({ row, onClose }: { row: EmpRow; onClose: () => void }) {
  const [selectedHistRow, setSelectedHistRow] = useState<number | null>(null);

  const hist = [
    { nro: 2, data: "2026-04-08", estado: "Quitado",          parcelas: 20, parcPagas: 12.4, parcFalt: 7.6, sancao: 0, valorEmpr: 2100, vrParc: 105, freq: "Diário", visitas: 5,  pctJuros: 40 },
    { nro: 1, data: "2026-03-14", estado: "Quitado",          parcelas: 14, parcPagas: 14,   parcFalt: 0,   sancao: 0, valorEmpr: 840,  vrParc: 60,  freq: "Diário", visitas: 8,  pctJuros: 40 },
  ];

  const totalEmpr = hist.reduce((a, h) => a + h.valorEmpr, 0);

  const thS: React.CSSProperties = {
    padding: "8px 10px", fontSize: 12, fontWeight: 700, color: "#fff",
    background: "#2563eb", borderRight: "1px solid #3b82f6",
    whiteSpace: "nowrap", position: "sticky", top: 0,
  };
  const tdS = (align: "left"|"center"|"right" = "left", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "8px 10px", fontSize: 13, borderBottom: "1px solid #f0f4f8",
    textAlign: align, ...extra,
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 8, width: "min(820px, 95vw)", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: "#2d5474", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Histórico de Empréstimos</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "#cbd5e1" }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        {/* Client info */}
        <div style={{ padding: "10px 18px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "#2d5474" }}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#b45309" }}>{row.cliente.toUpperCase()}</span>
          <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>#{row.consec}</span>
        </div>

        {/* Table — no overflowX, width 100% */}
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "9%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...thS, textAlign: "center" }}>Nro.</th>
                <th style={{ ...thS, textAlign: "center" }}>Data do Empr.</th>
                <th style={{ ...thS }}>Estado</th>
                <th style={{ ...thS, textAlign: "center" }}>Parc.</th>
                <th style={{ ...thS, textAlign: "center" }}>Pagas</th>
                <th style={{ ...thS, textAlign: "center" }}>Falt.</th>
                <th style={{ ...thS, textAlign: "right" }}>Saldo</th>
                <th style={{ ...thS, textAlign: "right" }}>Valor Empr.</th>
                <th style={{ ...thS, textAlign: "center" }}>Freq.</th>
                <th style={{ ...thS, textAlign: "right" }}>Vr. Parcela</th>
                <th style={{ ...thS, textAlign: "center" }}>Visitas</th>
                <th style={{ ...thS, textAlign: "center" }}>% Juros</th>
              </tr>
            </thead>
            <tbody>
              {hist.map((h, i) => (
                <tr key={i}
                  onClick={() => setSelectedHistRow(h.nro)}
                  style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#f8fafc")}
                >
                  <td style={tdS("center", { fontWeight: 700, color: "#2563eb" })}>{h.nro}</td>
                  <td style={tdS("center", { color: "#4b5563" })}>{h.data}</td>
                  <td style={tdS("left")}>
                    {h.estado === "Quitado"
                      ? <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 4, padding: "2px 7px" }}>Quitado</span>
                      : <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 4, padding: "2px 7px" }}>{h.estado}</span>
                    }
                  </td>
                  <td style={tdS("center", { color: "#374151", fontWeight: 600 })}>{h.parcelas}</td>
                  <td style={tdS("center", { color: "#374151" })}>{h.parcPagas}</td>
                  <td style={tdS("center", { color: h.parcFalt > 0 ? "#b91c1c" : "#9ca3af", fontWeight: h.parcFalt > 0 ? 600 : 400 })}>{h.parcFalt}</td>
                  <td style={tdS("right", { fontWeight: 700, color: h.parcFalt > 0 ? "#374151" : "#9ca3af" })}>$ {h.valorEmpr - (h.parcPagas * h.vrParc) > 0 ? (h.valorEmpr - h.parcPagas * h.vrParc).toFixed(0) : "0"}</td>
                  <td style={tdS("right", { fontWeight: 700, color: "#1d4ed8" })}>$ {h.valorEmpr.toLocaleString("pt-BR")}</td>
                  <td style={tdS("center", { color: "#6b7280" })}>{h.freq}</td>
                  <td style={tdS("right", { color: "#374151", fontWeight: 600 })}>$ {h.vrParc}</td>
                  <td style={tdS("center", { color: "#374151", fontWeight: 600 })}>{h.visitas}</td>
                  <td style={tdS("center", { color: "#059669", fontWeight: 700 })}>{h.pctJuros}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 18px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
            TOTAL EMPRÉSTIMOS: <span style={{ color: "#1d4ed8" }}>$ {totalEmpr.toLocaleString("pt-BR")}</span>
          </span>
          <button onClick={onClose} style={{ padding: "6px 22px", background: "#64748b", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancelar</button>
        </div>
      </div>

      {selectedHistRow !== null && (
        <PagamentosEmprestimoModal
          nroEmp={selectedHistRow}
          cliente={row.cliente}
          onClose={() => setSelectedHistRow(null)}
        />
      )}
    </div>
  );
}

function EmprestimosNovosContent() {
  const [selectedEmp, setSelectedEmp] = useState<EmpRow | null>(null);
  const fmt = (v: number) => v === 0 ? "0,00" : v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const tdE = (align: "left" | "center" | "right", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "6px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
    textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
  });

  const cols = [
    { label: "Histórico",     w: "6%",  align: "center" as const },
    { label: "Consecutivo",   w: "9%",  align: "center" as const },
    { label: "Frequência",    w: "6%",  align: "center" as const },
    { label: "Valor Ant.",    w: "7%",  align: "right"  as const },
    { label: "Cliente",       w: "20%", align: "left"   as const },
    { label: "Valor Empr.",   w: "8%",  align: "right"  as const },
    { label: "Parcelas",      w: "6%",  align: "center" as const },
    { label: "% Juros",       w: "9%",  align: "center" as const },
    { label: "Valor Parcela", w: "8%",  align: "right"  as const },
    { label: "Data do Empr.", w: "12%", align: "center" as const },
    { label: "Parc. Rest.",   w: "7%",  align: "center" as const },
    { label: "Saldo",         w: "7%",  align: "right"  as const },
  ];

  const totalValorProd = emprestimosData.reduce((a, r) => a + r.valorProd, 0);
  const totalJuros = emprestimosData.reduce((a, r) => a + r.valorJuros, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500"><path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"/></svg>
          Empréstimos Novos
        </span>
        <span className="text-xs text-gray-400 ml-1">{emprestimosData.length} registros encontrados</span>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 font-medium">DATA DE REFERÊNCIA: 2026-03-30</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.label} style={{
                  padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#2563eb",
                  borderRight: "1px solid #3b82f6", letterSpacing: "0.02em",
                  position: "sticky", top: 0, zIndex: 1,
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emprestimosData.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                {/* Histórico button — só para Renovado */}
                <td style={tdE("center")}>
                  {r.tag === "Renovado" && (
                    <button onClick={() => setSelectedEmp(r)} style={{
                      background: "#0e7490", color: "#fff", border: "none", borderRadius: 4,
                      padding: "3px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%",
                    }}>Histórico</button>
                  )}
                </td>
                <td style={tdE("center", { color: "#2563eb", fontWeight: 700 })}>{r.consec}</td>
                <td style={tdE("center", { color: "#6b7280" })}>{r.freq}</td>
                <td style={tdE("right", { color: r.valorAnt > 0 ? "#374151" : "#9ca3af" })}>$ {fmt(r.valorAnt)}</td>
                {/* Cliente with tag */}
                <td style={{ ...tdE("left"), whiteSpace: "normal", overflow: "hidden" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: "#374151", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.cliente}</span>
                    {r.tag === "Novo" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 3, padding: "1px 6px", alignSelf: "flex-start" }}>→→ Novo</span>
                    )}
                    {r.tag === "Renovado" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309", background: "#fef9c3", border: "1px solid #fde047", borderRadius: 3, padding: "1px 6px", alignSelf: "flex-start" }}>→→ Renovado</span>
                    )}
                  </div>
                </td>
                <td style={tdE("right", { fontWeight: 700, color: "#374151" })}>$ {fmt(r.valorProd)}</td>
                <td style={tdE("center", { color: "#374151" })}>{r.parcelas}</td>
                <td style={tdE("center")}>
                  <span style={{ color: "#374151" }}>{r.pctJuros}%</span>
                  <span style={{ color: "#15803d", marginLeft: 3 }}>({fmt(r.valorJuros)})</span>
                </td>
                <td style={tdE("right", { color: "#374151" })}>{fmt(r.valorParcela)}</td>
                <td style={tdE("center", { color: "#6b7280" })}>{r.dataVenda}</td>
                <td style={tdE("center", { color: r.parcRest === 0 ? "#9ca3af" : "#374151" })}>{r.parcRest}</td>
                <td style={tdE("right", { color: r.saldo > 0 ? "#374151" : "#9ca3af" })}>{fmt(r.saldo)}</td>
              </tr>
            ))}
            {/* Total row */}
            <tr style={{ background: "#e8edf2", fontWeight: 700 }}>
              <td colSpan={5} style={{ ...tdE("right"), color: "#374151", fontWeight: 700, fontSize: 12, paddingRight: 12 }}>
                TOTAL EMPRÉSTIMOS DO DIA:
              </td>
              <td style={tdE("right", { fontWeight: 700, color: "#1d4ed8" })}>$ {fmt(totalValorProd)}</td>
              <td style={tdE("center")} />
              <td style={tdE("center", { fontWeight: 700, color: "#15803d" })}>({fmt(totalJuros)})</td>
              <td colSpan={4} style={tdE("center")} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#2563eb" }}>
        <div className="ml-auto text-xs text-blue-200">DATA DE REFERÊNCIA: 2026-03-30</div>
      </div>
      {selectedEmp && <HistorialVendasModal row={selectedEmp} onClose={() => setSelectedEmp(null)} />}
    </div>
  );
}

// ── Despesas data ─────────────────────────────────────────────────────────────
const despesasData = [
  { id: 1, categoria: "Combustível",        descricao: "Abastecimento veículo operacional",  valor: 120.00, data: "2026-05-25", hora: "07:45", responsavel: "João Mendes",   obs: "" },
  { id: 2, categoria: "Alimentação",        descricao: "Almoço equipe",                       valor: 85.00,  data: "2026-05-25", hora: "12:30", responsavel: "João Mendes",   obs: "4 pessoas" },
  { id: 3, categoria: "Retirada de Caixa", descricao: "Retirada diária do operador",         valor: 500.00, data: "2026-05-25", hora: "14:00", responsavel: "Carlos Souza",  obs: "Autorizado" },
  { id: 4, categoria: "Material",          descricao: "Material de escritório",               valor: 35.00,  data: "2026-05-25", hora: "15:10", responsavel: "Ana Lima",      obs: "" },
  { id: 5, categoria: "Manutenção",        descricao: "Manutenção preventiva veículo",       valor: 220.00, data: "2026-05-25", hora: "16:00", responsavel: "Carlos Souza",  obs: "Troca de óleo" },
  { id: 6, categoria: "Combustível",        descricao: "Abastecimento rota extra",            valor: 60.00,  data: "2026-05-25", hora: "17:20", responsavel: "João Mendes",   obs: "" },
  { id: 7, categoria: "Outros",            descricao: "Recarga cartão telefone",              valor: 30.00,  data: "2026-05-25", hora: "08:50", responsavel: "Ana Lima",      obs: "" },
];

const categoriaColor: Record<string, { bg: string; text: string; border: string }> = {
  "Combustível":        { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  "Alimentação":        { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  "Retirada de Caixa": { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" },
  "Material":          { bg: "#e0f2fe", text: "#075985", border: "#7dd3fc" },
  "Manutenção":        { bg: "#f3e8ff", text: "#6b21a8", border: "#d8b4fe" },
  "Outros":            { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
};

function DespesasContent() {
  const cols = [
    { label: "Nro.",          w: 54,  align: "center" as const },
    { label: "Categoria",     w: 150, align: "center" as const },
    { label: "Descrição",     w: 300, align: "left"   as const },
    { label: "Valor",         w: 120, align: "right"  as const },
    { label: "Data",          w: 110, align: "center" as const },
    { label: "Hora",          w: 80,  align: "center" as const },
    { label: "Responsável",   w: 160, align: "left"   as const },
    { label: "Observações",   w: 200, align: "left"   as const },
  ];

  const total = despesasData.reduce((a, r) => a + r.valor, 0);
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

  const tdD = (align: "left" | "center" | "right", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "5px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
    textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500"><path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5l4-4h10v4z"/></svg>
          Despesas do Dia
        </span>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 font-medium">DATA DE REFERÊNCIA: 2026-05-25</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", minWidth: 1024 }}>
          <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.label} style={{
                  padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#2563eb",
                  borderRight: "1px solid #3b82f6", letterSpacing: "0.02em",
                  position: "sticky", top: 0, zIndex: 1,
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {despesasData.map((r, i) => {
              const cat = categoriaColor[r.categoria] ?? categoriaColor["Outros"];
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={tdD("center", { color: "#6b7280", fontWeight: 700, fontSize: 12 })}>{r.id}</td>
                  <td style={tdD("center")}>
                    <span style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 4,
                      fontSize: 11, fontWeight: 700,
                      background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`,
                    }}>{r.categoria}</span>
                  </td>
                  <td style={tdD("left", { color: "#374151" })}>{r.descricao}</td>
                  <td style={tdD("right", { fontWeight: 700, color: "#b91c1c" })}>{fmt(r.valor)}</td>
                  <td style={tdD("center", { color: "#6b7280" })}>{r.data}</td>
                  <td style={tdD("center", { color: "#6b7280" })}>{r.hora}</td>
                  <td style={tdD("left", { color: "#374151" })}>{r.responsavel}</td>
                  <td style={tdD("left", { color: "#6b7280", fontStyle: r.obs ? "normal" : "italic" })}>{r.obs || "—"}</td>
                </tr>
              );
            })}
            <tr style={{ background: "#e8edf2", fontWeight: 700 }}>
              <td colSpan={3} style={{ ...tdD("right"), color: "#374151", fontWeight: 700, fontSize: 12, paddingRight: 12 }}>
                TOTAL DE DESPESAS DO DIA:
              </td>
              <td style={tdD("right", { fontWeight: 700, color: "#b91c1c" })}>{fmt(total)}</td>
              <td colSpan={4} style={tdD("center")} />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#2563eb" }}>
        <div className="ml-auto text-xs text-blue-200">DATA DE REFERÊNCIA: 2026-05-25</div>
      </div>
    </div>
  );
}

// ── Rendimentos data ───────────────────────────────────────────────────────────
const rendimentosData = [
  { id: 1, categoria: "Aporte",         descricao: "Aporte inicial de caixa para rota",       valor: 1500.00, data: "2026-05-25", hora: "07:00", responsavel: "Carlos Souza",  obs: "Abertura do dia" },
  { id: 2, categoria: "Depósito",       descricao: "Depósito bancário transferido para caixa", valor: 800.00,  data: "2026-05-25", hora: "08:30", responsavel: "João Mendes",   obs: "" },
  { id: 3, categoria: "Entrada Extra",  descricao: "Entrada extra - venda de serviço avulso",  valor: 150.00,  data: "2026-05-25", hora: "10:45", responsavel: "Ana Lima",      obs: "Serviço pontual" },
  { id: 4, categoria: "Transferência",  descricao: "Transferência entre rotas - matriz",        valor: 500.00,  data: "2026-05-25", hora: "12:00", responsavel: "Carlos Souza",  obs: "Autorizado" },
  { id: 5, categoria: "Aporte",         descricao: "Aporte emergencial para cobertura",        valor: 300.00,  data: "2026-05-25", hora: "14:20", responsavel: "João Mendes",   obs: "Saldo baixo" },
  { id: 6, categoria: "Entrada Extra",  descricao: "Recebimento de taxa administrativa",       valor: 75.00,   data: "2026-05-25", hora: "15:50", responsavel: "Ana Lima",      obs: "" },
];

const rendCategoriaColor: Record<string, { bg: string; text: string; border: string }> = {
  "Aporte":        { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  "Depósito":      { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
  "Entrada Extra": { bg: "#f3e8ff", text: "#6b21a8", border: "#d8b4fe" },
  "Transferência": { bg: "#fef9c3", text: "#92400e", border: "#fde047" },
  "Outros":        { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
};

function RendimentosContent() {
  const cols = [
    { label: "Nro.",          w: 54,  align: "center" as const },
    { label: "Categoria",     w: 150, align: "center" as const },
    { label: "Descrição",     w: 300, align: "left"   as const },
    { label: "Valor",         w: 120, align: "right"  as const },
    { label: "Data",          w: 110, align: "center" as const },
    { label: "Hora",          w: 80,  align: "center" as const },
    { label: "Responsável",   w: 160, align: "left"   as const },
    { label: "Observações",   w: 200, align: "left"   as const },
  ];

  const total = rendimentosData.reduce((a, r) => a + r.valor, 0);
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

  const tdR = (align: "left" | "center" | "right", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "5px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
    textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
          Ingressos de Caixa do Dia
        </span>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 font-medium">DATA DE REFERÊNCIA: 2026-05-25</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", minWidth: 1024 }}>
          <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.label} style={{
                  padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#2563eb",
                  borderRight: "1px solid #3b82f6", letterSpacing: "0.02em",
                  position: "sticky", top: 0, zIndex: 1,
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rendimentosData.map((r, i) => {
              const cat = rendCategoriaColor[r.categoria] ?? rendCategoriaColor["Outros"];
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={tdR("center", { color: "#6b7280", fontWeight: 700, fontSize: 12 })}>{r.id}</td>
                  <td style={tdR("center")}>
                    <span style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 4,
                      fontSize: 11, fontWeight: 700,
                      background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`,
                    }}>{r.categoria}</span>
                  </td>
                  <td style={tdR("left", { color: "#374151" })}>{r.descricao}</td>
                  <td style={tdR("right", { fontWeight: 700, color: "#15803d" })}>{fmt(r.valor)}</td>
                  <td style={tdR("center", { color: "#6b7280" })}>{r.data}</td>
                  <td style={tdR("center", { color: "#6b7280" })}>{r.hora}</td>
                  <td style={tdR("left", { color: "#374151" })}>{r.responsavel}</td>
                  <td style={tdR("left", { color: "#6b7280", fontStyle: r.obs ? "normal" : "italic" })}>{r.obs || "—"}</td>
                </tr>
              );
            })}
            <tr style={{ background: "#e8edf2", fontWeight: 700 }}>
              <td colSpan={3} style={{ ...tdR("right"), color: "#374151", fontWeight: 700, fontSize: 12, paddingRight: 12 }}>
                TOTAL DE RENDIMENTOS DO DIA:
              </td>
              <td style={tdR("right", { fontWeight: 700, color: "#15803d" })}>{fmt(total)}</td>
              <td colSpan={4} style={tdR("center")} />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#2563eb" }}>
        <div className="ml-auto text-xs text-blue-200">DATA DE REFERÊNCIA: 2026-05-25</div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [activeMain, setActiveMain] = useState("Liq. Diária");
  const [activeSub, setActiveSub] = useState("Relatório Diário");

  const isDesempenho = activeMain === "Desempenho";
  const showContent = activeMain === "Liq. Diária" && activeSub === "Relatório Diário";
  const showPagamentos = activeMain === "Liq. Diária" && activeSub === "Pagamentos";
  const showEmprestimos = activeMain === "Liq. Diária" && activeSub === "Empréstimos Novos";
  const showDespesas = activeMain === "Liq. Diária" && activeSub === "Despesas";
  const showRendimentos = activeMain === "Liq. Diária" && activeSub === "Rendimentos";

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

      {/* ── FILTER BAR (hidden on Desempenho and Pagamentos) ── */}
      {!isDesempenho && !showPagamentos && !showEmprestimos && !showDespesas && !showRendimentos && (
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
        ) : showPagamentos ? (
          <PagamentosContent />
        ) : showEmprestimos ? (
          <EmprestimosNovosContent />
        ) : showDespesas ? (
          <DespesasContent />
        ) : showRendimentos ? (
          <RendimentosContent />
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
              <Row label="Clientes Novos" index={1}>
                <PersonIcon /> <strong className="text-gray-800">0</strong> <span className="text-gray-400 text-[11px]">(0/0)</span>
              </Row>

              <Row label="Clientes Renovados" index={2}>
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
              <Row label="Novos Empréstimos" index={5}>
                <span className="font-semibold text-gray-800">$ 0,00</span>
                <span className="text-gray-400 text-[11px]">( Juros: $ 0,00 )</span>
              </Row>
              <Row label="Rendimentos" index={6}>
                <span className="text-blue-600 font-bold text-sm">+</span>
                <span className="font-semibold text-blue-700">0,00</span>
              </Row>
              <Row label="Despesas" index={7}>
                <span className="text-gray-500 font-bold text-sm">−</span>
                <span className="font-semibold text-gray-600">0,00</span>
              </Row>
              <Row label="Retirada de Caixa" index={8}>
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
