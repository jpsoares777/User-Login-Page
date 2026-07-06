import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, comandosClienteTable, aplicativosTable } from "@workspace/db";

const router: IRouter = Router();

// Admin cria um comando (editar/excluir cliente) direcionado à rota do cobrador.
router.post("/comandos-cliente", async (req, res): Promise<void> => {
  const { rota, codigoAcesso, tipo, clienteId, consec, dados } = req.body ?? {};

  if ((!rota && !codigoAcesso) || !tipo || clienteId == null) {
    res.status(400).json({ error: "rota (ou codigoAcesso), tipo e clienteId são obrigatórios" });
    return;
  }
  if (tipo !== "editar" && tipo !== "excluir" && tipo !== "inativar" && tipo !== "reativar") {
    res.status(400).json({ error: "tipo deve ser 'editar', 'excluir', 'inativar' ou 'reativar'" });
    return;
  }

  // Endereçamento inequívoco: preferimos o codigoAcesso (único por app);
  // a rota é apenas um fallback para compatibilidade.
  const [aplicativo] = codigoAcesso
    ? await db.select().from(aplicativosTable)
        .where(eq(aplicativosTable.codigoAcesso, String(codigoAcesso)))
    : await db.select().from(aplicativosTable)
        .where(eq(aplicativosTable.rota, String(rota)));

  if (!aplicativo) {
    res.status(404).json({ error: "Aplicativo não encontrado" });
    return;
  }

  const [novo] = await db.insert(comandosClienteTable).values({
    aplicativoId: aplicativo.id,
    codigoAcesso: aplicativo.codigoAcesso,
    tipo:         String(tipo),
    clienteId:    String(clienteId),
    consec:       consec != null ? String(consec) : null,
    dados:        dados ?? null,
    status:       "pendente",
  }).returning();

  res.status(201).json(novo);
});

// App busca comandos pendentes da sua rota (polling).
router.get("/comandos-cliente", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const { codigoAcesso } = req.query;
  if (!codigoAcesso) {
    res.status(400).json({ error: "codigoAcesso é obrigatório" });
    return;
  }
  const rows = await db.select().from(comandosClienteTable)
    .where(and(
      eq(comandosClienteTable.codigoAcesso, String(codigoAcesso)),
      eq(comandosClienteTable.status, "pendente"),
    ))
    .orderBy(comandosClienteTable.id);
  res.json(rows);
});

// App confirma que aplicou o comando localmente.
// Escopo obrigatório: o ack só vale para comandos da própria rota
// (codigoAcesso) — uma rota não consegue dar ack em comandos de outra.
router.patch("/comandos-cliente/:id/ack", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const codigoAcesso = req.body?.codigoAcesso ?? req.query?.codigoAcesso;
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "id inválido" });
    return;
  }
  if (!codigoAcesso) {
    res.status(400).json({ error: "codigoAcesso é obrigatório" });
    return;
  }
  const [atualizado] = await db.update(comandosClienteTable)
    .set({ status: "aplicado", aplicadoEm: new Date() })
    .where(and(
      eq(comandosClienteTable.id, id),
      eq(comandosClienteTable.codigoAcesso, String(codigoAcesso)),
    ))
    .returning();
  if (!atualizado) {
    res.status(404).json({ error: "Comando não encontrado" });
    return;
  }
  res.json(atualizado);
});

export default router;
