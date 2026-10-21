# RocketBloom
## GDD — Documento de Design do Jogo

**Proprietários:** Isaac Pessoa, Luiz Neto, Ricardo Santos e Thiago Pinheiro 

## Experiência

### Emoções que quero provocar

Desafio, concentração, descoberta e conquista.

### Frase da experiência

Quando alguém jogar RocketBloom, vai sentir a sensação de conquista ao acompanhar a evolução das plantas resgatadas em diferentes planetas descobertos ao longo da jornada. Para isso, o jogador deverá resolver desafios matemáticos enquanto se concentra em desviar de obstáculos, tornando a experiência mais desafiadora e envolvente.

## Tema e Conceito

### Tema

Um foguete é responsável por explorar quatro planetas que compõem o sistema solar: Terra, Marte, Saturno e Netuno.

- **Terra:** cenário composto pela Floresta Amazônica, com elementos como aviões, helicópteros e balões.
- **Marte:** cenário com obstáculos, como asteroides.
- **Saturno:** cenário com obstáculos, como asteroides e cometas.
- **Netuno:** cenário brilhante, contendo obstáculos como fragmentos de diamantes e cometas.

### Conceito

O jogador realiza uma viagem interplanetária, controlando um foguete pilotado por um astronauta cientista. Durante a jornada, precisa resolver questões matemáticas e desviar de obstáculos para passar de fase, concluindo etapas de uma missão sustentável que visa salvar uma espécie de planta de cada planeta.

## História e Missão

### História

Um astronauta cientista é encarregado de realizar uma viagem interplanetária devido à extinção de espécies nativas da flora, essenciais para o equilíbrio de alguns planetas do sistema solar. Para isso, deverá controlar um foguete e enfrentar imprevistos, como obstáculos em seu trajeto. O jogador precisará desviar desses obstáculos para cumprir os objetivos da missão e garantir a continuidade de seu projeto sustentável, que visa salvar espécies de plantas dos planetas explorados: Terra, Marte, Saturno e Netuno.

### Missão e como vencer

Para completar cada planeta, o jogador deverá passar por um conjunto de fases compostas por operações matemáticas e obstáculos. A dificuldade aumentará gradualmente a cada planeta finalizado.

## Personagens

### Astronauta Cientista
- **Habilidade de movimento:** pilotar o foguete.
- **Limitação:** figura narrativa.

### Foguete
- **Habilidade de movimento:** desviar de obstáculos e deslocar-se entre os planetas.
- **Limitação:** ao ser atingido por um obstáculo, é danificado e perde velocidade.

## Componentes do Jogo

### Itens coletáveis

- **Moeda:** recurso coletável durante a partida.
- **Diamante:** recurso coletável durante a partida.

### Obstáculos

- Avião.
- Helicóptero.
- Balão.
- Asteroides.

### Elementos de cenário

- Planeta Terra.
- Planeta Marte.
- Planeta Saturno.
- Planeta Netuno.
- Laboratório com vaso.
- Sala de comando.
- Menu inicial.
- Plantas.

### Marcadores e peças de apoio

- Fechar interface.
- Configurações.
- Ícone do laboratório.
- Sair do cenário.
- Jogar.

## Mecânicas e Desafios

### Blocos de comando do jogo

- **Arrastar o dedo ou mouse:** controla a posição horizontal (eixo X) do foguete.
- **Clique:** permite interagir com a interface.

### Quantidade de comandos por turno

1 comando.

### Ciclo do turno

O jogador executa um comando e verifica se acertou a questão matemática ou se conseguiu desviar do obstáculo.

### Decisão importante

O jogador precisa equilibrar a atenção entre responder às questões matemáticas, desviar dos obstáculos e coletar itens, como moedas e diamantes.

## Regras

### Número de jogadores

1 jogador.

### Livro de regras

#### Objetivo do jogo

O objetivo é controlar uma nave espacial, desviar dos obstáculos e responder corretamente às perguntas apresentadas durante a partida para avançar de fase.

As alternativas de resposta aparecerão caindo do céu. O jogador deverá conduzir a nave até a alternativa correspondente à resposta correta.

#### Como jogar

Ao iniciar a partida, a nave aparecerá na tela. O jogador deverá movimentá-la utilizando os controles disponíveis.

Durante o jogo, será necessário:

- Movimentar a nave.
- Desviar dos obstáculos.
- Ler atentamente as perguntas.
- Observar as alternativas que caem do céu.
- Conduzir a nave até a resposta correta.
- Acumular pontos ao acertar as perguntas.

O jogador deverá prestar atenção tanto aos obstáculos quanto às alternativas que aparecem na tela.

#### Obstáculos

Durante a missão, diferentes obstáculos poderão aparecer no caminho da nave. O jogador deverá movimentá-la para evitar colisões.

As colisões causam perda de velocidade, o que pode levar ao fim do jogo. Por isso, é importante observar toda a área da tela e não se concentrar apenas nas respostas.

#### Perguntas

Durante a partida, perguntas serão apresentadas ao jogador. Após a apresentação de uma pergunta, diferentes alternativas começarão a cair do céu.

O jogador deverá identificar a alternativa correta e conduzir a nave até ela.

**Exemplo:**

Quanto é 6 + 7?

- 13
- 14
- 12
- 16

Resposta correta: 13.

#### Como responder

Para responder a uma pergunta, o jogador deverá conduzir a nave até a alternativa escolhida.

- **Resposta correta:** será registrada como correta, e o jogador receberá velocidade.
- **Resposta incorreta:** será registrada como errada, e o jogador sofrerá uma penalidade.

#### Como vencer

Para completar uma fase, o jogador deverá chegar ao final mantendo velocidade suficiente para que o foguete continue em movimento.

Ao completar uma fase, poderá avançar para a próxima. As fases poderão apresentar novas perguntas, obstáculos e desafios.

### Teste dos 2 minutos: onde travou

Não houve dificuldades identificadas.

## Pontuação e Recompensas

### Como se pontua

- **Resposta correta:** aumento de velocidade.
- **Moeda coletada:** +1 moeda.
- **Diamante coletado:** +1 diamante.

### Recompensas

- **Planta:** conquistada durante as fases, oferece dinheiro e progresso ao jogador.

## Desenvolvimento

Aplicação web com React, Vite, JavaScript e HTML5 Canvas.

```bash
npm install
npm run dev
```

Outros comandos:

```bash
npm test
npm run build
npm run preview
```

O servidor de desenvolvimento imprime a URL local (em geral `http://localhost:5173`).

## Jogar pela web

O GitHub Pages publica o jogo automaticamente a cada envio para a branch `main`.
Na primeira publicação, habilite o GitHub Pages em **Settings → Pages** e selecione
**GitHub Actions** como origem de build e deploy. Depois que a ação **Deploy to GitHub
Pages** terminar, o jogo ficará disponível em:

https://sm64isdabest.github.io/rocketbloom/
