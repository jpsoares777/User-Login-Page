import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, faturasTable } from "@workspace/db";

const router: IRouter = Router();

// ── Listar faturas (todas ou por rota) ──
router.get("/faturas", async (req, res) => {
  const { rota } = req.query;
  const rows = rota
    ? await db.select().from(faturasTable).where(eq(faturasTable.rota, String(rota))).orderBy(desc(faturasTable.id))
    : await db.select().from(faturasTable).orderBy(desc(faturasTable.id));
  res.json(rows);
});

// ── Criar fatura ──
router.post("/faturas", async (req, res) => {
  const { rota, data, valorCentavos, meses, conceito, estado, vencimento, pais } = req.body;
  if (!rota || !data || !conceito || !vencimento) {
    res.status(400).json({ error: "Campos obrigatórios: rota, data, conceito, vencimento" });
    return;
  }
  const valor = Math.round(Number(valorCentavos));
  if (!Number.isFinite(valor) || valor <= 0) {
    res.status(400).json({ error: "Valor inválido." });
    return;
  }
  // Gera número sequencial a partir do maior existente
  const [ultima] = await db.select().from(faturasTable).orderBy(desc(faturasTable.id)).limit(1);
  const maxNro = ultima ? parseInt(ultima.nro, 10) || 14768400 : 14768400;
  const [row] = await db.insert(faturasTable).values({
    nro: String(maxNro + 1),
    rota: String(rota),
    data: String(data),
    valorCentavos: valor,
    meses: Math.max(1, Math.round(Number(meses)) || 1),
    conceito: String(conceito),
    estado: ["Pendente", "Pago", "Vencido"].includes(estado) ? estado : "Pendente",
    vencimento: String(vencimento),
    pais: String(pais ?? "BR"),
  }).returning();
  res.status(201).json(row);
});

// ── Atualizar estado (ex.: marcar como Pago) ──
router.patch("/faturas/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "id inválido" }); return; }
  const { estado } = req.body;
  if (!["Pendente", "Pago", "Vencido"].includes(estado)) {
    res.status(400).json({ error: "Estado inválido." });
    return;
  }
  const [row] = await db.update(faturasTable).set({ estado }).where(eq(faturasTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Fatura não encontrada." }); return; }
  res.json(row);
});

// ── Excluir fatura ──
router.delete("/faturas/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "id inválido" }); return; }
  const [row] = await db.delete(faturasTable).where(eq(faturasTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Fatura não encontrada." }); return; }
  res.json({ ok: true });
});

export default router;
