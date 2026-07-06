import { pgTable, serial, text, integer, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { aplicativosTable } from "./aplicativos";

export const solicitacoesEmprestimoTable = pgTable("solicitacoes_emprestimo", {
  id:              serial("id").primaryKey(),
  aplicativoId:    integer("aplicativo_id").references(() => aplicativosTable.id, { onDelete: "cascade" }),
  codigoAcesso:    text("codigo_acesso").notNull(),
  cobradorNome:    text("cobrador_nome").notNull(),
  deviceId:        text("device_id"),
  tipo:            text("tipo").notNull().default("novo_emprestimo"),
  clienteNome:     text("cliente_nome").notNull(),
  valorEmprestimo: numeric("valor_emprestimo", { precision: 12, scale: 2 }).notNull().default("0"),
  totalPagar:      numeric("total_pagar",      { precision: 12, scale: 2 }).notNull().default("0"),
  jurosPct:        numeric("juros_pct",        { precision: 5,  scale: 2 }).notNull().default("0"),
  jurosValor:      numeric("juros_valor",      { precision: 12, scale: 2 }).notNull().default("0"),
  numParcelas:     integer("num_parcelas").notNull().default(0),
  valorParcela:    numeric("valor_parcela",    { precision: 12, scale: 2 }).notNull().default("0"),
  localId:         text("local_id"),
  consecutivo:     text("consecutivo"),
  payload:         jsonb("payload"),
  status:          text("status").notNull().default("pendente"),
  solicitadoEm:    timestamp("solicitado_em").defaultNow(),
  respondidoEm:    timestamp("respondido_em"),
});

export const insertSolicitacaoEmprestimoSchema = createInsertSchema(solicitacoesEmprestimoTable).omit({ id: true, solicitadoEm: true, respondidoEm: true });
export const selectSolicitacaoEmprestimoSchema = createSelectSchema(solicitacoesEmprestimoTable);

export type InsertSolicitacaoEmprestimo = z.infer<typeof insertSolicitacaoEmprestimoSchema>;
export type SolicitacaoEmprestimo = typeof solicitacoesEmprestimoTable.$inferSelect;
