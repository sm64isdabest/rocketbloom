# Banco de perguntas por fase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a geração aritmética em tempo de jogo por 10 perguntas editáveis em JSON para cada uma das 20 fases.

**Architecture:** Um arquivo JSON guarda as perguntas completas organizadas pelo ID da fase. Um módulo de dados fornece a lista e escolhe a próxima questão sem repetição imediata; `GameEngine` usa essa questão e continua embaralhando as alternativas/faixas como hoje.

**Tech Stack:** JavaScript ES modules, JSON, React/Vite existente, Node.js.

**Spec:** `docs/superpowers/specs/2026-11-09-banco-perguntas-json-design.md`

## Global Constraints

- O banco contém exatamente 10 perguntas por fase e 200 no total.
- Cada pergunta tem `id`, `prompt`, `correctAnswer` e quatro valores distintos em `choices`, com a resposta correta uma vez.
- IDs de fase existentes: `earth-1` a `earth-5`, `mars-1` a `mars-5`, `saturn-1` a `saturn-5`, `neptune-1` a `neptune-5`.
- Os itens respeitam operações e limites matemáticos configurados para cada fase.
- Seleção de perguntas e disposição das alternativas seguem aleatórias; não se repete a pergunta imediatamente anterior quando existirem outras.
- Não adicionar nem executar testes nesta tarefa.

## Review Focus

- Banco ausente/incompleto para uma fase: validação deve apontar o ID da fase.
- Questão com número errado de alternativas ou duplicatas: validação identifica a fase e questão.
- Resposta correta ausente ou repetida nas alternativas: validação identifica a questão.
- Seleção atinge o fim da lista: deve continuar escolhendo perguntas e não repetir imediatamente a anterior.
- Alteração de conteúdo pelo professor: os campos do JSON devem ser os apresentados no jogo sem exigir mudança na lógica.

## File Map

- Create `src/game/data/questions.json`: fonte editável das 200 perguntas.
- Replace `src/game/data/questions.js`: loader, acesso por ID da fase, seleção aleatória sem repetição imediata e validação estrutural do banco.
- Modify `src/game/data/catalog.js`: validar cada banco de fase e seus itens.
- Modify `src/hooks/useGameSession.js`: fornecer o pool referente à fase atual.
- Modify `src/game/engine/GameEngine.js`: selecionar do pool da sessão no início de cada rodada.
- Keep `src/game/systems/questions.js` as a legacy utility because existing test files still import it; production gameplay no longer uses it.

## Tasks

### Task 1: Criar o banco de questões completas

**Files:**
- Create: `src/game/data/questions.json`

**Interfaces:**
- Consumes: IDs, operações e limites de fase em `src/game/data/planets.js`.
- Produces: objeto JSON indexado por ID de fase, cada valor uma lista de 10 questões.

- [ ] Escrever 10 itens por fase (200 total), com IDs únicos, enunciado em português, resposta numérica e quatro alternativas numéricas distintas incluindo uma resposta correta.
- [ ] Conferir as contas e a operação de cada item contra as regras da respectiva fase.

### Task 2: Adicionar acesso e validação ao conteúdo JSON

**Files:**
- Modify: `src/game/data/questions.js`
- Modify: `src/game/data/catalog.js`

**Interfaces:**
- Produces: `getQuestionsForStage(stageId) -> Question[]` e `pickQuestion(questions, { rng, previousId }) -> Question`.
- `pickQuestion` escolhe aleatoriamente, evitando `previousId` se houver alternativa.
- A questão retornada mantém os campos esperados por `createAnswerRound`: `id`, `prompt`, `choices`, `correctAnswer`.

- [ ] Importar o JSON e implementar acesso ao banco por ID da fase.
- [ ] Implementar seleção aleatória com proteção para pools unitários e prevenção de repetição consecutiva.
- [ ] Integrar à validação de catálogo: exigir as 20 chaves de fase, 10 itens por fase, IDs únicos, enunciados não vazios, quatro alternativas distintas e a resposta correta presente exatamente uma vez.
- [ ] Remover `getQuestionPool` e o conteúdo de exemplos antigo, atualizando imports restantes.

### Task 3: Integrar seleção do banco à partida

**Files:**
- Modify: `src/hooks/useGameSession.js`
- Modify: `src/game/engine/GameEngine.js`

**Interfaces:**
- Consumes: `session.questions` do estágio atual e `pickQuestion`.
- Produces: cada nova rodada usa um item completo do pool da fase; a camada existente continua embaralhando escolhas/faixas.

- [ ] Carregar as questões pelo `stage.id` no hook de sessão.
- [ ] Trocar `generateQuestion` por `pickQuestion`, guardar o ID usado e passar o item escolhido a `createAnswerRound`.
- [ ] Confirmar por busca no código que `GameEngine` já não importa nem chama o gerador; manter o utilitário legado porque os testes existentes ainda o importam.

### Task 4: Revisão do resultado

**Files:**
- Revisar todos os arquivos acima.

- [ ] Confirmar manualmente 20 fases, 10 itens em cada, 200 questões total e consistência aritmética de todos os itens.
- [ ] Revisar o diff e verificar imports/caminhos JSON com a ferramenta disponível, sem adicionar ou executar testes automatizados.
