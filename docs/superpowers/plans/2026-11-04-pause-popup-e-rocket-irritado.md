# Popup de pausa e foguete irritado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a pausa das fases por um popup central com as imagens fornecidas e fazer o foguete com jornal reagir a toques com som e animação.

**Architecture:** `PauseOverlay` será a camada de pausa sobre o jogo congelado. `App` controla a abertura de `SettingsScreen` por cima desse estado de pausa, sem mudar a tela de jogo. Um novo helper resolve os assets locais do popup, e o `audioManager` fornece o novo efeito, sujeito às preferências de efeitos sonoros.

**Tech Stack:** React 19, CSS, JavaScript ES modules, Vite, Node.js test runner.

**Spec:** `docs/superpowers/specs/2026-11-04-pause-popup-e-rocket-irritado-design.md`.

## Global Constraints

- Exibir no centro da tela um popup sobre a fase congelada, com título, ilustração e os três botões fornecidos: sair da fase, continuar e configurações.
- Sair retorna ao menu principal; continuar retoma a fase; configurações abre a tela de configurações sobre a fase pausada, e fechar retorna ao popup.
- Tornar o foguete ilustrado interativo: ao toque, tocar um efeito sonoro e executar uma animação breve de irritação. Respeitar som desligado/volume de efeitos e movimento reduzido.
- Manter os atalhos e o comportamento atual de pausar e retomar.
- Usar as imagens fornecidas para porta, seta verde, engrenagem e foguete com jornal.
- Gerar o efeito sonoro com o sistema de áudio existente.

## Review Focus

- Usuário fecha as configurações por Escape: deve voltar ao popup e continuar pausado; teste no ciclo de UI/inspeção manual.
- Usuário reduz o movimento: animação irritada não deve rodar; teste de build e inspeção manual da classe/estilo.
- Usuário troca o modo de controle nas configurações durante a pausa: rodada e progresso devem permanecer; teste de integração do motor.
- Usuário navega configurações com setas ou Espaço: o input pausado do jogo não deve interceptar essas teclas; teste do controlador.
- Usuário desliga efeitos ou volume: o novo som não deve tocar; teste unitário do `audioManager`.
- Asset base usa caminho com ou sem barra final: URL deve manter um único separador; teste unitário do helper de pausa.
- Clique repetido no foguete durante a animação: cada toque deve reiniciar a reação; inspeção manual e verificação do contador/key no componente.

---

### Task 1: Adicionar assets, popup e acesso às configurações

**Files:**
- Create: `public/assets/ui/pause/leave.png` (imagem anexada `leave 1.png`)
- Create: `public/assets/ui/pause/continue.png` (imagem anexada `playbutton 1.png`)
- Create: `public/assets/ui/pause/settings.png` (imagem anexada `image 2.png`)
- Create: `public/assets/ui/pause/rocket-newspaper.png` (imagem anexada `ChatGPT Image 15 de set. de 2026, 21_18_02 1.png`)
- Create: `src/screens/pauseModel.js`
- Create: `src/screens/pauseModel.test.js`
- Modify: `src/screens/PauseOverlay.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/GameCanvas.jsx`
- Modify: `src/game/engine/GameEngine.js`
- Modify: `src/game/engine/input.js`
- Test: `src/game/engine/GameEngine.test.js`
- Test: `src/game/engine/input.test.js`
- Modify: `src/styles/index.css`

**Interfaces:**
- Produces: `getPauseAssetUrl(filename, basePath = import.meta.env?.BASE_URL ?? "/")` em `pauseModel.js`, retornando `${basePath normalizado}assets/ui/pause/${filename}`.
- `PauseOverlay` recebe `onResume`, `onQuit`, `onSettings`, `onTapRocket` e `reducedMotion`.
- `App` mantém `screen === SCREEN.PAUSED` enquanto `pauseSettingsOpen` controla a camada de configurações; fechar configurações apenas define esse estado como falso.

- [x] **Step 1: Escrever testes falhos para URL dos assets do popup**

Criar testes em `pauseModel.test.js` cobrindo base `/rocketbloom/` e base `/rocketbloom`, esperando `/rocketbloom/assets/ui/pause/leave.png` em ambos.

- [x] **Step 2: Rodar os testes direcionados e confirmar falha**

Run: `node --test src/screens/pauseModel.test.js`
Expected: FAIL porque `pauseModel.js` ainda não existe.

- [x] **Step 3: Implementar o helper e o popup visual**

Criar `getPauseAssetUrl` e trocar os botões textuais por botões acessíveis com as imagens fornecidas. O popup deve ter título “Jogo pausado”, ilustração central do foguete com jornal e ações alinhadas horizontalmente: porta (sair), seta verde (continuar) e engrenagem (configurações). O botão de foguete deve usar um contador como `key` para reiniciar a animação em toques repetidos. O estilo deve centralizar o popup sobre o jogo, adaptar largura/altura a telas pequenas e desabilitar a animação quando `reducedMotion` for verdadeiro.

Em `App.jsx`, manter a tela pausada enquanto `SettingsScreen` aparece como camada superior. A engrenagem abre essa camada e o fechar/Escape volta ao popup. A porta usa `goMenu`; a seta chama o resume existente. Remover `onRestart`, pois a referência não inclui essa ação.

Atualizar o `controlMode` no controlador de input existente para evitar recriar o motor e perder o estado da rodada. Suspender a captura de teclado do jogo enquanto pausado, liberando setas e Espaço para os controles da interface.

- [x] **Step 4: Rodar os testes do helper e buildar**

Run: `node --test src/screens/pauseModel.test.js`
Expected: PASS em ambos os caminhos-base.

Run: `npm run build`
Expected: build Vite concluído sem erros.

### Task 2: Efeito sonoro e verificação integrada

**Files:**
- Modify: `src/game/audio/audioManager.js`
- Modify: `src/game/audio/audioManager.test.js`
- Modify: `src/screens/PauseOverlay.jsx`
- Modify: `src/game/engine/input.js`
- Modify: `src/game/engine/GameEngine.js`
- Modify: `src/components/GameCanvas.jsx`
- Test: `src/game/engine/input.test.js`
- Test: `src/game/engine/GameEngine.test.js`
- Modify: `docs/superpowers/specs/2026-11-04-pause-popup-e-rocket-irritado-design.md`

**Interfaces:**
- Consumes: `playGameSound(name)` existente e `onTapRocket` de `App`.
- Produces: um som `angryTouch` no `SOUND_NOTES`, reproduzido ao toque no foguete e sujeito à configuração atual de efeitos.

- [x] **Step 1: Escrever teste falho para o novo som**

Estender o fake de `AudioContext` em `audioManager.test.js`: `playGameSound("angryTouch")` deve agendar pelo menos duas frequências com efeitos ativos; com `soundEffects: false` ou volume zero não deve criar osciladores.

- [x] **Step 2: Rodar teste direcionado e confirmar falha**

Run: `node --test src/game/audio/audioManager.test.js`
Expected: FAIL porque `angryTouch` não está configurado.

- [x] **Step 3: Implementar o som e ligar o toque do foguete**

Adicionar uma sequência curta e dissonante de tons graves em `SOUND_NOTES.angryTouch`; chamar `playGameSound("angryTouch")` pelo callback do foguete. Manter a reação visual breve e respeitar movimento reduzido.

Atualizar o controlador de entrada sem reconstruir o motor ao alterar o modo de controle e deixar de capturar teclas de interface durante a pausa.

- [x] **Step 4: Rodar suíte e build completos**

Run: `npm test`
Expected: todos os testes passam.

Run: `npm run build`
Expected: build Vite concluído sem erros.

- [x] **Step 5: Revisar diff e conferir os fluxos de pausa pelo código**

Conferir centralização/responsividade, ações dos três ícones, retorno do modal de configurações ao popup, reinício da animação em toque repetido e ausência da animação com movimento reduzido. A abertura no navegador foi tentada, mas a ferramenta de automação encerrou a sessão ao não conseguir determinar a URL da janela; o layout visual foi revisado pelo CSS e o build passou.

- [ ] **Step 6: Stage, commit e push**

```powershell
git add docs/superpowers/specs/2026-11-04-pause-popup-e-rocket-irritado-design.md docs/superpowers/plans/2026-11-04-pause-popup-e-rocket-irritado.md public/assets/ui/pause src/App.jsx src/screens/PauseOverlay.jsx src/screens/pauseModel.js src/screens/pauseModel.test.js src/styles/index.css src/game/audio/audioManager.js src/game/audio/audioManager.test.js
git add src/components/GameCanvas.jsx src/game/engine/GameEngine.js src/game/engine/GameEngine.test.js src/game/engine/input.js src/game/engine/input.test.js
git commit -m "fix: preserve paused run when changing controls"
git push -u origin codex/pause-popup-rocket-angry
```
