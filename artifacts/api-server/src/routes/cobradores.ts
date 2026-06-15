import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, cobradoresTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/cobradores", async (req, res): Promise<void> => {
  const cobradores = await db.select().from(cobradoresTable).orderBy(cobradoresTable.nome);
  res.json(cobradores);
});

router.get("/cobradores/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const [cobrador] = await db.select().from(cobradoresTable).where(eq(cobradoresTable.id, id));
  if (!cobrador) { res.status(404).json({ error: "Cobrador não encontrado" }); return; }
  res.json(cobrador);
});

router.post("/cobradores", async (req, res): Promise<void> => {
  const { nome, email, telefone, rota, cidade, estado } = req.body;
  if (!nome) { res.status(400).json({ error: "Nome é obrigatório" }); return; }
  const [cobrador] = await db.insert(cobradoresTable).values({ nome, email, telefone, rota, cidade, estado }).returning();
  res.status(201).json(cobrador);
});

router.patch("/cobradores/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const { nome, email, telefone, rota, cidade, estado, ativo } = req.body;
  const [cobrador] = await db.update(cobradoresTable).set({ nome, email, telefone, rota, cidade, estado, ativo }).where(eq(cobradoresTable.id, id)).returning();
  if (!cobrador) { res.status(404).json({ error: "Cobrador não encontrado" }); return; }
  res.json(cobrador);
});

router.delete("/cobradores/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  await db.update(cobradoresTable).set({ ativo: false }).where(eq(cobradoresTable.id, id));
  res.sendStatus(204);
});

export default router;
