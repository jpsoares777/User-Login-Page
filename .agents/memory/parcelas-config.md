---
name: Controle de parcelas (config admin ↔ app)
description: Significado dos 3 campos de "Controle de Parcelas" do modal admin e como são aplicados no app do cobrador
---

# Controle de Parcelas — significado definido pelo usuário

O modal admin (web-platform, seção "Controle de Parcelas") tem 3 campos de número de parcelas com sentidos distintos (NÃO confundir com fluxo de cancelamento):

- **Número de Parcelas** (`restVals.numeroParcelas`, default 99) → máximo de parcelas que o cobrador pode dar ao **criar/renovar** um empréstimo. Aplicado em `CadastroCliente.tsx` (limita o SelectField "Nº de Parcelas").
- **Nº Máximo Parcelas por Dia** (`restVals.validarParcelasDia` + `restVals.maxParcelasDia`) → quantas parcelas o cobrador pode **cobrar por pagamento**. Aplicado em `ParcelaCliente.tsx` (cap do seletor quando `paymentType==='parcela'`).
- **Nº Máx. Parcelas — Cancelar Venda** (`restVals.validarParcelasCancelar` + `restVals.maxParcelasCancelar`) → parcelas que o cliente pode pagar para **quitar**. SINCRONIZADO no app (`maxParcelasQuitar`), mas SEM enforcement — o app não tem ação dedicada de "quitar" (quitação é feita manualmente via Abono ou nº alto de parcelas). Regra exata pendente de confirmação do usuário.

**Sincronização:** valores viajam via `GET /api/configuracoes` → `fetchLimitesAprovacaoAPI()` em `cobranca-app/src/lib/api.ts`, que estende `LimitesAprovacao` com `maxParcelasNovo`/`maxParcelasDia`/`maxParcelasQuitar` e cacheia em localStorage (fail-safe). Convenção: `0 = sem limite`; `maxParcelasNovo` cai para 99 quando não definido.

**Why:** o usuário corrigiu explicitamente que esses campos são limites de nº de parcelas em 3 contextos, não um fluxo de cancelamento de venda.

**How to apply:** por ser fetch assíncrono (+ dados de renovação via initialData), é obrigatório fazer clamp do valor selecionado quando o limite chega, não só limitar as opções do select — senão salva/cobra acima do máximo.

**Bug corrigido:** no admin, os inputs "Número de Parcelas", o select "Parcelas por Dia" e o telefone (`telefoneAprovacoes`, uso futuro WhatsApp) estavam SEM binding (não salvavam); agora bindados em `restVals`.
