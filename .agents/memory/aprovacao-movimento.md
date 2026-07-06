---
name: Aprovação de despesas/rendimentos
description: Fluxo de aprovação de lançamentos financeiros (gastos/rendimentos) acima do limite, espelhando o de empréstimos.
---

# Aprovação de despesas/rendimentos (Desp e Rend)

O botão/modal "Desp e Rend" do dashboard é um fluxo de APROVAÇÃO (aceitar/recusar),
espelhando "Aprovações Empr." (CodigosAprovacaoModal). NÃO é visualização.

**Regra:** despesa/rendimento cujo valor excede o limite global vira solicitação
pendente em vez de ser aplicada; o dono aprova/recusa no admin; o app materializa
o lançamento só quando ACEITO.

**Camadas (paralelas às de empréstimo):**
- Tabela `solicitacoes_movimento` (mesma forma de `solicitacoes_emprestimo`), tipo = "despesa"|"rendimento", campos categoria/valor/observacao/localId/payload/status.
- Rota `/solicitacoes-movimento`: POST (dedupe por codigoAcesso+localId, qualquer status), GET (filtros), PATCH aceitar|recusar (só se status pendente).
- app api.ts: `postSolicitacaoMovimentoAPI`, `fetchSolicitacoesMovimentoAPI`. Limites vêm de `fetchLimitesAprovacaoAPI` (campos `limiteGasto`/`limiteRendimento`).
- Limites na config global (restVals): despesa = `validarGastos`+`maxGastos`; rendimento = `validarRendimentos`+`maxRendimentos` (0/off = sem limite). Empréstimo usa `validarVendas/maxVendas` e `validarRenovacoes/maxRenovacoes`.
- ListaClientes: gate em `addDespesa`/`addRendimento`; estado `pendentesMovimento` persistido em saveDB; polling próprio (`pollingMovRef`, `materializadosMovRef`) materializa aceitos/remove recusados.

**Why:** o usuário quer controle: gastos/rendimentos altos exigem aprovação do dono antes de afetar o caixa da rota, como já acontece com empréstimos acima do limite.
