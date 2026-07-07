# System Pay — Relatório Completo de Funcionamento do Sistema

**Data:** 07 de julho de 2026

---

## 1. Visão Geral

O System Pay é uma plataforma completa de gestão de cobranças composta por **três partes que trabalham juntas**:

| Parte | Quem usa | Para quê |
|---|---|---|
| **Plataforma Web (Admin)** | O dono/administrador | Acompanhar todas as rotas, aprovar operações, gerenciar clientes e ver relatórios |
| **App do Cobrador** | O cobrador na rua | Cobrar clientes, registrar pagamentos, despesas, novos empréstimos e fechar o caixa do dia |
| **Servidor (API + banco de dados)** | Funciona sozinho | Guarda os dados e faz a ponte de comunicação entre a web e o app |

Cada cobrador tem um **código de acesso** único. Esse código funciona como a "chave da rota": tudo o que o cobrador faz fica vinculado a ele, e o administrador enxerga cada rota separadamente.

---

## 2. App do Cobrador — funcionamento detalhado

### 2.1 Entrada e segurança
- **Tela de PIN**: o cobrador entra com seu código de acesso.
- **Autorização de dispositivo**: quando o app é aberto num celular novo (primeiro acesso ou troca de aparelho), é gerada uma **solicitação** que o administrador precisa aprovar na web antes de o cobrador conseguir trabalhar.

### 2.2 Lista de Clientes (tela principal)
- Lista completa dos clientes da rota, com **busca** e **status visual por cor**: verde (em dia), laranja (atenção), vermelho (atrasado), branco (novo).
- **Modo VRF (verificação)**: fila de trabalho do dia — mostra os clientes já cobrados hoje, permitindo conferência e correção.
- A **ordem da lista** pode ser reorganizada na opção "Sincronizar Clientes" (a ordem é a rota de cobrança na rua).

### 2.3 Ficha do Cliente
- **Registrar pagamento**: Parcela, Abono ou "Sem pagamento" (visita sem receber).
- **Histórico do ciclo**: parcelas pagas, visitas e atrasadas (as visitas/atrasadas são calculadas a partir do histórico de pagamentos).
- **Fotos e documentos** do cliente.
- **Agendamento**: marcar retorno em outra data/hora.
- **Renovação**: quando o cliente quita, pode renovar o crédito — gera novo empréstimo e novo ciclo.

### 2.4 Novos Empréstimos
- **Cadastro de cliente**: dados pessoais, endereço, telefone e as condições do empréstimo (valor, juros, parcelas, frequência diária/semanal/mensal).
- Cada empréstimo recebe um **consecutivo** (número único de 10 dígitos) que o acompanha em cadastro, renovação e fechamento.
- **Limite de venda**: se o valor do empréstimo passar do limite configurado pelo administrador, ele **não sai na hora** — vira uma **solicitação pendente** que o admin aprova ou recusa na web.
- **Tela "Novos Empréstimos"**: resumo dos créditos liberados no dia, com totais e botão Excluir (**com confirmação** — janela mostrando cliente, número e valor antes de apagar).

### 2.5 Despesas e Rendimentos
- O cobrador lança **despesas** (combustível, alimentação etc.) e **rendimentos** (aportes/entradas).
- Valores acima do limite configurado também viram **solicitação pendente** para aprovação do admin.
- Exclusão sempre passa por **janela de confirmação** (mostra categoria, data e valor).
- A categoria "**Retirada de Caixa**" é uma despesa especial: representa dinheiro retirado do caixa e aparece separada nos relatórios.

### 2.6 Relatório Financeiro e Fechamento de Caixa
- Mostra o balanço do dia: Caixa Inicial, Cobrança Esperada vs. Realizada, Cobranças Feitas (ex.: 4/4), clientes novos, ausentes, renovações, despesas, rendimentos, retirada e **Saldo Final**.
- **Fechar Caixa**: encerra o dia. O saldo final vira o **caixa inicial do dia seguinte**, e um instantâneo completo do dia é enviado ao servidor.
- O relatório pode ser **compartilhado como imagem** (ex.: WhatsApp).
- **Fechamento retroativo**: se o cobrador esqueceu de fechar o caixa de um dia anterior, o app detecta e apresenta uma tela que obriga a fechar o dia pendente antes de abrir o dia atual.

### 2.7 Funcionamento offline
- O app guarda tudo no **armazenamento local do celular** — funciona mesmo sem internet.
- Quando há conexão, ele sincroniza automaticamente com o servidor (envia o estado atual e busca comandos do administrador).

---

## 3. Plataforma Web (Admin) — funcionamento detalhado

### 3.1 Desempenho
- Gráficos da evolução do negócio: novos clientes por mês, volume emprestado, rendimentos vs. despesas e distribuição de gastos por categoria.
- Os dados vêm dos fechamentos de caixa das rotas.

### 3.2 Liq. Diária (Liquidação Diária)
Visão do dia de uma rota, **ao vivo** (enquanto o cobrador trabalha) ou do último fechamento:
- **Relatório Diário**: resumo financeiro completo do dia.
- **Pagamentos**: cada cobrança registrada (cliente, valor, forma).
- **Novos Empréstimos**: créditos liberados no dia.
- **Despesas / Rendimentos**: lançamentos do dia — o admin também pode **criar** lançamentos aqui, que chegam automaticamente ao app do cobrador.
- **Clientes**: a carteira da rota (ficha com histórico, incluindo o empréstimo ativo).
- **Agendados**: compromissos marcados pelo cobrador.

### 3.3 Liq. Períodos
- Consolida uma rota num intervalo de datas: soma os fechamentos do período (cobranças, empréstimos, despesas etc.).

### 3.4 Consolidados
- Visão geral de **todas as rotas juntas**, incluindo o **Caixa Geral** (saldo consolidado) e a possibilidade de fazer **retirada de caixa pela web** (vira uma despesa "Retirada de Caixa" no app).

### 3.5 Gerenciar Aplicativos
- Cadastro dos aplicativos/cobradores (código de acesso de cada rota).
- **Aprovações**: solicitações de dispositivo novo, empréstimos acima do limite e despesas/rendimentos acima do limite — o admin **aceita ou recusa** cada uma.
- **Configurações de parcelas**: número de parcelas ao criar empréstimo, por pagamento e para quitação.
- **Limites**: valor máximo de venda e de despesa sem aprovação.

### 3.6 Gerenciar Clientes
- Lista mestre de clientes de todas as rotas.
- Permite **editar, excluir, inativar e reativar** clientes — as alterações são enviadas como comandos e aplicadas no app do cobrador automaticamente.

### 3.7 Importar Rotas
Ferramenta para migrar uma rota que existia em outro sistema, usando planilhas Excel:
- **Planilha de clientes (lista)**: importa todos os clientes com saldo, parcelas pagas (inclusive frações, ex.: 12,5 restantes), visitas e atrasadas. Os clientes chegam ao app já marcados como cobrados no dia, reproduzindo o estado real da rota.
- **Planilha Resumen (caixa)**: importa o caixa do dia — caixa inicial e final, e as abas **Gastos** e **Ingresos** com as despesas e rendimentos reais (a "Retirada de caixa" entra na categoria certa; os demais lançamentos entram como categoria "Outros", com a descrição original na observação).
- Reimportar a mesma planilha **não duplica nada** (clientes, cobranças e lançamentos são reconhecidos e ignorados).

---

## 4. Como a Web e o App conversam entre si

A comunicação é feita pelo servidor, em ciclos automáticos (polling):

1. **App → Web (instantâneo/snapshot)**: a cada poucos segundos o app envia seu estado atual (clientes, cobranças, despesas, caixa). É isso que o admin vê "ao vivo" na Liq. Diária.
2. **Fechamento de caixa**: ao fechar o dia, o app envia o instantâneo final, que fica gravado permanentemente — é a base dos relatórios por período e do Desempenho.
3. **Web → App (comandos)**: quando o admin edita/exclui um cliente, cria uma despesa, importa uma rota etc., o servidor guarda um **comando** na fila. O app baixa o comando no próximo ciclo, aplica no seu banco local, salva e confirma o recebimento. Isso garante que nada se perde mesmo se o app fechar no meio.
4. **Isolamento por rota**: todo dado viaja carimbado com o **código de acesso** — cada rota só vê e recebe o que é dela.

---

## 5. Fluxos de aprovação (resumo)

| O que dispara | Onde aparece | O que acontece |
|---|---|---|
| Celular novo entra com o código | Web → Aprovações | Admin autoriza o dispositivo; só então o cobrador trabalha |
| Empréstimo acima do limite | Web → Aprovações | Se aprovado, o empréstimo se concretiza no app; se recusado, é descartado |
| Despesa/rendimento acima do limite | Web → Aprovações ("Desp e Rend") | Igual: só entra no caixa após aprovação |

---

## 6. Regras e proteções importantes

- **Confirmação antes de excluir**: despesas, rendimentos e empréstimos do dia só são apagados após confirmação em janela própria do app.
- **Sem duplicação**: reimportação de planilhas, reenvio de comandos e solicitações repetidas são reconhecidos e ignorados automaticamente.
- **Consecutivo único**: cada empréstimo tem um número exclusivo de 10 dígitos, usado para rastrear o crédito em todo o ciclo.
- **Continuidade do caixa**: o saldo final de um dia é sempre o caixa inicial do seguinte; dias esquecidos são fechados retroativamente antes de abrir o dia novo.
- **Trabalho offline**: o cobrador nunca fica parado por falta de internet; a sincronização acontece quando a conexão volta.

---

*Relatório gerado a partir da análise completa do sistema em 07/07/2026.*
