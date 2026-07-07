---
name: Importar Rotas — sincronização web → app
description: Como a importação de planilha de clientes na web chega ao app do cobrador via comandos_cliente.
---

# Importar Rotas (web) → app do cobrador

Regra: toda ação da web que precisa refletir no app do cobrador vai pela fila `comandos_cliente` (polling ~20s + ack). A importação de rota usa o tipo `cliente-importar`.

**Fluxo:** POST /api/importar-rota insere cliente+empréstimo no Postgres E enfileira um comando `cliente-importar` por cliente (endereçado ao codigoAcesso da rota, clienteId numérico = Date.now()+índice — convenção do app: ids são timestamps). O app aplica no polling: monta ClienteItem, adiciona a `clientes` + `ordemClientesIds`, persiste saveDB ANTES do ack.

**Dedupe (importante):** reimportar a mesma planilha gera novos comandos/ids. O app deduplica por id, por `consecutivo` e — quando a planilha não tem consecutivo — por chave composta nome+telefone+endereço normalizada.

**Why:** o app trabalha com DB local (localStorage); inserir só no Postgres não aparece no app. Aplicar/persistir antes do ack garante durabilidade se o app fechar.

**How to apply:** novos fluxos web→app devem seguir o mesmo padrão (novo tipo na fila, aplicação idempotente, saveDB antes do ack, dedupe que sobreviva a re-envio).
