import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, aplicativosTable, solicitacoesTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/aplicativos/login", async (req, res): Promise<void> => {
  const { codigo, deviceId } = req.body;
  if (!codigo) { res.status(400).json({ error: "Código de acesso obrigatório" }); return; }

  const [row] = await db
    .select()
    .from(aplicativosTable)
    .where(eq(aplicativosTable.codigoAcesso, String(codigo)));

  if (!row) { res.status(401).json({ error: "Código de acesso inválido" }); return; }
  if (!row.ativo) { res.status(403).json({ error: "Acesso inativo. Contate o administrador." }); return; }

  const hoje = new Date().toISOString().slice(0, 10);
  if (row.vencimento < hoje) {
    res.status(403).json({ error: `Acesso vencido em ${row.vencimento}. Contate o administrador.` });
    return;
  }

  if (deviceId) {
    if (!row.deviceId) {
      const [aprovada] = await db
        .select()
        .from(solicitacoesTable)
        .where(and(
          eq(solicitacoesTable.codigoAcesso, String(codigo)),
          eq(solicitacoesTable.deviceId, String(deviceId)),
          eq(solicitacoesTable.status, "aprovado"),
        ));
      if (!aprovada) {
        const [pendente] = await db
          .select()
          .from(solicitacoesTable)
          .where(and(
            eq(solicitacoesTable.codigoAcesso, String(codigo)),
            eq(solicitacoesTable.deviceId, String(deviceId)),
            eq(solicitacoesTable.status, "pendente"),
          ));
        if (pendente) {
          res.status(202).json({ status: "pendente" });
        } else {
          res.status(403).json({ status: "registro_necessario" });
        }
        return;
      }
      await db.update(aplicativosTable).set({ deviceId: String(deviceId) }).where(eq(aplicativosTable.id, row.id));
    } else if (row.deviceId !== String(deviceId)) {
      const [pendente] = await db
        .select()
        .from(solicitacoesTable)
        .where(and(
          eq(solicitacoesTable.codigoAcesso, String(codigo)),
          eq(solicitacoesTable.deviceId, String(deviceId)),
          eq(solicitacoesTable.status, "pendente"),
        ));
      if (pendente) {
        res.status(202).json({ status: "pendente" });
      } else {
        res.status(403).json({ status: "dispositivo_diferente" });
      }
      return;
    }
  }

  res.json({ id: row.id, rota: row.rota, cobradorNome: row.cobradorNome, vencimento: row.vencimento, saldoInicial: parseFloat(row.saldoInicial ?? "0") });
});

router.get("/aplicativos", async (req, res): Promise<void> => {
  const { rota, nome, codigo } = req.query;
  let rows = await db.select().from(aplicativosTable).orderBy(aplicativosTable.id);

  if (rota && String(rota).trim())
    rows = rows.filter(r => r.rota.toLowerCase().includes(String(rota).toLowerCase()));
  if (nome && String(nome).trim())
    rows = rows.filter(r => r.cobradorNome.toLowerCase().includes(String(nome).toLowerCase()));
  if (codigo && String(codigo).trim())
    rows = rows.filter(r => r.codigoAcesso.toLowerCase().includes(String(codigo).toLowerCase()));

  res.json(rows);
});

router.get("/aplicativos/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const [row] = await db.select().from(aplicativosTable).where(eq(aplicativosTable.id, id));
  if (!row) { res.status(404).json({ error: "Aplicativo não encontrado" }); return; }
  res.json(row);
});

router.post("/aplicativos", async (req, res): Promise<void> => {
  const { rota, cobradorNome, codigoAcesso, vencimento, valorVendaMax, saldoInicial, estado, cidade, ativo } = req.body;
  if (!rota || !cobradorNome || !codigoAcesso || !vencimento) {
    res.status(400).json({ error: "Campos obrigatórios: rota, cobradorNome, codigoAcesso, vencimento" });
    return;
  }
  const [row] = await db.insert(aplicativosTable).values({
    rota, cobradorNome, codigoAcesso, vencimento,
    valorVendaMax: String(valorVendaMax ?? 0),
    saldoInicial: String(saldoInicial ?? 0),
    estado: estado ?? null,
    cidade: cidade ?? null,
    ativo: ativo !== false,
  }).returning();
  res.status(201).json(row);
});

router.patch("/aplicativos/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const { rota, cobradorNome, codigoAcesso, vencimento, valorVendaMax, saldoInicial, estado, cidade, ativo } = req.body;
  const updates: Partial<typeof aplicativosTable.$inferInsert> = {};
  if (rota !== undefined) updates.rota = rota;
  if (cobradorNome !== undefined) updates.cobradorNome = cobradorNome;
  if (codigoAcesso !== undefined) updates.codigoAcesso = codigoAcesso;
  if (vencimento !== undefined) updates.vencimento = vencimento;
  if (valorVendaMax !== undefined) updates.valorVendaMax = String(valorVendaMax);
  if (saldoInicial !== undefined) updates.saldoInicial = String(saldoInicial);
  if (estado !== undefined) updates.estado = estado;
  if (cidade !== undefined) updates.cidade = cidade;
  if (ativo !== undefined) updates.ativo = Boolean(ativo);
  const [row] = await db.update(aplicativosTable).set(updates).where(eq(aplicativosTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Aplicativo não encontrado" }); return; }
  res.json(row);
});

router.delete("/aplicativos/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const [deleted] = await db.delete(aplicativosTable).where(eq(aplicativosTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Aplicativo não encontrado" }); return; }
  res.sendStatus(204);
});

export default router;
