# E-commerce Moda — Visão do Cliente

> Desafio técnico (Processo Seletivo 2026 — Front-end / Full Stack) para o segmento de **Moda & Varejo**: construir uma jornada de compra moderna, fluida e intuitiva, da listagem (PLP) até o detalhe do produto (PDP).

O foco da entrega é em **experiência do usuário**, **organização do código** e **visão de produto** — não apenas em execução técnica.

---

## Sumário

- [Stack e decisões técnicas](#stack-e-decisões-técnicas)
- [Como executar](#como-executar)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Escopo mínimo (checklist)](#escopo-mínimo-checklist)
- [Extras](#extras)
- [Proposta de arquitetura (backend / API)](#proposta-de-arquitetura-backend--api)

---

## Stack e decisões técnicas

Cada escolha foi feita tendo em vista os critérios do desafio: **qualidade de UI**, **componentização**, **escalabilidade** e **clareza**.

| Camada | Ferramenta | Por que foi escolhida |
| --- | --- | --- |
| Linguagem | **TypeScript** (strict) | Obrigatório no desafio. Tipagem forte elimina uma classe inteira de bugs, melhora o DX (autocomplete, refactor seguro) e serve como documentação viva entre camadas (UI ↔ dados). |
| UI | **React 19** | Padrão de mercado para construção baseada em componentes reutilizáveis. React 19 traz Actions/useOptimistic, que ajudam a modelar interações de carrinho/checkout com feedback imediato. |
| Meta-framework | **TanStack Start** | SSR + file-based routing com APIs de *loader* tipadas ponta-a-ponta. Permite carregar PLP/PDP no servidor (SEO, FCP) sem abrir mão da DX de SPA. Menos "mágica" que Next e mais composto com o resto do ecossistema TanStack. |
| Roteamento | **TanStack Router** | *Type-safe* de verdade: parâmetros de rota, search params e loaders são tipados. Evita strings mágicas em `Link` e em filtros (ex.: `?categoria=masculino&ordem=preco-asc`). |
| Dados / Cache | **TanStack Query** | Cache, invalidação e estados (`loading`/`error`/`success`) prontos — base natural para *skeleton screens* e *optimistic updates*. Integra com SSR do Start via `setupRouterSsrQueryIntegration`. |
| Estilo | **Tailwind CSS v4** | Velocidade de prototipação com *design tokens* consistentes. Zero CSS órfão. v4 tem configuração via CSS (`@theme`) e build mais rápido. |
| Biblioteca de UI | **shadcn/ui** (Radix) | Componentes *copy-paste*: o código vive no repositório, então podemos customizar livremente sem brigar com a biblioteca. Acessibilidade (a11y) garantida pelo Radix por baixo. |
| Ícones | **lucide-react** | Conjunto consistente, *tree-shakable*, alinhado visualmente com shadcn/ui. |
| Bundler | **Vite 8** | Dev-server instantâneo (ESM nativo + HMR), build otimizado com Rollup. |
| Lint / Format | **Biome** | Substitui ESLint + Prettier com um único binário em Rust — 10x mais rápido e com zero configuração duplicada. |
| Testes | **Vitest + Testing Library** | Usa a mesma config do Vite (sem duplicação). Testing Library incentiva testes orientados ao usuário, não à implementação. |
| ORM (opcional) | **Prisma 7 + PostgreSQL** | Já configurado como *placeholder* para evolução do desafio (ver [proposta de arquitetura](#proposta-de-arquitetura-backend--api)). Schema *type-safe* derivado automaticamente. |
| Auth (opcional) | **Better Auth** | *Self-hosted*, type-safe, sem vendor lock-in. Reserva o alicerce para funcionalidades de cliente (lista de desejos, histórico) no futuro. |
| Gerenciador | **pnpm** | `node_modules` em *content-addressable store*: instala rápido e economiza disco. Mais rigoroso que npm/yarn sobre dependências fantasmas. |

### Por que essa combinação no contexto de Moda & Varejo

- **SSR + prefetch**: no e-commerce, cada 100ms a mais de LCP custa conversão. O loader da PLP roda no servidor, e o `defaultPreload: 'intent'` do router já faz *prefetch* da PDP quando o usuário passa o mouse no card.
- **Type-safe end-to-end**: o schema do produto é definido uma vez (futuramente no Prisma) e propaga tipado até o componente — refatorar um atributo do produto não exige caçar strings.
- **Componentização real**: a pasta `components/Layout/Header` já ilustra o padrão — cada subcomponente (`Logo`, `SearchBar`, `CartButton`…) tem responsabilidade única e é testável isoladamente.

---

## Como executar

### Pré-requisitos
- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm i -g pnpm`)

### Passos

```bash
pnpm install
pnpm dev
```

A aplicação fica disponível em `http://localhost:3000`.

### Variáveis de ambiente (opcional, apenas se for usar DB/Auth)

Crie um `.env.local` na raiz:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce_moda"
BETTER_AUTH_SECRET="<gerado via: pnpm dlx @better-auth/cli secret>"
```

> Os dados de produto atualmente são **mockados** (conforme permitido pela nota técnica do desafio). Banco e auth estão pré-configurados para evolução futura.

---

## Scripts disponíveis

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento em `:3000` |
| `pnpm build` | Build de produção |
| `pnpm preview` | Preview local do build |
| `pnpm test` | Executa a suíte Vitest |
| `pnpm lint` | Lint com Biome |
| `pnpm format` | Format com Biome |
| `pnpm check` | Lint + format em um passo |
| `pnpm db:push` | Sincroniza o schema Prisma com o banco |
| `pnpm db:migrate` | Cria/aplica migrations |
| `pnpm db:studio` | Abre o Prisma Studio |
| `pnpm db:seed` | Popula dados iniciais |

---

## Estrutura do projeto

```
src/
├── components/
│   ├── Layout/              # Header, Footer e wrappers de página
│   │   └── Header/          # Logo, SearchBar, FilterButton, CartButton, LoginButton
│   └── ui/                  # shadcn/ui (button, input, badge, sheet, separator...)
├── integrations/
│   ├── better-auth/         # Provider e helpers de autenticação
│   └── tanstack-query/      # Root provider + devtools do Query
├── lib/                     # utilitários compartilhados (cn, auth client...)
├── routes/
│   ├── __root.tsx           # shell HTML, metadados, devtools
│   ├── _layout/             # layout com Header (grupo de rotas)
│   └── api/                 # route handlers (ex.: /api/auth/$)
├── router.tsx               # configuração do TanStack Router + SSR Query
├── db.ts                    # instância singleton do Prisma
└── styles.css               # Tailwind + tokens do design system
```

### Convenções

- **Alias `#/`** aponta para `src/` (configurado em `tsconfig.json` e `package.json`). Imports ficam `import { Button } from "#/components/ui/button"`.
- **Componentes em pastas próprias** com `index.ts` de re-export — facilita mover/renomear sem quebrar *imports*.
- **File-based routing**: o arquivo da rota define a URL. Grupos de layout usam prefixo `_` (ex.: `_layout`).

---

## Escopo mínimo (checklist)

Mapeamento direto dos requisitos do PDF do desafio para o status atual da implementação.

### Página principal — Listagem (PLP)
- [ ] Exibição em grade de produtos
- [ ] Filtros por categoria e marca
- [ ] Ordenação por preço e nome

### Página interna — Detalhes (PDP)
- [ ] Visualização expandida do item
- [ ] Informações técnicas completas
- [ ] Galeria de imagens do produto

### Navegação / Fluxo do usuário
- [x] Layout base com Header fixo e responsivo
- [ ] Transição suave entre páginas
- [ ] Persistência de estado básica (filtros, busca)
- [ ] Botão de retorno e breadcrumbs

### Feedback / Estados de interface
- [ ] Skeleton screens na PLP e PDP
- [ ] Feedback visual em interações (hover, active, focus)
- [ ] Estados de erro e vazio

### Estrutura de dados (mockável)
- [ ] Identificação: nome, marca
- [ ] Comercial: preço (number), condição (novo/usado/excelente)
- [ ] Especificações: tamanho, categoria
- [ ] Visual: imagem

> Campos `[x]` já estão implementados; `[ ]` estão planejados. Esta seção é mantida **viva**: veja a skill [`update-readme`](.claude/skills/update-readme/SKILL.md).

---

## Extras

Itens entregues **além** do escopo mínimo:

- **SSR com hidratação**: o HTML inicial é renderizado no servidor (TanStack Start + Nitro), melhorando LCP e SEO — crítico para e-commerce.
- **Type-safety ponta-a-ponta**: rotas, search params, loaders e dados seguem tipados do servidor ao componente.
- **Acessibilidade de base**: `aria-label` em botões de ícone, `role="searchbox"` no campo de busca, estados `focus-visible` consistentes vindos dos tokens do shadcn/ui.
- **Responsividade**: o Header já reagrupa controles em mobile (ícones) e desktop (com label).
- **Devtools integradas**: TanStack Router Devtools + Query Devtools em um único painel, facilitando debug de cache e navegação.
- **Biome unificado**: lint e format em um só pipeline, com `pnpm check` como gate único.
- **Padrão de componentização escalável**: cada componente vive em sua própria pasta com `index.ts` barrel; facilita escalar de 5 para 500 componentes sem caos.
- **Fundação preparada para autenticação e persistência**: Better Auth + Prisma já plugados, permitindo evoluir para lista de desejos / histórico sem reformar a base.

---

## Proposta de arquitetura (backend / API)

> Seção opcional do desafio. Descreve como o backend seria estruturado para alimentar esta interface.

### API REST (ou RPC via server functions)

```
GET  /api/products                   # PLP — paginado, com filtros via query params
GET  /api/products/:slug             # PDP — detalhes + variantes
GET  /api/products/filters           # categorias, marcas, tamanhos disponíveis
GET  /api/products/search?q=         # busca full-text
POST /api/cart                       # adiciona item (sessão ou user)
GET  /api/cart
```

**Exemplo de query params da PLP:**
`/api/products?categoria=feminino&marca=marca-x&tamanho=M&ordem=preco-asc&pagina=1`

### Modelo de dados (Prisma)

```prisma
model Product {
  id           String   @id @default(cuid())
  slug         String   @unique
  name         String
  brand        String
  description  String
  priceCents   Int                  // dinheiro em centavos (evita float)
  condition    Condition            // NEW | USED | EXCELLENT
  category     Category             // MASCULINO | FEMININO | ACESSORIOS
  images       String[]             // URLs ordenadas
  variants     Variant[]            // tamanho + estoque
  createdAt    DateTime @default(now())
  @@index([category, brand])        // filtros mais usados
}

model Variant {
  id        String  @id @default(cuid())
  size      String              // P, M, G, 42...
  stock     Int
  product   Product @relation(fields: [productId], references: [id])
  productId String
}
```

### Decisões de arquitetura

- **Preços em centavos** (`Int`): evita erros de ponto flutuante — padrão em qualquer sistema financeiro sério.
- **Slug em vez de id na URL**: `/produto/camiseta-algodao-marca-x` é amigável para SEO e usuário.
- **Variants separadas**: tamanho é dimensão de estoque, não do produto — permite vender M sem G no mesmo SKU.
- **Indexes compostos** em `(category, brand)`: filtros combinados são a query quente da PLP.
- **Cache em camadas**: CDN (imagens) → Redis (listas, filtros) → Postgres (fonte de verdade). TanStack Query fecha o loop no cliente.
- **Edge-ready**: TanStack Start roda em Cloudflare Workers / Vercel Edge — `loader` da PLP pode rodar próximo ao usuário com cache compartilhado.

### Observabilidade (caminho natural de evolução)

- **Logs estruturados** por request-id (pino).
- **Métricas**: tempo da query da PLP por filtro (p50/p95) — filtro lento é sinal de falta de índice.
- **Frontend**: Web Vitals (LCP, INP) segmentados por rota.

---

## CI/CD e Git Flow

Pipeline completo de qualidade + release automatizada via GitHub Actions, com regras de proteção da branch `main` e uma CLI auxiliar (`git-flow`) para padronizar o fluxo de commits/branches/PRs.

### Visão geral end-to-end

```
┌──────────────┐  git-flow branch  ┌────────────────┐  git-flow commit  ┌────────────────┐
│   developer  │ ────────────────► │ feat/<descr>   │ ────────────────► │ commits válidos│
└──────────────┘                   └────────────────┘                   └───────┬────────┘
                                                                                │ git-flow pr
                                                                                ▼
                          ┌────────────────────────────────────────┐    ┌──────────────┐
                          │ branch protection (main)               │ ◄──│ PR para main │
                          │  • lint  ✓                             │    └──────┬───────┘
                          │  • test  ✓   (ci.yml em PR)            │           │ merge (squash)
                          │  • build ✓                             │           ▼
                          │  • 1 approval, sem push direto         │    ┌──────────────────┐
                          └────────────────────────────────────────┘    │ release.yml      │
                                                                        │  1. lint+test+   │
                                                                        │     build        │
                                                                        │  2. release-     │
                                                                        │     please:      │
                                                                        │     – abre/atu-  │
                                                                        │       aliza PR   │
                                                                        │       de release │
                                                                        │     – ao merge,  │
                                                                        │       cria tag + │
                                                                        │       GH Release │
                                                                        └──────────────────┘
```

### Workflows

| Arquivo | Trigger | Jobs |
| --- | --- | --- |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | `pull_request` → `main` | `lint` → `test` → `build` (sequenciais via `needs`) |
| [`.github/workflows/release.yml`](.github/workflows/release.yml) | `push` → `main` (após merge) | `quality` (lint+test+build) → `release` (release-please) |

### Por que `release-please` e não `semantic-release`

| Critério | release-please | semantic-release |
| --- | --- | --- |
| Compatível com **branch protection** estrita em `main` | ✅ A versão é proposta via **Release PR** que passa pelo CI normalmente | ⚠ Faz commit/tag direto na main → exige bypass das regras |
| Loop de re-trigger no sync do `package.json` | ✅ Não existe — o bump vai num PR comum | ⚠ Precisa de `[skip ci]` na mensagem do bot |
| `NPM_TOKEN` necessário | ❌ Não (não publica no npm; projeto é privado) | ⚠ Necessário se publicar no registry |
| Gera `CHANGELOG.md` versionado | ✅ Nativo | ✅ Via plugin |
| Mantenedor | Google | Comunidade |

A escolha por **release-please** elimina a necessidade do hack `[skip ci]`: o commit que altera `package.json`/`CHANGELOG.md` chega à `main` por meio de um Pull Request — que naturalmente roda o CI antes do merge — e o `release.yml` subsequente cria a tag/release sem reabrir um novo bump.

### Convenção de commits → SemVer

| Prefixo de commit | Bump | Exemplo |
| --- | --- | --- |
| `fix:` | **patch** (1.2.3 → 1.2.4) | `fix(cart): corrige cálculo de frete` |
| `feat:` | **minor** (1.2.3 → 1.3.0) | `feat(plp): adiciona ordenação por nome` |
| `feat!:` ou rodapé `BREAKING CHANGE:` | **major** (1.2.3 → 2.0.0) | `feat(api)!: muda contrato de /products` |
| `chore:`, `docs:`, `ci:`, `test:`, `style:` | sem release | `chore: bump dependências` |

### Proteção da `main`

A configuração canônica vive em [`.github/settings.yml`](.github/settings.yml) e é aplicada pelo [Probot Settings App](https://github.com/apps/settings) (instale o app no repo para que o YAML vire fonte de verdade).

Pontos garantidos:
- ✅ Push direto na `main` é bloqueado
- ✅ Merge somente via PR com **1 aprovação**
- ✅ Status checks **`Lint`**, **`Test`** e **`Build`** obrigatórios e atualizados (`strict: true`)
- ✅ Histórico linear, sem force-push, sem deleção
- ✅ Conversas resolvidas antes do merge

#### Branch protection via `gh` CLI (alternativa, sem o Probot Settings App)

```bash
OWNER=<seu-usuario-ou-org>
REPO=e-commerce-moda

gh api -X PUT "repos/$OWNER/$REPO/branches/main/protection" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint", "Test", "Build"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
```

### Skill: CLI `git-flow`

Implementação em [`scripts/git-flow.mjs`](scripts/git-flow.mjs) — Node ESM puro, **zero dependências externas**, usa `git` e `gh` do sistema.

#### Instalação

Duas formas (escolha uma):

```bash
# (a) via script do projeto — sempre funciona
pnpm git-flow help

# (b) instalar globalmente o binário (cria o comando "git-flow" no PATH)
npm link        # rodado a partir da raiz do projeto
git-flow help
```

> Pré-requisitos para `git-flow pr`: [GitHub CLI](https://cli.github.com/) (`gh`) instalado e autenticado (`gh auth login`).

#### Subcomandos

**`git-flow commit -m "<tipo>(escopo?): descrição"`**
Valida a mensagem contra Conventional Commits. Se inválida, mostra o padrão esperado e tenta **sugerir o tipo correto** com base nos arquivos staged (`.md` → `docs`, `.github/**` → `ci`, `*.test.ts` → `test`, etc.).

```bash
git-flow commit -m "feat(auth): adiciona login com Google"   # ✓
git-flow commit -m "adiciona login"                          # ✗ (rejeita + sugere)
```

**`git-flow branch <tipo> <descrição>`**
Cria a branch `<tipo>/<kebab-da-descrição>`. Tipos válidos: `feat`, `fix`, `chore`, `release`, `hotfix`.

```bash
git-flow branch feat user authentication
# → checkout em feat/user-authentication
```

**`git-flow pr`**
Faz `git push -u origin <branch>` e abre o PR via `gh`:
- **Base**: `main`
- **Título**: derivado do nome da branch (`feat: user authentication`)
- **Body**: template padrão com checklist (lint/test/build, docs, como testar)
- **Label**: aplicada conforme o tipo (`feat` → `enhancement`, `fix` → `bug`, `hotfix` → `hotfix`, etc. — definidas em `.github/settings.yml`)

### Secrets necessários

| Secret | Onde | Para quê | Obrigatório? |
| --- | --- | --- | --- |
| `GITHUB_TOKEN` | Fornecido automaticamente pelo Actions | Usado por `release-please` para abrir o Release PR e criar tags/releases | ✅ (sempre disponível) |
| `NPM_TOKEN` | Não usado | Só seria necessário se passássemos a publicar no npm registry | ❌ |

> Se a organização restringir as permissões padrão do `GITHUB_TOKEN`, garanta que o repo permite **"Read and write permissions"** em *Settings → Actions → General → Workflow permissions* (já refletido nos `permissions:` declarados em `release.yml`).

### Fluxo completo (exemplo prático)

```bash
# 1. Cria a branch padronizada
git-flow branch feat carrinho persistencia local
# → feat/carrinho-persistencia-local

# 2. Codifica, adiciona arquivos e commita validado
git add src/features/cart/...
git-flow commit -m "feat(cart): persiste itens no localStorage"

# 3. Abre o PR para main com template + label
git-flow pr

# 4. CI roda lint → test → build no PR
#    Após aprovação + merge (squash), release.yml dispara:
#       quality job ✓
#       release-please abre/atualiza o Release PR com bump minor (feat:)
#
# 5. Quando o Release PR é aprovado e mergeado:
#       release-please cria a tag (ex: v0.3.0)
#       gera o GitHub Release com notas auto-extraídas dos commits
#       atualiza CHANGELOG.md e package.json (já no commit do PR)
```

---

## Licença

Projeto acadêmico / avaliativo, sem licença pública definida.
