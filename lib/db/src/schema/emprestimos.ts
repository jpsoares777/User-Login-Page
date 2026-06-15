import { pgTable, serial, text, integer, numeric, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emprestimosTable = pgTable("emprestimos", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull(),
  cobradorId: integer("cobrador_id").notNull(),
  consecutivo: text("consecutivo"),
  idVenda: text("id_venda"),
  valorProduto: numeric("valor_produto", { precision: 12, scale: 2 }).notNull(),
  totalAPagar: numeric("total_a_pagar", { precision: 12, scale: 2 }).notNull(),
  jurosPct: numeric("juros_pct", { precision: 5, scale: 2 }).notNull().default("40"),
  numParcelas: integer("num_parcelas").notNull(),
  valorParcela: numeric("valor_parcela", { precision: 12, scale: 2 }).notNull(),
  frequencia: text("frequencia").notNull().default("DIARIO"),
  dataInicio: date("data_inicio", { mode: "string" }).notNull(),
  status: text("status").notNull().default("Ativo"),
  saldo: numeric("saldo", { precision: 12, scale: 2 }).notNull().default("0"),
  parcelasPagas: numeric("parcelas_pagas", { precision: 6, scale: 2 }).notNull().default("0"),
  parcelasRestantes: numeric("parcelas_restantes", { precision: 6, scale: 2 }).notNull().default("0"),
  tag: text("tag"),
  valorAnterior: numeric("valor_anterior", { precision: 12, scale: 2 }).default("0"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEmprestimoSchema = createInsertSchema(emprestimosTable).omit({ id: true, criadoEm: true, atualizadoEm: true });
export type InsertEmprestimo = z.infer<typeof insertEmprestimoSchema>;
export type Emprestimo = typeof emprestimosTable.$inferSelect;
