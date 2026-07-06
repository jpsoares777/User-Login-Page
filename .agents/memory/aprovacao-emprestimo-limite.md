---
name: Aprovação de empréstimo por limite
description: Fluxo em que empréstimos/renovações acima do Valor Máximo Empr. viram solicitação no admin antes de entrar no sistema.
---

# Aprovação de empréstimo por limite

Quando o cobrador cria NOVO empréstimo ou RENOVAÇÃO cujo principal (`emp.valorEmprestado`)
excede o limite configurado, o cliente NÃO entra na carteira: gera-se uma solicitação em
"Aprovações Empr." no admin. Só materializa quando ACEITO; recusado some. Limite `0`
significa sem limite (gate só aplica com limite `> 0`).

## Limite é GLOBAL e persistente (não mais per-app)

- O limite **não** vem mais de `aplicativos.valorVendaMax` (per-rota, via login). Agora é
  **global**, definido no modal "Configurações" do admin e gravado na tabela singleton
  `configuracoes` (id=1, `data` jsonb `{vals, restVals}`) via `PUT /api/configuracoes`
  (upsert `onConflictDoUpdate`). **Why:** o dono configurava no modal global achando que
  valia para tudo, mas o modal era local-only e o app lia o per-app — cliente acima do
  limite passava sem aprovação.
- Há **dois limites separados** em `restVals`: NOVOS = `validarVendas` (toggle) + `maxVendas`;
  RENOVAÇÕES = `validarRenovacoes` + `maxRenovacoes`. O app resolve para `limiteNovo` /
  `limiteRenovacao` (`fetchLimitesAprovacaoAPI` em `api.ts`): toggle off ou valor 0 ⇒ 0.
  Gate de novo usa `limiteNovo`; gate de renovação usa `limiteRenovacao` (não confundir).
- **Fail-safe do limite no app:** `fetchLimitesAprovacaoAPI` grava o último limite válido
  em localStorage (`sessao_limite_novo`/`sessao_limite_renovacao`) e, em falha de rede/API,
  retorna esse cache em vez de 0. O estado em `ListaClientes` inicia do cache
  (`getLimitesAprovacaoCache`), então boot offline usa o último limite conhecido.
  **Why:** cair para 0 (sem limite) no boot/erro deixava passar empréstimos que exigiam
  aprovação. **How to apply:** nunca sobrescrever os limites com 0 num caminho de erro.
- **Admin `salvarConfig` valida `res.ok`**: só fecha o modal se o PUT confirmar; em falha
  mantém aberto e mostra erro. **Why:** fechar sempre dava falso sucesso sem persistir.
- **Nota de segurança conhecida:** `GET/PUT /configuracoes` (como todas as rotas da API
  deste projeto) não tem autenticação. Adicionar auth só nessa rota seria inconsistente;
  endurecimento futuro = camada de auth de admin para toda a API.

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
