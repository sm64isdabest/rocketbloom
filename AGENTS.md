# Guia para agentes no RocketBloom

## 1. Visão geral do jogo

RocketBloom é um jogo educacional de ação e matemática para uma pessoa. Um astronauta cientista pilota um foguete para resgatar uma espécie vegetal em cada planeta da campanha. A viagem passa pela Amazônia terrestre, pelos desertos de Marte, pelos anéis de Saturno e pelo cenário azul de Netuno. O GDD descreve desafio, concentração, descoberta e conquista como objetivos da experiência. A faixa etária e a série escolar estão **a confirmar**.

- **Durante o voo**, mova o foguete no eixo horizontal, desvie de obstáculos, colete moedas e escolha a resposta correta à questão entre quatro faixas. Acertos dão velocidade e erros penalizam a nave. A velocidade influencia o avanço até a meta da fase.
- **Entre voos**, conclua as fases em sequência, desbloqueie planetas e o voo infinito de cada um, volte ao laboratório para cultivar as plantas resgatadas e visite o Cofre para acompanhar as metas de ouro.

## 2. Stack técnica

| Camada | Tecnologia e versões |
| --- | --- |
| Aplicação | RocketBloom `0.1.0`, JavaScript moderno com módulos ES, JSX, HTML e CSS. |
| Interface | React e React DOM `^19.1.1` no manifesto, ambos `19.3.1` no lockfile. |
| Motor de voo | Motor próprio em Canvas 2D, com `requestAnimationFrame` e APIs do navegador. Three.js `0.187.0` renderiza a órbita decorativa no seletor de fases. |
| Ferramentas | Vite `^7.1.7` e `@vitejs/plugin-react` `^5.0.2`. O lockfile fixa `7.3.7` e `5.2.0`, respectivamente. |
| Ambiente | npm com `package-lock.json` v3. A CI usa Node.js 22. Para seguir a CI, use Node 22.12 ou superior dentro da série 22, conforme o requisito do Vite e do plugin. |
| Áudio e dados | Web Audio e faixas WAV locais. Catálogo em JS e JSON, progresso no `localStorage` e publicação estática no GitHub Pages. |

## 3. Estrutura do projeto

```text
.
├── .github/
│   └── workflows/                 # Build e publicação no GitHub Pages
├── artwork/
│   └── continuity/                # Estudos de continuidade do cenário de Marte
├── docs/
│   ├── demos/                     # Capturas das configurações de áudio
│   └── superpowers/
│       ├── plans/                  # Planos de implementação datados
│       └── specs/                  # Especificações por funcionalidade
├── public/
│   └── assets/                    # Artes servidas diretamente pelo Vite
│       ├── backgrounds/           # Fundos planetários e variantes contínuas
│       ├── collectibles/          # Moeda usada no voo
│       ├── flames/                # Quadros da chama do foguete
│       ├── laboratory/
│       │   └── care/              # Artes dos minijogos de cultivo
│       ├── lasers/
│       │   └── idle/              # Quadros das faixas de resposta
│       ├── levels/
│       │   ├── marte/
│       │   ├── netuno/
│       │   ├── saturno/
│       │   └── terra/
│       ├── menu/
│       ├── obstacles/
│       │   ├── earth/
│       │   └── space/
│       ├── powerups/
│       └── ui/
│           ├── controls/
│           ├── endless/
│           ├── level-frames/
│           ├── pause/
│           └── planets/
├── registro-software/            # Requerimento administrativo em DOCX
└── src/
    ├── assets/                    # Músicas, laterais do voo e arte empacotada
    │   ├── gold-floor/            # Faixas de ouro das telas de navegação
    │   └── storage/               # Ícones e níveis visuais do Cofre
    ├── components/                # Canvas, HUD e controles compartilhados
    ├── game/
    │   ├── audio/                 # Música e efeitos
    │   ├── config/                # Balanceamento e metas de ouro
    │   ├── data/                  # Catálogos, banco de questões e manifesto de imagens
    │   ├── engine/                # Motor, loop, entrada, escala e colisões
    │   ├── entities/              # Foguete, alternativas, lasers, obstáculos e itens
    │   └── systems/               # Rodadas, poderes, impacto, cenário e metas
    ├── hooks/                     # Sessão de voo e progresso persistente
    ├── screens/                   # Telas, sobreposições e modelos de interface
    ├── styles/                    # CSS global, do Cofre e do cultivo
    └── utils/                     # Persistência, navegação e regras pós-voo
```

Na raiz, `README.md` contém o GDD, `index.html` carrega a aplicação, `package.json` e `package-lock.json` descrevem as dependências e `vite.config.js` define a base de publicação.

## 4. Arquitetura e sistemas principais

| Sistema | Fluxo e arquivos-chave |
| --- | --- |
| Inicialização e navegação | `index.html` → `src/main.jsx` → `src/App.jsx`. O App carrega o progresso, pré-carrega `src/game/data/projectImages.js` via `src/utils/preloadImages.js` e valida o catálogo antes de abrir o menu. `src/utils/screenStates.js` define estados. `navigationContext.js` preserva a seleção no retorno da pausa, do laboratório e do Cofre. |
| Campanha e seleção | `src/game/data/planets.js` define quatro planetas, três fases por planeta e a progressão de dificuldade. `src/screens/PlanetsScreen.jsx` e `planetSelectorModel.js` controlam seleção, desbloqueios e acesso ao infinito após concluir o planeta. `OrbitalRocket.jsx`, `rocketOrbit.js` e `rocketModel.js` implementam a decoração em 3D. |
| Sessão e voo | `src/screens/PlayScreen.jsx` usa `src/hooks/useGameSession.js` para montar a sessão e `src/components/GameCanvas.jsx` para iniciar, pausar e descartar `src/game/engine/GameEngine.js`. O motor atualiza entidades, desenha o voo e envia snapshots para o `Hud.jsx` e o App. `loop.js`, `resize.js`, `input.js` e `collision.js`, na pasta do motor, cuidam do tempo, da escala, dos controles e das colisões AABB. Renderização, ponteiro e colisões compartilham coordenadas lógicas com referência de 390 × 844. |
| Questões e balanceamento | `src/game/data/questions.json` contém 10 questões por fase de campanha e 20 por entrada do infinito. O infinito também usa as questões das três fases do planeta atual. `data/questions.js` sorteia sem repetição imediata e `data/catalog.js` valida contagens, categorias, IDs e quatro alternativas numéricas distintas com uma correta. `systems/answerRound.js`, `lanes.js` e `questionTiming.js` estruturam rodadas e intervalos. A alternativa é escolhida por colisão com um feixe, clique/toque ou pela faixa ocupada ao fim do tempo. |
| Obstáculos, poderes e cenário | `src/game/config/gameConfig.js` concentra velocidade, penalidades, tempos e poderes. `src/game/data/obstacles.js` define sprites e hitboxes. `src/game/systems/collisionImpact.js` reduz a velocidade efetiva por dois segundos e a recupera gradualmente. A caixa misteriosa aciona uma roleta com Turbo, Bolha, Ímã, Moedas ×2 ou Congelamento em `systems/powerUps.js` e `systems/powerUpPresentation.js`. Os fundos são selecionados em `systems/scenery.js`. |
| Resultados e persistência | `src/App.jsx` envia os resultados a `src/utils/runProgress.js`. Esse módulo registra avanço, resgates, desbloqueios, recordes e ouro, e usa `runId` para evitar crédito duplicado. `src/hooks/usePersistentProgress.js` usa `src/utils/storage.js` para validar, migrar e gravar `rocketbloom.progress.v1`. O reinício do progresso preserva as preferências e usa `resetId` para detectar gravações de outra aba com perfil anterior. |
| Laboratório | `src/screens/CommandRoomScreen.jsx` mostra uma planta por planeta. A primeira fase concluída libera o resgate e a primeira imagem. Fases seguintes liberam uma atividade de rega, polinização ou limpeza para cada novo estágio de crescimento. `PlantCareGame.jsx` exibe os minijogos e `src/utils/laboratoryProgress.js` valida o avanço e mantém a atividade sorteada no perfil. As espécies e artes estão em `src/game/data/plants.js`. |
| Cofre de Moedas | `src/utils/runProgress.js` credita 1 ouro por moeda registrada no voo, inclusive em derrota, saída pela pausa e infinito. `src/utils/goldStorage.js` guarda saldo e metas vistas. `src/game/config/goldConfig.js` define os marcos de 100, 300, 600, 1.000 e 2.000. `src/screens/StorageScreen.jsx`, `storageAnimation.js` e `Decorations.jsx` cuidam do depósito animado e das artes. |
| Configurações e debug | `src/screens/SettingsScreen.jsx` gerencia preferências de áudio, controles e movimento reduzido. `src/game/audio/audioManager.js` coordena música, efeitos e sons da interface. `src/screens/DebugMenu.jsx` abre com **Q + P**, usa os métodos do motor e permite simular progresso. Créditos de teste podem ser gravados no perfil local. |

## 5. Como rodar, buildar e testar

Na raiz do projeto, com Node.js e npm:

```bash
npm ci
npm run dev
npm test
npm run build
npm run preview
```

- `npm ci` instala as versões do lockfile. O README também indica `npm install`. Abra o endereço exibido pelo Vite, com o caminho `/rocketbloom/`. As portas padrão são 5173 no desenvolvimento e 4173 no preview. Execute o preview após o build, cuja saída fica em `dist/`.
- `npm test` executa `node --test`. Para rodar apenas os testes do motor, use `node --test src/game/engine/GameEngine.test.js`. Os testes `*.test.js` ficam junto aos módulos e cobrem também catálogo, progresso, navegação, markup, CSS e formatos de imagem.
- A verificação em uma cópia temporária confirmou instalação, build e respostas HTTP da página e do WebP de Marte em desenvolvimento e preview, com Node `24.20.0` e npm `11.19.0`. A suíte teve **245 de 246 testes aprovados** com Node `24.20.0` e `22.23.5`. A falha existente em `src/utils/preloadImages.test.js` ocorre porque `public/assets/backgrounds/marte-red-seamless.png` ainda está na pasta pública e saiu de `PROJECT_IMAGES` no commit `279b8de`. A verificação dos servidores foi por HTTP, sem uma partida no navegador.
- `.github/workflows/deploy.yml` faz checkout, instala com `npm ci`, gera `dist/` e publica no Pages em pushes para `main` ou acionamento manual. O workflow atual executa o build. Rode os testes separadamente.
- Para conferir mudanças de voo ou navegação, passe por **Jogar → selecionar fase → confirmar a fase**. Mouse/toque movem a nave no modo ponteiro. **←/→** e **A/D** também movem a nave, e **Esc** ou **P** pedem pausa durante o voo. Use um perfil de teste para conferir **Q + P**, créditos e reinício.

## 6. Convenções de código e de assets

- Acompanhe o estilo do arquivo editado. O padrão predominante usa dois espaços, aspas duplas, ponto e vírgula e extensão explícita nos imports locais. Componentes e classes usam `PascalCase`, funções e variáveis `camelCase`, constantes de catálogo e configuração `UPPER_SNAKE_CASE`.
- Use português do Brasil no texto exibido ao jogador. Preserve os IDs internos em inglês usados em JSON e saves, como `earth`, `earth-1` e `earth-endless`. As pastas de arte das fases usam nomes em português, como `public/assets/levels/terra/terra_1.webp`.
- Em CSS, reaproveite classes existentes e seus prefixos de tela, como `settings-popup__`. Mantenha estados de foco, rótulos acessíveis, layout em telas estreitas e preferências de movimento reduzido.
- Monte URLs de `public/assets/` com `import.meta.env.BASE_URL` ou com os helpers existentes para respeitar `/rocketbloom/`. Para arte e áudio de `src/assets/`, siga o padrão de importação ou `new URL(..., import.meta.url)` adotado no módulo.
- Preserve o formato e o canal alfa exigidos pelos testes de assets. WebP predomina. As plantas usam `plant-NN.png`, e os cinco ícones de poderes também são PNG com transparência. Ao mudar arquivos públicos, confira o manifesto e os testes de inventário.

## 7. Estado atual do desenvolvimento

- **Implementado.** Campanha de 12 fases com adição na Terra, subtração em Marte, multiplicação em Saturno e divisão em Netuno. Cada planeta tem um modo infinito desbloqueável e um recorde local. Também estão implementados a coleta de moedas, o Cofre, o laboratório com três estágios de crescimento por planta, a pausa, as configurações e o debug.
- **Divergências com o GDD.** O documento descreve que uma colisão pode levar ao fim do jogo. Hoje o impacto em obstáculos diminui temporariamente a velocidade efetiva, enquanto uma resposta errada pode reduzir a velocidade-base a zero e causar derrota. O GDD descreve escolher uma alternativa que cai pelo movimento da nave. O voo atual também aceita clique/toque e resolve a rodada pela faixa ocupada quando o tempo acaba.
- **Conteúdo além do GDD.** O voo infinito, a caixa misteriosa, os poderes e os três minijogos de cultivo já fazem parte do código. Especificações antigas em `docs/superpowers/specs/` citam cinco fases ou cinco imagens de crescimento, diamantes e poderes de estrela e encolhimento. Confira o catálogo e o motor antes de aplicar uma dessas descrições.
- **Parcial ou pendente.** O jogo registra dinheiro de conclusão e resgate e pontos de sustentabilidade no save. Há uma arte de loja em `public/assets/menu/shop.webp`, mas o menu atual oferece Jogar, áudio e configurações, e o uso futuro desses saldos está **a confirmar**. A inconsistência entre o PNG antigo de Marte e o manifesto de imagens segue aberta.

## 8. Regras para agentes

- Leia o GDD e confira o comportamento atual no código antes de mudar regras. Sinalize divergências em vez de escolher silenciosamente uma interpretação. Peça autorização para editar o GDD ou para mudanças amplas de balanceamento, arquitetura, progressão ou save.
- Mantenha as alterações no escopo pedido e siga o estilo existente. Reaproveite os modelos e utilitários já usados por produção e conserve a separação entre lógica do voo, interface, conteúdo e persistência.
- Preserve os IDs de planeta, fase e planta, e a compatibilidade com perfis antigos. Se uma mudança exigir alteração no perfil, revise a leitura e a migração em `src/utils/storage.js` e os testes de progresso.
- Não edite nem versione arquivos gerados em `dist/` ou dependências em `node_modules/`. Peça confirmação antes de apagar assets existentes. Ao alterar uma arte, confira seus usos, formatos e referências de pré-carregamento.
- Para alterações de código, execute os testes relevantes e o build. Confira no navegador os fluxos que mudar, incluindo entrada por toque/teclado em mudanças de controle. Registre falhas preexistentes e o que conseguiu verificar.

## 9. Referências

- [GDD e execução local](README.md)
- [Especificações por funcionalidade](docs/superpowers/specs/) e [planos históricos de implementação](docs/superpowers/plans/)
- [Demonstrações das configurações de áudio](docs/demos/) e [estudos de continuidade de Marte](artwork/continuity/)
- [Workflow de publicação](.github/workflows/deploy.yml) e [configuração do Vite](vite.config.js)
- [Licença no repositório](LICENSE) e [documentação administrativa de registro](registro-software/)

### A confirmar

1. Qual é a faixa etária ou série escolar alvo e quais objetivos pedagógicos orientam a dificuldade do banco de questões?
2. A desaceleração temporária por colisão e a escolha de faixas por toque/clique ou por tempo são definitivas para atualizar o GDD?
3. O dinheiro e os pontos de sustentabilidade terão uso em loja, melhorias ou outra mecânica?
4. Qual deve ser o destino do PNG antigo de Marte: mantê-lo público, arquivá-lo com os estudos de arte ou removê-lo?
