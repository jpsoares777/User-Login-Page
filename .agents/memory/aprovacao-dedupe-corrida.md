---
name: Dedupe de solicitações de aprovação (corrida POST + polling)
description: Por que a deduplicação de solicitações precisa ser no nível do banco (índice UNIQUE parcial) e não SELECT+INSERT na rota.
---

# Duplicação de solicitações de aprovação

As solicitações do App do Cobrador (empréstimos e movimentos/rendimentos/despesas)
chegavam **duplicadas** no admin (dois cards idênticos).

**Causa raiz:** o app envia a pendente por um POST inicial e, em paralelo, o
ciclo de polling (a cada ~20s) reenvia toda pendente que ainda não tem
`solicitacaoId`. Antes de o POST inicial retornar e setar o `solicitacaoId`,
o polling dispara um segundo POST com o **mesmo `localId`**. O dedupe antigo da
rota era `SELECT` (não acha) seguido de `INSERT` — **não é atômico**, então os
dois POSTs concorrentes não encontram nada e ambos inserem.

**Correção durável:** deduplicar no **nível do banco**.
- Índice UNIQUE **parcial** em `(codigo_acesso, local_id) WHERE local_id IS NOT NULL`
  nas tabelas `solicitacoes_emprestimo` e `solicitacoes_movimento`
  (definido no schema drizzle via `uniqueIndex(...).on(...).where(sql\`... is not null\`)`).
  Parcial porque `local_id` é nullable e NULLs devem continuar permitidos.
- Nas rotas POST: `.onConflictDoNothing().returning()`; se nada voltou e há
  `localId`, re-selecionar por `(codigoAcesso, localId)` e devolver a existente
  com status 200.

**Why:** SELECT-depois-INSERT nunca é seguro contra concorrência; a unicidade
tem que ser garantida pelo banco. O par POST-inicial + polling é uma fonte
garantida de POSTs concorrentes com o mesmo `localId`.

**How to apply:** qualquer novo endpoint que receba pendentes idempotentes do
app (padrão localId) deve ter o índice UNIQUE parcial + onConflictDoNothing,
não confiar em SELECT prévio. Ao adicionar a constraint, **limpar duplicados
existentes antes** (mantendo o menor id por codigo_acesso+local_id) senão o
push/CREATE INDEX falha. Validado com 5 POSTs concorrentes → 1 linha.
