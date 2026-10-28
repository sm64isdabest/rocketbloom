# Visualização das áreas de colisão — Plano de implementação

> **Para agentes de execução:** aplicar as tarefas na ordem, respeitando TDD e os passos de verificação.

**Objetivo:** adicionar às Configurações uma opção persistente para desenhar as áreas de colisão do foguete, moedas, gemas e obstáculos durante qualquer fase.

**Arquitetura:** salvar `settings.showHitboxes` como preferência booleana, disponibilizar o interruptor no menu e propagar a preferência até `GameEngine`. O motor desenha contornos coloridos depois dos sprites, usando o retângulo real do foguete/itens e `Obstacle.collisionBox`.

**Tecnologias:** React 19, canvas 2D, Node.js `node:test`.

**Especificação:** `docs/superpowers/specs/2026-10-28-visualizacao-colisoes-design.md`.

## Restrições globais

- Preferência padrão `false`; dados existentes sem essa chave continuam válidos.
- Não alterar as regras de colisão nem as dimensões dos objetos.
- Contornos apenas visuais, com largura de linha 2 e cores distintas para foguete, obstáculo, moeda e gema.
- Não adicionar dependências.

## Foco da revisão

- Perfil salvo antigo sem `showHitboxes` deve carregar com opção desligada.
- Um objeto coletável morto ou um obstáculo inativo não deve continuar exibindo caixa.
- A caixa do obstáculo deve refletir margens de `hitbox`, não os limites do sprite.
- A preferência precisa chegar à sessão e atualizar o motor sem reiniciar uma fase ativa.
- Com a opção desligada, não deve haver contornos de colisão.

## Tarefa 1: preferência persistente e menu

**Arquivos:** `src/utils/storage.js`, `src/utils/storage.test.js`, `src/screens/SettingsScreen.jsx`, `src/App.jsx`, `src/screens/PlayScreen.jsx`, `src/components/GameCanvas.jsx`.

**Interface:** `progress.settings.showHitboxes: boolean`; propriedades `showHitboxes` atravessam App → PlayScreen → GameCanvas → GameEngine.

- [x] Adicionar teste que confirma `showHitboxes` desligado por padrão e ao carregar um perfil antigo.
- [x] Rodar `node --test src/utils/storage.test.js`; confirmar falha por ausência da preferência.
- [x] Implementar o valor padrão e sanitização booleana em `loadProgress`.
- [x] Rodar `node --test src/utils/storage.test.js`; confirmar aprovação.
- [x] Adicionar ao `SettingsScreen` um interruptor acessível, rotulado “Áreas de colisão”, dentro da seção de visualização, com texto explicativo curto. O interruptor e o cartão reutilizam os estilos existentes.
- [x] Passar a preferência pelo caminho App → PlayScreen → GameCanvas e atualizá-la no motor existente via efeito, sem recriar a sessão.
- [x] Rodar `npm test`; confirmar aprovação da suíte (67 testes).

## Tarefa 2: sobreposição no canvas

**Arquivos:** `src/game/engine/GameEngine.js`, `src/game/engine/GameEngine.test.js`.

**Interface:** `GameEngine` aceita `showHitboxes = false`; seu valor pode ser atualizado durante a partida.

- [x] Adicionar testes que registram `strokeRect` e confirmam que o modo ligado desenha as caixas do foguete, coletáveis vivos e obstáculos vivos, incluindo `Obstacle.collisionBox`; modo desligado não desenha nenhuma caixa.
- [x] Rodar `node --test src/game/engine/GameEngine.test.js`; confirmar falha por ausência da sobreposição.
- [x] Desenhar retângulos sem preenchimento após os sprites; usar cores diferentes para foguete, obstáculos, moedas e gemas; filtrar entidades mortas.
- [x] Rodar `node --test src/game/engine/GameEngine.test.js`; confirmar aprovação.
- [x] Rodar `npm test` (67 testes) e `npm run build`; confirmar aprovação.

## Integração

- [x] Revisar as alterações em busca de falhas funcionais e acessibilidade.
- [ ] Atualizar o registro da execução e preparar um único commit com os arquivos da especificação, plano, implementação e testes.
- [ ] Enviar o commit à `main` conforme solicitado pelo usuário.
