---
name: Importar Rotas — sincronização web → app
description: Como a importação de planilha de clientes na web chega ao app do cobrador via comandos_cliente.
---

# Importar Rotas (web) → app do cobrador

Regra: toda ação da web que precisa refletir no app do cobrador vai pela fila `comandos_cliente` (polling ~20s + ack). A importação de rota usa o tipo `cliente-importar`.

**Fluxo:** POST /api/importar-rota insere cliente+empréstimo no Postgres E enfileira um comando `cliente-importar` por cliente (endereçado ao codigoAcesso da rota, clienteId numérico = Date.now()+índice — convenção do app: ids são timestamps). O app aplica no polling: monta ClienteItem, adiciona a `clientes` + `ordemClientesIds`, persiste saveDB ANTES do ack.

**ULT.PAGO (formato):** a planilha traz ULT.PAGO como `2026-07-07 ( Vr 30 )` — o valor recebido é o número após "Vr". Nunca usar parseNum genérico (mistura a data com o valor); usar parser dedicado: regex `vr\.?\s*([\d.,]+)`, fallback parênteses, só-data → 0. Clientes importados entram no app marcados como COBRADOS hoje com valor = ULT.PAGO (rota importada vem de caixa já trabalhado). Parcelas pagas: o SALDO é a fonte da verdade (C.PAGAS vem sempre 0) — pagas = (totalAPagar − saldo)/valorParcela, PODE SER FRACIONÁRIO (ex.: 1,5 = pagamento parcial; C.RESTA da lista traz 12,5). Não arredondar para inteiro: manter round2 na web, API e app para Pendentes = cuotas − pagas bater com C.RESTA. No histórico sintetizado do app: floor(pagas) entradas "Parcela" cheias + 1 entrada parcial (valor = fração×parcela) + max(0, VISITAS − entradas c/ pagamento) "Sem pagamento" — assim a ficha mostra Visitas = coluna VISITAS e Atrasadas = visitas sem pagamento.

**Resumen (caixa inicial/final):** o import do Resumen XLS deve PERSISTIR — só guardar em estado React não funciona (polling de 10s sobrescreve com o snapshot fechamento-rota e reload perde tudo). A web envia a `rota` junto no FormData; a API grava o resumo como dadosSnapshot no caixa do cobrador (atualiza aberto ou insere fechado) e enfileira comando `caixa-definir` (clienteId "0") com caixaInicial = Caja INICIAL da planilha (não a final!) — como os clientes importados já entram cobrados com ULT.PAGO, a cobrançaDiaria do app (soma de cobradosValores) reproduz o dia e o Caixa Final bate com o da planilha.

**Dedupe (importante):** reimportar a mesma planilha gera novos comandos/ids. O app deduplica por id, por `consecutivo` e — quando a planilha não tem consecutivo — por chave composta nome+telefone+endereço normalizada.

**Despesas/rendimentos/retirada reais:** a planilha Resumen tem abas "Gastos" e "Ingresos" ([Concepto, Valor, Observaciones]) com os itens reais; a aba "Resumen" só traz totais. A importação extrai as listas (parseMovSheet), grava despesasLista/rendimentosLista no snapshot (abas Despesas/Rendimentos da web) e enfileira comandos `despesa`/`rendimento` para o app (ids determinísticos = Date.parse(dia meio-dia)+offset+índice → reimportar não duplica). "Retiros de caja" → categoria "Retirada de Caixa" (convenção do sistema). **Armadilha parseNum:** valores dessas abas vêm em PT "100,00" (vírgula decimal SEM ponto de milhar) — o detector de formato não pode exigir presença de ponto, senão "100,00" vira 10000.

**Atrasadas/visitas:** na ficha do app esses números são DERIVADOS do histórico de pagamentos do ciclo (atrasadas = "Sem pagamento"; visitas = total com id >= creditoStartTimestamp). A importação sintetiza esse histórico: `pagas` entradas "Parcela" + atrasadas entradas "Sem pagamento" (fallback: visitas − pagas). O snapshot ao admin também deriva visitas/atrasadas de historicoPagamentos (registro do dia como piso) — nunca gravar 0 fixo.

**Why:** o app trabalha com DB local (localStorage); inserir só no Postgres não aparece no app. Aplicar/persistir antes do ack garante durabilidade se o app fechar.

**How to apply:** novos fluxos web→app devem seguir o mesmo padrão (novo tipo na fila, aplicação idempotente, saveDB antes do ack, dedupe que sobreviva a re-envio).
