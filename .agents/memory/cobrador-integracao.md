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
O login retorna `saldoInicial` do aplicativo. PinLogin salva em localStorage via `setSaldoInicial`. ListaClientes usa `getSaldoInicial()` como default de `caixaInicial` em vez do hardcoded 3000.

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
Regra de negócio: cliente criado hoje NÃO é cobrado hoje (`criadoHoje(creditoStartTimestamp)` — TelaLista já o esconde). Qualquer métrica derivada de `clientes` (Cobrança Esperada, denominador de "Cobranças Feitas") deve aplicar o MESMO filtro `!criadoHoje(...)`, senão diverge da lista após o merge do fechamento (que coloca o cliente novo em `clientes` com `creditoStartTimestamp = e.id`).

**Armadilha:** contagens que somam `clientes` + marcadores do dia (`novosClientesIds` etc.) contam em dobro após reabertura same-day, pois o merge coloca o cliente em `clientes` E os marcadores são restaurados. Dedupe por id contra `clientes` resolve sem mudar o dia normal (pré-fechamento o cliente novo não está em `clientes`).

## Pendente (próxima sessão)
- Sincronização completa: carregar clientes/empréstimos da API ao abrir o app
- Testar fluxo ponta a ponta: cobrador registra pagamento → aparece na Plataforma Web
