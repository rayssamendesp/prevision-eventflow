# Prevision EventFlow

Crie uma aplicação web interna chamada “Gestão de Eventos Externos | Prevision” para organizar e acompanhar os eventos externos patrocinados pela Prevision.
O sistema deve ser simples, visual, rápido de usar e pensado principalmente para desktop, mas também responsivo.
A prioridade é facilitar a visualização dos eventos ao longo do ano e o acompanhamento das tarefas necessárias para cada evento.
Não quero transformar essa aplicação em um sistema complexo de gestão de projetos. A ideia é que a equipe consiga cadastrar um evento rapidamente, visualizar seu status e acompanhar o checklist sem precisar preencher muitas informações.
OBJETIVO DO SISTEMA
A aplicação será usada pela equipe de eventos da Prevision para acompanhar eventos externos patrocinados ou avaliados para patrocínio.
Existem eventos que exigem muitas atividades internas, como:
contrato;
criação de arte;
envio de materiais;
definição de representante da Prevision;
apresentação;
envio para gráfica;
alinhamentos com parceiros;
Mas também existem eventos que praticamente não exigem nenhuma atividade além do patrocínio.
Por isso, o checklist precisa ser totalmente flexível.
Cada evento poderá ter nenhuma tarefa, uma tarefa ou várias tarefas e subtarefas.
ESTRUTURA PRINCIPAL
Criar um menu lateral simples contendo:
Eventos
Descartados
No topo do menu ou da aplicação, mostrar o nome:
Gestão de Eventos Externos
e uma identificação discreta da Prevision.
O visual deve ser moderno, profissional, leve e minimalista.
Evitar excesso de cores, elementos muito grandes, gradientes exagerados ou aparência infantil.
Priorizar:
bastante espaço em branco;
boa hierarquia visual;
cards elegantes;
tipografia moderna;
ícones simples;
navegação intuitiva.
LOGIN E ACESSO
Criar uma tela de login.
O sistema será utilizado por poucos membros da equipe interna da Prevision.
Utilizar autenticação com Supabase.
Cada pessoa deve possuir seu próprio usuário.
Usar login por:
e-mail;
senha.
Não permitir cadastro público de novos usuários pela tela de login.
Somente usuários previamente autorizados devem conseguir acessar a aplicação.
Depois do login, direcionar o usuário para a página Eventos.
BANCO DE DADOS
Usar Supabase como banco de dados da aplicação.
Todas as informações precisam ficar armazenadas no banco e disponíveis independentemente do computador ou navegador utilizado.
Não utilizar localStorage como fonte principal de armazenamento.
Estruturar o banco para permitir crescimento futuro, mas sem criar funcionalidades extras agora.
Cada evento deve possuir um identificador único para permitir futuras integrações com outra plataforma.
PÁGINA “EVENTOS”
Esta deve ser a principal tela da aplicação.
Criar uma visualização anual organizada por mês.
No topo, mostrar:
Eventos Externos
Ao lado, disponibilizar:
seletor do ano;
botão + Novo evento.
Abaixo, criar navegação pelos meses:
JAN | FEV | MAR | ABR | MAI | JUN | JUL | AGO | SET | OUT | NOV | DEZ
O usuário deve conseguir selecionar um mês.
Ao selecionar um mês, mostrar somente os eventos daquele período.
Exemplo:
Agosto 2026
[Evento 1] [Evento 2] [Evento 3]
Os eventos devem aparecer como cards.
CARD DO EVENTO
Cada card deve mostrar somente informações realmente importantes:
nome do evento;
data;
cidade/local;
status.
Não mostrar excesso de informações no card.
Criar diferenciação visual por status.
Os status principais serão:
Mapeado
Evento que sabemos que acontecerá, mas ainda estamos avaliando a participação.
Visual neutro, preferencialmente branco ou com borda discreta.
Em negociação
Evento cuja participação/patrocínio está sendo negociada.
Pode possuir um destaque visual leve.
Confirmado
Evento cuja participação da Prevision foi fechada.
Deve possuir maior destaque visual e uma cor mais evidente.
Realizado
Evento que já aconteceu.
Visual de concluído, sem chamar mais atenção do que eventos futuros.
Não utilizar a cor vermelha para eventos normais.
Cada card inteiro deve ser clicável.
Ao clicar, abrir a página individual do evento.
CADASTRO DE NOVO EVENTO
Ao clicar em + Novo evento, abrir um formulário simples.
Os campos serão:
Nome do evento
Obrigatório.
Data
Obrigatório.
Permitir apenas uma data inicialmente.
Cidade / Local
Campo de texto livre.
Exemplo:
São Paulo/SP
ou
Centro de Eventos — Florianópolis/SC
Status
Obrigatório.
Opções:
Mapeado
Em negociação
Confirmado
Realizado
Valor do patrocínio / investimento
Campo monetário em reais.
Exemplo:
R$ 15.000,00
Este campo não precisa ser obrigatório.
Não criar controle financeiro detalhado nesta versão.
Link importante
Campo opcional.
Pode ser usado para:
site do evento;
formulário;
página de inscrição;
pasta do Drive;
outro link importante.
Observações
Campo de texto livre e opcional.
Manter o formulário simples.
Não adicionar outros campos sem necessidade.
Após salvar, criar o evento no Supabase e mostrar imediatamente na lista do mês correspondente.
PÁGINA INDIVIDUAL DO EVENTO
Ao clicar em um card, abrir uma página própria para aquele evento.
No topo mostrar:
Nome do evento
Logo abaixo, mostrar o status em formato de badge.
Exibir de maneira organizada:
Data
Cidade/local
Valor
Link importante
Caso algum desses campos esteja vazio, não destacar espaço desnecessário.
Disponibilizar botão:
Editar evento
e um menu de opções com:
Descartar evento
A página deve ser limpa e focada principalmente no checklist.
CHECKLIST DO EVENTO
Criar uma seção:
Checklist
Abaixo:
+ Adicionar tarefa
Cada tarefa deve possuir apenas:
nome da tarefa;
responsável;
status concluída/não concluída.
Não exigir data, descrição, prioridade ou categoria.
O preenchimento precisa ser extremamente rápido.
Exemplo:
Fechamento do contrato — Ray
Definir representante Prevision — João
Criar apresentação — Maria
Materiais gráficos — Ray
Permitir marcar e desmarcar uma tarefa clicando no checkbox.
Quando uma tarefa for concluída, aplicar visual discreto de concluída.
Salvar imediatamente a alteração no Supabase.
RESPONSÁVEL PELA TAREFA
Cada tarefa poderá ter um responsável.
O responsável deve ser selecionado entre os usuários cadastrados na aplicação.
Mostrar o nome do responsável de forma discreta ao lado da tarefa.
Não criar fluxos complexos de atribuição.
SUBTAREFAS
Permitir criação de subtarefas.
Uma tarefa principal poderá possuir várias subtarefas.
Exemplo:
Materiais gráficos
Solicitar arte
Aprovar arte
Enviar para gráfica
Visualmente, as subtarefas devem aparecer recuadas abaixo da tarefa principal.
Ao criar uma tarefa, permitir opcionalmente selecionar:
Subtarefa de
e escolher uma tarefa principal existente daquele evento.
No banco de dados, utilizar uma estrutura em que uma tarefa possa possuir um parent_task_id.
Se parent_task_id estiver vazio, é uma tarefa principal.
Se estiver preenchido, é uma subtarefa.
Não criar uma tabela separada exclusivamente para subtarefas.
EDIÇÃO DE TAREFAS
Permitir:
editar nome da tarefa;
alterar responsável;
transformar tarefa em subtarefa quando aplicável;
marcar como concluída;
excluir tarefa.
Antes de excluir definitivamente uma tarefa, solicitar confirmação.
EVENTOS DESCARTADOS
Não excluir eventos definitivamente quando a equipe decidir não participar deles.
Criar uma funcionalidade de arquivamento.
Na página do evento disponibilizar:
Descartar evento
Ao clicar, pedir confirmação.
Depois disso:
retirar o evento da visualização principal;
manter todas as informações no banco;
manter tarefas e histórico relacionados;
exibir o evento na página Descartados.
Utilizar soft delete ou um campo de arquivamento.
Não apagar o registro do banco.
PÁGINA “DESCARTADOS”
Criar uma página chamada:
Eventos descartados
Mostrar os eventos que foram arquivados porque a Prevision decidiu não participar.
Cada card deve mostrar:
nome;
data;
cidade;
status anterior.
Disponibilizar ação:
Restaurar evento
Ao restaurar:
retirar dos descartados;
devolver para a visualização mensal;
preservar todas as informações existentes.
EDIÇÃO DO EVENTO
Permitir editar posteriormente:
nome;
data;
cidade/local;
status;
valor;
link;
observações.
Se a data for alterada para outro mês, mover automaticamente o card para o novo mês.
PESQUISA E FILTROS
Adicionar uma busca simples por nome do evento.
Permitir filtro por status:
Todos
Mapeado
Em negociação
Confirmado
Realizado
Não criar filtros complexos.
EXPERIÊNCIA DE USO
A aplicação será usada com frequência durante o trabalho.
Por isso:
reduzir ao máximo o número de cliques;
evitar formulários grandes;
permitir edição rápida;
usar feedback visual depois de salvar;
utilizar mensagens discretas de sucesso;
manter botões principais facilmente identificáveis;
evitar pop-ups desnecessários;
priorizar performance e simplicidade.
RESPONSIVIDADE
Priorizar experiência desktop.
Também permitir uso confortável em notebook e tablet.
No celular, adaptar:
menu;
cards;
formulário;
checklist.
Os cards podem ficar em uma única coluna em telas menores.
ESTRUTURA SUGERIDA DO BANCO
Criar estrutura equivalente a:
profiles
id
name
email
created_at
Relacionado aos usuários autenticados no Supabase.
events
id
name
event_date
location
status
investment_value
important_link
notes
archived
created_at
updated_at
id deve ser um identificador único.
archived deve controlar se o evento está na área de descartados.
tasks
id
event_id
title
responsible_user_id
completed
parent_task_id
created_at
updated_at
Relacionamentos:
events → tasks
profiles → tasks
tasks → subtasks utilizando parent_task_id.
Utilizar boas práticas de integridade referencial.
SEGURANÇA
Configurar Row Level Security no Supabase.
Somente usuários autenticados e autorizados devem acessar os dados da aplicação.
Não permitir acesso público às tabelas.
Neste primeiro momento, todos os usuários autorizados podem visualizar e editar todos os eventos.
Não criar níveis diferentes de permissão ainda.
NÃO DESENVOLVER NESTA VERSÃO
É muito importante NÃO adicionar funcionalidades fora do escopo.
Não implementar:
ROI;
cálculo de retorno sobre investimento;
leads;
oportunidades comerciais;
vendas;
receita atribuída;
dashboards financeiros;
gráficos financeiros;
relatórios;
exportação de relatórios;
CRM;
integração com CRM;
fornecedores;
controle de viagem;
hospedagem;
passagens;
controle detalhado de despesas;
orçamento;
aprovação financeira;
notificações;
automações;
envio de e-mail;
calendário Google;
comentários;
chat;
anexos complexos;
níveis diferentes de acesso;
gestão completa de projetos.
O campo Valor do patrocínio/investimento deve existir apenas como uma informação simples do evento.
Cada evento deve possuir um ID único no banco para possibilitar integração futura com uma plataforma separada de ROI.
Não construir essa integração agora.
RESULTADO ESPERADO
Quero uma aplicação interna simples e bonita em que eu consiga executar este fluxo:
Fazer login.
Abrir a página Eventos.
Escolher o mês.
Visualizar os eventos daquele mês.
Identificar rapidamente quais estão mapeados, em negociação, confirmados ou realizados.
Criar um novo evento rapidamente.
Abrir um evento.
Visualizar suas informações principais.
Criar tarefas e subtarefas.
Definir responsáveis.
Marcar tarefas como concluídas.
Editar informações quando necessário.
Descartar eventos sem apagá-los.
Restaurar eventos descartados.
Ter todos os dados permanentemente armazenados no Supabase.
Antes de adicionar qualquer funcionalidade além dessas, preserve a simplicidade do produto.
O sistema deve parecer uma ferramenta interna profissional da Prevision, e não um software genérico de gerenciamento de projetos.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/078a556b-d828-468b-ae0c-0b65e41c3ba8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
