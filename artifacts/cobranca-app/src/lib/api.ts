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

export function getSaldoInicial(): number {
  const v = localStorage.getItem("sessao_saldo_inicial");
  return v ? parseFloat(v) : 0;
}

export function setSaldoInicial(valor: number) {
  localStorage.setItem("sessao_saldo_inicial", String(valor));
}

export type AplicativoSessao = {
  id: number;
  rota: string;
  cobradorNome: string;
  vencimento: string;
  saldoInicial: number;
};

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("device_id", id);
  }
  return id;
}

export async function loginPorCodigo(codigo: string): Promise<AplicativoSessao> {
  const deviceId = getOrCreateDeviceId();
  const res = await fetch(`${API_BASE}/aplicativos/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo, deviceId }),
  });

  if (res.status === 202) {
    throw Object.assign(new Error("pendente"), { status: "pendente" });
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error ?? "Código de acesso inválido");
    if (body.status) Object.assign(err, { status: body.status });
    throw err;
  }
  return res.json();
}

export async function submitSolicitacao(codigoAcesso: string, cobradorNome: string): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  const res = await fetch(`${API_BASE}/solicitacoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigoAcesso, cobradorNome, deviceId }),
  });
  if (!res.ok && res.status !== 200 && res.status !== 201) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Erro ao enviar solicitação");
  }
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

export async function getCaixaAberto(cobradorId: number): Promise<boolean> {
  try {
    const data = await apiGet<unknown>(`/caixa/aberto?cobradorId=${cobradorId}`);
    return data !== null && data !== undefined;
  } catch {
    return false;
  }
}

// Um cliente COBRADO hoje (só entra aqui quem o cobrador efetivamente visitou:
// pagou, deu abono ou marcou "sem pagamento"). É o que a web mostra na aba
// Pagamentos em tempo real.
export type PagamentoClienteSnapshot = {
  id: number;
  status: string;      // "bom" | "ruim" | "alerta"
  consecutivo: string;
  cliente: string;
  obs: string;
  pagadas: string;
  tipo: string;        // "S/PAG." | "ABONO" | "PARC."
  formaPago: string;   // "" | "Dinheiro" | "PIX"
  valor: string;       // "80,00"
  fecha: string;
  hora: string;
  valorProd: string;   // valor total do empréstimo
  sancao: string;
  saldo: string;
  restantes: string;
  visitas: number;
  freq: string;
  // Histórico completo de pagamentos do cliente (todas as datas), para o
  // modal "Histórico de Pagamentos" da web.
  historico?: { nro: number; tipo: string; valor: number; fecha: string }[];
};

export type DadosSnapshot = {
  cod: number;
  dataInicio: string;
  dataFechamento: string;
  ultimoAcesso: string;
  clientesIniciais: number;
  sincronizados: number;
  clientesNovos: number;
  clientesNovosRegulares?: number;
  clientesNovosAdiantados?: number;
  renovados: number;
  cancelados: number;
  caixaInicial: number;
  carteiraInicial: number;
  recebPrevisto: number;
  recebAtual: number;
  pagos: number;
  noPagos: number;
  efetivo: number;
  transferencia: number;
  novosEmp: number;
  juros: number;
  rendimentos: number;
  despesas: number;
  retirada: number;
  caixaFinal: number;
  carteiraFinal: number;
  sancao: number;
  pagamentosClientes?: PagamentoClienteSnapshot[];
};

export async function postFechamentoCaixaAPI(data: {
  cobradorId: number;
  dataFechamento: string;
  saldoFinal: number;
  dadosSnapshot: DadosSnapshot;
}): Promise<boolean> {
  try {
    await apiPost("/caixa/fechar", data);
    return true;
  } catch {
    return false;
  }
}

// Envia o snapshot AO VIVO do caixa aberto para a web ver em tempo real
// (sem precisar fechar o caixa). Silencioso: se nao houver caixa aberto no
// servidor, apenas ignora.
export async function postSnapshotVivoAPI(data: {
  cobradorId: number;
  dadosSnapshot: DadosSnapshot;
}): Promise<boolean> {
  try {
    await apiPost("/caixa/snapshot-vivo", data);
    return true;
  } catch {
    return false;
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
