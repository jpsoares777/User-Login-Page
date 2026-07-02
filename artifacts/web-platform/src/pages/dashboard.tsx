import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { useLocation } from "wouter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ClipboardCheck, TrendingUp } from "lucide-react";
import menuIcon from "@assets/windows_104558_1776473182467.webp";
import iconGerenciar from "@assets/2205843-mobile-settings-icon-vetor_1781283702330.jpg";
import iconGerenciarClientes from "@assets/4168988_1781283346707.png";
import iconGerenciarApp2 from "@assets/1570102_1781283457472.png";
import iconFinanceiro from "@assets/313011_1781284759448.png";
import iconImportarRota from "@assets/images_1781285052367.png";
import iconFaturas from "@assets/1611154_1781285163664.png";
import iconDinheiro from "@assets/businesscostcutexpensefinancemoney-glyph-icon--vector-png_2549_1781286038926.jpg";
import iconCaixaGeral from "@assets/CGD_Logo_2017_1781286652422.png";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Label, Customized,
} from "recharts";

const MAIN_TABS = ["Desempenho", "Liq. Diária", "Liq. Períodos", "Consolidados"];
const SUB_TABS = ["Relatório Diário", "Pagamentos", "Novos Empréstimos", "Despesas", "Rendimentos", "Clientes", "Agendados", "Relatórios"];
const LIQ_PERIODOS_TABS = ["Liquidação", "Pagamentos", "Empr. por Períodos", "Rendimentos", "Despesas", "Clientes", "Resumo"];

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

function ChartCard({ children, year = "2026", subtitle, showMonth = false, rotas = [] }: { children: React.ReactNode; year?: string; subtitle?: string; showMonth?: boolean; rotas?: string[] }) {
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
          {rotas.length > 0 ? rotas.map(r => <option key={r}>{r}</option>) : <option>— Selecione —</option>}
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

const despesasCatData = [
  { name: "Empréstimos (4200)", value: 4200, color: "#3d9cd2" },
  { name: "Operacional (980)",  value: 980,  color: "#4cae4c" },
  { name: "Administrativo (620)", value: 620, color: "#e8a838" },
  { name: "Outros (340)",       value: 340,  color: "#2e2e2e" },
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

function DesempenhoContent({ rotas = [] }: { rotas?: string[] }) {
  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: "#f0f2f5", gap: 16, padding: 12 }}>

      {/* Row 1: 3 bar charts */}
      <div className="flex min-h-0" style={{ flex: 1, gap: 16 }}>

        <ChartCard rotas={rotas}>
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

        <ChartCard rotas={rotas}>
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

        <ChartCard rotas={rotas}>
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

        <ChartCard subtitle="Despesas por Categoria – 2026" year="2026" showMonth rotas={rotas}>
          <Pie3DChart data={gastosPieData} />
        </ChartCard>

        <ChartCard subtitle="Rendimentos por Categoria 2026" year="2026" showMonth rotas={rotas}>
          <Pie3DChart data={ingresosPieData} />
        </ChartCard>

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
  { id:13, status: "ruim",  consecutivo: "4700627031", cliente: "CARLOS HENRIQUE SOUZA LIMA",       obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo",     valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "650,00",  sancao: "0,00", saldo: "590,00",  restantes: "11.0", visitas: 7,  freq: "Diario" },
  { id:14, status: "bom",   consecutivo: "4700627044", cliente: "FERNANDA CRISTINA MOURA",          obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo",     valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "980,00",  sancao: "0,00", saldo: "840,00",  restantes: "8.0",  visitas: 15, freq: "Diario" },
  { id:15, status: "medio", consecutivo: "4700627052", cliente: "JOSÉ WELLINGTON PEREIRA NUNES",    obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo",     valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "1.260,00",sancao: "0,00", saldo: "1.120,00",restantes: "16.0", visitas: 6,  freq: "Semanal" },
  { id:16, status: "ruim",  consecutivo: "4700627061", cliente: "LUCIANA APARECIDA FERREIRA",       obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo",     valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "700,00",  sancao: "0,00", saldo: "630,00",  restantes: "9.0",  visitas: 11, freq: "Diario" },
  { id:17, status: "bom",   consecutivo: "4700627073", cliente: "MARCOS VINÍCIUS ALMEIDA COSTA",    obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo",     valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "840,00",  sancao: "0,00", saldo: "350,00",  restantes: "5.0",  visitas: 19, freq: "Diario" },
  { id:18, status: "ruim",  consecutivo: "4700627081", cliente: "NATALIA RODRIGUES DA SILVA",       obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo",     valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "560,00",  sancao: "0,00", saldo: "560,00",  restantes: "14.0", visitas: 2,  freq: "Diario" },
  { id:19, status: "medio", consecutivo: "4700627092", cliente: "PEDRO HENRIQUE BARBOSA SANTOS",    obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo",     valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "1.400,00",sancao: "0,00", saldo: "980,00",  restantes: "10.0", visitas: 8,  freq: "Quinzenal" },
  { id:20, status: "bom",   consecutivo: "4700627103", cliente: "ROSANGELA MATOS DE OLIVEIRA",      obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo",     valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "490,00",  sancao: "0,00", saldo: "210,00",  restantes: "3.0",  visitas: 22, freq: "Diario" },
  { id:21, status: "ruim",  consecutivo: "4700627115", cliente: "SANDRA FÁTIMA CAVALCANTE",         obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Transferência",valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "1.120,00",sancao: "0,00", saldo: "1.050,00",restantes: "15.0", visitas: 4,  freq: "Diario" },
  { id:22, status: "medio", consecutivo: "4700627128", cliente: "TIAGO AUGUSTO REZENDE SILVA",      obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Transferência",valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "770,00",  sancao: "0,00", saldo: "630,00",  restantes: "9.0",  visitas: 14, freq: "Semanal" },
  { id:23, status: "bom",   consecutivo: "4700627136", cliente: "VALDETE SOUSA NASCIMENTO",         obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo",     valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "350,00",  sancao: "0,00", saldo: "140,00",  restantes: "2.0",  visitas: 20, freq: "Diario" },
  { id:24, status: "ruim",  consecutivo: "4700627147", cliente: "WELLINGTON COSTA BRAGA",           obs: "Operacion Masiva", pagadas: "0.0", formaPago: "Efectivo",     valor: "0,00", fecha: "2026-05-25", hora: "20:12:44", valorProd: "910,00",  sancao: "0,00", saldo: "870,00",  restantes: "13.0", visitas: 5,  freq: "Diario" },
];

type PagRow = typeof pagamentosData[0];

function TipoBadge({ tipo }: { tipo: string }) {
  const cfg =
    tipo === "S/PAG." ? { bg: "#dc2626", icon: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z", color: "#dc2626" } :
    tipo === "ABONO"  ? { bg: "#d97706", icon: "M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z",                                              color: "#d97706" } :
                        { bg: "#16a34a", icon: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",                                               color: "#16a34a" };
  const label = tipo === "S/PAG." ? "S/PAG." : tipo === "ABONO" ? "ABONO" : "PARC.";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: cfg.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: "#fff" }}><path d={cfg.icon}/></svg>
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{label}</span>
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
  const total = hist.filter(h => h.tipo === "PARC.").reduce((s, h) => s + h.valor, 0);
  const trunc = (n: string) => n.length > 22 ? n.slice(0, 19) + "..." : n;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 8, width: 760, maxWidth: "96vw", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
        onClick={e => e.stopPropagation()}>

        {/* Título */}
        <div style={{ background: "#3d6e8e", borderRadius: "8px 8px 0 0", padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Histórico de Pagamentos</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 4, background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Cliente */}
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12, background: "#fff" }}>
          <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: "#d97706", flexShrink: 0 }}><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#d97706", letterSpacing: "0.05em", textTransform: "uppercase" }}>{row.cliente}</span>
          <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 4 }}>Empréstimo #{row.consecutivo}</span>
        </div>

        {/* Tabela */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  { l: "Nro.",        w: "7%",  a: "center" as const },
                  { l: "Cliente",     w: "28%", a: "left"   as const },
                  { l: "Tipo",        w: "14%", a: "left"   as const },
                  { l: "Valor",       w: "14%", a: "right"  as const },
                  { l: "Fecha",       w: "16%", a: "left"   as const },
                  { l: "Observações", w: "21%", a: "left"   as const },
                ].map(c => (
                  <th key={c.l} style={{ padding: "9px 14px", textAlign: c.a, fontSize: 13, fontWeight: 700, color: "#374151", background: "#e8edf2", borderBottom: "2px solid #cbd5e1", whiteSpace: "nowrap", width: c.w }}>{c.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hist.map((h, i) => (
                <tr key={h.nro} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: "8px 14px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#2563eb", borderBottom: "1px solid #f0f0f0" }}>{h.nro}</td>
                  <td style={{ padding: "8px 14px", fontSize: 13, color: "#2563eb", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>{trunc(row.cliente)}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}><TipoBadge tipo={h.tipo} /></td>
                  <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#374151", textAlign: "right", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>R$ {h.valor.toFixed(2).replace(".", ",")}</td>
                  <td style={{ padding: "8px 14px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{h.fecha}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#9ca3af", borderBottom: "1px solid #f0f0f0" }}>{h.obs === "Cuota" ? "" : h.obs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <div style={{ padding: "13px 18px", borderTop: "2px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
            TOTAL PAGOS: <span style={{ color: "#2563eb" }}>R$ {total.toFixed(2).replace(".", ",")}</span>
          </span>
          <button onClick={onClose} style={{ padding: "7px 24px", background: "#2563eb", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function PagamentosContent() {
  const [selectedRow, setSelectedRow] = useState<PagRow | null>(null);

  const cols = [
    { label: "Nro.",             w: "4%",  align: "center" as const },
    { label: "Nº do Empréstimo", w: "10%", align: "left"   as const },
    { label: "Cliente",          w: "16%", align: "left"   as const },
    { label: "Observações",      w: "10%", align: "left"   as const },
    { label: "Pagas",            w: "5%",  align: "center" as const },
    { label: "Tipo",             w: "8%",  align: "center" as const },
    { label: "Forma Pag.",       w: "7%",  align: "left"   as const },
    { label: "Valor",            w: "7%",  align: "right"  as const },
    { label: "Data",             w: "8%",  align: "center" as const },
    { label: "Hora",             w: "6%",  align: "center" as const },
    { label: "Valor Empr.",      w: "9%",  align: "left"   as const },
    { label: "Saldo",            w: "7%",  align: "right"  as const },
    { label: "Parc. Rest.",      w: "6%",  align: "center" as const },
    { label: "Visitas",          w: "5%",  align: "center" as const },
    { label: "Frequência",       w: "6%",  align: "center" as const },
  ];

  const parseVal = (s: string) => parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  const totalRecebimento = pagamentosData.reduce((a, r) => a + parseVal(r.valor), 0);
  const totalEsperado = pagamentosData.reduce((a, r) => a + parseVal(r.valorProd), 0);
  const taxaPct = totalEsperado > 0 ? (totalRecebimento / totalEsperado) * 100 : 0;
  const fmtR = (v: number) => `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

  const inputCls = "h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 placeholder-gray-400 text-gray-700";

  const tdP = (align: "left" | "center" | "right", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "6px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
    textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Filter bar ── */}
      <div className="shrink-0 flex items-end gap-2 flex-wrap px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Consecutivo</label>
          <input placeholder="Ex: 4700627089" className={`${inputCls} w-32`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Nome</label>
          <input placeholder="Nome do cliente" className={`${inputCls} w-36`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Sobrenome</label>
          <input placeholder="Sobrenome" className={`${inputCls} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Documento</label>
          <input placeholder="CPF / RG" className={`${inputCls} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Forma de Pag.</label>
          <select className={`${inputCls} w-32`}>
            <option value="">-- Todas --</option>
            <option>Efectivo</option>
            <option>Transferência</option>
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Frequência</label>
          <select className={`${inputCls} w-28`}>
            <option value="">-- Todas --</option>
            <option>Diario</option>
            <option>Semanal</option>
            <option>Quinzenal</option>
          </select>
        </div>
        <div className="flex gap-1.5 pb-0.5">
          <button className="h-7 px-3 rounded text-xs font-semibold border border-gray-300 text-gray-600 bg-white hover:bg-gray-50">Limpar</button>
          <button className="h-7 px-3 rounded text-xs font-semibold text-white flex items-center gap-1 hover:opacity-90" style={{ background: "#2563eb" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            Buscar
          </button>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 font-medium pb-0.5">DATA DE REFERÊNCIA: 2026-05-25</span>
      </div>

      {/* ── Count bar ── */}
      <div className="shrink-0 flex items-center px-3 py-1.5" style={{ background: "#f0f2f5", borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-xs text-gray-500">
          <span className="font-bold text-gray-800">{pagamentosData.length}</span> registros encontrados
        </span>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.label} style={{
                  padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                  borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
                  position: "sticky", top: 0, zIndex: 1,
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagamentosData.map((r, i) => {
              const rowBg = i % 2 === 0 ? "#fff" : "#f9fafb";
              return (
                <tr key={r.id} style={{ cursor: "pointer" }}
                  onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = "#eff6ff")}
                  onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = rowBg)}>
                  <td style={tdP("center", { color: "#6b7280", fontWeight: 700, fontSize: 12 })}>{r.id}</td>
                  <td style={tdP("left", { color: "#2563eb", fontWeight: 700 })}>
                    <span style={{ borderBottom: "1px dashed #93c5fd" }}>{r.consecutivo}</span>
                  </td>
                  <td style={tdP("left", {
                      color: r.status === "bom" ? "#16a34a" : r.status === "ruim" ? "#dc2626" : "#d97706",
                      fontWeight: 600,
                    })} onClick={() => setSelectedRow(r)}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", textDecoration: "underline", textUnderlineOffset: 2 }}>{r.cliente}</span>
                      <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "#d1d5db", flexShrink: 0 }}><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
                    </span>
                  </td>
                  <td style={tdP("left", { color: "#6b7280", fontStyle: "italic" })}>{r.obs}</td>
                  <td style={tdP("center")}>{r.pagadas}</td>
                  <td style={tdP("center")}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca",
                      fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                      Não Pago
                    </span>
                  </td>
                  <td style={tdP("left")}>{r.formaPago}</td>
                  <td style={tdP("right", { fontWeight: 600, color: "#111827" })}>R$ {r.valor}</td>
                  <td style={tdP("center", { color: "#4b5563" })}>{r.fecha}</td>
                  <td style={tdP("center", { color: "#6b7280" })}>{r.hora}</td>
                  <td style={tdP("left")}>
                    <span style={{ fontWeight: 600, color: "#111827" }}>R$ {r.valorProd}</span>
                  </td>
                  <td style={tdP("right", { fontWeight: 700, color: "#059669" })}>R$ {r.saldo}</td>
                  <td style={tdP("center")}>{r.restantes}</td>
                  <td style={tdP("center", { fontWeight: 600 })}>{r.visitas}</td>
                  <td style={tdP("center")}>
                    <span style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20 }}>
                      {r.freq}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Total flutuante ── */}
      <div className="shrink-0 flex items-center justify-start gap-3 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL RECEBIDO</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#15803d", padding: "1px 10px", borderRadius: 6 }}>
          {fmtR(totalRecebimento)}
        </span>
      </div>

      {/* ── Footer (padrão) ── */}
      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />

      {selectedRow && <HistorialModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
}

// ── Empréstimos Novos data ─────────────────────────────────────────────────────
const emprestimosData = [
  { id: 1,  consec: "4700627026", freq: "Diário",    valorAnt: 600.00,  cliente: "Andrela de Jesus Costa Araújo",  tag: "Renovado", documento: "91633427315",  celular: "98985014328",  valorProd: 800.00,  parcelas: 14, pctJuros: 40, valorJuros: 320.00,  valorParcela: 80.00,  dataVenda: "2026-03-30 14:03:51", parcRest: 0,  saldo: 0.00,    numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
  { id: 2,  consec: "4700627089", freq: "Diário",    valorAnt: 0.00,    cliente: "Geilson Eduardo Rosa de Jesus",   tag: "Novo",     documento: "00503307300",  celular: "9885397102",   valorProd: 700.00,  parcelas: 14, pctJuros: 40, valorJuros: 280.00,  valorParcela: 70.00,  dataVenda: "2026-03-30 19:39:09", parcRest: 10, saldo: 700.00,  numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
  { id: 3,  consec: "4700627090", freq: "Diário",    valorAnt: 0.00,    cliente: "Daniele Texeira Lindoso",         tag: "Novo",     documento: "01148713379",  celular: "559899687036", valorProd: 1000.00, parcelas: 14, pctJuros: 40, valorJuros: 400.00,  valorParcela: 100.00, dataVenda: "2026-03-30 21:03:29", parcRest: 9,  saldo: 900.00,  numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
  { id: 4,  consec: "4700627058", freq: "Diário",    valorAnt: 1120.00, cliente: "Aline Lima De Alencar",           tag: "Renovado", documento: "44455566677",  celular: "98985678901",  valorProd: 1120.00, parcelas: 14, pctJuros: 40, valorJuros: 448.00,  valorParcela: 112.00, dataVenda: "2026-04-01 09:15:00", parcRest: 13, saldo: 1040.00, numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
  { id: 5,  consec: "4700627078", freq: "Diário",    valorAnt: 0.00,    cliente: "Mariana Beatriz Rabelo Barbosa",  tag: "Novo",     documento: "22233344455",  celular: "98985721207",  valorProd: 1000.00, parcelas: 14, pctJuros: 40, valorJuros: 400.00,  valorParcela: 100.00, dataVenda: "2026-04-05 10:30:00", parcRest: 14, saldo: 1400.00, numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
  { id: 6,  consec: "4700627022", freq: "Diário",    valorAnt: 900.00,  cliente: "Kleiton Viana Gonçalves",         tag: "Renovado", documento: "33344455566",  celular: "98983210011",  valorProd: 900.00,  parcelas: 20, pctJuros: 40, valorJuros: 360.00,  valorParcela: 63.00,  dataVenda: "2026-04-06 08:00:00", parcRest: 16, saldo: 420.00,  numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
  { id: 7,  consec: "4700627145", freq: "Diário",    valorAnt: 0.00,    cliente: "Bores Viana De Souza",            tag: "Novo",     documento: "55566677788",  celular: "98984321100",  valorProd: 560.00,  parcelas: 14, pctJuros: 40, valorJuros: 224.00,  valorParcela: 56.00,  dataVenda: "2026-04-08 14:20:00", parcRest: 12, saldo: 480.00,  numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
  { id: 8,  consec: "4700627024", freq: "Diário",    valorAnt: 800.00,  cliente: "Anny Briane Pires Belfort",       tag: "Renovado", documento: "66677788899",  celular: "98987654321",  valorProd: 1120.00, parcelas: 14, pctJuros: 40, valorJuros: 448.00,  valorParcela: 112.00, dataVenda: "2026-04-10 11:00:00", parcRest: 3,  saldo: 210.00,  numSeguro: "SEG-003",vrSeguro: 100.00, chaveAutor: "" },
  { id: 9,  consec: "4700627023", freq: "Diário",    valorAnt: 0.00,    cliente: "Elaira Kisley Conceição Lopes",   tag: "Novo",     documento: "88899900011",  celular: "98986543210",  valorProd: 540.00,  parcelas: 14, pctJuros: 40, valorJuros: 216.00,  valorParcela: 54.00,  dataVenda: "2026-04-10 13:45:00", parcRest: 9,  saldo: 540.00,  numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
  { id: 10, consec: "4700627027", freq: "Diário",    valorAnt: 0.00,    cliente: "Antônio Leite Neto",              tag: "Novo",     documento: "99900011122",  celular: "98981234567",  valorProd: 800.00,  parcelas: 14, pctJuros: 40, valorJuros: 320.00,  valorParcela: 80.00,  dataVenda: "2026-04-12 09:00:00", parcRest: 12, saldo: 750.00,  numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
  { id: 11, consec: "4700627164", freq: "Diário",    valorAnt: 0.00,    cliente: "Erick Pereira Santos",            tag: "Novo",     documento: "11122233344",  celular: "98982345678",  valorProd: 840.00,  parcelas: 14, pctJuros: 40, valorJuros: 336.00,  valorParcela: 84.00,  dataVenda: "2026-04-14 16:10:00", parcRest: 13, saldo: 780.00,  numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
  { id: 12, consec: "4700627059", freq: "Semanal",   valorAnt: 600.00,  cliente: "Patrick Michael Sá Menezes",      tag: "Renovado", documento: "22233344456",  celular: "98984444555",  valorProd: 700.00,  parcelas: 12, pctJuros: 40, valorJuros: 280.00,  valorParcela: 82.00,  dataVenda: "2026-04-15 10:30:00", parcRest: 12, saldo: 600.00,  numSeguro: "",       vrSeguro: 0.00,   chaveAutor: "" },
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
  4: [
    { nro: 3, tipo: "S/PAG.",  valor: 0,   data: "2026-05-25", obs: "Operação Masiva" },
    { nro: 2, tipo: "PARC.",   valor: 112, data: "2026-05-01", obs: "" },
    { nro: 1, tipo: "PARC.",   valor: 112, data: "2026-04-15", obs: "" },
  ],
  5: [
    { nro: 1, tipo: "PARC.",   valor: 100, data: "2026-04-20", obs: "" },
  ],
  6: [
    { nro: 4, tipo: "PARC.",   valor: 63,  data: "2026-05-10", obs: "" },
    { nro: 3, tipo: "PARC.",   valor: 63,  data: "2026-04-28", obs: "" },
    { nro: 2, tipo: "S/PAG.",  valor: 0,   data: "2026-04-18", obs: "Operação Masiva" },
    { nro: 1, tipo: "PARC.",   valor: 63,  data: "2026-04-12", obs: "" },
  ],
  7: [
    { nro: 2, tipo: "PARC.",   valor: 56,  data: "2026-05-05", obs: "" },
    { nro: 1, tipo: "PARC.",   valor: 56,  data: "2026-04-22", obs: "" },
  ],
  8: [
    { nro: 11, tipo: "PARC.",  valor: 112, data: "2026-05-20", obs: "" },
    { nro: 10, tipo: "PARC.",  valor: 112, data: "2026-05-05", obs: "" },
    { nro: 9,  tipo: "S/PAG.", valor: 0,   data: "2026-04-29", obs: "Operação Masiva" },
    { nro: 8,  tipo: "PARC.",  valor: 112, data: "2026-04-28", obs: "" },
  ],
  9: [
    { nro: 5, tipo: "PARC.",   valor: 54,  data: "2026-05-18", obs: "" },
    { nro: 4, tipo: "S/PAG.",  valor: 0,   data: "2026-05-11", obs: "Operação Masiva" },
    { nro: 3, tipo: "PARC.",   valor: 54,  data: "2026-05-04", obs: "" },
    { nro: 2, tipo: "PARC.",   valor: 54,  data: "2026-04-24", obs: "" },
    { nro: 1, tipo: "PARC.",   valor: 54,  data: "2026-04-17", obs: "" },
  ],
  10: [
    { nro: 2, tipo: "PARC.",   valor: 80,  data: "2026-05-02", obs: "" },
    { nro: 1, tipo: "PARC.",   valor: 80,  data: "2026-04-19", obs: "" },
  ],
  11: [
    { nro: 1, tipo: "PARC.",   valor: 84,  data: "2026-04-28", obs: "" },
  ],
  12: [
    { nro: 1, tipo: "PARC.",   valor: 82,  data: "2026-04-22", obs: "" },
  ],
};

function PagamentosEmprestimoModal({
  nroEmp, cliente, onClose,
}: { nroEmp: number; cliente: string; onClose: () => void }) {
  const pagamentos = pagamentosPorEmprestimo[nroEmp] ?? [];
  const total = pagamentos.filter(p => p.tipo === "PARC.").reduce((a, p) => a + p.valor, 0);
  const trunc = (n: string) => n.length > 22 ? n.slice(0, 19) + "..." : n;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 8, width: 760, maxWidth: "96vw", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
        onClick={e => e.stopPropagation()}>

        {/* Título */}
        <div style={{ background: "#3d6e8e", borderRadius: "8px 8px 0 0", padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Histórico de Pagamentos</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 4, background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Cliente */}
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12, background: "#fff" }}>
          <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: "#d97706", flexShrink: 0 }}><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#d97706", letterSpacing: "0.05em", textTransform: "uppercase" }}>{cliente}</span>
          <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 4 }}>Empréstimo #{nroEmp}</span>
        </div>

        {/* Tabela */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "7%" }} /><col style={{ width: "28%" }} /><col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} /><col style={{ width: "16%" }} /><col style={{ width: "21%" }} />
            </colgroup>
            <thead>
              <tr>
                {[
                  { l: "Nro.",        a: "center" as const },
                  { l: "Cliente",     a: "left"   as const },
                  { l: "Tipo",        a: "left"   as const },
                  { l: "Valor",       a: "right"  as const },
                  { l: "Data",        a: "left"   as const },
                  { l: "Observações", a: "left"   as const },
                ].map(c => (
                  <th key={c.l} style={{ padding: "9px 14px", textAlign: c.a, fontSize: 13, fontWeight: 700, color: "#374151", background: "#e8edf2", borderBottom: "2px solid #cbd5e1", whiteSpace: "nowrap", position: "sticky", top: 0 }}>{c.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ padding: "8px 14px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#2563eb", borderBottom: "1px solid #f0f0f0" }}>{p.nro}</td>
                  <td style={{ padding: "8px 14px", fontSize: 13, color: "#2563eb", fontWeight: 600, borderBottom: "1px solid #f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trunc(cliente)}</td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}><TipoBadge tipo={p.tipo} /></td>
                  <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#374151", textAlign: "right", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>R$ {p.valor.toFixed(2).replace(".", ",")}</td>
                  <td style={{ padding: "8px 14px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{p.data}</td>
                  <td style={{ padding: "8px 14px", fontSize: 12, color: "#9ca3af", borderBottom: "1px solid #f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.obs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <div style={{ padding: "13px 18px", borderTop: "2px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
            TOTAL PAGOS: <span style={{ color: "#2563eb" }}>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </span>
          <button onClick={onClose} style={{ padding: "7px 24px", background: "#2563eb", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Cancelar</button>
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
    background: "#3d6e8e", borderRight: "1px solid #4a7fa0",
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
          Novos Empréstimos
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
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                  borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
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
          </tbody>
        </table>
      </div>

      {/* ── Total flutuante ── */}
      <div className="shrink-0 flex items-center justify-start gap-8 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL EMPRÉSTIMOS</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#1d4ed8", padding: "1px 10px", borderRadius: 6 }}>$ {fmt(totalValorProd)}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#15803d", padding: "1px 10px", borderRadius: 6 }}>Juros: {fmt(totalJuros)}</span>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />
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
  const totalRetirada = despesasData.filter(r => r.categoria === "Retirada de Caixa").reduce((a, r) => a + r.valor, 0);
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
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                  borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
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
          </tbody>
        </table>
      </div>

      {/* ── Total flutuante ── */}
      <div className="shrink-0 flex items-center justify-start gap-6 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>RETIRADA DE CAIXA</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#7c3aed", padding: "1px 10px", borderRadius: 6 }}>{fmt(totalRetirada)}</span>
        <span style={{ color: "#d1d5db", fontSize: 16, fontWeight: 300 }}>|</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL DESPESAS</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#b91c1c", padding: "1px 10px", borderRadius: 6 }}>{fmt(total)}</span>
      </div>

      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />
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
          Rendimentos do Dia
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
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                  borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
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
          </tbody>
        </table>
      </div>

      {/* ── Total flutuante ── */}
      <div className="shrink-0 flex items-center justify-start gap-8 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL RENDIMENTOS</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#15803d", padding: "1px 10px", borderRadius: 6 }}>{fmt(total)}</span>
      </div>

      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />
    </div>
  );
}

// ── Clientes data ─────────────────────────────────────────────────────────────
type ClienteRow = {
  id: number; consec: string; status: string; visitas: number; nome: string;
  tel1: string; tel2: string; freq: string; valorVenda: number; pctJuros: number;
  total: number; cuotas: number; atrasadas: number; pagas: number; restantes: number;
  vlrCuota: number; saldo: number;
  documento: string; dataNasc: string; endereco: string; bairro: string; cidade: string;
  estadoVerif: string; nroSeguro: string; valorSeguro: number;
  nomeCodedor: string; telCodedor: string; dirCodedor: string; observacoes: string;
  dataEmprestimo: string;
  historico: { data: string; valor: number; total: number; cuotas: number; status: string }[];
};
const clientesRows: ClienteRow[] = [
  { id:1,  consec:"4700627026", status:"ACTIVO", visitas:5,  nome:"Andreia de Jesus Costa Araújo",   tel1:"91633427315",  tel2:"98985014328",  freq:"Diário", valorVenda:1500.00, pctJuros:40, total:2100.00, cuotas:20, atrasadas:0,  pagas:12, restantes:8,  vlrCuota:105, saldo:800.00,  documento:"012.345.678-90", dataNasc:"1985-03-12", endereco:"Rua Gama Lobo, nº 10, Quarto", bairro:"Centro", cidade:"São Luís - MA", estadoVerif:"Sem Verificação", nroSeguro:"", valorSeguro:0.00, nomeCodedor:"", telCodedor:"", dirCodedor:"", observacoes:"Cliente pontual. Prefere contato pelo WhatsApp.", dataEmprestimo:"2026-04-08", historico:[{data:"2025-10-01",valor:800,total:1120,cuotas:14,status:"QUITADO"},{data:"2026-04-08",valor:1500,total:2100,cuotas:20,status:"ACTIVO"}] },
  { id:2,  consec:"4700627080", status:"ACTIVO", visitas:14, nome:"Luciana Alves Da Silva",           tel1:"559988345767", tel2:"03270213301",  freq:"Diário", valorVenda:500.00,  pctJuros:40, total:700.00,  cuotas:14, atrasadas:14, pagas:0,  restantes:14, vlrCuota:50,  saldo:700.00,  documento:"098.765.432-11", dataNasc:"1992-07-22", endereco:"Av. Principal, 455, Apto 3", bairro:"Jardim América", cidade:"São Paulo - SP", estadoVerif:"Sem Verificação", nroSeguro:"", valorSeguro:0.00, nomeCodedor:"", telCodedor:"", dirCodedor:"", observacoes:"Muitas visitas sem pagamento. Atenção redobrada.", dataEmprestimo:"2026-05-01", historico:[{data:"2026-05-01",valor:500,total:700,cuotas:14,status:"ACTIVO"}] },
  { id:3,  consec:"4700627079", status:"ACTIVO", visitas:0,  nome:"Ana Paula Marques De Oliveira",    tel1:"989896248424", tel2:"85259284372",  freq:"Diário", valorVenda:500.00,  pctJuros:20, total:600.00,  cuotas:20, atrasadas:0,  pagas:0,  restantes:20, vlrCuota:30,  saldo:600.00,  documento:"111.222.333-44", dataNasc:"1990-11-05", endereco:"Rua das Flores, 22", bairro:"Nova Esperança", cidade:"Fortaleza - CE", estadoVerif:"Verificado", nroSeguro:"SEG-001", valorSeguro:150.00, nomeCodedor:"José Marques", telCodedor:"85259284371", dirCodedor:"Rua das Flores, 22", observacoes:"", dataEmprestimo:"2026-05-10", historico:[{data:"2026-05-10",valor:500,total:600,cuotas:20,status:"ACTIVO"}] },
  { id:4,  consec:"4700627078", status:"ACTIVO", visitas:4,  nome:"Mariana Beatriz Rabelo Barbosa",   tel1:"98985721207",  tel2:"985721297",    freq:"Diário", valorVenda:1000.00, pctJuros:40, total:1400.00, cuotas:14, atrasadas:4,  pagas:0,  restantes:14, vlrCuota:100, saldo:1400.00, documento:"222.333.444-55", dataNasc:"1988-01-30", endereco:"Trav. São João, 78", bairro:"Cohab", cidade:"São Luís - MA", estadoVerif:"Sem Verificação", nroSeguro:"", valorSeguro:0.00, nomeCodedor:"", telCodedor:"", dirCodedor:"", observacoes:"Dificuldade de localização.", dataEmprestimo:"2026-05-05", historico:[{data:"2025-08-15",valor:500,total:700,cuotas:14,status:"QUITADO"},{data:"2026-05-05",valor:1000,total:1400,cuotas:14,status:"ACTIVO"}] },
  { id:5,  consec:"4700627077", status:"ACTIVO", visitas:14, nome:"Natanael Dos Santos Mendes",       tel1:"5511971269742",tel2:"11971269742",  freq:"Diário", valorVenda:500.00,  pctJuros:40, total:700.00,  cuotas:14, atrasadas:13, pagas:1,  restantes:13, vlrCuota:50,  saldo:650.00,  documento:"333.444.555-66", dataNasc:"1983-06-18", endereco:"Rua 7 de Setembro, 101", bairro:"Vila Nova", cidade:"São Paulo - SP", estadoVerif:"Sem Verificação", nroSeguro:"", valorSeguro:0.00, nomeCodedor:"", telCodedor:"", dirCodedor:"", observacoes:"Muitas visitas. Considerar negativação.", dataEmprestimo:"2026-04-20", historico:[{data:"2026-04-20",valor:500,total:700,cuotas:14,status:"ACTIVO"}] },
  { id:6,  consec:"4700627058", status:"ACTIVO", visitas:1,  nome:"Aline Lima De Alencar",            tel1:"98985678901",  tel2:"98985678902",  freq:"Diário", valorVenda:1120.00, pctJuros:40, total:1568.00, cuotas:14, atrasadas:0,  pagas:1,  restantes:13, vlrCuota:80,  saldo:1040.00, documento:"444.555.666-77", dataNasc:"1995-09-14", endereco:"Conj. Habitacional, Bl. B, 203", bairro:"Tirirical", cidade:"São Luís - MA", estadoVerif:"Verificado", nroSeguro:"SEG-002", valorSeguro:200.00, nomeCodedor:"Carlos Alencar", telCodedor:"98985678903", dirCodedor:"Conj. Habitacional, Bl. A, 101", observacoes:"Boa pagadora.", dataEmprestimo:"2026-05-15", historico:[{data:"2025-11-01",valor:560,total:784,cuotas:14,status:"QUITADO"},{data:"2026-05-15",valor:1120,total:1568,cuotas:14,status:"ACTIVO"}] },
  { id:7,  consec:"4700627145", status:"ACTIVO", visitas:2,  nome:"Bores Viana De Souza",             tel1:"98984321100",  tel2:"98984321101",  freq:"Diário", valorVenda:560.00,  pctJuros:40, total:784.00,  cuotas:14, atrasadas:2,  pagas:0,  restantes:12, vlrCuota:40,  saldo:480.00,  documento:"555.666.777-88", dataNasc:"1979-04-02", endereco:"Rua Barão de Codó, 55", bairro:"Renascença", cidade:"São Luís - MA", estadoVerif:"Sem Verificação", nroSeguro:"", valorSeguro:0.00, nomeCodedor:"", telCodedor:"", dirCodedor:"", observacoes:"", dataEmprestimo:"2026-05-18", historico:[{data:"2026-05-18",valor:560,total:784,cuotas:14,status:"ACTIVO"}] },
  { id:8,  consec:"4700627024", status:"ACTIVO", visitas:11, nome:"Anny Briane Pires Belfort",        tel1:"98987654321",  tel2:"98987654322",  freq:"Diário", valorVenda:1120.00, pctJuros:40, total:1568.00, cuotas:14, atrasadas:0,  pagas:11, restantes:3,  vlrCuota:80,  saldo:210.00,  documento:"666.777.888-99", dataNasc:"1991-12-25", endereco:"Rua dos Lirios, 88", bairro:"São Francisco", cidade:"São Luís - MA", estadoVerif:"Verificado", nroSeguro:"SEG-003", valorSeguro:100.00, nomeCodedor:"Pedro Belfort", telCodedor:"98987654323", dirCodedor:"Rua dos Lirios, 90", observacoes:"Ótima cliente. Quase quitando.", dataEmprestimo:"2026-02-01", historico:[{data:"2025-06-01",valor:500,total:700,cuotas:14,status:"QUITADO"},{data:"2025-10-15",valor:800,total:1120,cuotas:14,status:"QUITADO"},{data:"2026-02-01",valor:1120,total:1568,cuotas:14,status:"ACTIVO"}] },
  { id:9,  consec:"4700627090", status:"ACTIVO", visitas:5,  nome:"Daniele Texeira Lindoso",          tel1:"559899687036", tel2:"99687036",     freq:"Diário", valorVenda:1000.00, pctJuros:40, total:1400.00, cuotas:14, atrasadas:5,  pagas:5,  restantes:9,  vlrCuota:100, saldo:900.00,  documento:"777.888.999-00", dataNasc:"1987-08-09", endereco:"Av. dos Holandeses, 200, Apto 12", bairro:"Ponta do Farol", cidade:"São Luís - MA", estadoVerif:"Sem Verificação", nroSeguro:"", valorSeguro:0.00, nomeCodedor:"", telCodedor:"", dirCodedor:"", observacoes:"Atrasada. Última visita sem sucesso.", dataEmprestimo:"2026-04-15", historico:[{data:"2026-04-15",valor:1000,total:1400,cuotas:14,status:"ACTIVO"}] },
  { id:10, consec:"4700627023", status:"ACTIVO", visitas:9,  nome:"Elaira Kisley Conceição Lopes",    tel1:"98986543210",  tel2:"98986543211",  freq:"Diário", valorVenda:540.00,  pctJuros:40, total:756.00,  cuotas:14, atrasadas:9,  pagas:0,  restantes:9,  vlrCuota:54,  saldo:540.00,  documento:"888.999.000-11", dataNasc:"1993-02-17", endereco:"Rua do Sol, 33", bairro:"Cohab Anil", cidade:"São Luís - MA", estadoVerif:"Sem Verificação", nroSeguro:"", valorSeguro:0.00, nomeCodedor:"", telCodedor:"", dirCodedor:"", observacoes:"Muitos atrasos. Análise de renegociação.", dataEmprestimo:"2026-04-10", historico:[{data:"2026-04-10",valor:540,total:756,cuotas:14,status:"ACTIVO"}] },
];

// ── Agendados data ────────────────────────────────────────────────────────────
const agendadosData = [
  { id:1,  cliente:"Andreia de Jesus Costa Araújo", tipo:"Visita",        data:"2026-06-11", hora:"09:00", obs:"Cobrar parcela atrasada",  status:"Pendente"   },
  { id:2,  cliente:"Geílson Eduardo Rosa de Jesus", tipo:"Ligação",       data:"2026-06-11", hora:"10:30", obs:"Confirmar endereço",        status:"Concluído"  },
  { id:3,  cliente:"Andrela de Jesus Costa Araújo", tipo:"Visita",        data:"2026-06-11", hora:"14:00", obs:"Novo empréstimo",           status:"Pendente"   },
  { id:4,  cliente:"S. De Oliveira",                tipo:"Renegociação",  data:"2026-06-12", hora:"08:00", obs:"Proposta de parcelamento",  status:"Pendente"   },
  { id:5,  cliente:"Barbosa",                       tipo:"Ligação",       data:"2026-06-12", hora:"11:00", obs:"",                          status:"Cancelado"  },
  { id:6,  cliente:"Dos Mendes",                    tipo:"Visita",        data:"2026-06-13", hora:"09:30", obs:"Verificar documentos",      status:"Pendente"   },
];

const tipoAgendColor: Record<string, { bg: string; color: string; border: string }> = {
  "Visita":       { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Ligação":      { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  "Renegociação": { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
};
const statusAgendColor: Record<string, { bg: string; color: string; border: string }> = {
  "Pendente":  { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  "Concluído": { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  "Cancelado": { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};

function AgendadosContent({ rotas = [] }: { rotas?: string[] }) {
  const [filterDate, setFilterDate] = useState("");
  const [tempDate,   setTempDate]   = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({ vendedor: "Rota Cred Bank -", cliente: "", tipo: "Visita", data: "2026-06-11", hora: "", obs: "" });

  const filtered = agendadosData.filter(r => !filterDate || r.data === filterDate);

  const cols = [
    { label: "Nro.",        w: "4%",  align: "center" as const },
    { label: "Cliente",     w: "35%", align: "left"   as const },
    { label: "Data",        w: "11%", align: "center" as const },
    { label: "Hora",        w: "8%",  align: "center" as const },
    { label: "Observações", w: "30%", align: "left"   as const },
    { label: "Status",      w: "12%", align: "center" as const },
  ];

  const tdA = (align: "left"|"center"|"right", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "11px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
    textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ position: "relative" }}>

      {/* ── Standard title bar ── */}
      <div className="shrink-0 flex items-center gap-2 px-3" style={{ height: 34, background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
          $ Agendados do Dia
        </span>
        <div className="flex-1" />
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setTempDate(filterDate); setShowFilter(v => !v); }}
            style={{ height: 22, padding: "0 8px", borderRadius: 4, border: "none", background: "#4a7fa0", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: "#fff" }}><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            {filterDate ? filterDate : "Filtrar dia"}
            {filterDate && (
              <span onClick={e => { e.stopPropagation(); setFilterDate(""); }} style={{ marginLeft: 2, fontWeight: 700, opacity: 0.8 }}>✕</span>
            )}
          </button>
          {showFilter && (
            <div style={{ position: "absolute", top: 32, right: 0, zIndex: 200, background: "#fff", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid #e0e0e0", width: 260, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2d5474", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Filtrar por Data</span>
                <button onClick={() => setShowFilter(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, fontWeight: 700 }}>✕</button>
              </div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Data do Agendamento</label>
              <input type="date" value={tempDate} onChange={e => setTempDate(e.target.value)}
                style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "6px 10px", fontSize: 13, color: "#374151", marginBottom: 14, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setFilterDate(""); setTempDate(""); setShowFilter(false); }}
                  style={{ flex: 1, background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Limpar</button>
                <button onClick={() => { setFilterDate(tempDate); setShowFilter(false); }}
                  style={{ flex: 1, background: "#2563eb", color: "#fff", border: "none", borderRadius: 5, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Aplicar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.label} style={{
                  padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                  borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
                  position: "sticky", top: 0, zIndex: 1,
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={cols.length} style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", fontSize: 13 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <svg viewBox="0 0 24 24" style={{ width: 40, height: 40, fill: "#d1d5db" }}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                    <span>Nenhum agendamento encontrado.</span>
                    <span style={{ fontSize: 11, color: "#d1d5db" }}>Ajuste os filtros e clique em Buscar.</span>
                  </div>
                </td>
              </tr>
            ) : filtered.map((r, i) => {
              const stat = statusAgendColor[r.status] ?? statusAgendColor["Pendente"];
              const rowBg = i % 2 === 0 ? "#fff" : "#f5f7f9";
              return (
                <tr key={r.id} style={{ cursor: "default" }}
                  onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = "#eff6ff")}
                  onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = rowBg)}>
                  <td style={tdA("center", { color: "#6b7280", fontWeight: 700, fontSize: 12 })}>{r.id}</td>
                  <td style={tdA("left",   { color: "#111827", fontWeight: 600 })}>{r.cliente}</td>
                  <td style={tdA("center", { color: "#374151" })}>{r.data}</td>
                  <td style={tdA("center", { fontWeight: 700, color: "#2d5474" })}>{r.hora}</td>
                  <td style={tdA("left",   { color: "#6b7280", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" })}>{r.obs || "—"}</td>
                  <td style={tdA("center")}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: stat.bg, color: stat.color, border: `1px solid ${stat.border}` }}>{r.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Total flutuante ── */}
      <div className="shrink-0 flex items-center justify-start gap-8 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL AGENDAMENTOS</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#2d5474", padding: "1px 10px", borderRadius: 6 }}>{filtered.length}</span>
      </div>

      {/* ── Blue footer ── */}
      <div className="shrink-0 flex items-center px-4 py-2.5" style={{ background: "#3d6e8e" }} />

      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowAddModal(false)}>
          <div style={{ background: "#fff", borderRadius: 8, width: 500, boxShadow: "0 24px 64px rgba(0,0,0,0.35)", overflow: "hidden" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: "#2d5474", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Agendar Visita / Nota</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✕</button>
            </div>
            <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Rota</label>
                <select value={newForm.vendedor} onChange={e => setNewForm(f => ({ ...f, vendedor: e.target.value }))}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13, color: "#374151" }}>
                  {rotas.length > 0 ? rotas.map(r => <option key={r}>{r}</option>) : <option>Rota Cred Bank -</option>}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Cliente</label>
                <input type="text" placeholder="Nome do cliente" value={newForm.cliente} onChange={e => setNewForm(f => ({ ...f, cliente: e.target.value }))}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13, color: "#374151", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Tipo</label>
                  <select value={newForm.tipo} onChange={e => setNewForm(f => ({ ...f, tipo: e.target.value }))}
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13, color: "#374151" }}>
                    <option>Visita</option>
                    <option>Ligação</option>
                    <option>Renegociação</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Data</label>
                  <input type="date" value={newForm.data} onChange={e => setNewForm(f => ({ ...f, data: e.target.value }))}
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13, color: "#374151", boxSizing: "border-box" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Hora</label>
                  <input type="time" value={newForm.hora} onChange={e => setNewForm(f => ({ ...f, hora: e.target.value }))}
                    style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13, color: "#374151", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Descrição / Observações</label>
                <textarea rows={4} value={newForm.obs} onChange={e => setNewForm(f => ({ ...f, obs: e.target.value }))}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 10px", fontSize: 13, color: "#374151", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ padding: "12px 18px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowAddModal(false)} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 5, padding: "7px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => setShowAddModal(false)} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 5, padding: "7px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Relatórios ────────────────────────────────────────────────────────────────
function RelatóriosContent({ rotas = [] }: { rotas?: string[] }) {
  const selStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #d1d5db", borderRadius: 3,
    padding: "3px 6px", fontSize: 11, color: "#374151",
    background: "#f9fafb", marginBottom: 4, boxSizing: "border-box",
  };
  const inpStyle: React.CSSProperties = { ...selStyle, background: "#fff" };
  const lblStyle: React.CSSProperties = {
    display: "block", fontSize: 9, fontWeight: 700, color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2,
  };

  const Sel  = ({ opts }: { opts: string[] }) => <select style={selStyle}>{opts.map(o => <option key={o}>{o}</option>)}</select>;
  const DateInp = ({ label }: { label: string }) => (
    <div style={{ marginBottom: 5 }}>
      <span style={lblStyle}>{label}</span>
      <input type="date" style={inpStyle} />
    </div>
  );
  const Gerar = () => (
    <button style={{ width: "100%", background: "#3d8a5f", color: "#fff", border: "none", borderRadius: 3, padding: "5px 0", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 5, letterSpacing: "0.02em" }}>
      Gerar
    </button>
  );
  const DateRange = () => (
    <div style={{ marginBottom: 3 }}>
      <div style={{ display: "flex", gap: 5 }}>
        <div style={{ flex: 1 }}>
          <span style={lblStyle}>Data Inicial</span>
          <input type="date" style={inpStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={lblStyle}>Data Final</span>
          <input type="date" style={inpStyle} />
        </div>
      </div>
    </div>
  );

  const Card = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <div style={{ background: "#fff", borderRadius: 7, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e9edf0", display: "flex", gap: 0, overflow: "hidden", height: "100%" }}>
      <div style={{ width: 56, minWidth: 56, background: "#3d6e8e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, fill: "#fff" }}><path d={icon} /></svg>
      </div>
      <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontWeight: 800, fontSize: 11, color: "#111827", letterSpacing: "0.04em", marginBottom: 5 }}>{title}</div>
        {children}
        <div style={{ flex: 1 }} />
        <DateRange />
        <Gerar />
      </div>
    </div>
  );

  const PEOPLE  = "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z";
  const BLOCK   = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z";
  const RENEW   = "M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z";
  const LATE    = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z";
  const PAID    = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z";
  const MONEY   = "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z";
  const PERCENT = "M7.5 11C9.43 11 11 9.43 11 7.5S9.43 4 7.5 4 4 5.57 4 7.5 5.57 11 7.5 11zm0-5C8.33 6 9 6.67 9 7.5S8.33 9 7.5 9 6 8.33 6 7.5 6.67 6 7.5 6zM16.5 13c-1.93 0-3.5 1.57-3.5 3.5S14.57 20 16.5 20s3.5-1.57 3.5-3.5S18.43 13 16.5 13zm0 5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2.17-13.17l1.17 1.17L5.17 19.5 4 18.33z";
  const CARD    = "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z";
  const HIST    = "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z";
  const CANCEL  = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z";

  const vend = rotas.length > 0 ? rotas : ["Rota Cred Bank -"];
  const parc = ["Menos de 1 Parcela", "Menos de 2 Parcelas", "Menos de 3 Parcelas"];
  const juro = ["Juros menor que %", "Juros maior que %"];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Page header bar ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5l4-4h10v4z"/></svg>
          $ Relatórios do Dia
        </span>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 font-medium">DATA DE REFERÊNCIA: 2026-05-25</span>
      </div>

      {/* ── Blue sub-header (table-header style) ── */}
      <div className="shrink-0" style={{ background: "#3d6e8e", height: 34 }} />

      <div className="flex-1 overflow-auto" style={{ background: "#f0f2f5", padding: "14px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, alignItems: "stretch" }}>

        <Card icon={PEOPLE} title="CLIENTES ATIVOS">
          <span style={lblStyle}>Informe a Rota</span>
          <Sel opts={vend} />
        </Card>

        <Card icon={BLOCK} title="CLIENTES INATIVOS">
          <span style={lblStyle}>Informe a Rota</span>
          <Sel opts={vend} />
        </Card>

        <Card icon={RENEW} title="CLIENTES SEM RENOVAR">
          <span style={lblStyle}>Informe a Rota</span>
          <Sel opts={vend} />
        </Card>

        <Card icon={LATE} title="CLIENTES ATRASADOS">
          <span style={lblStyle}>Informe a Rota</span>
          <Sel opts={vend} />
        </Card>

        <Card icon={PAID} title="CLIENTES QUE PAGARAM">
          <span style={lblStyle}>Informe a Parcela</span>
          <input type="number" placeholder="0" min="1" step="1" style={inpStyle} />
        </Card>

        <Card icon={MONEY} title="CRÉDITOS ACIMA DE R$">
          <span style={lblStyle}>Informe o valor R$</span>
          <input type="number" placeholder="0,00" style={inpStyle} />
        </Card>

        <Card icon={PERCENT} title="RELATÓRIO POR JUROS">
          <span style={lblStyle}>Informe o Juros %</span>
          <input type="number" placeholder="0,00" min="0" step="0.01" style={inpStyle} />
        </Card>

        <Card icon={CARD} title="CLIENTES VENCIDOS / A VENCER">
          <span style={lblStyle}>Informe a Rota</span>
          <Sel opts={vend} />
        </Card>

        <Card icon={HIST} title="HISTÓRICO DE CLIENTES">
          <span style={lblStyle}>Informe a Rota</span>
          <Sel opts={vend} />
        </Card>

        <Card icon={CANCEL} title="CLIENTES CANCELADOS">
          <span style={lblStyle}>Informe a Rota</span>
          <Sel opts={vend} />
        </Card>

      </div>
      </div>

      {/* ── Blue footer ── */}
      <div className="shrink-0 flex items-center px-4 py-2.5" style={{ background: "#3d6e8e" }} />

    </div>
  );
}

function ClientesContent() {
  const [selectedCliente, setSelectedCliente] = useState<ClienteRow | null>(null);
  const [showParcelas, setShowParcelas] = useState(false);
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [selectedHistoricoEmp, setSelectedHistoricoEmp] = useState<ClienteRow["historico"][0] | null>(null);

  const cols = [
    { label: "Nro.",               w: "4%",  align: "center" as const },
    { label: "Consecutivo",        w: "9%",  align: "left"   as const },
    { label: "Nome e Sobrenome",   w: "18%", align: "left"   as const },
    { label: "Telefones",          w: "11%", align: "left"   as const },
    { label: "Frequência",         w: "7%",  align: "center" as const },
    { label: "Valor Empr.",        w: "8%",  align: "right"  as const },
    { label: "Juros / Total",      w: "10%", align: "center" as const },
    { label: "Parcela",            w: "5%",  align: "center" as const },
    { label: "Atrasadas / Pagas",  w: "13%", align: "left"   as const },
    { label: "Valor Parc.",        w: "7%",  align: "right"  as const },
    { label: "Saldo",              w: "8%",  align: "right"  as const },
  ];

  const fmt = (v: number) => `$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  const totalSaldo = clientesRows.reduce((a, r) => a + r.saldo, 0);

  const tdC = (align: "left" | "center" | "right", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "11px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
    textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
  });

  const inputCls = "h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 placeholder-gray-400 text-gray-700";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Filter bar */}
      <div className="shrink-0 flex items-end gap-2 flex-wrap px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Consecutivo</label>
          <input placeholder="Ex: 4700627026" className={`${inputCls} w-32`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Nome</label>
          <input placeholder="Nome do cliente" className={`${inputCls} w-36`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Sobrenome</label>
          <input placeholder="Sobrenome" className={`${inputCls} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Documento</label>
          <input placeholder="CPF / RG" className={`${inputCls} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Estado</label>
          <select className={`${inputCls} w-32`}>
            <option value="">-- Todos --</option>
            <option>ACTIVO</option>
            <option>INACTIVO</option>
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Frequência</label>
          <select className={`${inputCls} w-28`}>
            <option value="">-- Todas --</option>
            <option>Diário</option>
            <option>Semanal</option>
            <option>Quinzenal</option>
          </select>
        </div>
        <div className="flex gap-1.5 pb-0.5">
          <button className="h-7 px-3 rounded text-xs font-semibold border border-gray-300 text-gray-600 bg-white hover:bg-gray-50">Limpar</button>
          <button className="h-7 px-3 rounded text-xs font-semibold text-white flex items-center gap-1 hover:opacity-90" style={{ background: "#2563eb" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            Buscar
          </button>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 font-medium pb-0.5">DATA DE REFERÊNCIA: 2026-05-25</span>
      </div>

      {/* Count bar */}
      <div className="shrink-0 flex items-center px-3 py-1.5" style={{ background: "#f0f2f5", borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-xs text-gray-500">
          <span className="font-bold text-gray-800">{clientesRows.length}</span> registros encontrados
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.label} style={{
                  padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                  borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
                  position: "sticky", top: 0, zIndex: 1,
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientesRows.map((r, i) => {
              const rowBg = i % 2 === 0 ? "#fff" : "#f5f7f9";
              const saldoColor = r.atrasadas === 0 ? "#15803d" : r.atrasadas >= 5 ? "#b91c1c" : "#d97706";
              return (
                <tr key={r.id} style={{ cursor: "pointer" }}
                  onClick={() => setSelectedCliente(r)}
                  onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = "#eff6ff")}
                  onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = rowBg)}>

                  <td style={tdC("center", { color: "#6b7280", fontWeight: 700, fontSize: 12 })}>{r.id}</td>

                  <td style={tdC("left")}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ color: "#2563eb", fontWeight: 700, fontSize: 12 }}>{r.consec}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 3, padding: "1px 5px", alignSelf: "flex-start" }}>{r.status}</span>
                    </div>
                  </td>

                  <td style={{ ...tdC("left"), whiteSpace: "normal" }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: r.atrasadas === 0 ? "#15803d" : r.atrasadas >= 5 ? "#b91c1c" : "#b45309" }}>{r.nome}</span>
                  </td>

                  <td style={tdC("left")}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ color: "#374151", fontSize: 12 }}>📞 {r.tel1}</span>
                      <span style={{ color: "#6b7280", fontSize: 12 }}>📱 {r.tel2}</span>
                    </div>
                  </td>

                  <td style={tdC("center")}>
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                      {r.freq}
                    </span>
                  </td>

                  <td style={tdC("right")}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <span style={{ fontWeight: 700, color: "#111827" }}>{fmt(r.valorVenda)}</span>
                      {r.dataEmprestimo && (
                        <span style={{ fontSize: 10, color: "#6b7280" }}>
                          {r.dataEmprestimo.slice(0, 10).split("-").reverse().join("/")}
                        </span>
                      )}
                    </div>
                  </td>

                  <td style={tdC("center")}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Juros {r.pctJuros}%</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", whiteSpace: "nowrap" }}>
                        Total {fmt(r.total).replace("$ ", "")}
                      </span>
                    </div>
                  </td>

                  <td style={tdC("center", { fontWeight: 700, color: "#374151" })}>{r.cuotas}</td>

                  <td style={tdC("left")}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <div style={{ fontSize: 12, color: r.atrasadas > 0 ? "#b91c1c" : "#6b7280", fontWeight: r.atrasadas > 0 ? 700 : 400 }}>Atrasadas: {r.atrasadas}</div>
                      <div style={{ fontSize: 12, color: "#15803d" }}>Pagas: {r.pagas}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>Rest.: {r.restantes} (Sanc. 0)</div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Visitas: <span style={{ fontWeight: 700, color: r.visitas === 0 ? "#9ca3af" : r.atrasadas === 0 ? "#15803d" : r.atrasadas >= 5 ? "#b91c1c" : "#b45309" }}>{r.visitas}</span></div>
                    </div>
                  </td>

                  <td style={tdC("right", { fontWeight: 700, color: "#374151" })}>{fmt(r.vlrCuota)}</td>

                  <td style={tdC("right")}>
                    <span style={{ fontWeight: 700, color: saldoColor }}>{fmt(r.saldo)}</span>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>Sanção: $ 0,00</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Total flutuante ── */}
      <div className="shrink-0 flex items-center justify-start gap-8 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL SALDO CLIENTES</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#15803d", padding: "1px 10px", borderRadius: 6 }}>{fmt(totalSaldo)}</span>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />

      {/* ── Cliente detail modal ─────────────────────────────────────── */}
      {selectedCliente && (() => {
        const c = selectedCliente;
        const fmtM = (v: number) => `$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
        const nameColor = c.atrasadas === 0 ? "#15803d" : c.atrasadas >= 5 ? "#b91c1c" : "#b45309";
        const initials = c.nome.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
        return (<>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setSelectedCliente(null)}>
            <div style={{ background: "#fff", borderRadius: 8, width: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }}
              onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div style={{ background: "#2d5474", borderRadius: "8px 8px 0 0", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "0.03em" }}>FICHA DO CLIENTE</span>
                <button onClick={() => setSelectedCliente(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>✕</button>
              </div>

              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Top: photo + basic info + inactivate btn */}
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  {/* Avatar */}
                  <div style={{ flexShrink: 0, width: 80, height: 80, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#3d6e8e", border: "3px solid #4a7fa0" }}>
                    {initials}
                  </div>
                  {/* Name + status + consec */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: nameColor, marginBottom: 4 }}>{c.nome}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 3, padding: "2px 7px" }}>{c.status}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 3, padding: "2px 7px" }}>{c.consec}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 3, padding: "2px 7px" }}>{c.freq}</span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid #e5e7eb" }} />

                {/* Buttons row */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setShowParcelas(true)}
                    style={{ background: "#3d6e8e", color: "#fff", border: "none", borderRadius: 5, padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 15 }}>📋</span> Ver Parcelas Pagas — Empréstimo Ativo
                  </button>
                </div>

                {/* Loan history */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#3d6e8e", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    👤 {c.nome.toUpperCase()} &nbsp;<span style={{ color: "#9ca3af", fontWeight: 400 }}>#{c.consec}</span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 700 }}>
                      <thead>
                        <tr>
                          {["Nro.", "Data do Emp.", "Estado", "Parc.", "Pagas", "Falt.", "Saldo", "Valor Empr.", "Freq.", "Vr. Parcela", "Visitas", "% Juros"].map(hd => (
                            <th key={hd} style={{ background: "#3d6e8e", color: "#e2e8f0", padding: "6px 8px", textAlign: "center", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{hd}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...c.historico].reverse().map((h, idx) => {
                          const isAtivo = false;
                          const pagasH = h.cuotas;
                          const faltH  = 0;
                          const saldoH = 0;
                          const vrParc = h.total / h.cuotas;
                          const pctJurosH = Math.round((h.total / h.valor - 1) * 100);
                          const nro = c.historico.length - idx;
                          const bg = idx % 2 === 0 ? "#fff" : "#f5f7f9";
                          return (
                            <tr key={idx}
                              onClick={() => setSelectedHistoricoEmp(h)}
                              style={{ cursor: "pointer", background: bg }}
                              onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#eff6ff"}
                              onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = bg}>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "center", fontWeight: 700, color: "#2563eb" }}>{nro}</td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "center", color: "#374151" }}>{h.data}</td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                                  color: isAtivo ? "#1d4ed8" : "#15803d",
                                  background: isAtivo ? "#eff6ff" : "#dcfce7",
                                  border: `1px solid ${isAtivo ? "#bfdbfe" : "#86efac"}` }}>
                                  {isAtivo ? "Activo" : "Quitado"}
                                </span>
                              </td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>{h.cuotas}</td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "center", color: "#15803d", fontWeight: 600 }}>{pagasH}</td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "center", color: faltH > 0 ? "#b91c1c" : "#6b7280", fontWeight: faltH > 0 ? 700 : 400 }}>{faltH}</td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "right", fontWeight: 700, color: saldoH > 0 ? "#b91c1c" : "#15803d" }}>{fmtM(saldoH)}</td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "right", fontWeight: 700, color: "#2563eb" }}>{fmtM(h.total)}</td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "center", color: "#6b7280" }}>{c.freq}</td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "right", color: "#374151" }}>{fmtM(vrParc)}</td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "center", color: "#374151" }}>{c.visitas}</td>
                              <td style={{ padding: "8px 7px", borderBottom: "1px solid #f0f0f0", textAlign: "center", fontWeight: 700, color: "#15803d" }}>{pctJurosH}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Total + Cancelar */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px 0" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                      TOTAL EMPRÉSTIMOS:&nbsp;
                      <span style={{ color: "#2563eb" }}>{fmtM(c.historico.reduce((a, h) => a + h.total, 0))}</span>
                    </span>
                    <button onClick={() => setSelectedCliente(null)} style={{ background: "#3d6e8e", color: "#fff", border: "none", borderRadius: 5, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </div>

                {/* Observações */}
                {c.observacoes && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#3d6e8e", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Observações</div>
                    <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 5, padding: "10px 12px", fontSize: 12, color: "#713f12", lineHeight: 1.6 }}>{c.observacoes}</div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── helper: render Histórico de Pagamentos modal ── */}
          {(() => {
            const renderHistPagModal = (
              emp: typeof c.historico[0],
              empNro: number,
              pagasCount: number,
              atrasadasCount: number,
              vrParc: number,
              zIndex: number,
              onClose: () => void
            ) => {
              const startDate = new Date(emp.data + "T00:00:00");
              const rows: { num: number; tipo: string; valor: number; fecha: string; obs: string }[] = [];
              for (let i = 0; i < pagasCount; i++) {
                const d = new Date(startDate); d.setDate(d.getDate() + i + 1);
                rows.push({ num: i + 1, tipo: "PARC.", valor: vrParc, fecha: d.toISOString().slice(0, 10), obs: "" });
              }
              for (let i = 0; i < atrasadasCount; i++) {
                const d = new Date(startDate); d.setDate(d.getDate() + pagasCount + i + 1);
                rows.push({ num: pagasCount + i + 1, tipo: "S/PAG.", valor: 0, fecha: d.toISOString().slice(0, 10), obs: "Operação Masiva" });
              }
              const rowsDesc = [...rows].reverse();
              const totalPago = rows.filter(r => r.tipo === "PARC.").reduce((a, r) => a + r.valor, 0);
              const nomeShort = c.nome.length > 20 ? c.nome.slice(0, 19) + "..." : c.nome;
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={onClose}>
                  <div style={{ background: "#fff", borderRadius: 8, width: 660, maxHeight: "82vh", boxShadow: "0 24px 64px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", overflow: "hidden" }}
                    onClick={e => e.stopPropagation()}>
                    {/* Header — fixed */}
                    <div style={{ background: "#2d5474", borderRadius: "8px 8px 0 0", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Histórico de Pagamentos</span>
                      <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 11px", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>✕</button>
                    </div>
                    {/* Client + loan number — fixed */}
                    <div style={{ padding: "10px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 14 }}>👤</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#e07b39", letterSpacing: "0.02em" }}>{c.nome.toUpperCase()}</span>
                      <span style={{ color: "#6b7280", fontSize: 12 }}>Empréstimo #{empNro}</span>
                    </div>
                    {/* Table — scrollable */}
                    <div style={{ flex: 1, overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr>
                            {["Nro.", "Cliente", "Tipo", "Valor", "Fecha", "Observações"].map(hd => (
                              <th key={hd} style={{ background: "#3d6e8e", color: "#e2e8f0", padding: "8px 12px", textAlign: hd === "Valor" ? "right" : hd === "Nro." ? "center" : "left", fontWeight: 700, fontSize: 11, position: "sticky", top: 0, zIndex: 1, whiteSpace: "nowrap" }}>{hd}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rowsDesc.map((r, idx) => (
                            <tr key={r.num} style={{ background: idx % 2 === 0 ? "#fff" : "#f5f7f9" }}>
                              <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", textAlign: "center", fontWeight: 700, color: "#2563eb" }}>{r.num}</td>
                              <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", color: "#2563eb", fontWeight: 500 }}>{nomeShort.toUpperCase()}</td>
                              <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}><TipoBadge tipo={r.tipo} /></td>
                              <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", textAlign: "right", fontWeight: 700, color: r.valor > 0 ? "#111827" : "#9ca3af" }}>R$ {r.valor.toFixed(2).replace(".", ",")}</td>
                              <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", color: "#374151", whiteSpace: "nowrap" }}>{r.fecha}</td>
                              <td style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", color: "#6b7280", fontSize: 11 }}>{r.obs}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Footer — fixed */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: "#f8f9fa", borderTop: "1px solid #e0e0e0", flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>TOTAL PAGOS: <span style={{ color: "#2563eb" }}>R$ {totalPago.toFixed(2).replace(".", ",")}</span></span>
                      <button onClick={onClose} style={{ background: "#3d6e8e", color: "#fff", border: "none", borderRadius: 5, padding: "7px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <>
                {/* ── Parcelas sub-modal (active loan button) ── */}
                {showParcelas && (() => {
                  const emp = c.historico.find(h => h.status === "ACTIVO");
                  if (!emp) return null;
                  const empNro = c.historico.length;
                  return renderHistPagModal(emp, empNro, c.pagas, c.atrasadas, c.vlrCuota, 10000, () => setShowParcelas(false));
                })()}

                {/* ── Historico loan parcelas sub-modal ── */}
                {selectedHistoricoEmp && (() => {
                  const emp = selectedHistoricoEmp;
                  const empIdx = c.historico.indexOf(emp);
                  const empNro = empIdx + 1;
                  const isAtivo = emp.status === "ACTIVO";
                  const pagasCount = isAtivo ? c.pagas : emp.cuotas;
                  const atrasadasCount = isAtivo ? c.atrasadas : 0;
                  const vrParc = emp.total / emp.cuotas;
                  return renderHistPagModal(emp, empNro, pagasCount, atrasadasCount, vrParc, 10001, () => setSelectedHistoricoEmp(null));
                })()}

                {/* ── Documentos sub-modal ── */}
                {showDocumentos && (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10002, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => setShowDocumentos(false)}>
                    <div style={{ background: "#fff", borderRadius: 8, width: 680, maxHeight: "82vh", boxShadow: "0 24px 64px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", overflow: "hidden" }}
                      onClick={e => e.stopPropagation()}>

                      {/* Header */}
                      <div style={{ background: "#2d5474", borderRadius: "8px 8px 0 0", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ fontSize: 17 }}>📷</span>
                          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Documentos do Cliente</span>
                        </div>
                        <button onClick={() => setShowDocumentos(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 11px", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>✕</button>
                      </div>

                      {/* Client info strip */}
                      <div style={{ padding: "10px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 14 }}>👤</span>
                        <span style={{ fontWeight: 800, fontSize: 13, color: "#e07b39" }}>{c.nome.toUpperCase()}</span>
                        <span style={{ color: "#9ca3af", fontSize: 12 }}>#{c.consec}</span>
                        <span style={{ marginLeft: "auto", fontSize: 11, color: "#6b7280" }}>Doc: {c.documento}</span>
                      </div>

                      {/* Document types */}
                      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
                        {[
                          { label: "Documento de Identidade (Frente)", icon: "🪪" },
                          { label: "Documento de Identidade (Verso)", icon: "🪪" },
                          { label: "Comprovante de Residência", icon: "🏠" },
                        ].map(doc => (
                          <div key={doc.label} style={{ border: "1.5px dashed #cbd5e1", borderRadius: 8, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, background: "#f8fafc" }}>
                            <span style={{ fontSize: 28 }}>{doc.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 12, color: "#374151", marginBottom: 4 }}>{doc.label}</div>
                              <div style={{ fontSize: 11, color: "#9ca3af" }}>Nenhuma foto anexada</div>
                            </div>
                            <label style={{ background: "#3d6e8e", color: "#fff", border: "none", borderRadius: 5, padding: "7px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                              📤 Anexar
                              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = ev => {
                                    const img = ev.target?.result as string;
                                    const el = e.target.closest("div[data-doc]") as HTMLElement | null;
                                    if (el) {
                                      const preview = el.querySelector("img") as HTMLImageElement | null;
                                      if (preview) { preview.src = img; preview.style.display = "block"; }
                                      const placeholder = el.querySelector("[data-placeholder]") as HTMLElement | null;
                                      if (placeholder) placeholder.style.display = "none";
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} />
                            </label>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div style={{ padding: "11px 18px", borderTop: "1px solid #e0e0e0", background: "#f8f9fa", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
                        <button onClick={() => setShowDocumentos(false)} style={{ background: "#3d6e8e", color: "#fff", border: "none", borderRadius: 5, padding: "7px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Fechar</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </>);
      })()}
    </div>
  );
}

// ── Liq. Períodos ─────────────────────────────────────────────────────────────

type RotaFakeData = { cod:number; cobradorNome?:string; dataInicio:string; dataFechamento:string|null; ultimoAcesso:string; clientesIniciais:number; sincronizados:number; clientesNovos:number; renovados:number; cancelados:number; caixaInicial:number; carteiraInicial:number; recebPrevisto:number; recebAtual:number; pagos:number; noPagos:number; efetivo:number; transferencia:number; novosEmp:number; juros:number; rendimentos:number; despesas:number; retirada:number; caixaFinal:number; carteiraFinal:number; sancao:number; };
const rotasFakeData: Record<string, RotaFakeData> = {
  "Rota Cred Bank A": {
    cod: 1001,
    dataInicio: "2026-06-10",
    dataFechamento: null,
    ultimoAcesso: "2026-06-10 08:47:32",
    clientesIniciais: 20,
    sincronizados: 20,
    clientesNovos: 2,
    renovados: 5,
    cancelados: 1,
    caixaInicial: 2979.00,
    carteiraInicial: 12660.00,
    recebPrevisto: 1245.00,
    recebAtual: 850.00,
    pagos: 9,
    noPagos: 4,
    efetivo: 650.00,
    transferencia: 200.00,
    novosEmp: 2800.00,
    juros: 1120.00,
    rendimentos: 300.00,
    despesas: 250.00,
    retirada: 500.00,
    caixaFinal: 3179.00,
    carteiraFinal: 12460.00,
    sancao: 0.00,
  },
  "Rota Cred Bank B": {
    cod: 1002,
    dataInicio: "2026-05-20",
    dataFechamento: null,
    ultimoAcesso: "2026-06-10 09:12:05",
    clientesIniciais: 15,
    sincronizados: 15,
    clientesNovos: 1,
    renovados: 3,
    cancelados: 0,
    caixaInicial: 1850.00,
    carteiraInicial: 8420.00,
    recebPrevisto: 910.00,
    recebAtual: 630.00,
    pagos: 7,
    noPagos: 5,
    efetivo: 430.00,
    transferencia: 200.00,
    novosEmp: 1400.00,
    juros: 560.00,
    rendimentos: 150.00,
    despesas: 180.00,
    retirada: 300.00,
    caixaFinal: 2150.00,
    carteiraFinal: 8190.00,
    sancao: 0.00,
  },
  "Rota Norte SL": {
    cod: 1003,
    dataInicio: "2025-11-30",
    dataFechamento: "2025-11-30",
    ultimoAcesso: "2025-11-30 17:03:11",
    clientesIniciais: 12,
    sincronizados: 12,
    clientesNovos: 0,
    renovados: 2,
    cancelados: 3,
    caixaInicial: 1200.00,
    carteiraInicial: 5800.00,
    recebPrevisto: 720.00,
    recebAtual: 720.00,
    pagos: 8,
    noPagos: 0,
    efetivo: 720.00,
    transferencia: 0.00,
    novosEmp: 0.00,
    juros: 0.00,
    rendimentos: 0.00,
    despesas: 120.00,
    retirada: 200.00,
    caixaFinal: 1600.00,
    carteiraFinal: 5080.00,
    sancao: 50.00,
  },
};

function LiqPeriodosLiquidacaoView({ selectedEstado, estadosData, onCloseDropdown }: {
  selectedEstado: string;
  estadosData: Record<string, { cidade: string; vendedor: string; data: string; ativa: boolean }[]>;
  onCloseDropdown: () => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set((estadosData[selectedEstado] ?? []).map(i => i.cidade)));
  const [collapsedEstado, setCollapsedEstado] = useState(false);
  const [selectedRotaPer, setSelectedRotaPer] = useState<string | null>(null);
  const [periodoModalOpen, setPeriodoModalOpen] = useState(false);
  const [periodoForm, setPeriodoForm] = useState({ inicio: "", fim: "" });
  const [periodoConfirmado, setPeriodoConfirmado] = useState<{ rota: string; inicio: string; fim: string } | null>(null);
  const toggleCidade = (cidade: string) => setCollapsed(prev => {
    const next = new Set(prev);
    next.has(cidade) ? next.delete(cidade) : next.add(cidade);
    return next;
  });
  useEffect(() => {
    setCollapsed(new Set((estadosData[selectedEstado] ?? []).map(i => i.cidade)));
    setCollapsedEstado(false);
  }, [selectedEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRotaClick = (vendedor: string) => {
    setSelectedRotaPer(vendedor);
    setPeriodoForm({ inicio: "", fim: "" });
    setPeriodoModalOpen(true);
  };

  return (
    <>
      {/* LEFT: Tree */}
      <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto" onClick={onCloseDropdown}>
        <div className="px-3 py-2 flex items-center gap-1.5 text-gray-800 font-bold text-sm cursor-pointer hover:bg-gray-50"
          onClick={e => { e.stopPropagation(); setCollapsedEstado(v => !v); }}>
          {collapsedEstado
            ? <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
            : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>}
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          {selectedEstado.charAt(0).toUpperCase() + selectedEstado.slice(1).toLowerCase()}
        </div>
        {!collapsedEstado && (() => {
          const allItems = estadosData[selectedEstado] ?? [];
          const cidades = Array.from(new Set(allItems.map(i => i.cidade)));
          return cidades.map(cidade => {
            const rotas = allItems.filter(i => i.cidade === cidade);
            return (
              <div key={cidade}>
                <div className="pl-6 py-2 flex items-center gap-1.5 text-gray-600 text-sm cursor-pointer hover:bg-gray-50"
                  onClick={e => { e.stopPropagation(); toggleCidade(cidade); }}>
                  {collapsed.has(cidade)
                    ? <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                    : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>}
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-400 shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  {cidade}
                </div>
                {!collapsed.has(cidade) && rotas.map((rota, ri) => (
                  <div key={ri} onClick={() => handleRotaClick(rota.vendedor)}
                    className="pl-12 py-1.5 flex items-center pr-2 cursor-pointer hover:bg-blue-50 border-l-2"
                    style={{ borderColor: periodoConfirmado?.rota === rota.vendedor ? "#2563eb" : "#3b82f6", background: periodoConfirmado?.rota === rota.vendedor ? "#eff6ff" : undefined }}>
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-gray-500 shrink-0 mr-1.5"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    <span className="text-gray-700 text-xs flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{rota.vendedor}</span>
                  </div>
                ))}
              </div>
            );
          });
        })()}
      </div>

      {/* CENTER: Data panel */}
      <div className="flex-1 overflow-y-auto border-r border-gray-200" style={{ background: "#f8fafc" }}>
        {!periodoConfirmado ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <svg viewBox="0 0 24 24" style={{ width: 48, height: 48, fill: "#cbd5e1" }}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
            <p className="text-sm font-medium text-gray-500">Selecione uma rota e o período</p>
            <p className="text-xs text-gray-400">Clique em qualquer rota na árvore à esquerda</p>
          </div>
        ) : (() => {
          const rd = rotasFakeData[periodoConfirmado.rota];
          if (!rd) return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <svg viewBox="0 0 24 24" style={{ width: 48, height: 48, fill: "#cbd5e1" }}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
              <p className="text-sm font-medium text-gray-500">Sem dados para esta rota</p>
            </div>
          );
          const d1 = new Date(periodoConfirmado.inicio);
          const d2 = new Date(periodoConfirmado.fim);
          const days = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
          const sc = days / 30;
          const fmtV = (n: number) => `$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
          const fmtN = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
          const totalClientes = rd.clientesIniciais + Math.round(rd.clientesNovos * sc);
          const clientesNovos = Math.round(rd.clientesNovos * sc);
          const clientesRenovados = Math.round(rd.renovados * sc);
          const recebTotal = Math.round(rd.recebAtual * sc);
          const totalEmp = Math.round(rd.carteiraInicial + rd.novosEmp * sc);
          const juros = Math.round(rd.juros * sc);
          const pctJuros = totalEmp > 0 ? (juros / totalEmp * 100).toFixed(2) : "0";
          const retirada = Math.round(rd.retirada * sc);
          const despesas = Math.round(rd.despesas * sc);
          const pctDesp = recebTotal > 0 && despesas > 0 ? (despesas / recebTotal * 100).toFixed(2) : "0";
          const ingressos = Math.round(rd.novosEmp * sc);
          const mediaPorCliente = totalClientes > 0 ? recebTotal / totalClientes : 0;
          const recebPrevisto = Math.round(rd.recebPrevisto * sc);
          const caixaInicial = rd.caixaInicial;
          const caixaFinal = Math.round(caixaInicial + recebTotal + ingressos - despesas - retirada);
          const lucroTotal = caixaFinal - caixaInicial;
          return (<>
            <SectionHeader title="Dados da Rota" color="#2563eb" />
            <Row label="Cobrador" index={0}>
              <strong className="text-gray-800">{periodoConfirmado.rota}</strong>
              <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer ml-1">XLS</span>
            </Row>
            <Row label="Data Inicial" index={1}>
              <CalIcon /><span className="bg-cyan-500 text-white px-2 rounded text-[11px] font-medium">{periodoConfirmado.inicio}</span>
            </Row>
            <Row label="Data Final" index={2}>
              <CalIcon /><span className="bg-cyan-500 text-white px-2 rounded text-[11px] font-medium">{periodoConfirmado.fim}</span>
            </Row>
            <Row label="Dias" index={3}>
              <CalIcon /> <strong className="text-gray-800">{days}</strong>
            </Row>
            <SectionHeader title="Clientes" color="#16a34a" />
            <Row label="Total de Clientes" index={0}><PersonIcon /> <strong className="text-gray-800">{totalClientes}</strong></Row>
            <Row label="Clientes Novos" index={1}><PersonIcon /> <strong className="text-gray-800">{clientesNovos}</strong></Row>
            <Row label="Clientes Renovados" index={2}><PersonIcon /> <strong className="text-gray-800">{clientesRenovados}</strong></Row>
            <Row label="Média por Clientes" index={3}>
              <span className="font-semibold text-gray-800">{fmtV(mediaPorCliente)}</span>
              <span className="text-gray-400 text-[11px] ml-1">( INF% )</span>
            </Row>
            <Row label="Recebimento Previsto" index={4}>
              <span className="font-semibold text-gray-800">{fmtV(recebPrevisto)}</span>
              <span className="text-gray-400 text-[11px] ml-1">( 100% )</span>
            </Row>
            <SectionHeader title="Financeiro" color="#7c3aed" />
            <Row label="Recebimento Total" index={0}>
              <span className="font-semibold text-gray-800">{fmtV(recebTotal)}</span>
              <span className="text-gray-400 text-[11px] ml-1">( INF% )</span>
            </Row>
            <Row label="Total Empréstimo" index={1}><span className="font-semibold text-gray-800">{fmtV(totalEmp)}</span></Row>
            <Row label="Juros" index={2}>
              <span className="font-bold text-green-700">$</span>
              <span className="font-semibold text-green-700">{fmtN(juros)}</span>
              <span className="text-gray-400 text-[11px] ml-0.5">{pctJuros}%</span>
            </Row>
            <Row label="Retirada de Caixa" index={3}>
              <span className="text-red-600 font-bold text-sm">−</span>
              <span className="font-semibold text-red-600">{fmtN(retirada)}</span>
            </Row>
            <Row label="Despesas" index={4}>
              <span className="text-red-600 font-bold text-sm">−</span>
              <span className="font-semibold text-red-600">{fmtN(despesas)}</span>
              <span className="text-gray-400 text-[11px] ml-1">( {pctDesp}% )</span>
              <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer ml-1">XLS</span>
            </Row>
            <Row label="Ingressos" index={5}>
              <span className="text-blue-600 font-bold text-sm">+</span>
              <span className="font-semibold text-blue-700">{fmtN(ingressos)}</span>
            </Row>
            <Row label={`Caixa Inicial de ${periodoConfirmado.inicio}`} index={6}>
              <span className="font-semibold text-gray-800">{fmtV(caixaInicial)}</span>
            </Row>
            <Row label={`Caixa Final de ${periodoConfirmado.fim}`} bold index={7}>
              <span className="text-green-700">{fmtV(caixaFinal)}</span>
            </Row>
            <div className="flex items-center mx-2 mt-0.5 mb-1.5 rounded px-3 py-2 border-l-4"
              style={{ background: "#f0fdf4", borderLeftColor: "#16a34a", border: "1px solid #bbf7d0", borderLeftWidth: 4 }}>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lucro Total</span>
              <div className="flex-1" />
              <span className="text-base font-bold text-green-700">{fmtV(lucroTotal)}</span>
            </div>
          </>);
        })()}
      </div>

      {/* MODAL: Período */}
      {periodoModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setPeriodoModalOpen(false)}>
          <div style={{ background: "#fff", borderRadius: 14, width: 400, boxShadow: "0 25px 70px rgba(0,0,0,0.35)", overflow: "hidden" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#fff" }}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Período de Consulta</span>
              </div>
              <button onClick={() => setPeriodoModalOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: "22px 24px" }}>
              <div style={{ background: "#eff6ff", borderRadius: 8, padding: "10px 14px", marginBottom: 20, border: "1px solid #bfdbfe" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 2 }}>Rota selecionada</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1e40af" }}>{selectedRotaPer}</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Data Inicial *</label>
                <input type="date" value={periodoForm.inicio} onChange={e => setPeriodoForm(f => ({ ...f, inicio: e.target.value }))}
                  style={{ width: "100%", height: 38, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "0 12px", fontSize: 13, color: "#334155", background: "#f8fafc", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Data Final *</label>
                <input type="date" value={periodoForm.fim} onChange={e => setPeriodoForm(f => ({ ...f, fim: e.target.value }))}
                  style={{ width: "100%", height: 38, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "0 12px", fontSize: 13, color: "#334155", background: "#f8fafc", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setPeriodoModalOpen(false)}
                  style={{ flex: 1, height: 40, border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button
                  disabled={!periodoForm.inicio || !periodoForm.fim || periodoForm.fim < periodoForm.inicio}
                  onClick={() => { setPeriodoConfirmado({ rota: selectedRotaPer!, inicio: periodoForm.inicio, fim: periodoForm.fim }); setPeriodoModalOpen(false); }}
                  style={{ flex: 2, height: 40, border: "none", borderRadius: 8, background: !periodoForm.inicio || !periodoForm.fim || periodoForm.fim < periodoForm.inicio ? "#cbd5e1" : "#2563eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: !periodoForm.inicio || !periodoForm.fim || periodoForm.fim < periodoForm.inicio ? "not-allowed" : "pointer" }}>
                  Ver Dados do Período
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const liqPerPagData: { nro: number; consecutivo: string; linkColor: string; cliente: string; clienteColor: string; parcela: number; tipo: string; formaPgto: string; valor: string; data: string; valorProd: string; saldo: string; restantes: string }[] = [];

function LiqPeriodosPagamentosContent() {
  const inputCls = "h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 placeholder-gray-400 text-gray-700";

  const cols = [
    { label: "Rota",            w: "11%", align: "left"   as const },
    { label: "Nro.",            w: "4%",  align: "center" as const },
    { label: "Consecutivo",     w: "9%",  align: "left"   as const },
    { label: "Cliente",         w: "17%", align: "left"   as const },
    { label: "# Parcela",       w: "6%",  align: "center" as const },
    { label: "Tipo",            w: "6%",  align: "center" as const },
    { label: "Forma de Pgto.",  w: "8%",  align: "left"   as const },
    { label: "Valor",           w: "7%",  align: "right"  as const },
    { label: "Data",            w: "8%",  align: "center" as const },
    { label: "Valor Prod.",     w: "8%",  align: "right"  as const },
    { label: "Saldo",           w: "8%",  align: "right"  as const },
    { label: "Parc. Restantes", w: "8%",  align: "center" as const },
  ];

  const parseVal = (s: string) => parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  const totalRecebido = liqPerPagData.reduce((a, r) => a + parseVal(r.valor), 0);
  const totalProd = liqPerPagData.reduce((a, r) => a + parseVal(r.valorProd), 0);
  const taxaPct = totalProd > 0 ? (totalRecebido / totalProd) * 100 : 0;
  const fmtR = (v: number) => `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

  const tdP = (align: "left" | "center" | "right", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "6px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
    textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Filter bar ── */}
      <div className="shrink-0 flex items-end gap-2 flex-wrap px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Consecutivo</label>
          <input placeholder="Ex: 4700627089" className={`${inputCls} w-32`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Nome</label>
          <input placeholder="Nome do cliente" className={`${inputCls} w-36`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Sobrenome</label>
          <input placeholder="Sobrenome" className={`${inputCls} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Documento</label>
          <input placeholder="CPF / RG" className={`${inputCls} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Forma de Pag.</label>
          <select className={`${inputCls} w-32`}>
            <option value="">-- Todas --</option>
            <option>Dinheiro</option>
            <option>Transferência</option>
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Tipo</label>
          <select className={`${inputCls} w-28`}>
            <option value="">-- Todas --</option>
            <option>Parcela</option>
            <option>Extra</option>
          </select>
        </div>
        <div className="flex gap-1.5 pb-0.5">
          <button className="h-7 px-3 rounded text-xs font-semibold border border-gray-300 text-gray-600 bg-white hover:bg-gray-50">Limpar</button>
          <button className="h-7 px-3 rounded text-xs font-semibold text-white flex items-center gap-1 hover:opacity-90" style={{ background: "#2563eb" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            Buscar
          </button>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 font-medium pb-0.5">DATA DE REFERÊNCIA: 2026-06-06</span>
      </div>

      {/* ── Count bar ── */}
      <div className="shrink-0 flex items-center px-3 py-1.5" style={{ background: "#f0f2f5", borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-xs text-gray-500">
          <span className="font-bold text-gray-800">{liqPerPagData.length}</span> registros encontrados
        </span>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.label} style={{
                  padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                  borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
                  position: "sticky", top: 0, zIndex: 1,
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liqPerPagData.map((r, i) => {
              const rowBg = i % 2 === 0 ? "#fff" : "#f9fafb";
              return (
                <tr key={r.nro} style={{ cursor: "pointer" }}
                  onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => (c.style.background = "#eff6ff"))}
                  onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => (c.style.background = rowBg))}>
                  <td style={tdP("left",   { color: "#374151", fontSize: 12 })}>Rota Cred Bank -</td>
                  <td style={tdP("center", { color: "#6b7280", fontWeight: 700, fontSize: 12 })}>{r.nro}</td>
                  <td style={tdP("left")}>
                    <span style={{ color: r.linkColor, fontWeight: 700, borderBottom: `1px dashed ${r.linkColor}`, cursor: "pointer" }}>{r.consecutivo}</span>
                  </td>
                  <td style={tdP("left", { color: r.clienteColor, fontWeight: 600 })}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{r.cliente}</span>
                  </td>
                  <td style={tdP("center")}>{r.parcela}</td>
                  <td style={tdP("center")}>{r.tipo}</td>
                  <td style={tdP("left")}>{r.formaPgto}</td>
                  <td style={tdP("right",  { fontWeight: 600, color: "#111827" })}>{r.valor}</td>
                  <td style={tdP("center", { color: "#4b5563" })}>{r.data}</td>
                  <td style={tdP("right",  { fontWeight: 600, color: "#111827" })}>{r.valorProd}</td>
                  <td style={tdP("right",  { fontWeight: 700, color: r.saldo !== "0,00" ? "#059669" : "#374151" })}>{r.saldo}</td>
                  <td style={tdP("center")}>{r.restantes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Total row ── */}
      <div className="shrink-0 flex items-center justify-start gap-4 px-4 py-2 border-t" style={{ background: "#f0f2f5" }}>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total Recebido</span>
        <span className="text-sm font-extrabold text-white bg-green-700 px-2.5 py-0.5 rounded-md">
          {totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* ── Blue footer bar (padrão) ── */}
      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />

    </div>
  );
}

// ── Vendas por Períodos data ───────────────────────────────────────────────────
const vendasPeriodosData = [
  { id:1,  vendedor:"Rota Cred Bank -", consec:"4700627058", freq:"DIARIO", valorAnt:0,    idVenta:"47006270158", cliente:"Aline Lima De Alencar",            tag:"Nuevo",               documento:"034.286.733-44", movel:"98982381007",    valorProd:800,  cuotas:14, pctInt:40, cuota:80,  fecha:"2026-03-25", cuotRest:0,    saldo:0    },
  { id:2,  vendedor:"Rota Cred Bank -", consec:"4700627058", freq:"DIARIO", valorAnt:800,  idVenta:"47006270167", cliente:"Aline Lima De Alencar",            tag:"Renovado Igual Valor",documento:"034.286.733-44", movel:"98982381007",    valorProd:800,  cuotas:14, pctInt:40, cuota:80,  fecha:"2026-04-15", cuotRest:13,   saldo:1040 },
  { id:3,  vendedor:"Rota Cred Bank -", consec:"4700627049", freq:"DIARIO", valorAnt:500,  idVenta:"47006270166", cliente:"Ana Flávia Pereira Moraes",        tag:"Renovado Igual Valor",documento:"61538186302",    movel:"98991571405",    valorProd:500,  cuotas:14, pctInt:40, cuota:50,  fecha:"2026-04-08", cuotRest:9,    saldo:450  },
  { id:4,  vendedor:"Rota Cred Bank -", consec:"4700627049", freq:"DIARIO", valorAnt:0,    idVenta:"47006270149", cliente:"Ana Flávia Pereira Moraes",        tag:"Nuevo",               documento:"61538186302",    movel:"98991571405",    valorProd:500,  cuotas:14, pctInt:40, cuota:50,  fecha:"2026-03-24", cuotRest:0,    saldo:0    },
  { id:5,  vendedor:"Rota Cred Bank -", consec:"4700627079", freq:"DIARIO", valorAnt:0,    idVenta:"47006270179", cliente:"Ana Paula Marques De Oliveira",    tag:"Nuevo",               documento:"85259284372",    movel:"98986248424",    valorProd:500,  cuotas:14, pctInt:40, cuota:60,  fecha:"2026-03-28", cuotRest:0,    saldo:0    },
  { id:6,  vendedor:"Rota Cred Bank -", consec:"4700627026", freq:"DIARIO", valorAnt:600,  idVenta:"47006270181", cliente:"Andreia de Jesus Costa Araújo",    tag:"Renovado Mayor Valor",documento:"91633427315",    movel:"98985014328",    valorProd:800,  cuotas:14, pctInt:40, cuota:80,  fecha:"2026-03-30", cuotRest:0,    saldo:0    },
  { id:7,  vendedor:"Rota Cred Bank -", consec:"4700627026", freq:"DIARIO", valorAnt:800,  idVenta:"47006270165", cliente:"Andreia de Jesus Costa Araújo",    tag:"Renovado Mayor Valor",documento:"91633427315",    movel:"98985014328",    valorProd:1500, cuotas:20, pctInt:40, cuota:105, fecha:"2026-04-08", cuotRest:7.62, saldo:800  },
  { id:8,  vendedor:"Rota Cred Bank -", consec:"4700627026", freq:"DIARIO", valorAnt:0,    idVenta:"47006270126", cliente:"Andreia de Jesus Costa Araújo",    tag:"Nuevo",               documento:"91633427315",    movel:"98985014328",    valorProd:600,  cuotas:14, pctInt:40, cuota:60,  fecha:"2026-03-14", cuotRest:0,    saldo:0    },
  { id:9,  vendedor:"Rota Cred Bank -", consec:"4700627024", freq:"DIARIO", valorAnt:0,    idVenta:"47006270224", cliente:"Anny Briane Pires Belfort",        tag:"Nuevo",               documento:"55983315617",    movel:"98985014328",    valorProd:800,  cuotas:14, pctInt:40, cuota:60,  fecha:"2026-03-28", cuotRest:2.62, saldo:210  },
  { id:10, vendedor:"Rota Cred Bank -", consec:"4700627027", freq:"DIARIO", valorAnt:0,    idVenta:"47006270127", cliente:"Antônio Leite Neto",               tag:"Nuevo",               documento:"005234678355",   movel:"5598984643699",  valorProd:600,  cuotas:14, pctInt:40, cuota:60,  fecha:"2026-03-14", cuotRest:12.5, saldo:750  },
  { id:11, vendedor:"Rota Cred Bank -", consec:"4700627025", freq:"DIARIO", valorAnt:0,    idVenta:"47006270125", cliente:"Bianca de Araújo Alves",           tag:"Nuevo",               documento:"60974118397",    movel:"9988330893",     valorProd:500,  cuotas:14, pctInt:40, cuota:50,  fecha:"2026-03-13", cuotRest:0,    saldo:0    },
  { id:12, vendedor:"Rota Cred Bank -", consec:"4700627025", freq:"DIARIO", valorAnt:500,  idVenta:"47006270170", cliente:"Bianca de Araújo Alves",           tag:"Renovado Menor Valor",documento:"60974118397",    movel:"9988330893",     valorProd:300,  cuotas:14, pctInt:40, cuota:30,  fecha:"2026-04-16", cuotRest:14,   saldo:420  },
  { id:13, vendedor:"Rota Cred Bank -", consec:"4700627023", freq:"DIARIO", valorAnt:0,    idVenta:"47006270123", cliente:"Elaira Kisley Conceição Lopes",    tag:"Nuevo",               documento:"88899900011",    movel:"98986543210",    valorProd:540,  cuotas:14, pctInt:40, cuota:54,  fecha:"2026-03-20", cuotRest:9,    saldo:540  },
  { id:14, vendedor:"Rota Cred Bank -", consec:"4700627031", freq:"DIARIO", valorAnt:0,    idVenta:"47006270131", cliente:"Carlos Henrique Souza Lima",       tag:"Nuevo",               documento:"11122233344",    movel:"98982345678",    valorProd:650,  cuotas:14, pctInt:40, cuota:65,  fecha:"2026-03-22", cuotRest:11,   saldo:590  },
  { id:15, vendedor:"Rota Cred Bank -", consec:"4700627044", freq:"DIARIO", valorAnt:0,    idVenta:"47006270144", cliente:"Fernanda Cristina Moura",          tag:"Nuevo",               documento:"22233344455",    movel:"98985678901",    valorProd:980,  cuotas:14, pctInt:40, cuota:98,  fecha:"2026-03-28", cuotRest:8,    saldo:840  },
  { id:16, vendedor:"Rota Cred Bank -", consec:"4700627073", freq:"SEMANAL", valorAnt:500, idVenta:"47006270173", cliente:"Marcos Vinícius Almeida Costa",    tag:"Renovado Mayor Valor",documento:"33344455566",    movel:"98984321100",    valorProd:840,  cuotas:14, pctInt:40, cuota:84,  fecha:"2026-04-09", cuotRest:5,    saldo:350  },
];

function VendasPorPeriodosContent() {
  const tdV = (align: "left"|"center"|"right", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "6px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
    fontSize: 13, textAlign: align, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...extra,
  });

  const tagStyle = (tag: string): React.CSSProperties => {
    if (tag === "Nuevo")               return { color: "#15803d", fontWeight: 700 };
    if (tag === "Renovado Igual Valor")return { color: "#d97706", fontWeight: 700 };
    if (tag === "Renovado Mayor Valor")return { color: "#2563eb", fontWeight: 700 };
    if (tag === "Renovado Menor Valor")return { color: "#dc2626", fontWeight: 700 };
    return { color: "#6b7280", fontWeight: 600 };
  };

  const cols = [
    { label: "Rota",           w: "9%",  align: "left"   as const },
    { label: "Consec.",        w: "7%",  align: "left"   as const },
    { label: "Frec.",          w: "5%",  align: "center" as const },
    { label: "Valor Ant.",     w: "5%",  align: "right"  as const },
    { label: "Id Venta",       w: "8%",  align: "left"   as const },
    { label: "Cliente",        w: "21%", align: "left"   as const },
    { label: "Documento",      w: "8%",  align: "left"   as const },
    { label: "Móvel",          w: "8%",  align: "left"   as const },
    { label: "Valor Produto",  w: "6%",  align: "right"  as const },
    { label: "Cuotas",         w: "4%",  align: "center" as const },
    { label: "%Int",           w: "4%",  align: "center" as const },
    { label: "Cuota",          w: "4%",  align: "right"  as const },
    { label: "Fecha",          w: "7%",  align: "center" as const },
    { label: "Cuot. Rest.",    w: "5%",  align: "center" as const },
    { label: "Saldo",          w: "5%",  align: "right"  as const },
  ];

  const totalVendas = vendasPeriodosData.reduce((a, r) => a + r.valorProd, 0);
  const fmtV = (v: number) => `$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Count bar ── */}
      <div className="shrink-0 flex items-center px-3 py-1.5" style={{ background: "#f0f2f5", borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-xs text-gray-500">
          <span className="font-bold text-gray-800">{vendasPeriodosData.length}</span> registros encontrados
        </span>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.label} style={{
                  padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                  whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                  borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
                  position: "sticky", top: 0, zIndex: 1,
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendasPeriodosData.map((r, i) => {
              const rowBg = i % 2 === 0 ? "#fff" : "#f9fafb";
              return (
                <tr key={r.id} style={{ background: rowBg, cursor: "pointer" }}
                  onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = "#eff6ff")}
                  onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = rowBg)}>
                  <td style={tdV("left",   { color: "#374151", fontSize: 12 })}>{r.vendedor}</td>
                  <td style={tdV("left",   { color: "#2563eb", fontWeight: 700 })}>
                    <span style={{ borderBottom: "1px dashed #93c5fd" }}>{r.consec}</span>
                  </td>
                  <td style={tdV("center", { color: "#6b7280", fontSize: 12 })}>{r.freq}</td>
                  <td style={tdV("right",  { color: r.valorAnt > 0 ? "#374151" : "#9ca3af", fontWeight: r.valorAnt > 0 ? 600 : 400 })}>
                    {r.valorAnt > 0 ? fmtV(r.valorAnt) : "$ 0"}
                  </td>
                  <td style={tdV("left",   { color: "#6b7280", fontSize: 12 })}>{r.idVenta}</td>
                  <td style={tdV("left")}>
                    <span style={{ color: "#374151", fontWeight: 500, marginRight: 4, overflow: "hidden", textOverflow: "ellipsis" }}>{r.cliente}</span>
                    <span style={{ fontSize: 11, ...tagStyle(r.tag) }}>&gt;&gt;&gt; {r.tag}</span>
                  </td>
                  <td style={tdV("left",   { color: "#6b7280", fontSize: 12 })}>{r.documento}</td>
                  <td style={tdV("left",   { color: "#6b7280", fontSize: 12 })}>{r.movel}</td>
                  <td style={tdV("right",  { fontWeight: 700, color: "#111827" })}>{fmtV(r.valorProd)}</td>
                  <td style={tdV("center", { color: "#374151" })}>{r.cuotas}</td>
                  <td style={tdV("center", { color: "#374151" })}>{r.pctInt}%</td>
                  <td style={tdV("right",  { fontWeight: 600, color: "#374151" })}>{r.cuota}</td>
                  <td style={tdV("center", { color: "#4b5563" })}>{r.fecha}</td>
                  <td style={tdV("center", { color: r.cuotRest > 0 ? "#374151" : "#9ca3af", fontWeight: r.cuotRest > 0 ? 600 : 400 })}>{r.cuotRest}</td>
                  <td style={tdV("right",  { fontWeight: 700, color: r.saldo > 0 ? "#15803d" : "#9ca3af" })}>
                    {r.saldo > 0 ? r.saldo.toLocaleString("pt-BR") : "0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Total flutuante ── */}
      <div className="shrink-0 flex items-center justify-start gap-8 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL EMPRESTADO</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#1d4ed8", padding: "1px 10px", borderRadius: 6 }}>{totalVendas.toLocaleString("pt-BR")}</span>
      </div>

      {/* ── Blue footer bar (padrão) ── */}
      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />
    </div>
  );
}


// ── Liq. Períodos – Clientes data ─────────────────────────────────────────────
interface LiqPerClienteRow {
  id: number; vendedor: string; fechaVenta: string; consec: string; status: string;
  cancelDate: string; cliente: string; idVenta: string; movel: string; direc: string;
  cuotas: number; cuoPag: number; cuoFalt: number; saldo: number; int: number;
  valorProd: number; vrCuota: number; visitas: number; freq: string;
}
const liqPerClientesData: LiqPerClienteRow[] = [
  { id:1,  vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-25", consec:"4700627058", status:"Cancelado", cancelDate:"2026-04-15", cliente:"Aline Lima De Alencar",           idVenta:"4700627058", movel:"98982381007",   direc:"",                                        cuotas:14.0, cuoPag:14.0, cuoFalt:0.0,  saldo:0,    int:40, valorProd:1120, vrCuota:80,  visitas:15, freq:"DIARIO" },
  { id:2,  vendedor:"Rota Cred Bank -", fechaVenta:"2026-04-15", consec:"4700627058", status:"Activo",    cancelDate:"",           cliente:"Aline Lima De Alencar",           idVenta:"4700627067", movel:"98982381007",   direc:"",                                        cuotas:14.0, cuoPag:1.0,  cuoFalt:13.0, saldo:1040, int:40, valorProd:1120, vrCuota:80,  visitas:3,  freq:"DIARIO" },
  { id:3,  vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-24", consec:"4700627049", status:"Cancelado", cancelDate:"2026-04-08", cliente:"Ana Flávia Pereira Moraes",       idVenta:"4700627049", movel:"98991571405",   direc:"",                                        cuotas:14.0, cuoPag:14.0, cuoFalt:0.0,  saldo:0,    int:40, valorProd:700,  vrCuota:50,  visitas:16, freq:"DIARIO" },
  { id:4,  vendedor:"Rota Cred Bank -", fechaVenta:"2026-04-08", consec:"4700627049", status:"Activo",    cancelDate:"",           cliente:"Ana Flávia Pereira Moraes",       idVenta:"4700627066", movel:"98991571405",   direc:"",                                        cuotas:14.0, cuoPag:5.0,  cuoFalt:9.0,  saldo:450,  int:40, valorProd:700,  vrCuota:50,  visitas:4,  freq:"DIARIO" },
  { id:5,  vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-28", consec:"4700627079", status:"Cancelado", cancelDate:"2026-06-25", cliente:"Ana Paula Marques De Oliveira",   idVenta:"4700627079", movel:"98986248424",   direc:"",                                        cuotas:14.0, cuoPag:14.0, cuoFalt:0.0,  saldo:0,    int:40, valorProd:700,  vrCuota:50,  visitas:13, freq:"DIARIO" },
  { id:6,  vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-14", consec:"4700627026", status:"Cancelado", cancelDate:"2026-01-30", cliente:"Andreia de Jesus Costa Araújo",   idVenta:"4700627026", movel:"98985014328",   direc:"Rua gama lobon número 10 quarto",         cuotas:14.0, cuoPag:14.0, cuoFalt:0.0,  saldo:0,    int:40, valorProd:840,  vrCuota:60,  visitas:20, freq:"DIARIO" },
  { id:7,  vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-30", consec:"4700627026", status:"Cancelado", cancelDate:"",           cliente:"Andreia de Jesus Costa Araújo",   idVenta:"4700627081", movel:"98985014328",   direc:"Rua gama lobon número 10 quarto",         cuotas:14.0, cuoPag:14.0, cuoFalt:0.0,  saldo:0,    int:40, valorProd:1120, vrCuota:80,  visitas:12, freq:"DIARIO" },
  { id:8,  vendedor:"Rota Cred Bank -", fechaVenta:"2026-04-08", consec:"4700627026", status:"Activo",    cancelDate:"",           cliente:"Andreia de Jesus Costa Araújo",   idVenta:"4700627065", movel:"98985014328",   direc:"Rua gama lobon número 10 quarto",         cuotas:20.0, cuoPag:12.4, cuoFalt:7.6,  saldo:800,  int:40, valorProd:2100, vrCuota:105, visitas:4,  freq:"DIARIO" },
  { id:9,  vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-13", consec:"4700627024", status:"Activo",    cancelDate:"",           cliente:"Anny Briane Pires Belfort",       idVenta:"4700627024", movel:"559883156178",  direc:"",                                        cuotas:14.0, cuoPag:11.4, cuoFalt:2.6,  saldo:210,  int:40, valorProd:1120, vrCuota:80,  visitas:22, freq:"DIARIO" },
  { id:10, vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-14", consec:"4700627027", status:"Activo",    cancelDate:"",           cliente:"Antônio Leite Neto",              idVenta:"4700627027", movel:"5598984643699", direc:"Rua frei Lauro número 7 conj. COHAB",     cuotas:14.0, cuoPag:1.5,  cuoFalt:12.5, saldo:750,  int:40, valorProd:840,  vrCuota:60,  visitas:20, freq:"DIARIO" },
  { id:11, vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-13", consec:"4700627025", status:"Cancelado", cancelDate:"2026-04-11", cliente:"Bianca de Araújo Alves",          idVenta:"4700627025", movel:"9898330893",    direc:"",                                        cuotas:14.0, cuoPag:14.0, cuoFalt:0.0,  saldo:0,    int:40, valorProd:700,  vrCuota:50,  visitas:21, freq:"DIARIO" },
  { id:12, vendedor:"Rota Cred Bank -", fechaVenta:"2026-04-16", consec:"4700627025", status:"Activo",    cancelDate:"",           cliente:"Bianca de Araújo Alves",          idVenta:"4700627070", movel:"9898330893",    direc:"",                                        cuotas:14.0, cuoPag:0.0,  cuoFalt:14.0, saldo:420,  int:40, valorProd:420,  vrCuota:30,  visitas:2,  freq:"DIARIO" },
  { id:13, vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-20", consec:"4700627023", status:"Activo",    cancelDate:"",           cliente:"Elaira Kisley Conceição Lopes",   idVenta:"4700627023", movel:"98986543210",   direc:"",                                        cuotas:14.0, cuoPag:5.0,  cuoFalt:9.0,  saldo:540,  int:40, valorProd:840,  vrCuota:60,  visitas:9,  freq:"DIARIO" },
  { id:14, vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-22", consec:"4700627031", status:"Activo",    cancelDate:"",           cliente:"Carlos Henrique Souza Lima",      idVenta:"4700627031", movel:"98982345678",   direc:"",                                        cuotas:14.0, cuoPag:3.0,  cuoFalt:11.0, saldo:590,  int:40, valorProd:910,  vrCuota:65,  visitas:11, freq:"DIARIO" },
  { id:15, vendedor:"Rota Cred Bank -", fechaVenta:"2026-03-28", consec:"4700627044", status:"Activo",    cancelDate:"",           cliente:"Fernanda Cristina Moura",         idVenta:"4700627044", movel:"98985678901",   direc:"",                                        cuotas:14.0, cuoPag:6.0,  cuoFalt:8.0,  saldo:840,  int:40, valorProd:1372, vrCuota:98,  visitas:8,  freq:"DIARIO" },
  { id:16, vendedor:"Rota Cred Bank -", fechaVenta:"2026-04-09", consec:"4700627073", status:"Activo",    cancelDate:"",           cliente:"Marcos Vinícius Almeida Costa",   idVenta:"4700627073", movel:"98984321100",   direc:"",                                        cuotas:14.0, cuoPag:9.0,  cuoFalt:5.0,  saldo:350,  int:40, valorProd:1176, vrCuota:84,  visitas:5,  freq:"SEMANAL" },
];

function gerarHistorico(r: LiqPerClienteRow) {
  const entries: { nro: number; tipo: string; valor: number; fecha: string; obs: string }[] = [];
  const base = new Date(r.fechaVenta);
  const step = r.freq === "SEMANAL" ? 7 : 1;
  const total = Math.round(r.cuotas);
  const pagos = Math.round(r.cuoPag);
  for (let i = 1; i <= total; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + (i - 1) * step);
    const fecha = d.toISOString().split("T")[0];
    if (i <= pagos) {
      entries.push({ nro: i, tipo: "PARC.", valor: r.vrCuota, fecha, obs: "Cuota" });
    } else {
      entries.push({ nro: i, tipo: "S/PAG.", valor: 0, fecha, obs: "Operacion Masiva" });
    }
  }
  return entries.reverse();
}

function LiqPeriodosClientesContent() {
  const [clienteSel, setClienteSel] = useState<LiqPerClienteRow | null>(null);
  const inputCls = "h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 placeholder-gray-400 text-gray-700";

  const cols = [
    { label: "Rota",          w: "8%",  align: "left"   as const },
    { label: "Data Venda",    w: "7%",  align: "center" as const },
    { label: "Consec.",       w: "13%", align: "left"   as const },
    { label: "Cliente",       w: "13%", align: "left"   as const },
    { label: "Id Venda",      w: "7%",  align: "left"   as const },
    { label: "Celular",       w: "8%",  align: "left"   as const },
    { label: "Endereço",      w: "10%", align: "left"   as const },
    { label: "Parcelas",      w: "4%",  align: "center" as const },
    { label: "Parc. Pag.",    w: "4%",  align: "center" as const },
    { label: "Parc. Rest.",   w: "4%",  align: "center" as const },
    { label: "Saldo",         w: "4%",  align: "right"  as const },
    { label: "Int.",          w: "3%",  align: "center" as const },
    { label: "Valor Prod.",   w: "5%",  align: "right"  as const },
    { label: "Vl. Parcela",  w: "5%",  align: "right"  as const },
    { label: "Visitas",       w: "4%",  align: "center" as const },
    { label: "Frequência",    w: "5%",  align: "center" as const },
  ];

  const tdC = (align: "left"|"center"|"right", extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "7px 9px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
    fontSize: 14, textAlign: align, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", ...extra,
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Barra de filtros ── */}
      <div className="shrink-0 flex items-end gap-2 flex-wrap px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Consecutivo</label>
          <input placeholder="Consecutivo" className={`${inputCls} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Nomes</label>
          <input placeholder="Nomes" className={`${inputCls} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Sobrenomes</label>
          <input placeholder="Sobrenomes" className={`${inputCls} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Documento</label>
          <input placeholder="Documento" className={`${inputCls} w-28`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</label>
          <select className={`${inputCls} w-24`}>
            <option>Todos</option>
            <option>Ativo</option>
            <option>Cancelado</option>
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Data Venda</label>
          <input type="date" className={`${inputCls} w-32`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Data Cancelamento</label>
          <input type="date" className={`${inputCls} w-36`} />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Frequência</label>
          <select className={`${inputCls} w-32`}>
            <option value="">Selecione Frequência</option>
            <option>DIÁRIO</option>
            <option>SEMANAL</option>
          </select>
        </div>
        <div className="flex gap-1.5 pb-0.5">
          <button className="h-7 px-3 rounded text-xs font-semibold text-white flex items-center gap-1 hover:opacity-90" style={{ background: "#2563eb" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            Pesquisar
          </button>
        </div>
      </div>

      {/* ── Barra de contagem ── */}
      <div className="shrink-0 flex items-center px-3 py-1.5" style={{ background: "#f0f2f5", borderBottom: "1px solid #e0e0e0" }}>
        <span className="text-xs text-gray-500">
          <span className="font-bold text-gray-800">{liqPerClientesData.length}</span> registros encontrados
        </span>
      </div>

      {/* ── Tabela ── */}
      <div className="flex-1 overflow-auto">
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <colgroup>{cols.map((c, i) => <col key={i} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.label} style={{
                  padding: "8px 9px", textAlign: c.align, fontSize: 14, fontWeight: 700,
                  color: "#e2e8f0", background: "#3d6e8e", borderRight: "1px solid #4a7fa0",
                  letterSpacing: "0.02em", position: "sticky", top: 0, zIndex: 1, whiteSpace: "nowrap",
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {liqPerClientesData.map((r, i) => {
              const rowBg = i % 2 === 0 ? "#fff" : "#f9fafb";
              const isAtivo = r.status === "Activo";
              const consecColor = isAtivo ? "#d97706" : "#dc2626";
              return (
                <tr key={r.id} style={{ background: rowBg, cursor: "pointer" }}
                  onClick={() => setClienteSel(r)}
                  onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = "#eff6ff")}
                  onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => c.style.background = rowBg)}>
                  <td style={tdC("left", { color: "#374151", fontSize: 13 })}>{r.id}. {r.vendedor}</td>
                  <td style={tdC("center", { color: "#6b7280" })}>{r.fechaVenta}</td>
                  <td style={tdC("left")}>
                    <span style={{ color: consecColor, fontWeight: 700, borderBottom: `1px dashed ${consecColor}`, fontSize: 13 }}>{r.consec}</span>
                    <span style={{ color: consecColor, fontSize: 12, marginLeft: 3 }}>
                      ({isAtivo ? "Ativo" : `Cancelado${r.cancelDate ? "-" + r.cancelDate : ""}`})
                    </span>
                  </td>
                  <td style={tdC("left", { color: "#374151", fontWeight: 500 })}>{r.cliente}</td>
                  <td style={tdC("left", { color: "#2563eb", fontWeight: 700, fontSize: 13 })}>
                    <span style={{ borderBottom: "1px dashed #93c5fd" }}>{r.idVenta}</span>
                  </td>
                  <td style={tdC("left", { color: "#6b7280" })}>{r.movel}</td>
                  <td style={tdC("left", { color: "#9ca3af", fontStyle: r.direc ? "normal" : "italic", fontSize: 13 })}>{r.direc || "—"}</td>
                  <td style={tdC("center", { color: "#374151" })}>{r.cuotas}</td>
                  <td style={tdC("center", { color: "#374151" })}>{r.cuoPag}</td>
                  <td style={tdC("center", { color: r.cuoFalt > 0 ? "#374151" : "#9ca3af", fontWeight: r.cuoFalt > 0 ? 600 : 400 })}>{r.cuoFalt}</td>
                  <td style={tdC("right", { fontWeight: 700, color: r.saldo > 0 ? "#15803d" : "#9ca3af" })}>{r.saldo}</td>
                  <td style={tdC("center", { color: "#374151" })}>{r.int}</td>
                  <td style={tdC("right", { fontWeight: 700, color: "#374151" })}>{r.valorProd}</td>
                  <td style={tdC("right", { fontWeight: 600, color: "#374151" })}>{r.vrCuota}</td>
                  <td style={tdC("center", { color: "#374151" })}>{r.visitas}</td>
                  <td style={tdC("center", { color: "#6b7280", fontSize: 13 })}>{r.freq}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Total ── */}
      <div className="shrink-0 flex items-center justify-start gap-8 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL CLIENTES</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#1d4ed8", padding: "1px 10px", borderRadius: 6 }}>{liqPerClientesData.length}</span>
      </div>

      {/* ── Barra azul rodapé ── */}
      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />

      {/* ── Modal Histórico de Pagamentos ── */}
      {clienteSel && (() => {
        const sel = clienteSel as LiqPerClienteRow;
        const hist = gerarHistorico(sel);
        const totalPago = hist.filter(h => h.tipo === "PARC.").reduce((a, h) => a + h.valor, 0);
        const fmtValor = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
        const truncNome = (n: string) => n.length > 22 ? n.slice(0, 19) + "..." : n;
        const tipoIcon = (tipo: string) => {
          if (tipo === "PARC.")  return { circBg: "#16a34a", label: "PARC.",  txtColor: "#16a34a" };
          if (tipo === "S/PAG.") return { circBg: "#dc2626", label: "S/PAG.", txtColor: "#dc2626" };
          return                        { circBg: "#d97706", label: "ABONO",  txtColor: "#d97706" };
        };
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setClienteSel(null)}>
            <div style={{ background: "#fff", borderRadius: 8, width: 760, maxWidth: "96vw", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
              onClick={e => e.stopPropagation()}>

              {/* ── Barra título ── */}
              <div style={{ background: "#3d6e8e", borderRadius: "8px 8px 0 0", padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Histórico de Pagamentos</span>
                <button onClick={() => setClienteSel(null)} style={{ width: 28, height: 28, borderRadius: 4, background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
              </div>

              {/* ── Cabeçalho cliente ── */}
              <div style={{ padding: "12px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12, background: "#fff" }}>
                <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: "#d97706", flexShrink: 0 }}><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                <span style={{ fontWeight: 800, fontSize: 14, color: "#d97706", letterSpacing: "0.05em", textTransform: "uppercase" }}>{sel.cliente}</span>
                <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 4 }}>Empréstimo #{sel.id}</span>
              </div>

              {/* ── Tabela ── */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      {[
                        { l: "Nro.",        w: "7%",  a: "center" as const },
                        { l: "Cliente",     w: "28%", a: "left"   as const },
                        { l: "Tipo",        w: "14%", a: "left"   as const },
                        { l: "Valor",       w: "14%", a: "right"  as const },
                        { l: "Fecha",       w: "16%", a: "left"   as const },
                        { l: "Observações", w: "21%", a: "left"   as const },
                      ].map(c => (
                        <th key={c.l} style={{ padding: "9px 14px", textAlign: c.a, fontSize: 13, fontWeight: 700, color: "#374151", background: "#e8edf2", borderBottom: "2px solid #cbd5e1", whiteSpace: "nowrap", width: c.w }}>{c.l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hist.map((h, i) => {
                      const icon = tipoIcon(h.tipo);
                      const bg = i % 2 === 0 ? "#fff" : "#f9fafb";
                      return (
                        <tr key={h.nro} style={{ background: bg }}>
                          <td style={{ padding: "8px 14px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#2563eb", borderBottom: "1px solid #f0f0f0" }}>{h.nro}</td>
                          <td style={{ padding: "8px 14px", fontSize: 13, color: "#2563eb", fontWeight: 600, borderBottom: "1px solid #f0f0f0", overflow: "hidden", maxWidth: 0 }}>
                            {truncNome(sel.cliente)}
                          </td>
                          <td style={{ padding: "8px 14px", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <span style={{ width: 18, height: 18, borderRadius: "50%", background: icon.circBg, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: "#fff" }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: icon.txtColor }}>{icon.label}</span>
                            </span>
                          </td>
                          <td style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#374151", textAlign: "right", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>
                            {fmtValor(h.valor)}
                          </td>
                          <td style={{ padding: "8px 14px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{h.fecha}</td>
                          <td style={{ padding: "8px 14px", fontSize: 12, color: "#9ca3af", borderBottom: "1px solid #f0f0f0" }}>{h.obs === "Cuota" ? "" : h.obs}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Rodapé ── */}
              <div style={{ padding: "13px 18px", borderTop: "2px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                  TOTAL PAGOS:{" "}
                  <span style={{ color: "#2563eb" }}>{fmtValor(totalPago)}</span>
                </span>
                <button onClick={() => setClienteSel(null)}
                  style={{ padding: "7px 24px", background: "#2563eb", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Resumo ────────────────────────────────────────────────────────────────────

const resumoRow = {
  vendedor: "Rota Cred Bank -",
  fechaInicial: "2026-03-06",
  fechaFinal:   "2026-06-11",
  nClientes: 31, nCierres: 23,
  clientesAtivos: 24, clientesInativos: 4, clientesCancelados: 3,
  cajaInicial: 0.00, carteira: 12170.00, recaudo: 17420.00,
  promedio: 757.39, recaudoPretendido: 9940.00,
  numVentas: 31, totalVentas: 21200.00, totalInt: 8390.00,
  retiros: 351.00, egresos: 2241.00, ingresos: 9390.00,
  cajaFinal: 3369.00, sancao: 0.00,
};

function ResumoContent() {
  const [cobrador,    setCobrador]    = useState(resumoRow.vendedor);
  const [dataInicial, setDataInicial] = useState(resumoRow.fechaInicial);
  const [dataFinal,   setDataFinal]   = useState(resumoRow.fechaFinal);

  const r   = resumoRow;
  const fmt  = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const fmtR = (v: number) => `R$ ${fmt(v)}`;
  const lucro = r.totalInt + r.ingresos - r.egresos - r.retiros;
  const inputCls = "h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700";

  const dIni = new Date(dataInicial + "T12:00:00").toLocaleDateString("pt-BR");
  const dFin = new Date(dataFinal   + "T12:00:00").toLocaleDateString("pt-BR");
  const diasPeriodo = Math.round((new Date(dataFinal + "T12:00:00").getTime() - new Date(dataInicial + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const handlePDF = () => {
    const pctR = r.recaudoPretendido > 0 ? ((r.recaudo / r.recaudoPretendido) * 100).toFixed(1) : "0,0";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Resumo de Período – ${cobrador}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,sans-serif;background:#f1f5f9;padding:20px;}
  .wrap{max-width:820px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1);}
  .hdr{background:linear-gradient(135deg,#2d5474,#3d6e8e);color:#fff;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;}
  .hdr-left h2{font-size:17px;font-weight:800;margin-bottom:3px;}
  .hdr-left p{font-size:12px;opacity:.8;}
  .hdr-right{display:flex;align-items:center;gap:10px;}
  .badge{background:#16a34a;color:#fff;padding:3px 13px;border-radius:20px;font-size:11px;font-weight:700;}
  .body{padding:18px 20px;}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;}
  .panel{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;}
  .ptitle{font-size:10px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.06em;padding:7px 12px 7px 14px;background:#f1f5f9;border-bottom:2px solid #e5e7eb;}
  .ptitle.green{border-color:#16a34a;} .ptitle.orange{border-color:#f97316;} .ptitle.blue{border-color:#2563eb;}
  .row{display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;}
  .row:last-child{border-bottom:none;}
  .lbl{color:#6b7280;} .val{font-weight:600;color:#111;}
  .g{color:#16a34a;} .b{color:#2563eb;} .r{color:#dc2626;} .a{color:#d97706;} .p{color:#7c3aed;}
  .vboxes{display:flex;flex-direction:column;gap:10px;}
  .vbox{border-radius:8px;padding:14px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;}
  .vbox .vl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
  .vbox .vv{font-size:20px;font-weight:800;}
  .footer{text-align:center;font-size:10px;color:#9ca3af;padding:10px;border-top:1px solid #f0f0f0;}
  @media print{body{padding:0;background:#fff;}.wrap{box-shadow:none;border-radius:0;}}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <div class="hdr-left">
      <h2>📊 Resumo de Período</h2>
      <p>${cobrador} · ${dIni} a ${dFin}</p>
    </div>
    <div class="hdr-right">
      <span style="font-size:13px;opacity:.9">📅 ${dIni} → ${dFin} <span style="background:rgba(255,255,255,0.2);border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700">${diasPeriodo} dias</span></span>
      <span class="badge">✓ Correto</span>
    </div>
  </div>
  <div class="body">
    <div class="grid3">
      <div class="panel">
        <div class="ptitle green">👥 Clientes</div>
        <div class="row"><span class="lbl">Clientes Cadastrados</span><span class="val">${r.nClientes}</span></div>
        <div class="row"><span class="lbl">Clientes Finalizados</span><span class="val r">${r.nCierres}</span></div>
        <div class="row"><span class="lbl">Empréstimos Realizados</span><span class="val p">${r.numVentas}</span></div>
        <div class="row"><span class="lbl">Clientes Ativos</span><span class="val g">${r.clientesAtivos}</span></div>
        <div class="row"><span class="lbl">Clientes Inativos</span><span class="val a">${r.clientesInativos}</span></div>
        <div class="row"><span class="lbl">Clientes Cancelados</span><span class="val r">${r.clientesCancelados}</span></div>
        <div class="row"><span class="lbl"><strong>Total Clientes</strong></span><span class="val b"><strong>${r.nClientes}</strong></span></div>
      </div>
      <div class="panel">
        <div class="ptitle orange">🔥 Financeiro</div>
        <div class="row"><span class="lbl">Caixa Inicial</span><span class="val g">${fmtR(r.cajaInicial)}</span></div>
        <div class="row"><span class="lbl">Carteira Inicial</span><span class="val g">${fmtR(r.carteira)}</span></div>
        <div class="row"><span class="lbl">Receb. Pretendido</span><span class="val">${fmtR(r.recaudoPretendido)}</span></div>
        <div class="row"><span class="lbl">Receb. Realizado</span><span class="val a">${fmtR(r.recaudo)} <span style="background:#fed7aa;color:#92400e;padding:1px 5px;border-radius:6px;font-size:9px;font-weight:700">${pctR}%</span></span></div>
        <div class="row"><span class="lbl">Total Emprestado</span><span class="val p">${fmtR(r.totalVentas)}</span></div>
        <div class="row"><span class="lbl">&nbsp;&nbsp;↳ Juros Gerados</span><span class="val a">${fmtR(r.totalInt)}</span></div>
        <div class="row"><span class="lbl">Entradas Extras</span><span class="val g">${fmtR(r.ingresos)}</span></div>
        <div class="row"><span class="lbl">Despesas</span><span class="val r">${fmtR(r.egresos)}</span></div>
        <div class="row"><span class="lbl">Retiradas de Caixa</span><span class="val r">${fmtR(r.retiros)}</span></div>
        <div class="row"><span class="lbl"><strong>Caixa Final</strong></span><span class="val g"><strong>${fmtR(r.cajaFinal)}</strong></span></div>
        <div class="row"><span class="lbl"><strong>Lucro</strong></span><span class="val p"><strong>${fmtR(lucro)}</strong></span></div>
      </div>
      <div class="vboxes">
        <div class="vbox" style="background:#f0fdf4;border:1px solid #bbf7d0;">
          <div class="vl" style="color:#4b7c59">Caixa Final</div>
          <div class="vv g">${fmtR(r.cajaFinal)}</div>
        </div>
        <div class="vbox" style="background:#f5f3ff;border:1px solid #ddd6fe;">
          <div class="vl" style="color:#6d28d9">Lucro</div>
          <div class="vv p">${fmtR(lucro)}</div>
        </div>
      </div>
    </div>
  </div>
  <div class="footer">Gerado em ${new Date().toLocaleString("pt-BR")} · Sistema de Cobrança · SystemPay</div>
</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const handleWhatsApp = () => {
    const pctR = r.recaudoPretendido > 0 ? ((r.recaudo / r.recaudoPretendido) * 100).toFixed(1) : "0,0";
    const lines = [
      `*📊 RESUMO DE PERÍODO*`,
      `${cobrador} · ${dIni} → ${dFin} (${diasPeriodo} dias)`,
      ``,
      `*👥 CLIENTES*`,
      `Clientes Cadastrados: ${r.nClientes}`,
      `Clientes Finalizados: ${r.nCierres}`,
      `Clientes Ativos: ${r.clientesAtivos}`,
      `Clientes Inativos: ${r.clientesInativos}`,
      `Clientes Cancelados: ${r.clientesCancelados}`,
      `Empréstimos Realizados: ${r.numVentas}`,
      `Total Clientes: ${r.nClientes}`,
      ``,
      `*🔥 FINANCEIRO*`,
      `Caixa Inicial: ${fmtR(r.cajaInicial)}`,
      `Carteira Inicial: ${fmtR(r.carteira)}`,
      `Receb. Pretendido: ${fmtR(r.recaudoPretendido)}`,
      `Receb. Realizado: ${fmtR(r.recaudo)} (${pctR}%)`,
      `Total Emprestado: ${fmtR(r.totalVentas)}`,
      `  ↳ Juros Gerados: ${fmtR(r.totalInt)}`,
      `Entradas Extras: ${fmtR(r.ingresos)}`,
      `Despesas: ${fmtR(r.egresos)}`,
      `Retiradas de Caixa: ${fmtR(r.retiros)}`,
      `Caixa Final: ${fmtR(r.cajaFinal)}`,
      `Carteira Final: ${fmtR(r.carteira)}`,
      `Lucro: ${fmtR(lucro)}`,
      ``,
      `*🏦 CAIXA FINAL: ${fmtR(r.cajaFinal)}*`,
      `*💜 LUCRO: ${fmtR(lucro)}*`,
      ``,
      `_Gerado em ${new Date().toLocaleString("pt-BR")} · SystemPay_`,
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };

  const ListRow = ({ label, value, valueColor = "#111827", bold = false, isCount = false, border = true }: {
    label: string; value: string | number; valueColor?: string; bold?: boolean; isCount?: boolean; border?: boolean;
  }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: border ? "1px solid #f3f4f6" : "none" }}>
      <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: valueColor }}>
        {isCount ? value : (typeof value === "number" ? fmtR(value) : value)}
      </span>
    </div>
  );

  const Panel = ({ title, icon, children, accent = "#e5e7eb" }: { title: string; icon: string; children: React.ReactNode; accent?: string }) => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ background: "#f8fafc", padding: "10px 16px", display: "flex", alignItems: "center", gap: 7, borderBottom: `2px solid ${accent}` }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{title}</span>
      </div>
      <div style={{ padding: "4px 16px 8px" }}>{children}</div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Export buttons bar ── */}
      <div className="shrink-0 flex items-center justify-end gap-2 px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <button onClick={handlePDF}
          style={{ height: 28, padding: "0 14px", background: "#dc2626", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>
          PDF
        </button>
        <button onClick={handleWhatsApp}
          style={{ height: 28, padding: "0 14px", background: "#25d366", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </button>
      </div>

      {/* ── Dashboard content ── */}
      <div className="flex-1 overflow-auto" style={{ background: "#f1f5f9", padding: "20px 24px" }}>

        {/* ── Top identity bar ── */}
        <div style={{ background: "linear-gradient(135deg, #2d5474 0%, #3d6e8e 100%)", borderRadius: 10, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 2 }}>📊 Resumo de Período</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{cobrador} · Sistema de Cobrança</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>📅 {dIni} → {dFin} <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{diasPeriodo} dias</span></span>
            <span style={{ background: "#16a34a", color: "#fff", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Correto</span>
          </div>
        </div>

        {/* ── Three-column grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* Clientes */}
          <Panel icon="👥" title="Clientes" accent="#16a34a">
            <ListRow label="Clientes Cadastrados"   value={r.nClientes}          isCount bold valueColor="#374151" />
            <ListRow label="Clientes Finalizados"   value={r.nCierres}           isCount valueColor="#dc2626" />
            <ListRow label="Empréstimos Realizados" value={r.numVentas}          isCount valueColor="#7c3aed" />
            <ListRow label="Clientes Ativos"        value={r.clientesAtivos}     isCount valueColor="#16a34a" />
            <ListRow label="Clientes Inativos"      value={r.clientesInativos}   isCount valueColor="#d97706" />
            <ListRow label="Clientes Cancelados"    value={r.clientesCancelados} isCount valueColor="#dc2626" />
            <ListRow label="Total de Clientes"      value={r.nClientes}          isCount bold valueColor="#0891b2" border={false} />
          </Panel>

          {/* Financeiro */}
          <Panel icon="🔥" title="Financeiro" accent="#f97316">
            <ListRow label="Caixa Inicial"          value={r.cajaInicial}         valueColor="#16a34a" bold />
            <ListRow label="Receb. Pretendido"       value={r.recaudoPretendido} />
            <ListRow label="Receb. Realizado"        value={r.recaudo}             valueColor="#f59e0b" bold />
            <ListRow label="Total Emprestado"        value={r.totalVentas} />
            <ListRow label="  ↳ Juros Gerados"       value={r.totalInt}            valueColor="#f59e0b" />
            <ListRow label="Entradas Extras"         value={r.ingresos}            valueColor={r.ingresos > 0 ? "#16a34a" : "#6b7280"} />
            <ListRow label="Despesas"                value={r.egresos}             valueColor={r.egresos > 0 ? "#dc2626" : "#6b7280"} />
            <ListRow label="Retiradas de Caixa"      value={r.retiros}             valueColor={r.retiros > 0 ? "#dc2626" : "#6b7280"} />
            <ListRow label="Caixa Final"             value={r.cajaFinal}           valueColor="#16a34a" bold />
            <ListRow label="Carteira Final"          value={r.carteira}            valueColor="#2563eb" bold />
            <ListRow label="Lucro"                   value={lucro}                 valueColor="#7c3aed" bold border={false} />
          </Panel>

          {/* Valores Finais */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "16px 18px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#4b7c59", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Caixa Final</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{fmtR(r.cajaFinal)}</span>
            </div>
            <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "16px 18px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#6d28d9", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Lucro</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed" }}>{fmtR(lucro)}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8" }}>
          Gerado em {new Date().toLocaleString("pt-BR")} · Sistema de Cobrança
        </div>
      </div>

      {/* ── Blue footer bar ── */}
      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />
    </div>
  );
}

// ── Consolidados ──────────────────────────────────────────────────────────────
const consolidadosData = [
  {
    pais: "MARANHÃO", cidade: "SAO LUIS", fechaCaja: "2026-04-17",
    vendedor: "Rota Cred Bank -", totalClientes: 20,
    cajaInicial: 2979.00, recaudo: 200.00, ventas: 0.00,
    egresos: 0.00, ingresos: 0.00,
    cajaFinal: 3179.00, cartera: 12460.00, acumulado: 0.00, juros: 0.00,
    carteiraInicial: 12660.00, recebimentoPrevisto: 1245.00,
    pagos: 1, noPagos: 0, efetivo: 200.00, transferencia: 0.00,
    retiradaCaixa: 0.00, sancao: 0.00,
    clientesIniciais: 20, clientesNovos: 0, clientesRenovados: 0, clientesCancelados: 0,
  },
];

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#d97706", display: "inline", verticalAlign: "middle", marginRight: 3, flexShrink: 0 }}>
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
    </svg>
  );
}

function ConsolidadosContent() {
  const [cobrador,   setCobrador]   = useState("Rota Cred Bank -");
  const [dataFiltro, setDataFiltro] = useState("2026-04-15");

  const inputCls = "h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700";
  const fmt      = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const fmtR     = (v: number) => `R$ ${fmt(v)}`;

  const r = consolidadosData[0];

  if (!r) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 12, color: "#9ca3af" }}>
      <svg viewBox="0 0 24 24" style={{ width: 48, height: 48, fill: "#cbd5e1" }}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>Sem dados de consolidação</p>
      <p style={{ fontSize: 12 }}>Selecione um cobrador e uma data para carregar o consolidado</p>
    </div>
  );

  const handlePDF = () => {
    const dateFmtLocal = new Date(dataFiltro + "T12:00:00").toLocaleDateString("pt-BR");
    const pct = r.recebimentoPrevisto > 0 ? ((r.recaudo / r.recebimentoPrevisto) * 100).toFixed(1) : "0,0";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Consolidado Diário – ${cobrador} – ${dateFmtLocal}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,sans-serif;background:#f1f5f9;padding:20px;}
  .wrap{max-width:820px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1);}
  /* header */
  .hdr{background:linear-gradient(135deg,#2d5474,#3d6e8e);color:#fff;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;}
  .hdr-left h2{font-size:17px;font-weight:800;margin-bottom:3px;}
  .hdr-left p{font-size:12px;opacity:.8;}
  .hdr-right{display:flex;align-items:center;gap:10px;}
  .hdr-right .date{font-size:13px;opacity:.9;}
  .badge{background:#16a34a;color:#fff;padding:3px 13px;border-radius:20px;font-size:11px;font-weight:700;}
  /* body */
  .body{padding:18px 20px;}
  /* 3-col grid */
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;}
  /* panels */
  .panel{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;}
  .ptitle{font-size:10px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.06em;padding:7px 12px 7px 14px;background:#f1f5f9;border-bottom:2px solid #e5e7eb;}
  .ptitle.green{border-color:#16a34a;} .ptitle.orange{border-color:#f97316;} .ptitle.blue{border-color:#2563eb;}
  .row{display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;}
  .row:last-child{border-bottom:none;}
  .lbl{color:#6b7280;}
  .val{font-weight:600;color:#111;}
  .g{color:#16a34a;} .b{color:#2563eb;} .r{color:#dc2626;} .a{color:#d97706;} .p{color:#7c3aed;}
  /* value boxes */
  .vboxes{display:flex;flex-direction:column;gap:10px;}
  .vbox{border-radius:8px;padding:14px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;}
  .vbox .vl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
  .vbox .vv{font-size:20px;font-weight:800;}
  /* footer */
  .footer{text-align:center;font-size:10px;color:#9ca3af;padding:10px;border-top:1px solid #f0f0f0;}
  @media print{body{padding:0;background:#fff;}.wrap{box-shadow:none;border-radius:0;}}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <div class="hdr-left">
      <h2>📊 Consolidado Diário</h2>
      <p>${cobrador} · ${r.pais} · ${r.cidade}</p>
    </div>
    <div class="hdr-right">
      <span class="date">📅 ${dateFmtLocal}</span>
      <span class="badge">✓ Correto</span>
    </div>
  </div>
  <div class="body">
    <div class="grid3">

      <div class="panel">
        <div class="ptitle green">👥 Clientes</div>
        <div class="row"><span class="lbl">Clientes Iniciais</span><span class="val">${r.clientesIniciais}</span></div>
        <div class="row"><span class="lbl">Clientes Novos</span><span class="val p">${r.clientesNovos}</span></div>
        <div class="row"><span class="lbl">Clientes Renovados</span><span class="val">${r.clientesRenovados}</span></div>
        <div class="row"><span class="lbl">Clientes Pagos</span><span class="val g">${r.pagos}</span></div>
        <div class="row"><span class="lbl">Clientes Não Pagos</span><span class="val r">${r.noPagos}</span></div>
        <div class="row"><span class="lbl"><strong>Total de Clientes</strong></span><span class="val b"><strong>${r.totalClientes}</strong></span></div>
      </div>

      <div class="panel">
        <div class="ptitle orange">🔥 Financeiro</div>
        <div class="row"><span class="lbl">Caixa Inicial</span><span class="val g">${fmtR(r.cajaInicial)}</span></div>
        <div class="row"><span class="lbl">Carteira Inicial</span><span class="val g">${fmtR(r.carteiraInicial)}</span></div>
        <div class="row"><span class="lbl">Receb. Previsto do Dia</span><span class="val">${fmtR(r.recebimentoPrevisto)} <span style="background:#d1fae5;color:#065f46;padding:1px 5px;border-radius:6px;font-size:9px;font-weight:700">100%</span></span></div>
        <div class="row"><span class="lbl">Receb. Atual do Dia</span><span class="val a">${fmtR(r.recaudo)} <span style="background:#fed7aa;color:#92400e;padding:1px 5px;border-radius:6px;font-size:9px;font-weight:700">${pct}%</span></span></div>
        <div class="row"><span class="lbl">Novos Empréstimos</span><span class="val">${fmtR(r.ventas)}</span></div>
        <div class="row"><span class="lbl">&nbsp;&nbsp;↳ Juros</span><span class="val a">${fmtR(r.juros)}</span></div>
        <div class="row"><span class="lbl">Rendimentos</span><span class="val g">${fmtR(r.ingresos)}</span></div>
        <div class="row"><span class="lbl">Despesas</span><span class="val r">${fmtR(r.egresos)}</span></div>
        <div class="row"><span class="lbl">Retirada de Caixa</span><span class="val r">${fmtR(r.retiradaCaixa)}</span></div>
        <div class="row"><span class="lbl"><strong>Caixa Final</strong></span><span class="val g"><strong>${fmtR(r.cajaFinal)}</strong></span></div>
        <div class="row"><span class="lbl"><strong>Carteira Final</strong></span><span class="val b"><strong>${fmtR(r.cartera)}</strong></span></div>
        <div class="row"><span class="lbl"><strong>Lucro</strong></span><span class="val p"><strong>${fmtR(r.juros + r.ingresos - r.egresos - r.retiradaCaixa)}</strong></span></div>
      </div>

      <div class="vboxes">
        <div class="vbox" style="background:#f0fdf4;border:1px solid #bbf7d0;">
          <div class="vl" style="color:#4b7c59">Caixa Final</div>
          <div class="vv g">${fmtR(r.cajaFinal)}</div>
        </div>
        <div class="vbox" style="background:#eff6ff;border:1px solid #bfdbfe;">
          <div class="vl" style="color:#3b5fa0">Carteira Final</div>
          <div class="vv b">${fmtR(r.cartera)}</div>
        </div>
      </div>

    </div>
  </div>
  <div class="footer">Gerado em ${new Date().toLocaleString("pt-BR")} · Sistema de Cobrança · SystemPay</div>
</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const handleWhatsApp = () => {
    const dateFmtWa = new Date(dataFiltro + "T12:00:00").toLocaleDateString("pt-BR");
    const pct = r.recebimentoPrevisto > 0 ? ((r.recaudo / r.recebimentoPrevisto) * 100).toFixed(1) : "0,0";
    const lines = [
      `*📊 CONSOLIDADO DIÁRIO — ${dateFmtWa}*`,
      `${cobrador} · ${r.pais} · ${r.cidade}`,
      ``,
      `*👥 CLIENTES*`,
      `Clientes Iniciais: ${r.clientesIniciais}`,
      `Clientes Novos: ${r.clientesNovos}`,
      `Clientes Renovados: ${r.clientesRenovados}`,
      `Clientes Pagos: ${r.pagos}`,
      `Clientes Não Pagos: ${r.noPagos}`,
      `Total de Clientes: ${r.totalClientes}`,
      ``,
      `*🔥 FINANCEIRO*`,
      `Caixa Inicial: ${fmtR(r.cajaInicial)}`,
      `Carteira Inicial: ${fmtR(r.carteiraInicial)}`,
      `Receb. Previsto do Dia: ${fmtR(r.recebimentoPrevisto)} (100%)`,
      `Receb. Atual do Dia: ${fmtR(r.recaudo)} (${pct}%)`,
      `Novos Empréstimos: ${fmtR(r.ventas)}`,
      `  ↳ Juros: ${fmtR(r.juros)}`,
      `Rendimentos: ${fmtR(r.ingresos)}`,
      `Despesas: ${fmtR(r.egresos)}`,
      `Retirada de Caixa: ${fmtR(r.retiradaCaixa)}`,
      `Caixa Final: ${fmtR(r.cajaFinal)}`,
      `Carteira Final: ${fmtR(r.cartera)}`,
      ``,
      `*🏦 CAIXA FINAL: ${fmtR(r.cajaFinal)}*`,
      `*📋 CARTEIRA FINAL: ${fmtR(r.cartera)}*`,
      ``,
      `_Gerado em ${new Date().toLocaleString("pt-BR")} · SystemPay_`,
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  };

  const dateFmt = new Date(dataFiltro + "T12:00:00").toLocaleDateString("pt-BR");

  const StatCard = ({ icon, label, value, accent, bg }: { icon: string; label: string; value: string; accent: string; bg: string }) => (
    <div style={{ background: "#fff", border: `1px solid ${accent}22`, borderRadius: 10, padding: "14px 18px", flex: "1 1 140px", minWidth: 130, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{value}</div>
    </div>
  );

  const ListRow = ({ label, value, valueColor = "#111827", bold = false, isCount = false, border = true }: {
    label: string; value: string | number; valueColor?: string; bold?: boolean; isCount?: boolean; border?: boolean;
  }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: border ? "1px solid #f3f4f6" : "none" }}>
      <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: valueColor }}>
        {isCount ? value : (typeof value === "number" ? fmtR(value) : value)}
      </span>
    </div>
  );

  const Panel = ({ title, icon, children, accent = "#e5e7eb" }: { title: string; icon: string; children: React.ReactNode; accent?: string }) => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ background: "#f8fafc", padding: "10px 16px", display: "flex", alignItems: "center", gap: 7, borderBottom: `2px solid ${accent}` }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{title}</span>
      </div>
      <div style={{ padding: "4px 16px 8px" }}>{children}</div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Filter bar ── */}
      <div className="shrink-0 flex items-end gap-2 flex-wrap px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Cobrador (Rota)</label>
          <select value={cobrador} onChange={e => setCobrador(e.target.value)} className={`${inputCls} w-48`}>
            <option value="Rota Cred Bank -">Rota Cred Bank -</option>
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Data</label>
          <input type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} className={`${inputCls} w-36`} />
        </div>
        <button className="h-7 px-4 rounded text-xs font-bold text-white"
          style={{ background: "#2563eb", border: "none", cursor: "pointer", alignSelf: "flex-end" }}>
          🔍 Pesquisar
        </button>
        <div className="flex-1" />
        <button onClick={handlePDF}
          style={{ height: 28, padding: "0 14px", background: "#dc2626", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-end" }}>
          <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>
          PDF
        </button>
        <button onClick={handleWhatsApp}
          style={{ height: 28, padding: "0 14px", background: "#25d366", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-end" }}>
          <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </button>
      </div>

      {/* ── Dashboard content ── */}
      <div className="flex-1 overflow-auto" style={{ background: "#f1f5f9", padding: "20px 24px" }}>

        {/* ── Top identity bar ── */}
        <div style={{ background: "linear-gradient(135deg, #2d5474 0%, #3d6e8e 100%)", borderRadius: 10, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 2 }}>📊 Consolidado Diário</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{cobrador} · {r.pais} · {r.cidade}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>📅 {dateFmt}</span>
            <span style={{ background: "#16a34a", color: "#fff", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ Correto</span>
          </div>
        </div>

        {/* ── Three-column grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* Clientes */}
          <Panel icon="👥" title="Clientes" accent="#16a34a">
            <ListRow label="Clientes Iniciais"   value={r.clientesIniciais}   isCount bold valueColor="#374151" />
            <ListRow label="Clientes Novos"      value={r.clientesNovos}      isCount valueColor="#7c3aed" />
            <ListRow label="Clientes Renovados"  value={r.clientesRenovados}  isCount />
            <ListRow label="Clientes Pagos"      value={r.pagos}              isCount bold valueColor="#16a34a" />
            <ListRow label="Clientes Não Pagos"  value={r.noPagos}            isCount bold valueColor="#dc2626" />
            <ListRow label="Total de Clientes"   value={r.totalClientes}      isCount bold valueColor="#0891b2" border={false} />
          </Panel>

          {/* Financeiro */}
          <Panel icon="🔥" title="Financeiro" accent="#f97316">
            <ListRow label="Caixa Inicial"          value={r.cajaInicial}           valueColor="#16a34a" bold />
            <ListRow label="Carteira Inicial"        value={r.carteiraInicial}       valueColor="#16a34a" bold />
            <ListRow label="Receb. Previsto do Dia"  value={r.recebimentoPrevisto} />
            <ListRow label="Receb. Atual do Dia"     value={r.recaudo}               valueColor="#f59e0b" bold />
            <ListRow label="Novos Empréstimos"       value={r.ventas} />
            <ListRow label="  ↳ Juros"               value={r.juros}                 valueColor="#f59e0b" />
            <ListRow label="Rendimentos"             value={r.ingresos}              valueColor={r.ingresos > 0 ? "#16a34a" : "#6b7280"} />
            <ListRow label="Despesas"                value={r.egresos}               valueColor={r.egresos > 0 ? "#dc2626" : "#6b7280"} />
            <ListRow label="Retirada de Caixa"       value={r.retiradaCaixa}         valueColor={r.retiradaCaixa > 0 ? "#dc2626" : "#6b7280"} />
            <ListRow label="Caixa Final"             value={r.cajaFinal}             valueColor="#16a34a" bold />
            <ListRow label="Carteira Final"          value={r.cartera}               valueColor="#2563eb" bold border={false} />
          </Panel>

          {/* Valores Finais */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "16px 18px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#4b7c59", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Caixa Final</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>{fmtR(r.cajaFinal)}</span>
            </div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "16px 18px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#3b5fa0", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6 }}>Carteira Final</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#2563eb" }}>{fmtR(r.cartera)}</span>
            </div>
          </div>

        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8" }}>
          Gerado em {new Date().toLocaleString("pt-BR")} · Sistema de Cobrança
        </div>
      </div>

      {/* ── Blue footer bar ── */}
      <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />
    </div>
  );
}

function LiqPeriodosContent({ activeSub, selectedEstado, estadosData, onCloseDropdown }: { activeSub: string; selectedEstado: string; estadosData: Record<string, { cidade: string; vendedor: string; data: string; ativa: boolean }[]>; onCloseDropdown: () => void }) {
  if (activeSub === "Liquidação")          return <LiqPeriodosLiquidacaoView selectedEstado={selectedEstado} estadosData={estadosData} onCloseDropdown={onCloseDropdown} />;
  if (activeSub === "Pagamentos")          return <LiqPeriodosPagamentosContent />;
  if (activeSub === "Empr. por Períodos")  return <VendasPorPeriodosContent />;
  if (activeSub === "Rendimentos")         return <RendimentosContent />;
  if (activeSub === "Despesas")            return <DespesasContent />;
  if (activeSub === "Clientes")            return <LiqPeriodosClientesContent />;
  if (activeSub === "Resumo")              return <ResumoContent />;
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <p className="text-gray-400 text-sm">{activeSub} — em desenvolvimento</p>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

type GcRow = { id: number; consec: string; nome: string; doc: string; nasc: string; tel1: string; tel2: string; endereco: string; obs: string; freq: string; dataEmprestimo: string; valorEmp: number; jurosPorc: number; total: number; parcelas: number; atrasadas: number; pagas: number; rest: number; sancao: number; visitas: number; valorParc: number; saldo: number };
type GcDoc = { id: string; name: string; url: string; type: string };

function GcNovoClienteModal({ onClose }: { onClose: () => void }) {
  const fieldStyle: React.CSSProperties = {
    width: "100%", height: 38, border: "1px solid #d1d5db", borderRadius: 6,
    padding: "0 10px", fontSize: 13, color: "#111827", background: "#f3f4f6",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4, display: "block" };
  const sectionCard = (icon: string, title: string, children: React.ReactNode) => (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", borderLeft: "4px solid #6366f1" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: 12, color: "#1e293b", letterSpacing: "0.06em" }}>{title}</span>
      </div>
      <div style={{ padding: "16px 14px", background: "#fff" }}>{children}</div>
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 8, width: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: "#2d5474", borderRadius: "8px 8px 0 0", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "0.03em" }}>NOVO CLIENTE</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* DADOS DO CLIENTE */}
          {sectionCard("👤", "DADOS DO CLIENTE", (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
              <div>
                <label style={labelStyle}>CPF <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={fieldStyle} placeholder="" />
              </div>
              <div>
                <label style={labelStyle}>TELEFONE <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={fieldStyle} placeholder="" />
              </div>
              <div>
                <label style={labelStyle}>NOME <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={fieldStyle} placeholder="" />
              </div>
              <div>
                <label style={labelStyle}>SOBRENOME</label>
                <input style={fieldStyle} placeholder="" />
              </div>
            </div>
          ))}

          {/* ENDEREÇO */}
          {sectionCard("📍", "ENDEREÇO", (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.6fr", gap: "12px 12px" }}>
              <div>
                <label style={labelStyle}>CEP <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={fieldStyle} placeholder="" />
              </div>
              <div>
                <label style={labelStyle}>RUA / AVENIDA <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={fieldStyle} placeholder="" />
              </div>
              <div>
                <label style={labelStyle}>Nº <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={fieldStyle} placeholder="" />
              </div>
              <div>
                <label style={labelStyle}>BAIRRO <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={fieldStyle} placeholder="" />
              </div>
              <div>
                <label style={labelStyle}>CIDADE <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={fieldStyle} placeholder="" />
              </div>
              <div>
                <label style={labelStyle}>UF <span style={{ color: "#ef4444" }}>*</span></label>
                <input style={fieldStyle} placeholder="" />
              </div>
            </div>
          ))}

          {/* Botões */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
            <button onClick={onClose}
              style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={onClose}
              style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "8px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Salvar Cliente
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function GcFichaClienteModal({ mr, onClose, viewMode = false, onDocumentos, docs = [], onAddDoc, onRemoveDoc }: { mr: GcRow; onClose: () => void; viewMode?: boolean; onDocumentos?: () => void; docs?: GcDoc[]; onAddDoc?: (doc: GcDoc) => void; onRemoveDoc?: (id: string) => void }) {
  const nameColor = mr.atrasadas === 0 ? "#15803d" : mr.atrasadas >= 5 ? "#b91c1c" : "#b45309";
  const initials = mr.nome.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  const fichaFileRef = useRef<HTMLInputElement>(null);
  const handleFichaFiles = (files: FileList | null) => {
    if (!files || !onAddDoc) return;
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      onAddDoc({ id: `${Date.now()}-${Math.random()}`, name: file.name, url, type: file.type });
    });
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={onClose}>
        <div style={{ background: "#fff", borderRadius: 8, width: 700, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ background: "#2d5474", borderRadius: "8px 8px 0 0", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "0.03em" }}>FICHA DO CLIENTE</span>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>✕</button>
          </div>

          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Avatar + info + inativar */}
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 80, height: 80, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#3d6e8e", border: "3px solid #4a7fa0" }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: nameColor, marginBottom: 4 }}>{mr.nome}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 3, padding: "2px 7px" }}>ACTIVO</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 3, padding: "2px 7px" }}>{mr.consec}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 3, padding: "2px 7px" }}>{mr.freq}</span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Doc: <b style={{ color: "#374151" }}>{mr.doc}</b> &nbsp;|&nbsp; Nasc.: <b style={{ color: "#374151" }}>{mr.nasc}</b></div>
              </div>
              {!viewMode && (
                <button style={{ flexShrink: 0, background: "#b91c1c", color: "#fff", border: "none", borderRadius: 5, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  onClick={() => { alert(`Cliente ${mr.nome} marcado como INACTIVO.`); onClose(); }}>
                  🚫 Inativar Cliente
                </button>
              )}
            </div>

            <div style={{ borderTop: "1px solid #e5e7eb" }} />

            {/* ── DADOS DO CLIENTE card ── */}
            {(() => {
              const fieldBox = (label: string, value: string, req = true) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {label}{req && <span style={{ color: "#ef4444" }}> *</span>}
                  </div>
                  <div style={{ height: 28, border: "1px solid #c7d2e0", borderRadius: 5, padding: "0 9px", fontSize: 12, fontWeight: 600, color: "#111827", background: "#f3f4f6", display: "flex", alignItems: "center" }}>{value}</div>
                </div>
              );
              return (
                <div style={{ border: "1px solid #dde3ec", borderRadius: 7, overflow: "hidden", borderLeft: "4px solid #6366f1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#f4f5f9", borderBottom: "1px solid #dde3ec" }}>
                    <span style={{ fontSize: 13 }}>👤</span>
                    <span style={{ fontWeight: 800, fontSize: 11, color: "#1e293b", letterSpacing: "0.06em" }}>DADOS DO CLIENTE</span>
                  </div>
                  <div style={{ padding: "10px 12px", background: "#fff", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px" }}>
                    {fieldBox("CPF", mr.doc)}
                    {fieldBox("TELEFONE", mr.tel1)}
                    {fieldBox("NOME", mr.nome.split(" ")[0])}
                    {fieldBox("SOBRENOME", mr.nome.split(" ").slice(1).join(" "), false)}
                  </div>
                </div>
              );
            })()}

            {/* ── ENDEREÇO card ── */}
            {(() => {
              const fieldBox = (label: string, value: string, req = true) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {label}{req && <span style={{ color: "#ef4444" }}> *</span>}
                  </div>
                  <div style={{ height: 28, border: "1px solid #c7d2e0", borderRadius: 5, padding: "0 9px", fontSize: 12, fontWeight: 600, color: "#111827", background: "#f3f4f6", display: "flex", alignItems: "center", overflow: "hidden", whiteSpace: "nowrap" }}>{value}</div>
                </div>
              );
              const parts = mr.endereco.split(" – ");
              const cidade = parts[1] ?? "";
              const uf     = parts[2] ?? "";
              const streetChunk = parts[0] ?? mr.endereco;
              const numMatch = streetChunk.match(/nº\s*([^,]+)/);
              const numero   = numMatch ? numMatch[1].trim() : "-";
              const rua      = streetChunk.split(",")[0].trim();
              const segmentos = streetChunk.split(",").map(s => s.trim());
              const bairro   = segmentos[segmentos.length - 1] ?? "";
              return (
                <div style={{ border: "1px solid #dde3ec", borderRadius: 7, overflow: "hidden", borderLeft: "4px solid #6366f1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#f4f5f9", borderBottom: "1px solid #dde3ec" }}>
                    <span style={{ fontSize: 13 }}>📍</span>
                    <span style={{ fontWeight: 800, fontSize: 11, color: "#1e293b", letterSpacing: "0.06em" }}>ENDEREÇO</span>
                  </div>
                  <div style={{ padding: "10px 12px", background: "#fff", display: "grid", gridTemplateColumns: "1fr 2fr 0.6fr", gap: "8px 10px" }}>
                    {fieldBox("CEP", "-")}
                    {fieldBox("RUA / AVENIDA", rua)}
                    {fieldBox("Nº", numero)}
                    {fieldBox("BAIRRO", bairro)}
                    {fieldBox("CIDADE", cidade)}
                    {fieldBox("UF", uf)}
                  </div>
                </div>
              );
            })()}

            {/* ── DOCUMENTOS (viewMode inline) ── */}
            {viewMode && (
              <div style={{ border: "1px solid #dde3ec", borderRadius: 7, overflow: "hidden", borderLeft: "4px solid #0e7490" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "#f0f9ff", borderBottom: "1px solid #dde3ec" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13 }}>📎</span>
                    <span style={{ fontWeight: 800, fontSize: 11, color: "#1e293b", letterSpacing: "0.06em" }}>DOCUMENTOS</span>
                    {docs.length > 0 && <span style={{ background: "#0e7490", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{docs.length}</span>}
                  </div>
                  <button onClick={() => fichaFileRef.current?.click()}
                    style={{ background: "#0e7490", color: "#fff", border: "none", borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: "#fff" }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    Adicionar
                  </button>
                  <input ref={fichaFileRef} type="file" accept="image/*,application/pdf" multiple style={{ display: "none" }}
                    onChange={e => { handleFichaFiles(e.target.files); e.target.value = ""; }} />
                </div>
                <div style={{ padding: "10px 12px", background: "#fff" }}>
                  {docs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "16px 0", color: "#9ca3af" }}
                      onClick={() => fichaFileRef.current?.click()} >
                      <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: "#d1d5db", margin: "0 auto 5px", display: "block" }}><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                      <div style={{ fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>Clique para adicionar fotos ou documentos</div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
                      {docs.map(doc => (
                        <div key={doc.id} style={{ position: "relative", borderRadius: 5, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                          {doc.type.startsWith("image/") ? (
                            <img src={doc.url} alt={doc.name} style={{ width: "100%", height: 80, objectFit: "cover", display: "block", cursor: "pointer" }}
                              onClick={() => window.open(doc.url, "_blank")} />
                          ) : (
                            <div style={{ width: "100%", height: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f3f4f6", cursor: "pointer" }}
                              onClick={() => window.open(doc.url, "_blank")}>
                              <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: "#6b7280" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
                              <span style={{ fontSize: 9, color: "#6b7280", marginTop: 3 }}>PDF</span>
                            </div>
                          )}
                          <div style={{ padding: "3px 5px", fontSize: 9, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</div>
                          <button onClick={() => onRemoveDoc?.(doc.id)}
                            style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 17, height: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg viewBox="0 0 24 24" style={{ width: 9, height: 9, fill: "#fff" }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botões */}
            {viewMode ? (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                <button onClick={onClose} style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Fechar
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                <button onClick={onClose} style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={onClose} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "8px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Salvar
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

// ── Documentos Modal ──────────────────────────────────────────────────────────
function GcDocumentosModal({ mr, docs, onAddDoc, onRemoveDoc, onClose }: {
  mr: GcRow; docs: GcDoc[]; onAddDoc: (doc: GcDoc) => void; onRemoveDoc: (id: string) => void; onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = mr.nome.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      onAddDoc({ id: `${Date.now()}-${Math.random()}`, name: file.name, url, type: file.type });
    });
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 8, width: 680, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: "#0e7490", borderRadius: "8px 8px 0 0", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>{initials}</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>DOCUMENTOS DO CLIENTE</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>{mr.nome}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Upload area */}
          <div style={{ border: "2px dashed #bae6fd", borderRadius: 8, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: "#f0f9ff" }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
            <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, fill: "#0e7490", margin: "0 auto 8px", display: "block" }}><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
            <div style={{ color: "#0e7490", fontWeight: 700, fontSize: 13 }}>Clique para selecionar fotos ou arraste aqui</div>
            <div style={{ color: "#6b7280", fontSize: 11, marginTop: 4 }}>JPG, PNG, PDF aceitos</div>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple style={{ display: "none" }} onChange={e => { handleFiles(e.target.files); e.target.value = ""; }} />
          </div>
          {/* Gallery */}
          {docs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "#9ca3af" }}>
              <svg viewBox="0 0 24 24" style={{ width: 40, height: 40, fill: "#d1d5db", margin: "0 auto 8px", display: "block" }}><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Nenhum documento anexado</div>
              <div style={{ fontSize: 11, marginTop: 3 }}>Use o botão acima para adicionar fotos</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {docs.map(doc => (
                <div key={doc.id} style={{ position: "relative", borderRadius: 6, overflow: "hidden", border: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  {doc.type.startsWith("image/") ? (
                    <img src={doc.url} alt={doc.name} style={{ width: "100%", height: 120, objectFit: "cover", display: "block", cursor: "pointer" }} onClick={() => window.open(doc.url, "_blank")} />
                  ) : (
                    <div style={{ width: "100%", height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#f3f4f6" }} onClick={() => window.open(doc.url, "_blank")}>
                      <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, fill: "#6b7280" }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
                      <span style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>PDF</span>
                    </div>
                  )}
                  <div style={{ padding: "5px 8px", fontSize: 10, color: "#374151", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</div>
                  <button onClick={() => onRemoveDoc(doc.id)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: "#fff" }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
            <button onClick={onClose} style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Configurações Modal ───────────────────────────────────────────────────────
function ConfiguracoesModal({ onClose }: { onClose: () => void }) {
  const [opcoesOpen, setOpcoesOpen] = useState(true);
  const [restricoesOpen, setRestricoes] = useState(false);
  const [configVendOpen, setConfigVendOpen] = useState(false);

  const toggles: { label: string; defaultOn?: boolean }[] = [
    { label: "Ativar GPS" },
    { label: "Ativar Botão Sem Pagamentos", defaultOn: true },
    { label: "Ativar Adiar Parcelas" },
    { label: "Ativar Auditoria Móvel" },
    { label: "Abertura de Caixa Manual" },
    { label: "Validar Endereço" },
    { label: "Carregar Imagens só Wifi", defaultOn: true },
    { label: "Atualizar Móvel na Renovação", defaultOn: true },
    { label: "Somente Frequência Diária" },
    { label: "Permitir Eliminação de Parcelas", defaultOn: true },
    { label: "Validar Documento" },
    { label: "Info Resumida no Móvel" },
    { label: "Imprimir/Compartir Recibo" },
    { label: "Inativar Info do Cliente ao Renovar" },
  ];

  const initState: Record<string, boolean> = {};
  toggles.forEach(t => { initState[t.label] = t.defaultOn ?? false; });
  const [vals, setVals] = useState<Record<string, boolean>>(initState);

  const toggle = (label: string) => setVals(v => ({ ...v, [label]: !v[label] }));

  const [restVals, setRestVals] = useState({
    validarVendas: true,       maxVendas: "500",
    validarGastos: false,      maxGastos: "0",
    validarRendimentos: false,  maxRendimentos: "0",
    validarClientesOutros: false,
    validarParcelasCancelar: false, maxParcelasCancelar: "0",
    validarParcelasDia: false,
    validarRenovacoes: true,   maxRenovacoes: "500",
    renovacaoDiaSeg: false,
  });

  const Toggle = ({ label }: { label: string }) => (
    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
      <div
        onClick={() => toggle(label)}
        style={{
          width: 36, height: 20, borderRadius: 10, position: "relative", cursor: "pointer",
          background: vals[label] ? "#22c55e" : "#d1d5db", transition: "background 0.2s", flexShrink: 0,
        }}>
        <div style={{
          position: "absolute", top: 2, left: vals[label] ? 18 : 2, width: 16, height: 16,
          borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </div>
      {label}
    </label>
  );

  const AccordionHeader = ({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) => (
    <div
      onClick={onToggle}
      className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
      style={{ background: "#f1f5f9", borderBottom: open ? "1px solid #e5e7eb" : "none" }}>
      <span className="text-sm font-semibold text-gray-700">{title}</span>
      <span className="text-lg font-bold text-gray-500 leading-none">{open ? "−" : "+"}</span>
    </div>
  );

  const sw = (on: boolean, toggle: () => void) => (
    <div onClick={toggle} style={{ width: 40, height: 22, borderRadius: 11, position: "relative", cursor: "pointer",
        background: on ? "#2563eb" : "#cbd5e1", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16,
          borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.25)" }} />
    </div>
  );

  const fieldInput = (val: string, onChange: (v: string) => void) => (
    <input type="number" value={val} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", height: 34, border: "1px solid #e2e8f0", borderRadius: 6,
        padding: "0 10px", fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box" }} />
  );

  const label = (text: string) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase",
        letterSpacing: ".04em", marginBottom: 6 }}>{text}</div>
  );

  const sectionTitle = (text: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#2d5474", textTransform: "uppercase",
        letterSpacing: ".08em", padding: "10px 20px 8px",
        borderBottom: "2px solid #e2e8f0", background: "#f1f5f9", display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 3, height: 14, background: "#2563eb", borderRadius: 2 }} />
      {text}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(15,23,42,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 12, width: 960, maxWidth: "96vw",
          maxHeight: "92vh", display: "flex", flexDirection: "column",
          boxShadow: "0 25px 80px rgba(0,0,0,.35)", overflow: "hidden" }}
          onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#2d5474,#3d6e8e)", padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "#fff", opacity: .9 }}>
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: ".02em" }}>Configurações</span>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 6,
              color: "#fff", width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex",
              alignItems: "center", justifyContent: "center", lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>

          {/* Section 1 — Limites de Valores */}
          {sectionTitle("Limites de Valores")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, padding: "16px 20px" }}>
            {/* Validar Valor Máximo de Vendas */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
              {label("Validar Valor Máximo de Vendas")}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {sw(restVals.validarVendas, () => setRestVals(v => ({ ...v, validarVendas: !v.validarVendas })))}
                <span style={{ fontSize: 11, color: restVals.validarVendas ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                  {restVals.validarVendas ? "Ativo" : "Inativo"}
                </span>
              </div>
              {fieldInput(restVals.maxVendas, val => setRestVals(v => ({ ...v, maxVendas: val })))}
            </div>

            {/* Validar Valor Gastos */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
              {label("Validar Valor Gastos")}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {sw(restVals.validarGastos, () => setRestVals(v => ({ ...v, validarGastos: !v.validarGastos })))}
                <span style={{ fontSize: 11, color: restVals.validarGastos ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                  {restVals.validarGastos ? "Ativo" : "Inativo"}
                </span>
              </div>
              {fieldInput(restVals.maxGastos, val => setRestVals(v => ({ ...v, maxGastos: val })))}
            </div>

            {/* Validar Valor Rendimentos */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
              {label("Validar Valor Rendimentos")}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {sw(restVals.validarRendimentos, () => setRestVals(v => ({ ...v, validarRendimentos: !v.validarRendimentos })))}
                <span style={{ fontSize: 11, color: restVals.validarRendimentos ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                  {restVals.validarRendimentos ? "Ativo" : "Inativo"}
                </span>
              </div>
              {fieldInput(restVals.maxRendimentos, val => setRestVals(v => ({ ...v, maxRendimentos: val })))}
            </div>

            {/* Validar Valor Máx. em Renovações */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
              {label("Validar Valor Máx. em Renovações")}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {sw(restVals.validarRenovacoes, () => setRestVals(v => ({ ...v, validarRenovacoes: !v.validarRenovacoes })))}
                <span style={{ fontSize: 11, color: restVals.validarRenovacoes ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                  {restVals.validarRenovacoes ? "Ativo" : "Inativo"}
                </span>
              </div>
              {fieldInput(restVals.maxRenovacoes, val => setRestVals(v => ({ ...v, maxRenovacoes: val })))}
            </div>

          </div>

          {/* Section 2 — Controle de Parcelas */}
          {sectionTitle("Controle de Parcelas")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, padding: "16px 20px" }}>

            {/* Nº Máx. Parcelas Cancelar Venda */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
              {label("Nº Máx. Parcelas — Cancelar Venda")}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {sw(restVals.validarParcelasCancelar, () => setRestVals(v => ({ ...v, validarParcelasCancelar: !v.validarParcelasCancelar })))}
                <span style={{ fontSize: 11, color: restVals.validarParcelasCancelar ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                  {restVals.validarParcelasCancelar ? "Ativo" : "Inativo"}
                </span>
              </div>
              {fieldInput(restVals.maxParcelasCancelar, val => setRestVals(v => ({ ...v, maxParcelasCancelar: val })))}
            </div>

            {/* Nº Máximo Parcelas por Dia */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
              {label("Nº Máximo Parcelas por Dia")}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {sw(restVals.validarParcelasDia, () => setRestVals(v => ({ ...v, validarParcelasDia: !v.validarParcelasDia })))}
                <span style={{ fontSize: 11, color: restVals.validarParcelasDia ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                  {restVals.validarParcelasDia ? "Ativo" : "Inativo"}
                </span>
              </div>
              <select style={{ width: "100%", height: 34, border: "1px solid #e2e8f0", borderRadius: 6,
                  padding: "0 10px", fontSize: 13, color: "#1e293b", background: "#f8fafc" }}>
                <option>Selecione</option>
                {[1,2,3,5,10].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>

            {/* Número Parcelas */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
              {label("Número de Parcelas")}
              <div style={{ height: 30, marginBottom: 10 }} />
              <input type="number" defaultValue={99} style={{ width: "100%", height: 34, border: "1px solid #e2e8f0",
                  borderRadius: 6, padding: "0 10px", fontSize: 13, color: "#1e293b", background: "#f8fafc",
                  outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Nº Celular Solicitações de Aprovações */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px" }}>
              {label("Nº Celular — Solicitações de Aprovações")}
              <div style={{ height: 30, marginBottom: 10 }} />
              <input type="tel" placeholder="Ex: (99) 99999-9999"
                style={{ width: "100%", height: 34, border: "1px solid #e2e8f0", borderRadius: 6,
                  padding: "0 10px", fontSize: 13, color: "#1e293b", background: "#f8fafc",
                  outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 20px",
            borderTop: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "9px 28px", background: "#2563eb", color: "#fff",
              border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37,99,235,.3)" }}>
            Salvar
          </button>
          <button onClick={onClose} style={{ padding: "9px 28px", background: "#fff", color: "#64748b",
              border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}

type AprovacaoStatus = "pendente" | "aceito" | "recusado";
interface AprovacaoItem {
  id: number; clave: string; cliente: string; fecha: string;
  valorPrestado: number; valorPagar: number; parcelas: number;
  vcuota: number; tipo: string; status: AprovacaoStatus;
}

const APROVACOES_INICIAL: AprovacaoItem[] = [
  { id:1,  clave:"rs9", cliente:"Andreia de Jesus Costa Araújo",   fecha:"2026-05-25", valorPrestado:1500, valorPagar:2100, parcelas:20, vcuota:105, tipo:"Renovar Cliente",   status:"pendente" },
  { id:2,  clave:"c51", cliente:"Luciana Abreu Da Silva",           fecha:"2026-05-25", valorPrestado:500,  valorPagar:700,  parcelas:14, vcuota:50,  tipo:"Novo Empréstimo",  status:"pendente" },
  { id:3,  clave:"fhl", cliente:"Mariana Beatriz Rabelo Barbosa",   fecha:"2026-05-25", valorPrestado:1000, valorPagar:1400, parcelas:14, vcuota:100, tipo:"Renovar Cliente",   status:"pendente" },
  { id:4,  clave:"hcz", cliente:"Natanael Dos Santos Mendes",       fecha:"2026-05-25", valorPrestado:500,  valorPagar:700,  parcelas:14, vcuota:50,  tipo:"Novo Empréstimo",  status:"pendente" },
  { id:5,  clave:"6md", cliente:"Rosângela Silvestre Silva",        fecha:"2026-05-25", valorPrestado:400,  valorPagar:560,  parcelas:14, vcuota:40,  tipo:"Cancelar Venda",   status:"pendente" },
  { id:6,  clave:"262", cliente:"António Leite Neto",               fecha:"2026-05-25", valorPrestado:600,  valorPagar:840,  parcelas:14, vcuota:60,  tipo:"Ajuste de Parcela",status:"pendente" },
  { id:7,  clave:"swb", cliente:"João Felipe Pereira",              fecha:"2026-05-25", valorPrestado:300,  valorPagar:420,  parcelas:14, vcuota:30,  tipo:"Renovar Cliente",   status:"pendente" },
  { id:8,  clave:"t11", cliente:"José Francisco Chaves",            fecha:"2026-05-25", valorPrestado:500,  valorPagar:700,  parcelas:14, vcuota:50,  tipo:"Novo Empréstimo",  status:"pendente" },
  { id:9,  clave:"v7g", cliente:"Kledon Viana Gonçalves",           fecha:"2026-06-12", valorPrestado:900,  valorPagar:1170, parcelas:13, vcuota:90,  tipo:"Renovar Cliente",   status:"pendente" },
  { id:10, clave:"n3n", cliente:"Patrick Michael Sá Menezes",       fecha:"2026-06-12", valorPrestado:500,  valorPagar:700,  parcelas:14, vcuota:50,  tipo:"Novo Empréstimo",  status:"pendente" },
  { id:11, clave:"tbl", cliente:"Borei Viana De Souza",             fecha:"2026-06-12", valorPrestado:400,  valorPagar:560,  parcelas:14, vcuota:40,  tipo:"Ajuste de Parcela",status:"pendente" },
  { id:12, clave:"xl3", cliente:"Erick Pereira Santos",             fecha:"2026-06-12", valorPrestado:600,  valorPagar:840,  parcelas:14, vcuota:60,  tipo:"Renovar Cliente",   status:"pendente" },
];

function CodigosAprovacaoModal({ onClose }: { onClose: () => void }) {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const [items, setItems] = useState<AprovacaoItem[]>(APROVACOES_INICIAL);
  const [filtro, setFiltro] = useState<"todos"|"pendente"|"aceito"|"recusado">("todos");

  const mudar = (id: number, status: AprovacaoStatus) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, status } : it));

  const visíveis = filtro === "todos" ? items : items.filter(i => i.status === filtro);
  const pendentes  = items.filter(i => i.status === "pendente").length;
  const aceitos    = items.filter(i => i.status === "aceito").length;
  const recusados  = items.filter(i => i.status === "recusado").length;

  const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits:2 });

  const statusColor: Record<AprovacaoStatus, { bg: string; text: string; label: string }> = {
    pendente: { bg:"#fef9c3", text:"#a16207",  label:"Pendente"  },
    aceito:   { bg:"#dcfce7", text:"#16a34a",  label:"Aceito"    },
    recusado: { bg:"#fee2e2", text:"#dc2626",  label:"Recusado"  },
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999,
        background:"rgba(15,23,42,.5)", display:"flex", alignItems:"center", justifyContent:"center" }}
        onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:12, width:960, maxWidth:"96vw",
          maxHeight:"92vh", display:"flex", flexDirection:"column",
          boxShadow:"0 25px 80px rgba(0,0,0,.35)", overflow:"hidden" }}
          onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#2d5474,#3d6e8e)", padding:"14px 20px",
            display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <svg viewBox="0 0 24 24" style={{ width:18, height:18, fill:"#fff", opacity:.9 }}>
              <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
            <span style={{ color:"#fff", fontWeight:700, fontSize:15, letterSpacing:".02em" }}>Códigos de Aprovação</span>
            <span style={{ color:"rgba(255,255,255,.55)", fontSize:11 }}>{hoje}</span>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6,
              color:"#fff", width:28, height:28, cursor:"pointer", fontSize:16, display:"flex",
              alignItems:"center", justifyContent:"center", lineHeight:1 }}>✕</button>
        </div>

        {/* Filtro strip */}
        <div style={{ display:"flex", gap:10, padding:"10px 20px",
            borderBottom:"1px solid #e2e8f0", background:"#f1f5f9", flexShrink:0 }}>
          {([
            { key:"todos",    label:"Todos",     value:items.length, bg:"#1e3a5f", bgOff:"#e2e8f0", textOff:"#475569" },
            { key:"pendente", label:"Pendentes", value:pendentes,    bg:"#d97706", bgOff:"#fef3c7", textOff:"#92400e" },
            { key:"aceito",   label:"Aceitos",   value:aceitos,      bg:"#16a34a", bgOff:"#dcfce7", textOff:"#166534" },
            { key:"recusado", label:"Recusados", value:recusados,    bg:"#dc2626", bgOff:"#fee2e2", textOff:"#991b1b" },
          ] as { key:"todos"|"pendente"|"aceito"|"recusado"; label:string; value:number; bg:string; bgOff:string; textOff:string }[]).map(s => {
            const ativo = filtro === s.key;
            return (
              <button key={s.key} onClick={() => setFiltro(s.key)}
                style={{ flex:1, padding:"8px 10px", border:"none", cursor:"pointer", borderRadius:8,
                  background: ativo ? s.bg : s.bgOff,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow: ativo ? `0 2px 8px ${s.bg}55` : "none",
                  transition:"all .15s" }}>
                <span style={{ fontSize:12, fontWeight:700, color: ativo ? "#fff" : s.textOff }}>{s.label}</span>
                <span style={{ background: ativo ? "rgba(255,255,255,.25)" : "rgba(0,0,0,.1)",
                    color: ativo ? "#fff" : s.textOff,
                    borderRadius:20, padding:"1px 8px", fontSize:12, fontWeight:800, minWidth:22, textAlign:"center" }}>
                  {s.value}
                </span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ overflowY:"auto", flex:1 }}>

          {/* section title */}
          <div style={{ fontSize:11, fontWeight:700, color:"#2d5474", textTransform:"uppercase",
              letterSpacing:".08em", padding:"10px 20px 8px",
              borderBottom:"2px solid #e2e8f0", background:"#f1f5f9", display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:3, height:14, background:"#2563eb", borderRadius:2 }} />
            Solicitações de Empréstimo
          </div>

          {visíveis.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px", color:"#94a3b8", fontSize:13 }}>
              Nenhuma solicitação neste filtro.
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
                gap:16, padding:"16px 20px" }}>
              {visíveis.map(it => {
                const sc = statusColor[it.status];
                return (
                  <div key={it.id} style={{ background:"#f8fafc", border:"1px solid #e2e8f0",
                      borderRadius:8, padding:"12px 14px", display:"flex", flexDirection:"column", gap:10 }}>

                    {/* topo do card */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ background:sc.bg, color:sc.text, borderRadius:5,
                            padding:"2px 7px", fontSize:10, fontWeight:700 }}>{sc.label}</span>
                      </div>
                      <span style={{ fontSize:10, color:"#94a3b8" }}>{it.fecha}</span>
                    </div>

                    {/* cliente */}
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ background:"#e0f2fe", borderRadius:"50%", width:30, height:30,
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:"#0369a1" }}>
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#1e293b", lineHeight:1.2 }}>{it.cliente}</div>
                        <div style={{ fontSize:10, color:"#64748b" }}>{it.tipo}</div>
                      </div>
                    </div>

                    {/* valores */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {[
                        { label:"Valor Empréstimo", value:`R$ ${fmtBRL(it.valorPrestado)}`, color:"#2d5474" },
                        { label:"Total a Pagar",    value:`R$ ${fmtBRL(it.valorPagar)}`,    color:"#1d4ed8" },
                        { label:"Juros", value:`${Math.round((it.valorPagar - it.valorPrestado) / it.valorPrestado * 100)}% · R$ ${fmtBRL(it.valorPagar - it.valorPrestado)}`, color:"#d97706" },
                        { label:"Nº Parcelas",      value:String(it.parcelas),              color:"#475569" },
                        { label:"Valor Parcela",    value:`R$ ${fmtBRL(it.vcuota)}`,        color:"#16a34a" },
                      ].map(f => (
                        <div key={f.label} style={{ background:"#fff", borderRadius:6,
                            padding:"6px 8px", border:"1px solid #e2e8f0" }}>
                          <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600,
                              textTransform:"uppercase", letterSpacing:.4 }}>{f.label}</div>
                          <div style={{ fontSize:13, fontWeight:800, color:f.color, marginTop:1 }}>{f.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* botões */}
                    {it.status === "pendente" ? (
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        <button onClick={() => mudar(it.id, "recusado")}
                          style={{ padding:"8px 0", background:"#fee2e2", color:"#dc2626",
                            border:"1px solid #fca5a5", borderRadius:6, fontSize:12, fontWeight:700,
                            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                          <svg viewBox="0 0 24 24" style={{ width:13, height:13, fill:"#dc2626" }}>
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                          Recusar
                        </button>
                        <button onClick={() => mudar(it.id, "aceito")}
                          style={{ padding:"8px 0", background:"#dcfce7", color:"#16a34a",
                            border:"1px solid #86efac", borderRadius:6, fontSize:12, fontWeight:700,
                            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                          <svg viewBox="0 0 24 24" style={{ width:13, height:13, fill:"#16a34a" }}>
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                          Aceitar
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign:"center" }}>
                        <button onClick={() => mudar(it.id, "pendente")}
                          style={{ padding:"6px 16px", background:"#fff", color:"#64748b",
                            border:"1px solid #cbd5e1", borderRadius:6, fontSize:11, fontWeight:600,
                            cursor:"pointer" }}>
                          ↩ Desfazer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", padding:"10px 20px",
            borderTop:"1px solid #e2e8f0", background:"#f8fafc", flexShrink:0, gap:10 }}>
          <div style={{ flex:1 }} />
          <button onClick={onClose}
            style={{ padding:"8px 28px", background:"#fff", color:"#374151",
              border:"1px solid #cbd5e1", borderRadius:6, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

const LUCRO_MOCK = [
  { cliente:"Ana Paula Marques De Oliveira", estado:"Cancelado-2026-05-25", valorVenda:700,   totalPago:700,  saldo:0,   lucroDiario:200, totalLucro:200 },
  { cliente:"Anny Briane Pires Belfort",     estado:"Ativo",                valorVenda:1120,  totalPago:910,  saldo:210, lucroDiario:0,   totalLucro:110 },
  { cliente:"Kledon Viana Gonçalves",        estado:"Ativo",                valorVenda:900,   totalPago:450,  saldo:450, lucroDiario:90,  totalLucro:90  },
  { cliente:"Luciana Abreu Da Silva",        estado:"Ativo",                valorVenda:500,   totalPago:200,  saldo:300, lucroDiario:50,  totalLucro:50  },
  { cliente:"Mariana Beatriz Rabelo Barbosa",estado:"Ativo",                valorVenda:1000,  totalPago:600,  saldo:400, lucroDiario:100, totalLucro:100 },
];

function LucroModal({ onClose }: { onClose: () => void }) {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits:2 });

  const totVenda   = LUCRO_MOCK.reduce((s, r) => s + r.valorVenda,   0);
  const totPago    = LUCRO_MOCK.reduce((s, r) => s + r.totalPago,    0);
  const totSaldo   = LUCRO_MOCK.reduce((s, r) => s + r.saldo,        0);
  const totDiario  = LUCRO_MOCK.reduce((s, r) => s + r.lucroDiario,  0);
  const totLucro   = LUCRO_MOCK.reduce((s, r) => s + r.totalLucro,   0);

  const thS: React.CSSProperties = {
    padding:"9px 12px", fontSize:10, fontWeight:700, color:"#fff",
    background:"#2d5474", whiteSpace:"nowrap", borderRight:"1px solid #3d6e8e",
    position:"sticky", top:0, zIndex:2, textAlign:"left",
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999,
        background:"rgba(15,23,42,.5)", display:"flex", alignItems:"center", justifyContent:"center" }}
        onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:12, width:960, maxWidth:"96vw",
          maxHeight:"92vh", display:"flex", flexDirection:"column",
          boxShadow:"0 25px 80px rgba(0,0,0,.35)", overflow:"hidden" }}
          onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#2d5474,#3d6e8e)", padding:"14px 20px",
            display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <svg viewBox="0 0 24 24" style={{ width:18, height:18, fill:"#fff", opacity:.9 }}>
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
            </svg>
            <span style={{ color:"#fff", fontWeight:700, fontSize:15, letterSpacing:".02em" }}>Lucro diário de Vendas</span>
            <span style={{ color:"rgba(255,255,255,.55)", fontSize:11 }}>{hoje}</span>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6,
              color:"#fff", width:28, height:28, cursor:"pointer", fontSize:16, display:"flex",
              alignItems:"center", justifyContent:"center", lineHeight:1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY:"auto", flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#2d5474", textTransform:"uppercase",
              letterSpacing:".08em", padding:"10px 20px 8px",
              borderBottom:"2px solid #e2e8f0", background:"#f1f5f9", display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:3, height:14, background:"#2563eb", borderRadius:2 }} />
            Vendas do Dia
          </div>

          <div style={{ overflow:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", minWidth:700 }}>
              <thead>
                <tr>
                  <th style={{ ...thS, width:260 }}>CLIENTE</th>
                  <th style={{ ...thS, width:200 }}>ESTADO</th>
                  <th style={{ ...thS, width:110, textAlign:"right" }}>VALOR VENDA</th>
                  <th style={{ ...thS, width:110, textAlign:"right" }}>TOTAL PAGO</th>
                  <th style={{ ...thS, width:90,  textAlign:"right" }}>SALDO</th>
                  <th style={{ ...thS, width:110, textAlign:"right" }}>LUCRO DIÁRIO</th>
                  <th style={{ ...thS, width:110, textAlign:"right", borderRight:"none" }}>TOTAL LUCRO</th>
                </tr>
              </thead>
              <tbody>
                {LUCRO_MOCK.map((r, i) => {
                  const alt = i % 2 === 1;
                  const bg = alt ? "#f8fafc" : "#fff";
                  const tdBase: React.CSSProperties = {
                    padding:"8px 12px", fontSize:12, borderBottom:"1px solid #e8edf2",
                    borderRight:"1px solid #edf0f4", background:bg, whiteSpace:"nowrap",
                  };
                  const isAtivo = r.estado === "Ativo";
                  return (
                    <tr key={i}
                      onMouseEnter={e => (e.currentTarget.style.background="#dbeafe")}
                      onMouseLeave={e => (e.currentTarget.style.background="")}>
                      <td style={{ ...tdBase, fontWeight:600, color:"#1e293b" }}>{r.cliente}</td>
                      <td style={{ ...tdBase }}>
                        <span style={{ background: isAtivo ? "#dcfce7" : "#fee2e2",
                            color: isAtivo ? "#16a34a" : "#dc2626",
                            borderRadius:5, padding:"2px 8px", fontSize:10, fontWeight:700 }}>
                          {r.estado}
                        </span>
                      </td>
                      <td style={{ ...tdBase, textAlign:"right", color:"#1e3a5f", fontWeight:600 }}>{fmtBRL(r.valorVenda)}</td>
                      <td style={{ ...tdBase, textAlign:"right", color:"#1e3a5f", fontWeight:600 }}>{fmtBRL(r.totalPago)}</td>
                      <td style={{ ...tdBase, textAlign:"right", color: r.saldo > 0 ? "#d97706" : "#64748b" }}>{fmtBRL(r.saldo)}</td>
                      <td style={{ ...tdBase, textAlign:"right", color:"#16a34a", fontWeight:700 }}>{fmtBRL(r.lucroDiario)}</td>
                      <td style={{ ...tdBase, textAlign:"right", color:"#16a34a", fontWeight:700, borderRight:"none" }}>{fmtBRL(r.totalLucro)}</td>
                    </tr>
                  );
                })}
                {/* Totais */}
                <tr style={{ background:"#f1f5f9" }}>
                  <td colSpan={2} style={{ padding:"8px 12px", fontSize:12, fontWeight:700,
                      color:"#2d5474", borderTop:"2px solid #e2e8f0", borderRight:"1px solid #e2e8f0",
                      textAlign:"right", textTransform:"uppercase", letterSpacing:".04em" }}>
                    Total Lucro
                  </td>
                  <td style={{ padding:"8px 12px", fontSize:12, fontWeight:800, color:"#1e3a5f",
                      borderTop:"2px solid #e2e8f0", borderRight:"1px solid #e2e8f0", textAlign:"right" }}>{fmtBRL(totVenda)}</td>
                  <td style={{ padding:"8px 12px", fontSize:12, fontWeight:800, color:"#1e3a5f",
                      borderTop:"2px solid #e2e8f0", borderRight:"1px solid #e2e8f0", textAlign:"right" }}>{fmtBRL(totPago)}</td>
                  <td style={{ padding:"8px 12px", fontSize:12, fontWeight:800, color:"#d97706",
                      borderTop:"2px solid #e2e8f0", borderRight:"1px solid #e2e8f0", textAlign:"right" }}>{fmtBRL(totSaldo)}</td>
                  <td style={{ padding:"8px 12px", fontSize:13, fontWeight:800, color:"#16a34a",
                      borderTop:"2px solid #e2e8f0", borderRight:"1px solid #e2e8f0", textAlign:"right" }}>{fmtBRL(totDiario)}</td>
                  <td style={{ padding:"8px 12px", fontSize:13, fontWeight:800, color:"#16a34a",
                      borderTop:"2px solid #e2e8f0", textAlign:"right" }}>{fmtBRL(totLucro)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", padding:"10px 20px",
            borderTop:"1px solid #e2e8f0", background:"#f8fafc", flexShrink:0 }}>
          <button onClick={onClose}
            style={{ padding:"8px 28px", background:"#fff", color:"#374151",
              border:"1px solid #cbd5e1", borderRadius:6, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function CaixaModal({ aberto, onConfirm, onClose }: { aberto: boolean; onConfirm: () => void; onClose: () => void }) {
  const acao = aberto ? "Fechar" : "Abrir";
  const cor  = aberto ? "#dc2626" : "#16a34a";
  const icon = aberto ? "🔒" : "🔓";
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.6)", zIndex:1100,
        display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(2px)" }}>
      <div style={{ background:"#fff", borderRadius:14, boxShadow:"0 24px 60px rgba(0,0,0,.3)",
          width:380, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ background: aberto
            ? "linear-gradient(135deg,#fee2e2,#fecaca)"
            : "linear-gradient(135deg,#dcfce7,#bbf7d0)",
            padding:"18px 20px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ background:"rgba(255,255,255,.2)", borderRadius:10, width:40, height:40,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{icon}</div>
          <div>
            <div style={{ color: aberto ? "#991b1b" : "#166534", fontSize:15, fontWeight:800 }}>{acao} Caixa</div>
            <div style={{ color: aberto ? "#b91c1c" : "#15803d", fontSize:11, marginTop:2, opacity:.8 }}>
              {aberto ? "Encerrar o caixa da unidade" : "Reabrir o caixa da unidade"}
            </div>
          </div>
        </div>
        {/* Body */}
        <div style={{ padding:"22px 24px 8px" }}>
          <div style={{ background: aberto ? "#fef2f2" : "#f0fdf4", borderRadius:10,
              border:`1px solid ${aberto ? "#fca5a5" : "#86efac"}`,
              padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:10 }}>
            <span style={{ fontSize:18, marginTop:1 }}>{aberto ? "⚠️" : "ℹ️"}</span>
            <div style={{ fontSize:12, color: aberto ? "#991b1b" : "#166534", lineHeight:1.6 }}>
              {aberto
                ? "Deseja realmente fechar o caixa? Nenhuma nova operação poderá ser registrada até que ele seja aberto novamente."
                : "Deseja reabrir o caixa? Novas operações voltarão a ser permitidas na unidade."}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:16, marginBottom:20, justifyContent:"flex-end" }}>
            <button onClick={onClose}
              style={{ padding:"8px 22px", background:"#f1f5f9", color:"#475569",
                border:"1px solid #cbd5e1", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>
              Cancelar
            </button>
            <button onClick={onConfirm}
              style={{ padding:"8px 22px",
                background: aberto ? "#fee2e2" : "#dcfce7",
                color: aberto ? "#991b1b" : "#166534",
                border: `1px solid ${aberto ? "#fca5a5" : "#86efac"}`,
                borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
              {icon} {acao} Caixa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CLIENTES_MOCK = [
  { fecha:"2026-04-08", nro:"4700627026", nome:"Andreia de Jesus Costa Araújo",   tel:"89985014328",   dir:"Rua gama lobon nº 10 quarto", prest:"1.500", apagar:"2.100", inter:"600", pct:"40", vcuota:"105,00", cuotas:"20", cpagas:"0", cresta:"7,6",  saldo:"800,00",  san:"0,00", vis:"5",  frec:"Diário", ult:"2026-04-17" },
  { fecha:"2026-03-28", nro:"4700627080", nome:"Luciana Abreu Da Silva",           tel:"55988834576",   dir:"—",                          prest:"500",   apagar:"700",   inter:"200", pct:"40", vcuota:"50,00",  cuotas:"14", cpagas:"0", cresta:"14,0", saldo:"700,00",  san:"0,00", vis:"14", frec:"Diário", ult:"—" },
  { fecha:"2026-03-28", nro:"4700627078", nome:"Mariana Beatriz Rabelo Barbosa",   tel:"98985721207",   dir:"—",                          prest:"1.000", apagar:"1.400", inter:"400", pct:"40", vcuota:"100,00", cuotas:"14", cpagas:"0", cresta:"14,0", saldo:"1.490,00",san:"0,00", vis:"4",  frec:"Diário", ult:"—" },
  { fecha:"2026-03-28", nro:"4700627077", nome:"Natanael Dos Santos Mendes",       tel:"5511971269742", dir:"—",                          prest:"500",   apagar:"700",   inter:"200", pct:"40", vcuota:"50,00",  cuotas:"14", cpagas:"0", cresta:"13,0", saldo:"650,00",  san:"0,00", vis:"14", frec:"Diário", ult:"2026-03-30" },
  { fecha:"2026-03-14", nro:"4700627069", nome:"Rosângela Silvestre Silva",        tel:"98985097895",   dir:"Rua Irene de Souza Res. João Alberto SN", prest:"400", apagar:"560", inter:"160", pct:"40", vcuota:"40,00", cuotas:"14", cpagas:"0", cresta:"14,0", saldo:"560,00", san:"0,00", vis:"0",  frec:"Diário", ult:"—" },
  { fecha:"2026-03-14", nro:"4700627027", nome:"António Leite Neto",               tel:"55989884643699", dir:"—",                         prest:"600",   apagar:"840",   inter:"240", pct:"40", vcuota:"60,00",  cuotas:"14", cpagas:"0", cresta:"12,5", saldo:"750,00",  san:"0,00", vis:"21", frec:"Diário", ult:"2026-03-25" },
  { fecha:"2026-03-23", nro:"4700627041", nome:"João Felipe Pereira",              tel:"559881991414",  dir:"—",                          prest:"300",   apagar:"420",   inter:"120", pct:"40", vcuota:"30,00",  cuotas:"14", cpagas:"0", cresta:"4,0",  saldo:"810,00",  san:"0,00", vis:"19", frec:"Diário", ult:"2026-04-08" },
  { fecha:"2026-03-25", nro:"4700627057", nome:"José Francisco Chaves",            tel:"559881187058",  dir:"—",                          prest:"500",   apagar:"700",   inter:"200", pct:"40", vcuota:"50,00",  cuotas:"14", cpagas:"0", cresta:"13,0", saldo:"650,00",  san:"0,00", vis:"16", frec:"Diário", ult:"2026-03-26" },
  { fecha:"2026-03-22", nro:"4700627022", nome:"Kledon Viana Gonçalves",           tel:"559885822906",  dir:"—",                          prest:"900",   apagar:"1.170", inter:"270", pct:"30", vcuota:"90,00",  cuotas:"13", cpagas:"0", cresta:"4,7",  saldo:"650,00",  san:"0,00", vis:"23", frec:"Diário", ult:"—" },
  { fecha:"2026-03-25", nro:"4700627092", nome:"Patrick Michael Sá Menezes",       tel:"5598841932430", dir:"—",                          prest:"500",   apagar:"700",   inter:"200", pct:"40", vcuota:"50,00",  cuotas:"14", cpagas:"0", cresta:"12,0", saldo:"600,00",  san:"0,00", vis:"16", frec:"Diário", ult:"2026-04-16" },
  { fecha:"2026-04-15", nro:"4700627145", nome:"Borei Viana De Souza",             tel:"98991245677",   dir:"—",                          prest:"400",   apagar:"560",   inter:"160", pct:"40", vcuota:"40,00",  cuotas:"14", cpagas:"0", cresta:"12,0", saldo:"480,00",  san:"0,00", vis:"5",  frec:"Diário", ult:"2026-04-16" },
  { fecha:"2026-04-15", nro:"4700627164", nome:"Erick Pereira Santos",             tel:"5598920038634", dir:"—",                          prest:"600",   apagar:"840",   inter:"240", pct:"40", vcuota:"60,00",  cuotas:"14", cpagas:"0", cresta:"13,0", saldo:"780,00",  san:"0,00", vis:"9",  frec:"Diário", ult:"—" },
  { fecha:"2026-03-13", nro:"4700627024", nome:"Anny Briane Pires Belfort",        tel:"5598831561 78", dir:"—",                          prest:"800",   apagar:"1.120", inter:"320", pct:"40", vcuota:"80,00",  cuotas:"14", cpagas:"0", cresta:"2,6",  saldo:"210,00",  san:"0,00", vis:"23", frec:"Diário", ult:"2026-04-15" },
  { fecha:"2026-03-23", nro:"4700627058", nome:"Aline Lima De Alencar",            tel:"98962381007",   dir:"—",                          prest:"800",   apagar:"1.120", inter:"320", pct:"40", vcuota:"80,00",  cuotas:"14", cpagas:"0", cresta:"13,0", saldo:"1.040,00",san:"0,00", vis:"4",  frec:"Diário", ult:"—" },
  { fecha:"2026-04-02", nro:"4700627023", nome:"Elaita Kisley Conceição Lopes",    tel:"5598981481049", dir:"—",                          prest:"600",   apagar:"840",   inter:"240", pct:"40", vcuota:"60,00",  cuotas:"14", cpagas:"0", cresta:"9,0",  saldo:"540,00",  san:"0,00", vis:"10", frec:"Diário", ult:"2026-04-08" },
  { fecha:"2026-03-25", nro:"4700627049", nome:"Ana Flávia Pereira Moraes",        tel:"98991571405",   dir:"—",                          prest:"500",   apagar:"700",   inter:"200", pct:"40", vcuota:"50,00",  cuotas:"14", cpagas:"0", cresta:"14,0", saldo:"700,00",  san:"0,00", vis:"5",  frec:"Diário", ult:"2026-04-08" },
  { fecha:"2026-03-30", nro:"4700627089", nome:"Gelison Eduardo Rosa de Jesus",    tel:"9885397102",    dir:"—",                          prest:"700",   apagar:"980",   inter:"280", pct:"40", vcuota:"70,00",  cuotas:"14", cpagas:"0", cresta:"9,0",  saldo:"630,00",  san:"0,00", vis:"13", frec:"Diário", ult:"2026-05-25" },
  { fecha:"2026-04-16", nro:"4700627040", nome:"Daniele Teixeira Lindoso",         tel:"5598996897036", dir:"—",                          prest:"1.000", apagar:"1.400", inter:"400", pct:"40", vcuota:"100,00", cuotas:"14", cpagas:"0", cresta:"9,0",  saldo:"900,00",  san:"0,00", vis:"13", frec:"Diário", ult:"—" },
  { fecha:"2026-04-16", nro:"4700627025", nome:"Bianca de Araújo Alves",           tel:"98983330893",   dir:"—",                          prest:"300",   apagar:"420",   inter:"120", pct:"40", vcuota:"30,00",  cuotas:"14", cpagas:"0", cresta:"14,0", saldo:"420,00",  san:"0,00", vis:"3",  frec:"Diário", ult:"2026-04-08" },
  { fecha:"2026-03-28", nro:"4700627079", nome:"Ana Paula Marques De Oliveira",    tel:"98986248424",   dir:"—",                          prest:"500",   apagar:"700",   inter:"200", pct:"40", vcuota:"50,00",  cuotas:"14", cpagas:"0", cresta:"14,0", saldo:"700,00",  san:"0,00", vis:"14", frec:"DIÁRIO",  ult:"2026-05-25" },
];

function ListaClientesModal({ onClose }: { onClose: () => void }) {
  const [busca, setBusca] = useState("");
  const hoje = new Date().toLocaleDateString("pt-BR");

  const filtrados = CLIENTES_MOCK.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.nro.includes(busca) ||
    c.tel.includes(busca)
  );

  const somarNum = (key: keyof typeof CLIENTES_MOCK[0]) =>
    CLIENTES_MOCK.reduce((s, c) => s + parseFloat(String(c[key]).replace(".","").replace(",",".")||"0"), 0);

  const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(10);
    doc.setTextColor(45, 84, 116);
    doc.text(`Lista de Clientes — ${hoje}   Rota: SystemPay`, 10, 12);
    autoTable(doc, {
      startY: 18,
      head: [["#","FECHA","NRO CRÉDITO","NOME DO CLIENTE","TELEFONE","VL PRESTADO","VL A PAGAR","VL INTERESE","%","V.CUOTA","CUOTAS","C.PAGAS","C.RESTA","SALDO","VISITAS","FREC.","ÚLT.PAGO"]],
      body: filtrados.map((c,i) => [i+1,c.fecha,c.nro,c.nome,c.tel,c.prest,c.apagar,c.inter,c.pct,c.vcuota,c.cuotas,c.cpagas,c.cresta,c.saldo,c.vis,c.frec,c.ult]),
      styles: { fontSize: 6.5, cellPadding: 2 },
      headStyles: { fillColor: [45,84,116], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240,245,255] },
      margin: { left: 5, right: 5 },
    });
    doc.save(`lista-clientes-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleCSV = () => {
    const cols = ["#","FECHA","NRO CRÉDITO","NOME DO CLIENTE","TELEFONE","VL PRESTADO","VL A PAGAR","VL INTERESE","%","V.CUOTA","CUOTAS","C.PAGAS","C.RESTA","SALDO","VISITAS","FREC.","ÚLT.PAGO"];
    const rows = filtrados.map((c,i) => [i+1,c.fecha,c.nro,c.nome,c.tel,c.prest,c.apagar,c.inter,c.pct,c.vcuota,c.cuotas,c.cpagas,c.cresta,c.saldo,c.vis,c.frec,c.ult]);
    const csv = [cols,...rows].map(r => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `lista-clientes-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const COL: { key: keyof typeof CLIENTES_MOCK[0]; label: string; w: number; right?: boolean }[] = [
    { key:"fecha",  label:"FECHA",          w:95 },
    { key:"nro",    label:"NRO CRÉDITO",    w:110 },
    { key:"nome",   label:"NOME DO CLIENTE",w:210 },
    { key:"tel",    label:"TELEFONE",       w:120 },
    { key:"prest",  label:"VL PRESTADO",    w:95,  right:true },
    { key:"apagar", label:"VL A PAGAR",     w:90,  right:true },
    { key:"inter",  label:"VL INTERESE",    w:90,  right:true },
    { key:"pct",    label:"%",              w:44 },
    { key:"vcuota", label:"V.CUOTA",        w:78,  right:true },
    { key:"cuotas", label:"CUOTAS",         w:62 },
    { key:"cpagas", label:"C.PAGAS",        w:66 },
    { key:"cresta", label:"C.RESTA",        w:66 },
    { key:"saldo",  label:"SALDO",          w:84,  right:true },
    { key:"vis",    label:"VISITAS",        w:64 },
    { key:"frec",   label:"FREC.",          w:68 },
    { key:"ult",    label:"ÚLT.PAGO",       w:98 },
  ];

  const summaryCards = [
    { label:"Total Clientes",   value: String(CLIENTES_MOCK.length),          color:"#2d5474", icon:"👥" },
    { label:"Total Prestado",   value:`R$ ${fmtBRL(somarNum("prest"))}`,      color:"#16a34a", icon:"💰" },
    { label:"Total a Pagar",    value:`R$ ${fmtBRL(somarNum("apagar"))}`,     color:"#2563eb", icon:"📋" },
    { label:"Total Interese",   value:`R$ ${fmtBRL(somarNum("inter"))}`,      color:"#d97706", icon:"📈" },
    { label:"Saldo Restante",   value:`R$ ${fmtBRL(somarNum("saldo"))}`,      color:"#7c3aed", icon:"💳" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999,
        background:"rgba(15,23,42,.5)", display:"flex", alignItems:"center", justifyContent:"center" }}
        onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:12, width:"96vw", maxWidth:1560,
          maxHeight:"92vh", display:"flex", flexDirection:"column",
          boxShadow:"0 25px 80px rgba(0,0,0,.35)", overflow:"hidden" }}
          onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#2d5474,#3d6e8e)", padding:"14px 20px",
            display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <svg viewBox="0 0 24 24" style={{ width:18, height:18, fill:"#fff", opacity:.9 }}>
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span style={{ color:"#fff", fontWeight:700, fontSize:15, letterSpacing:".02em" }}>Lista de Clientes</span>
            <span style={{ color:"rgba(255,255,255,.55)", fontSize:11 }}>{hoje}</span>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6,
              color:"#fff", width:28, height:28, cursor:"pointer", fontSize:16, display:"flex",
              alignItems:"center", justifyContent:"center", lineHeight:1 }}>✕</button>
        </div>

        {/* Toolbar */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 20px",
            borderBottom:"2px solid #e2e8f0", flexShrink:0, background:"#f1f5f9" }}>
          <div style={{ width:3, height:14, background:"#2563eb", borderRadius:2, flexShrink:0 }} />
          <span style={{ fontSize:11, fontWeight:700, color:"#2d5474", textTransform:"uppercase",
              letterSpacing:".08em" }}>Clientes</span>
          <div style={{ position:"relative", width:280, marginLeft:6 }}>
            <svg viewBox="0 0 24 24" style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)",
                width:13, height:13, fill:"#94a3b8", pointerEvents:"none" }}>
              <path d="M21 19l-4.35-4.35A7 7 0 1 0 5 5a7 7 0 0 0 9.65 9.65L19 19l2 2zM7 12A5 5 0 1 1 12 7 5 5 0 0 1 7 12z"/>
            </svg>
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar nome, crédito ou telefone…"
              style={{ width:"100%", height:32, paddingLeft:28, paddingRight:10, border:"1px solid #e2e8f0",
                borderRadius:6, fontSize:12, color:"#1e293b", background:"#fff", outline:"none", boxSizing:"border-box" }} />
          </div>
          <span style={{ background:"#e2e8f0", borderRadius:5, padding:"3px 10px", fontSize:11,
              color:"#475569", fontWeight:600 }}>
            {filtrados.length} / {CLIENTES_MOCK.length}
          </span>
          <div style={{ flex:1 }} />
          <button onClick={handleCSV}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 13px", fontSize:12, fontWeight:600,
              background:"#fff", color:"#374151", border:"1px solid #d1d5db", borderRadius:6, cursor:"pointer" }}>
            <svg viewBox="0 0 24 24" style={{ width:13, height:13, fill:"#16a34a" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2 9H9v-1h2v1zm4 0h-2v-1h2v1zm1-3H8v-1h8v1z"/>
            </svg>
            CSV
          </button>
          <button onClick={handlePDF}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 14px", fontSize:12, fontWeight:700,
              background:"linear-gradient(135deg,#2d5474,#3d6e8e)", color:"#fff",
              border:"none", borderRadius:6, cursor:"pointer" }}>
            <svg viewBox="0 0 24 24" style={{ width:13, height:13, fill:"#fff" }}>
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
            </svg>
            Imprimir PDF
          </button>
        </div>

        {/* Table */}
        <div style={{ overflow:"auto", flex:1 }}>
          <table style={{ borderCollapse:"collapse", width:"max-content", minWidth:"100%" }}>
            <thead>
              <tr>
                <th style={{ position:"sticky", top:0, zIndex:2, background:"#2d5474", color:"#fff",
                    padding:"8px 10px", fontSize:10, fontWeight:700, textAlign:"center",
                    borderRight:"1px solid #3d6e8e", whiteSpace:"nowrap", width:42 }}>#</th>
                {COL.map(c => (
                  <th key={c.key} style={{ position:"sticky", top:0, zIndex:2, background:"#2d5474", color:"#fff",
                      padding:"8px 10px", fontSize:10, fontWeight:700,
                      textAlign: c.right ? "right" : "center",
                      borderRight:"1px solid #3d6e8e", whiteSpace:"nowrap", width:c.w }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={COL.length + 1}
                  style={{ textAlign:"center", padding:"48px", color:"#94a3b8", fontSize:13 }}>
                  Nenhum cliente encontrado.
                </td></tr>
              ) : filtrados.map((c, i) => {
                const alt = i % 2 === 1;
                return (
                  <tr key={c.nro}
                    onMouseEnter={e => (e.currentTarget.style.background="#dbeafe")}
                    onMouseLeave={e => (e.currentTarget.style.background="")}>
                    <td style={{ padding:"6px 8px", fontSize:11, textAlign:"center", fontWeight:700,
                        color:"#94a3b8", background: alt ? "#f8fafc" : "#fff",
                        borderBottom:"1px solid #e8edf2", borderRight:"1px solid #e8edf2" }}>{i+1}</td>
                    {COL.map(col => {
                      const val = c[col.key];
                      const isFrec = col.key === "frec";
                      const isNome = col.key === "nome";
                      const isNum = col.right;
                      return (
                        <td key={col.key} style={{ padding:"6px 10px", fontSize:11, whiteSpace:"nowrap",
                            background: alt ? "#f8fafc" : "#fff",
                            borderBottom:"1px solid #e8edf2", borderRight:"1px solid #e8edf2",
                            textAlign: isNum ? "right" : "left",
                            fontWeight: isNome ? 600 : 400,
                            color: isNum ? "#1e3a5f" : "#334155" }}>
                          {isFrec ? (
                            <span style={{ background:"#dcfce7", color:"#16a34a", borderRadius:4,
                                padding:"2px 7px", fontSize:10, fontWeight:700 }}>{val}</span>
                          ) : val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", padding:"10px 20px",
            borderTop:"1px solid #e2e8f0", background:"#f8fafc", flexShrink:0, gap:12 }}>
          <span style={{ fontSize:12, color:"#64748b" }}>
            Exibindo <strong style={{ color:"#1e293b" }}>{filtrados.length}</strong> clientes
            {busca && ` — filtro: "${busca}"`}
          </span>
          <div style={{ flex:1 }} />
          <button onClick={onClose}
            style={{ padding:"8px 28px", background:"#fff", color:"#374151",
              border:"1px solid #cbd5e1", borderRadius:6, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function gerarPDFListaClientes() {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const hoje = new Date().toISOString().slice(0, 10);

  doc.setFontSize(11);
  doc.setTextColor(45, 84, 116);
  doc.text(`Fecha Lista: ${hoje}   Rota: SystemPay`, 10, 12);

  const clientes = [
    ["2026-04-08","4700627026","Andreia de Jesus Costa Araújo","89985014328","Rua gama lobon nº 10 quarto","1.500","2.100","600","40","105,00","20,0","0,0","7,6","800,00","0,00","5,0","Diário","2026-04-17"],
    ["2026-03-28","4700627080","Luciana Abreu Da Silva","5598883457 67","—","500","700","200","40","50,00","14,0","0,0","14,0","700,00","0,00","14,0","Diário","—"],
    ["2026-03-28","4700627078","Mariana Beatriz Rabelo Barbosa","98985721207","—","1.000","1.400","400","40","100,00","14,0","0,0","14,0","1.490,00","0,00","4,0","Diário","—"],
    ["2026-03-28","4700627077","Natanael Dos Santos Mendes","551197126974 2","—","500","700","200","40","50,00","14,0","0,0","13,0","650,00","0,00","14,0","Diário","2026-03-30"],
    ["2026-03-14","4700627069","Rosângela Silvestre Silva","98985097895","Rua Irene de Souza Residencial João Alberto SN","400","560","160","40","40,00","14,0","0,0","14,0","560,00","0,00","0,0","Diário","—"],
    ["2026-03-14","4700627027","António Leite Neto","5598988464369 9","—","600","840","240","40","60,00","14,0","0,0","12,5","750,00","0,00","21,0","Diário","2026-03-25"],
    ["2026-03-23","4700627041","João Felipe Pereira","559881991414","—","300","420","120","40","30,00","14,0","0,0","4,0","810,00","0,00","19,0","Diário","2026-04-08"],
    ["2026-03-25","4700627057","José Francisco Chaves","559881187058","—","500","700","200","40","50,00","14,0","0,0","13,0","650,00","0,00","16,0","Diário","2026-03-26"],
    ["2026-03-22","4700627022","Kledon Viana Gonçalves","5598858229 06","—","900","1.170","270","30","90,00","13,0","0,0","4,7","650,00","0,00","23,0","Diário","—"],
    ["2026-03-25","4700627092","Patrick Michael Sá Menezes","5598841932430","—","500","700","200","40","50,00","14,0","0,0","12,0","600,00","0,00","16,0","Diário","2026-04-16"],
    ["2026-04-15","4700627014 5","Borei Viana De Souza","98991245677","—","400","560","160","40","40,00","14,0","0,0","12,0","480,00","0,00","5,0","Diário","2026-04-16"],
    ["2026-04-15","4700627016 4","Erick Pereira Santos","5598920038634","—","600","840","240","40","60,00","14,0","0,0","13,0","780,00","0,00","9,0","Diário","—"],
    ["2026-03-13","4700627024","Anny Briane Pires Belfort","5598831561 78","—","800","1.120","320","40","80,00","14,0","0,0","2,6","210,00","0,00","23,0","Diário","2026-04-15"],
    ["2026-03-23","4700627058","Aline Lima De Alencar","98962381007","—","800","1.120","320","40","80,00","14,0","0,0","13,0","1.040,00","0,00","4,0","Diário","—"],
    ["2026-04-02","4700627023","Elaita Kisley Conceição Lopes","5598981481049","—","600","840","240","40","60,00","14,0","0,0","9,0","540,00","0,00","10,0","Diário","2026-04-08"],
    ["2026-03-25","4700627049","Ana Flávia Pereira Moraes","98991571405","—","500","700","200","40","50,00","14,0","0,0","14,0","700,00","0,00","5,0","Diário","2026-04-08"],
    ["2026-03-30","4700627089","Gelison Eduardo Rosa de Jesus","9885397102","—","700","980","280","40","70,00","14,0","0,0","9,0","630,00","0,00","13,0","Diário","2026-05-25"],
    ["2026-04-16","4700627040","Daniele Teixeira Lindoso","5598996897036","—","1.000","1.400","400","40","100,00","14,0","0,0","9,0","900,00","0,00","13,0","Diário","—"],
    ["2026-04-16","4700627025","Bianca de Araújo Alves","98983330893","—","300","420","120","40","30,00","14,0","0,0","14,0","420,00","0,00","3,0","Diário","2026-04-08"],
    ["2026-03-28","4700627079","Ana Paula Marques De Oliveira","98986248424","—","500","700","200","40","50,00","14,0","0,0","14,0","700,00","0,00","14,0","DIÁRIO","2026-05-25"],
  ];

  autoTable(doc, {
    startY: 18,
    head: [[
      "#","FECHA","NRO CREDITO","NOME DO CLIENTE","TELEFONE","DIRECCION",
      "VL PRESTADO","VL A PAGAR","VL INTERESE","%","V.CUOTA","CUOTAS",
      "C.PAGAS","C.RESTA","SALDO","SANÇÃO","VISITAS","FREC.","ULT.PAGO"
    ]],
    body: clientes.map((row, i) => [String(i + 1), ...row]),
    styles: { fontSize: 6, cellPadding: 1.5, overflow: "linebreak" },
    headStyles: { fillColor: [45, 84, 116], textColor: 255, fontStyle: "bold", fontSize: 6 },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    columnStyles: {
      0:  { cellWidth: 6 },
      1:  { cellWidth: 18 },
      2:  { cellWidth: 22 },
      3:  { cellWidth: 32 },
      4:  { cellWidth: 22 },
      5:  { cellWidth: 38 },
      6:  { cellWidth: 16 },
      7:  { cellWidth: 16 },
      8:  { cellWidth: 16 },
      9:  { cellWidth: 8 },
      10: { cellWidth: 14 },
      11: { cellWidth: 13 },
      12: { cellWidth: 13 },
      13: { cellWidth: 13 },
      14: { cellWidth: 16 },
      15: { cellWidth: 12 },
      16: { cellWidth: 13 },
      17: { cellWidth: 12 },
      18: { cellWidth: 18 },
    },
    margin: { left: 5, right: 5 },
  });

  doc.save(`lista-clientes-${hoje}.pdf`);
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [activeMain, setActiveMain] = useState("Liq. Diária");
  const [activeSub, setActiveSub] = useState("Relatório Diário");
  const [activeSubPeriodos, setActiveSubPeriodos] = useState("Liquidação");
  const [liqInicio, setLiqInicio] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10); });
  const [liqFim,    setLiqFim]    = useState(() => new Date().toISOString().slice(0,10));
  const [diarioData, setDiarioData] = useState(() => new Date().toISOString().slice(0,10));
  const [buscarRotaOpen, setBuscarRotaOpen] = useState(false);
  const emptyBuscarRota = { nome: "", codigo: "", estadoFechamento: "", uf: "" };
  const [buscarRotaForm, setBuscarRotaForm] = useState(emptyBuscarRota);
  const [collapsedCidades, setCollapsedCidades] = useState<Set<string>>(new Set());
  const [collapsedEstadoMain, setCollapsedEstadoMain] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const toggleCidadeMain = (cidade: string) => setCollapsedCidades(prev => {
    const next = new Set(prev);
    next.has(cidade) ? next.delete(cidade) : next.add(cidade);
    return next;
  });
  const [estadoDropdownOpen, setEstadoDropdownOpen] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState("MARANHÃO");
  const [selectedRota, setSelectedRota] = useState<string | null>(null);
  const estadosDataBase: Record<string, { cidade: string; vendedor: string; data: string; ativa: boolean }[]> = {
    "MARANHÃO": [
      { cidade: "SAO LUIS",    vendedor: "Rota Cred Bank A",        data: "2026-06-10", ativa: true  },
      { cidade: "SAO LUIS",    vendedor: "Rota Cred Bank B",        data: "2026-05-20", ativa: true  },
      { cidade: "SAO LUIS",    vendedor: "Rota Norte SL",           data: "2025-11-30", ativa: false },
      { cidade: "IMPERATRIZ",  vendedor: "Rota Cred Imp A",         data: "2026-06-01", ativa: true  },
      { cidade: "IMPERATRIZ",  vendedor: "Rota Cred Imp B",         data: "2025-08-15", ativa: false },
      { cidade: "CAXIAS",      vendedor: "Rota Caxias Sul",         data: "2026-04-10", ativa: true  },
      { cidade: "TIMON",       vendedor: "Rota Timon Centro",       data: "2025-12-01", ativa: false },
    ],
    "PARÁ": [
      { cidade: "BELÉM",       vendedor: "Rota Norte A",            data: "2026-06-05", ativa: true  },
      { cidade: "BELÉM",       vendedor: "Rota Norte B",            data: "2026-03-22", ativa: true  },
      { cidade: "BELÉM",       vendedor: "Rota Docas Belém",        data: "2025-09-10", ativa: false },
      { cidade: "ANANINDEUA",  vendedor: "Rota Ananindeua A",       data: "2026-05-18", ativa: true  },
      { cidade: "ANANINDEUA",  vendedor: "Rota Ananindeua B",       data: "2025-07-30", ativa: false },
      { cidade: "MARABÁ",      vendedor: "Rota Marabá Centro",      data: "2026-06-12", ativa: true  },
      { cidade: "SANTARÉM",    vendedor: "Rota Santarém Rio",       data: "2025-10-05", ativa: false },
    ],
    "CEARÁ": [
      { cidade: "FORTALEZA",   vendedor: "Rota Cred CE A",          data: "2026-06-08", ativa: true  },
      { cidade: "FORTALEZA",   vendedor: "Rota Cred CE B",          data: "2026-05-30", ativa: true  },
      { cidade: "FORTALEZA",   vendedor: "Rota Litoral CE",         data: "2025-12-20", ativa: false },
      { cidade: "CAUCAIA",     vendedor: "Rota Caucaia A",          data: "2026-04-25", ativa: true  },
      { cidade: "CAUCAIA",     vendedor: "Rota Caucaia B",          data: "2025-06-14", ativa: false },
      { cidade: "JUAZEIRO",    vendedor: "Rota Juazeiro Norte",     data: "2026-05-05", ativa: true  },
      { cidade: "SOBRAL",      vendedor: "Rota Sobral Centro",      data: "2025-11-11", ativa: false },
    ],
    "BAHIA": [
      { cidade: "SALVADOR",    vendedor: "Rota Cred BA A",          data: "2026-06-07", ativa: true  },
      { cidade: "SALVADOR",    vendedor: "Rota Cred BA B",          data: "2026-04-18", ativa: true  },
      { cidade: "SALVADOR",    vendedor: "Rota Pelourinho",         data: "2025-10-30", ativa: false },
      { cidade: "FEIRA",       vendedor: "Rota Feira Santana A",    data: "2026-05-22", ativa: true  },
      { cidade: "FEIRA",       vendedor: "Rota Feira Santana B",    data: "2025-08-05", ativa: false },
      { cidade: "VITÓRIA DA CONQUISTA", vendedor: "Rota VC Centro", data: "2026-06-01", ativa: true  },
      { cidade: "ILHÉUS",      vendedor: "Rota Ilhéus Sul",         data: "2025-09-28", ativa: false },
    ],
    "PIAUÍ": [
      { cidade: "TERESINA",    vendedor: "Rota Cred PI A",          data: "2026-06-09", ativa: true  },
      { cidade: "TERESINA",    vendedor: "Rota Cred PI B",          data: "2026-05-14", ativa: true  },
      { cidade: "TERESINA",    vendedor: "Rota Rio Parnaíba",       data: "2025-11-02", ativa: false },
      { cidade: "PARNAÍBA",    vendedor: "Rota Parnaíba Norte",     data: "2026-04-30", ativa: true  },
      { cidade: "PARNAÍBA",    vendedor: "Rota Parnaíba Sul",       data: "2025-07-19", ativa: false },
      { cidade: "PICOS",       vendedor: "Rota Picos Centro",       data: "2026-05-28", ativa: true  },
      { cidade: "FLORIANO",    vendedor: "Rota Floriano A",         data: "2025-12-15", ativa: false },
    ],
  };
  const [importedRotaData, setImportedRotaData] = useState<Record<string, RotaFakeData>>({});
  const [importedRotas, setImportedRotas] = useState<Record<string, { cidade: string; vendedor: string; data: string; ativa: boolean }[]>>({});

  useEffect(() => {
    if (!selectedRota) return;
    const fetchDados = () => {
      fetch(`${import.meta.env.BASE_URL}api/caixa/fechamento-rota?rota=${encodeURIComponent(selectedRota)}&_t=${Date.now()}`)
        .then(r => r.ok ? r.json() : null)
        .then((data: RotaFakeData | null) => {
          if (data) {
            setImportedRotaData(prev => ({ ...prev, [selectedRota]: data }));
          }
        })
        .catch(() => {});
    };
    fetchDados();
    const interval = setInterval(fetchDados, 10000);
    return () => clearInterval(interval);
  }, [selectedRota]);

  useEffect(() => {
    if (!selectedRota) return;
    const fetchStatus = () => {
      fetch(`${import.meta.env.BASE_URL}api/caixa/status-rota?rota=${encodeURIComponent(selectedRota)}&_t=${Date.now()}`)
        .then(r => r.ok ? r.json() : null)
        .then((data: { aberto: boolean } | null) => {
          if (data !== null) setCaixaAberto(data.aberto);
        })
        .catch(() => {});
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, [selectedRota]);

  const [configOpen, setConfigOpen] = useState(false);
  const [listaClientesOpen, setListaClientesOpen] = useState(false);
  const [caixaAberto, setCaixaAberto] = useState(true);
  const [caixaModalOpen, setCaixaModalOpen] = useState(false);
  const [dataFechamentoCaixa, setDataFechamentoCaixa] = useState<string | null>(null);
  const [codigosOpen, setCodigosOpen] = useState(false);
  const [lucroOpen, setLucroOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [gerenciarAppsOpen, setGerenciarAppsOpen] = useState(false);
  const [gerenciarClientesOpen, setGerenciarClientesOpen] = useState(false);
  const [gerenciarDespesasOpen, setGerenciarDespesasOpen] = useState(false);
  const [gastosPeriodosOpen, setGastosPeriodosOpen] = useState(false);
  const [gpFiltroCategoria, setGpFiltroCategoria] = useState("-- Selecione --");
  const [gpFiltroDataInicial, setGpFiltroDataInicial] = useState("");
  const [gpFiltroDataFinal, setGpFiltroDataFinal] = useState("");
  const [gpRows, setGpRows] = useState<Array<{ id: number; categoria: string; descricao: string; valor: number; data: string; hora: string; responsavel: string; obs: string }>>([
    { id: 1, categoria: "Combustível",      descricao: "Abastecimento frota Rota SP Centro",   valor: 450.00,  data: "2026-06-01", hora: "08:30", responsavel: "Carlos Silva",  obs: "Posto Shell" },
    { id: 2, categoria: "Alimentação",      descricao: "Almoço equipe comercial",              valor: 180.50,  data: "2026-06-03", hora: "12:15", responsavel: "Ana Pereira",   obs: "" },
    { id: 3, categoria: "Manutenção",       descricao: "Revisão veículo placa ABC-1234",       valor: 920.00,  data: "2026-06-05", hora: "09:00", responsavel: "João Santos",   obs: "Troca de óleo" },
    { id: 4, categoria: "Retirada de Caixa","descricao": "Retirada operacional junho",         valor: 1500.00, data: "2026-06-10", hora: "17:45", responsavel: "Carlos Silva",  obs: "" },
    { id: 5, categoria: "Outros",           descricao: "Material de escritório",               valor: 135.75,  data: "2026-06-12", hora: "11:20", responsavel: "Maria Oliveira",obs: "Papelaria Alfa" },
  ]);
  const [gpEditId, setGpEditId] = useState<number | null>(null);
  const [gpModalOpen, setGpModalOpen] = useState(false);
  const [gpDeleteId, setGpDeleteId] = useState<number | null>(null);
  const [gpForm, setGpForm] = useState<{ id: number; categoria: string; descricao: string; valor: number; data: string; hora: string; responsavel: string; obs: string }>({ id: 0, categoria: "", descricao: "", valor: 0, data: "", hora: "", responsavel: "", obs: "" });
  const [gerenciarRendimentosOpen, setGerenciarRendimentosOpen] = useState(false);
  const [rendPeriodosOpen, setRendPeriodosOpen] = useState(false);
  const [rpFiltroCategoria, setRpFiltroCategoria] = useState("-- Selecione --");
  const [rpFiltroDataInicial, setRpFiltroDataInicial] = useState("");
  const [rpFiltroDataFinal, setRpFiltroDataFinal] = useState("");
  const [rpRows, setRpRows] = useState<RendGRow[]>([
    { id: 1, categoria: "Aporte",       descricao: "Aporte inicial operação junho",       valor: 8000.00, data: "2026-06-01", hora: "09:00", responsavel: "Carlos Silva",  obs: "Capital inicial" },
    { id: 2, categoria: "Depósito",     descricao: "Depósito Rota SP Centro",             valor: 5200.00, data: "2026-06-10", hora: "10:30", responsavel: "Ana Pereira",   obs: "" },
    { id: 3, categoria: "Entrada Extra",descricao: "Recebimento parcela atrasada cliente",valor: 450.50,  data: "2026-06-11", hora: "14:15", responsavel: "João Santos",   obs: "Cliente Rota Zona Sul" },
    { id: 4, categoria: "Depósito",     descricao: "Depósito Rota Zona Sul",              valor: 4800.50, data: "2026-06-11", hora: "17:00", responsavel: "Maria Oliveira",obs: "" },
    { id: 5, categoria: "Depósito",     descricao: "Depósito Rota ABC",                  valor: 3950.25, data: "2026-06-12", hora: "11:45", responsavel: "Pedro Costa",   obs: "" },
  ]);
  const [rpEditId, setRpEditId] = useState<number | null>(null);
  const [rpModalOpen, setRpModalOpen] = useState(false);
  const [rpDeleteId, setRpDeleteId] = useState<number | null>(null);
  const [rpForm, setRpForm] = useState<RendGRow>({ id: 0, data: new Date().toISOString().slice(0,10), hora: "08:00", categoria: "", descricao: "", valor: 0, responsavel: "", obs: "" });
  const [faturasOpen, setFaturasOpen] = useState(false);
  const [importarRotasOpen, setImportarRotasOpen] = useState(false);
  const [caixaGeralOpen, setCaixaGeralOpen] = useState(false);
  const [caixaSaldo, setCaixaSaldo] = useState(12450.75);
  const [caixaVendedor, setCaixaVendedor] = useState("");
  const [caixaConceito, setCaixaConceito] = useState("");
  const [caixaValor, setCaixaValor] = useState("");
  const [caixaData, setCaixaData] = useState("");
  const [caixaObs, setCaixaObs] = useState("");
  const [caixaRetiradaOpen, setCaixaRetiradaOpen] = useState(false);
  const [caixaRetiradaValor, setCaixaRetiradaValor] = useState("");
  const [caixaRetiradaObs, setCaixaRetiradaObs] = useState("");
  const [caixaRetiradaRota, setCaixaRetiradaRota] = useState("");
  type CaixaMovRow = { id: number; tipo: "Entrada" | "Retirada"; descricao: string; valor: number; data: string; };
  const [caixaMovs, setCaixaMovs] = useState<CaixaMovRow[]>([
    { id: 1, tipo: "Entrada",  descricao: "Liquidação Rota SP Centro",  valor: 5200.00, data: "2026-06-10" },
    { id: 2, tipo: "Entrada",  descricao: "Liquidação Rota Zona Sul",   valor: 4800.50, data: "2026-06-11" },
    { id: 3, tipo: "Retirada", descricao: "Retirada operacional",       valor: 1500.00, data: "2026-06-11" },
    { id: 4, tipo: "Entrada",  descricao: "Liquidação Rota ABC",        valor: 3950.25, data: "2026-06-12" },
  ]);
  const [importarVendedor, setImportarVendedor] = useState("");
  const [importarMasivo, setImportarMasivo] = useState(true);
  const [importarArquivo, setImportarArquivo] = useState<File | null>(null);
  const [importarArquivoClientes, setImportarArquivoClientes] = useState<File | null>(null);
  const [importarLoading, setImportarLoading] = useState(false);
  const [importarStatus, setImportarStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  type ImportClienteRow = { nome: string; telefone: string; endereco: string; consecutivo: string; dataInicio: string; valorProduto: number; totalAPagar: number; jurosPct: number; valorParcela: number; numParcelas: number; parcelasPagas: number; parcelasRestantes: number; saldo: number; };
  const [importarPreviewClientes, setImportarPreviewClientes] = useState<ImportClienteRow[]>([]);

  // ── Faturas ──
  type FaturaRow = { id: number; nro: string; data: string; iva: number; valorCop: number; valorUsd: number; meses: number; conceito: string; estado: "Pendente" | "Pago" | "Vencido"; vencimento: string; pais: string; };
  const emptyFatura: Omit<FaturaRow, "id" | "nro"> = { data: new Date().toISOString().slice(0,10), iva: 0, valorCop: 0, valorUsd: 0, meses: 1, conceito: "", estado: "Pendente", vencimento: "", pais: "BR" };
  const [faturaRows, setFaturaRows] = useState<FaturaRow[]>([
    { id: 1, nro: "14768398", data: "2026-05-28", iva: 0, valorCop: 5999, valorUsd: 11, meses: 1, conceito: "LICENCIAMENTO SYSTEMPAY", estado: "Pendente", vencimento: "2026-05-28", pais: "BR" },
    { id: 2, nro: "14768401", data: "2026-04-28", iva: 0, valorCop: 5999, valorUsd: 11, meses: 1, conceito: "LICENCIAMENTO SYSTEMPAY", estado: "Pago",     vencimento: "2026-04-28", pais: "BR" },
    { id: 3, nro: "14768405", data: "2026-03-28", iva: 0, valorCop: 5999, valorUsd: 11, meses: 1, conceito: "LICENCIAMENTO SYSTEMPAY", estado: "Pago",     vencimento: "2026-03-28", pais: "BR" },
  ]);
  const [faturaNovaOpen, setFaturaNovaOpen] = useState(false);
  const [faturaDetalhesId, setFaturaDetalhesId] = useState<number | null>(null);
  const [faturaDeleteId, setFaturaDeleteId] = useState<number | null>(null);
  const [faturaForm, setFaturaForm] = useState<typeof emptyFatura>(emptyFatura);
  const [faturaRotaBusca, setFaturaRotaBusca] = useState("");
  const [faturaRotaSelecionada, setFaturaRotaSelecionada] = useState<{ id: string; nome: string; vendedor: string; plano: string } | null>(null);
  const [faturaRotaDropdown, setFaturaRotaDropdown] = useState(false);
  const trmHoje = 3513;

  const rotasSample = [
    { id: "RT-001", nome: "Rota São Paulo Centro",     vendedor: "Carlos Silva",   plano: "Mensal"    },
    { id: "RT-002", nome: "Rota Zona Sul SP",           vendedor: "Ana Pereira",    plano: "Trimestral"},
    { id: "RT-003", nome: "Rota ABC Paulista",          vendedor: "João Santos",    plano: "Anual"     },
    { id: "RT-004", nome: "Rota Campinas Norte",        vendedor: "Maria Oliveira", plano: "Mensal"    },
    { id: "RT-005", nome: "Rota Santos Litoral",        vendedor: "Pedro Costa",    plano: "Semestral" },
    { id: "RT-006", nome: "Rota Guarulhos Industrial",  vendedor: "Lucia Ferreira", plano: "Mensal"    },
    { id: "RT-007", nome: "Rota Osasco Comercial",      vendedor: "Roberto Lima",   plano: "Trimestral"},
    { id: "RT-008", nome: "Rota Bauru Centro",          vendedor: "Sandra Souza",   plano: "Mensal"    },
  ];
  const rotasFiltradas = rotasSample.filter(r =>
    r.nome.toLowerCase().includes(faturaRotaBusca.toLowerCase()) ||
    r.vendedor.toLowerCase().includes(faturaRotaBusca.toLowerCase()) ||
    r.id.toLowerCase().includes(faturaRotaBusca.toLowerCase())
  );

  // ── Gerenciar Rendimentos ──
  type RendGRow = { id: number; data: string; hora: string; categoria: string; descricao: string; valor: number; responsavel: string; obs: string; };
  const emptyRend: RendGRow = { id: 0, data: new Date().toISOString().slice(0,10), hora: "08:00", categoria: "", descricao: "", valor: 0, responsavel: "", obs: "" };
  const [rendGRows, setRendGRows] = useState<RendGRow[]>([
    { id: 1, data: "2026-06-01", hora: "07:00", categoria: "Aporte",        descricao: "Aporte inicial de caixa para rota",        valor: 1500.00, responsavel: "Carlos Souza", obs: "Abertura do dia" },
    { id: 2, data: "2026-06-03", hora: "08:30", categoria: "Depósito",      descricao: "Depósito bancário transferido para caixa",  valor: 800.00,  responsavel: "João Mendes",  obs: "" },
    { id: 3, data: "2026-06-05", hora: "10:45", categoria: "Entrada Extra", descricao: "Entrada extra – venda de serviço avulso",   valor: 150.00,  responsavel: "Ana Lima",     obs: "Serviço pontual" },
    { id: 4, data: "2026-06-07", hora: "12:00", categoria: "Transferência", descricao: "Transferência entre rotas – matriz",         valor: 500.00,  responsavel: "Carlos Souza", obs: "Autorizado" },
    { id: 5, data: "2026-06-10", hora: "14:20", categoria: "Aporte",        descricao: "Aporte emergencial para cobertura",         valor: 300.00,  responsavel: "João Mendes",  obs: "Saldo baixo" },
    { id: 6, data: "2026-06-11", hora: "15:50", categoria: "Entrada Extra", descricao: "Recebimento de taxa administrativa",        valor: 75.00,   responsavel: "Ana Lima",     obs: "" },
  ]);
  const [rendGFiltroCategoria, setRendGFiltroCategoria] = useState("-- Selecione --");
  const [rendGFiltroData, setRendGFiltroData] = useState("");
  const [rendGModalOpen, setRendGModalOpen] = useState(false);
  const [rendGEditId, setRendGEditId] = useState<number | null>(null);
  const [rendGForm, setRendGForm] = useState<RendGRow>(emptyRend);
  const [rendGDeleteId, setRendGDeleteId] = useState<number | null>(null);
  const rendGCategorias = ["Aporte", "Depósito", "Entrada Extra", "Transferência", "Outros"];
  const rendGFiltered = rendGRows.filter(r =>
    (rendGFiltroCategoria === "-- Selecione --" || r.categoria === rendGFiltroCategoria) &&
    (!rendGFiltroData || r.data === rendGFiltroData)
  );

  // ── Gerenciar Despesas ──
  type DespRow = { id: number; data: string; hora: string; categoria: string; descricao: string; valor: number; responsavel: string; obs: string; };
  const emptyDesp: DespRow = { id: 0, data: new Date().toISOString().slice(0,10), hora: "08:00", categoria: "", descricao: "", valor: 0, responsavel: "", obs: "" };
  const [despRows, setDespRows] = useState<DespRow[]>([
    { id: 1, data: "2026-06-01", hora: "07:45", categoria: "Combustível",        descricao: "Gasolina – rota diária",           valor: 220.00, responsavel: "Carlos Souza",  obs: "" },
    { id: 2, data: "2026-06-03", hora: "12:30", categoria: "Alimentação",        descricao: "Almoço equipe cobrança",           valor: 85.50,  responsavel: "João Mendes",   obs: "3 pessoas" },
    { id: 3, data: "2026-06-05", hora: "16:00", categoria: "Manutenção",         descricao: "Troca de óleo – veículo",          valor: 310.00, responsavel: "Carlos Souza",  obs: "Aguardando NF" },
    { id: 4, data: "2026-06-07", hora: "09:15", categoria: "Material",           descricao: "Papelaria e impressões",           valor: 67.80,  responsavel: "Ana Lima",      obs: "" },
    { id: 5, data: "2026-06-10", hora: "14:20", categoria: "Combustível",        descricao: "Gasolina – visita clientes",       valor: 195.00, responsavel: "João Mendes",   obs: "" },
    { id: 6, data: "2026-06-11", hora: "08:50", categoria: "Retirada de Caixa", descricao: "Retirada diária do operador",      valor: 500.00, responsavel: "Carlos Souza",  obs: "Autorizado" },
  ]);
  const [despFiltroCategoria, setDespFiltroCategoria] = useState("-- Selecione --");
  const [despFiltroData, setDespFiltroData] = useState("");
  const [despModalOpen, setDespModalOpen] = useState(false);
  const [despEditId, setDespEditId] = useState<number | null>(null);
  const [despForm, setDespForm] = useState<DespRow>(emptyDesp);
  const [despDeleteId, setDespDeleteId] = useState<number | null>(null);
  const despCategorias = ["Combustível", "Alimentação", "Retirada de Caixa", "Material", "Manutenção", "Outros"];
  const despFiltered = despRows.filter(r =>
    (despFiltroCategoria === "-- Selecione --" || r.categoria === despFiltroCategoria) &&
    (!despFiltroData || r.data === despFiltroData)
  );
  const [gcRota, setGcRota] = useState("-- Todas --");
  const [gcDocumento, setGcDocumento] = useState("");
  const [gcNome, setGcNome] = useState("");
  const [gcSobrenome, setGcSobrenome] = useState("");
  const [gcEstado, setGcEstado] = useState("-- Todos --");
  const [gcFrequencia, setGcFrequencia] = useState("-- Todas --");
  const [gcModalOpen, setGcModalOpen] = useState(false);
  const [gcModalRowId, setGcModalRowId] = useState<number | null>(null);
  const [gcModalMode, setGcModalMode] = useState<"view" | "edit">("view");
  const [gcDocClientId, setGcDocClientId] = useState<number | null>(null);
  const [gcDocMap, setGcDocMap] = useState<Record<number, GcDoc[]>>({});
  const [gcHistRowId, setGcHistRowId] = useState<number | null>(null);
  const [gcDeleteId, setGcDeleteId] = useState<number | null>(null);
  const [gcRows, setGcRows] = useState([
    { id: 1,  rota: "Rota Cred Bank A", consec: "4700627026", nome: "Andreia de Jesus Costa Araújo",   doc: "012.345.678-90", nasc: "1985-03-12", tel1: "91633427315",   tel2: "98985014328",  endereco: "Rua Gama Lobo, nº 10, Quarto, Centro – São Luís – MA",        obs: "Cliente pontual. Prefere contato pelo WhatsApp.", freq: "Diário", dataEmprestimo: "2026-03-30", valorEmp: 1500, jurosPorc: 40, total: 2100, parcelas: 20, atrasadas: 0,  pagas: 12, rest: 8,  sancao: 0, visitas: 5,  valorParc: 105, saldo: 800  },
    { id: 2,  rota: "Rota Cred Bank A", consec: "4700627080", nome: "Luciana Alves Da Silva",           doc: "03270213301",    nasc: "1990-07-22", tel1: "5599883457671",  tel2: "03270213301",  endereco: "Av. Colares Moreira, nº 500, Renascença II – São Luís – MA",  obs: "", freq: "Diário", dataEmprestimo: "2026-05-01", valorEmp: 500,  jurosPorc: 40, total: 700,  parcelas: 14, atrasadas: 14, pagas: 0,  rest: 14, sancao: 0, visitas: 14, valorParc: 50,  saldo: 700  },
    { id: 3,  rota: "Rota Cred Bank A", consec: "4700627079", nome: "Ana Paula Marques De Oliveira",    doc: "852592284372",   nasc: "1988-11-05", tel1: "989896248424",   tel2: "852592284372", endereco: "Rua do Sol, nº 35, Centro – São Luís – MA",                   obs: "", freq: "Diário", dataEmprestimo: "2026-05-10", valorEmp: 500,  jurosPorc: 20, total: 600,  parcelas: 20, atrasadas: 0,  pagas: 0,  rest: 20, sancao: 0, visitas: 0,  valorParc: 30,  saldo: 600  },
    { id: 4,  rota: "Rota Cred Bank A", consec: "4700627078", nome: "Mariana Beatriz Rabelo Barbosa",   doc: "073.604.383-73", nasc: "1992-04-18", tel1: "98985721207",    tel2: "985721297",    endereco: "Rua da Paz, nº 120, Cohama – São Luís – MA",                  obs: "Prefere receber boletos por e-mail.", freq: "Diário", dataEmprestimo: "2026-05-05", valorEmp: 1000, jurosPorc: 40, total: 1400, parcelas: 14, atrasadas: 4,  pagas: 0,  rest: 14, sancao: 0, visitas: 4,  valorParc: 100, saldo: 1400 },
    { id: 5,  rota: "Rota Cred Bank B", consec: "4700627077", nome: "Natanael Dos Santos Mendes",       doc: "11971269742",    nasc: "1986-09-30", tel1: "5511971269742",  tel2: "11971269742",  endereco: "Rua Jaime Tavares, nº 67, Tirirical – São Luís – MA",         obs: "", freq: "Diário", dataEmprestimo: "2026-04-20", valorEmp: 500,  jurosPorc: 40, total: 700,  parcelas: 14, atrasadas: 13, pagas: 1,  rest: 13, sancao: 0, visitas: 14, valorParc: 50,  saldo: 650  },
    { id: 6,  rota: "Rota Cred Bank B", consec: "4700627058", nome: "Aline Lima De Alencar",            doc: "034.286.733-44", nasc: "1994-02-14", tel1: "034286733440",   tel2: "98856332110",  endereco: "Rua das Flores, nº 22, Cohajap – São Luís – MA",              obs: "", freq: "Diário", dataEmprestimo: "2026-04-01", valorEmp: 800,  jurosPorc: 40, total: 1120, parcelas: 14, atrasadas: 2,  pagas: 4,  rest: 10, sancao: 0, visitas: 6,  valorParc: 80,  saldo: 570  },
    { id: 7,  rota: "Rota Cred Bank B", consec: "4700627049", nome: "Ana Flávia Pereira Moraes",        doc: "61538186302",    nasc: "1991-06-08", tel1: "61538186302",    tel2: "98745612300",  endereco: "Trav. São Francisco, nº 8, Vila Embratel – São Luís – MA",    obs: "", freq: "Diário", dataEmprestimo: "2026-05-15", valorEmp: 500,  jurosPorc: 40, total: 700,  parcelas: 14, atrasadas: 0,  pagas: 0,  rest: 14, sancao: 0, visitas: 0,  valorParc: 50,  saldo: 700  },
    { id: 8,  rota: "Rota Norte SL",    consec: "4700627027", nome: "Antônio Leite Neto",               doc: "00523478355",    nasc: "1980-12-25", tel1: "00523478355",    tel2: "99612345678",  endereco: "Rua Santa Clara, nº 100, Centro – São Luís – MA",             obs: "Pagamento sempre em dia.", freq: "Diário", dataEmprestimo: "2026-04-12", valorEmp: 600,  jurosPorc: 25, total: 750,  parcelas: 15, atrasadas: 3,  pagas: 2,  rest: 13, sancao: 0, visitas: 5,  valorParc: 50,  saldo: 500  },
    { id: 9,  rota: "Rota Norte SL",    consec: "4700627025", nome: "Bianca de Araújo Alves",           doc: "60974118397",    nasc: "1997-03-19", tel1: "60974118397",    tel2: "98765432101",  endereco: "Rua Oswaldo Cruz, nº 45, Bequimão – São Luís – MA",            obs: "", freq: "Diário", dataEmprestimo: "2026-04-25", valorEmp: 300,  jurosPorc: 40, total: 420,  parcelas: 14, atrasadas: 1,  pagas: 6,  rest: 8,  sancao: 0, visitas: 7,  valorParc: 30,  saldo: 420  },
    { id: 10, rota: "Rota Norte SL",    consec: "4700627022", nome: "Klailton Viana Gonçalves",         doc: "88899900011",    nasc: "1983-08-11", tel1: "88899900011",    tel2: "98700112233",  endereco: "Av. dos Holandeses, nº 300, Calhau – São Luís – MA",          obs: "", freq: "Diário", dataEmprestimo: "2026-04-06", valorEmp: 900,  jurosPorc: 40, total: 1260, parcelas: 14, atrasadas: 5,  pagas: 5,  rest: 9,  sancao: 0, visitas: 10, valorParc: 90,  saldo: 980  },
  ]);
  const gcFiltered = useMemo(() => gcRows.filter(r =>
    (gcRota === "-- Todas --" || r.rota === gcRota) &&
    (!gcNome || r.nome.toLowerCase().includes(gcNome.toLowerCase())) &&
    (!gcSobrenome || r.nome.toLowerCase().includes(gcSobrenome.toLowerCase())) &&
    (!gcDocumento || r.doc.includes(gcDocumento)) &&
    (gcEstado === "-- Todos --" || gcEstado === "Activo") &&
    (gcFrequencia === "-- Todas --" || r.freq === gcFrequencia)
  ), [gcRows, gcRota, gcNome, gcSobrenome, gcDocumento, gcEstado, gcFrequencia]);
  const [gaEmpresa, setGaEmpresa] = useState("");
  const [gaNome, setGaNome] = useState("");
  const [gaSobrenome, setGaSobrenome] = useState("");
  const [gaCodigo, setGaCodigo] = useState("");
  const [gaModalOpen, setGaModalOpen] = useState(false);
  const [gaEditId, setGaEditId] = useState<number | null>(null);
  const [gaDeleteId, setGaDeleteId] = useState<number | null>(null);
  const [gaLoading, setGaLoading] = useState(false);
  const emptyGaForm = { empresa: "", nome: "", vencimento: "", valorMax: "", saldoInicial: "", codigoAcesso: "", confirmarCodigo: "", estado: "Ativo", estadoUF: "", cidade: "" };
  const [gaForm, setGaForm] = useState(emptyGaForm);
  const [gaCidades, setGaCidades] = useState<string[]>([]);
  const [gaCidadesLoading, setGaCidadesLoading] = useState(false);
  useEffect(() => {
    if (!gaForm.estadoUF) { setGaCidades([]); return; }
    setGaCidadesLoading(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${gaForm.estadoUF}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then((data: { nome: string }[]) => setGaCidades(data.map(d => d.nome)))
      .catch(() => setGaCidades([]))
      .finally(() => setGaCidadesLoading(false));
  }, [gaForm.estadoUF]);
  type GaRow = { id: number; rota: string; cobrador: string; codigo: string; vencimento: string; ativo: boolean; valorVendaMax: string | null; saldoInicial: string | null; estadoUF: string | null; cidade: string | null };
  type GaSolicitacao = { id: number; aplicativoId: number | null; cobradorNome: string; deviceId: string; tipo: string; status: string; solicitadoEm: string | null };
  const [gaRows, setGaRows] = useState<GaRow[]>([]);
  const [gaSolicitacoes, setGaSolicitacoes] = useState<GaSolicitacao[]>([]);
  const [gaAprovId, setGaAprovId] = useState<number | null>(null);
  const fetchSolicitacoes = async () => {
    try {
      const res = await fetch("/api/solicitacoes");
      const data = await res.json();
      setGaSolicitacoes(data);
    } catch { /* silent */ }
  };
  const [rotasAPI, setRotasAPI] = useState<{ rota: string; estadoUF: string | null; cidade: string | null; ativo: boolean }[]>([]);
  const fetchRotasAPI = () => {
    fetch('/api/aplicativos')
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any[]) => setRotasAPI(data.map((d: any) => ({ rota: d.rota, estadoUF: d.estado, cidade: d.cidade, ativo: d.ativo }))))
      .catch(() => {});
  };
  useEffect(() => { fetchRotasAPI(); }, []);
  const ufToEstadoNome: Record<string, string> = {
    AC:"ACRE",AL:"ALAGOAS",AM:"AMAZONAS",AP:"AMAPÁ",BA:"BAHIA",CE:"CEARÁ",
    DF:"DISTRITO FEDERAL",ES:"ESPÍRITO SANTO",GO:"GOIÁS",MA:"MARANHÃO",
    MG:"MINAS GERAIS",MS:"MATO GROSSO DO SUL",MT:"MATO GROSSO",PA:"PARÁ",
    PB:"PARAÍBA",PE:"PERNAMBUCO",PI:"PIAUÍ",PR:"PARANÁ",RJ:"RIO DE JANEIRO",
    RN:"RIO GRANDE DO NORTE",RO:"RONDÔNIA",RR:"RORAIMA",RS:"RIO GRANDE DO SUL",
    SC:"SANTA CATARINA",SE:"SERGIPE",SP:"SÃO PAULO",TO:"TOCANTINS",
  };
  const estadosData = useMemo(() => {
    const merged: Record<string, { cidade: string; vendedor: string; data: string; ativa: boolean }[]> =
      Object.fromEntries(Object.entries(estadosDataBase).map(([k, v]) => [k, [...v]]));
    for (const r of rotasAPI) {
      const estadoNome = r.estadoUF ? (ufToEstadoNome[r.estadoUF] ?? r.estadoUF.toUpperCase()) : null;
      if (!estadoNome) continue;
      if (!merged[estadoNome]) merged[estadoNome] = [];
      if (!merged[estadoNome].some(i => i.vendedor === r.rota)) {
        merged[estadoNome].push({
          cidade: r.cidade ? r.cidade.toUpperCase() : estadoNome,
          vendedor: r.rota,
          data: new Date().toISOString().slice(0, 10),
          ativa: r.ativo,
        });
      }
    }
    for (const [estado, rotas] of Object.entries(importedRotas)) {
      if (!merged[estado]) merged[estado] = [];
      for (const rota of rotas) {
        if (!merged[estado].some(r => r.vendedor === rota.vendedor)) {
          merged[estado].push(rota);
        }
      }
    }
    return merged;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotasAPI, importedRotas]);
  const todasRotas = useMemo(() => {
    const fromEstados = Object.values(estadosData).flat().map(i => i.vendedor);
    return Array.from(new Set(fromEstados));
  }, [estadosData]);

  const gaFetch = async (rota?: string, nome?: string, codigo?: string) => {
    setGaLoading(true);
    try {
      const params = new URLSearchParams();
      if (rota)   params.set("rota",   rota);
      if (nome)   params.set("nome",   nome);
      if (codigo) params.set("codigo", codigo);
      const qs = params.toString();
      const res = await fetch(`/api/aplicativos${qs ? "?" + qs : ""}`);
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setGaRows(data.map((d: any) => ({ id: d.id, rota: d.rota, cobrador: d.cobradorNome, codigo: d.codigoAcesso, vencimento: d.vencimento, ativo: d.ativo, valorVendaMax: d.valorVendaMax, saldoInicial: d.saldoInicial, estadoUF: d.estado, cidade: d.cidade })));
    } catch { /* silent */ } finally { setGaLoading(false); }
  };

  useEffect(() => { if (activeMain === "Gerenciar Aplicativos") { gaFetch(); fetchSolicitacoes(); } }, [activeMain]);

  const excelSerialToDate = (val: unknown): string => {
    // Excel stores dates as days since 1900-01-01 (with leap-year bug)
    const num = typeof val === "number" ? val : parseFloat(String(val));
    if (!isNaN(num) && num > 40000 && num < 70000) {
      const d = new Date(Math.round((num - 25569) * 86400 * 1000));
      return d.toISOString().slice(0, 10);
    }
    if (val instanceof Date) return val.toISOString().slice(0, 10);
    return String(val ?? "").trim();
  };

  const parseFileToRows = (file: File): Promise<Record<string, string>[]> => {
    const processBuffer = (wb: ReturnType<typeof XLSX.read>): Record<string, string>[] => {
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
      if (raw.length < 2) return [];
      const headers = (raw[0] as unknown[]).map(h => String(h ?? "").trim());
      return raw.slice(1).map(row =>
        Object.fromEntries(headers.map((h, i) => {
          const v = (row as unknown[])[i];
          const str = v instanceof Date
            ? v.toISOString().slice(0, 10)
            : (typeof v === "number" && v > 40000 && v < 70000)
              ? excelSerialToDate(v)
              : String(v ?? "").trim();
          return [h, str];
        }))
      ).filter(r => Object.values(r).some(v => v !== ""));
    };

    return new Promise((resolve, reject) => {
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const reader = new FileReader();

      if (isCsv) {
        // Read CSV as UTF-8 text to preserve accented characters
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const wb = XLSX.read(text, { type: "string", cellDates: true });
            resolve(processBuffer(wb));
          } catch (err) { reject(err); }
        };
        reader.onerror = reject;
        reader.readAsText(file, "UTF-8");
      } else {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const wb = XLSX.read(data, { type: "array", cellDates: true });
            resolve(processBuffer(wb));
          } catch (err) { reject(err); }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const normalizeHeader = (h: string) =>
    h.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9%]/g, " ")
      .trim();

  const findCol = (headers: string[], ...candidates: string[]): string => {
    const norm = headers.map(normalizeHeader);
    for (const c of candidates) {
      const cn = normalizeHeader(c);
      const idx = norm.findIndex(h => h === cn || h.includes(cn));
      if (idx >= 0) return headers[idx];
    }
    return "";
  };

  const parseNum = (v: string): number => {
    if (!v) return 0;
    const s = String(v).replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(s) || 0;
  };

  const mapClienteRows = (rows: Record<string, string>[]): ImportClienteRow[] => {
    if (rows.length === 0) return [];
    const headers = Object.keys(rows[0]);
    const c = ((...args: string[]) => findCol(headers, ...args));
    const nomeCol     = c("NOMBRE DEL CLIENTE","NOME DO CLIENTE","NOME CLIENTE","NOME","NOMBRE","CLIENTE");
    const telCol      = c("TELEFONO","TELEFONE","TEL");
    const endCol      = c("DIRECCION","ENDEREÇO","ENDERECO","DIRECCION","DIRECCION");
    const consCol     = c("NRO CREDITO","CONSECUTIVO","NRO.CREDITO","NRO_CREDITO","CREDITO");
    const dateCol     = c("FECHA VENTA","DATA VENDA","FECHA","DATA","DATA INICIO");
    const prestCol    = c("VALOR PRESTADO","VALOR EMPRESTADO","PRESTADO","EMPRESTADO");
    const pagarCol    = c("VALOR A PAGAR","TOTAL A PAGAR","A PAGAR","TOTAL","PAGAR");
    const pctCol      = c("%","% V.CUOTA","% JUROS","PORCENTAGEM","PCT JUROS","JUROS %","PORCENTAJE");
    const parcelaCol  = c("V.CUOTA","VALOR PARCELA","CUOTA","PARCELA","V CUOTA","VCUOTA");
    const numParc     = c("CUOTAS","PARCELAS","NUM PARCELAS","NUMERO PARCELAS");
    const pagasCol    = c("C.PAGAS","PAGAS","CUOTAS PAGAS","PARCELAS PAGAS");
    const restaCol    = c("C.RESTA","RESTANTES","RESTA","CUOTAS RESTANTES","PARCELAS RESTANTES");
    const saldoCol    = c("SALDO");

    return rows.map(r => ({
      nome:              r[nomeCol]    ?? "",
      telefone:          r[telCol]    ?? "",
      endereco:          r[endCol]    ?? "",
      consecutivo:       r[consCol]   ?? "",
      dataInicio:        r[dateCol]   ?? new Date().toISOString().slice(0,10),
      valorProduto:      parseNum(r[prestCol]),
      totalAPagar:       parseNum(r[pagarCol]),
      jurosPct:          parseNum(r[pctCol]),
      valorParcela:      parseNum(r[parcelaCol]),
      numParcelas:       Math.round(parseNum(r[numParc])) || 1,
      parcelasPagas:     parseNum(r[pagasCol]),
      parcelasRestantes: parseNum(r[restaCol]),
      saldo:             parseNum(r[saldoCol]),
    })).filter(r => r.nome.trim() !== "");
  };

  const handleImportarArquivoClientes = async (file: File) => {
    setImportarArquivoClientes(file);
    setImportarStatus(null);
    try {
      const rows = await parseFileToRows(file);
      setImportarPreviewClientes(mapClienteRows(rows));
    } catch { setImportarPreviewClientes([]); }
  };

  const handleImportarRota = async () => {
    if (!importarVendedor && !importarArquivo) return;
    setImportarLoading(true);
    setImportarStatus(null);
    try {
      // ── Importar Resumen XLS → Relatório Diário ──
      if (importarArquivo) {
        const form = new FormData();
        form.append("arquivo", importarArquivo);
        const res = await fetch(`${import.meta.env.BASE_URL}api/importar-resumo`, { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setImportarStatus({ ok: false, msg: json.error ?? "Erro ao processar arquivo de rota." });
          return;
        }
        const { data } = json as { data: RotaFakeData & { vendedor: string } };
        // Use the selected rota from the dropdown; fall back to file's vendedor field
        const rotaKey = importarVendedor || (data as unknown as Record<string, string>).vendedor || importarArquivo.name.replace(/\.xlsx?$/i, "");
        setImportedRotaData(prev => ({ ...prev, [rotaKey]: data }));
        setImportedRotas(prev => {
          const estadoKey = selectedEstado || "IMPORTADO";
          const existing = prev[estadoKey] ?? [];
          if (existing.some(r => r.vendedor === rotaKey)) {
            // update existing entry
            return {
              ...prev,
              [estadoKey]: existing.map(r => r.vendedor === rotaKey
                ? { ...r, data: data.dataInicio ?? r.data, ativa: !data.dataFechamento }
                : r),
            };
          }
          return {
            ...prev,
            [estadoKey]: [...existing, {
              cidade: estadosData[selectedEstado]?.[0]?.cidade ?? estadoKey,
              vendedor: rotaKey,
              data: data.dataInicio ?? new Date().toISOString().slice(0, 10),
              ativa: !data.dataFechamento,
            }],
          };
        });
        setImportarStatus({ ok: true, msg: `Resumen importado para "${rotaKey}" — abrindo Relatório Diário...` });
        setImportarArquivo(null);
        // Navigate to Relatório Diário with the selected rota
        setTimeout(() => {
          setSelectedRota(rotaKey);
          setHasSearched(true);
          setCollapsedEstadoMain(false);
          setActiveMain("Liq. Diária");
          setActiveSub("Relatório Diário");
        }, 800);
        return;
      }

      // ── Importar lista de clientes ──
      if (!importarVendedor || !importarArquivoClientes) {
        setImportarStatus({ ok: false, msg: "Selecione uma rota e um arquivo de clientes." });
        return;
      }
      const ap = gaRows.find(r => r.rota === importarVendedor);
      if (!ap) { setImportarStatus({ ok: false, msg: "Selecione uma rota válida." }); return; }
      let clientes = importarPreviewClientes;
      if (clientes.length === 0) {
        try {
          const rows = await parseFileToRows(importarArquivoClientes);
          clientes = mapClienteRows(rows);
        } catch { setImportarStatus({ ok: false, msg: "Erro ao ler arquivo de clientes." }); return; }
      }
      if (clientes.length === 0) { setImportarStatus({ ok: false, msg: "Nenhum cliente encontrado no arquivo." }); return; }
      const res = await fetch("/api/importar-rota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aplicativoId: ap.id, clientes }),
      });
      const json = await res.json();
      if (!res.ok) { setImportarStatus({ ok: false, msg: json.error ?? "Erro ao importar." }); return; }
      setImportarStatus({ ok: true, msg: `${json.importados} cliente(s) importado(s) com sucesso!${json.erros?.length ? ` (${json.erros.length} erro(s))` : ""}` });
      // Adiciona os clientes importados diretamente em Gerenciar Clientes
      const maxId = gcRows.reduce((m, r) => Math.max(m, r.id), 0);
      const newGcRows: GcRow[] = clientes.map((c, idx) => ({
        id: maxId + idx + 1,
        rota: importarVendedor,
        consec: c.consecutivo || String(maxId + idx + 1),
        nome: c.nome,
        doc: "",
        nasc: "",
        tel1: c.telefone || "",
        tel2: "",
        endereco: c.endereco || "",
        obs: "",
        freq: "Diário",
        dataEmprestimo: c.dataInicio || new Date().toISOString().slice(0, 10),
        valorEmp: c.valorProduto,
        jurosPorc: c.jurosPct || 40,
        total: c.totalAPagar,
        parcelas: c.numParcelas,
        atrasadas: 0,
        pagas: Math.round(c.parcelasPagas),
        rest: Math.round(c.parcelasRestantes),
        sancao: 0,
        visitas: 0,
        valorParc: c.valorParcela,
        saldo: c.saldo,
      }));
      setGcRows(prev => [...prev, ...newGcRows]);
      setImportarArquivoClientes(null);
      setImportarPreviewClientes([]);
      setImportarVendedor("");
    } catch { setImportarStatus({ ok: false, msg: "Falha de conexão com o servidor." }); }
    finally { setImportarLoading(false); }
  };

  const isDesempenho = activeMain === "Desempenho";
  const showContent = activeMain === "Liq. Diária" && activeSub === "Relatório Diário";
  const showPagamentos = activeMain === "Liq. Diária" && activeSub === "Pagamentos";
  const showEmprestimos = activeMain === "Liq. Diária" && activeSub === "Novos Empréstimos";
  const showDespesas = activeMain === "Liq. Diária" && activeSub === "Despesas";
  const showRendimentos = activeMain === "Liq. Diária" && activeSub === "Rendimentos";
  const showClientes   = activeMain === "Liq. Diária" && activeSub === "Clientes";
  const showAgendados  = activeMain === "Liq. Diária" && activeSub === "Agendados";
  const showRelatorios = activeMain === "Liq. Diária" && activeSub === "Relatórios";

  useEffect(() => {
    const vp = document.getElementById("vp") as HTMLMetaElement | null;
    if (vp) vp.content = "width=1100, initial-scale=1";
    return () => {
      if (vp) vp.content = "width=device-width, initial-scale=1";
    };
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: "system-ui, sans-serif", background: "#f4f4f4" }}>

      {/* ── SIDE MENU OVERLAY ── */}
      {sideMenuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000 }} onClick={() => setSideMenuOpen(false)}>
          {/* Floating card */}
          <div style={{ position: "absolute", top: 52, left: 10, width: 240, background: "#fff", borderRadius: 10, boxShadow: "0 6px 24px rgba(0,0,0,0.16)", overflow: "hidden" }}
            onClick={e => e.stopPropagation()}>
            {[
              { icon: null,  label: "Gerenciar Aplicativos",        color: "#64748b", img: iconGerenciar, imgSize: 32, onClick: () => { setGerenciarAppsOpen(true); setActiveMain("Gerenciar Aplicativos"); setSideMenuOpen(false); } },
              { icon: null,  label: "Gerenciar Clientes",           color: "#16a34a", img: iconGerenciarApp2, onClick: () => { setGerenciarClientesOpen(true); setActiveMain("Gerenciar Clientes"); setSideMenuOpen(false); } },
              { icon: null,  label: "Gerenc. despesas",             color: "#dc2626", img: iconFinanceiro, imgSize: 22, imgFilter: "invert(29%) sepia(96%) saturate(800%) hue-rotate(328deg) brightness(90%)", onClick: () => { setGerenciarDespesasOpen(true); setActiveMain("Gerenciar Despesas"); setSideMenuOpen(false); } },
              { icon: null,  label: "Gerenc. rendimentos",          color: "#16a34a", img: iconFinanceiro, imgSize: 22, imgFilter: "invert(48%) sepia(79%) saturate(400%) hue-rotate(90deg) brightness(85%)", onClick: () => { setGerenciarRendimentosOpen(true); setActiveMain("Gerenciar Rendimentos"); setSideMenuOpen(false); } },
              { icon: null,  label: "Importar rotas",                color: "#7c3aed", img: iconImportarRota, imgSize: 21, onClick: () => { setImportarRotasOpen(true); setActiveMain("Importar Rotas"); setSideMenuOpen(false); } },
              { icon: null,  label: "Faturas",                       color: "#0891b2", img: iconFaturas, imgSize: 22, imgFilter: "invert(39%) sepia(90%) saturate(400%) hue-rotate(170deg) brightness(85%)", onClick: () => { setFaturasOpen(true); setActiveMain("Faturas"); setSideMenuOpen(false); } },
              { icon: null,  label: "Gerenc. gastos períodos",       color: "#dc2626", img: iconFinanceiro, imgSize: 22, imgFilter: "invert(29%) sepia(96%) saturate(800%) hue-rotate(327deg) brightness(85%)", onClick: () => { setGastosPeriodosOpen(true); setActiveMain("Gastos Períodos"); setSideMenuOpen(false); } },
              { icon: null,  label: "Gerenc. rendimentos períodos", color: "#16a34a", img: iconFinanceiro, imgSize: 22, imgFilter: "invert(48%) sepia(79%) saturate(400%) hue-rotate(90deg) brightness(85%)", onClick: () => { setRendPeriodosOpen(true); setActiveMain("Rendimentos Períodos"); setSideMenuOpen(false); } },
              { icon: null,  label: "Caixa geral",                  color: "#6b7280", img: iconCaixaGeral, imgSize: 34, onClick: () => { setCaixaGeralOpen(true); setActiveMain("Caixa Geral"); setSideMenuOpen(false); } },
            ].map(({ icon, label, color, img, imgBg, darkIcon, imgSize, imgFilter, imgTransform, useMask, onClick: itemOnClick }: { icon: string | null, label: string, color: string, img?: string, imgBg?: string, darkIcon?: boolean, imgSize?: number, imgFilter?: string, imgTransform?: string, useMask?: boolean, onClick?: () => void }) => (
              <button key={label} onClick={() => { itemOnClick ? itemOnClick() : setSideMenuOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "1px solid #f1f5f9", color: "#1e293b", fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", width: "100%" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {img
                  ? <span style={{ width: imgSize ?? 26, height: imgSize ?? 26, borderRadius: 6, background: imgBg ?? "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {useMask
                        ? <span style={{ width: imgSize ?? 24, height: imgSize ?? 24, display: "block", backgroundColor: color, WebkitMaskImage: `url(${img})`, maskImage: `url(${img})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", transform: imgTransform, flexShrink: 0 }} />
                        : <img src={img} alt={label} style={{ width: imgSize ?? (imgBg ? 17 : 24), height: imgSize ?? (imgBg ? 17 : 24), objectFit: "contain", filter: imgFilter ?? (imgBg ? "brightness(0) invert(1)" : darkIcon ? "brightness(0) contrast(2)" : "none"), transform: imgTransform }} />
                      }
                    </span>
                  : <span style={{ fontSize: 18, color }}>{icon}</span>
                }
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between h-12 px-3 shrink-0" style={{ background: "#2d5474" }}>
        <img src={menuIcon} alt="Menu" className="h-8 w-8 object-contain select-none cursor-pointer" draggable={false} onClick={() => setSideMenuOpen(true)} />
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
        {gerenciarAppsOpen && (
          <button onClick={() => setActiveMain("Gerenciar Aplicativos")}
            className="flex items-center gap-2 px-4 h-10 text-sm font-medium transition-all rounded-t"
            style={{
              background: activeMain === "Gerenciar Aplicativos" ? "#2563eb" : "rgba(255,255,255,0.08)",
              color: activeMain === "Gerenciar Aplicativos" ? "#fff" : "rgba(255,255,255,0.65)",
              border: activeMain === "Gerenciar Aplicativos" ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.15)",
              borderBottom: "none",
            }}>
            Gerenciar Aplicativos
            <span onClick={e => { e.stopPropagation(); setGerenciarAppsOpen(false); if (activeMain === "Gerenciar Aplicativos") setActiveMain("Liq. Diária"); }}
              style={{ fontSize: 14, lineHeight: 1, opacity: 0.75, marginLeft: 2 }}>×</span>
          </button>
        )}
        {gerenciarClientesOpen && (
          <button onClick={() => setActiveMain("Gerenciar Clientes")}
            className="flex items-center gap-2 px-4 h-10 text-sm font-medium transition-all rounded-t"
            style={{
              background: activeMain === "Gerenciar Clientes" ? "#2563eb" : "rgba(255,255,255,0.08)",
              color: activeMain === "Gerenciar Clientes" ? "#fff" : "rgba(255,255,255,0.65)",
              border: activeMain === "Gerenciar Clientes" ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.15)",
              borderBottom: "none",
            }}>
            Gerenciar Clientes
            <span onClick={e => { e.stopPropagation(); setGerenciarClientesOpen(false); if (activeMain === "Gerenciar Clientes") setActiveMain("Liq. Diária"); }}
              style={{ fontSize: 14, lineHeight: 1, opacity: 0.75, marginLeft: 2 }}>×</span>
          </button>
        )}
        {caixaGeralOpen && (
          <button onClick={() => setActiveMain("Caixa Geral")}
            className="flex items-center gap-2 px-4 h-10 text-sm font-medium transition-all rounded-t"
            style={{
              background: activeMain === "Caixa Geral" ? "#2563eb" : "rgba(255,255,255,0.08)",
              color: activeMain === "Caixa Geral" ? "#fff" : "rgba(255,255,255,0.65)",
              border: activeMain === "Caixa Geral" ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.15)",
              borderBottom: "none",
            }}>
            Caixa Geral
            <span onClick={e => { e.stopPropagation(); setCaixaGeralOpen(false); if (activeMain === "Caixa Geral") setActiveMain("Liq. Diária"); }}
              style={{ fontSize: 14, lineHeight: 1, opacity: 0.75, marginLeft: 2 }}>×</span>
          </button>
        )}
        {importarRotasOpen && (
          <button onClick={() => setActiveMain("Importar Rotas")}
            className="flex items-center gap-2 px-4 h-10 text-sm font-medium transition-all rounded-t"
            style={{
              background: activeMain === "Importar Rotas" ? "#2563eb" : "rgba(255,255,255,0.08)",
              color: activeMain === "Importar Rotas" ? "#fff" : "rgba(255,255,255,0.65)",
              border: activeMain === "Importar Rotas" ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.15)",
              borderBottom: "none",
            }}>
            Importar Rotas
            <span onClick={e => { e.stopPropagation(); setImportarRotasOpen(false); if (activeMain === "Importar Rotas") setActiveMain("Liq. Diária"); }}
              style={{ fontSize: 14, lineHeight: 1, opacity: 0.75, marginLeft: 2 }}>×</span>
          </button>
        )}
        {faturasOpen && (
          <button onClick={() => setActiveMain("Faturas")}
            className="flex items-center gap-2 px-4 h-10 text-sm font-medium transition-all rounded-t"
            style={{
              background: activeMain === "Faturas" ? "#2563eb" : "rgba(255,255,255,0.08)",
              color: activeMain === "Faturas" ? "#fff" : "rgba(255,255,255,0.65)",
              border: activeMain === "Faturas" ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.15)",
              borderBottom: "none",
            }}>
            Faturas
            <span onClick={e => { e.stopPropagation(); setFaturasOpen(false); if (activeMain === "Faturas") setActiveMain("Liq. Diária"); }}
              style={{ fontSize: 14, lineHeight: 1, opacity: 0.75, marginLeft: 2 }}>×</span>
          </button>
        )}
        {gerenciarRendimentosOpen && (
          <button onClick={() => setActiveMain("Gerenciar Rendimentos")}
            className="flex items-center gap-2 px-4 h-10 text-sm font-medium transition-all rounded-t"
            style={{
              background: activeMain === "Gerenciar Rendimentos" ? "#2563eb" : "rgba(255,255,255,0.08)",
              color: activeMain === "Gerenciar Rendimentos" ? "#fff" : "rgba(255,255,255,0.65)",
              border: activeMain === "Gerenciar Rendimentos" ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.15)",
              borderBottom: "none",
            }}>
            Gerenc. Rendimentos
            <span onClick={e => { e.stopPropagation(); setGerenciarRendimentosOpen(false); if (activeMain === "Gerenciar Rendimentos") setActiveMain("Liq. Diária"); }}
              style={{ fontSize: 14, lineHeight: 1, opacity: 0.75, marginLeft: 2 }}>×</span>
          </button>
        )}
        {rendPeriodosOpen && (
          <button onClick={() => setActiveMain("Rendimentos Períodos")}
            className="flex items-center gap-2 px-4 h-10 text-sm font-medium transition-all rounded-t"
            style={{
              background: activeMain === "Rendimentos Períodos" ? "#2563eb" : "rgba(255,255,255,0.08)",
              color: activeMain === "Rendimentos Períodos" ? "#fff" : "rgba(255,255,255,0.65)",
              border: activeMain === "Rendimentos Períodos" ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.15)",
              borderBottom: "none",
            }}>
            Rendimentos Períodos
            <span onClick={e => { e.stopPropagation(); setRendPeriodosOpen(false); if (activeMain === "Rendimentos Períodos") setActiveMain("Liq. Diária"); }}
              style={{ fontSize: 14, lineHeight: 1, opacity: 0.75, marginLeft: 2 }}>×</span>
          </button>
        )}
        {gerenciarDespesasOpen && (
          <button onClick={() => setActiveMain("Gerenciar Despesas")}
            className="flex items-center gap-2 px-4 h-10 text-sm font-medium transition-all rounded-t"
            style={{
              background: activeMain === "Gerenciar Despesas" ? "#2563eb" : "rgba(255,255,255,0.08)",
              color: activeMain === "Gerenciar Despesas" ? "#fff" : "rgba(255,255,255,0.65)",
              border: activeMain === "Gerenciar Despesas" ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.15)",
              borderBottom: "none",
            }}>
            Gerenc. Despesas
            <span onClick={e => { e.stopPropagation(); setGerenciarDespesasOpen(false); if (activeMain === "Gerenciar Despesas") setActiveMain("Liq. Diária"); }}
              style={{ fontSize: 14, lineHeight: 1, opacity: 0.75, marginLeft: 2 }}>×</span>
          </button>
        )}
        {gastosPeriodosOpen && (
          <button onClick={() => setActiveMain("Gastos Períodos")}
            className="flex items-center gap-2 px-4 h-10 text-sm font-medium transition-all rounded-t"
            style={{
              background: activeMain === "Gastos Períodos" ? "#2563eb" : "rgba(255,255,255,0.08)",
              color: activeMain === "Gastos Períodos" ? "#fff" : "rgba(255,255,255,0.65)",
              border: activeMain === "Gastos Períodos" ? "1px solid #2563eb" : "1px solid rgba(255,255,255,0.15)",
              borderBottom: "none",
            }}>
            Gastos Períodos
            <span onClick={e => { e.stopPropagation(); setGastosPeriodosOpen(false); if (activeMain === "Gastos Períodos") setActiveMain("Liq. Diária"); }}
              style={{ fontSize: 14, lineHeight: 1, opacity: 0.75, marginLeft: 2 }}>×</span>
          </button>
        )}
      </div>
      <div style={{ height: "2px", background: "#2563eb" }} className="shrink-0" />

      {/* ── SUB TABS ROW (hidden on Desempenho) ── */}
      {!isDesempenho && activeMain === "Liq. Diária" && (
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
      {!isDesempenho && activeMain === "Liq. Períodos" && (
        <div className="flex items-center gap-1 px-2 py-1 shrink-0" style={{ background: "#e8edf2" }}>
          {LIQ_PERIODOS_TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveSubPeriodos(tab)}
              className="px-4 h-9 text-sm font-medium transition-all rounded"
              style={{
                background: activeSubPeriodos === tab ? "#2563eb" : "#fff",
                color: activeSubPeriodos === tab ? "#fff" : "#444",
                border: activeSubPeriodos === tab ? "1px solid #2563eb" : "1px solid #cdd3da",
              }}>
              {tab}
            </button>
          ))}
        </div>
      )}


      {/* ── FILTER BAR (Liq. Períodos → Liquidação) ── */}
      {activeMain === "Liq. Períodos" && activeSubPeriodos === "Liquidação" && (
        <div className="flex items-center h-11 px-3 gap-2 shrink-0" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setEstadoDropdownOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded"
              style={{ background: "#2563eb", color: "#fff", minWidth: 130 }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white opacity-90"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              <span className="flex-1 text-left">Estado</span>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white opacity-75"><path d="M7 10l5 5 5-5z"/></svg>
            </button>
            {estadoDropdownOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 9999, background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 180, overflow: "hidden" }}>
                {Object.keys(estadosData).map(est => (
                  <button key={est} onClick={() => { setSelectedEstado(est); setEstadoDropdownOpen(false); setCollapsedCidades(new Set((estadosData[est] ?? []).map(i => i.cidade))); setCollapsedEstadoMain(false); setHasSearched(true); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", background: est === selectedEstado ? "#eff6ff" : "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: est === selectedEstado ? 700 : 500, color: est === selectedEstado ? "#1d4ed8" : "#374151", textAlign: "left" }}>
                    {est === selectedEstado && <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "#2563eb", flexShrink: 0 }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
                    {est !== selectedEstado && <span style={{ width: 14, flexShrink: 0 }} />}
                    {est}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setHasSearched(false); setBuscarRotaForm(emptyBuscarRota); setEstadoDropdownOpen(false); setSelectedRota(null); }} className="flex items-center justify-center w-8 h-8 rounded" style={{ background: "#16a34a", color: "#fff" }} title="Limpar pesquisa">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>
          <button onClick={() => { setBuscarRotaForm(emptyBuscarRota); setBuscarRotaOpen(true); }} className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded" style={{ background: "#2563eb", color: "#fff" }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white opacity-90"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            Rota
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white opacity-70"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <span className="text-xs bg-white/25 rounded-full w-5 h-5 flex items-center justify-center font-bold">1</span>
          </button>
        </div>
      )}

      {/* ── SUB-TABS + FILTER BAR (Gerenciar Clientes) ── */}
      {activeMain === "Gerenciar Clientes" && (
        <>
          {/* filter bar */}
          <div className="flex items-center flex-wrap px-3 py-2 gap-3 shrink-0" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
            <div className="flex flex-col gap-0.5">
              <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Rota</label>
              <select value={gcRota} onChange={e => setGcRota(e.target.value)}
                className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400" style={{ width: 170 }}>
                <option>-- Todas --</option>
                {todasRotas.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Nome</label>
              <input type="text" placeholder="Nome do cliente" value={gcNome} onChange={e => setGcNome(e.target.value)}
                className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400" style={{ width: 130 }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Sobrenome</label>
              <input type="text" placeholder="Sobrenome" value={gcSobrenome} onChange={e => setGcSobrenome(e.target.value)}
                className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400" style={{ width: 110 }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Documento</label>
              <input type="text" placeholder="CPF / RG" value={gcDocumento} onChange={e => setGcDocumento(e.target.value)}
                className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400" style={{ width: 110 }} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Estado</label>
              <select value={gcEstado} onChange={e => setGcEstado(e.target.value)}
                className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400" style={{ width: 110 }}>
                <option>-- Todos --</option>
                <option>Activo</option>
                <option>Inactivo</option>
                <option>Cancelado</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Frequência</label>
              <select value={gcFrequencia} onChange={e => setGcFrequencia(e.target.value)}
                className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400" style={{ width: 110 }}>
                <option>-- Todas --</option>
                <option>Diário</option>
                <option>Semanal</option>
                <option>Quinzenal</option>
                <option>Mensal</option>
              </select>
            </div>
            <div className="flex items-end gap-2" style={{ alignSelf: "flex-end" }}>
              <button onClick={() => { setGcRota("-- Todas --"); setGcNome(""); setGcSobrenome(""); setGcDocumento(""); setGcEstado("-- Todos --"); setGcFrequencia("-- Todas --"); }}
                className="h-7 px-3 rounded text-xs font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50">
                Limpar
              </button>
              <button className="h-7 px-4 rounded text-xs font-semibold flex items-center gap-1.5" style={{ background: "#2563eb", color: "#fff" }}>
                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"/></svg>
                Buscar
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── FILTER BAR (Gerenciar Rendimentos) ── */}
      {activeMain === "Gerenciar Rendimentos" && (
        <div className="flex items-center h-12 px-3 gap-2 shrink-0" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
          <div className="flex flex-col" style={{ minWidth: 160 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Rota (*):</label>
            <select className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 140 }}>
              <option>– Rota Cred Bank –</option>
            </select>
          </div>
          <div className="flex flex-col" style={{ minWidth: 190 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Conceito (*):</label>
            <select value={rendGFiltroCategoria} onChange={e => setRendGFiltroCategoria(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 175 }}>
              <option>-- Selecione --</option>
              {rendGCategorias.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col" style={{ minWidth: 160 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Data do Rendimento:</label>
            <input type="date" value={rendGFiltroData} onChange={e => setRendGFiltroData(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 148 }} />
          </div>
          <div className="flex items-end pb-0.5 gap-2" style={{ alignSelf: "flex-end" }}>
            <button className="flex items-center justify-center w-9 h-7 rounded" style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </button>
            <button onClick={() => { setRendGEditId(null); setRendGForm({ ...emptyRend, id: Date.now() }); setRendGModalOpen(true); }}
              className="flex items-center justify-center w-9 h-7 rounded" style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── FILTER BAR (Gerenciar Despesas) ── */}
      {activeMain === "Gerenciar Despesas" && (
        <div className="flex items-center h-12 px-3 gap-2 shrink-0" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
          <div className="flex flex-col" style={{ minWidth: 160 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Rota (*):</label>
            <select className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 140 }}>
              <option>– Rota Cred Bank –</option>
            </select>
          </div>
          <div className="flex flex-col" style={{ minWidth: 190 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Conceito (*):</label>
            <select value={despFiltroCategoria} onChange={e => setDespFiltroCategoria(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 175 }}>
              <option>-- Selecione --</option>
              {despCategorias.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col" style={{ minWidth: 160 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Data da Despesa:</label>
            <input type="date" value={despFiltroData} onChange={e => setDespFiltroData(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 148 }} />
          </div>
          <div className="flex items-end pb-0.5 gap-2" style={{ alignSelf: "flex-end" }}>
            <button className="flex items-center justify-center w-9 h-7 rounded" style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </button>
            <button onClick={() => { setDespEditId(null); setDespForm({ ...emptyDesp, id: Date.now() }); setDespModalOpen(true); }}
              className="flex items-center justify-center w-9 h-7 rounded" style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── FILTER BAR (Rendimentos Períodos) ── */}
      {activeMain === "Rendimentos Períodos" && (
        <div className="flex items-center h-12 px-3 gap-2 shrink-0" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
          <div className="flex flex-col" style={{ minWidth: 160 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Rota (*):</label>
            <select className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 140 }}>
              <option>– Rota Cred Bank –</option>
            </select>
          </div>
          <div className="flex flex-col" style={{ minWidth: 190 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Conceito (*):</label>
            <select value={rpFiltroCategoria} onChange={e => setRpFiltroCategoria(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 175 }}>
              <option>-- Selecione --</option>
              {rendGCategorias.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col" style={{ minWidth: 150 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Data Inicial:</label>
            <input type="date" value={rpFiltroDataInicial} onChange={e => setRpFiltroDataInicial(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 138 }} />
          </div>
          <div className="flex flex-col" style={{ minWidth: 150 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Data Final:</label>
            <input type="date" value={rpFiltroDataFinal} onChange={e => setRpFiltroDataFinal(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 138 }} />
          </div>
          <div className="flex items-end pb-0.5 gap-2" style={{ alignSelf: "flex-end" }}>
            <button className="flex items-center justify-center w-9 h-7 rounded" style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </button>
            <button onClick={() => { setRpEditId(null); setRpForm({ ...emptyRend, id: Date.now() }); setRpModalOpen(true); }}
              className="flex items-center justify-center w-9 h-7 rounded" style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── FILTER BAR (Gastos Períodos) ── */}
      {activeMain === "Gastos Períodos" && (
        <div className="flex items-center h-12 px-3 gap-2 shrink-0" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
          <div className="flex flex-col" style={{ minWidth: 160 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Rota (*):</label>
            <select className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 140 }}>
              <option>– Rota Cred Bank –</option>
            </select>
          </div>
          <div className="flex flex-col" style={{ minWidth: 190 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Conceito (*):</label>
            <select value={gpFiltroCategoria} onChange={e => setGpFiltroCategoria(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 175 }}>
              <option>-- Selecione --</option>
              {despCategorias.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col" style={{ minWidth: 150 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Data Inicial:</label>
            <input type="date" value={gpFiltroDataInicial} onChange={e => setGpFiltroDataInicial(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 138 }} />
          </div>
          <div className="flex flex-col" style={{ minWidth: 150 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Data Final:</label>
            <input type="date" value={gpFiltroDataFinal} onChange={e => setGpFiltroDataFinal(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 138 }} />
          </div>
          <div className="flex items-end pb-0.5 gap-2" style={{ alignSelf: "flex-end" }}>
            <button className="flex items-center justify-center w-9 h-7 rounded" style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </button>
            <button onClick={() => { setGpEditId(null); setGpForm({ id: Date.now(), categoria: "", descricao: "", valor: 0, data: "", hora: "", responsavel: "", obs: "" }); setGpModalOpen(true); }}
              className="flex items-center justify-center w-9 h-7 rounded" style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── FILTER BAR (Gerenciar Aplicativos) ── */}
      {activeMain === "Gerenciar Aplicativos" && (
        <div className="flex items-center h-12 px-3 gap-2 shrink-0" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
          <div className="flex flex-col" style={{ minWidth: 180 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Rota:</label>
            <select value={gaEmpresa} onChange={e => setGaEmpresa(e.target.value)}
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 170 }}>
              <option value="">Todas as rotas</option>
              {todasRotas.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex flex-col" style={{ minWidth: 160 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Nome:</label>
            <input type="text" value={gaNome} onChange={e => setGaNome(e.target.value)} placeholder=""
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 150 }} />
          </div>
          <div className="flex flex-col" style={{ minWidth: 180 }}>
            <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, marginBottom: 1 }}>Código de Acesso:</label>
            <input type="text" value={gaCodigo} onChange={e => setGaCodigo(e.target.value)} placeholder=""
              className="h-7 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" style={{ minWidth: 170 }} />
          </div>
          <div className="flex items-end pb-0.5 gap-2" style={{ alignSelf: "flex-end" }}>
            <button onClick={() => gaFetch(gaEmpresa, gaNome, gaCodigo)} className="flex items-center justify-center w-9 h-7 rounded" style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </button>
            <button onClick={() => { setGaEditId(null); setGaForm(emptyGaForm); setGaModalOpen(true); }} className="flex items-center justify-center w-9 h-7 rounded" style={{ background: "#2563eb" }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── FILTER BAR (only on Liq. Diária → Relatório Diário) ── */}
      {activeMain === "Liq. Diária" && !showPagamentos && !showEmprestimos && !showDespesas && !showRendimentos && !showClientes && !showAgendados && !showRelatorios && (
        <div className="flex items-center h-11 px-3 gap-2 shrink-0" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setEstadoDropdownOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded"
              style={{ background: "#2563eb", color: "#fff", minWidth: 130 }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white opacity-90"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              <span className="flex-1 text-left">Estado</span>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white opacity-75"><path d="M7 10l5 5 5-5z"/></svg>
            </button>
            {estadoDropdownOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 9999, background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 180, overflow: "hidden" }}>
                {Object.keys(estadosData).map(est => (
                  <button key={est} onClick={() => { setSelectedEstado(est); setEstadoDropdownOpen(false); setCollapsedCidades(new Set((estadosData[est] ?? []).map(i => i.cidade))); setCollapsedEstadoMain(false); setHasSearched(true); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", background: est === selectedEstado ? "#eff6ff" : "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: est === selectedEstado ? 700 : 500, color: est === selectedEstado ? "#1d4ed8" : "#374151", textAlign: "left" }}>
                    {est === selectedEstado && <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "#2563eb", flexShrink: 0 }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
                    {est !== selectedEstado && <span style={{ width: 14, flexShrink: 0 }} />}
                    {est}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setHasSearched(false); setBuscarRotaForm(emptyBuscarRota); setEstadoDropdownOpen(false); setSelectedRota(null); }} className="flex items-center justify-center w-8 h-8 rounded" style={{ background: "#16a34a", color: "#fff" }} title="Limpar pesquisa">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>
          <button onClick={() => { setBuscarRotaForm(emptyBuscarRota); setBuscarRotaOpen(true); }} className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded" style={{ background: "#2563eb", color: "#fff" }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white opacity-90"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            Rota
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white opacity-70"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <span className="text-xs bg-white/25 rounded-full w-5 h-5 flex items-center justify-center font-bold">1</span>
          </button>
          <div className="flex-1" />
          <input type="date" value={diarioData} onChange={e => setDiarioData(e.target.value)}
            className="h-8 border border-gray-300 rounded px-2 text-xs bg-white outline-none focus:border-blue-400 text-gray-700" />
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-hidden flex">
        {activeMain === "Caixa Geral" ? (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#f0f4f8" }}>

            {/* ── Saldo + Rota + Retirada bar ── */}
            <div className="shrink-0 flex items-center gap-4 px-5 py-3" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
              {/* Saldo do Caixa */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "10px 20px", boxShadow: "0 1px 6px rgba(22,163,74,0.1)" }}>
                <div style={{ width: 38, height: 38, background: "#dcfce7", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#16a34a" }}><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, color: "#15803d", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Saldo do Caixa</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#15803d", letterSpacing: "0.02em" }}>
                    R$ {caixaSaldo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Seletor de Rota */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rota</label>
                <select value={caixaRetiradaRota} onChange={e => setCaixaRetiradaRota(e.target.value)}
                  style={{ height: 34, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "0 10px", fontSize: 13, color: caixaRetiradaRota ? "#334155" : "#94a3b8", background: "#f8fafc", outline: "none", minWidth: 200 }}>
                  <option value="">-- Selecione a rota --</option>
                  {todasRotas.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={{ flex: 1 }} />

              {/* Retirada de Caixa */}
              <button onClick={() => { setCaixaRetiradaValor(""); setCaixaRetiradaObs(""); setCaixaRetiradaOpen(true); }}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(220,38,38,0.35)" }}>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "#fff" }}><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                Retirada de Caixa
              </button>
            </div>

            {/* ── Content: Form + Movimentos ── */}
            <div className="flex-1 overflow-auto p-4" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Histórico de movimentos */}
              <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #d1d9e0", overflow: "hidden" }}>
                <div style={{ background: "#2d5474", padding: "8px 14px" }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Movimentos do Caixa</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Tipo","Descrição","Valor","Data"].map(h => (
                        <th key={h} style={{ padding: "9px 14px", textAlign: h === "Valor" ? "right" : "left", fontWeight: 700, fontSize: 11, color: "#64748b", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {caixaMovs.map((m, i) => (
                      <tr key={m.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                            background: m.tipo === "Entrada" ? "#dcfce7" : "#fee2e2",
                            color: m.tipo === "Entrada" ? "#15803d" : "#b91c1c",
                            border: `1px solid ${m.tipo === "Entrada" ? "#86efac" : "#fca5a5"}` }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.tipo === "Entrada" ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
                            {m.tipo}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#334155" }}>{m.descricao}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: m.tipo === "Entrada" ? "#15803d" : "#dc2626" }}>
                          {m.tipo === "Retirada" ? "- " : "+ "}R$ {m.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{m.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />

            {/* ── MODAL RETIRADA ── */}
            {caixaRetiradaOpen && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setCaixaRetiradaOpen(false)}>
                <div style={{ background: "#fff", borderRadius: 14, width: 420, boxShadow: "0 25px 70px rgba(0,0,0,0.4)", overflow: "hidden" }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#fff" }}><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Retirada de Caixa</span>
                    </div>
                    <button onClick={() => setCaixaRetiradaOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                  <div style={{ padding: "22px 22px" }}>
                    {/* Saldo atual */}
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Saldo atual do caixa</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#1e40af" }}>R$ {caixaSaldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Valor da Retirada *</label>
                      <input type="number" min={0} step={0.01} value={caixaRetiradaValor} onChange={e => setCaixaRetiradaValor(e.target.value)} placeholder="0,00"
                        style={{ width: "100%", height: 36, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "0 10px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
                    </div>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Observações</label>
                      <textarea value={caixaRetiradaObs} onChange={e => setCaixaRetiradaObs(e.target.value)} rows={3}
                        style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "8px 10px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#f8fafc" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button onClick={() => setCaixaRetiradaOpen(false)}
                        style={{ background: "#f1f5f9", color: "#475569", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Cancelar
                      </button>
                      <button onClick={() => {
                        const v = parseFloat(caixaRetiradaValor);
                        if (!v || v <= 0 || v > caixaSaldo) return;
                        setCaixaMovs(prev => [...prev, { id: Date.now(), tipo: "Retirada", descricao: (caixaRetiradaRota ? `${caixaRetiradaRota} — ` : "") + (caixaRetiradaObs || "Retirada de caixa"), valor: v, data: new Date().toISOString().slice(0,10) }]);
                        setCaixaSaldo(s => s - v);
                        setCaixaRetiradaOpen(false);
                      }} style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        Confirmar Retirada
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeMain === "Importar Rotas" ? (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#f0f4f8" }}>

            {/* ── Content ── */}
            <div className="flex-1 overflow-auto p-4">
              <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #d1d9e0", overflow: "hidden" }}>
                {/* Blue header */}
                <div style={{ background: "#2d5474", padding: "8px 14px" }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Importar Rotas</span>
                </div>

                {/* Form */}
                <div style={{ padding: "28px 32px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                  {/* Vendedor */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ fontSize: 13, color: "#334155", fontWeight: 500, whiteSpace: "nowrap" }}>Rota (*):</label>
                    <select value={importarVendedor} onChange={e => { setImportarVendedor(e.target.value); setImportarStatus(null); }}
                      style={{ height: 28, border: "1px solid #94a3b8", borderRadius: 3, padding: "0 24px 0 8px", fontSize: 12, color: importarVendedor ? "#334155" : "#94a3b8", background: "#fff", outline: "none", minWidth: 200, cursor: "pointer" }}>
                      <option value="">---Selecione---</option>
                      {gaRows.map(r => <option key={r.id} value={r.rota}>{r.rota} — {r.cobrador}</option>)}
                    </select>
                  </div>

                  {/* Arquivo de Rotas */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>Arquivo de Rotas</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 0, cursor: "pointer" }}>
                      <span style={{ background: "#e8edf2", border: "1px solid #94a3b8", borderRight: "none", borderRadius: "3px 0 0 3px", padding: "0 10px", height: 28, display: "flex", alignItems: "center", fontSize: 12, color: "#334155", fontWeight: 500, whiteSpace: "nowrap" }}>
                        Escolher arquivo
                      </span>
                      <span style={{ background: "#3d6e8e", border: "1px solid #2d5474", borderRadius: "0 3px 3px 0", padding: "0 12px", height: 28, display: "flex", alignItems: "center", fontSize: 12, color: "#fff", whiteSpace: "nowrap", minWidth: 160 }}>
                        {importarArquivo ? importarArquivo.name : "Nenhum arquivo escolhido"}
                      </span>
                      <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }}
                        onChange={e => setImportarArquivo(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>

                  {/* Arquivo de Clientes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>Lista de Clientes</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 0, cursor: "pointer" }}>
                      <span style={{ background: "#e8edf2", border: "1px solid #94a3b8", borderRight: "none", borderRadius: "3px 0 0 3px", padding: "0 10px", height: 28, display: "flex", alignItems: "center", fontSize: 12, color: "#334155", fontWeight: 500, whiteSpace: "nowrap" }}>
                        Escolher arquivo
                      </span>
                      <span style={{ background: "#7c3aed", border: "1px solid #6d28d9", borderRadius: "0 3px 3px 0", padding: "0 12px", height: 28, display: "flex", alignItems: "center", fontSize: 12, color: "#fff", whiteSpace: "nowrap", minWidth: 160 }}>
                        {importarArquivoClientes ? importarArquivoClientes.name : "Nenhum arquivo escolhido"}
                      </span>
                      <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }}
                        onChange={e => { const f = e.target.files?.[0] ?? null; if (f) handleImportarArquivoClientes(f); else setImportarArquivoClientes(null); }} />
                    </label>
                  </div>
                </div>

                {/* Cards de arquivos selecionados */}
                {(importarArquivo || importarArquivoClientes) && (
                  <div style={{ margin: "0 32px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {importarArquivo && (
                      <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
                        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "#16a34a", flexShrink: 0 }}><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#15803d" }}>{importarArquivo.name}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>Arquivo de Rotas · {(importarArquivo.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => setImportarArquivo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, fontWeight: 700 }}>✕</button>
                      </div>
                    )}
                    {importarArquivoClientes && (
                      <div style={{ padding: "12px 16px", background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
                        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "#7c3aed", flexShrink: 0 }}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>{importarArquivoClientes.name}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>Lista de Clientes · {(importarArquivoClientes.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => setImportarArquivoClientes(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, fontWeight: 700 }}>✕</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Status */}
                {importarStatus && (
                  <div style={{ margin: "0 32px 16px", padding: "10px 16px", borderRadius: 6, background: importarStatus.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${importarStatus.ok ? "#86efac" : "#fca5a5"}`, color: importarStatus.ok ? "#15803d" : "#dc2626", fontSize: 13, fontWeight: 600 }}>
                    {importarStatus.msg}
                  </div>
                )}

                {/* Import button */}
                {(importarArquivo || (importarArquivoClientes && importarVendedor)) && (
                  <div style={{ padding: "0 32px 28px", display: "flex", gap: 10 }}>
                    <button
                      onClick={handleImportarRota}
                      disabled={importarLoading}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: importarLoading ? "#93c5fd" : "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", borderRadius: 6, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: importarLoading ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.35)" }}>
                      <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "#fff" }}><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                      {importarLoading ? "Importando..." : "Importar Rotas"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />
          </div>
        ) : activeMain === "Faturas" ? (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#f0f4f8" }}>

            {/* ── Filter bar ── */}
            <div className="shrink-0 flex items-center gap-4 px-4 py-2.5" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
              {/* COBRADOR (ROTA) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.07em", textTransform: "uppercase" }}>Cobrador (Rota)</label>
                <select style={{ height: 32, border: "1px solid #cbd5e1", borderRadius: 5, padding: "0 28px 0 8px", fontSize: 12, color: "#334155", background: "#fff", outline: "none", minWidth: 160, cursor: "pointer" }}>
                  <option>Rota Cred Bank -</option>
                  {rotasSample.map(r => <option key={r.id}>{r.nome}</option>)}
                </select>
              </div>
              {/* NOME */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.07em", textTransform: "uppercase" }}>Nome</label>
                <input type="text" placeholder="Pesquisar por nome..."
                  style={{ height: 32, border: "1px solid #cbd5e1", borderRadius: 5, padding: "0 10px", fontSize: 12, color: "#334155", background: "#fff", outline: "none", minWidth: 200 }}
                  onFocus={e => (e.target.style.borderColor = "#2563eb")}
                  onBlur={e => (e.target.style.borderColor = "#cbd5e1")} />
              </div>
              {/* Pesquisar */}
              <div style={{ paddingTop: 16 }}>
                <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", border: "none", borderRadius: 5, padding: "0 14px", height: 32, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  Pesquisar
                </button>
              </div>
              <div style={{ flex: 1 }} />
              {/* PDF */}
              <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#dc2626", color: "#fff", border: "none", borderRadius: 5, padding: "0 14px", height: 32, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "#fff" }}><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>
                PDF
              </button>
              {/* WhatsApp */}
              <button style={{ display: "flex", alignItems: "center", gap: 6, background: "#16a34a", color: "#fff", border: "none", borderRadius: 5, padding: "0 14px", height: 32, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "#fff" }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
            </div>

            {/* ── Table area ── */}
            <div className="flex-1 overflow-auto px-5 py-4">
              <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#2d5474" }}>
                      {[
                        { label: "Nro",      w: 110, align: "left"   as const },
                        { label: "Data",     w: 105, align: "center" as const },
                        { label: "IVA",      w: 60,  align: "center" as const },
                        { label: "Valor",    w: 180, align: "left"   as const },
                        { label: "Meses",    w: 70,  align: "center" as const },
                        { label: "Conceito",          align: "left"   as const },
                        { label: "Estado",   w: 200, align: "left"   as const },
                        { label: "País",     w: 60,  align: "center" as const },
                        { label: "Pagar",    w: 110, align: "center" as const },
                        { label: "Detalhes", w: 100, align: "center" as const },
                        { label: "Excluir",  w: 75,  align: "center" as const },
                      ].map(h => (
                        <th key={h.label} style={{ padding: "11px 12px", textAlign: h.align, color: "#e2e8f0", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap", width: h.w }}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {faturaRows.map((row, idx) => {
                      const bg = idx % 2 === 0 ? "#fff" : "#f8fafc";
                      const estadoBadge = {
                        Pendente: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d", dot: "#f59e0b" },
                        Pago:     { bg: "#dcfce7", text: "#15803d", border: "#86efac", dot: "#22c55e" },
                        Vencido:  { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5", dot: "#ef4444" },
                      }[row.estado];
                      return (
                        <tr key={row.id} style={{ background: bg, transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#eff6ff"}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = bg}>

                          {/* Nro */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ fontWeight: 800, color: "#1e40af", fontSize: 13, letterSpacing: "0.02em" }}>{row.nro}</span>
                          </td>

                          {/* Data */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center", color: "#64748b", fontSize: 12 }}>
                            {row.data}
                          </td>

                          {/* IVA */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>
                            {row.iva}
                          </td>

                          {/* Valor */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                                R$ {(row.valorCop / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span style={{ fontSize: 11, color: "#64748b" }}>≈ $ {row.valorUsd} USD</span>
                            </div>
                          </td>

                          {/* Meses */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                            <span style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 20, border: "1px solid #7dd3fc" }}>{row.meses}</span>
                          </td>

                          {/* Conceito */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: "#334155", fontSize: 12 }}>
                            {row.conceito}
                          </td>

                          {/* Estado */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: estadoBadge.bg, color: estadoBadge.text, border: `1px solid ${estadoBadge.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, width: "fit-content" }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: estadoBadge.dot, flexShrink: 0 }} />
                                {row.estado}
                              </span>
                              <span style={{ fontSize: 10, color: "#94a3b8" }}>Venc. {row.vencimento}</span>
                            </div>
                          </td>

                          {/* País */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                            <span style={{ fontSize: 20 }}>{row.pais === "BR" ? "🇧🇷" : row.pais === "CO" ? "🇨🇴" : "🌐"}</span>
                          </td>

                          {/* Pagar */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                            {row.estado !== "Pago" ? (
                              <div style={{ display: "inline-flex", gap: 4 }}>
                                <button style={{ background: "linear-gradient(135deg,#0891b2,#06b6d4)", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: "0.05em", boxShadow: "0 1px 4px rgba(8,145,178,0.4)" }}>
                                  Pix
                                </button>
                                <button style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer", boxShadow: "0 1px 4px rgba(22,163,74,0.4)" }}>
                                  $
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>—</span>
                            )}
                          </td>

                          {/* Detalhes */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                            <button onClick={() => setFaturaDetalhesId(row.id)}
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f0f9ff", color: "#0369a1", border: "1px solid #7dd3fc", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, fill: "#0369a1" }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                              Detalhes
                            </button>
                          </td>

                          {/* Excluir */}
                          <td style={{ padding: "12px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                            <button onClick={() => setFaturaDeleteId(row.id)}
                              style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 6, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                              <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#dc2626" }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {faturaRows.length === 0 && (
                      <tr><td colSpan={11} style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Nenhuma fatura cadastrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Footer summary ── */}
            <div className="shrink-0 flex items-center justify-start gap-8 px-5 py-2" style={{ background: "#fff", borderTop: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>FATURAS PENDENTES</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#f59e0b", padding: "1px 10px", borderRadius: 6 }}>{faturaRows.filter(r => r.estado === "Pendente").length}</span>
              </div>
              <span style={{ color: "#e2e8f0" }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em" }}>TOTAL USD</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#1e40af", padding: "1px 10px", borderRadius: 6 }}>$ {faturaRows.filter(r => r.estado !== "Pago").reduce((a, r) => a + r.valorUsd, 0)} USD</span>
              </div>
            </div>
            <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />

            {/* ── MODAL NOVA FATURA ── */}
            {faturaNovaOpen && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setFaturaNovaOpen(false)}>
                <div style={{ background: "#fff", borderRadius: 14, width: 520, boxShadow: "0 25px 70px rgba(0,0,0,0.4)", overflow: "hidden" }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ background: "linear-gradient(135deg,#2d5474,#3d6e8e)", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "#fff" }}><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                      </div>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Nova Fatura</span>
                    </div>
                    <button onClick={() => setFaturaNovaOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                  <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* ── BUSCA DE ROTA ── */}
                    <div style={{ position: "relative" }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6, letterSpacing: "0.06em" }}>
                        🔍 BUSCAR ROTA *
                      </label>
                      {/* Campo selecionado */}
                      {faturaRotaSelecionada ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#eff6ff", border: "2px solid #2563eb", borderRadius: 8, padding: "10px 14px" }}>
                          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "#fff" }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e40af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{faturaRotaSelecionada.nome}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{faturaRotaSelecionada.id} · {faturaRotaSelecionada.vendedor} · <span style={{ color: "#7c3aed", fontWeight: 600 }}>{faturaRotaSelecionada.plano}</span></p>
                          </div>
                          <button onClick={() => { setFaturaRotaSelecionada(null); setFaturaRotaBusca(""); }}
                            style={{ background: "#fee2e2", border: "none", borderRadius: 5, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#dc2626" }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ position: "relative" }}>
                            <svg viewBox="0 0 24 24" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, fill: "#94a3b8", pointerEvents: "none" }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                            <input
                              type="text"
                              value={faturaRotaBusca}
                              onChange={e => { setFaturaRotaBusca(e.target.value); setFaturaRotaDropdown(true); }}
                              onFocus={() => setFaturaRotaDropdown(true)}
                              placeholder="Pesquisar por nome, vendedor ou código..."
                              style={{ width: "100%", height: 40, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "0 12px 0 38px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc", transition: "border-color 0.15s" }}
                              onMouseEnter={e => (e.target as HTMLInputElement).style.borderColor = "#94a3b8"}
                              onMouseLeave={e => (e.target as HTMLInputElement).style.borderColor = "#e2e8f0"}
                            />
                          </div>
                          {/* Dropdown resultados */}
                          {faturaRotaDropdown && (faturaRotaBusca.length > 0 || true) && (
                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, maxHeight: 220, overflowY: "auto", marginTop: 4 }}>
                              {rotasFiltradas.length === 0 ? (
                                <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Nenhuma rota encontrada</div>
                              ) : rotasFiltradas.map((rota, idx) => (
                                <button key={rota.id}
                                  onClick={() => { setFaturaRotaSelecionada(rota); setFaturaRotaBusca(""); setFaturaRotaDropdown(false); }}
                                  style={{ width: "100%", background: "none", border: "none", borderBottom: idx < rotasFiltradas.length - 1 ? "1px solid #f1f5f9" : "none", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left" }}
                                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#f0f9ff"}
                                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}>
                                  <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#e0f2fe,#bae6fd)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "#0369a1" }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{rota.nome}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{rota.id} · {rota.vendedor}</p>
                                  </div>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#f3e8ff", color: "#7c3aed", flexShrink: 0 }}>{rota.plano}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Divisor */}
                    <div style={{ borderTop: "1px dashed #e2e8f0", margin: "0 -4px" }} />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Data *</label>
                        <input type="date" value={faturaForm.data} onChange={e => setFaturaForm(f => ({ ...f, data: e.target.value }))}
                          style={{ width: "100%", height: 36, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "0 10px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Vencimento *</label>
                        <input type="date" value={faturaForm.vencimento} onChange={e => setFaturaForm(f => ({ ...f, vencimento: e.target.value }))}
                          style={{ width: "100%", height: 36, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "0 10px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Conceito *</label>
                      <input type="text" value={faturaForm.conceito} onChange={e => setFaturaForm(f => ({ ...f, conceito: e.target.value }))} placeholder="Ex: Licenciamento SystemPay"
                        style={{ width: "100%", height: 36, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "0 10px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Valor R$ *</label>
                        <input type="number" min={0} step={0.01} value={faturaForm.valorCop / 100} onChange={e => setFaturaForm(f => ({ ...f, valorCop: Math.round(+e.target.value * 100), valorUsd: Math.round((+e.target.value) / 5.63) }))}
                          style={{ width: "100%", height: 36, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "0 10px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Valor USD</label>
                        <input type="number" min={0} value={faturaForm.valorUsd} readOnly
                          style={{ width: "100%", height: 36, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "0 10px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f0f4f8", color: "#64748b" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Meses</label>
                        <input type="number" min={1} value={faturaForm.meses} onChange={e => setFaturaForm(f => ({ ...f, meses: +e.target.value }))}
                          style={{ width: "100%", height: 36, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "0 10px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc" }} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>Estado</label>
                        <select value={faturaForm.estado} onChange={e => setFaturaForm(f => ({ ...f, estado: e.target.value as FaturaRow["estado"] }))}
                          style={{ width: "100%", height: 36, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "0 10px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc" }}>
                          <option>Pendente</option><option>Pago</option><option>Vencido</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 5 }}>País</label>
                        <select value={faturaForm.pais} onChange={e => setFaturaForm(f => ({ ...f, pais: e.target.value }))}
                          style={{ width: "100%", height: 36, border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "0 10px", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#f8fafc" }}>
                          <option value="BR">🇧🇷 Brasil</option><option value="CO">🇨🇴 Colômbia</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                      <button onClick={() => setFaturaNovaOpen(false)}
                        style={{ background: "#f1f5f9", color: "#475569", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Cancelar
                      </button>
                      <button onClick={() => {
                        const maxNro = faturaRows.length > 0 ? Math.max(...faturaRows.map(r => +r.nro)) : 14768398;
                        setFaturaRows(prev => [...prev, { ...faturaForm, id: Date.now(), nro: String(maxNro + 1) }]);
                        setFaturaNovaOpen(false);
                      }} style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.4)" }}>
                        Salvar Fatura
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── MODAL DETALHES ── */}
            {faturaDetalhesId !== null && (() => {
              const fr = faturaRows.find(r => r.id === faturaDetalhesId);
              if (!fr) return null;
              const estadoBadge = { Pendente: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" }, Pago: { bg: "#dcfce7", text: "#15803d", border: "#86efac" }, Vencido: { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" } }[fr.estado];
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => setFaturaDetalhesId(null)}>
                  <div style={{ background: "#fff", borderRadius: 14, width: 480, boxShadow: "0 25px 70px rgba(0,0,0,0.4)", overflow: "hidden" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ background: "linear-gradient(135deg,#2d5474,#3d6e8e)", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "#fff" }}><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                        </div>
                        <div>
                          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 600, margin: 0, letterSpacing: "0.06em" }}>FATURA</p>
                          <p style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: 0 }}>#{fr.nro}</p>
                        </div>
                      </div>
                      <button onClick={() => setFaturaDetalhesId(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                    <div style={{ padding: "24px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
                      {[
                        { label: "Conceito",   value: fr.conceito },
                        { label: "Data",       value: fr.data },
                        { label: "Vencimento", value: fr.vencimento },
                        { label: "Valor",      value: `R$ ${(fr.valorCop / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ≈ $ ${fr.valorUsd} USD` },
                        { label: "IVA",        value: `${fr.iva}%` },
                        { label: "Meses",      value: `${fr.meses}` },
                        { label: "País",       value: fr.pais === "BR" ? "🇧🇷 Brasil" : "🇨🇴 Colômbia" },
                      ].map(({ label, value }, i) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: i < 6 ? "1px solid #f1f5f9" : "none" }}>
                          <span style={{ width: 120, fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{value}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center", padding: "10px 0" }}>
                        <span style={{ width: 120, fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>Estado</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: estadoBadge.bg, color: estadoBadge.text, border: `1px solid ${estadoBadge.border}` }}>{fr.estado}</span>
                      </div>
                    </div>
                    <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={() => setFaturaDetalhesId(null)}
                        style={{ background: "#f1f5f9", color: "#475569", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── MODAL EXCLUIR ── */}
            {faturaDeleteId !== null && (() => {
              const fr = faturaRows.find(r => r.id === faturaDeleteId);
              if (!fr) return null;
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => setFaturaDeleteId(null)}>
                  <div style={{ background: "#fff", borderRadius: 14, width: 400, boxShadow: "0 25px 70px rgba(0,0,0,0.4)", overflow: "hidden" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                      <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, fill: "#fff", flexShrink: 0 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Excluir Fatura</span>
                    </div>
                    <div style={{ padding: "24px 22px" }}>
                      <p style={{ fontSize: 13, color: "#475569", margin: "0 0 8px" }}>Tem certeza que deseja excluir a fatura:</p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: "#1e40af", margin: "0 0 4px" }}>#{fr.nro}</p>
                      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px" }}>{fr.conceito}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 20px" }}>R$ {(fr.valorCop / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ≈ $ {fr.valorUsd} USD</p>
                      <p style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, margin: "0 0 20px" }}>⚠️ Esta ação não pode ser desfeita.</p>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button onClick={() => setFaturaDeleteId(null)}
                          style={{ background: "#f1f5f9", color: "#475569", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Cancelar
                        </button>
                        <button onClick={() => { setFaturaRows(prev => prev.filter(r => r.id !== faturaDeleteId)); setFaturaDeleteId(null); }}
                          style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Sim, Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : activeMain === "Gerenciar Rendimentos" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* header bar */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                Gerenc. Rendimentos
              </span>
              <div className="flex-1" />
              <span className="text-xs text-gray-400 font-medium">DATA DE REFERÊNCIA: {rendGFiltroData || new Date().toISOString().slice(0,10)}</span>
            </div>
            {/* table */}
            <div className="flex-1 overflow-auto">
              <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", minWidth: 1100 }}>
                <colgroup>
                  {[54, 150, 280, 120, 110, 80, 160, 200, 90].map((w, i) => <col key={i} style={{ width: w }} />)}
                </colgroup>
                <thead>
                  <tr>
                    {[
                      { label: "Nro.",        align: "center" as const },
                      { label: "Categoria",   align: "center" as const },
                      { label: "Descrição",   align: "left"   as const },
                      { label: "Valor",       align: "right"  as const },
                      { label: "Data",        align: "center" as const },
                      { label: "Hora",        align: "center" as const },
                      { label: "Responsável", align: "left"   as const },
                      { label: "Observações", align: "left"   as const },
                      { label: "Ações",       align: "center" as const },
                    ].map(c => (
                      <th key={c.label} style={{
                        padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                        whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                        borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
                        position: "sticky", top: 0, zIndex: 1,
                      }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rendGFiltered.map((row, i) => {
                    const cat = rendCategoriaColor[row.categoria] ?? rendCategoriaColor["Outros"];
                    const td = (align: "left"|"center"|"right", extra?: React.CSSProperties): React.CSSProperties => ({
                      padding: "5px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
                      textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
                    });
                    return (
                      <tr key={row.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                        <td style={td("center", { color: "#6b7280", fontWeight: 700, fontSize: 12 })}>{i + 1}</td>
                        <td style={td("center")}>
                          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>{row.categoria}</span>
                        </td>
                        <td style={td("left", { color: "#374151" })}>{row.descricao}</td>
                        <td style={td("right", { fontWeight: 700, color: "#15803d" })}>R$ {row.valor.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td>
                        <td style={td("center", { color: "#6b7280" })}>{row.data}</td>
                        <td style={td("center", { color: "#6b7280" })}>{row.hora}</td>
                        <td style={td("left", { color: "#374151" })}>{row.responsavel}</td>
                        <td style={td("left", { color: "#6b7280", fontStyle: row.obs ? "normal" : "italic" })}>{row.obs || "—"}</td>
                        <td style={td("center")}>
                          <div style={{ display: "inline-flex", gap: 4 }}>
                            <button title="Editar" onClick={() => { setRendGEditId(row.id); setRendGForm({ ...row }); setRendGModalOpen(true); }}
                              style={{ background: "#2563eb", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                            <button title="Excluir" onClick={() => setRendGDeleteId(row.id)}
                              style={{ background: "#dc2626", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rendGFiltered.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Nenhum rendimento encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* total footer */}
            <div className="shrink-0 flex items-center justify-start gap-8 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL RENDIMENTOS</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#15803d", padding: "1px 10px", borderRadius: 6 }}>R$ {rendGFiltered.reduce((a, r) => a + r.valor, 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
            </div>
            <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />

            {/* ── MODAL NOVO / EDITAR ── */}
            {rendGModalOpen && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setRendGModalOpen(false)}>
                <div style={{ background: "#fff", borderRadius: 8, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ background: "#2d5474", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{rendGEditId ? "Editar Rendimento" : "Novo Rendimento"}</span>
                    <button onClick={() => setRendGModalOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 11px", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>✕</button>
                  </div>
                  <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Data *</label>
                        <input type="date" value={rendGForm.data} onChange={e => setRendGForm(f => ({ ...f, data: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Hora *</label>
                        <input type="time" value={rendGForm.hora} onChange={e => setRendGForm(f => ({ ...f, hora: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Categoria *</label>
                      <select value={rendGForm.categoria} onChange={e => setRendGForm(f => ({ ...f, categoria: e.target.value }))}
                        style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box", background: "#fff" }}>
                        <option value="">-- Selecione --</option>
                        {rendGCategorias.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Descrição *</label>
                      <input type="text" value={rendGForm.descricao} onChange={e => setRendGForm(f => ({ ...f, descricao: e.target.value }))}
                        style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Valor (R$) *</label>
                        <input type="number" min={0} step={0.01} value={rendGForm.valor} onChange={e => setRendGForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Responsável</label>
                        <input type="text" value={rendGForm.responsavel} onChange={e => setRendGForm(f => ({ ...f, responsavel: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Observações</label>
                      <input type="text" value={rendGForm.obs} onChange={e => setRendGForm(f => ({ ...f, obs: e.target.value }))}
                        style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                      <button onClick={() => setRendGModalOpen(false)}
                        style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Cancelar
                      </button>
                      <button onClick={() => {
                        if (rendGEditId) {
                          setRendGRows(prev => prev.map(r => r.id === rendGEditId ? rendGForm : r));
                        } else {
                          setRendGRows(prev => [...prev, { ...rendGForm, id: Date.now() }]);
                        }
                        setRendGModalOpen(false);
                      }} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "8px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CONFIRMAÇÃO EXCLUIR ── */}
            {rendGDeleteId !== null && (() => {
              const rr = rendGRows.find(r => r.id === rendGDeleteId);
              if (!rr) return null;
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => setRendGDeleteId(null)}>
                  <div style={{ background: "#fff", borderRadius: 8, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ background: "#dc2626", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                      <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#fff", flexShrink: 0 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Excluir Rendimento</span>
                    </div>
                    <div style={{ padding: "22px 20px" }}>
                      <p style={{ fontSize: 14, color: "#374151", margin: "0 0 6px" }}>Tem certeza que deseja excluir:</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{rr.descricao}</p>
                      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>{rr.categoria} · {rr.data}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d", margin: "0 0 20px" }}>
                        R$ {rr.valor.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                      </p>
                      <p style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, margin: "0 0 20px" }}>⚠️ Esta ação não pode ser desfeita.</p>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button onClick={() => setRendGDeleteId(null)}
                          style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Cancelar
                        </button>
                        <button onClick={() => { setRendGRows(prev => prev.filter(r => r.id !== rendGDeleteId)); setRendGDeleteId(null); }}
                          style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Sim, Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : activeMain === "Gerenciar Despesas" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* header bar */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500"><path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5l4-4h10v4z"/></svg>
                Gerenc. Despesas
              </span>
              <div className="flex-1" />
              <span className="text-xs text-gray-400 font-medium">DATA DE REFERÊNCIA: {despFiltroData || new Date().toISOString().slice(0,10)}</span>
            </div>
            {/* table */}
            <div className="flex-1 overflow-auto">
              <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", minWidth: 1100 }}>
                <colgroup>
                  {[54, 150, 280, 120, 110, 80, 160, 200, 90].map((w, i) => <col key={i} style={{ width: w }} />)}
                </colgroup>
                <thead>
                  <tr>
                    {[
                      { label: "Nro.",        align: "center" as const },
                      { label: "Categoria",   align: "center" as const },
                      { label: "Descrição",   align: "left"   as const },
                      { label: "Valor",       align: "right"  as const },
                      { label: "Data",        align: "center" as const },
                      { label: "Hora",        align: "center" as const },
                      { label: "Responsável", align: "left"   as const },
                      { label: "Observações", align: "left"   as const },
                      { label: "Ações",       align: "center" as const },
                    ].map(c => (
                      <th key={c.label} style={{
                        padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                        whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                        borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
                        position: "sticky", top: 0, zIndex: 1,
                      }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {despFiltered.map((row, i) => {
                    const cat = categoriaColor[row.categoria] ?? categoriaColor["Outros"];
                    const td = (align: "left"|"center"|"right", extra?: React.CSSProperties): React.CSSProperties => ({
                      padding: "5px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
                      textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
                    });
                    return (
                      <tr key={row.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                        <td style={td("center", { color: "#6b7280", fontWeight: 700, fontSize: 12 })}>{i + 1}</td>
                        <td style={td("center")}>
                          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>{row.categoria}</span>
                        </td>
                        <td style={td("left", { color: "#374151" })}>{row.descricao}</td>
                        <td style={td("right", { fontWeight: 700, color: "#b91c1c" })}>R$ {row.valor.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td>
                        <td style={td("center", { color: "#6b7280" })}>{row.data}</td>
                        <td style={td("center", { color: "#6b7280" })}>{row.hora}</td>
                        <td style={td("left", { color: "#374151" })}>{row.responsavel}</td>
                        <td style={td("left", { color: "#6b7280", fontStyle: row.obs ? "normal" : "italic" })}>{row.obs || "—"}</td>
                        <td style={td("center")}>
                          <div style={{ display: "inline-flex", gap: 4 }}>
                            <button title="Editar" onClick={() => { setDespEditId(row.id); setDespForm({ ...row }); setDespModalOpen(true); }}
                              style={{ background: "#2563eb", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                            <button title="Excluir" onClick={() => setDespDeleteId(row.id)}
                              style={{ background: "#dc2626", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {despFiltered.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Nenhuma despesa encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* total footer */}
            <div className="shrink-0 flex items-center justify-start gap-6 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>RETIRADA DE CAIXA</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#7c3aed", padding: "1px 10px", borderRadius: 6 }}>R$ {despFiltered.filter(r => r.categoria === "Retirada de Caixa").reduce((a, r) => a + r.valor, 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
              <span style={{ color: "#d1d5db", fontSize: 16, fontWeight: 300 }}>|</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL DESPESAS</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#b91c1c", padding: "1px 10px", borderRadius: 6 }}>R$ {despFiltered.reduce((a, r) => a + r.valor, 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
            </div>
            {/* ── Blue footer bar (padrão) ── */}
            <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />

            {/* ── MODAL NOVO / EDITAR DESPESA ── */}
            {despModalOpen && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setDespModalOpen(false)}>
                <div style={{ background: "#fff", borderRadius: 8, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ background: "#2d5474", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{despEditId ? "Editar Despesa" : "Nova Despesa"}</span>
                    <button onClick={() => setDespModalOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 11px", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>✕</button>
                  </div>
                  <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Data *</label>
                        <input type="date" value={despForm.data} onChange={e => setDespForm(f => ({ ...f, data: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Hora *</label>
                        <input type="time" value={despForm.hora} onChange={e => setDespForm(f => ({ ...f, hora: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Categoria *</label>
                      <select value={despForm.categoria} onChange={e => setDespForm(f => ({ ...f, categoria: e.target.value }))}
                        style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box", background: "#fff" }}>
                        <option value="">-- Selecione --</option>
                        {despCategorias.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Descrição *</label>
                      <input type="text" value={despForm.descricao} onChange={e => setDespForm(f => ({ ...f, descricao: e.target.value }))}
                        style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Valor (R$) *</label>
                        <input type="number" min={0} step={0.01} value={despForm.valor} onChange={e => setDespForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Responsável</label>
                        <input type="text" value={despForm.responsavel} onChange={e => setDespForm(f => ({ ...f, responsavel: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Observações</label>
                      <input type="text" value={despForm.obs} onChange={e => setDespForm(f => ({ ...f, obs: e.target.value }))}
                        style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                      <button onClick={() => setDespModalOpen(false)}
                        style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Cancelar
                      </button>
                      <button onClick={() => {
                        if (despEditId) {
                          setDespRows(prev => prev.map(r => r.id === despEditId ? despForm : r));
                        } else {
                          setDespRows(prev => [...prev, { ...despForm, id: Date.now() }]);
                        }
                        setDespModalOpen(false);
                      }} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "8px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── CONFIRMAÇÃO EXCLUIR DESPESA ── */}
            {despDeleteId !== null && (() => {
              const dr = despRows.find(r => r.id === despDeleteId);
              if (!dr) return null;
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => setDespDeleteId(null)}>
                  <div style={{ background: "#fff", borderRadius: 8, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ background: "#dc2626", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                      <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#fff", flexShrink: 0 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Excluir Despesa</span>
                    </div>
                    <div style={{ padding: "22px 20px" }}>
                      <p style={{ fontSize: 14, color: "#374151", margin: "0 0 6px" }}>Tem certeza que deseja excluir:</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{dr.descricao}</p>
                      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>{dr.categoria} · {dr.data}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", margin: "0 0 20px" }}>
                        $ {dr.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, margin: "0 0 20px" }}>⚠️ Esta ação não pode ser desfeita.</p>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button onClick={() => setDespDeleteId(null)}
                          style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Cancelar
                        </button>
                        <button onClick={() => { setDespRows(prev => prev.filter(r => r.id !== despDeleteId)); setDespDeleteId(null); }}
                          style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Sim, Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : activeMain === "Rendimentos Períodos" ? (() => {
          const rpFiltered = rpRows.filter(r =>
            (rpFiltroCategoria === "-- Selecione --" || r.categoria === rpFiltroCategoria) &&
            (!rpFiltroDataInicial || r.data >= rpFiltroDataInicial) &&
            (!rpFiltroDataFinal   || r.data <= rpFiltroDataFinal)
          );
          return (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* header bar */}
              <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                  Rendimentos Períodos
                </span>
                <div className="flex-1" />
                {(rpFiltroDataInicial || rpFiltroDataFinal) && (
                  <span className="text-xs text-gray-400 font-medium">
                    PERÍODO: {rpFiltroDataInicial || "…"} → {rpFiltroDataFinal || "…"}
                  </span>
                )}
              </div>
              {/* table */}
              <div className="flex-1 overflow-auto">
                <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", minWidth: 1100 }}>
                  <colgroup>
                    {[54, 150, 280, 120, 110, 80, 160, 200, 90].map((w, i) => <col key={i} style={{ width: w }} />)}
                  </colgroup>
                  <thead>
                    <tr>
                      {[
                        { label: "Nro.",        align: "center" as const },
                        { label: "Categoria",   align: "center" as const },
                        { label: "Descrição",   align: "left"   as const },
                        { label: "Valor",       align: "right"  as const },
                        { label: "Data",        align: "center" as const },
                        { label: "Hora",        align: "center" as const },
                        { label: "Responsável", align: "left"   as const },
                        { label: "Observações", align: "left"   as const },
                        { label: "Ações",       align: "center" as const },
                      ].map(c => (
                        <th key={c.label} style={{
                          padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                          whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                          borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
                          position: "sticky", top: 0, zIndex: 1,
                        }}>{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rpFiltered.map((row, i) => {
                      const cat = rendCategoriaColor[row.categoria] ?? rendCategoriaColor["Outros"];
                      const td = (align: "left"|"center"|"right", extra?: React.CSSProperties): React.CSSProperties => ({
                        padding: "5px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
                        textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
                      });
                      return (
                        <tr key={row.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                          <td style={td("center", { color: "#6b7280", fontWeight: 700, fontSize: 12 })}>{i + 1}</td>
                          <td style={td("center")}>
                            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>{row.categoria}</span>
                          </td>
                          <td style={td("left", { color: "#374151" })}>{row.descricao}</td>
                          <td style={td("right", { fontWeight: 700, color: "#15803d" })}>R$ {row.valor.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td>
                          <td style={td("center", { color: "#6b7280" })}>{row.data}</td>
                          <td style={td("center", { color: "#6b7280" })}>{row.hora}</td>
                          <td style={td("left", { color: "#374151" })}>{row.responsavel}</td>
                          <td style={td("left", { color: "#6b7280", fontStyle: row.obs ? "normal" : "italic" })}>{row.obs || "—"}</td>
                          <td style={td("center")}>
                            <div style={{ display: "inline-flex", gap: 4 }}>
                              <button title="Editar" onClick={() => { setRpEditId(row.id); setRpForm({ ...row }); setRpModalOpen(true); }}
                                style={{ background: "#2563eb", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                              </button>
                              <button title="Excluir" onClick={() => setRpDeleteId(row.id)}
                                style={{ background: "#dc2626", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {rpFiltered.length === 0 && (
                      <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Nenhum rendimento encontrado no período.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* total footer */}
              <div className="shrink-0 flex items-center justify-start gap-8 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL RENDIMENTOS</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#15803d", padding: "1px 10px", borderRadius: 6 }}>R$ {rpFiltered.reduce((a, r) => a + r.valor, 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
              </div>
              <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />

              {/* ── MODAL NOVO / EDITAR ── */}
              {rpModalOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => setRpModalOpen(false)}>
                  <div style={{ background: "#fff", borderRadius: 8, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ background: "#2d5474", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{rpEditId ? "Editar Rendimento" : "Novo Rendimento"}</span>
                      <button onClick={() => setRpModalOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 11px", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>✕</button>
                    </div>
                    <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Data *</label>
                          <input type="date" value={rpForm.data} onChange={e => setRpForm(f => ({ ...f, data: e.target.value }))}
                            style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Hora *</label>
                          <input type="time" value={rpForm.hora} onChange={e => setRpForm(f => ({ ...f, hora: e.target.value }))}
                            style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Categoria *</label>
                        <select value={rpForm.categoria} onChange={e => setRpForm(f => ({ ...f, categoria: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box", background: "#fff" }}>
                          <option value="">-- Selecione --</option>
                          {rendGCategorias.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Descrição *</label>
                        <input type="text" value={rpForm.descricao} onChange={e => setRpForm(f => ({ ...f, descricao: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Valor (R$) *</label>
                          <input type="number" min={0} step={0.01} value={rpForm.valor} onChange={e => setRpForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
                            style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Responsável</label>
                          <input type="text" value={rpForm.responsavel} onChange={e => setRpForm(f => ({ ...f, responsavel: e.target.value }))}
                            style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Observações</label>
                        <input type="text" value={rpForm.obs} onChange={e => setRpForm(f => ({ ...f, obs: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                        <button onClick={() => setRpModalOpen(false)}
                          style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Cancelar
                        </button>
                        <button onClick={() => {
                          if (rpEditId) {
                            setRpRows(prev => prev.map(r => r.id === rpEditId ? rpForm : r));
                          } else {
                            setRpRows(prev => [...prev, { ...rpForm, id: Date.now() }]);
                          }
                          setRpModalOpen(false);
                        }} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "8px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CONFIRMAÇÃO EXCLUIR ── */}
              {rpDeleteId !== null && (() => {
                const rr = rpRows.find(r => r.id === rpDeleteId);
                if (!rr) return null;
                return (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => setRpDeleteId(null)}>
                    <div style={{ background: "#fff", borderRadius: 8, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ background: "#dc2626", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#fff", flexShrink: 0 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Excluir Rendimento</span>
                      </div>
                      <div style={{ padding: "22px 20px" }}>
                        <p style={{ fontSize: 14, color: "#374151", margin: "0 0 6px" }}>Tem certeza que deseja excluir:</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{rr.descricao}</p>
                        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>{rr.categoria} · {rr.data}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d", margin: "0 0 20px" }}>
                          R$ {rr.valor.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                        </p>
                        <p style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, margin: "0 0 20px" }}>⚠️ Esta ação não pode ser desfeita.</p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                          <button onClick={() => setRpDeleteId(null)}
                            style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            Cancelar
                          </button>
                          <button onClick={() => { setRpRows(prev => prev.filter(r => r.id !== rpDeleteId)); setRpDeleteId(null); }}
                            style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                            Sim, Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()
        : activeMain === "Gastos Períodos" ? (() => {
          const gpFiltered = gpRows.filter(r =>
            (gpFiltroCategoria === "-- Selecione --" || r.categoria === gpFiltroCategoria) &&
            (!gpFiltroDataInicial || r.data >= gpFiltroDataInicial) &&
            (!gpFiltroDataFinal   || r.data <= gpFiltroDataFinal)
          );
          return (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* header bar */}
              <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: "#f8f9fa", borderBottom: "1px solid #e0e0e0" }}>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500"><path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5l4-4h10v4z"/></svg>
                  Gastos Períodos
                </span>
                <div className="flex-1" />
                {(gpFiltroDataInicial || gpFiltroDataFinal) && (
                  <span className="text-xs text-gray-400 font-medium">
                    PERÍODO: {gpFiltroDataInicial || "…"} → {gpFiltroDataFinal || "…"}
                  </span>
                )}
              </div>
              {/* table */}
              <div className="flex-1 overflow-auto">
                <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", minWidth: 1100 }}>
                  <colgroup>
                    {[54, 150, 280, 120, 110, 80, 160, 200, 90].map((w, i) => <col key={i} style={{ width: w }} />)}
                  </colgroup>
                  <thead>
                    <tr>
                      {[
                        { label: "Nro.",        align: "center" as const },
                        { label: "Categoria",   align: "center" as const },
                        { label: "Descrição",   align: "left"   as const },
                        { label: "Valor",       align: "right"  as const },
                        { label: "Data",        align: "center" as const },
                        { label: "Hora",        align: "center" as const },
                        { label: "Responsável", align: "left"   as const },
                        { label: "Observações", align: "left"   as const },
                        { label: "Ações",       align: "center" as const },
                      ].map(c => (
                        <th key={c.label} style={{
                          padding: "7px 8px", textAlign: c.align, fontSize: 13, fontWeight: 700,
                          whiteSpace: "nowrap", color: "#e2e8f0", background: "#3d6e8e",
                          borderRight: "1px solid #4a7fa0", letterSpacing: "0.02em",
                          position: "sticky", top: 0, zIndex: 1,
                        }}>{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gpFiltered.map((row, i) => {
                      const cat = categoriaColor[row.categoria] ?? categoriaColor["Outros"];
                      const td = (align: "left"|"center"|"right", extra?: React.CSSProperties): React.CSSProperties => ({
                        padding: "5px 8px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #f0f0f0",
                        textAlign: align, fontSize: 13, whiteSpace: "nowrap", ...extra,
                      });
                      return (
                        <tr key={row.id} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                          <td style={td("center", { color: "#6b7280", fontWeight: 700, fontSize: 12 })}>{i + 1}</td>
                          <td style={td("center")}>
                            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>{row.categoria}</span>
                          </td>
                          <td style={td("left", { color: "#374151" })}>{row.descricao}</td>
                          <td style={td("right", { fontWeight: 700, color: "#b91c1c" })}>R$ {row.valor.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td>
                          <td style={td("center", { color: "#6b7280" })}>{row.data}</td>
                          <td style={td("center", { color: "#6b7280" })}>{row.hora}</td>
                          <td style={td("left", { color: "#374151" })}>{row.responsavel}</td>
                          <td style={td("left", { color: "#6b7280", fontStyle: row.obs ? "normal" : "italic" })}>{row.obs || "—"}</td>
                          <td style={td("center")}>
                            <div style={{ display: "inline-flex", gap: 4 }}>
                              <button title="Editar" onClick={() => { setGpEditId(row.id); setGpForm({ ...row }); setGpModalOpen(true); }}
                                style={{ background: "#2563eb", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                              </button>
                              <button title="Excluir" onClick={() => setGpDeleteId(row.id)}
                                style={{ background: "#dc2626", border: "none", borderRadius: 4, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "#fff" }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {gpFiltered.length === 0 && (
                      <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Nenhuma despesa encontrada no período.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* total footer */}
              <div className="shrink-0 flex items-center justify-start gap-6 px-5 py-2" style={{ background: "#e8edf2", borderTop: "1px solid #d1d5db" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>RETIRADA DE CAIXA</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#7c3aed", padding: "1px 10px", borderRadius: 6 }}>R$ {gpFiltered.filter(r => r.categoria === "Retirada de Caixa").reduce((a, r) => a + r.valor, 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
                <span style={{ color: "#d1d5db", fontSize: 16, fontWeight: 300 }}>|</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em" }}>TOTAL DESPESAS</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: "#b91c1c", padding: "1px 10px", borderRadius: 6 }}>R$ {gpFiltered.reduce((a, r) => a + r.valor, 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
              </div>
              {/* blue footer bar */}
              <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />

              {/* ── MODAL NOVO / EDITAR ── */}
              {gpModalOpen && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => setGpModalOpen(false)}>
                  <div style={{ background: "#fff", borderRadius: 8, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ background: "#2d5474", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{gpEditId ? "Editar Despesa" : "Nova Despesa"}</span>
                      <button onClick={() => setGpModalOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 11px", cursor: "pointer", fontSize: 15, fontWeight: 700 }}>✕</button>
                    </div>
                    <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Data *</label>
                          <input type="date" value={gpForm.data} onChange={e => setGpForm(f => ({ ...f, data: e.target.value }))}
                            style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Hora *</label>
                          <input type="time" value={gpForm.hora} onChange={e => setGpForm(f => ({ ...f, hora: e.target.value }))}
                            style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Categoria *</label>
                        <select value={gpForm.categoria} onChange={e => setGpForm(f => ({ ...f, categoria: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box", background: "#fff" }}>
                          <option value="">-- Selecione --</option>
                          {despCategorias.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Descrição *</label>
                        <input type="text" value={gpForm.descricao} onChange={e => setGpForm(f => ({ ...f, descricao: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Valor (R$) *</label>
                          <input type="number" min={0} step={0.01} value={gpForm.valor} onChange={e => setGpForm(f => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
                            style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Responsável</label>
                          <input type="text" value={gpForm.responsavel} onChange={e => setGpForm(f => ({ ...f, responsavel: e.target.value }))}
                            style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Observações</label>
                        <input type="text" value={gpForm.obs} onChange={e => setGpForm(f => ({ ...f, obs: e.target.value }))}
                          style={{ width: "100%", height: 32, border: "1px solid #d1d5db", borderRadius: 5, padding: "0 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                        <button onClick={() => setGpModalOpen(false)}
                          style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Cancelar
                        </button>
                        <button onClick={() => {
                          if (gpEditId) {
                            setGpRows(prev => prev.map(r => r.id === gpEditId ? gpForm : r));
                          } else {
                            setGpRows(prev => [...prev, { ...gpForm, id: Date.now() }]);
                          }
                          setGpModalOpen(false);
                        }} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "8px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CONFIRMAÇÃO EXCLUIR ── */}
              {gpDeleteId !== null && (() => {
                const dr = gpRows.find(r => r.id === gpDeleteId);
                if (!dr) return null;
                return (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => setGpDeleteId(null)}>
                    <div style={{ background: "#fff", borderRadius: 8, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ background: "#dc2626", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                        <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#fff", flexShrink: 0 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Excluir Despesa</span>
                      </div>
                      <div style={{ padding: "22px 20px" }}>
                        <p style={{ fontSize: 14, color: "#374151", margin: "0 0 6px" }}>Tem certeza que deseja excluir:</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{dr.descricao}</p>
                        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>{dr.categoria} · {dr.data}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", margin: "0 0 20px" }}>
                          R$ {dr.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, margin: "0 0 20px" }}>⚠️ Esta ação não pode ser desfeita.</p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                          <button onClick={() => setGpDeleteId(null)}
                            style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            Cancelar
                          </button>
                          <button onClick={() => { setGpRows(prev => prev.filter(r => r.id !== gpDeleteId)); setGpDeleteId(null); }}
                            style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                            Sim, Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()
        : activeMain === "Gerenciar Clientes" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* count bar */}
            <div className="shrink-0 flex items-center px-3 py-1.5" style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
              <span className="text-xs text-gray-600 font-medium">{gcFiltered.length} registro{gcFiltered.length !== 1 ? "s" : ""} encontrado{gcFiltered.length !== 1 ? "s" : ""}</span>
            </div>
            {/* table */}
            <div className="flex-1 overflow-auto" style={{ background: "#fff" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#3d6e8e", color: "#fff" }}>
                    {[
                      { label: "Histórico", align: "center" as const },
                      { label: "Consecutivo", align: "left" as const },
                      { label: "Nome e Sobrenome", align: "left" as const },
                      { label: "CPF / RG", align: "left" as const },
                      { label: "Frequência", align: "center" as const },
                      { label: "Valor Empr.", align: "right" as const },
                      { label: "Juros / Total", align: "center" as const },
                      { label: "Parcela", align: "center" as const },
                      { label: "Atrasadas / Pagas", align: "left" as const },
                      { label: "Valor Parc.", align: "right" as const },
                      { label: "Saldo", align: "right" as const },
                      { label: "Opções", align: "center" as const },
                    ].map(h => (
                      <th key={h.label} style={{ padding: "8px 10px", textAlign: h.align, fontWeight: 600, fontSize: 11, whiteSpace: "nowrap", letterSpacing: "0.03em" }}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gcFiltered.map((row, i) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid #e5e7eb", verticalAlign: "top", background: i % 2 === 0 ? "#fff" : "#f9fafb", cursor: "pointer" }}
                      onClick={() => { setGcModalRowId(row.id); setGcModalMode("view"); setGcModalOpen(true); }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#f9fafb")}>
                      <td style={{ padding: "10px 10px", textAlign: "center" }}>
                        <button onClick={e => { e.stopPropagation(); setGcHistRowId(row.id); }}
                          style={{ background: "#0e7490", color: "#fff", border: "none", borderRadius: 4, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                          Histórico
                        </button>
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <div style={{ color: "#2563eb", fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>{row.consec}</div>
                        <span style={{ display: "inline-block", marginTop: 3, background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", borderRadius: 3, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>ACTIVO</span>
                      </td>
                      <td style={{ padding: "10px 10px", color: "#dc2626", fontWeight: 600, fontSize: 12 }}>{row.nome}</td>
                      <td style={{ padding: "10px 10px", color: "#374151", fontFamily: "monospace", fontSize: 11 }}>{row.doc}</td>
                      <td style={{ padding: "10px 10px", textAlign: "center" }}>
                        <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{row.freq}</span>
                      </td>
                      <td style={{ padding: "10px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ color: "#1e293b", fontWeight: 600, fontSize: 12 }}>$ {row.valorEmp.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                        {row.dataEmprestimo && (
                          <div style={{ color: "#6b7280", fontSize: 10, marginTop: 2 }}>
                            {row.dataEmprestimo.slice(0, 10).split("-").reverse().join("/")}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 10px", textAlign: "center" }}>
                        <div style={{ color: "#374151", fontSize: 11 }}>Juros {row.jurosPorc}%</div>
                        <div style={{ color: "#dc2626", fontWeight: 700, fontSize: 11 }}>Total {row.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                      </td>
                      <td style={{ padding: "10px 10px", textAlign: "center", color: "#374151", fontWeight: 600, fontSize: 12 }}>{row.parcelas}</td>
                      <td style={{ padding: "10px 10px", fontSize: 11 }}>
                        <div style={{ color: row.atrasadas > 0 ? "#dc2626" : "#374151", fontWeight: row.atrasadas > 0 ? 700 : 400 }}>Atrasadas: {row.atrasadas}</div>
                        <div style={{ color: "#374151" }}>Pagas: {row.pagas}</div>
                        <div style={{ color: "#374151" }}>Rest: {row.rest} (Sanc. {row.sancao})</div>
                        <div style={{ color: "#374151" }}>Visitas: {row.visitas}</div>
                      </td>
                      <td style={{ padding: "10px 10px", textAlign: "right", color: "#374151", fontSize: 12, whiteSpace: "nowrap" }}>
                        $ {row.valorParc.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "10px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ color: "#dc2626", fontWeight: 700, fontSize: 13 }}>$ {row.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                        <div style={{ color: "#6b7280", fontSize: 10, marginTop: 1 }}>Sanção: $ 0.00</div>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", gap: 5 }}>
                          <button onClick={e => { e.stopPropagation(); setGcModalRowId(row.id); setGcModalMode("edit"); setGcModalOpen(true); }} title="Editar"
                            style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 5, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, fill: "#fff" }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                          </button>
                          <button title="Excluir" onClick={e => { e.stopPropagation(); setGcDeleteId(row.id); }}
                            style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 5, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, fill: "#fff" }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* ── Blue footer bar (padrão) ── */}
            <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />
            {/* ── CONFIRMAÇÃO EXCLUIR ── */}
            {gcDeleteId !== null && (() => {
              const gcr = gcRows.find(r => r.id === gcDeleteId);
              if (!gcr) return null;
              return (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => setGcDeleteId(null)}>
                  <div style={{ background: "#fff", borderRadius: 8, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ background: "#dc2626", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                      <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#fff", flexShrink: 0 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Excluir Cliente</span>
                    </div>
                    <div style={{ padding: "22px 20px" }}>
                      <p style={{ fontSize: 14, color: "#374151", margin: "0 0 6px" }}>Tem certeza que deseja excluir o cliente:</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{gcr.nome}</p>
                      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 20px" }}>Consecutivo: {gcr.consec} · Doc: {gcr.doc}</p>
                      <p style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, margin: "0 0 20px" }}>⚠️ Esta ação não pode ser desfeita.</p>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                        <button onClick={() => setGcDeleteId(null)}
                          style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Cancelar
                        </button>
                        <button onClick={() => setGcDeleteId(null)}
                          style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Sim, Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* ── HISTÓRICO MODAL (same as Novos Empréstimos) ── */}
            {gcHistRowId !== null && (() => {
              const gcr = gcRows.find(r => r.id === gcHistRowId);
              if (!gcr) return null;
              const empRow: EmpRow = {
                id: gcr.id,
                consec: gcr.consec,
                freq: gcr.freq,
                valorAnt: gcr.saldo,
                cliente: gcr.nome,
                tag: "Renovado",
                documento: gcr.doc,
                celular: gcr.tel1,
                valorProd: gcr.total,
                parcelas: gcr.parcelas,
                pctJuros: gcr.jurosPorc,
                valorJuros: gcr.total - gcr.valorEmp,
                valorParcela: gcr.valorParc,
                dataVenda: "2026-04-08 00:00:00",
                parcRest: gcr.rest,
                saldo: gcr.saldo,
                numSeguro: "",
                vrSeguro: 0,
                chaveAutor: "",
              };
              return <HistorialVendasModal row={empRow} onClose={() => setGcHistRowId(null)} />;
            })()}
            {/* ── FICHA DO CLIENTE MODAL ── */}
            {gcModalOpen && (() => {
              const mr = gcRows.find(r => r.id === gcModalRowId);
              if (!mr) return null;
              const clientDocs = gcDocMap[mr.id] ?? [];
              return <GcFichaClienteModal
                mr={mr}
                onClose={() => setGcModalOpen(false)}
                viewMode={gcModalMode === "view"}
                onDocumentos={() => setGcDocClientId(mr.id)}
                docs={clientDocs}
                onAddDoc={doc => setGcDocMap(prev => ({ ...prev, [mr.id]: [...(prev[mr.id] ?? []), doc] }))}
                onRemoveDoc={id => setGcDocMap(prev => ({ ...prev, [mr.id]: (prev[mr.id] ?? []).filter(d => d.id !== id) }))}
              />;
            })()}
            {/* ── DOCUMENTOS MODAL ── */}
            {gcDocClientId !== null && (() => {
              const mr = gcRows.find(r => r.id === gcDocClientId);
              if (!mr) return null;
              const docs = gcDocMap[gcDocClientId] ?? [];
              return (
                <GcDocumentosModal
                  mr={mr}
                  docs={docs}
                  onAddDoc={doc => setGcDocMap(prev => ({ ...prev, [gcDocClientId]: [...(prev[gcDocClientId] ?? []), doc] }))}
                  onRemoveDoc={id => setGcDocMap(prev => ({ ...prev, [gcDocClientId]: (prev[gcDocClientId] ?? []).filter(d => d.id !== id) }))}
                  onClose={() => setGcDocClientId(null)}
                />
              );
            })()}
          </div>
        ) : activeMain === "Gerenciar Aplicativos" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* count bar */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5" style={{ background: "#f0f2f5", borderBottom: "1px solid #e0e0e0" }}>
              {gaLoading ? (
                <span className="text-xs text-blue-500 font-medium">Carregando…</span>
              ) : (
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-gray-800">{gaRows.length}</span> registro{gaRows.length !== 1 ? "s" : ""} encontrado{gaRows.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {/* table */}
            <div className="flex-1 overflow-auto bg-white">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#3d6e8e", color: "#fff" }}>
                    <th style={{ padding: "9px 14px", textAlign: "left", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>#</th>
                    <th style={{ padding: "9px 14px", textAlign: "left", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>Rota</th>
                    <th style={{ padding: "9px 14px", textAlign: "left", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>Nome Cobrador</th>
                    <th style={{ padding: "9px 14px", textAlign: "left", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>Cód. Acesso</th>
                    <th style={{ padding: "9px 14px", textAlign: "left", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>Data Vencimento</th>
                    <th style={{ padding: "9px 14px", textAlign: "center", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>Status</th>
                    <th style={{ padding: "9px 14px", textAlign: "center", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>Opções</th>
                  </tr>
                </thead>
                <tbody>
                  {gaRows.map((row, i) => {
                    const venc = new Date(row.vencimento);
                    const hoje = new Date();
                    const vencido = !row.ativo || venc < hoje;
                    return (
                      <tr key={row.id}
                        style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#f8fafc", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#eef4fb")}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#f8fafc")}>
                        <td style={{ padding: "9px 14px", color: "#94a3b8", fontWeight: 600, fontSize: 12 }}>{row.id}</td>
                        <td style={{ padding: "9px 14px", color: "#1e293b", fontWeight: 600 }}>{row.rota}</td>
                        <td style={{ padding: "9px 14px", color: "#374151" }}>{row.cobrador}</td>
                        <td style={{ padding: "9px 14px" }}>
                          <span style={{ fontFamily: "monospace", background: "#f1f5f9", color: "#2d5474", border: "1px solid #e2e8f0", borderRadius: 4, padding: "2px 7px", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>
                            {row.codigo}
                          </span>
                        </td>
                        <td style={{ padding: "9px 14px", color: vencido ? "#dc2626" : "#374151", fontWeight: vencido ? 600 : 400 }}>
                          {row.vencimento}
                        </td>
                        <td style={{ padding: "9px 14px", textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: vencido ? "#fef2f2" : "#f0fdf4",
                            color: vencido ? "#dc2626" : "#16a34a",
                            border: `1px solid ${vencido ? "#fecaca" : "#bbf7d0"}`,
                            borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em"
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: vencido ? "#dc2626" : "#16a34a", display: "inline-block" }} />
                            {vencido ? "Vencido" : "Ativo"}
                          </span>
                        </td>
                        <td style={{ padding: "7px 14px", textAlign: "center" }}>
                          {(() => {
                            const pendente = gaSolicitacoes.find(s => s.aplicativoId === row.id && s.status === "pendente");
                            return (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                                {pendente && (
                                  <button title="Solicitação pendente — clique para aprovar/rejeitar"
                                    onClick={() => setGaAprovId(row.id)}
                                    style={{ background: "#d97706", color: "#fff", border: "none", borderRadius: 5, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "#fff" }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                  </button>
                                )}
                                <button title="Editar"
                                  onClick={() => {
                                    setGaEditId(row.id);
                                    setGaForm({ empresa: row.rota, nome: row.cobrador, vencimento: row.vencimento, valorMax: row.valorVendaMax ?? "", saldoInicial: row.saldoInicial ?? "", codigoAcesso: row.codigo, confirmarCodigo: row.codigo, estado: row.ativo ? "Ativo" : "Inativo", estadoUF: row.estadoUF ?? "", cidade: row.cidade ?? "" });
                                    setGaModalOpen(true);
                                  }}
                                  style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 5, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "#fff" }}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                </button>
                                <button title="Excluir"
                                  onClick={() => setGaDeleteId(row.id)}
                                  style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 5, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "#fff" }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* footer bar */}
            <div className="shrink-0 flex items-center px-4 py-2.5 border-t" style={{ background: "#3d6e8e" }} />
          </div>
        ) : isDesempenho ? (
          <DesempenhoContent rotas={todasRotas} />
        ) : activeMain === "Liq. Períodos" ? (
          <LiqPeriodosContent activeSub={activeSubPeriodos} selectedEstado={selectedEstado} estadosData={estadosData} onCloseDropdown={() => setEstadoDropdownOpen(false)} />
        ) : activeMain === "Consolidados" ? (
          <ConsolidadosContent />
        ) : showPagamentos ? (
          <PagamentosContent />
        ) : showEmprestimos ? (
          <EmprestimosNovosContent />
        ) : showDespesas ? (
          <DespesasContent />
        ) : showRendimentos ? (
          <RendimentosContent />
        ) : showClientes ? (
          <ClientesContent />
        ) : showAgendados ? (
          <AgendadosContent rotas={todasRotas} />
        ) : showRelatorios ? (
          <RelatóriosContent rotas={todasRotas} />
        ) : showContent ? (
          <>
            {/* LEFT: Tree */}
            <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto" onClick={() => setEstadoDropdownOpen(false)}>
              {!hasSearched ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
                  <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, fill: "#cbd5e1" }}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  <p className="text-xs text-gray-400 leading-relaxed">Pesquise um estado ou rota para visualizar</p>
                </div>
              ) : (<>
              <div className="px-3 py-2 flex items-center gap-1.5 text-gray-800 font-bold text-sm cursor-pointer hover:bg-gray-50"
                onClick={e => { e.stopPropagation(); setCollapsedEstadoMain(v => !v); }}>
                {collapsedEstadoMain
                  ? <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                  : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                {selectedEstado.charAt(0).toUpperCase() + selectedEstado.slice(1).toLowerCase()}
              </div>
              {!collapsedEstadoMain && (() => {
                const allItems = estadosData[selectedEstado] ?? [];
                const cidades = Array.from(new Set(allItems.map(i => i.cidade)));
                return cidades.map(cidade => {
                  const rotas = allItems.filter(i => i.cidade === cidade);
                  return (
                    <div key={cidade}>
                      <div className="pl-6 py-2 flex items-center gap-1.5 text-gray-600 text-sm cursor-pointer hover:bg-gray-50"
                        onClick={e => { e.stopPropagation(); toggleCidadeMain(cidade); }}>
                        {collapsedCidades.has(cidade)
                          ? <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                          : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>}
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-500 shrink-0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-400 shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        {cidade}
                      </div>
                      {!collapsedCidades.has(cidade) && rotas.map((rota, ri) => (
                        <div key={ri} onClick={() => {
                          setSelectedRota(rota.vendedor);
                          const todasCidades = Array.from(new Set((estadosData[selectedEstado] ?? []).map(i => i.cidade)));
                          setCollapsedCidades(new Set(todasCidades.filter(c => c !== cidade)));
                        }}
                          className="pl-12 py-1.5 flex items-center pr-2 cursor-pointer hover:bg-blue-50 border-l-2"
                          style={{ borderColor: selectedRota === rota.vendedor ? "#2563eb" : "#3b82f6", background: selectedRota === rota.vendedor ? "#eff6ff" : undefined }}>
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-gray-500 shrink-0 mr-1.5"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                          <span className="text-gray-700 text-xs flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{rota.vendedor}</span>
                          <span className={`ml-1.5 shrink-0 text-[10px] px-1.5 py-0.5 rounded font-semibold text-white ${rota.ativa ? "bg-green-500" : "bg-red-500"}`}>{rota.data}</span>
                        </div>
                      ))}
                    </div>
                  );
                });
              })()}
              </>)}
            </div>

            {/* CENTER: Grouped data rows */}
            <div className="flex-1 overflow-y-auto border-r border-gray-200" style={{ background: "#f8fafc" }}>
              {!selectedRota ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                  <svg viewBox="0 0 24 24" style={{ width: 48, height: 48, fill: "#cbd5e1" }}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                  <p className="text-sm font-medium text-gray-500">Selecione uma rota e o período</p>
                  <p className="text-xs text-gray-400">Clique em qualquer rota na árvore à esquerda</p>
                </div>
              ) : (() => {
                const rd = importedRotaData[selectedRota] ?? rotasFakeData[selectedRota];
                if (!rd) return (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                    <svg viewBox="0 0 24 24" style={{ width: 48, height: 48, fill: "#cbd5e1" }}><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                    <p className="text-sm font-medium text-gray-500">Sem dados para esta rota</p>
                    <p className="text-xs text-gray-400">Importe o arquivo XLS da rota no painel direito</p>
                  </div>
                );
                const fmtV = (n: number) => `$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                const pct = rd.recebPrevisto > 0 ? Math.round((rd.recebAtual / rd.recebPrevisto) * 100) : 0;
                const pctBg = pct >= 80 ? "#dbeafe" : pct >= 50 ? "#fef3c7" : "#fee2e2";
                const pctTxt = pct >= 80 ? "#1d4ed8" : pct >= 50 ? "#d97706" : "#dc2626";
                const totalClientes = rd.clientesIniciais + rd.clientesNovos;
                return (<>
                  <SectionHeader title="Dados da Rota" color="#2563eb" />
                  <Row label="Cobrador" index={0}>
                    <strong className="text-gray-800">{rd.cobradorNome || selectedRota}</strong>&nbsp;— Cod: {rd.cod}
                    <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer ml-1">XLS</span>
                  </Row>
                  <Row label="Data de Início de Cobrança" index={1}>
                    <CalIcon />
                    <span className="bg-cyan-500 text-white px-2 rounded text-[11px] font-medium">{rd.dataInicio}</span>
                  </Row>
                  <Row label="Data de Fechamento de Cobrança" index={2}>
                    <CalIcon />
                    {rd.dataFechamento
                      ? <span className="bg-red-100 text-red-700 px-2 rounded text-[11px] font-medium">{rd.dataFechamento}</span>
                      : <span className="text-amber-600 font-medium">Sistema sem Fechar</span>}
                  </Row>
                  <Row label="Último Acesso Móvel" index={3}>
                    <CalIcon /> {rd.ultimoAcesso}
                  </Row>

                  <SectionHeader title="Clientes" color="#16a34a" />
                  <Row label="Clientes Iniciais" index={0}>
                    <PersonIcon /> <strong className="text-gray-800">{rd.clientesIniciais}</strong>
                    <span className="text-gray-400 text-[11px]">( {rd.sincronizados} Sincronizados / {rd.clientesIniciais} )</span>
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-blue-400 cursor-pointer shrink-0"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                  </Row>
                  <Row label="Clientes Novos" index={1}>
                    <PersonIcon /> <strong className="text-gray-800">{rd.clientesNovos}</strong> <span className="text-gray-400 text-[11px]">(0/{rd.clientesNovos})</span>
                  </Row>
                  <Row label="Clientes Renovados" index={2}>
                    <PersonIcon /> <strong className="text-gray-800">{rd.renovados}</strong>
                  </Row>
                  <Row label="Clientes Cancelados" index={3}>
                    <PersonIcon /> <strong className="text-gray-800">{rd.cancelados}</strong>
                  </Row>
                  <Row label="Total de Clientes" index={4}>
                    <PersonIcon /> <strong className="text-gray-800">{totalClientes}</strong>
                  </Row>

                  <SectionHeader title="Financeiro" color="#7c3aed" />
                  <Row label="Caixa Inicial" bold index={0}>
                    <span className="text-green-700">{fmtV(rd.caixaInicial)}</span>
                  </Row>
                  <Row label="Carteira Inicial" bold index={1}>
                    <span className="text-green-700">{fmtV(rd.carteiraInicial)}</span>
                  </Row>
                  <Row label="Recebimento Previsto do Dia" index={2}>
                    <span className="font-semibold text-gray-800">{fmtV(rd.recebPrevisto)}</span>
                    <span className="text-[11px] px-1.5 rounded font-medium" style={{ background: pctBg, color: pctTxt }}>{pct} %</span>
                  </Row>
                  <Row label="Recebimento Atual do Dia" index={3}>
                    <span className="font-semibold text-gray-800">{fmtV(rd.recebAtual)}</span>
                    <span className="text-[11px] px-1.5 rounded font-medium" style={{ background: pctBg, color: pctTxt }}>{pct.toFixed(1)} %</span>
                    <span className="text-[11px] text-gray-500">Pagos: <strong className="text-gray-800">{rd.pagos}</strong></span>
                    <span className="text-[11px] text-gray-500">No Pagos: <strong className="text-red-500">{rd.noPagos}</strong></span>
                  </Row>
                  <Row label="Recebimento por Tipo Pagto" index={4}>
                    <span className="text-[11px] text-gray-500">Efetivo:</span>
                    <span className="text-red-500 font-semibold">{fmtV(rd.efetivo)}</span>
                    <span className="text-gray-300 mx-0.5">|</span>
                    <span className="text-[11px] text-gray-500">Transferência:</span>
                    <span className="text-red-500 font-semibold">{fmtV(rd.transferencia)}</span>
                  </Row>
                  <Row label="Novos Empréstimos" index={5}>
                    <span className="font-semibold text-gray-800">{fmtV(rd.novosEmp)}</span>
                    <span className="text-gray-400 text-[11px]">( Juros: {fmtV(rd.juros)} )</span>
                  </Row>
                  <Row label="Rendimentos" index={6}>
                    <span className="text-blue-600 font-bold text-sm">+</span>
                    <span className="font-semibold text-blue-700">{rd.rendimentos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </Row>
                  <Row label="Despesas" index={7}>
                    <span className="text-gray-500 font-bold text-sm">−</span>
                    <span className="font-semibold text-gray-600">{rd.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </Row>
                  <Row label="Retirada de Caixa" index={8}>
                    <span className="text-gray-500 font-bold text-sm">−</span>
                    <span className="font-semibold text-gray-600">{rd.retirada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </Row>
                  <Row label="Caixa Final" bold index={9}>
                    <span className="text-green-700">{fmtV(rd.caixaFinal)}</span>
                    <span className="text-red-400 text-sm cursor-pointer ml-1" title="Detalhes do cálculo">❓</span>
                  </Row>
                  <div className="flex items-center mx-2 mt-0.5 mb-1.5 rounded px-3 py-2"
                    style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderLeftWidth: 4, borderLeftColor: "#16a34a" }}>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Carteira Final</span>
                    <span className="text-[11px] text-gray-400 ml-2">( Sanção: {rd.sancao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} )</span>
                    <div className="flex-1" />
                    <span className="text-base font-bold text-green-700">{fmtV(rd.carteiraFinal)}</span>
                  </div>
                </>);
              })()}
            </div>

            {/* RIGHT: Action buttons — só aparece quando uma rota está selecionada */}
            {selectedRota && (
              <div style={{ width:210, flexShrink:0, background:"#f1f5f9", display:"flex",
                  flexDirection:"column", gap:7, padding:"12px 10px", overflowY:"auto",
                  borderLeft:"1px solid #e2e8f0" }}>
                {([
                  { icon:<img src="/icon-config.png" alt="" style={{ width:16, height:16, filter:"invert(30%) sepia(60%) saturate(500%) hue-rotate(180deg) brightness(60%)", flexShrink:0 }} />, label:"Configurações", accent:"#2d5474", onClick: () => setConfigOpen(true) },
                  { icon:<img src="/icon-relatorio6.png" alt="" style={{ width:16, height:16, flexShrink:0, filter:"invert(30%) sepia(60%) saturate(500%) hue-rotate(180deg) brightness(60%)" }} />, label:"Relatório Geral", accent:"#1d4ed8", onClick: () => setActiveMain("Consolidados") },
                  { icon:<img src="/icon-clientes3.png" alt="" style={{ width:16, height:16, flexShrink:0 }} />, label:"Lista Clientes", accent:"#0369a1", onClick: () => setListaClientesOpen(true) },
                  { icon: caixaAberto ? <img src="/icon-fechar-caixa.png" alt="" style={{ width:18, height:18, flexShrink:0, objectFit:"contain" }} /> : <img src="/icon-abrir-caixa.png" alt="" style={{ width:18, height:18, flexShrink:0, objectFit:"contain" }} />,
                    label: caixaAberto ? "Fechar Caixa" : "Abrir Caixa",
                    accent: caixaAberto ? "#dc2626" : "#16a34a",
                    onClick: caixaAberto
                      ? () => setCaixaModalOpen(true)
                      : async () => {
                          if (!selectedRota) return;
                          try {
                            const r = await fetch(`${import.meta.env.BASE_URL}api/caixa/reabrir`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ rota: selectedRota }),
                            });
                            if (r.ok) { setCaixaAberto(true); }
                          } catch {}
                        } },
                  { icon:<ClipboardCheck size={16} color="#7c3aed" strokeWidth={2} style={{ flexShrink:0 }} />, label:"Código Aprovações", accent:"#7c3aed", onClick: () => setCodigosOpen(true) },
                ] as { icon:React.ReactNode; label:string; accent:string; onClick:()=>void }[]).map(item => (
                  <button key={item.label} onClick={item.onClick}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"11px 12px",
                      background:"#fff", border:`1px solid ${item.accent}30`,
                      borderLeft:`4px solid ${item.accent}`, borderRadius:8,
                      cursor:"pointer", textAlign:"left",
                      boxShadow:"0 1px 4px rgba(0,0,0,.09)", transition:"all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background=`${item.accent}10`; e.currentTarget.style.boxShadow=`0 3px 10px ${item.accent}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.09)"; }}>
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:18, height:18, flexShrink:0, fontSize:16, lineHeight:1 }}>{item.icon}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#1e293b", letterSpacing:".01em" }}>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
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

      {/* ── MODAL: Aprovação de Acesso ── */}
      {gaAprovId !== null && (() => {
        const row = gaRows.find(r => r.id === gaAprovId);
        const pendentes = gaSolicitacoes.filter(s => s.aplicativoId === gaAprovId && s.status === "pendente");
        if (!row || pendentes.length === 0) { setGaAprovId(null); return null; }
        const sol = pendentes[0];
        const tipoLabel = sol.tipo === "troca_dispositivo" ? "Troca de Dispositivo" : "Primeiro Acesso";
        const dataStr = sol.solicitadoEm ? new Date(sol.solicitadoEm).toLocaleString("pt-BR") : "—";
        const aprovar = async () => {
          await fetch(`/api/solicitacoes/${sol.id}/aprovar`, { method: "PATCH" });
          await fetchSolicitacoes(); await gaFetch(); setGaAprovId(null);
        };
        const rejeitar = async () => {
          await fetch(`/api/solicitacoes/${sol.id}/rejeitar`, { method: "PATCH" });
          await fetchSolicitacoes(); setGaAprovId(null);
        };
        const desvincular = async () => {
          if (!confirm("Desvincular o dispositivo permitirá que outro celular seja registrado. Continuar?")) return;
          await fetch(`/api/aplicativos/${gaAprovId}/dispositivo`, { method: "DELETE" });
          await gaFetch(); setGaAprovId(null);
        };
        return (
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <div style={{ background:"#fff",borderRadius:12,padding:"28px 32px",minWidth:380,maxWidth:480,boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
                <div style={{ width:36,height:36,borderRadius:"50%",background:"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <svg viewBox="0 0 24 24" style={{ width:20,height:20,fill:"#d97706" }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                </div>
                <div>
                  <p style={{ margin:0,fontSize:15,fontWeight:700,color:"#1e293b" }}>Solicitação de Acesso</p>
                  <p style={{ margin:0,fontSize:12,color:"#64748b" }}>{tipoLabel}</p>
                </div>
              </div>
              <div style={{ background:"#f8fafc",borderRadius:8,padding:"14px 16px",marginBottom:20,display:"flex",flexDirection:"column",gap:8 }}>
                {[
                  ["Rota", row.rota],
                  ["Nome do cobrador", sol.cobradorNome],
                  ["Código informado", sol.codigoAcesso],
                  ["ID do dispositivo", sol.deviceId.slice(0, 20) + "…"],
                  ["Data da solicitação", dataStr],
                ].map(([label, val]) => (
                  <div key={label} style={{ display:"flex",justifyContent:"space-between",gap:12 }}>
                    <span style={{ fontSize:12,color:"#64748b",whiteSpace:"nowrap" }}>{label}</span>
                    <span style={{ fontSize:12,fontWeight:600,color:"#1e293b",textAlign:"right",wordBreak:"break-all" }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",gap:8,marginBottom:10 }}>
                <button onClick={aprovar}
                  style={{ flex:1,background:"#16a34a",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                  ✓ Aprovar
                </button>
                <button onClick={rejeitar}
                  style={{ flex:1,background:"#dc2626",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                  ✕ Rejeitar
                </button>
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={desvincular}
                  style={{ flex:1,background:"#f1f5f9",color:"#475569",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 0",fontSize:12,fontWeight:600,cursor:"pointer" }}>
                  🔓 Desvincular dispositivo
                </button>
                <button onClick={() => setGaAprovId(null)}
                  style={{ flex:1,background:"#f1f5f9",color:"#475569",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 0",fontSize:12,fontWeight:600,cursor:"pointer" }}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL: Configurações ── */}
      {configOpen && <ConfiguracoesModal onClose={() => setConfigOpen(false)} />}

      {/* ── MODAL: Lista Clientes ── */}
      {listaClientesOpen && <ListaClientesModal onClose={() => setListaClientesOpen(false)} />}

      {/* ── MODAL: Códigos de Aprovação ── */}
      {codigosOpen && <CodigosAprovacaoModal onClose={() => setCodigosOpen(false)} />}

      {/* ── MODAL: Lucro ── */}
      {lucroOpen && <LucroModal onClose={() => setLucroOpen(false)} />}

      {/* ── MODAL: Caixa ── */}
      {caixaModalOpen && (
        <CaixaModal
          aberto={caixaAberto}
          onConfirm={async () => {
            const agora = new Date().toLocaleString("pt-BR");
            if (caixaAberto) {
              setDataFechamentoCaixa(agora);
              if (selectedRota) {
                await fetch(`${import.meta.env.BASE_URL}api/caixa/fechar-admin`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ rota: selectedRota }),
                }).catch(() => {});
              }
            } else {
              setDataFechamentoCaixa(null);
              if (selectedRota) {
                await fetch(`${import.meta.env.BASE_URL}api/caixa/reabrir`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ rota: selectedRota }),
                }).catch(() => {});
              }
            }
            setCaixaAberto(a => !a);
            setCaixaModalOpen(false);
          }}
          onClose={() => setCaixaModalOpen(false)}
        />
      )}

      {/* ── MODAL: Confirmar Exclusão ── */}
      {gaDeleteId !== null && (() => {
        const row = gaRows.find(r => r.id === gaDeleteId);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 8, width: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", overflow: "hidden" }}>
              <div style={{ background: "#dc2626", padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, fill: "#fff", flexShrink: 0 }}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Confirmar Exclusão</span>
              </div>
              <div style={{ padding: "20px 20px 8px" }}>
                <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>Tem certeza que deseja excluir o aplicativo:</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "8px 0 4px" }}>"{row?.rota}"</p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Cobrador: {row?.cobrador}</p>
                <p style={{ fontSize: 11, color: "#ef4444", marginTop: 12, padding: "8px 10px", background: "#fef2f2", borderRadius: 5, borderLeft: "3px solid #dc2626" }}>
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px 16px" }}>
                <button onClick={() => setGaDeleteId(null)}
                  style={{ height: 34, padding: "0 20px", borderRadius: 5, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={async () => {
                  await fetch(`/api/aplicativos/${gaDeleteId}`, { method: "DELETE" });
                  setGaDeleteId(null);
                  gaFetch();
                  fetchRotasAPI();
                }}
                  style={{ height: 34, padding: "0 20px", borderRadius: 5, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL: Criação de Aplicativo ── */}
      {gaModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 60 }}>
          <div style={{ background: "#fff", borderRadius: 6, width: "100%", maxWidth: 820, boxShadow: "0 8px 32px rgba(0,0,0,0.22)", overflow: "hidden" }}>
            {/* header */}
            <div style={{ background: "#3d6e8e", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.03em" }}>{gaEditId !== null ? "Editar Aplicativo" : "Criação de Aplicativo"}</span>
              <button onClick={() => setGaModalOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>

            {/* body */}
            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Row 1: Rota | Nome Cobrador | Data Vencimento */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>Rota <span style={{ color: "#dc2626" }}>(*)</span></label>
                  <input value={gaForm.empresa} onChange={e => setGaForm(f => ({ ...f, empresa: e.target.value }))} placeholder="Nome da rota"
                    style={{ height: 30, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 12, color: "#374151", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>Nome Cobrador:</label>
                  <input value={gaForm.nome} onChange={e => setGaForm(f => ({ ...f, nome: e.target.value }))} placeholder=""
                    style={{ height: 30, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 12, color: "#374151", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>Data Vencimento:</label>
                  <input type="date" value={gaForm.vencimento} onChange={e => setGaForm(f => ({ ...f, vencimento: e.target.value }))}
                    style={{ height: 30, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 12, color: "#374151", outline: "none" }} />
                </div>
              </div>

              {/* Row 2: Valor Venda Máx | Saldo Inicial | Estado | Cidade */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>Valor Venda Máxima:</label>
                  <input value={gaForm.valorMax} onChange={e => setGaForm(f => ({ ...f, valorMax: e.target.value }))}
                    style={{ height: 30, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 12, color: "#374151", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>Saldo Inicial <span style={{ color: "#dc2626" }}>(*)</span></label>
                  <input value={gaForm.saldoInicial} onChange={e => setGaForm(f => ({ ...f, saldoInicial: e.target.value }))}
                    style={{ height: 30, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 12, color: "#374151", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>Estado (UF):</label>
                  <select value={gaForm.estadoUF} onChange={e => setGaForm(f => ({ ...f, estadoUF: e.target.value, cidade: "" }))}
                    style={{ height: 30, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 12, color: "#374151", outline: "none" }}>
                    <option value="">-- Selecione --</option>
                    {["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>Cidade:</label>
                  <select value={gaForm.cidade} onChange={e => setGaForm(f => ({ ...f, cidade: e.target.value }))}
                    disabled={!gaForm.estadoUF || gaCidadesLoading}
                    style={{ height: 30, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 12, color: gaForm.estadoUF ? "#374151" : "#9ca3af", outline: "none", background: gaForm.estadoUF ? "#fff" : "#f9fafb" }}>
                    <option value="">
                      {!gaForm.estadoUF ? "Selecione o estado primeiro" : gaCidadesLoading ? "Carregando..." : "-- Selecione --"}
                    </option>
                    {gaCidades.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section: Informação de Acesso */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>Informação de Acesso ao Sistema APP</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>Código de Acesso:</label>
                  <input value={gaForm.codigoAcesso} onChange={e => setGaForm(f => ({ ...f, codigoAcesso: e.target.value }))}
                    style={{ height: 30, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 12, color: "#374151", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>Confirmar Código de Acesso:</label>
                  <input value={gaForm.confirmarCodigo} onChange={e => setGaForm(f => ({ ...f, confirmarCodigo: e.target.value }))}
                    style={{ height: 30, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 12, color: "#374151", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>Estado:</label>
                  <select value={gaForm.estado} onChange={e => setGaForm(f => ({ ...f, estado: e.target.value }))}
                    style={{ height: 30, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 8px", fontSize: 12, color: "#374151", outline: "none" }}>
                    <option>Ativo</option>
                    <option>Inativo</option>
                  </select>
                </div>
              </div>

              {/* action buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
                <button onClick={() => { setGaModalOpen(false); setGaEditId(null); setGaForm(emptyGaForm); }}
                  style={{ height: 32, padding: "0 18px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={async () => {
                  if (!gaForm.empresa || !gaForm.codigoAcesso || !gaForm.vencimento) return;
                  const body = {
                    rota: gaForm.empresa,
                    cobradorNome: gaForm.nome,
                    codigoAcesso: gaForm.codigoAcesso,
                    vencimento: gaForm.vencimento,
                    valorVendaMax: gaForm.valorMax || "0",
                    saldoInicial: gaForm.saldoInicial || "0",
                    estado: gaForm.estadoUF || null,
                    cidade: gaForm.cidade || null,
                    ativo: gaForm.estado === "Ativo",
                  };
                  if (gaEditId !== null) {
                    await fetch(`/api/aplicativos/${gaEditId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                  } else {
                    await fetch("/api/aplicativos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                  }
                  setGaModalOpen(false); setGaEditId(null); setGaForm(emptyGaForm);
                  gaFetch();
                  fetchRotasAPI();
                }}
                  style={{ height: 32, padding: "0 20px", borderRadius: 4, border: "none", background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Buscar Rota ── */}
      {buscarRotaOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 6, width: "100%", maxWidth: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", overflow: "hidden" }}>
            <div style={{ background: "#3d6e8e", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Buscar Rota</span>
              <button onClick={() => setBuscarRotaOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Nome da Rota:</label>
                <input value={buscarRotaForm.nome} onChange={e => setBuscarRotaForm(f => ({ ...f, nome: e.target.value }))}
                  style={{ height: 34, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 10px", fontSize: 13, color: "#374151", outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Código da Rota:</label>
                <input value={buscarRotaForm.codigo} onChange={e => setBuscarRotaForm(f => ({ ...f, codigo: e.target.value }))}
                  style={{ height: 34, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 10px", fontSize: 13, color: "#374151", outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Estado de Fechamento:</label>
                <select value={buscarRotaForm.estadoFechamento} onChange={e => setBuscarRotaForm(f => ({ ...f, estadoFechamento: e.target.value }))}
                  style={{ height: 34, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 10px", fontSize: 13, color: "#374151", outline: "none", width: "100%" }}>
                  <option value="">-- Estado --</option>
                  <option value="aberto">Aberto</option>
                  <option value="fechado">Fechado</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Estado (UF) <span style={{ color: "#dc2626" }}>(*)</span>:</label>
                <select value={buscarRotaForm.uf} onChange={e => setBuscarRotaForm(f => ({ ...f, uf: e.target.value }))}
                  style={{ height: 34, border: "1px solid #d1d5db", borderRadius: 4, padding: "0 10px", fontSize: 13, color: "#374151", outline: "none", width: "100%" }}>
                  <option value="">--- Selecione ---</option>
                  {["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 24px 18px", borderTop: "1px solid #f1f5f9" }}>
              <button onClick={() => setBuscarRotaOpen(false)}
                style={{ height: 34, padding: "0 20px", borderRadius: 4, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={() => setBuscarRotaOpen(false)}
                style={{ height: 34, padding: "0 24px", borderRadius: 4, border: "none", background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Buscar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
