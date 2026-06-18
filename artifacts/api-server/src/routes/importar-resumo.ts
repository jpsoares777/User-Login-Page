import { Router, type IRouter } from "express";
import multer from "multer";
import * as XLSX from "xlsx";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function parseNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    // Format can be "3,179.00" (EN: comma=thousands, dot=decimal)
    // or "3.179,00" (PT: dot=thousands, comma=decimal)
    const s = v.trim();
    // Detect PT format: ends with ",XX" where XX are 1-2 digits
    const ptFormat = /,\d{1,2}$/.test(s) && s.includes(".");
    if (ptFormat) {
      // PT: remove dots (thousands), replace comma with dot
      return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
    } else {
      // EN: remove commas (thousands), keep dot
      return parseFloat(s.replace(/,/g, "")) || 0;
    }
  }
  return 0;
}

function parseStr(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

router.post("/importar-resumo", upload.single("arquivo"), (req, res): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Nenhum arquivo enviado" });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    if (!workbook.SheetNames.includes("Resumen")) {
      res.status(400).json({ error: "Aba 'Resumen' não encontrada no arquivo" });
      return;
    }

    const ws = workbook.Sheets["Resumen"];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

    const map: Record<string, unknown> = {};
    for (const row of rows as unknown[][]) {
      if (Array.isArray(row) && row.length >= 2 && row[0]) {
        map[parseStr(row[0])] = row[1];
      }
    }

    const vendedor = parseStr(map["Vendedor:"]);

    // Clientes Iniciales: "20 ( 20 Sincronizados / 20 )"
    const clientesInicStr = parseStr(map["Clientes Iniciales:"]);
    const clientesIniciais = parseInt(clientesInicStr) || 0;
    const sincMatch = clientesInicStr.match(/\(\s*(\d+)\s+Sincronizados/i);
    const sincronizados = sincMatch ? parseInt(sincMatch[1]) : clientesIniciais;

    // Clientes Nuevos/Renovados: "0 (0/0)"
    const novosStr = parseStr(map["Clientes Nuevos/Renovados:"]);
    const clientesNovos = parseInt(novosStr) || 0;
    const renovadosMatch = novosStr.match(/\((\d+)\/(\d+)\)/);
    const renovados = renovadosMatch ? parseInt(renovadosMatch[1]) : 0;

    const cancelados = typeof map["Clientes Cancelados:"] === "number"
      ? map["Clientes Cancelados:"] as number
      : parseInt(parseStr(map["Clientes Cancelados:"])) || 0;

    // Recaudo Actual: "360.00 ( 28.9% ) Pagos: 2 No Pagos: 18"
    const recaudoStr = parseStr(map["Recaudo Actual del Dia:"]);
    const recebAtual = parseNum(recaudoStr.split("(")[0]);
    const pagosMatch = recaudoStr.match(/Pagos:\s*(\d+)/i);
    const noPagosMatch = recaudoStr.match(/No Pagos:\s*(\d+)/i);
    const pagos = pagosMatch ? parseInt(pagosMatch[1]) : 0;
    const noPagos = noPagosMatch ? parseInt(noPagosMatch[1]) : 0;

    // Ventas: "0.00 ( Interes  0.00)"
    const ventasStr = parseStr(map["Ventas:"]);
    const novosEmp = parseNum(ventasStr.split("(")[0]);
    const jurosMatch = ventasStr.match(/Interes\s+([\d.,]+)/i);
    const juros = jurosMatch ? parseNum(jurosMatch[1]) : 0;

    // Cartera Final: "12,100.00( Sanción 0.00 )"
    const carteraStr = parseStr(map["Cartera Final:"]);
    const carteiraFinal = parseNum(carteraStr.split("(")[0]);
    const sancaoMatch = carteraStr.match(/Sanci[oó]n\s+([\d.,]+)/i);
    const sancao = sancaoMatch ? parseNum(sancaoMatch[1]) : 0;

    // Fecha de Cierre
    const fechaCierre = parseStr(map["Fecha de Cierre de Cobro:"]);
    const dataFechamento = fechaCierre.toLowerCase().includes("sin cerrar") || fechaCierre === ""
      ? null
      : fechaCierre;

    const resultado = {
      vendedor,
      cod: 0,
      dataInicio: parseStr(map["Fecha de Inicio de Cobro:"]),
      dataFechamento,
      ultimoAcesso: parseStr(map["Fecha de Inicio de Cobro:"]) + " 00:00:00",
      clientesIniciais,
      sincronizados,
      clientesNovos,
      renovados,
      cancelados,
      caixaInicial: parseNum(map["Caja Inicial:"]),
      carteiraInicial: parseNum(map["Cartera Inicial:"]),
      recebPrevisto: parseNum(map["Recaudo Pretendido del Dia:"]),
      recebAtual,
      pagos,
      noPagos,
      efetivo: typeof map["Recaudo Efectivo:"] === "number"
        ? map["Recaudo Efectivo:"] as number
        : parseNum(map["Recaudo Efectivo:"]),
      transferencia: typeof map["Recaudo Transferencia:"] === "number"
        ? map["Recaudo Transferencia:"] as number
        : parseNum(map["Recaudo Transferencia:"]),
      novosEmp,
      juros,
      rendimentos: typeof map["Ingresos:"] === "number"
        ? map["Ingresos:"] as number
        : parseNum(map["Ingresos:"]),
      despesas: typeof map["Egresos:"] === "number"
        ? map["Egresos:"] as number
        : parseNum(map["Egresos:"]),
      retirada: typeof map["Retiros:"] === "number"
        ? map["Retiros:"] as number
        : parseNum(map["Retiros:"]),
      caixaFinal: parseNum(map["Caja Final:"]),
      carteiraFinal,
      sancao,
    };

    res.json({ ok: true, data: resultado });
  } catch (err) {
    console.error("importar-resumo error:", err);
    res.status(500).json({ error: "Erro ao processar arquivo: " + (err instanceof Error ? err.message : "desconhecido") });
  }
});

export default router;
