# Órbita 3D do foguete na seleção de fases

## Intenção

Animar a nave da tela de seleção de fases orbitando continuamente a fase atual, para dar a sensação de exploração espacial. A nave usa o foguete anexado como referência de identidade: corpo branco, nariz e aletas vermelhos, janela azul e chama amarelo/laranja.

## Objetivos e limites

- Renderizar um modelo procedural 3D pequeno com perspectiva, luz e chama animada.
- Percorrer uma elipse em aproximadamente 6 segundos, variando escala e profundidade para passar atrás e à frente do marcador.
- Seguir a fase atual com transição suave, desacelerar levemente durante hover e aproximar-se brevemente ao selecionar.
- Manter rastro e partículas discretos, interação acessível e suporte a movimento reduzido.
- Preservar fundos, posições, molduras, números, recursos e navegação existentes.

## Abordagens

- **Three.js com geometria procedural (escolhida):** produz volume e diferentes ângulos reais; adiciona uma dependência e uma camada WebGL isolada.
- SVG/CSS 3D: leve e simples, mas a nave continuaria visualmente plana e não atenderia ao volume solicitado.
- Imagem PNG com rotação e efeitos: reutiliza a arte existente, mas não produz ângulos tridimensionais.

## Desenho

Usar Three.js em um componente React dedicado e num canvas transparente posicionado sobre as fases. Construir o foguete com primitivas e malhas leves, aplicar materiais cartoon e luz direcional, animar a chama por escala/intensidade. Um loop `requestAnimationFrame` calcula fase orbital, profundidade, orientação tangente, escala e partículas. Medir o contêiner e os botões de fase para acompanhar responsivamente a fase atual; interpolar o alvo ao navegar e aplicar um impulso curto ao selecionar. A órbita e a nave não recebem eventos de ponteiro, portanto os botões continuam interativos. Pausar o loop fora de tela e simplificar animação conforme `prefers-reduced-motion`.

## Validação

Cobrir com testes unitários o cálculo da órbita (período, profundidade, escala e orientação), transições de alvo e estado reduzido. Executar a suíte existente e o build de produção.
