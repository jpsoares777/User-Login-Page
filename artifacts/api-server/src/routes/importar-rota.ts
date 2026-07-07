import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, clientesTable, emprestimosTable, cobradoresTable, aplicativosTable, comandosClienteTable } from "@workspace/db";

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
  atrasadas?: number;
  visitas?: number;
  ultPago?: number;
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
  // Base numérica para os ids que o APP usará localmente (convenção do app:
  // ids são timestamps). Cada cliente importado ganha base + índice.
  const idBaseApp = Date.now();
  let idxApp = 0;

  for (const c of clientes) {
    try {
      if (!c.nome || !c.nome.trim()) continue;

      // Fallback: deriva parcelas pagas/restantes do saldo quando a planilha
      // não trouxe esses valores (pagas = (total a pagar − saldo) / parcela).
      const valorParcelaNum = Number(c.valorParcela) || 0;
      const totalAPagarNum = Number(c.totalAPagar) || 0;
      const saldoNum = Number(c.saldo) || 0;
      const pagasDerivadas = valorParcelaNum > 0 && totalAPagarNum > 0
        ? Math.max(0, Math.round((totalAPagarNum - saldoNum) / valorParcelaNum))
        : 0;
      const parcelasPagas = Number(c.parcelasPagas) > 0 ? Number(c.parcelasPagas) : pagasDerivadas;
      const parcelasRestantes = Number(c.parcelasRestantes) > 0
        ? Number(c.parcelasRestantes)
        : (valorParcelaNum > 0 ? Math.max(0, Math.round(saldoNum / valorParcelaNum)) : 0);

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
        parcelasPagas: String(parcelasPagas),
        parcelasRestantes: String(parcelasRestantes),
        ativo: true,
      });

      // Sincroniza com o APP do cobrador: enfileira um comando
      // "cliente-importar" endereçado ao codigoAcesso da rota. O app aplica
      // no polling (~20s), adiciona o cliente à lista local e persiste.
      const idApp = idBaseApp + idxApp++;
      await db.insert(comandosClienteTable).values({
        aplicativoId: aplicativo.id,
        codigoAcesso: aplicativo.codigoAcesso,
        tipo: "cliente-importar",
        clienteId: String(idApp),
        consec: c.consecutivo ?? null,
        dados: {
          nome: c.nome.trim(),
          telefone: c.telefone ?? "",
          endereco: c.endereco ?? "",
          consecutivo: c.consecutivo ?? "",
          dataInicio: c.dataInicio || new Date().toISOString().slice(0, 10),
          valorProduto: c.valorProduto ?? 0,
          totalAPagar: c.totalAPagar ?? 0,
          jurosPct: c.jurosPct ?? 40,
          valorParcela: c.valorParcela ?? 0,
          numParcelas: c.numParcelas ?? 1,
          parcelasPagas,
          parcelasRestantes,
          saldo: c.saldo ?? 0,
          atrasadas: c.atrasadas ?? 0,
          visitas: c.visitas ?? 0,
          ultPago: c.ultPago ?? 0,
        },
        status: "pendente",
      });

      importados++;
    } catch (err) {
      erros.push(`Erro no cliente "${c.nome}": ${err instanceof Error ? err.message : "desconhecido"}`);
    }
  }

  res.json({ importados, erros, total: clientes.length });
});

export default router;
