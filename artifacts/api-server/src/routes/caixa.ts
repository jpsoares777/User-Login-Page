import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, caixaTable, movimentosCaixaTable, aplicativosTable, comandosClienteTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/caixa", async (req, res): Promise<void> => {
  const { cobradorId } = req.query;
  if (!cobradorId) { res.status(400).json({ error: "cobradorId é obrigatório" }); return; }
  const rows = await db.select().from(caixaTable).where(eq(caixaTable.cobradorId, Number(cobradorId))).orderBy(caixaTable.dataAbertura);
  res.json(rows);
});

router.get("/caixa/aberto", async (req, res): Promise<void> => {
  const { cobradorId } = req.query;
  if (!cobradorId) { res.status(400).json({ error: "cobradorId é obrigatório" }); return; }
  const [caixa] = await db.select().from(caixaTable).where(
    and(eq(caixaTable.cobradorId, Number(cobradorId)), eq(caixaTable.status, "aberto"))
  );
  res.json(caixa ?? null);
});

router.post("/caixa/abrir", async (req, res): Promise<void> => {
  const { cobradorId, dataAbertura, saldoInicial } = req.body;
  if (!cobradorId || !dataAbertura) { res.status(400).json({ error: "cobradorId e dataAbertura são obrigatórios" }); return; }
  const [existing] = await db.select().from(caixaTable).where(
    and(eq(caixaTable.cobradorId, Number(cobradorId)), eq(caixaTable.status, "aberto"))
  );
  if (existing) { res.status(409).json({ error: "Já existe um caixa aberto para este cobrador" }); return; }
  const [caixa] = await db.insert(caixaTable).values({
    cobradorId: Number(cobradorId),
    dataAbertura,
    saldoInicial: String(saldoInicial ?? 0),
    status: "aberto",
  }).returning();
  res.status(201).json(caixa);
});

router.post("/caixa/fechar", async (req, res): Promise<void> => {
  const { cobradorId, dataFechamento, saldoFinal, dadosSnapshot } = req.body;
  if (!cobradorId || !dataFechamento) { res.status(400).json({ error: "cobradorId e dataFechamento são obrigatórios" }); return; }

  const snapshotJson = dadosSnapshot ? JSON.stringify(dadosSnapshot) : null;

  const [existing] = await db.select().from(caixaTable).where(
    and(eq(caixaTable.cobradorId, Number(cobradorId)), eq(caixaTable.status, "aberto"))
  );

  let caixa;
  if (existing) {
    [caixa] = await db.update(caixaTable)
      .set({ status: "fechado", dataFechamento, saldoFinal: String(saldoFinal ?? 0), dadosSnapshot: snapshotJson })
      .where(and(eq(caixaTable.cobradorId, Number(cobradorId)), eq(caixaTable.status, "aberto")))
      .returning();
  } else {
    const hoje = new Date();
    const dataAbertura = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;
    [caixa] = await db.insert(caixaTable).values({
      cobradorId: Number(cobradorId),
      dataAbertura,
      dataFechamento,
      saldoInicial: String(dadosSnapshot?.caixaInicial ?? 0),
      saldoFinal: String(saldoFinal ?? 0),
      status: "fechado",
      dadosSnapshot: snapshotJson,
    }).returning();
  }

  if (!caixa) { res.status(500).json({ error: "Erro ao fechar caixa" }); return; }
  res.json(caixa);
});

// Recebe o snapshot AO VIVO do app (caixa aberto) e grava no caixa aberto do
// cobrador. Assim a web mostra os dados em tempo real, sem fechar o caixa.
router.post("/caixa/snapshot-vivo", async (req, res): Promise<void> => {
  const { cobradorId, dadosSnapshot } = req.body;
  if (!cobradorId) { res.status(400).json({ error: "cobradorId é obrigatório" }); return; }

  const snapshotJson = dadosSnapshot ? JSON.stringify(dadosSnapshot) : null;
  const [caixa] = await db.update(caixaTable)
    .set({ dadosSnapshot: snapshotJson })
    .where(and(eq(caixaTable.cobradorId, Number(cobradorId)), eq(caixaTable.status, "aberto")))
    .returning();

  // Sem caixa aberto no servidor: ignora silenciosamente (não é erro do app).
  if (!caixa) { res.json({ ok: false, reason: "sem caixa aberto" }); return; }
  res.json({ ok: true });
});

router.get("/caixa/fechamento-rota", async (req, res): Promise<void> => {
  const { rota } = req.query;
  if (!rota) { res.status(400).json({ error: "rota é obrigatória" }); return; }

  const [aplicativo] = await db.select().from(aplicativosTable)
    .where(eq(aplicativosTable.rota, String(rota)));

  if (!aplicativo) { res.json(null); return; }

  // Prioridade: caixa ABERTO (dados ao vivo do dia). Se não houver caixa aberto
  // com snapshot, cai para o último caixa FECHADO (snapshot de fechamento).
  let [caixa] = await db.select().from(caixaTable)
    .where(and(eq(caixaTable.cobradorId, aplicativo.id), eq(caixaTable.status, "aberto")))
    .orderBy(desc(caixaTable.id))
    .limit(1);

  if (!caixa || !caixa.dadosSnapshot) {
    [caixa] = await db.select().from(caixaTable)
      .where(and(eq(caixaTable.cobradorId, aplicativo.id), eq(caixaTable.status, "fechado")))
      .orderBy(desc(caixaTable.dataFechamento))
      .limit(1);
  }

  res.setHeader("Cache-Control", "no-store");

  if (!caixa || !caixa.dadosSnapshot) { res.json(null); return; }

  try {
    const snapshot = JSON.parse(caixa.dadosSnapshot);
    res.json({
      ...snapshot,
      cobradorNome: aplicativo.cobradorNome,
      codigoAcesso: aplicativo.codigoAcesso,
      dataFechamento: caixa.dataFechamento,
      dataInicio: snapshot.dataInicio ?? caixa.dataAbertura,
    });
  } catch {
    res.json(null);
  }
});

// Gerenciamento de Clientes: retorna os clientes REAIS de todas as rotas.
// Para cada aplicativo (rota), usa o snapshot mais recente (caixa aberto — dados
// ao vivo — ou, na falta, o último fechado) e extrai a clientesLista, marcando
// cada cliente com o nome da rota. Somente leitura.
router.get("/caixa/clientes-rotas", async (_req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const aplicativos = await db.select().from(aplicativosTable);
  const clientes: any[] = [];

  for (const aplicativo of aplicativos) {
    let [caixa] = await db.select().from(caixaTable)
      .where(and(eq(caixaTable.cobradorId, aplicativo.id), eq(caixaTable.status, "aberto")))
      .orderBy(desc(caixaTable.id))
      .limit(1);

    if (!caixa || !caixa.dadosSnapshot) {
      [caixa] = await db.select().from(caixaTable)
        .where(and(eq(caixaTable.cobradorId, aplicativo.id), eq(caixaTable.status, "fechado")))
        .orderBy(desc(caixaTable.dataFechamento), desc(caixaTable.id))
        .limit(1);
    }
    if (!caixa || !caixa.dadosSnapshot) continue;

    try {
      const snap = JSON.parse(caixa.dadosSnapshot);
      if (Array.isArray(snap?.clientesLista)) {
        // Aplica os comandos administrativos PENDENTES por cima do snapshot:
        // o admin vê imediatamente a edição/exclusão que fez, mesmo antes de o
        // app do cobrador sincronizar e publicar um snapshot novo.
        const pendentes = await db.select().from(comandosClienteTable)
          .where(and(
            eq(comandosClienteTable.codigoAcesso, aplicativo.codigoAcesso),
            eq(comandosClienteTable.status, "pendente"),
          ))
          .orderBy(comandosClienteTable.id);

        let lista: any[] = snap.clientesLista;
        for (const cmd of pendentes) {
          if (cmd.tipo === "excluir") {
            lista = lista.filter(c => String(c.id) !== cmd.clienteId);
          } else if (cmd.tipo === "inativar") {
            lista = lista.map(c => String(c.id) !== cmd.clienteId ? c : { ...c, status: "INACTIVO" });
          } else if (cmd.tipo === "reativar") {
            lista = lista.map(c => String(c.id) !== cmd.clienteId ? c : { ...c, status: "ACTIVO" });
          } else if (cmd.tipo === "editar" && cmd.dados && typeof cmd.dados === "object") {
            const d = cmd.dados as Record<string, string | undefined>;
            lista = lista.map(c => String(c.id) !== cmd.clienteId ? c : {
              ...c,
              ...(d.nome ? { nome: d.nome } : {}),
              ...(d.documento !== undefined ? { documento: d.documento } : {}),
              ...(d.telefone !== undefined ? { tel1: d.telefone } : {}),
              ...(d.endereco !== undefined ? { endereco: d.endereco } : {}),
              ...(d.bairro !== undefined ? { bairro: d.bairro } : {}),
              ...(d.cidade !== undefined || d.uf !== undefined
                ? { cidade: [d.cidade, d.uf].filter(Boolean).join(" - ") }
                : {}),
            });
          }
        }

        for (const c of lista) {
          clientes.push({ ...c, rota: aplicativo.rota, cobradorNome: aplicativo.cobradorNome, codigoAcesso: aplicativo.codigoAcesso });
        }
      }
    } catch { continue; }
  }

  res.json(clientes);
});

// Liquidação por Período: agrega todos os fechamentos (snapshots) de uma rota
// dentro do intervalo [inicio, fim] (inclusive). Somente leitura — nada é
// criado ou modificado. Se houver mais de um registro no mesmo dia (fechar +
// reabrir), vale o ÚLTIMO do dia, pois o snapshot é acumulado do dia inteiro.
router.get("/caixa/liquidacao-periodo", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const { rota, inicio, fim } = req.query;
  if (!rota || !inicio || !fim) { res.status(400).json({ error: "rota, inicio e fim são obrigatórios" }); return; }
  const dtRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dtRe.test(String(inicio)) || !dtRe.test(String(fim)) || String(fim) < String(inicio)) {
    res.status(400).json({ error: "intervalo de datas inválido (use YYYY-MM-DD e fim >= inicio)" });
    return;
  }

  const [aplicativo] = await db.select().from(aplicativosTable)
    .where(eq(aplicativosTable.rota, String(rota)));
  if (!aplicativo) { res.json({ encontrado: false, registros: 0 }); return; }

  // Apenas LIQUIDAÇÕES: caixas FECHADOS com snapshot e data de fechamento.
  // Caixas abertos (snapshot ao vivo, parcial) ficam de fora.
  const rows = await db.select().from(caixaTable)
    .where(and(eq(caixaTable.cobradorId, aplicativo.id), eq(caixaTable.status, "fechado")))
    .orderBy(caixaTable.dataFechamento, caixaTable.id);

  const noPeriodo = rows.filter(r =>
    !!r.dadosSnapshot && !!r.dataFechamento &&
    r.dataFechamento >= String(inicio) && r.dataFechamento <= String(fim)
  );

  // Último fechamento de cada dia (ordenado por data+id ⇒ o último sobrescreve).
  const porDia = new Map<string, typeof noPeriodo[number]>();
  for (const r of noPeriodo) porDia.set(r.dataFechamento!, r);
  const dias = Array.from(porDia.keys()).sort();

  if (dias.length === 0) { res.json({ encontrado: false, registros: 0 }); return; }

  const num = (v: unknown) => (Number(v) || 0);
  let recebPrevisto = 0, recebAtual = 0, novosEmp = 0, juros = 0, rendimentos = 0,
      despesas = 0, retirada = 0, clientesNovos = 0, renovados = 0, cancelados = 0;
  let primeiro: any = null, ultimo: any = null;
  let registros = 0;
  const pagamentosLista: any[] = [];
  const emprestimosLista: any[] = [];
  const despesasListaAcum: any[] = [];
  const rendimentosListaAcum: any[] = [];

  for (const dia of dias) {
    const row = porDia.get(dia)!;
    let snap: any;
    try { snap = JSON.parse(row.dadosSnapshot!); } catch { continue; }
    if (!snap) continue;
    registros++;
    if (!primeiro) primeiro = snap;
    ultimo = snap;
    recebPrevisto += num(snap.recebPrevisto);
    recebAtual    += num(snap.recebAtual);
    novosEmp      += num(snap.novosEmp);
    juros         += num(snap.juros);
    rendimentos   += num(snap.rendimentos);
    despesas      += num(snap.despesas);
    retirada      += num(snap.retirada);
    clientesNovos += num(snap.clientesNovos);
    renovados     += num(snap.renovados);
    cancelados    += num(snap.cancelados);
    if (Array.isArray(snap.pagamentosClientes)) pagamentosLista.push(...snap.pagamentosClientes.map((p: any) => ({ ...p, dia })));
    if (Array.isArray(snap.novosEmprestimos))   emprestimosLista.push(...snap.novosEmprestimos.map((e: any) => ({ ...e, dia })));
    if (Array.isArray(snap.despesasLista))      despesasListaAcum.push(...snap.despesasLista.map((d: any) => ({ ...d, dia })));
    if (Array.isArray(snap.rendimentosLista))   rendimentosListaAcum.push(...snap.rendimentosLista.map((r2: any) => ({ ...r2, dia })));
  }

  if (registros === 0 || !primeiro || !ultimo) { res.json({ encontrado: false, registros: 0 }); return; }

  res.json({
    encontrado: true,
    registros,
    dias,
    cobradorNome: aplicativo.cobradorNome,
    codigoAcesso: aplicativo.codigoAcesso,
    recebPrevisto,
    recebAtual,
    novosEmp,
    juros,
    rendimentos,
    despesas,
    retirada,
    clientesNovos,
    renovados,
    cancelados,
    caixaInicial: num(primeiro.caixaInicial),
    caixaFinal: num(ultimo.caixaFinal),
    carteiraInicial: num(primeiro.carteiraInicial),
    carteiraFinal: num(ultimo.carteiraFinal),
    totalClientes: num(ultimo.clientesIniciais) + num(ultimo.clientesNovos),
    pagamentos: pagamentosLista,
    emprestimos: emprestimosLista,
    despesasLista: despesasListaAcum,
    rendimentosLista: rendimentosListaAcum,
    clientesLista: Array.isArray(ultimo.clientesLista) ? ultimo.clientesLista : [],
  });
});

router.post("/caixa/fechar-admin", async (req, res): Promise<void> => {
  const { rota } = req.body;
  if (!rota) { res.status(400).json({ error: "rota é obrigatória" }); return; }

  const [aplicativo] = await db.select().from(aplicativosTable)
    .where(eq(aplicativosTable.rota, String(rota)));
  if (!aplicativo) { res.status(404).json({ error: "Rota não encontrada" }); return; }

  const hoje = new Date();
  const dataFechamento = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;

  const [existing] = await db.select().from(caixaTable).where(
    and(eq(caixaTable.cobradorId, aplicativo.id), eq(caixaTable.status, "aberto"))
  );

  if (existing) {
    await db.update(caixaTable)
      .set({ status: "fechado", dataFechamento })
      .where(and(eq(caixaTable.cobradorId, aplicativo.id), eq(caixaTable.status, "aberto")));
  }

  res.json({ ok: true });
});

router.get("/caixa/status-rota", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const { rota } = req.query;
  if (!rota) { res.status(400).json({ error: "rota é obrigatória" }); return; }

  const [aplicativo] = await db.select().from(aplicativosTable)
    .where(eq(aplicativosTable.rota, String(rota)));
  if (!aplicativo) { res.json({ aberto: false, cobradorId: null }); return; }

  const [caixa] = await db.select().from(caixaTable).where(
    and(eq(caixaTable.cobradorId, aplicativo.id), eq(caixaTable.status, "aberto"))
  );

  res.json({ aberto: !!caixa, cobradorId: aplicativo.id });
});

router.post("/caixa/reabrir", async (req, res): Promise<void> => {
  const { rota } = req.body;
  if (!rota) { res.status(400).json({ error: "rota é obrigatória" }); return; }

  const [aplicativo] = await db.select().from(aplicativosTable)
    .where(eq(aplicativosTable.rota, String(rota)));
  if (!aplicativo) { res.status(404).json({ error: "Rota não encontrada" }); return; }

  const hoje = new Date();
  const dataAbertura = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;

  const [caixa] = await db.insert(caixaTable).values({
    cobradorId: aplicativo.id,
    dataAbertura,
    saldoInicial: "0",
    status: "aberto",
  }).returning();

  res.status(201).json(caixa);
});

router.get("/caixa/movimentos", async (req, res): Promise<void> => {
  const { cobradorId, data } = req.query;
  if (!cobradorId) { res.status(400).json({ error: "cobradorId é obrigatório" }); return; }
  let rows = await db.select().from(movimentosCaixaTable).where(eq(movimentosCaixaTable.cobradorId, Number(cobradorId))).orderBy(movimentosCaixaTable.data);
  if (data) rows = rows.filter(m => m.data === String(data));
  res.json(rows);
});

router.post("/caixa/movimentos", async (req, res): Promise<void> => {
  const { cobradorId, tipo, conceito, categoria, valor, data, obs, observacao } = req.body;
  const conceitoFinal = conceito ?? categoria;
  if (!cobradorId || !tipo || !conceitoFinal || !valor || !data) {
    res.status(400).json({ error: "Campos obrigatórios: cobradorId, tipo, conceito/categoria, valor, data" });
    return;
  }
  const [movimento] = await db.insert(movimentosCaixaTable).values({
    cobradorId: Number(cobradorId),
    tipo,
    conceito: conceitoFinal,
    obs: obs ?? observacao,
    valor: String(valor),
    data,
  }).returning();
  res.status(201).json(movimento);
});

export default router;
