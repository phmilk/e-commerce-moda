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
| ORM (opcional) | **Prisma 7 + SQLite** (via `@prisma/adapter-libsql`) | Banco em arquivo local (`dev.db`), zero dependência de runtime externo. Schema *type-safe* derivado automaticamente. Evoluir para Postgres é só trocar o `provider` e o `DATABASE_URL` (ver [proposta de arquitetura](#proposta-de-arquitetura-backend--api)). |
| Auth (opcional) | **Better Auth** | *Self-hosted*, type-safe, sem vendor lock-in. Reserva o alicerce para funcionalidades de cliente (lista de desejos, histórico) no futuro. |
| Gerenciador | **pnpm** | `node_modules` em *content-addressable store*: instala rápido e economiza disco. Mais rigoroso que npm/yarn sobre dependências fantasmas. |

### Por que essa combinação no contexto de Moda & Varejo

- **SSR + prefetch**: no e-commerce, cada 100ms a mais de LCP custa conversão. O loader da PLP roda no servidor, e o `defaultPreload: 'intent'` do router já faz *prefetch* da PDP quando o usuário passa o mouse no card.
- **Type-safe end-to-end**: o schema do produto é definido uma vez (futuramente no Prisma) e propaga tipado até o componente — refatorar um atributo do produto não exige caçar strings.
- **Componentização real**: a pasta `components/Layout/Header` já ilustra o padrão — cada subcomponente (`Logo`, `SearchBar`, `CartButton`…) tem responsabilidade única e é testável isoladamente.

---

## Como executar

Pré-requisitos: **Node.js ≥ 20** e **pnpm ≥ 9**. Nada mais — o SQLite vive em um arquivo local (`dev.db`).

```bash
pnpm install                      # inclui `postinstall` com `prisma generate`
cp .env.example .env.local        # cria o arquivo de variáveis locais
pnpm db:push                      # cria dev.db e aplica o schema
pnpm db:seed                      # popula 96 produtos em árvore gendered + 412 imagens
pnpm dev                          # http://localhost:3000
```

### Variáveis de ambiente

O template versionado é [`.env.example`](.env.example). O `.env.local` é gitignored.

| Variável | Para quê |
| --- | --- |
| `DATABASE_URL` | Caminho do SQLite. Default: `file:./dev.db` (arquivo criado na raiz). |
| `BETTER_AUTH_URL` | URL pública da app, usada pelo Better Auth (`http://localhost:3000` em dev). |
| `BETTER_AUTH_SECRET` | Segredo do Better Auth. Gere com `pnpm dlx @better-auth/cli secret`. |

> As imagens dos 96 produtos já estão versionadas em [`public/upload/{sku}/`](public/upload/) e o seed referencia esses caminhos diretamente — não há download nem cópia externa no seed.

---

## Scripts disponíveis

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento em `:3000` |
| `pnpm build` | Build de produção |
| `pnpm preview` | Preview local do build |
| `pnpm test` | Executa a suíte Vitest (45 testes) |
| `pnpm lint` | Lint com Biome |
| `pnpm format` | Format com Biome |
| `pnpm check` | Lint + format em um passo |
| `postinstall` | Roda `prisma generate` automaticamente após `pnpm install` (garante o Prisma Client em CI/dev sem passo manual) |
| `pnpm db:generate` | Gera o Prisma Client em `src/generated/prisma` (versão com `.env.local`) |
| `pnpm db:push` | Sincroniza o schema Prisma com o banco |
| `pnpm db:migrate` | Cria/aplica migrations |
| `pnpm db:studio` | Abre o Prisma Studio |
| `pnpm db:seed` | Popula o banco com os 96 produtos de `prisma/seed-data.ts` + árvore de categorias gendered |

---

## Estrutura do projeto

```
.
├── dev.db                   # SQLite local (gitignored, criado pelo pnpm db:push)
├── prisma/
│   ├── schema.prisma        # Product + lookups (Brand, Category c/ parentId+displayName, Condition, Size) + junções
│   ├── seed-data.ts         # 96 produtos + GENDERED_CATEGORY_TREE (raízes + ramos -m/-f)
│   └── seed.ts              # insere seed-data via Prisma; resolve breadcrumbs → slugs gendered
├── public/
│   └── upload/<sku>/        # imagens de produto (96 pastas, 412 arquivos)
└── src/
    ├── components/
    │   ├── Layout/          # Header e wrappers de página
    │   │   └── Header/      # Logo, SearchBar (busca fuzzy), FilterButton (badge + store), CartButton, LoginButton
    │   ├── PLP/             # fractal: PLP.tsx + ProductGrid/ProductCard, FilterSheet/CategoryTree+FilterSection, SortSelect, PLPHeader, PLPPagination, EmptyState, ProductGridSkeleton, ProductsJsonLd, hooks/
    │   ├── PDP/             # fractal: PDP.tsx + PDPBreadcrumb, PDPGallery, PDPInfo/PDPSizes, PDPSkeleton, ProductJsonLd, hooks/
    │   └── ui/              # shadcn/ui (button, input, badge, sheet, separator, card, select, checkbox, pagination, skeleton, breadcrumb, tooltip)
    ├── hooks/               # hooks compartilhados entre features (ex.: use-filter-sheet)
    ├── integrations/
    │   ├── better-auth/     # Provider e helpers de autenticação
    │   └── tanstack-query/  # Root provider + devtools do Query
    ├── lib/
    │   ├── format/          # formatadores (BRL)
    │   ├── products/        # search-params (+ testes), seo (title/description/canonical)
    │   ├── utils.ts         # cn (clsx + tailwind-merge)
    │   └── auth-client.ts   # client do Better Auth
    ├── server/
    │   └── products.ts      # server functions (createServerFn): listProducts, listFilterFacets, getProductBySlug
    ├── routes/
    │   ├── __root.tsx       # shell HTML, TooltipProvider, devtools
    │   ├── _layout/         # grupo com Header
    │   │   ├── route.tsx    # <Header /> + <Outlet />
    │   │   ├── index.tsx    # rota / (PLP) — validateSearch, loader, head (SEO)
    │   │   └── produto.$slug.tsx  # rota /produto/<slug> (PDP) — loader + head + notFound
    │   └── api/             # route handlers (ex.: /api/auth/$)
    ├── generated/prisma/    # Prisma Client (gerado, não comitado; `postinstall` cria)
    ├── router.tsx           # TanStack Router: SSR Query + parseSearch/stringifySearch (URL com chaves repetidas)
    ├── db.ts                # instância singleton do Prisma
    └── styles.css           # Tailwind v4 + tokens do design system
```

### Convenções

- **Alias `#/`** aponta para `src/` (configurado em `tsconfig.json` e `package.json`). Imports ficam `import { Button } from "#/components/ui/button"`.
- **Componentes em pastas próprias** com `index.ts` de re-export — facilita mover/renomear sem quebrar *imports*.
- **File-based routing**: o arquivo da rota define a URL. Grupos de layout usam prefixo `_` (ex.: `_layout`).

---

## Escopo mínimo (checklist)

Mapeamento direto dos requisitos do PDF do desafio para o status atual da implementação.

### Página principal — Listagem (PLP)
- [x] Exibição em grade de produtos (`ProductGrid` responsivo 2→3→4 colunas)
- [x] Filtros por categoria e marca (categoria como árvore tri-state + marca + condição em checkboxes no `FilterSheet`)
- [x] Ordenação por preço e nome (`SortSelect` dentro do sheet, 5 chaves: relevância, preço asc/desc, nome A→Z / Z→A)

### Página interna — Detalhes (PDP)
- [x] Visualização expandida do item (rota `/produto/$slug` com SSR loader, `<PDP>` composto por `PDPBreadcrumb` + `PDPGallery` + `PDPInfo`)
- [x] Informações técnicas completas (marca, nome, SKU, condição, preço em destaque, descrição preservando `\n`, grid de tamanhos com indicador de disponibilidade)
- [x] Galeria de imagens do produto (`PDPGallery` com imagem principal + thumbnails laterais no desktop / abaixo no mobile, navegação por teclado `←`/`→`, primeira imagem `eager` + `fetchPriority="high"`)

### Navegação / Fluxo do usuário
- [x] Layout base com Header fixo e responsivo
- [ ] Transição suave entre páginas
- [x] Persistência de estado básica (filtros, busca, ordenação e paginação vivem 100% em search params — sobrevivem a refresh, back/forward e são compartilháveis via URL)
- [x] Botão de retorno e breadcrumbs (`PDPBreadcrumb` com hierarquia canônica vinda de `Category.parentId` — primeiro item volta ao Catálogo, intermediários linkam pra PLP pré-filtrada por aquela categoria)

### Feedback / Estados de interface
- [x] Skeleton screens na PLP (`ProductGridSkeleton` renderiza enquanto o cache do React Query está vazio; em transições de filtro usa `opacity-70`)
- [x] Feedback visual em interações (tokens `hover:`, `focus-visible:`, `data-[state=…]` vindos dos componentes shadcn/Radix em toda UI)
- [x] Estados de erro e vazio (`EmptyState` com CTA "Limpar filtros" quando a combinação retorna 0)

### Estrutura de dados
- [x] Identificação: nome + `Brand` (lookup compartilhado — 6 marcas fictícias referenciadas por `brandId`)
- [x] Comercial: preço em `Int` (centavos BRL, evita arredondamento de float) + `Condition` (lookup com `Novo` / `Usado` / `Excelente estado`)
- [x] Especificações: `Size` (lookup — 24 tamanhos distintos) via junção `ProductSize` com `available`, e `Category` com **hierarquia canônica** via `parentId` self-relation + `displayName` gendered (ex.: "Acessórios Masculinos" / "Acessórios Femininos") via junção `ProductCategory` ordenada
- [x] Visual: imagens (relação `ProductImage` com `path` e `position`, servidas de `public/upload/<sku>/`)

> Campos `[x]` já estão implementados; `[ ]` estão planejados. Esta seção é mantida **viva**: veja a skill [`update-readme`](.claude/skills/update-readme/SKILL.md).

---

## Extras

Itens entregues **além** do escopo mínimo:

- **Seed real de catálogo**: 96 produtos hardcoded em [`prisma/seed-data.ts`](prisma/seed-data.ts) (tipados via `SeedProduct`), com 412 imagens reais servidas estaticamente de `public/upload/<sku>/`. Condição de cada produto é atribuída deterministicamente por hash FNV-1a do SKU — distribuição estável entre execuções.
- **Hierarquia canônica de categorias no banco**: `Category.parentId` + `displayName` seedados a partir de `GENDERED_CATEGORY_TREE`. Categorias aparecem duplicadas por gênero (`acessorios-m`/`acessorios-f`, `blusas-m`/`blusas-f`…) para que "Acessórios sob Moda Masculina" seja distinto de "Acessórios sob Moda Feminina". Produtos unissex são tagueados nas duas árvores automaticamente pelo `resolveProductCategories` do seed.
- **Server functions tipadas**: [`src/server/products.ts`](src/server/products.ts) expõe `listProducts` e `listFilterFacets` via `createServerFn` do TanStack Start. Input validado por `validateProductSearch`, chamadas do loader (SSR) e do cliente (`useQuery`) compartilham o mesmo cache key.
- **Filtros com contagem contextual**: o sheet recalcula a contagem de cada opção excluindo o próprio facet no `where` (padrão de faceted search). Árvore de categoria adota tri-state (checkbox indeterminado) e **compacta a URL** quando todas as folhas de um ramo estão selecionadas — com checagem anti-widening (`sumLeafCounts >= node.count`) para não transformar "Esporte" em "todos os Chapéus".
- **Busca fuzzy por tokens** na `SearchBar`: debounce 300ms + tokenização em AND-contains sobre `name`/`description` (tolera ordem de palavras e strings parciais).
- **URL como fonte de verdade**: `parseSearch`/`stringifySearch` custom no TanStack Router emitem chaves repetidas (`?categoria=a&categoria=b`) em vez de JSON — URLs curtas, compartilháveis, indexáveis.
- **SEO dinâmico por combinação de filtros**: `<title>`, `<meta name="description">`, canonical e OpenGraph derivam do search; **JSON-LD `ItemList`** (schema.org) é renderizado inline no SSR com `Product`/`Offer`/`Brand` por item.
- **SEO da PDP**: `<title>` e `description` específicos por produto, OpenGraph `og:type=product` com primeira imagem absoluta + `og:image`/`twitter:image`, canonical estável por slug, e **JSON-LD `Product`** inline com `brand`/`image[]`/`offers`/`itemCondition` — rich-results-ready.
- **Prefetch on intent**: `ProductCard` usa `<Link>` tipado do TanStack Router; com `defaultPreload: "intent"` já configurado, passar o mouse num card já faz prefetch do loader da PDP, eliminando waterfall no clique.
- **SSR com hidratação**: o HTML inicial é renderizado no servidor (TanStack Start + Nitro), melhorando LCP e SEO — crítico para e-commerce.
- **Imagens performáticas**: `loading="lazy"` em todos os cards + `fetchPriority="high"` + `loading="eager"` nos 4 primeiros (acima da dobra), `width`/`height` explícitos para CLS zero, `sizes` responsivo.
- **Testes automatizados**: 45 testes Vitest cobrindo `validateProductSearch`, `normalizeSearchKey`, `toggleFacet`, `clearFilters`, `countActiveFilters` + helpers puros do `CategoryTree` (collectLeafSlugs, simplifyTree, expandToLeaves, compactSelection, subtreeState).
- **Organização fractal**: componentes filhos moram dentro da pasta do pai (ex.: `PLP/FilterSheet/CategoryTree/`), cada um com seu `index.ts` barrel. TSDoc em toda função/prop pública.
- **Acessibilidade de base**: `aria-label` em botões de ícone, `role="searchbox"` na busca, `aria-live="polite"` no contador de resultados, `aria-current="page"` na paginação, tri-state com `checked="indeterminate"` via Radix.
- **Devtools integradas**: TanStack Router Devtools + Query Devtools em um único painel, facilitando debug de cache e navegação.
- **Biome unificado**: lint e format em um só pipeline, com `pnpm check` como gate único.
- **Fundação preparada para autenticação e persistência**: Better Auth + Prisma já plugados, permitindo evoluir para lista de desejos / histórico sem reformar a base.

---

## Proposta de arquitetura (backend / API)

> Seção opcional do desafio. Descreve como o backend seria estruturado para alimentar esta interface.

### Server functions (RPC) — **implementado**

Em vez de route handlers REST, o backend usa server functions do TanStack Start ([`src/server/products.ts`](src/server/products.ts)) — a mesma função é chamada pelo `loader` no SSR e por `useQuery` no cliente, compartilhando o cache do TanStack Query.

```ts
listProducts({ data: search })        // PLP — paginado + filtros + ordenação
listFilterFacets({ data: search })    // facets com contagens contextuais
getProductBySlug({ data: slug })      // PDP — detalhes + breadcrumb via Category.parentId
```

**Exemplo de URL da PLP:**
`/?q=bolsa&categoria=acessorios-f&marca=kairo&condicao=novo&ordem=preco-asc&pagina=2`

As chaves repetidas (`?categoria=a&categoria=b`) são serializadas pelo `stringifySearch` custom do router, não JSON — mantendo URLs curtas e indexáveis.

### Modelo de dados (Prisma) — implementado

Definido em [`prisma/schema.prisma`](prisma/schema.prisma):

```prisma
model Product {
  id          Int               @id @default(autoincrement())
  sku         String            @unique
  slug        String            @unique
  name        String
  description String
  brandId     Int
  brand       Brand             @relation(fields: [brandId], references: [id])
  price       Int               // centavos BRL (ex.: 15999 = R$ 159,99)
  currency    String            @default("BRL")
  conditionId Int
  condition   Condition         @relation(fields: [conditionId], references: [id])
  categories  ProductCategory[] // junção ordenada — ex. breadcrumb: Moda Masculina > Roupas > Blusas
  images      ProductImage[]
  sizes       ProductSize[]     // junção com `available` por tamanho
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  @@index([brandId])
  @@index([conditionId])
}

model Brand           { id, name @unique, slug @unique }                              // 6 linhas: "Vértice Moda" / "vertice-moda" etc.
model Category        { id, name, displayName?, slug @unique, parentId?, parent, children, @@index([parentId]) }  // ~32 linhas (raízes gendered + ramos -m/-f); `parentId` self-relation canônica, `displayName` humanizado ("Acessórios Femininos")
model Condition       { id, name @unique, slug @unique }                              // 3 linhas: "Novo" / "novo", "Usado" / "usado", "Excelente estado" / "excelente-estado"
model Size            { id, name @unique, slug @unique }                              // 24 linhas: "P" / "p", "M" / "m", "37" / "37", "Unico" / "unico"...
model ProductCategory { productId, categoryId, position, @@unique([productId, categoryId]) }  // itens ordenados do breadcrumb (N por produto)
model ProductSize     { productId, sizeId, available,   @@unique([productId, sizeId]) }       // tamanhos disponíveis por produto
model ProductImage    { productId, path, position }
```

### Decisões de arquitetura

- **Slug globalmente único**: `/produto/<slug>` é amigável para SEO e usuário — `slug @unique` garante que cada produto tem URL determinística, sem precisar compor com categoria.
- **Preço em `Int` centavos**: evita arredondamento de ponto-flutuante em qualquer camada (cálculo de total, frete, desconto, serialização JSON). Formatação de apresentação acontece na borda (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)`).
- **Quatro lookups + duas junções** (`Brand`/`Category`/`Condition`/`Size` + `ProductCategory`/`ProductSize`): valores que se repetem entre produtos viram tabelas referenciadas por FK; tabelas de junção guardam só o que é específico da relação (`position` no breadcrumb, `available` por tamanho). Ganhos imediatos: renomear "Roupas" → "Roupa" é `UPDATE` de uma linha em vez de ~100; filtros viram JOIN numérico indexado (mais rápido que `LIKE` em string); cada lookup pode ganhar atributos (`Brand.logo`, `Category.parentId`, `Size.displayOrder`) sem tocar nas junções.
- **Hierarquia canônica de categorias**: `Category.parentId` self-relation define a árvore em DB (não mais inferida de `ProductCategory.position`). Ramos são **duplicados por gênero** (slugs `-m` / `-f`) para que "Blusas sob Moda Masculina" seja uma linha distinta de "Blusas sob Moda Feminina" — necessário porque filtros são OR por slug, e não queríamos misturar gêneros. `displayName` armazena a forma humanizada com concordância em português ("Acessórios Femininos"), usada em heading e chips fora da árvore de filtros.
- **`slug` URL-safe em todo lookup**: destrava filtros por query-string estáveis, não dependentes de `name` com acentos/espaços. Exemplo prático — `/produtos?marca=kairo&condicao=novo&categoria=roupas&tamanho=m` vira:
  ```ts
  prisma.product.findMany({
    where: {
      brand:      { slug: 'kairo' },
      condition:  { slug: 'novo' },
      categories: { some: { category: { slug: 'roupas' } } },
      sizes:      { some: { size: { slug: 'm' }, available: true } },
    },
  })
  ```
  Slugs de `Brand`/`Condition` são hardcoded em [seed-data.ts](prisma/seed-data.ts) (tuplas `{ name, slug }` com `as const`); slugs de `Category`/`Size` são derivados pelo helper `slugify` em seed-time (NFD + strip diacríticos + kebab-case) — evita duplicar 19 categorias × 24 tamanhos no arquivo. O slug também faz dedup: `"Unico"` e `"Único"` colapsam na mesma linha de `Size` (slug `unico`).
- **`ProductSize` carrega `available`**: tamanho é dimensão compartilhada, mas a disponibilidade é por produto — permite marcar G indisponível em um SKU sem remover o tamanho.
- **`ProductImage` ordenada**: `position` garante a ordem determinística da galeria; `path` aponta para `/upload/<sku>/image-NN.jpg` servido estaticamente.
- **Índices**: todas as FKs (`brandId`, `conditionId`, `categoryId`, `sizeId`, `productId`) + os slugs únicos dos lookups — cobre filtros da PLP sem varredura de tabela.
- **SQLite agora, Postgres depois**: o adapter `@prisma/adapter-libsql` desacopla o Prisma do engine. Trocar para Postgres em produção exige apenas ajustar `provider` no schema e o `DATABASE_URL`.
- **Cache em camadas (evolução)**: CDN (imagens) → Redis (listas, filtros) → Postgres (fonte de verdade). TanStack Query fecha o loop no cliente.
- **Edge-ready (evolução)**: TanStack Start roda em Cloudflare Workers / Vercel Edge — `loader` da PLP pode rodar próximo ao usuário com cache compartilhado.

### Evoluções planejadas do modelo

- **Estoque real** em `ProductSize.stock: Int` em vez do booleano `available`.
- **Atributos por lookup**: com `Brand`/`Category`/`Condition`/`Size` já como tabelas, evoluir para `Brand.logoPath`, `Condition.badgeColor` ou `Size.displayOrder` vira adição de coluna — sem migração de dados.
- **Transições entre rotas**: habilitar `viewTransition` do TanStack Router na PLP↔PDP para cross-fade do card.

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
