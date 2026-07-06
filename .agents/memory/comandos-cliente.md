---
name: Comandos de cliente (admin → app)
description: Como Editar/Excluir clientes no admin propaga ao app do cobrador via tabela comandos_cliente
---

# Comandos de cliente (admin → app)

Fluxo: admin (Gerenciar Clientes) faz POST em `/api/comandos-cliente` (tipo `editar`|`excluir`); o app do cobrador faz polling (~20s) dos pendentes, aplica no localStorage e dá ack.

Regras duráveis:
- **Endereçamento por codigoAcesso**, nunca só por rota (rota não é única). O endpoint `clientes-rotas` devolve `codigoAcesso` por cliente para isso.
- **Durabilidade antes do ack**: o app grava direto no localStorage (loadDB/saveDB) ANTES do PATCH `/ack` — senão fechar o app entre setState e persistência perde a mudança.
- **Ack escopado**: PATCH `/ack` exige `codigoAcesso` no body e faz UPDATE com `and(id, codigoAcesso)` — uma rota não consegue ackar comandos de outra (achado do architect).
- **Consistência imediata no admin**: `clientes-rotas` aplica comandos PENDENTES por cima do snapshot (excluir filtra; editar faz merge `telefone→tel1`, `cidade+uf→"Cidade - UF"`), senão o admin só veria a mudança após o app sincronizar.
- Mapeamento de campos comando→app: `documento→cpf`, `telefone→telefone/tel1`.

**Why:** snapshot é publicado pelo app; qualquer edição do admin precisa viajar como comando e voltar via snapshot — o merge de pendentes cobre a janela intermediária.
**Cuidado em testes:** se o app estiver aberto em dev, ele aplica comandos de teste em dados reais em ~20s; restaurar via novo comando com dados do snapshot fechado anterior.
