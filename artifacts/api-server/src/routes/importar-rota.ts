import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, clientesTable, emprestimosTable, cobradoresTable, aplicativosTable } from "@workspace/db";

const router: IRouter = Router();

interface ClienteImport {
  nome: string;
  telefone?: string;
  endereco?: string;
  consecutivo?: string;
  dataInicio: string;
  valorProduto: number;
  totalAPagar: number;
  jurosPct: number;
  valorParcela: number;
  numParcelas: number;
  parcelasPagas: number;
  parcelasRestantes: number;
  saldo: number;
}

router.post("/importar-rota", async (req, res): Promise<void> => {
  const { aplicativoId, clientes } = req.body as { aplicativoId: number; clientes: ClienteImport[] };

  if (!aplicativoId || !Array.isArray(clientes) || clientes.length === 0) {
    res.status(400).json({ error: "aplicativoId e lista de clientes são obrigatórios" });
    return;
  }

  const [aplicativo] = await db.select().from(aplicativosTable).where(eq(aplicativosTable.id, aplicativoId));
  if (!aplicativo) {
    res.status(404).json({ error: "Aplicativo não encontrado" });
    return;
  }

  let cobradorId = 1;
  const cobradores = await db.select().from(cobradoresTable);
  const cobMatch = cobradores.find(c => c.nome.toLowerCase() === aplicativo.cobradorNome.toLowerCase());
  if (cobMatch) {
    cobradorId = cobMatch.id;
  } else {
    const [novoCobrador] = await db.insert(cobradoresTable).values({
      nome: aplicativo.cobradorNome,
      rota: aplicativo.rota,
      estado: aplicativo.estado ?? "MARANHÃO",
      cidade: aplicativo.cidade ?? null,
    }).returning();
    cobradorId = novoCobrador.id;
  }

  let importados = 0;
  const erros: string[] = [];

  for (const c of clientes) {
    try {
      if (!c.nome || !c.nome.trim()) continue;

      const [cliente] = await db.insert(clientesTable).values({
        nome: c.nome.trim(),
        telefone: c.telefone ?? null,
        endereco: c.endereco ?? null,
        estado: aplicativo.estado ?? "MARANHÃO",
        cidade: aplicativo.cidade ?? null,
        ativo: true,
      }).returning();

      await db.insert(emprestimosTable).values({
        clienteId: cliente.id,
        cobradorId,
        consecutivo: c.consecutivo ?? null,
        idVenda: null,
        valorProduto: String(c.valorProduto ?? 0),
        totalAPagar: String(c.totalAPagar ?? 0),
        jurosPct: String(c.jurosPct ?? 40),
        numParcelas: c.numParcelas ?? 1,
        valorParcela: String(c.valorParcela ?? 0),
        frequencia: "DIARIO",
        dataInicio: c.dataInicio || new Date().toISOString().slice(0, 10),
        status: "Ativo",
        saldo: String(c.saldo ?? 0),
        parcelasPagas: String(c.parcelasPagas ?? 0),
        parcelasRestantes: String(c.parcelasRestantes ?? 0),
        ativo: true,
      });

      importados++;
    } catch (err) {
      erros.push(`Erro no cliente "${c.nome}": ${err instanceof Error ? err.message : "desconhecido"}`);
    }
  }

  res.json({ importados, erros, total: clientes.length });
});

export default router;
