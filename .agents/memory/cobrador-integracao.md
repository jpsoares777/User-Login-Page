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
Regra de negócio: cliente criado hoje NÃO é cobrado hoje (`criadoHoje(creditoStartTimestamp)` — TelaLista já o esconde), EXCETO se `pagamentoAdiantado` (flag em `ClienteItem`, vinda do empréstimo/renovação): esse deve aparecer/contar no MESMO dia. Todo predicado deve ser `(!criadoHoje(ts) || c.pagamentoAdiantado)` — lista, Cobrança Esperada, denominador e onSemPagamentos. A flag deve ser propagada em TODOS os mapeamentos Emprestimo→ClienteItem (novoCliente, merge do fechamento, renovação — renovação sobrescreve a flag antiga). Qualquer métrica derivada de `clientes` OU de `clientesAdicionaisHoje` (Cobrança Esperada tem DOIS termos; denominador de "Cobranças Feitas"; `recebPrevisto` do snapshot enviado à web) deve aplicar o MESMO filtro `!criadoHoje(...)` em TODOS os termos, senão diverge da lista após o merge do fechamento (cliente novo fica em `clientes` E em `clientesAdicionaisHoje` restaurado, ambos com `creditoStartTimestamp` = id do empréstimo). **Armadilha concreta:** o `recebPrevisto` do `buildDadosSnapshot` chegou a somar só `clientes.filter(saldo>0)` — cliente adiantado criado hoje vive em `clientesAdicionaisHoje`, então aparecia $0,00 no "Recebimento Previsto Hoje" da web. Correção: fonte ÚNICA `elegiveisCobrancaSnap` (clientes + clientesAdicionaisHoje, mesmo predicado `(!criadoHoje||pagamentoAdiantado)` + saldo>0, dedupe por id) usada para `recebPrevisto`, `pagos` e `noPagos` do snapshot.

**pagos/noPagos do snapshot contam APENAS clientes efetivamente VISITADOS hoje — NÃO os elegíveis pendentes.** Regra de negócio confirmada pelo usuário: "não pagos" só deve aparecer DEPOIS que o cobrador passa no cliente (registra pagamento, marca "Sem pagamento" ou marca ausente); cliente ainda não visitado (inclusive adiantado recém-criado) NÃO pode contar como não pago. Portanto: `pagos` = `cobrados` com valor>0; `semPagamento` = `cobrados.length - pagos` (marcados "Sem pagamento", valor 0); `noPagos` = `ausentes.length + semPagamento`. Fonte = marcações reais (`cobrados`/`ausentes`), NÃO `elegiveisCobrancaSnap` (esse é só para `recebPrevisto`). **Tentativa descartada:** derivar noPagos de elegíveis-com-valor-0 fazia o cliente aparecer em "não pagos" antes de ser cobrado — errado. **Ressalva conhecida (pré-existente):** fechar o caixa faz `setCobrados([])`/`setAusentes([])`, então reabrir no mesmo dia zera esses contadores de visita; aceitável para uso normal (caixa abre 1x/dia), mas confunde ao testar com fechar/reabrir. **Nota de rendering:** a exibição do rg SUBSTITUI o texto casado por "n" — o metodo real de sem-pagamento é a string `"Sem pagamento"`, não `"n"`; conferir com um grep cujo padrão NÃO case o literal.

**Armadilha:** contagens que somam `clientes` + marcadores do dia (`novosClientesIds` etc.) contam em dobro após reabertura same-day, pois o merge coloca o cliente em `clientes` E os marcadores são restaurados. Dedupe por id contra `clientes` resolve sem mudar o dia normal (pré-fechamento o cliente novo não está em `clientes`). Isso vale também para a RENDERIZAÇÃO: toda união `clientesBase + clientesAdicionais` (TelaLista `todosClientes`) precisa deduplicar por id preferindo `clientes` (é a cópia que recebe pagamento/reversão de saldo; a de `clientesAdicionaisHoje` fica stale) — senão o cliente adiantado aparece duplicado ao apagar uma cobrança.

## "Total de Clientes" da web = iniciais + novos (conjuntos DEVEM ser disjuntos)
A web calcula `totalClientes = rd.clientesIniciais + rd.clientesNovos` (só tem os dois números; não detecta overlap). Logo a disjunção tem que ser garantida no `buildDadosSnapshot` do app. **Armadilha:** `clientesIniciais = clientes.filter(saldo>0)` incluía os clientes NOVOS do dia (empréstimo novo vira cliente em `clientes` com `id: e.id` e `creditoStartTimestamp: e.id`), que também entram em `clientesNovos` (`novosNaoRenovSnap`) ⇒ conta em dobro (ex.: 2 novos → 2 iniciais + 2 novos = 4).

**Correção:** `novosIdsSnap = Set(novosNaoRenovSnap.map(e=>e.id))`; `clientesIniciais`/`sincronizados = clientes.filter(c => c.saldo>0 && !novosIdsSnap.has(c.id))`. Remove de "iniciais" APENAS quem já está em "novos". **NÃO** usar `!criadoHoje(creditoStartTimestamp)` no lugar: renovação também redefine `creditoStartTimestamp` para agora, mas renovado NÃO está em `novosNaoRenovSnap` (filtro `!renovacao`) ⇒ sumiria do total (subcontagem). `id` do empréstimo === `id` do cliente (merge usa `id: e.id`), então o Set casa.

**Re-sync:** o número na web vem do snapshot salvo no DB. Após mudar a lógica, a web só mostra o valor certo quando o app reenvia (heartbeat 15s de snapshot-vivo enquanto caixa aberto). Snapshot antigo continua "preso" até o app rodar o código novo.

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

## Tempo real (snapshot ao vivo) — RESOLVIDO
Padrão que faz "cada movimentação do cobrador aparecer na web sem fechar o caixa", contornando o 500 de `/pagamentos` (não depende de linhas individuais de pagamento). O app envia o MESMO `dadosSnapshot` (agregado) periodicamente enquanto o caixa está aberto; a web só lê snapshot.
- App: `buildDadosSnapshot(dataStr)` em ListaClientes é fonte ÚNICA das fórmulas (fechamento E ao vivo usam-na — evita divergência do saldo). useEffect envia `POST /caixa/snapshot-vivo` em mudanças de estado relevantes + heartbeat 15s, só quando `!caixaFechadoHoje && cobradorId>0` (cleanup do interval). `postSnapshotVivoAPI`/tipo `DadosSnapshot` em api.ts.
- API: `POST /caixa/snapshot-vivo` grava `dadosSnapshot` no caixa `status='aberto'` do cobrador (ok:false se não houver aberto — silencioso). `GET /caixa/fechamento-rota` agora PREFERE caixa aberto (orderBy id desc, ao vivo) e cai para último fechado; `dataFechamento` vem de `caixa.dataFechamento` (null p/ aberto → web mostra "Sistema sem Fechar").
- Web: dashboard já faz polling 10s de fechamento-rota ⇒ reflete o ao vivo em ~10s.
- Pré-requisito: caixa aberto no servidor (criado ao AUTORIZAR em solicitacoes/aprovar). Sem caixa aberto, snapshot-vivo é ignorado.
- Pendência defensiva (não bloqueante): índice único parcial p/ 1 caixa aberto por cobrador (evita ambiguidade se houver >1 aberto).

## Sincronização app→servidor quebrada (POST /api/pagamentos 500)
O app envia `emprestimoId` = timestamp gerado no cliente (ex.: 1783013955454), que NÃO existe em `emprestimosTable` ⇒ violação de FK ⇒ 500 no `POST /api/pagamentos`. `POST /api/caixa/movimentos` e `/caixa/fechar` funcionam. Raiz: clientes/empréstimos do app não são criados no DB (localStorage é a fonte de verdade e usa ids-timestamp locais). Enquanto isso não for resolvido, pagamentos não persistem no servidor e o Relatório Diário só reflete o snapshot de fechamento.

## Carteira Final = total a receber (empréstimo novo do dia não está em `clientes`)
Regra de negócio: Carteira Final = total exato a receber de TODOS os clientes (principal+juros das dívidas em aberto). Ex.: empréstimo 1.000 a 20% ⇒ 1.200.

**Armadilha:** o cliente de um empréstimo NOVO do dia NÃO entra no array `clientes` no mesmo dia (fica só em `emprestimentos` + `clientesAdicionaisHoje`/`novosClientesOutras`), então somar só `clientes.saldo` dá 0. Mas na REABERTURA same-day o merge do fechamento coloca esse cliente em `clientes` E restaura `emprestimentos` ⇒ risco de contar duas vezes.

**Como calcular sem double-count:** soma dos `clientes.saldo>0` (já líquida dos pagamentos do dia) + soma dos empréstimos novos de hoje que sejam NÃO-renovação E cujo id ainda NÃO esteja em `clientes`. Renovação é excluída porque já atualiza o saldo do cliente. Vale o padrão geral do arquivo: dedupe por id preferindo a cópia em `clientes` (ver seção "Contagens do relatório vs. merge").

## Saldo do cliente = dívida real (capital + juros)
O "Saldo" exibido deve ser a dívida TOTAL restante (capital + juros), NÃO o `valorEmprestado` (só capital). No modelo, `valorParcela` já embute juros (`CadastroCliente`: `totalComJuros = valorEmprestado*(1+juros/100)`, `valorParcela = totalComJuros/quantidadeParcelas`), então **saldo inicial = `valorParcela * quantidadeParcelas`** e **saldo corrente = `parcela * (totalParcelas - parcelasPagas)`**. Armadilha: os mapeamentos Emprestimo→ClienteItem gravavam `saldo: valorEmprestado` (só capital) → lista mostrava saldo menor que o devido. Corrigir em TODOS os mapeamentos (criação de novoCliente, merge do fechamento) e recalcular no load de `clientesAdicionaisHoje` (igual ao load de `clientes`, que já recomputava) para consertar registros antigos.

## Aba "Pagamentos" da web = linhas por cliente COBRADO dentro do snapshot
A aba `Liq. Diária > Pagamentos` (dashboard.tsx `PagamentosContent`) mostra dados REAIS por cliente da rota SELECIONADA (`selectedRota`), não uma lista global. Mecanismo: o app inclui um array **`pagamentosClientes`** DENTRO do `DadosSnapshot` em `buildDadosSnapshot`; como `/caixa/fechamento-rota` faz passthrough via `...snapshot`, o array chega à web sem tocar na API. `PagamentosContent({ rows })` recebe `importedRotaData[selectedRota]?.pagamentosClientes` (heartbeat 15s do app + polling 10s da web ⇒ tempo real). O mock global `pagamentosData` foi REMOVIDO; `PagRow` agora é tipo explícito (inclui campo `tipo`).

**Regra de negócio (confirmada nesta sessão):** o cliente SÓ aparece na aba Pagamentos se foi efetivamente COBRADO (está em `cobrados` no app — pagou, deu abono ou marcou "sem pagamento"). Cliente ainda não visitado NÃO aparece. Portanto o universo das linhas = `cobrados` (não mais "todos com saldo>0").

**Semântica dos campos (rótulos PORTUGUÊS — usuário mudou o padrão do espanhol nesta sessão):**
- `tipo` = "S/PAG." (não pagou / X vermelho) | "ABONO" (seta laranja) | "PARC." (check verde), renderizado pelo componente `TipoBadge`. Derivado do pagamento de hoje: abono→ABONO, valor>0→PARC., senão S/PAG.
- `formaPago` = "Dinheiro" | "PIX" | "" (vazio quando não pagou). **NÃO** usar "Efectivo"/"Transferência" (espanhol) — o usuário pediu explicitamente Dinheiro/PIX. Fonte: `registroPagamentos[id].forma` de hoje.
- `valorProd` (col. "Valor Empr.") = `parcela * totalParcelas` (total do contrato com juros), NÃO o principal.
- `valor` = valor pago hoje (`cobradosValores`); `saldo` = `cli.saldo`; `restantes` = `totalParcelas - parcelasPagas`.

**Coluna "Nro." (armadilha):** é a ORDEM de cobrança (1º cobrado=1, 2º=2...), renderizada como `i + 1` do índice da linha — NÃO `r.id` (que é o id do empréstimo, um timestamp gigante que estoura a coluna). A ordem vem de `pagamentosClientes` ser montado percorrendo `cobrados` (ordem de cobrança).

**Modal "Histórico de Pagamentos" (HistorialModal) = REAL:** cada linha de `pagamentosClientes` carrega `historico?: {nro,tipo,valor,fecha}[]`, mapeado no app de `registroPagamentos[cid]` (TODOS os pagamentos do cliente, todas as datas): `nro=idx+1`, `tipo` (Abono→ABONO / valor>0→PARC. / senão S/PAG.), `valor=p.valor`, `fecha=p.data`. O modal ordena desc por `nro` (mais recente no topo) e "TOTAL PAGOS" = soma de TODOS os `valor` (inclui abono monetário; S/PAG. soma 0). Coluna Observações fica vazia (registros reais não têm obs). O array `hist` HARDCODED ("Operacion Masiva") foi REMOVIDO.

**Padrão reutilizável:** para levar QUALQUER dado novo do app para a web durante o dia, basta adicioná-lo ao objeto `snapshot` de `buildDadosSnapshot` e ao tipo `DadosSnapshot` (app) + `RotaFakeData` (web) — o passthrough + heartbeat 15s + polling 10s cuidam do resto. Evite deixar os dois shapes divergirem manualmente.

## Abas Novos Empréstimos / Despesas / Rendimentos / Clientes da web = mesmas do padrão Pagamentos
As 4 abas antes usavam arrays MOCK fixos no `dashboard.tsx` (`emprestimosData`, `despesasData`, `rendimentosData`, `clientesRows`). Agora leem dados REAIS por rota via snapshot ao vivo, exatamente como `pagamentosClientes`: o app inclui `novosEmprestimos`, `despesasLista`, `rendimentosLista`, `clientesLista` em `buildDadosSnapshot`; a web passa `rows={importedRotaData[selectedRota]?.<campo> ?? []}` para os 4 componentes (agora `({ rows })`), com estado vazio (linha "Nenhum ... para esta rota") e totais recomputados de `rows`.

**Regra crítica de shape:** cada item das listas do app DEVE bater 1:1 com o row-type da web (`EmpRow`/`DespRow`/`RendRow`/`ClienteRow`) — os campos foram desenhados para casar. `DespRow`/`RendRow` = `typeof despesasData[0]`/`typeof rendimentosData[0]` (os arrays mock foram mantidos SÓ como fonte desses tipos; `EmpRow` já existia). Se mudar colunas de uma aba, ajuste os DOIS lados juntos ou a web renderiza campos vazios.

**Armadilha (segundo call-site):** `RendimentosContent`/`DespesasContent` também são usados em `Liq. Períodos` (`LiqPeriodosContent`), fora do escopo da integração por rota — esses continuam recebendo os arrays mock (`rows={despesasData}`/`rows={rendimentosData}`). Não esquecer de alimentar TODOS os call-sites ao tornar um componente `rows`-driven.

**Armadilha `clientesLista` (cliente novo diário some da aba Clientes):** `clientesListaSnap` montado só de `clientes` + `clientesAdicionaisHoje` (saldo>0) NÃO cobre o cliente diário novo SEM `pagamentoAdiantado` — esse não entra em nenhum dos dois arrays no mesmo dia; vive só em `emprestimentos`. Sintoma: o empréstimo aparece em "Novos Empréstimos" (`novosEmprestimos:1`) mas o cliente não em "Clientes" (`clientesLista:0`). Correção: complementar `clientesLista` com `novosEmpHojeSnap` deduplicado por id (mesmo padrão da "Carteira Final", seção acima), mapeando o Emprestimo→ClienteRow. **CRÍTICO:** filtrar `!e.renovacao` no complemento — renovação cria empréstimo com id NOVO enquanto o cliente renovado permanece em `clientes` com o id antigo, então dedupe por id não pega e duplicaria a linha do cliente.

**Erros de typecheck pré-existentes (não da feature):** `cobranca-app` tem muitos erros de `tsc --noEmit` (ex.: `gastosData`, `Metodo`, `MetodoPagamento`) e `web-platform` tem 2 (`GcRow`/`rota`, `codigoAcesso` em `GaSolicitacao`) que já existiam. O build é `vite build` (esbuild, ignora tipos), então roda mesmo assim. Não confundir com regressão.

## Diagnóstico: snapshot chega SEM um campo novo mesmo com o dev servindo o código certo
Sintoma: um campo novo do `snapshot` (ex.: `pagamentos`) some no banco (chave AUSENTE, não `[]`) enquanto os agregados chegam certos. Chave ausente (não vazia) ⇒ o código que RODOU não tinha a linha `campo: valor` (JSON.stringify só dropa `undefined`; um array vazio viraria `[]`). Como `buildDadosSnapshot` sempre produz array, ausência = **o app rodou bundle antigo**.

**Como isolar rápido (ordem):** (1) `curl $REPLIT_DEV_DOMAIN/cobranca/src/pages/ListaClientes.tsx` e grep pela linha no bundle transpilado — confirma que o DEV serve o código novo. (2) Teste o servidor isolado: `curl -X POST .../api/caixa/snapshot-vivo` com um `pagamentos:[{...}]` de teste e cheque `json_array_length` no banco + `curl .../api/caixa/fechamento-rota?rota=...` — se voltar o array, servidor+banco+web estão OK e o único elo quebrado é o app enviar. (3) Cheque `atualizado_em` do caixa: se atualiza só em reload (minutos, não 15s) e continua sem o campo após restart do workflow + hard refresh do usuário → o app NÃO está pegando o código novo do dev.

**Causa raiz típica:** o usuário/cobrador usa a **versão PUBLICADA** do app (deploy), cujo bundle é anterior à correção; `API_BASE="/api"` (mesma origem) faz o app publicado postar no MESMO banco de dev, então os snapshots aparecem aqui e confundem — parece dev, mas é o publicado. **Correção:** REPUBLICAR o app (o commit da correção precisa ir para o deploy). Reiniciar workflow e pedir reload NÃO resolvem e não devem ser repetidos. Dados da rota vivem só no localStorage daquele app; não dá para reconstruir no servidor (não há clientes/empréstimos da rota no DB — os empréstimos existentes são de cobradores de teste 1‑3).

**Limpeza:** ao injetar linha de teste no snapshot para provar o pipeline, remover depois com `UPDATE caixa SET dados_snapshot=(dados_snapshot::jsonb - 'pagamentos')::text WHERE id=...`.

## Crash pré-existente: fmtV no "Relatório Diário" da web (NÃO é da feature Pagamentos)
`dashboard.tsx`, bloco de render `Liq. Diária > Relatório Diário` (IIFE após `const rd = importedRotaData[...] ?? rotasFakeData[...]`): `const fmtV = (n:number)=>...n.toLocaleString(...)` e chamadas diretas `rd.rendimentos/despesas/retirada.toLocaleString(...)` quebram com `Cannot read properties of undefined (reading 'toLocaleString')` quando a rota selecionada (ex.: São Bento) tem CAIXA ABERTO e o snapshot ao vivo chega PARCIAL (sem alguns campos financeiros: caixaInicial, carteiraInicial, rendimentos, despesas, retirada, recebPrevisto, recebAtual). Derruba toda a `DashboardPage`.

**Correção (puramente defensiva, independente da feature Pagamentos):** `fmtV = (n: number|undefined|null) => \`$ ${(n ?? 0).toLocaleString(...)}\``; guardar as 3 chamadas diretas com `(rd.campo ?? 0)`; `pct` com `(rd.recebPrevisto ?? 0)`/`(rd.recebAtual ?? 0)`; `totalClientes = (rd.clientesIniciais ?? 0) + (rd.clientesNovos ?? 0)` (evita `NaN` na UI).

**Why/armadilha:** o bug é do CÓDIGO BASE, não da aba Pagamentos. Um revert para "antes da feature Pagamentos" REINTRODUZ o crash — comprovado: após restaurar os arquivos ao commit base, o mesmo erro voltou em fmtV. Se reverter de novo, reaplicar SÓ esses guards.

## Pendente (próxima sessão)
- Sincronização completa: carregar/criar clientes/empréstimos no DB com ids reais (resolver o 500 dos pagamentos por FK) — pré-requisito do tempo real durante o dia
- Endpoint de agregação ao vivo para o Relatório Diário quando o caixa está aberto
- Testar fluxo ponta a ponta: cobrador registra pagamento → aparece na Plataforma Web
