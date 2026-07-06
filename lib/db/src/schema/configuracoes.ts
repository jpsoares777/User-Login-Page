import { pgTable, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

// Configurações globais do sistema (linha única, id = 1). Guardadas como JSON
// para acomodar os vários toggles/limites do modal "Configurações" do admin.
export const configuracoesTable = pgTable("configuracoes", {
  id:           integer("id").primaryKey().default(1),
  data:         jsonb("data").notNull().default({}),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

export type Configuracoes = typeof configuracoesTable.$inferSelect;
