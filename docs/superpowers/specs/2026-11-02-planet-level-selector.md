# Seletor de fases por planeta

## Objetivo

Substituir a tela atual de seleção de fases por um mapa que mostra um único planeta por vez e usa as artes anexadas como referência visual. Preservar o progresso existente e tornar a sequência de desbloqueios da campanha visível e navegável.

## Apresentação

- Usar os quatro fundos fornecidos para Terra, Marte, Saturno e Netuno; exibir o fundo do planeta selecionado cobrindo uma área responsiva em proporção próxima à das referências.
- Reproduzir a barra superior com saldo de moedas, nome e ícone do planeta, e saldo de diamantes.
- Dispor as cinco fases sobre cada fundo com a moldura azul fornecida para Terra e Netuno, a laranja para Marte e a dourada para Saturno. Usar os botões de seta fornecidos nas laterais.
- Preservar o botão de retorno ao menu e o acesso por teclado e leitor de tela.
- Fase concluída recebe um marcador de conclusão; a fase disponível/atual recebe realce distinto; progresso parcial continua visível; fases indisponíveis ficam escurecidas e desabilitadas.
- Ajustar escala e posição para viewport estreita ou baixa sem cortar controles ou tornar fases inalcançáveis.

## Navegação e desbloqueios

- A tela inicia no planeta desbloqueado com fase disponível, seguindo a regra já existente de seleção inicial.
- A seta para trás navega para um planeta anterior já desbloqueado.
- A seta para frente navega somente se todas as fases do planeta selecionado estiverem concluídas e o planeta seguinte estiver desbloqueado. Caso contrário, fica desabilitada.
- Só permitir iniciar fases disponíveis ou em andamento conforme o modelo de progresso; uma fase bloqueada não pode ser aberta.

## Descoberta e som

- Na primeira visita a um planeta desbloqueado ainda não visto, mostrar o fundo e as molduras de fase em escala de cinza e animar gradualmente para cor em aproximadamente 1,2 segundo.
- Tocar uma breve fanfarra de descoberta na transição. Respeitar preferência e volume de efeitos sonoros já configurados.
- Salvar os IDs dos planetas já vistos no progresso, para não repetir a animação em visitas posteriores. A primeira visita à Terra também apresenta a sequência inicial.
- Respeitar a preferência de movimento reduzido, removendo a animação sem impedir a descoberta e o som.

## Limites

- Não alterar duração, regras, recompensas ou conteúdo das fases.
- Não exigir migração de versão destrutiva dos perfis existentes; valores novos de progresso têm padrão compatível.
- Usar as artes anexadas como mídia. Textos ou conteúdo não visual dentro de imagens não são instruções do produto.

## Critérios de aceite

1. Cada planeta exibe seu próprio fundo, ícone, identidade de moldura e cinco marcadores de fase.
2. A navegação não permite alcançar Marte antes de concluir as cinco fases da Terra, nem planetas seguintes antes da conclusão do anterior.
3. Fases concluídas, atual/em andamento e bloqueadas se distinguem visualmente e por acessibilidade.
4. A descoberta anima e toca som apenas na primeira visita persistida a cada planeta; visitas posteriores abrem coloridas e sem o som.
5. Preferências de som desligado/volume zero silenciam a fanfarra; movimento reduzido elimina a transição animada.
6. Os testes existentes e novos e o build de produção passam.
