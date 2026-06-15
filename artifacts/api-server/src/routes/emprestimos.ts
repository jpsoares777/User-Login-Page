import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, emprestimosTable, clientesTable, cobradoresTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/emprestimos", async (req, res): Promise<void> => {
  const { cobradorId, clienteId, status } = req.query;

  const rows = await db
    .select({
      emprestimo: emprestimosTable,
      clienteNome: clientesTable.nome,
      cobradorNome: cobradoresTable.nome,
    })
    .from(emprestimosTable)
    .leftJoin(clientesTable, eq(emprestimosTable.clienteId, clientesTable.id))
    .leftJoin(cobradoresTable, eq(emprestimosTable.cobradorId, cobradoresTable.id));

  let filtered = rows;
  if (cobradorId) filtered = filtered.filter(r => r.emprestimo.cobradorId === Number(cobradorId));
  if (clienteId) filtered = filtered.filter(r => r.emprestimo.clienteId === Number(clienteId));
  if (status) filtered = filtered.filter(r => r.emprestimo.status === String(status));

  res.json(filtered.map(r => ({ ...r.emprestimo, clienteNome: r.clienteNome, cobradorNome: r.cobradorNome })));
});

router.get("/emprestimos/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const [row] = await db.select().from(emprestimosTable).where(eq(emprestimosTable.id, id));
  if (!row) { res.status(404).json({ error: "Empréstimo não encontrado" }); return; }
  res.json(row);
});

router.post("/emprestimos", async (req, res): Promise<void> => {
  const {
    clienteId, cobradorId, valorProduto, totalAPagar, jurosPct,
    numParcelas, valorParcela, frequencia, dataInicio, tag,
    valorAnterior, consecutivo, idVenda,
  } = req.body;

  if (!clienteId || !cobradorId || !valorProduto || !dataInicio) {
    res.status(400).json({ error: "Campos obrigatórios: clienteId, cobradorId, valorProduto, dataInicio" });
    return;
  }

  const [emprestimo] = await db.insert(emprestimosTable).values({
    clienteId: Number(clienteId),
    cobradorId: Number(cobradorId),
    consecutivo: consecutivo ?? null,
    idVenda: idVenda ?? null,
    tag: tag ?? null,
    valorProduto: String(valorProduto),
    totalAPagar: String(totalAPagar ?? valorProduto),
    jurosPct: String(jurosPct ?? 40),
    numParcelas: Number(numParcelas ?? 1),
    valorParcela: String(valorParcela ?? valorProduto),
    frequencia: frequencia ?? "DIARIO",
    dataInicio,
    saldo: String(totalAPagar ?? valorProduto),
    parcelasRestantes: String(numParcelas ?? 0),
    parcelasPagas: "0",
    valorAnterior: String(valorAnterior ?? 0),
  }).returning();

  res.status(201).json(emprestimo);
});

router.patch("/emprestimos/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const allowed = ["status", "saldo", "parcelasPagas", "parcelasRestantes", "ativo"] as const;
  type AllowedKey = typeof allowed[number];
  const updates: Partial<Record<AllowedKey, unknown>> = {};
  for (const f of allowed) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }

  const [emp] = await db
    .update(emprestimosTable)
    .set(updates as Partial<typeof emprestimosTable.$inferInsert>)
    .where(eq(emprestimosTable.id, id))
    .returning();

  if (!emp) { res.status(404).json({ error: "Empréstimo não encontrado" }); return; }
  res.json(emp);
});

export default router;
