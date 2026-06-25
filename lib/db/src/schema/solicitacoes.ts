import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { aplicativosTable } from "./aplicativos";

export const solicitacoesTable = pgTable("solicitacoes_acesso", {
  id:            serial("id").primaryKey(),
  aplicativoId:  integer("aplicativo_id").references(() => aplicativosTable.id, { onDelete: "cascade" }),
  codigoAcesso:  text("codigo_acesso").notNull(),
  cobradorNome:  text("cobrador_nome").notNull(),
  deviceId:      text("device_id").notNull(),
  tipo:          text("tipo").notNull().default("primeiro_acesso"),
  status:        text("status").notNull().default("pendente"),
  solicitadoEm:  timestamp("solicitado_em").defaultNow(),
  respondidoEm:  timestamp("respondido_em"),
});

export const insertSolicitacaoSchema = createInsertSchema(solicitacoesTable).omit({ id: true, solicitadoEm: true, respondidoEm: true });
export const selectSolicitacaoSchema = createSelectSchema(solicitacoesTable);

export type InsertSolicitacao = z.infer<typeof insertSolicitacaoSchema>;
export type Solicitacao = typeof solicitacoesTable.$inferSelect;
