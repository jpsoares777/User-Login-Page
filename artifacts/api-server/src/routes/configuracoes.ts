import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, configuracoesTable } from "@workspace/db";

const router: IRouter = Router();

// Retorna as configurações globais (linha única id = 1). Se ainda não existir,
// devolve um objeto vazio para o cliente aplicar seus próprios padrões.
router.get("/configuracoes", async (_req, res): Promise<void> => {
  const [row] = await db.select().from(configuracoesTable).where(eq(configuracoesTable.id, 1));
  res.json(row?.data ?? {});
});

// Salva (upsert) as configurações globais na linha única id = 1.
router.put("/configuracoes", async (req, res): Promise<void> => {
  const data = req.body ?? {};
  const [row] = await db
    .insert(configuracoesTable)
    .values({ id: 1, data, atualizadoEm: new Date() })
    .onConflictDoUpdate({ target: configuracoesTable.id, set: { data, atualizadoEm: new Date() } })
    .returning();
  res.json(row.data);
});

export default router;
