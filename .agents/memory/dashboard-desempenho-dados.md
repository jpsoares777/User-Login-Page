---
name: Dashboard Desempenho — fonte dos gráficos
description: De onde vêm os dados reais dos 5 gráficos da aba Desempenho (web-platform)
---

# Dashboard "Desempenho" (web-platform/dashboard.tsx)

`DesempenhoContent` é autônoma: tem estado próprio (rotaSel/ano/mes), faz fetch+polling (10s) de `GET /api/caixa/fechamento-rota?rota=...` e calcula os 5 gráficos a partir do snapshot `RotaFakeData`. Não usa mais as constantes hardcoded (clientesData/ventasData/etc — deixadas no arquivo, sem uso).

**Fonte de cada gráfico:**
- Clientes (ano vs ano-1) e Empréstimo (ano vs ano-1): derivados de `clientesLista[].historico[]` ({data, valor}), agrupado por mês×ano.
- **Por quê:** o `historico` é a ÚNICA lista com créditos de múltiplos anos (2025+2026). `novosEmprestimos` (EmpRow) só tem os do dia atual, então NÃO serve para comparação ano a ano.
- Rendimentos vs Despesas: soma `valor` por mês de `rendimentosLista`/`despesasLista` filtrando pelo ano.
- Pizzas por categoria: agrupa `despesasLista`/`rendimentosLista` por `categoria`, filtra por ano e mês opcional.

**Formatos de data no snapshot (IMPORTANTE — divergem!):**
- `clientesLista[].historico[].data` e `dataEmprestimo`: "YYYY-MM-DD".
- `novosEmprestimos[].dataVenda`: "YYYY-MM-DD HH:MM:SS".
- `despesasLista[].data` e `rendimentosLista[].data`: **"DD/MM/YYYY"** (ex.: "06/07/2026").
- **Por quê:** o app grava despesas/rendimentos em dd/mm/yyyy. Qualquer parser de data que filtre por mês/ano DEVE aceitar os dois formatos, senão despesas/rendimentos somem dos gráficos. `valor` já vem como number.

**Armadilhas:**
- `Pie3DChart` divide por total → se soma=0 (categorias existem mas todas zeradas) dá NaN. Guardar por SOMA, não por length: fallback slice "Sem dados".
- Seletor de ano do `ChartCard`: gerar opções a partir de âncora fixa (`year` prop), nunca do valor selecionado, senão o ano original some ao trocar.
