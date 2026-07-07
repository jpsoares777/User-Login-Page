import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientesRouter from "./clientes";
import cobradoresRouter from "./cobradores";
import emprestimosRouter from "./emprestimos";
import pagamentosRouter from "./pagamentos";
import caixaRouter from "./caixa";
import aplicativosRouter from "./aplicativos";
import solicitacoesRouter from "./solicitacoes";
import solicitacoesEmprestimoRouter from "./solicitacoes-emprestimo";
import solicitacoesMovimentoRouter from "./solicitacoes-movimento";
import comandosClienteRouter from "./comandos-cliente";
import configuracoesRouter from "./configuracoes";
import importarRotaRouter from "./importar-rota";
import importarResumoRouter from "./importar-resumo";
import faturasRouter from "./faturas";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientesRouter);
router.use(cobradoresRouter);
router.use(emprestimosRouter);
router.use(pagamentosRouter);
router.use(caixaRouter);
router.use(aplicativosRouter);
router.use(solicitacoesRouter);
router.use(solicitacoesEmprestimoRouter);
router.use(solicitacoesMovimentoRouter);
router.use(comandosClienteRouter);
router.use(configuracoesRouter);
router.use(importarRotaRouter);
router.use(importarResumoRouter);
router.use(faturasRouter);
router.use(authRouter);

export default router;
