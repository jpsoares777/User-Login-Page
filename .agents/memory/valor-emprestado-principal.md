---
name: Valor emprestado (principal) vs total no snapshot
description: Como obter o principal do empréstimo para as colunas "Valor Empr." do admin sem cair no total com juros
---

Regra: a coluna "Valor Empr." (abas Pagamentos e Clientes do admin) mostra o PRINCIPAL (valor emprestado), nunca o total com juros.

**Por que não derivar do juros:** muitos clientes têm `taxaJuros = 0` gravado no objeto do cliente (bug de sincronização de dados). Derivar `principal = total/(1+pct/100)` retorna o próprio total quando pct=0, reproduzindo o bug. O total é `parcela × totalParcelas`.

**Fonte confiável:** o registro do empréstimo (`emprestimentos`, tipo `Emprestimo`) tem `valorEmprestado` = principal. O snapshot deve buscar o empréstimo do cliente e usar `valorEmprestado`.

**Vínculo cliente↔empréstimo (duplo):**
- empréstimo NOVO: `emp.id` vira o `id` do cliente (aplicarNovoEmprestimo) → casar por `e.id === cid`.
- RENOVAÇÃO: registro usa `e.clienteId` → casar por `e.clienteId === cid`.
- Portanto o lookup correto é `(e.clienteId === cid || e.id === cid)`, filtrando `valorEmprestado>0` e pegando o mais recente por `criadoEm`.

**Armadilha da renovação:** `aplicarRenovacao` gravava `valorEmprestado: novoSaldo` (= parcela×parcelas = TOTAL). Corrigido para `valorEmprestado: emp.valorEmprestado` (principal digitado em CadastroCliente). O `saldo` do cliente continua sendo o total (dívida). Registros de renovação legados ainda podem ter valorEmprestado=total.

Helper central: `principalDoClienteSnap(cid, parcela, cuotas, pct)` em ListaClientes.tsx, usado em `pagamentosClientesSnap.valorProd` e `clientesListaSnap.valorVenda`.
