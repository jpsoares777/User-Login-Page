import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pagamentosTable = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  emprestimoId: integer("emprestimo_id").notNull(),
  clienteId: integer("cliente_id").notNull(),
  cobradorId: integer("cobrador_id").notNull(),
  valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  dataPagamento: date("data_pagamento", { mode: "string" }).notNull(),
  formaPagamento: text("forma_pagamento").notNull().default("Efectivo"),
  obs: text("obs"),
  sancao: numeric("sancao", { precision: 12, scale: 2 }).default("0"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPagamentoSchema = createInsertSchema(pagamentosTable).omit({ id: true, criadoEm: true });
export type InsertPagamento = z.infer<typeof insertPagamentoSchema>;
export type Pagamento = typeof pagamentosTable.$inferSelect;
