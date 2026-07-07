---
name: Caixa Geral (admin web) — saldo real e retirada
description: Como a aba Caixa Geral deriva saldo/movimentos reais e como a retirada web chega ao app
---

**Regra:** o saldo do Caixa Geral NÃO vem pronto da API — é derivado no front com a mesma fórmula do app:
`caixaInicial + recebAtual + rendimentos − novosEmp − despesas(≠"Retirada de Caixa") − retiradas`.
Fontes: `GET /api/caixa/fechamento-rota?rota=` (snapshot ao vivo/último fechado) + `GET /api/caixa/movimentos-rotas` (despesas/rendimentos JÁ incluindo comandos pendentes criados na web).

**Retirada pela web:** `POST /api/comandos-cliente` com `tipo:"despesa"` e `dados.categoria:"Retirada de Caixa"` — o app aplica via polling; como movimentos-rotas inclui pendentes, um refetch após o POST mostra a retirada e o saldo atualizado na hora (sem update otimista).

**Why:** o snapshot da rota só reflete o que o app já sincronizou; usar movimentos-rotas (com pendentes) evita duplicação e dá tempo real. Retirada é apenas uma despesa com categoria especial — o app já a subtrai do caixa por essa categoria.

**How to apply:** qualquer tela web que precise de saldo/movimento de caixa por rota deve combinar snapshot + movimentos-rotas e usar guarda de staleness (requestId) ao trocar de rota, limpando o estado imediatamente.
