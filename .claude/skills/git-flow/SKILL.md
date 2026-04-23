---
name: git-flow
description: Automatiza ponta-a-ponta o fluxo git do e-commerce-moda — cria a branch padronizada, divide e commita as mudanças seguindo Conventional Commits, faz push e abre o PR para main com título/body/labels prontos. Use quando o usuário disser "git-flow", "abre PR", "commita e sobe", "fluxo git", "manda pra main", "abre um PR pra mim" ou qualquer pedido para encerrar um trabalho local em direção ao remote sem instruções passo-a-passo.
---

# git-flow

Skill de **um comando** para encerrar um ciclo de desenvolvimento local: você decide o nome da branch, o particionamento dos commits, as mensagens, os labels e o conteúdo do PR. O usuário não precisa especificar nada — só invocar.

## Quando usar

- Usuário disse "git-flow", "/git-flow", "abre PR", "commita e manda", "fluxo git completo", "sobe isso pra main", etc.
- Há mudanças locais (tracked ou untracked) que precisam virar PR.
- Mesmo se o usuário só pediu "commit", se houver várias mudanças relacionadas e não houver branch criada, **execute o fluxo completo**.

## Quando NÃO usar

- Usuário pediu apenas para **inspecionar** estado git (`git status`, `git log`).
- Já existe um PR aberto para a branch atual — neste caso, só commite e dê push (não tente abrir outro PR).
- Usuário está em `main`/`master` e pediu explicitamente "commit direto" — aí **pare e avise** que `main` é protegida.

## Fluxo de execução (siga em ordem)

### 1. Diagnóstico

Em uma única rodada paralela, rode:

```bash
git status --short
git diff --stat
git diff --cached --stat
git branch --show-current
git log --oneline -10
```

Use o resultado para responder mentalmente:
- Estou em `main`? → **preciso criar branch nova**.
- Já estou em uma branch `<tipo>/<slug>`? → **só commito + push + PR (se ainda não existir)**.
- Há mudanças staged + unstaged misturadas? → trate todas como um conjunto (faça `git add -A` apenas após decidir o agrupamento).
- Os arquivos sugerem múltiplos escopos (ex.: `feat` + `docs` + `chore`)? → **divida em commits separados**.

### 2. Decidir o tipo e a descrição

Inferir o **tipo** a partir dos arquivos modificados:

| Sinal | Tipo |
| --- | --- |
| Apenas `*.md`, `docs/**` | `docs` |
| Apenas `.github/workflows/**`, `.github/**` | `ci` |
| Apenas `*.test.ts`, `*.spec.ts`, `__tests__/**` | `test` |
| Apenas `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `biome.json`, `vite.config.ts` (sem código de produto) | `chore` |
| Refactor sem mudança de comportamento (rename, extração de função) | `refactor` |
| Correção de bug óbvio (mensagem do usuário menciona "fix"/"bug"/"corrigir") | `fix` |
| Otimização mensurável (cache, índice, memo) | `perf` |
| Tudo o mais que adicione/altere comportamento de produto | `feat` |

Inferir o **escopo** pela área tocada (`auth`, `cart`, `plp`, `pdp`, `header`, `api`, `db`...). Se a mudança atravessa muitas áreas, **omita o escopo**.

Inferir a **descrição curta** do que mudou em **português**, modo imperativo, minúsculas, sem ponto final, ≤72 chars.

### 3. Criar a branch (se necessário)

Se já está numa branch `<tipo>/<slug>`, **pule esta etapa**. Se está em `main`:

```bash
git checkout -b <tipo>/<kebab-slug>
```

Regras do slug:
- Tipos válidos: `feat`, `fix`, `chore`, `release`, `hotfix`.
- Kebab-case, sem acentos, sem caracteres especiais, ≤50 chars.
- Derive do trabalho feito (ex: persistência local do carrinho → `feat/cart-local-storage`).

### 4. Particionar e commitar

**Não faça um commit-bolo**. Olhe o diff e divida por intenção:

- Mudanças de produto (componentes, rotas, lógica) → 1+ commits `feat:`/`fix:`
- Documentação atualizada junto → commit separado `docs:`
- Lockfile/config tocados como efeito colateral → commit separado `chore:`
- Testes adicionados para a feature → podem ir junto ao `feat:` (ok) OU como `test:` separado se forem volumosos

Para cada partição:

```bash
git add <arquivos específicos>     # nunca git add -A cego
git commit -m "<tipo>(<escopo>): <descrição>"
```

Se uma mudança é **breaking change**, use `<tipo>!:` e adicione no body via `-m` extra:
```bash
git commit -m "feat(api)!: muda contrato de /products" -m "BREAKING CHANGE: campo priceCents agora obrigatório"
```

**Antes de commitar**, valide cada mensagem contra o regex:
```
^(feat|fix|chore|docs|refactor|test|ci|perf|build|style|revert)(\([\w.\-/ ]+\))?!?: .{1,72}$
```

### 5. Push

```bash
git push -u origin <branch>
```

Se falhar por divergência (raro, branch nova), investigue antes de force-push. **Nunca** use `--force` sem confirmar com o usuário.

### 6. Abrir o PR

Verifique primeiro se já existe:
```bash
gh pr view --json number,url 2>/dev/null
```
Se existir, **pare** e reporte o link — o push já atualizou o PR.

Se não existir, abra:
```bash
gh pr create \
  --base main \
  --head <branch> \
  --title "<tipo>: <descrição em palavras>" \
  --label <label> \
  --body "$(cat <<'EOF'
## Resumo
<2-4 bullets do que mudou e por quê — extraídos dos commits>

## Mudanças
- <commit 1>
- <commit 2>

## Checklist
- [x] Conventional Commits
- [ ] `pnpm lint` local
- [ ] `pnpm test` local
- [ ] `pnpm build` local
- [ ] README atualizado (se aplicável)

## Como testar
<passos concretos para validar — derivados do tipo de mudança>
EOF
)"
```

**Mapeamento de label** (correspondem a [`.github/settings.yml`](../../../.github/settings.yml)):

| Tipo de branch | Label |
| --- | --- |
| `feat/*` | `enhancement` |
| `fix/*` | `bug` |
| `chore/*` | `chore` |
| `hotfix/*` | `hotfix` |
| `release/*` | `release` |

### 7. Reportar

Resposta final ao usuário (1-3 linhas máx):
- Branch criada/usada
- N commits feitos (com os títulos)
- Link do PR

Exemplo:
```
✓ feat/cart-local-storage — 2 commits (feat: persiste carrinho no localStorage; test: cobre persistência)
✓ PR #42 → https://github.com/owner/repo/pull/42
```

## Pré-requisitos (verificar uma vez na primeira execução da sessão)

- `gh --version` retorna OK
- `gh auth status` mostra autenticado
- Se algum falhar, pare e instrua o usuário (`gh auth login`).

## Anti-padrões

- ❌ Commit único agrupando feat + docs + chore.
- ❌ `git add -A` antes de decidir o agrupamento.
- ❌ `--force` ou `--no-verify` sem pedido explícito do usuário.
- ❌ Mensagem genérica tipo `chore: updates` ou `fix: stuff`.
- ❌ Pular o PR e dar `git push origin main` (a branch é protegida — falhará e gera ruído).
- ❌ Pedir confirmação ao usuário a cada passo. A skill é **autônoma**: só pare se houver risco real (push em main, force-push, conflito não trivial).

## Caso especial: nada para commitar

Se `git status --short` vier vazio, reporte "✓ Working tree limpo, nada para commitar" e pare. Não invente mudanças.
