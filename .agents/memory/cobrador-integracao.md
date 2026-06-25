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

## Pendente (próxima sessão)
- Sincronização completa: carregar clientes/empréstimos da API ao abrir o app
- Testar fluxo ponta a ponta: cobrador registra pagamento → aparece na Plataforma Web
