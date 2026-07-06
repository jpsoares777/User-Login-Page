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
  valorVendaMax: number;
  codigoAcesso: string;
};

export function getCodigoAcesso(): string | null {
  return localStorage.getItem("sessao_codigo_acesso");
}

export function setCodigoAcesso(codigo: string) {
  localStorage.setItem("sessao_codigo_acesso", codigo);
}

// Limite máximo de empréstimo/renovação (0 = sem limite / desativado).
export function getValorVendaMax(): number {
  const v = localStorage.getItem("sessao_valor_venda_max");
  return v ? parseFloat(v) : 0;
}

export function setValorVendaMax(valor: number) {
  localStorage.setItem("sessao_valor_venda_max", String(valor));
}

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

// Um empréstimo NOVO (ou renovação) criado hoje. Alimenta a aba "Novos
// Empréstimos" da web em tempo real.
export type EmprestimoNovoSnapshot = {
  id: number;
  consec: string;
  freq: string;
  valorAnt: number;
  cliente: string;
  tag: "Novo" | "Renovado";
  documento: string;
  celular: string;
  valorProd: number;      // valor emprestado (principal)
  parcelas: number;
  pctJuros: number;
  valorJuros: number;
  valorParcela: number;
  dataVenda: string;      // "AAAA-MM-DD HH:mm:ss"
  parcRest: number;
  saldo: number;          // dívida total (principal + juros)
  numSeguro: string;
  vrSeguro: number;
  chaveAutor: string;
};

// Um lançamento financeiro (despesa ou rendimento) do dia. Alimenta as abas
// "Despesas" e "Rendimentos" da web.
export type LancamentoSnapshot = {
  id: number;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  hora: string;
  responsavel: string;
  obs: string;
};

export type AgendadoSnapshot = {
  id: number;
  data: string;
  hora: string;
  observacao: string;
  nomeCliente: string;
};

// Um cliente da carteira da rota. Alimenta a aba "Clientes" da web.
export type ClienteSnapshot = {
  id: number;
  consec: string;
  status: string;
  visitas: number;
  nome: string;
  tel1: string;
  tel2: string;
  freq: string;
  valorVenda: number;
  pctJuros: number;
  total: number;
  cuotas: number;
  atrasadas: number;
  pagas: number;
  restantes: number;
  vlrCuota: number;
  saldo: number;
  documento: string;
  dataNasc: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estadoVerif: string;
  nroSeguro: string;
  valorSeguro: number;
  nomeCodedor: string;
  telCodedor: string;
  dirCodedor: string;
  observacoes: string;
  dataEmprestimo: string;
  historico: { data: string; valor: number; total: number; cuotas: number; status: string }[];
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
  novosEmprestimos?: EmprestimoNovoSnapshot[];
  despesasLista?: LancamentoSnapshot[];
  rendimentosLista?: LancamentoSnapshot[];
  clientesLista?: ClienteSnapshot[];
  agendadosLista?: AgendadoSnapshot[];
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

// ── Solicitações de empréstimo (acima do limite) ──────────────────────────
export type SolicitacaoEmprestimoStatus = "pendente" | "aceito" | "recusado";

export type SolicitacaoEmprestimoAPI = {
  id: number;
  codigoAcesso: string;
  cobradorNome: string;
  tipo: string;
  clienteNome: string;
  valorEmprestimo: string;
  totalPagar: string;
  jurosPct: string;
  jurosValor: string;
  numParcelas: number;
  valorParcela: string;
  localId: string | null;
  consecutivo: string | null;
  payload: unknown;
  status: SolicitacaoEmprestimoStatus;
};

export async function postSolicitacaoEmprestimoAPI(data: {
  tipo: string;
  clienteNome: string;
  valorEmprestimo: number;
  totalPagar: number;
  jurosPct: number;
  jurosValor: number;
  numParcelas: number;
  valorParcela: number;
  localId: string;
  consecutivo?: string;
  payload: unknown;
}): Promise<SolicitacaoEmprestimoAPI | null> {
  const codigoAcesso = getCodigoAcesso();
  if (!codigoAcesso) return null;
  const sessao = getRotaSessao();
  const deviceId = getOrCreateDeviceId();
  try {
    return await apiPost<SolicitacaoEmprestimoAPI>("/solicitacoes-emprestimo", {
      ...data,
      codigoAcesso,
      cobradorNome: sessao?.cobradorNome ?? "",
      deviceId,
    });
  } catch {
    return null;
  }
}

// O app consulta o status das próprias solicitações (por código de acesso).
export async function fetchSolicitacoesEmprestimoAPI(): Promise<SolicitacaoEmprestimoAPI[]> {
  const codigoAcesso = getCodigoAcesso();
  if (!codigoAcesso) return [];
  try {
    return await apiGet<SolicitacaoEmprestimoAPI[]>(`/solicitacoes-emprestimo?codigoAcesso=${encodeURIComponent(codigoAcesso)}`);
  } catch {
    return [];
  }
}

// Configurações globais definidas no admin (modal "Configurações"). Os limites
// de aprovação (novos empréstimos e renovações) vêm daqui e valem para todas as
// rotas. Retorna os limites já resolvidos (0 = sem limite / desativado).
export type LimitesAprovacao = { limiteNovo: number; limiteRenovacao: number };

const LIMITE_NOVO_KEY = "sessao_limite_novo";
const LIMITE_RENOV_KEY = "sessao_limite_renovacao";

// Último limite conhecido, persistido localmente. Serve de fallback fail-safe:
// no boot e em falhas de rede o gate usa o último valor válido em vez de cair
// para "sem limite" (o que deixaria passar empréstimos que exigem aprovação).
export function getLimitesAprovacaoCache(): LimitesAprovacao {
  const n = parseFloat(localStorage.getItem(LIMITE_NOVO_KEY) ?? "");
  const r = parseFloat(localStorage.getItem(LIMITE_RENOV_KEY) ?? "");
  return {
    limiteNovo: Number.isFinite(n) ? n : 0,
    limiteRenovacao: Number.isFinite(r) ? r : 0,
  };
}

export async function fetchLimitesAprovacaoAPI(): Promise<LimitesAprovacao> {
  try {
    const cfg = await apiGet<Record<string, any>>("/configuracoes");
    const rv = cfg?.restVals ?? {};
    const num = (v: unknown) => { const n = parseFloat(String(v ?? "0")); return Number.isFinite(n) ? n : 0; };
    const limites = {
      limiteNovo: rv.validarVendas ? num(rv.maxVendas) : 0,
      limiteRenovacao: rv.validarRenovacoes ? num(rv.maxRenovacoes) : 0,
    };
    localStorage.setItem(LIMITE_NOVO_KEY, String(limites.limiteNovo));
    localStorage.setItem(LIMITE_RENOV_KEY, String(limites.limiteRenovacao));
    return limites;
  } catch {
    // Falha de rede/API: preserva o último limite conhecido (fail-safe).
    return getLimitesAprovacaoCache();
  }
}
