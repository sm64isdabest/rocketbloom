# Aumentar a frequência de obstáculos — plano de implementação

> **Para agentes de implementação:** executar este plano tarefa por tarefa.

**Objetivo:** Fazer os obstáculos caírem mais frequentemente em todas as fases.

**Arquitetura:** Ajustar somente os intervalos interpolados da campanha em `src/game/data/planets.js`. Preservar limite simultâneo, pares, velocidades e duração.

**Stack:** JavaScript (ES modules), configuração de campanha existente.

**Spec:** `docs/superpowers/specs/2026-11-03-frequencia-obstaculos-design.md`.

## Restrições
- Diminuir `obstacleIntervalMs` e `obstacleMinIntervalMs` em toda a campanha.
- Preservar a progressão crescente da frequência entre fases.
- Não alterar limite simultâneo ou regra de pares.

## Foco de revisão
- A primeira fase também deve apresentar maior frequência que antes.
- A fase final deve continuar sendo a mais frequente.
- Os intervalos mínimos devem continuar positivos.

### Tarefa 1: Reduzir intervalos da campanha

**Arquivos:**
- Modificar `src/game/data/planets.js`, em `CAMPAIGN_CONFIG.difficulty`.
- Atualizar os valores esperados em `src/game/data/catalog.test.js` para a fase final.

**Implementação:**
- Reduzir `obstacleIntervalMs` de 4600–2750 ms para 3800–2300 ms.
- Reduzir `obstacleMinIntervalMs` de 2450–1550 ms para 2000–1250 ms.
- Manter todo o restante dos parâmetros igual.
- Atualizar a expectativa de Netuno 5 para refletir os novos intervalos finais (2300 ms e 1250 ms).

**Verificação:** Revisar o diff para confirmar que somente os quatro extremos dos intervalos mudaram e continuam em ordem decrescente.
