# Escala responsiva do gameplay

- **Intenção:** manter objetos e interações do gameplay com as mesmas proporções em larguras de tela diferentes, para que resolução não mude a dificuldade percebida.
- **Abordagens:** escalar apenas desenhos não acompanha colisões; escalar cada entidade separadamente duplica a lógica. Escolha: escala uniforme pela menor proporção entre viewport e design (390×844), com coordenadas do jogo e do ponteiro convertidas para o espaço lógico visível.
- **Escopo e restrições:** gameplay em canvas, entidades, colisões e entrada devem compartilhar coordenadas lógicas. Velocidades e tempos de balanceamento permanecem iguais. Altura lógica acompanha a proporção do viewport. HUD e menus não mudam.
- **Sucesso:** assets cabem tanto na largura quanto na altura, DPR não afeta o tamanho lógico e o ponteiro continua alinhado; testes e build passam.
- **Decisões de implementação:** derivar escala mínima entre largura e altura CSS e o design `VIEW`; renderizar com transformação DPR × escala; fornecer largura e altura lógicas visíveis (viewport CSS dividido pela escala) ao motor; converter entrada do ponteiro pela mesma escala.
