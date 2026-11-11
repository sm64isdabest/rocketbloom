# Ferramentas globais de debug

## Intenção e objetivos

Ampliar o menu interno aberto por Q+P para controlar uma partida e navegar entre telas sem precisar sair do jogo. Incluir ajuste da velocidade de avanço, duração finita ou infinita, GODMODE, todos os poderes atuais e remoção da conclusão de uma fase.

## Limites e restrições

- Manter o menu e os atalhos de teclado existentes, com interface em português.
- Abrir em qualquer tela utilizável depois do boot, inclusive telas de menu e resultados.
- O menu deve pausar a partida ao abrir e restaurar a tela anterior ao fechar.
- A duração `0` significa infinita; somente valores positivos contam para a conclusão.
- Os quatro poderes são `turbo`, `star`, `bubble` e `shrink` conforme `POWER_UPS`.
- Desconcluir uma fase limpa somente seu registro e progresso; desbloqueios de planetas continuam preservados.

## Abordagens

- Acrescentar callbacks e controles ao menu atual — escolhido, pois `App.jsx` já centraliza a tela e mantém uma referência para a partida.
- Criar um subsistema/painel de debug separado — traz isolamento, mas duplica estado e fluxo de navegação para um único menu existente.
- Persistir velocidade, duração e GODMODE no perfil — rejeitado, pois são controles temporários da sessão.

## Arquitetura e escolhas

O menu chama métodos de controle expostos pela instância atual de `GameEngine`. A duração é uma propriedade de sessão do motor; GODMODE evita as penalidades de dano; os poderes aplicam imediatamente seus efeitos. O seletor usa destinos existentes do aplicativo, incluindo menu, planetas, laboratório (sala de comando), configurações, jogo, pausa e resultados.

## Verificação

Adicionar testes unitários para utilitários de progresso e controles do motor existentes. Executar `npm test` e `npm run build`, revisar o diff, então criar commit e fazer push para `main` conforme pedido.
