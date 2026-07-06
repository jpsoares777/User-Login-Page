import { pgTable, serial, text, integer, numeric, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { aplicativosTable } from "./aplicativos";

// Solicitações de aprovação de lançamentos financeiros (despesas/rendimentos)
// que excedem o limite global. Espelha solicitacoes_emprestimo: enquanto
// pendente, o lançamento NÃO é aplicado na rota do cobrador.
export const solicitacoesMovimentoTable = pgTable("solicitacoes_movimento", {
  id:           serial("id").primaryKey(),
  aplicativoId: integer("aplicativo_id").references(() => aplicativosTable.id, { onDelete: "cascade" }),
  codigoAcesso: text("codigo_acesso").notNull(),
  cobradorNome: text("cobrador_nome").notNull(),
  deviceId:     text("device_id"),
  tipo:         text("tipo").notNull().default("despesa"), // "despesa" | "rendimento"
  categoria:    text("categoria").notNull(),
  valor:        numeric("valor", { precision: 12, scale: 2 }).notNull().default("0"),
  observacao:   text("observacao"),
  localId:      text("local_id"),
  payload:      jsonb("payload"),
  status:       text("status").notNull().default("pendente"),
  solicitadoEm: timestamp("solicitado_em").defaultNow(),
  respondidoEm: timestamp("respondido_em"),
}, (t) => [
  // Impede lançamentos duplicados para o mesmo (codigoAcesso, localId).
  // Torna o POST idempotente mesmo com POSTs concorrentes (POST inicial + polling).
  uniqueIndex("solic_mov_codigo_local_uidx")
    .on(t.codigoAcesso, t.localId)
    .where(sql`${t.localId} is not null`),
]);

export const insertSolicitacaoMovimentoSchema = createInsertSchema(solicitacoesMovimentoTable).omit({ id: true, solicitadoEm: true, respondidoEm: true });
export const selectSolicitacaoMovimentoSchema = createSelectSchema(solicitacoesMovimentoTable);

export type InsertSolicitacaoMovimento = z.infer<typeof insertSolicitacaoMovimentoSchema>;
export type SolicitacaoMovimento = typeof solicitacoesMovimentoTable.$inferSelect;
