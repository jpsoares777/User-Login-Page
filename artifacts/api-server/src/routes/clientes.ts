import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, clientesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/clientes", async (req, res): Promise<void> => {
  const clientes = await db.select().from(clientesTable).orderBy(clientesTable.nome);
  res.json(clientes);
});

router.get("/clientes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const [cliente] = await db.select().from(clientesTable).where(eq(clientesTable.id, id));
  if (!cliente) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  res.json(cliente);
});

router.post("/clientes", async (req, res): Promise<void> => {
  const { nome, documento, telefone, endereco, cidade, estado } = req.body;
  if (!nome) { res.status(400).json({ error: "Nome é obrigatório" }); return; }
  const [cliente] = await db.insert(clientesTable).values({ nome, documento, telefone, endereco, cidade, estado }).returning();
  res.status(201).json(cliente);
});

router.patch("/clientes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const { nome, documento, telefone, endereco, cidade, estado, ativo } = req.body;
  const [cliente] = await db.update(clientesTable).set({ nome, documento, telefone, endereco, cidade, estado, ativo }).where(eq(clientesTable.id, id)).returning();
  if (!cliente) { res.status(404).json({ error: "Cliente não encontrado" }); return; }
  res.json(cliente);
});

router.delete("/clientes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  await db.update(clientesTable).set({ ativo: false }).where(eq(clientesTable.id, id));
  res.sendStatus(204);
});

export default router;
