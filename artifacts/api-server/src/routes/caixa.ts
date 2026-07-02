import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, caixaTable, movimentosCaixaTable, aplicativosTable } from "@workspace/db";

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
      dataFechamento: caixa.dataFechamento,
      dataInicio: snapshot.dataInicio ?? caixa.dataAbertura,
    });
  } catch {
    res.json(null);
  }
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
