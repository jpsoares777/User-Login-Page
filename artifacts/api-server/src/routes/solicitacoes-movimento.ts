import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, solicitacoesMovimentoTable, aplicativosTable } from "@workspace/db";

const router: IRouter = Router();

// App cria uma solicitação de despesa/rendimento acima do limite.
router.post("/solicitacoes-movimento", async (req, res): Promise<void> => {
  const {
    codigoAcesso, cobradorNome, deviceId, tipo,
    categoria, valor, observacao, localId, payload,
  } = req.body ?? {};

  if (!codigoAcesso || !categoria) {
    res.status(400).json({ error: "codigoAcesso e categoria são obrigatórios" });
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

  // Evita duplicar a mesma solicitação: se já existe uma com o mesmo
  // codigoAcesso + localId (qualquer status), retorna a existente.
  if (localId) {
    const [existente] = await db
      .select()
      .from(solicitacoesMovimentoTable)
      .where(and(
        eq(solicitacoesMovimentoTable.codigoAcesso, String(codigoAcesso)),
        eq(solicitacoesMovimentoTable.localId, String(localId)),
      ));
    if (existente) {
      res.status(200).json(existente);
      return;
    }
  }

  const [nova] = await db.insert(solicitacoesMovimentoTable).values({
    aplicativoId: aplicativo.id,
    codigoAcesso: String(codigoAcesso),
    cobradorNome: String(cobradorNome ?? aplicativo.cobradorNome ?? ""),
    deviceId:     deviceId != null ? String(deviceId) : null,
    tipo:         String(tipo ?? "despesa"),
    categoria:    String(categoria),
    valor:        String(valor ?? 0),
    observacao:   observacao != null ? String(observacao) : null,
    localId:      localId != null ? String(localId) : null,
    payload:      payload ?? null,
    status:       "pendente",
  }).onConflictDoNothing().returning();

  // Corrida (POST inicial + polling concorrentes com o mesmo localId): o índice
  // UNIQUE parcial rejeita o 2º insert; devolvemos o lançamento já existente.
  if (!nova && localId) {
    const [existente] = await db
      .select()
      .from(solicitacoesMovimentoTable)
      .where(and(
        eq(solicitacoesMovimentoTable.codigoAcesso, String(codigoAcesso)),
        eq(solicitacoesMovimentoTable.localId, String(localId)),
      ));
    if (existente) {
      res.status(200).json(existente);
      return;
    }
  }

  res.status(201).json(nova);
});

// Lista solicitações. Filtros opcionais: rota, codigoAcesso, aplicativoId, status.
router.get("/solicitacoes-movimento", async (req, res): Promise<void> => {
  const { rota, codigoAcesso, aplicativoId, status } = req.query;
  const conds = [];
  if (rota) {
    const [aplicativo] = await db
      .select()
      .from(aplicativosTable)
      .where(eq(aplicativosTable.rota, String(rota)));
    if (!aplicativo) { res.json([]); return; }
    conds.push(eq(solicitacoesMovimentoTable.aplicativoId, aplicativo.id));
  }
  if (codigoAcesso) conds.push(eq(solicitacoesMovimentoTable.codigoAcesso, String(codigoAcesso)));
  if (aplicativoId) conds.push(eq(solicitacoesMovimentoTable.aplicativoId, Number(aplicativoId)));
  if (status) conds.push(eq(solicitacoesMovimentoTable.status, String(status)));

  const rows = await db
    .select()
    .from(solicitacoesMovimentoTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(solicitacoesMovimentoTable.solicitadoEm));

  res.json(rows);
});

async function responder(id: number, novoStatus: "aceito" | "recusado", res: import("express").Response): Promise<void> {
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const [updated] = await db
    .update(solicitacoesMovimentoTable)
    .set({ status: novoStatus, respondidoEm: new Date() })
    .where(and(eq(solicitacoesMovimentoTable.id, id), eq(solicitacoesMovimentoTable.status, "pendente")))
    .returning();
  if (!updated) { res.status(404).json({ error: "Solicitação não encontrada ou já respondida" }); return; }
  res.json(updated);
}

router.patch("/solicitacoes-movimento/:id/aceitar", async (req, res): Promise<void> => {
  await responder(parseInt(req.params.id, 10), "aceito", res);
});

router.patch("/solicitacoes-movimento/:id/recusar", async (req, res): Promise<void> => {
  await responder(parseInt(req.params.id, 10), "recusado", res);
});

export default router;
