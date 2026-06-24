const DB_KEY = "cobranca_db_v2";
const FOTOS_KEY = "cobranca_fotos_v1";

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

export function clearDB() {
  try {
    localStorage.removeItem(DB_KEY);
  } catch {}
}

export function getTodayStr() {
  return new Date().toLocaleDateString("pt-BR");
}
