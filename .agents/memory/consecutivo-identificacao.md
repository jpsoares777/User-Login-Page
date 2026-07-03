---
name: Consecutivo (número de identificação do empréstimo)
description: Como o número único de 10 dígitos por empréstimo é gerado e onde propaga no app do cobrador.
---

# Consecutivo — número de identificação de 10 dígitos

Cada empréstimo (novo ou renovado) recebe um `consecutivo`: string de 10 dígitos (primeiro dígito 1-9).

**Requisito do usuário:** pode ser gerado de qualquer forma, mas NÃO pode repetir com nenhum empréstimo da rota — ativos, inativos OU cancelados.

**Decisão de design:** geração aleatória + verificação de unicidade em `gerarConsecutivoUnico()` (em `lib/storage.ts`). O conjunto de "usados" é a união de:
- registro dedicado em localStorage (`cobranca_consecutivos_v1`), que só cresce e NÃO é apagado por `clearDB()`;
- varredura dos dados locais (`loadDB()`: emprestimentos, clientes, quitadosClientes, clientesAdicionaisHoje, novosClientesOutras) — self-heal caso o registro dedicado seja perdido/limpo.

**Why:** cancelados/inativos precisam continuar "reservando" o número; por isso o registro nunca encolhe e ainda re-escaneia o DB.

**How to apply / propagação (não esquecer nenhum ponto ao mexer):**
- Gerado em `CadastroCliente.handleSalvar` e devolvido em `emp.consecutivo` (serve para novo E renovação, pois a renovação reusa o form).
- Novo cliente: `ListaClientes` handler do `activeNav===1` copia para `ClienteItem` e `Emprestimo`.
- Renovação: `ListaClientes` `onSalvar` atualiza `consecutivo` do cliente e cria novo `Emprestimo` com ele.
- Fechamento: `handleCaixaFechado` copia `consecutivo` ao converter `emprestimentos` → `ClienteItem` (fácil esquecer).
- Tipos: campo `consecutivo?: string` em `Emprestimo` (EmprestimosDoDia.tsx) e `ClienteItem` (ClienteDetalhe.tsx). Persiste automaticamente via `saveDB` (serializa arrays inteiros).

**Limitação conhecida:** unicidade é por dispositivo/navegador (localStorage). Não há coordenação global de rota via backend; se um dia precisar garantir unicidade entre dispositivos, gerar/validar no servidor.
