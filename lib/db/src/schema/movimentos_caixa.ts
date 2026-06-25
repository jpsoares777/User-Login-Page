import { pgTable, serial, text, integer, numeric, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const movimentosCaixaTable = pgTable("movimentos_caixa", {
  id: serial("id").primaryKey(),
  cobradorId: integer("cobrador_id").notNull(),
  tipo: text("tipo").notNull(),
  conceito: text("conceito").notNull(),
  valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  data: date("data", { mode: "string" }).notNull(),
  obs: text("obs"),
  caixaAberto: boolean("caixa_aberto").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const caixaTable = pgTable("caixa", {
  id: serial("id").primaryKey(),
  cobradorId: integer("cobrador_id").notNull(),
  dataAbertura: date("data_abertura", { mode: "string" }).notNull(),
  dataFechamento: date("data_fechamento", { mode: "string" }),
  saldoInicial: numeric("saldo_inicial", { precision: 12, scale: 2 }).notNull().default("0"),
  saldoFinal: numeric("saldo_final", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("aberto"),
  dadosSnapshot: text("dados_snapshot"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMovimentoCaixaSchema = createInsertSchema(movimentosCaixaTable).omit({ id: true, criadoEm: true });
export const insertCaixaSchema = createInsertSchema(caixaTable).omit({ id: true, criadoEm: true, atualizadoEm: true });

export type InsertMovimentoCaixa = z.infer<typeof insertMovimentoCaixaSchema>;
export type MovimentoCaixa = typeof movimentosCaixaTable.$inferSelect;
export type InsertCaixa = z.infer<typeof insertCaixaSchema>;
export type Caixa = typeof caixaTable.$inferSelect;
