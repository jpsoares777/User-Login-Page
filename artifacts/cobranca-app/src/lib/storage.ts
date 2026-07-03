const DB_KEY = "cobranca_db_v2";
const FOTOS_KEY = "cobranca_fotos_v1";
const CONSEC_KEY = "cobranca_consecutivos_v1";

export interface FotoRecord {
  id: number;
  nome: string;
  base64: string;
}

export function loadFotos(): Record<number, FotoRecord[]> {
  try {
    const raw = localStorage.getItem(FOTOS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, FotoRecord[]>;
  } catch {
    return {};
  }
}

export function saveFotoCliente(clienteId: number, fotos: FotoRecord[]) {
  try {
    const current = loadFotos();
    current[clienteId] = fotos;
    localStorage.setItem(FOTOS_KEY, JSON.stringify(current));
  } catch {}
}

export async function compressToBase64(file: File, maxWidth = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface AppDB {
  lastDate: string;
  cobrados: number[];
  ausentes: number[];
  cobradosValores: { id: number; valor: number }[];
  registroPagamentos: Record<number, { id: number; data: string; parcela: number; valor: number; metodo: string }[]>;
  historicoPagamentos: Record<number, { id: number; data: string; parcela: number; valor: number; metodo: string }[]>;
  quitadosClientes: unknown[];
  ordemClientesIds: number[];
  cobradosExtras: unknown[];
  emprestimentos: unknown[];
  novosClientesIds: number[];
  renovacoesIds: number[];
  clientesAdicionaisHoje: unknown[];
  novosClientesOutras: unknown[];
  agendamentos: unknown[];
  despesas: unknown[];
  rendimentos: unknown[];
  clientes: unknown[];
  caixaInicial: number;
  historicoCreditos: Record<number, unknown[]>;
  caixaFechadoData?: string;
  caixaInicialPreFechamento?: number;
  fechamentoDia?: string;
  caixaFinal?: number;
}

export function loadDB(): AppDB | null {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppDB;
  } catch {
    return null;
  }
}

export function saveDB(data: Partial<AppDB>) {
  try {
    const current = loadDB() ?? {};
    localStorage.setItem(DB_KEY, JSON.stringify({ ...current, ...data }));
  } catch {}
}

// Registro persistente de TODOS os números consecutivos já gerados nesta rota.
// Nunca é apagado — assim o número nunca se repete, mesmo para empréstimos
// cancelados, inativos ou ativos.
function loadConsecutivos(): string[] {
  try {
    const raw = localStorage.getItem(CONSEC_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

// Coleta consecutivos já presentes nos dados locais (empréstimos e clientes,
// incluindo ativos, quitados/inativos e adicionais). Serve para reconstruir o
// conjunto de usados mesmo que o registro dedicado tenha sido perdido/limpo.
function coletarConsecutivosExistentes(): string[] {
  const out: string[] = [];
  try {
    const db = loadDB();
    if (!db) return out;
    const buckets: unknown[] = [
      ...(Array.isArray(db.emprestimentos) ? db.emprestimentos : []),
      ...(Array.isArray(db.clientes) ? db.clientes : []),
      ...(Array.isArray(db.quitadosClientes) ? db.quitadosClientes : []),
      ...(Array.isArray(db.clientesAdicionaisHoje) ? db.clientesAdicionaisHoje : []),
      ...(Array.isArray(db.novosClientesOutras) ? db.novosClientesOutras : []),
    ];
    for (const item of buckets) {
      const c = (item as { consecutivo?: unknown })?.consecutivo;
      if (typeof c === "string" && c) out.push(c);
    }
  } catch {}
  return out;
}

// Gera um número de identificação único de 10 dígitos, garantindo que não
// se repita com nenhum outro empréstimo já registrado nesta rota.
export function gerarConsecutivoUnico(): string {
  const usados = loadConsecutivos();
  // União do registro dedicado + consecutivos já existentes nos dados locais.
  const set = new Set<string>([...usados, ...coletarConsecutivosExistentes()]);
  let novo = "";
  let tentativas = 0;
  do {
    const primeiro = Math.floor(Math.random() * 9) + 1; // 1-9 (não começa com 0)
    let resto = "";
    for (let i = 0; i < 9; i++) resto += Math.floor(Math.random() * 10);
    novo = `${primeiro}${resto}`;
    tentativas++;
  } while (set.has(novo) && tentativas < 100000);
  try {
    usados.push(novo);
    localStorage.setItem(CONSEC_KEY, JSON.stringify(usados));
  } catch {}
  return novo;
}

export function clearDB() {
  try {
    localStorage.removeItem(DB_KEY);
  } catch {}
}

export function getTodayStr() {
  return new Date().toLocaleDateString("pt-BR");
}
