# Visualização das áreas de colisão

## Intenção

Adicionar às Configurações um interruptor persistente para mostrar, durante qualquer fase, as áreas usadas nas colisões do foguete, moedas, gemas e obstáculos. Isso ajuda a inspecionar e ajustar visualmente a jogabilidade.

## Objetivos e limites

- O interruptor começa desligado e é salvo junto às demais configurações locais.
- Quando ligado, o canvas desenha contornos com cores distintas sobre as caixas reais de colisão dos objetos.
- A visualização inclui entidades vivas presentes na fase e acompanha seus movimentos.
- O modo não altera detecção de colisão, dimensões, movimento ou resultado do jogo.
- A caixa do foguete segue seu retângulo de colisão atual; moedas e gemas usam suas dimensões atuais; obstáculos usam `collisionBox`.

## Abordagens consideradas

- **Interruptor persistente em Configurações (escolhida):** combina com o pedido e com as preferências que o jogo já salva; fica disponível em todas as fases.
- **Atalho temporário de depuração:** simples durante a partida, mas não atende ao pedido por uma opção neste menu e não lembra a preferência.

## Restrições e decisões

- Manter o canvas e a lógica atual de colisões; desenhar apenas linhas sobre o quadro já renderizado.
- Adicionar a preferência com valor padrão `false` e migrar silenciosamente perfis existentes.
- Integrar o controle ao bloco de acessibilidade no menu mostrado na referência, mantendo os estilos e acessibilidade dos interruptores existentes.

## Critérios de conclusão

- É possível ligar/desligar a exibição no menu e a escolha persiste após recarregar.
- Com a opção ligada, as caixas de foguete, moedas, gemas e obstáculos coincidem com as áreas usadas pela detecção de colisões; desligada, nenhum contorno é desenhado.
- A suíte de testes e o build passam.
