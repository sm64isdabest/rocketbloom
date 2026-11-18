# Escala responsiva do gameplay

- **Intenção:** manter objetos e interações do gameplay com as mesmas proporções em larguras de tela diferentes, para que resolução não mude a dificuldade percebida.
- **Abordagens:** escalar apenas desenhos não acompanha colisões; escalar cada entidade separadamente duplica a lógica. Escolha: um espaço lógico de 390 px de largura, com escala uniforme aplicada ao canvas e coordenadas do ponteiro convertidas para esse espaço.
- **Escopo e restrições:** gameplay em canvas, entidades, colisões e entrada devem compartilhar coordenadas lógicas. Velocidades e tempos de balanceamento permanecem iguais. Altura lógica acompanha a proporção do viewport. HUD e menus não mudam.
- **Sucesso:** dimensões lógicas do gameplay permanecem iguais em viewports estreitos/largos, DPR não afeta o tamanho lógico e o ponteiro continua alinhado; testes e build passam.
- **Decisões de implementação:** derivar escala da largura CSS em relação a `VIEW.designWidth`; renderizar com transformação DPR × escala; fornecer largura e altura lógicas ao motor; converter entrada do ponteiro pela mesma escala.
