import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const faturasTable = pgTable("faturas", {
  id:            serial("id").primaryKey(),
  nro:           text("nro").notNull(),
  rota:          text("rota").notNull(),
  data:          text("data").notNull(),
  valorCentavos: integer("valor_centavos").notNull().default(0),
  meses:         integer("meses").notNull().default(1),
  conceito:      text("conceito").notNull(),
  estado:        text("estado").notNull().default("Pendente"),
  vencimento:    text("vencimento").notNull(),
  pais:          text("pais").notNull().default("BR"),
  criadoEm:      timestamp("criado_em").defaultNow(),
});

export const insertFaturaSchema = createInsertSchema(faturasTable).omit({ id: true, criadoEm: true });
export const selectFaturaSchema = createSelectSchema(faturasTable);

export type InsertFatura = z.infer<typeof insertFaturaSchema>;
export type Fatura = typeof faturasTable.$inferSelect;
