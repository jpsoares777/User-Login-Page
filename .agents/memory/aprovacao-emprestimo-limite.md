---
name: Aprovação de empréstimo por limite
description: Fluxo em que empréstimos/renovações acima do Valor Máximo Empr. viram solicitação no admin antes de entrar no sistema.
---

# Aprovação de empréstimo por limite

Quando o cobrador cria NOVO empréstimo ou RENOVAÇÃO cujo principal (`emp.valorEmprestado`)
excede o `valorVendaMax` do aplicativo, o cliente NÃO entra na carteira: gera-se uma
solicitação em "Aprovações Empr." no admin. Só materializa quando ACEITO; recusado some.
`valorVendaMax = 0` significa sem limite (gate só aplica com `valorVendaMax > 0`).

## Decisões duráveis (não-óbvias)

- **Dedupe no servidor é por `localId`** (= `String(emp.id)`, sendo `emp.id = Date.now()`).
  Isso torna o POST de solicitação idempotente: reenviar a mesma solicitação é seguro.
  **Why:** o app reenvia pendentes órfãos (POST inicial falho) a cada poll; sem dedupe
  no backend haveria solicitações duplicadas.

- **Materialização idempotente no app** depende de duas guardas em memória em
  `ListaClientes.tsx`: `pollingRef` (lock contra execuções sobrepostas do `setInterval`)
  e `materializadosRef: Set<localId>` (aplica cada aceite no máximo uma vez).
  **Why:** `aplicarRenovacao` não é idempotente sozinha (readiciona histórico de crédito
  e cria `emprestimentos` com `id: Date.now()` sem dedupe) — polls concorrentes duplicavam
  o cliente renovado. **How to apply:** qualquer mudança no polling deve manter o lock e a
  guarda por localId; a dedupe é em memória (não sobrevive a restart do app — endurecimento
  futuro seria persistir o marcador no storage).

- **Admin (`dashboard.tsx`) `mudar()` valida `res.ok`**: em erro HTTP desfaz o update
  otimista via `carregar()`. **Why:** sem isso, 4xx/5xx (ex.: solicitação já respondida)
  deixava a UI divergente do servidor.
