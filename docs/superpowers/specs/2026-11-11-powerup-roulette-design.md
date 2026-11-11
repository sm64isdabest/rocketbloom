# Apresentação da seleção de powerup

## Intenção

Tornar a seleção aleatória da caixa de powerup mais clara e visualmente agradável, substituindo a faixa com caracteres por um cartão quadrado que exibe a arte do poder.

## Requisitos

- Durante a roleta, exibir as imagens existentes de turbo, estrela, bolha e encolhimento.
- O cartão deve ser 1:1, centralizado, com contorno branco e cantos levemente arredondados.
- Ao terminar o sorteio, exibir a imagem escolhida com zoom suave e lento enquanto desaparece.
- Preservar a duração atual da roleta e respeitar a configuração de movimento reduzido.

## Abordagens

- Desenhar um cartão e a imagem no canvas do jogo, seguindo o ciclo de renderização existente. Escolhida porque mantém o painel sincronizado com a roleta e evita uma camada de UI separada.
- Criar um componente DOM sobreposto ao canvas. Descartada por duplicar coordenação de estado e posicionamento para um único efeito já desenhado no canvas.

## Limites e decisões

- Reutilizar os PNGs públicos existentes e a base de URL definida pelo app.
- Manter a roleta em 1 segundo e acrescentar uma animação de saída após a seleção.
- Não mudar as regras ou os efeitos dos poderes.
- Adicionar cobertura de teste ao render da roleta e à conclusão/saída da seleção.
