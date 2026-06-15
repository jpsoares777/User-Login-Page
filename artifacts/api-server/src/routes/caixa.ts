import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, caixaTable, movimentosCaixaTable } from "@workspace/db";

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
  const { cobradorId, dataFechamento, saldoFinal } = req.body;
  if (!cobradorId || !dataFechamento) { res.status(400).json({ error: "cobradorId e dataFechamento são obrigatórios" }); return; }
  const [caixa] = await db.update(caixaTable).set({ status: "fechado", dataFechamento, saldoFinal: String(saldoFinal ?? 0) })
    .where(and(eq(caixaTable.cobradorId, Number(cobradorId)), eq(caixaTable.status, "aberto"))).returning();
  if (!caixa) { res.status(404).json({ error: "Nenhum caixa aberto encontrado" }); return; }
  res.json(caixa);
});

router.get("/caixa/movimentos", async (req, res): Promise<void> => {
  const { cobradorId, data } = req.query;
  if (!cobradorId) { res.status(400).json({ error: "cobradorId é obrigatório" }); return; }
  let rows = await db.select().from(movimentosCaixaTable).where(eq(movimentosCaixaTable.cobradorId, Number(cobradorId))).orderBy(movimentosCaixaTable.data);
  if (data) rows = rows.filter(m => m.data === String(data));
  res.json(rows);
});

router.post("/caixa/movimentos", async (req, res): Promise<void> => {
  const { cobradorId, tipo, conceito, valor, data, obs } = req.body;
  if (!cobradorId || !tipo || !conceito || !valor || !data) {
    res.status(400).json({ error: "Campos obrigatórios: cobradorId, tipo, conceito, valor, data" });
    return;
  }
  const [movimento] = await db.insert(movimentosCaixaTable).values({
    cobradorId: Number(cobradorId),
    tipo, conceito, obs,
    valor: String(valor),
    data,
  }).returning();
  res.status(201).json(movimento);
});

export default router;
