# Feedback de dano — design

## Intenção

Dar ao jogador um retorno visual claro quando uma colisão com obstáculo reduz a velocidade ou quando ele erra uma pergunta.

## Abordagens

- **Foguete vermelho, tremida e explosão localizada (escolhida):** piscar o próprio foguete em vermelho nos dois eventos, com intensidade que diminui até desaparecer, e aplicar uma tremida forte. Reforçar as partículas da colisão. Mantém a leitura do cenário e reutiliza os gatilhos existentes no motor.
- **Flash da tela:** torna o dano mais evidente, mas pode ocultar obstáculos e respostas durante o impacto.

## Escopo e restrições

- Usar o canvas e o ciclo de atualização/renderização existentes, sem dependências novas.
- Erro de pergunta: foguete pisca vermelho e treme durante o feedback da resposta.
- Colisão: o mesmo feedback, mais uma pequena explosão localizada no ponto do foguete.
- Respeitar a configuração de movimento reduzido e não alterar penalidades, controles ou regras do jogo.
- A piscada vermelha e a tremida devem perder força suavemente até desaparecerem; a tremida será forte no início, sem deslocar a posição real nem afetar colisões/controles.
- Decisões de duração, intensidade e cores ficam a cargo da implementação, mantendo o efeito legível sem encobrir a ação.

## Critério de sucesso

Os dois eventos tingem e tremem o foguete, com fade-out; apenas colisões geram a explosão; os efeitos expiram e não persistem em uma nova rodada. Os testes existentes e os novos testes direcionados passam.
