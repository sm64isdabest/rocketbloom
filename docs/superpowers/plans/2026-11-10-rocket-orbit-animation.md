# Animação orbital 3D do foguete — Plano de implementação

> **Para agentes implementadores:** executar as tarefas em sequência, seguindo TDD: criar um teste falho, confirmar RED, implementar e confirmar GREEN.

**Objetivo:** Exibir um foguete 3D que orbita suavemente a fase atual na tela de seleção.

**Arquitetura:** Criar funções puras de órbita testáveis e um componente React com Three.js que renderiza a nave, chama `requestAnimationFrame` e observa o contêiner e o alvo. Integrar o canvas sem capturar eventos, mantendo os controles existentes.

**Stack:** React 19, Three.js, `node:test`, Vite.

**Especificação:** `docs/superpowers/specs/2026-11-10-rocket-orbit-animation-design.md`

## Restrições globais

- Ciclo orbital: aproximadamente 6 segundos (requisito: 5–8 segundos).
- Fundo, números, posições, molduras, recursos e botões do seletor permanecem preservados.
- Foguete procedural com corpo branco, partes vermelhas, janela azul e chama amarela/alaranjada.
- Canvas independente e transparente, sem bloquear clique/toque nos controles.
- Respeitar `prefers-reduced-motion`, telas móveis e redimensionamento.

## Foco de revisão

- Alvo fase ausente ou removido: ocultar/limpar referência sem erro; testar troca de planeta e desmontagem.
- Tela redimensionada/orientação móvel: atualizar viewport e coordenadas; testar cálculo de tamanho zero e dimensões válidas.
- Movimento reduzido: evitar órbita contínua e manter estado inicial estável; testar modo reduzido.
- Camada visual/hit testing: garantir que canvas não intercepte interação de fase; revisar `pointer-events: none`.
- WebGL indisponível: falha deve degradar graciosamente sem quebrar a seleção; testar a inicialização com renderer indisponível quando viável.

---

### Tarefa 1: Cálculos puros da órbita

**Arquivos:** Criar `src/screens/rocketOrbit.js`; criar `src/screens/rocketOrbit.test.js`.

- [ ] Testar posição elíptica, escala frontal/traseira, tangente/orientação, período de 6s e interpolação suave entre alvos.
- [ ] Executar `node --test src/screens/rocketOrbit.test.js` e confirmar falha esperada.
- [ ] Implementar helpers puros para amostrar órbita, interpolar alvo e calcular pulso de seleção.
- [ ] Reexecutar o teste e confirmar sucesso.

### Tarefa 2: Cena procedural Three.js

**Arquivos:** Criar `src/screens/OrbitalRocket.jsx`; criar `src/screens/OrbitalRocket.test.js` se houver lógica de ciclo/componentes que possa ser validada sem DOM.

- [ ] Escrever teste falho para criação do modelo e propriedades determinísticas exportadas (geometria/materiales principais), se testável em Node.
- [ ] Confirmar RED.
- [ ] Adicionar Three.js e criar malhas leves do foguete cartoon, janela, aletas, propulsor, luz, chama e partículas.
- [ ] Implementar `requestAnimationFrame`, resize observer, pausa fora da viewport, cleanup e fallback quando WebGL não estiver disponível.
- [ ] Confirmar GREEN e build.

### Tarefa 3: Integração com seletor

**Arquivos:** Modificar `src/screens/PlanetsScreen.jsx` e `src/styles/index.css`.

- [ ] Atualizar `PlanetsScreen` com refs nos alvos de fase, alvo da fase disponível/selecionada, hover, seleção e movimento reduzido.
- [ ] Renderizar foguete em camada absoluta transparente, ordenar profundidade com `z-index` alternado em torno da fase, mantendo eventos do canvas desligados.
- [ ] Testar ou confirmar por teste existente que a tela continua mantendo a ordem, posições e disponibilidade dos cinco níveis.
- [ ] Verificar manualmente viewport desktop/mobile e movimento reduzido, quando o ambiente permitir.

### Tarefa 4: Verificação e entrega

**Arquivos:** Atualizar `src/game/data/projectImages.js` apenas se novo asset local for necessário; atualizar docs conforme resultado.

- [ ] Executar `npm test` e `npm run build`.
- [ ] Corrigir falhas da mudança e repetir verificações.
- [ ] Revisar diff, executar `git add`, `git commit` e `git push` conforme pedido do usuário.
