---
name: Importar Rotas — sincronização web → app
description: Como a importação de planilha de clientes na web chega ao app do cobrador via comandos_cliente.
---

# Importar Rotas (web) → app do cobrador

Regra: toda ação da web que precisa refletir no app do cobrador vai pela fila `comandos_cliente` (polling ~20s + ack). A importação de rota usa o tipo `cliente-importar`.

**Fluxo:** POST /api/importar-rota insere cliente+empréstimo no Postgres E enfileira um comando `cliente-importar` por cliente (endereçado ao codigoAcesso da rota, clienteId numérico = Date.now()+índice — convenção do app: ids são timestamps). O app aplica no polling: monta ClienteItem, adiciona a `clientes` + `ordemClientesIds`, persiste saveDB ANTES do ack.

**ULT.PAGO (formato):** a planilha traz ULT.PAGO como `2026-07-07 ( Vr 30 )` — o valor recebido é o número após "Vr". Nunca usar parseNum genérico (mistura a data com o valor); usar parser dedicado: regex `vr\.?\s*([\d.,]+)`, fallback parênteses, só-data → 0. Clientes importados entram no app marcados como COBRADOS hoje com valor = ULT.PAGO (rota importada vem de caixa já trabalhado). Parcelas pagas com coluna 0: derivar = round((totalAPagar − saldo)/valorParcela) — na web, na API e no app.

**Dedupe (importante):** reimportar a mesma planilha gera novos comandos/ids. O app deduplica por id, por `consecutivo` e — quando a planilha não tem consecutivo — por chave composta nome+telefone+endereço normalizada.

**Atrasadas/visitas:** na ficha do app esses números são DERIVADOS do histórico de pagamentos do ciclo (atrasadas = "Sem pagamento"; visitas = total com id >= creditoStartTimestamp). A importação sintetiza esse histórico: `pagas` entradas "Parcela" + atrasadas entradas "Sem pagamento" (fallback: visitas − pagas). O snapshot ao admin também deriva visitas/atrasadas de historicoPagamentos (registro do dia como piso) — nunca gravar 0 fixo.

**Why:** o app trabalha com DB local (localStorage); inserir só no Postgres não aparece no app. Aplicar/persistir antes do ack garante durabilidade se o app fechar.

**How to apply:** novos fluxos web→app devem seguir o mesmo padrão (novo tipo na fila, aplicação idempotente, saveDB antes do ack, dedupe que sobreviva a re-envio).
