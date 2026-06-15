import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pagamentosTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/pagamentos", async (req, res): Promise<void> => {
  const { emprestimoId, cobradorId, data } = req.query;
  let rows = await db.select().from(pagamentosTable).orderBy(pagamentosTable.dataPagamento);

  if (emprestimoId) rows = rows.filter(p => p.emprestimoId === Number(emprestimoId));
  if (cobradorId) rows = rows.filter(p => p.cobradorId === Number(cobradorId));
  if (data) rows = rows.filter(p => p.dataPagamento === String(data));

  res.json(rows);
});

router.post("/pagamentos", async (req, res): Promise<void> => {
  const { emprestimoId, clienteId, cobradorId, valor, dataPagamento, formaPagamento, obs, sancao } = req.body;
  if (!emprestimoId || !clienteId || !cobradorId || !valor || !dataPagamento) {
    res.status(400).json({ error: "Campos obrigatórios: emprestimoId, clienteId, cobradorId, valor, dataPagamento" });
    return;
  }
  const [pagamento] = await db.insert(pagamentosTable).values({
    emprestimoId: Number(emprestimoId),
    clienteId: Number(clienteId),
    cobradorId: Number(cobradorId),
    valor: String(valor),
    dataPagamento,
    formaPagamento: formaPagamento ?? "Efectivo",
    obs,
    sancao: String(sancao ?? 0),
  }).returning();
  res.status(201).json(pagamento);
});

router.delete("/pagamentos/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const [deleted] = await db.delete(pagamentosTable).where(eq(pagamentosTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Pagamento não encontrado" }); return; }
  res.sendStatus(204);
});

export default router;
