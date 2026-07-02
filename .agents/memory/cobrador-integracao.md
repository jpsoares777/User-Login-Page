---
name: Cobrador app — integração e ícones
description: Estado da integração do app do cobrador com a API e lições sobre ícones com base path.
---

## Regra: ícones no app do cobrador
O app está em `/cobranca/` (base path). Todo `src` de imagem — seja em JSX (`src=`) ou em objetos JS (`src:`) — deve usar `import.meta.env.BASE_URL + "icons/foo.png"` em vez de `"/icons/foo.png"`.

**Why:** O Vite serve assets do `public/` com o prefixo do base path. Caminhos absolutos como `/icons/...` ignoram esse prefixo e quebram no ambiente Replit proxy.

## Controle de primeiro acesso e dispositivo

### Tabela `solicitacoes_acesso`
Criada via `lib/db/src/schema/solicitacoes.ts` e migrada com `pnpm run push-force`. Campos: `id, aplicativoId, codigoAcesso, cobradorNome, deviceId, tipo (primeiro_acesso|troca_dispositivo), status (pendente|aprovado|rejeitado), solicitadoEm, respondidoEm`.

### Campo `deviceId` na tabela `aplicativos`
Adicionado como `text("device_id")` nullable. Vinculado ao aprovar a solicitação.

### Fluxo de login com device
`POST /api/aplicativos/login` com `{ codigo, deviceId }`:
- `deviceId` não vinculado + sem solicitação aprovada → 403 `registro_necessario`
- `deviceId` não vinculado + solicitação pendente → 202 `pendente`
- `deviceId` diferente do vinculado + sem pendente → 403 `dispositivo_diferente`
- `deviceId` diferente do vinculado + pendente → 202 `pendente`
- `deviceId` igual ao vinculado → 200 OK

### API de solicitações
- `POST /api/solicitacoes` — cobrador envia nome + código + deviceId
- `GET /api/solicitacoes` — admin lista todas
- `PATCH /api/solicitacoes/:id/aprovar` — aprova + vincula deviceId no aplicativo
- `PATCH /api/solicitacoes/:id/rejeitar`
- `DELETE /api/aplicativos/:id/dispositivo` — desvincula dispositivo

### PinLogin.tsx — telas
- `pin`: entrada normal de código → tenta login
- `primeiro_acesso`: nome + código → submitSolicitacao → vai para `pendente`
- `pendente`: "Aguardando aprovação do administrador"
- `dispositivo_diferente`: nome + botão "Solicitar troca de dispositivo"

### Dashboard — Gerenciar Aplicativos
Botão laranja de alerta aparece na coluna Opções somente quando há solicitação pendente para aquela linha (`gaSolicitacoes.find(s => s.aplicativoId === row.id && s.status === "pendente")`). Abre modal com detalhes + botões Aprovar/Rejeitar + Desvincular dispositivo.

## Saldo inicial
O login retorna `saldoInicial` do aplicativo. PinLogin salva em localStorage via `setSaldoInicial`. ListaClientes usa `getSaldoInicial()` como default de `caixaInicial` em vez do hardcoded 3000 (só quando `db.caixaInicial` é undefined).

**Armadilha — DB local é global, não escopado por rota:** o localStorage do app usa UMA chave única (`cobranca_db_v2`), compartilhada por device. Ao logar numa ROTA DIFERENTE no mesmo dispositivo, o `caixaInicial` herdava o `caixaInicial` antigo do DB e o carry-over de mount (`setCaixaInicial(db.caixaFinal)` quando `lastDate!=hoje`) sobrescrevia com o `caixaFinal` da rota anterior → o `saldoInicial` da nova rota NÃO aparecia.

**Correção:** em `PinLogin.handleTentarLogin`, após `loginPorCodigo`, comparar `getCobradorId()` (anterior) com `sessao.id`; se `anterior !== null && anterior !== sessao.id` → `clearDB()` antes de `setCobradorId/setSaldoInicial`. Rota nova começa com DB vazio ⇒ `caixaInicial = getSaldoInicial()`. Re-login na MESMA rota (`anterior === sessao.id`) NÃO limpa ⇒ carry-over diário preservado. Logout não limpa `cobrador_id` (não há `removeItem`), então o gatilho é confiável. **Não** trocar o esquema de chave para `_<id>` sem migração — apagaria os dados atuais dos usuários que estão sob a chave sem sufixo.

## Persistência diária e fechamento de caixa (ListaClientes.tsx)
Há um `useEffect` que faz `saveDB(...)` toda vez que o estado muda. Ele clobbera o localStorage com os valores ATUAIS do React.

**Armadilha:** ao fechar caixa, `handleCaixaFechado` faz `setCobrados([])`/`setDespesas([])` etc. Isso dispara o `useEffect`, que sobrescreve o DB com arrays vazios — apagando o snapshot do dia. Resultado: ao admin reabrir o caixa no mesmo dia, os dados somem.

**Correção (3 partes, todas necessárias juntas):**
1. Guard no `useEffect`: `if (caixaFechadoHoje) return;` — impede o clobber após o fechamento.
2. `handleCaixaFechado.saveDB` salva `lastDate: getTodayStr()` + valores reais (closures pré-reset ainda têm os dados; setState é async).
3. Inicializadores dos campos diários devem ser date-checked (`db.lastDate === hoje`) para o dia seguinte começar limpo. `cobrados/ausentes/cobradosValores` já eram; `despesas/rendimentos` passaram a ser.

**Why:** o "reset diário" deve vir do date-check nos inicializadores (no mount/login), NÃO de zerar estado no fechamento. Misturar "caixa fechado" com "novo dia" causou o bug.

## Carimbo do caixaInicial vs. persistência diária (double-count na reabertura)
Ao fechar o caixa, `handleFecharCaixa` (RelatorioFinanceiro) "carimba" `caixaInicial = saldo` (já com os empréstimos descontados). Mas o fix da seção anterior mantém `emprestimentos` persistidos para a reabertura. Esses dois mecanismos juntos contam o empréstimo EM DOBRO ao reabrir same-day: o desconto fica no `caixaInicial` carimbado E reaparece em `novosEmprestimos`. Excluir o empréstimo remove só a parte reativa → o desconto fica "preso" no Saldo de Caixa.

**Correção:** un-bake same-day. No `saveDB` do fechamento, gravar `caixaInicialPreFechamento: caixaInicial` (closure = valor PRÉ-carimbo, pois `setCaixaInicial` do `onCaixaInicialChange` ainda não re-renderizou no mesmo batch) + `fechamentoDia: getTodayStr()`. Um `useEffect` de mount em ListaClientes restaura `caixaInicial` ao valor pré-fechamento quando `db.fechamentoDia === getTodayStr()` e limpa os marcadores (idempotente / StrictMode-safe).

**Why:** PinLogin só deixa entrar em ListaClientes com o caixa aberto, então `fechamentoDia === hoje` no mount ⇒ reabertura same-day confiável. `caixaFechadoData` NÃO serve para isso — PinLogin o limpa (`saveDB({caixaFechadoData: undefined})`) ao desbloquear. Em dia novo genuíno (`fechamentoDia != hoje`) o carry-over carimbado é mantido.

## Contagens do relatório vs. merge do fechamento
Regra de negócio: cliente criado hoje NÃO é cobrado hoje (`criadoHoje(creditoStartTimestamp)` — TelaLista já o esconde), EXCETO se `pagamentoAdiantado` (flag em `ClienteItem`, vinda do empréstimo/renovação): esse deve aparecer/contar no MESMO dia. Todo predicado deve ser `(!criadoHoje(ts) || c.pagamentoAdiantado)` — lista, Cobrança Esperada, denominador e onSemPagamentos. A flag deve ser propagada em TODOS os mapeamentos Emprestimo→ClienteItem (novoCliente, merge do fechamento, renovação — renovação sobrescreve a flag antiga). Qualquer métrica derivada de `clientes` OU de `clientesAdicionaisHoje` (Cobrança Esperada tem DOIS termos; denominador de "Cobranças Feitas") deve aplicar o MESMO filtro `!criadoHoje(...)` em TODOS os termos, senão diverge da lista após o merge do fechamento (cliente novo fica em `clientes` E em `clientesAdicionaisHoje` restaurado, ambos com `creditoStartTimestamp` = id do empréstimo).

**Armadilha:** contagens que somam `clientes` + marcadores do dia (`novosClientesIds` etc.) contam em dobro após reabertura same-day, pois o merge coloca o cliente em `clientes` E os marcadores são restaurados. Dedupe por id contra `clientes` resolve sem mudar o dia normal (pré-fechamento o cliente novo não está em `clientes`). Isso vale também para a RENDERIZAÇÃO: toda união `clientesBase + clientesAdicionais` (TelaLista `todosClientes`) precisa deduplicar por id preferindo `clientes` (é a cópia que recebe pagamento/reversão de saldo; a de `clientesAdicionaisHoje` fica stale) — senão o cliente adiantado aparece duplicado ao apagar uma cobrança.

## "Cobranças Feitas" — regulares vs. Adicionais
No Relatório Diário, a linha "Cobranças Feitas" é `cobradosCount / (clientesParaCobranca - adicionaisCount) — Adicionais: adicionaisCount`. Regra: cliente com `pagamentoAdiantado` criado hoje conta como ADICIONAL, não entra no denominador de regulares. `adicionaisCount` = subconjunto de `clientesParaCobranca` (mesmas fontes `clientes`+`clientesAdicionaisHoje`, mesmo `saldo>0`, mesmo dedupe `!clientes.some(id)`), com predicado mais restrito `criadoHoje && pagamentoAdiantado`. Assim `clientesParaCobranca - adicionaisCount` = regulares. `clientesParaCobranca` (total regular+adiantado) permanece alimentando `todosCorados` e o modal de fechamento — NÃO trocar por regulares aí, senão dá falso "todos cobrados". Denominador exibido usa `Math.max(0, ...)`.

## Carry-over automático do Saldo de Caixa entre dias
O Saldo de Caixa deve continuar de um dia para o outro: `caixaInicial` de hoje = saldo final de ontem, TODOS os dias — não só ao "Fechar Caixa" manual. Mecanismo: persistir o saldo corrente como `caixaFinal` (campo em `AppDB`) no useEffect de save (guardado por `caixaFechadoHoje`), e um useEffect de mount que, se `db.lastDate !== hoje && typeof db.caixaFinal === "number"`, faz `setCaixaInicial(db.caixaFinal)` + `saveDB({caixaInicial, lastDate:hoje, limpa caixaInicialPreFechamento/fechamentoDia})`.

**Why:** sem isso, se o dia vira sem fechamento manual, os deltas diários (cobrados/despesas/rendimentos — date-checked) resetam e `caixaInicial` fica o do início do dia anterior → o saldo do dia anterior "some". O carry-over por fechamento manual só cobria o caso do "Fechar Caixa".

**Guarda de dias:** `lastDate !== hoje` só dispara em dia novo genuíno; reabertura same-day é tratada pelo efeito un-bake (`fechamentoDia === hoje`). Carimbar `lastDate = hoje` torna o carry-over idempotente/StrictMode-safe. Empréstimos NÃO são date-checked, então `caixaFinal` deve filtrar empréstimos por `criadoHoje` (senão empréstimos antigos descontariam de novo).

**CRÍTICO — fórmula do saldo em 3 lugares idênticos:** `caixaInicial + cobrancaDiaria + totalRendimentos - novosEmprestimos(criadoHoje) - retiradaCaixa - totalDespesas`. Deve ser IGUAL em (1) `RelatorioFinanceiro` (exibição, linha do `saldo`), (2) persistência de `caixaFinal` no useEffect, (3) `handleCaixaFechado` (`caixaFinalSnap`/`novosEmpSnap` enviados à API). O `novosEmpSnap` do fechamento manual DEVE filtrar `criadoHoje` igual aos outros dois, senão o snapshot/API diverge do saldo local e do carry-over.

## Relatório Diário da web (DADOS DA ROTA) — fonte e "tempo real"
O painel `Liq. Diária > Relatório Diário` (dashboard.tsx, render ~8006-8097) exibe `importedRotaData[rota] ?? rotasFakeData[rota]`. `importedRotaData` é preenchido por (a) `GET /api/caixa/fechamento-rota` e (b) import XLS (`POST /api/importar-resumo`).

**CRÍTICO:** `fechamento-rota` (caixa.ts) lê APENAS o snapshot do ÚLTIMO caixa **fechado** (`status='fechado'`, `dadosSnapshot`). Enquanto o caixa está ABERTO, retorna `null` ⇒ NÃO existe fonte de dados ao vivo no servidor durante o dia. Logo, "tempo real de verdade" (lançamentos do cobrador aparecendo durante o dia) depende da sincronização app→servidor, que ainda está quebrada.

O fetch do frontend agora faz polling de 10s (setInterval+cleanup) e sobrescreve `importedRotaData[rota]` só quando `data` é truthy (import XLS preservado, pois rota sem caixa fechado real retorna null). Antes tinha guard `if (prev[rota]) return prev` que congelava após a 1a carga. Para tempo real durante caixa aberto, faltaria um endpoint de agregação ao vivo (open caixa + pagamentos + movimentos + clientes/emprestimos).

## Sincronização app→servidor quebrada (POST /api/pagamentos 500)
O app envia `emprestimoId` = timestamp gerado no cliente (ex.: 1783013955454), que NÃO existe em `emprestimosTable` ⇒ violação de FK ⇒ 500 no `POST /api/pagamentos`. `POST /api/caixa/movimentos` e `/caixa/fechar` funcionam. Raiz: clientes/empréstimos do app não são criados no DB (localStorage é a fonte de verdade e usa ids-timestamp locais). Enquanto isso não for resolvido, pagamentos não persistem no servidor e o Relatório Diário só reflete o snapshot de fechamento.

## Pendente (próxima sessão)
- Sincronização completa: carregar/criar clientes/empréstimos no DB com ids reais (resolver o 500 dos pagamentos por FK) — pré-requisito do tempo real durante o dia
- Endpoint de agregação ao vivo para o Relatório Diário quando o caixa está aberto
- Testar fluxo ponta a ponta: cobrador registra pagamento → aparece na Plataforma Web
