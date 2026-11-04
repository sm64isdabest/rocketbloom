# Popup de pausa e foguete irritado — design

## Intenção

Atualizar a pausa das fases para corresponder à referência fornecida e dar uma reação divertida quando o jogador toca no foguete com jornal.

## Escopo

- Exibir no centro da tela um popup sobre a fase congelada, com título, ilustração e os três botões fornecidos: sair da fase, continuar e configurações.
- Sair retorna ao menu principal; continuar retoma a fase; configurações abre a tela de configurações sobre a fase pausada, e fechar retorna ao popup.
- Tornar o foguete ilustrado interativo: ao toque, tocar um efeito sonoro e executar uma animação breve de irritação. Respeitar som desligado/volume de efeitos e movimento reduzido.
- Manter os atalhos e o comportamento atual de pausar e retomar.

## Abordagens consideradas

- **Usar as imagens anexadas (escolhida):** corresponde diretamente à referência e mantém os ícones consistentes com a arte enviada.
- Recriar os ícones em CSS: reduz arquivos de imagem, mas perde fidelidade à referência escolhida.

## Decisões de implementação

- Usar as imagens fornecidas para porta, seta verde, engrenagem e foguete com jornal.
- Reutilizar `SettingsScreen` como camada modal sem mudar o estado da fase de `PAUSED`.
- Gerar o efeito sonoro com o sistema de áudio existente; a forma e a duração da animação irritada ficam a cargo da implementação, com suporte a movimento reduzido.

## Critério de sucesso

O popup aparece centralizado enquanto o jogo continua pausado; cada botão executa sua ação; configurações podem ser abertas e fechadas sem retomar a fase; tocar no foguete produz som e animação, respeitando as preferências de áudio e movimento.

## Aprovação

Aprovada pelo usuário em 2026-11-04.
