# Banco de perguntas por fase em JSON

## Intenção

Permitir que um professor revise e edite as perguntas usadas no RocketBloom sem alterar a lógica do jogo. O conteúdo deve ser fixo e explícito por fase: enunciado, resposta correta e alternativas.

## Estado atual

O jogo gera perguntas em `src/game/systems/questions.js`, sorteando a operação e os operandos conforme a dificuldade e os limites definidos pela fase. `src/game/data/questions.js` contém pools pequenos de exemplos, mas não fornece o conteúdo exibido durante as partidas. `src/game/data/planets.js` define 20 fases (cinco por planeta), as categorias permitidas e limites progressivos.

## Abordagens consideradas

1. **Banco de questões completas no JSON (escolhida):** o professor edita cada pergunta e suas alternativas diretamente; o jogo escolhe perguntas desse banco.
2. **Configuração de geração no JSON:** o professor edita operações e limites, mas as questões continuam sendo criadas em tempo de jogo. Não dá controle sobre enunciados exatos.
3. **Manter o gerador e adicionar somente mais exemplos:** não atende ao objetivo de revisar e editar todas as perguntas que podem aparecer.

## Proposta

- Criar um JSON de conteúdo com entradas separadas por IDs das fases (`earth-1` até `neptune-5`).
- Incluir 10 perguntas completas em cada fase, total de 200 perguntas.
- Cada questão terá `id`, `prompt`, `correctAnswer` e `choices` com exatamente quatro valores distintos, incluindo uma única vez a resposta correta.
- As questões devem respeitar as operações e os limites pedagógicos atualmente definidos para cada fase em `planets.js`.
- Adaptar o carregamento da rodada para escolher questões do banco associado à fase, evitando repetir a pergunta imediatamente anterior quando houver outras disponíveis. A ordem das alternativas e das faixas continuará aleatória.
- Manter o conteúdo do JSON separado da lógica de jogo e validar os bancos na inicialização/testes de catálogo já existentes, com mensagens que identifiquem a fase e a questão inválidas.

## Fora de escopo

- Criar uma tela de edição para professores.
- Alterar a progressão, duração, recompensa ou regras de dificuldade das fases.
- Carregar bancos externos em tempo de execução.

## Critérios de aceitação

- Há conteúdo completo para cada uma das 20 fases.
- Cada fase tem 10 questões e cada questão tem quatro alternativas distintas, uma correta.
- O jogo apresenta perguntas desse banco em vez de gerar enunciados e respostas a partir de números aleatórios.
- Um professor consegue editar um enunciado, a resposta e as alternativas editando o JSON.
- A seleção de pergunta e a posição das alternativas permanecem aleatórias.

## Decisões em aberto

- Decisão do usuário: 10 perguntas por fase, 200 no total.
- O formato será JSON puro, sem comentários, com nomes de campos em inglês alinhados às estruturas atuais do código.
