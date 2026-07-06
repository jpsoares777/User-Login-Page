import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, solicitacoesEmprestimoTable, aplicativosTable } from "@workspace/db";

const router: IRouter = Router();

// App cria uma solicitação de empréstimo/renovação acima do limite.
router.post("/solicitacoes-emprestimo", async (req, res): Promise<void> => {
  const {
    codigoAcesso, cobradorNome, deviceId, tipo,
    clienteNome, valorEmprestimo, totalPagar, jurosPct, jurosValor,
    numParcelas, valorParcela, localId, consecutivo, payload,
  } = req.body ?? {};

  if (!codigoAcesso || !clienteNome) {
    res.status(400).json({ error: "codigoAcesso e clienteNome são obrigatórios" });
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

  // Evita duplicar a mesma solicitação (mesmo localId ainda pendente).
  if (localId) {
    const [existente] = await db
      .select()
      .from(solicitacoesEmprestimoTable)
      .where(and(
        eq(solicitacoesEmprestimoTable.codigoAcesso, String(codigoAcesso)),
        eq(solicitacoesEmprestimoTable.localId, String(localId)),
      ));
    if (existente) {
      res.status(200).json(existente);
      return;
    }
  }

  const [nova] = await db.insert(solicitacoesEmprestimoTable).values({
    aplicativoId:    aplicativo.id,
    codigoAcesso:    String(codigoAcesso),
    cobradorNome:    String(cobradorNome ?? aplicativo.cobradorNome ?? ""),
    deviceId:        deviceId != null ? String(deviceId) : null,
    tipo:            String(tipo ?? "novo_emprestimo"),
    clienteNome:     String(clienteNome),
    valorEmprestimo: String(valorEmprestimo ?? 0),
    totalPagar:      String(totalPagar ?? 0),
    jurosPct:        String(jurosPct ?? 0),
    jurosValor:      String(jurosValor ?? 0),
    numParcelas:     Number(numParcelas ?? 0),
    valorParcela:    String(valorParcela ?? 0),
    localId:         localId != null ? String(localId) : null,
    consecutivo:     consecutivo != null ? String(consecutivo) : null,
    payload:         payload ?? null,
    status:          "pendente",
  }).onConflictDoNothing().returning();

  // Corrida (POST inicial + polling concorrentes com o mesmo localId): o índice
  // UNIQUE parcial rejeita o 2º insert; devolvemos a solicitação já existente.
  if (!nova && localId) {
    const [existente] = await db
      .select()
      .from(solicitacoesEmprestimoTable)
      .where(and(
        eq(solicitacoesEmprestimoTable.codigoAcesso, String(codigoAcesso)),
        eq(solicitacoesEmprestimoTable.localId, String(localId)),
      ));
    if (existente) {
      res.status(200).json(existente);
      return;
    }
  }

  res.status(201).json(nova);
});

// Lista solicitações. Filtros opcionais: codigoAcesso, aplicativoId, status.
router.get("/solicitacoes-emprestimo", async (req, res): Promise<void> => {
  const { codigoAcesso, aplicativoId, status } = req.query;
  const conds = [];
  if (codigoAcesso) conds.push(eq(solicitacoesEmprestimoTable.codigoAcesso, String(codigoAcesso)));
  if (aplicativoId) conds.push(eq(solicitacoesEmprestimoTable.aplicativoId, Number(aplicativoId)));
  if (status) conds.push(eq(solicitacoesEmprestimoTable.status, String(status)));

  const rows = await db
    .select()
    .from(solicitacoesEmprestimoTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(solicitacoesEmprestimoTable.solicitadoEm));

  res.json(rows);
});

async function responder(id: number, novoStatus: "aceito" | "recusado", res: import("express").Response): Promise<void> {
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const [updated] = await db
    .update(solicitacoesEmprestimoTable)
    .set({ status: novoStatus, respondidoEm: new Date() })
    .where(and(eq(solicitacoesEmprestimoTable.id, id), eq(solicitacoesEmprestimoTable.status, "pendente")))
    .returning();
  if (!updated) { res.status(404).json({ error: "Solicitação não encontrada ou já respondida" }); return; }
  res.json(updated);
}

router.patch("/solicitacoes-emprestimo/:id/aceitar", async (req, res): Promise<void> => {
  await responder(parseInt(req.params.id, 10), "aceito", res);
});

router.patch("/solicitacoes-emprestimo/:id/recusar", async (req, res): Promise<void> => {
  await responder(parseInt(req.params.id, 10), "recusado", res);
});

export default router;
