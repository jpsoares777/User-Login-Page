import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, solicitacoesTable, aplicativosTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/solicitacoes", async (req, res): Promise<void> => {
  const { codigoAcesso, cobradorNome, deviceId } = req.body;
  if (!codigoAcesso || !cobradorNome || !deviceId) {
    res.status(400).json({ error: "codigoAcesso, cobradorNome e deviceId são obrigatórios" });
    return;
  }

  const [aplicativo] = await db
    .select()
    .from(aplicativosTable)
    .where(eq(aplicativosTable.codigoAcesso, String(codigoAcesso)));

  if (!aplicativo) {
    res.status(401).json({ error: "Código de acesso inválido" });
    return;
  }
  if (!aplicativo.ativo) {
    res.status(403).json({ error: "Acesso inativo. Contate o administrador." });
    return;
  }

  const tipo = aplicativo.deviceId && aplicativo.deviceId !== deviceId
    ? "troca_dispositivo"
    : "primeiro_acesso";

  const existente = await db
    .select()
    .from(solicitacoesTable)
    .where(and(
      eq(solicitacoesTable.codigoAcesso, String(codigoAcesso)),
      eq(solicitacoesTable.deviceId, String(deviceId)),
      eq(solicitacoesTable.status, "pendente"),
    ));

  if (existente.length > 0) {
    res.status(200).json({ status: "pendente", id: existente[0].id });
    return;
  }

  const [nova] = await db.insert(solicitacoesTable).values({
    aplicativoId: aplicativo.id,
    codigoAcesso: String(codigoAcesso),
    cobradorNome: String(cobradorNome),
    deviceId: String(deviceId),
    tipo,
    status: "pendente",
  }).returning();

  res.status(201).json({ status: "pendente", id: nova.id });
});

router.get("/solicitacoes", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(solicitacoesTable)
    .orderBy(solicitacoesTable.solicitadoEm);
  res.json(rows);
});

router.patch("/solicitacoes/:id/aprovar", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [sol] = await db
    .select()
    .from(solicitacoesTable)
    .where(eq(solicitacoesTable.id, id));

  if (!sol) { res.status(404).json({ error: "Solicitação não encontrada" }); return; }
  if (sol.status !== "pendente") { res.status(400).json({ error: "Solicitação já respondida" }); return; }

  await db
    .update(solicitacoesTable)
    .set({ status: "aprovado", respondidoEm: new Date() })
    .where(eq(solicitacoesTable.id, id));

  if (sol.aplicativoId) {
    await db
      .update(aplicativosTable)
      .set({ deviceId: sol.deviceId })
      .where(eq(aplicativosTable.id, sol.aplicativoId));
  }

  await db
    .update(solicitacoesTable)
    .set({ status: "rejeitado", respondidoEm: new Date() })
    .where(and(
      eq(solicitacoesTable.codigoAcesso, sol.codigoAcesso),
      eq(solicitacoesTable.status, "pendente"),
    ));

  res.json({ ok: true });
});

router.patch("/solicitacoes/:id/rejeitar", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [updated] = await db
    .update(solicitacoesTable)
    .set({ status: "rejeitado", respondidoEm: new Date() })
    .where(and(eq(solicitacoesTable.id, id), eq(solicitacoesTable.status, "pendente")))
    .returning();

  if (!updated) { res.status(404).json({ error: "Solicitação não encontrada ou já respondida" }); return; }
  res.json({ ok: true });
});

router.delete("/aplicativos/:id/dispositivo", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [updated] = await db
    .update(aplicativosTable)
    .set({ deviceId: null })
    .where(eq(aplicativosTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Aplicativo não encontrado" }); return; }
  res.json({ ok: true });
});

export default router;
