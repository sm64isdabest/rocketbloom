# Design: organização das configurações e áudio

- **Intenção:** distribuir melhor as opções do modal de configurações mantendo o painel espacial e a identidade visual atual do RocketBloom, com leitura clara em telas grandes e pequenas.
- **Escopo:** preservar as quatro abas e reorganizar a aba Áudio em quatro cartões com ícones, títulos, descrições e controles acessíveis. Música e efeitos mantêm sliders aplicados em tempo real; sons da interface recebe toggle próprio; “Silenciar todos” desativa temporariamente música, efeitos e interface, restaurando as preferências anteriores quando reativado. Demais abas recebem espaçamento e responsividade consistentes sem mudar suas funções.
- **Abordagens:** (1) reorganizar os dois controles existentes, mais simples mas incompleto; (2) estender as preferências e o gerenciador de áudio para cobrir os quatro controles, recomendada e escolhida por atender ao pedido completo sem substituir o modal existente.
- **Restrições e chamadas:** preservar progresso salvo e compatibilidade com configurações antigas, volume individual, aparência escura com brilho azul, botão de fechar e abas horizontais; ícones podem usar símbolos tipográficos já disponíveis, sem adicionar dependências.
- **Não objetivos:** redesenhar o restante do jogo ou alterar comportamento de controles fora das configurações.
- **Verificação e entrega:** rodar testes e build, apresentar demonstração visual da aba Áudio, revisar `git status` e criar commit/push se o estado e o repositório tornarem isso apropriado.
