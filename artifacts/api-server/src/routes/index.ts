import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientesRouter from "./clientes";
import cobradoresRouter from "./cobradores";
import emprestimosRouter from "./emprestimos";
import pagamentosRouter from "./pagamentos";
import caixaRouter from "./caixa";
import aplicativosRouter from "./aplicativos";
import importarRotaRouter from "./importar-rota";
import importarResumoRouter from "./importar-resumo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientesRouter);
router.use(cobradoresRouter);
router.use(emprestimosRouter);
router.use(pagamentosRouter);
router.use(caixaRouter);
router.use(aplicativosRouter);
router.use(importarRotaRouter);
router.use(importarResumoRouter);

export default router;
