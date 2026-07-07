---
name: Despesa/rendimento criados na web
description: Como lançamentos financeiros criados no admin chegam ao app e voltam via snapshot
---

Regra: lançamento de despesa/rendimento criado no admin web NÃO grava direto no snapshot — vira comando em `comandos_cliente` (tipo "despesa"/"rendimento", `clienteId` = id do movimento = timestamp de data+hora + segundos aleatórios; `dados` = {categoria, valor, data, hora, obs}).

**Why:** o dono dos dados é o app do cobrador (banco local); o snapshot é sobrescrito pelo snapshot-vivo do app, então qualquer escrita direta no snapshot seria perdida. O mesmo padrão já era usado para editar/excluir/inativar cliente.

**How to apply:**
- Admin vê o lançamento imediatamente porque `GET /caixa/movimentos-rotas` mescla comandos PENDENTES por cima do snapshot (dedupe por id; roda mesmo sem snapshot).
- App aplica no polling de comandos: adiciona à lista local `despesas`/`rendimentos` (dedupe por id), `saveDB` ANTES do ack; snapshot seguinte devolve o dado à web.
- Excluir pela web usa tipos "despesa-excluir"/"rendimento-excluir" (clienteId = id do movimento, sem dados); o endpoint movimentos-rotas filtra os ids excluídos pendentes da saída (some na hora) e o app remove da lista local antes do ack.
- EDITAR despesa/rendimento pela web continua SÓ local (não persiste) — débito conhecido.
- Modais exigem Rota* (endereçamento do comando via rota→codigoAcesso).
