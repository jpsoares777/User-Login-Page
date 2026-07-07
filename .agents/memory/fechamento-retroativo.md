---
name: Fechamento retroativo de caixa (app cobrador)
description: Regra do fechamento automático do dia pendente e a armadilha dos dois formatos de data (pt-BR no localStorage vs ISO na API/snapshot).
---

# Fechamento retroativo de caixa

Se o cobrador não fechou o caixa no dia anterior, ao entrar hoje o app detecta a pendência (`db.lastDate !== hoje && db.fechamentoDia !== db.lastDate`), bloqueia a UI, fecha automaticamente o caixa DO DIA PENDENTE (só com as movimentações daquele dia), abre o novo caixa de hoje no servidor (senão o PIN trava aguardando o admin reabrir) e manda o cobrador digitar o PIN de novo. O novo dia começa limpo com `caixaInicial = caixaFinal` do dia fechado.

**Por que `fechamentoDia` e não `caixaFechadoData`:** o PinLogin limpa `caixaFechadoData` a cada login; `fechamentoDia` é carimbado no fechamento normal e limpo na reabertura same-day e na virada de dia.

## Armadilha: DOIS formatos de data coexistem
- localStorage (`lastDate`, `fechamentoDia`) usa **pt-BR "DD/MM/YYYY"** via `getTodayStr()` (`toLocaleDateString("pt-BR")`).
- API e snapshot (`data` dos movimentos, `dataFechamento`, filtros de pagamento `p.data === dataStr`) usam **ISO "YYYY-MM-DD"**.

**Regra:** qualquer data que sai do localStorage para a API/snapshot precisa ser convertida (helper `brDateToIso` em ListaClientes). Misturar os formatos quebra silenciosamente filtros de snapshot e histórico — foi exatamente o bug apontado na 1ª revisão do fechamento retroativo.

**Como aplicar:** ao mexer em fechamento de caixa, snapshot ou qualquer fluxo que leia `lastDate`/`fechamentoDia` e poste na API, verificar o formato em ambas as pontas antes de comparar/enviar.

Idempotência (StrictMode): efeito de auto-disparo usa ref guard + comparação `caixaFechadoData (ISO) === brDateToIso(pendente)` no DB.
