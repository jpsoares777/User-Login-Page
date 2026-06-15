import { pgTable, serial, text, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aplicativosTable = pgTable("aplicativos", {
  id:             serial("id").primaryKey(),
  rota:           text("rota").notNull(),
  cobradorNome:   text("cobrador_nome").notNull(),
  codigoAcesso:   text("codigo_acesso").notNull(),
  vencimento:     text("vencimento").notNull(),
  valorVendaMax:  numeric("valor_venda_max", { precision: 12, scale: 2 }).default("0"),
  saldoInicial:   numeric("saldo_inicial",   { precision: 12, scale: 2 }).default("0"),
  estado:         text("estado"),
  cidade:         text("cidade"),
  ativo:          boolean("ativo").notNull().default(true),
  criadoEm:       timestamp("criado_em").defaultNow(),
});

export const insertAplicativoSchema = createInsertSchema(aplicativosTable).omit({ id: true, criadoEm: true });
export const selectAplicativoSchema = createSelectSchema(aplicativosTable);

export type InsertAplicativo = z.infer<typeof insertAplicativoSchema>;
export type Aplicativo = typeof aplicativosTable.$inferSelect;
