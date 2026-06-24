---
name: Cobrador app — integração e ícones
description: Estado da integração do app do cobrador com a API e lições sobre ícones com base path.
---

## Regra: ícones no app do cobrador
O app está em `/cobranca/` (base path). Todo `src` de imagem — seja em JSX (`src=`) ou em objetos JS (`src:`) — deve usar `import.meta.env.BASE_URL + "icons/foo.png"` em vez de `"/icons/foo.png"`. O regex de substituição precisa cobrir os dois padrões.

**Why:** O Vite serve assets do `public/` com o prefixo do base path. Caminhos absolutos como `/icons/...` ignoram esse prefixo e quebram no ambiente Replit proxy.

**How to apply:** Sempre que adicionar nova imagem do public no cobrador app, usar `import.meta.env.BASE_URL + "nome-do-arquivo.png"`.

## Estado da integração (pendente para próxima sessão)

### Feito
- App clonado e rodando em `/cobranca/`
- `src/lib/api.ts` criado com funções: fetchCobradores, postPagamentoAPI, postMovimentoCaixaAPI
- PinLogin atualizado: após PIN correto → busca cobradores da API → seleção de cobrador
- ListaClientes recebe `cobradorId` como prop
- Ao registrar pagamento → POST fire-and-forget para `/api/pagamentos`
- Ao fechar caixa → POST despesas/rendimentos para `/api/caixa/movimentos`
- Todos os ícones corrigidos com BASE_URL (18 referências no total)

### Pendente (sincronização completa)
- Carregar lista de clientes da API ao abrir o app (atualmente usa só localStorage)
- Sincronização bidirecional: novos clientes/empréstimos criados no cobrador → POST para API
- Verificar se o endpoint `/api/cobradores` retorna dados corretos para o seletor de cobrador
- Testar fluxo completo: cobrador registra pagamento → aparece na Plataforma Web (Liq. Diária, Caixa Geral)
- Possível: tela de "Sincronizar" já existente no menu pode ser usada para sync manual

## Arquivos-chave
- `artifacts/cobranca-app/src/lib/api.ts` — cliente de API
- `artifacts/cobranca-app/src/pages/PinLogin.tsx` — seleção de cobrador
- `artifacts/cobranca-app/src/pages/ListaClientes.tsx` — componente principal (2197 linhas)
- `artifacts/cobranca-app/src/App.tsx` — passa cobradorId como prop
