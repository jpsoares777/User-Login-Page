import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { aplicativosTable } from "./aplicativos";

// Comandos administrativos enviados do painel web para o app do cobrador.
// O admin edita/exclui um cliente na aba "Gerenciar Clientes"; o comando fica
// "pendente" até o app buscá-lo (polling), aplicar no seu banco local
// (localStorage) e confirmar (ack) — quando então vira "aplicado".
export const comandosClienteTable = pgTable("comandos_cliente", {
  id:           serial("id").primaryKey(),
  aplicativoId: integer("aplicativo_id").references(() => aplicativosTable.id, { onDelete: "cascade" }),
  codigoAcesso: text("codigo_acesso").notNull(),
  tipo:         text("tipo").notNull(), // "editar" | "excluir"
  clienteId:    text("cliente_id").notNull(), // id do cliente no app (timestamp local)
  consec:       text("consec"),
  dados:        jsonb("dados"), // campos editados (tipo "editar")
  status:       text("status").notNull().default("pendente"), // pendente | aplicado
  criadoEm:     timestamp("criado_em").defaultNow(),
  aplicadoEm:   timestamp("aplicado_em"),
});

export const insertComandoClienteSchema = createInsertSchema(comandosClienteTable).omit({ id: true, criadoEm: true, aplicadoEm: true });
export const selectComandoClienteSchema = createSelectSchema(comandosClienteTable);

export type InsertComandoCliente = z.infer<typeof insertComandoClienteSchema>;
export type ComandoCliente = typeof comandosClienteTable.$inferSelect;
