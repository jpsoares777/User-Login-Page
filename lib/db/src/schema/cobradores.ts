import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cobradoresTable = pgTable("cobradores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  rota: text("rota"),
  cidade: text("cidade"),
  estado: text("estado").notNull().default("MARANHÃO"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCobradorSchema = createInsertSchema(cobradoresTable).omit({ id: true, criadoEm: true, atualizadoEm: true });
export type InsertCobrador = z.infer<typeof insertCobradorSchema>;
export type Cobrador = typeof cobradoresTable.$inferSelect;
