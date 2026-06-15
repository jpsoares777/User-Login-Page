import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientesRouter from "./clientes";
import cobradoresRouter from "./cobradores";
import emprestimosRouter from "./emprestimos";
import pagamentosRouter from "./pagamentos";
import caixaRouter from "./caixa";
import aplicativosRouter from "./aplicativos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientesRouter);
router.use(cobradoresRouter);
router.use(emprestimosRouter);
router.use(pagamentosRouter);
router.use(caixaRouter);
router.use(aplicativosRouter);

export default router;
