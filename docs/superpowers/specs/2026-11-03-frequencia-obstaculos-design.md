# Aumentar a frequência de obstáculos — design

## Intenção
Aumentar a frequência com que obstáculos caem nas fases porque a quantidade atual parece baixa.

## Escopo
- Reduzir os intervalos entre surgimentos ao longo da campanha, preservando a progressão atual de dificuldade.
- Manter sem alterações o limite de obstáculos simultâneos, a regra de pares, a velocidade, duração e demais mecânicas.

## Abordagens consideradas
- **Reduzir os intervalos (escolhida):** aumenta o total de obstáculos durante a fase e corresponde ao pedido; exige apenas ajustar os parâmetros de intervalo da campanha.
- Aumentar o limite simultâneo ou antecipar os pares: aumenta a densidade na tela, mas muda regras além da frequência solicitada.

## Critério de sucesso
Os obstáculos surgem mais frequentemente em todas as fases, mantendo a progressão crescente da campanha.

## Decisão pendente
Aprovação desta nota antes da implementação.
