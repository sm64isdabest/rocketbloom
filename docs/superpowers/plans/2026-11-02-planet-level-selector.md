# Seletor de fases por planeta — Plano de implementação

> **Para agentes de implementação:** seguir o plano aprovado em `docs/superpowers/specs/2026-11-02-planet-level-selector.md`, usando TDD em cada mudança de comportamento.

**Objetivo:** Substituir o seletor de fases por um mapa responsivo que mostra cada planeta desbloqueado, com estados de fase legíveis e descoberta animada uma vez.

**Arquitetura:** Manter regras de estado em `planetSelectorModel.js` e progresso local em `storage.js`; renderizar o planeta selecionado em `PlanetsScreen.jsx`, com estilos e mídia estática em `public/assets/ui/`.

**Tecnologias:** React 19, Vite, CSS, Web Audio API existente e `node:test`.

**Especificação:** `docs/superpowers/specs/2026-11-02-planet-level-selector.md`.

## Restrições globais

- 4 planetas, 5 fases cada; só navegar adiante depois de concluir o planeta atual.
- Respeitar volume de efeitos sonoros e movimento reduzido já persistidos.
- Perfil legado precisa receber listas novas vazias sem perda de progresso.
- Usar `/assets/ui/...` respeitando `import.meta.env.BASE_URL`.

## Revisão de risco

- Perfil salvo sem `seenPlanetIds`: carregar como lista vazia; coberto por teste de migração.
- Planeta próximo listado como desbloqueado, mas predecessor incompleto: manter seta adiante indisponível; coberto por teste do modelo.
- Regressão de estilo em viewport estreita: verificar no build e revisar layout CSS responsivo.
- Movimento reduzido durante descoberta: remover animação sem perder o estado colorido; coberto na apresentação/CSS.
- Som desabilitado/volume zero: a fanfarra respeita configuração global já testada por teste de áudio.

## Tarefas

### 1. Modelar navegação e estado de descoberta

**Arquivos:** `src/screens/planetSelectorModel.js`, `src/screens/planetSelectorModel.test.js`, `src/utils/storage.js`, `src/utils/storage.test.js`.

- [ ] Adicionar testes para `canNavigateToPlanet` (destino adjacente e desbloqueado; avançar exige todas as fases concluídas) e para defaults/carregamento legado de `seenPlanetIds`.
- [ ] Rodar os testes focados e confirmar falha.
- [ ] Implementar a função de navegação e persistir `seenPlanetIds`, filtrado para IDs planetários conhecidos.
- [ ] Rodar os testes focados e confirmar sucesso.

### 2. Fornecer artes e som de descoberta

**Arquivos:** `src/game/audio/audioManager.js`, `src/game/audio/audioManager.test.js`, novos PNGs em `public/assets/ui/planets/` e `public/assets/ui/level-frames/`.

- [ ] Testar/estender os tons da fanfarra de descoberta pelo mesmo caminho de áudio e configuração já existente.
- [ ] Adicionar nome de som `discovery` em `SOUND_NOTES` e assets: quatro fundos e ícones anexados, molduras azul/laranja/dourada e setas.
- [ ] Confirmar build encontra os assets com os nomes de arquivo estáveis.

### 3. Implementar o mapa de um planeta por vez

**Arquivos:** `src/screens/PlanetsScreen.jsx`, `src/styles/index.css`.

- [ ] Renderizar planeta inicial a partir do modelo, navegação lateral bloqueada corretamente, saldo/ícone no cabeçalho e botão de retorno.
- [ ] Renderizar cinco botões com moldura por planeta; número, concluída, fase atual/em andamento, parcial e bloqueada com estado aria-label explícito.
- [ ] Registrar primeira visita persistidamente, tocar som de descoberta uma vez e remover a filtragem em escala de cinza por animação; reduzir movimento conforme preferência.
- [ ] Ajustar layout para celular/tablet e aplicar testes focados mais build de produção.

### 4. Verificar, versionar e publicar

- [ ] Rodar `npm test` e `npm run build`; revisar `git diff --check` e status.
- [ ] `git add` e criar commit descrevendo o seletor de fases.
- [ ] Fazer `git push origin main` e confirmar resultado.
