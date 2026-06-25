const API_BASE = "/api";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function getCobradorId(): number | null {
  const v = localStorage.getItem("cobrador_id");
  return v ? parseInt(v, 10) : null;
}

export function setCobradorId(id: number) {
  localStorage.setItem("cobrador_id", String(id));
}

export function getRotaSessao(): { rota: string; cobradorNome: string } | null {
  const rota = localStorage.getItem("sessao_rota");
  const cobradorNome = localStorage.getItem("sessao_cobrador_nome");
  if (!rota || !cobradorNome) return null;
  return { rota, cobradorNome };
}

export function setRotaSessao(rota: string, cobradorNome: string) {
  localStorage.setItem("sessao_rota", rota);
  localStorage.setItem("sessao_cobrador_nome", cobradorNome);
}

export type AplicativoSessao = {
  id: number;
  rota: string;
  cobradorNome: string;
  vencimento: string;
};

export async function loginPorCodigo(codigo: string): Promise<AplicativoSessao> {
  const res = await fetch(`${API_BASE}/aplicativos/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Código de acesso inválido");
  }
  return res.json();
}

export type ClienteAPI = {
  id: number;
  nome: string;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
};

export type CobradorAPI = {
  id: number;
  nome: string;
  rota: string | null;
};

export type EmprestimoAPI = {
  id: number;
  clienteId: number;
  clienteNome: string | null;
  cobradorId: number;
  valorParcela: string;
  numParcelas: number;
  frequencia: string;
  status: string;
  dataInicio: string;
};

export async function fetchCobradores(): Promise<CobradorAPI[]> {
  try {
    return await apiGet<CobradorAPI[]>("/cobradores");
  } catch {
    return [];
  }
}

export async function fetchClientesAPI(): Promise<ClienteAPI[]> {
  try {
    return await apiGet<ClienteAPI[]>("/clientes");
  } catch {
    return [];
  }
}

export async function fetchEmprestimosDoCobradorAPI(cobradorId: number): Promise<EmprestimoAPI[]> {
  try {
    return await apiGet<EmprestimoAPI[]>(`/emprestimos?cobradorId=${cobradorId}&status=aberto`);
  } catch {
    return [];
  }
}

export async function postPagamentoAPI(data: {
  emprestimoId: number;
  clienteId: number;
  cobradorId: number;
  valor: number;
  dataPagamento: string;
  formaPagamento: string;
  obs?: string;
}): Promise<boolean> {
  try {
    await apiPost("/pagamentos", data);
    return true;
  } catch {
    return false;
  }
}

export async function postMovimentoCaixaAPI(data: {
  cobradorId: number;
  tipo: "entrada" | "saida";
  categoria: string;
  valor: number;
  observacao?: string;
  data: string;
}): Promise<boolean> {
  try {
    await apiPost("/caixa/movimentos", data);
    return true;
  } catch {
    return false;
  }
}

export async function postNovoClienteAPI(data: {
  nome: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
}): Promise<{ id: number } | null> {
  try {
    return await apiPost<{ id: number }>("/clientes", data);
  } catch {
    return null;
  }
}

export async function postNovoEmprestimoAPI(data: {
  clienteId: number;
  cobradorId: number;
  valorProduto: number;
  totalAPagar: number;
  numParcelas: number;
  valorParcela: number;
  frequencia: string;
  dataInicio: string;
  jurosPct?: number;
}): Promise<boolean> {
  try {
    await apiPost("/emprestimos", data);
    return true;
  } catch {
    return false;
  }
}
