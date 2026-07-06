---
name: Snapshot do cobrador — empréstimo ativo no histórico
description: Por que o array `historico` do snapshot precisa injetar o empréstimo ATIVO atual, senão a ficha do cliente no admin fica vazia.
---

# Empréstimo ativo no snapshot (clientesLista)

O App do Cobrador monta `historico` de cada cliente no snapshot a partir de
`historicoCreditos[c.id]` — que guarda **apenas créditos passados/renovados**.
O empréstimo **em curso** só entra em `historicoCreditos` quando é renovado ou
quitado. Portanto, para um cliente com empréstimo ativo (especialmente o
primeiro), `historico` vinha **vazio**.

**Sintoma:** no admin (web-platform, ficha do cliente / "Ver Parcelas Pagas —
Empréstimo Ativo"), a tabela ficava vazia e TOTAL EMPRÉSTIMOS = $0. O admin
localiza o empréstimo ativo via `c.historico.find(h => h.status === "ACTIVO")`,
que não achava nada.

**Correção:** ao montar `clientesListaSnap` (e `novosClientesListaSnap`) no app,
**injetar o empréstimo em curso como entrada `ACTIVO`** no `historico` quando
`cuotas > 0` e ainda não houver uma entrada ACTIVO (data = início do crédito,
valor = valorVenda/principal, total, cuotas). No admin, a linha da ficha deve
usar `h.status === "ACTIVO"` (antes era `isAtivo` fixo em false) para exibir
pagas/atrasadas/saldo reais do ativo.

**Why:** o empréstimo ativo é a fonte de verdade do que o cobrador está
cobrando; sem ele no snapshot, toda a ficha do cliente no admin fica zerada.

**How to apply:** qualquer nova view do admin que dependa do "empréstimo ativo"
deve confiar na entrada ACTIVO do `historico` do snapshot. O status é sempre
gravado como `"ACTIVO"` (não "ATIVO") — manter consistente nos dois lados.
