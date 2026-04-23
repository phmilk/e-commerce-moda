---
name: update-readme
description: Revisa o estado atual do projeto e-commerce-moda e atualiza o README.md para refletir o que foi implementado. Use quando o usuário pedir para "atualizar o readme", "revisar o readme", "sincronizar o readme com o código" ou após uma rodada significativa de desenvolvimento (novas rotas, novos componentes, novas dependências, novos scripts).
---

# update-readme

Mantém o `README.md` do e-commerce-moda fiel ao estado real do código. O README é estruturado contra o **escopo mínimo do desafio técnico** (PDF na raiz do repo) e precisa ser atualizado à medida que features são entregues.

## Quando usar

- Usuário pediu explicitamente para atualizar/revisar/sincronizar o README.
- Após merge de feature que altere rotas, componentes de alto nível, dependências ou scripts.
- Antes de uma entrega/PR para o avaliador do desafio.

## O que NÃO fazer

- **Não inventar** features. Se algo não existe no código, não marque como `[x]`.
- **Não remover** seções estruturais (Stack, Escopo, Extras, Arquitetura) — só atualizar o conteúdo.
- **Não traduzir** o README para outro idioma — o desafio é em português.
- **Não adicionar** emojis salvo se o usuário pedir.

## Procedimento

### 1. Ler os pontos de verdade

Antes de editar qualquer coisa, leia em paralelo:

- `README.md` — estado atual
- `package.json` — dependências, scripts, versões
- `src/routeTree.gen.ts` — lista de rotas geradas pelo TanStack Router (fonte da verdade de rotas)
- `prisma/schema.prisma` — modelos de dados reais
- `vite.config.ts`, `biome.json`, `components.json`, `tsconfig.json` — configs

Depois, use `Glob` para mapear:

- `src/routes/**/*.{ts,tsx}` — rotas
- `src/components/**/*.{ts,tsx}` — componentes
- `src/lib/**/*.ts`, `src/integrations/**/*.ts` — utilitários e integrações

### 2. Verificar cada item do checklist de escopo mínimo

Para cada item do checklist (seção "Escopo mínimo"), cruze com o código:

| Item do desafio | Onde procurar | Marcar `[x]` se |
| --- | --- | --- |
| Grade de produtos (PLP) | rota `/` ou `/produtos`, componente de card | existe rota que renderiza grade baseada em dados (mesmo mockados) |
| Filtros por categoria e marca | componentes + search params do router | filtros estão **conectados** a state/URL — não apenas UI |
| Ordenação por preço e nome | idem filtros | ordenação afeta a listagem, não só o dropdown |
| Visualização expandida (PDP) | rota `/produto/$slug` ou similar | página de detalhe renderiza dados de um produto |
| Informações técnicas | componente da PDP | exibe marca, condição, tamanho, categoria |
| Galeria de imagens | componente de galeria | múltiplas imagens navegáveis |
| Transição suave | CSS/motion, `viewTransition` do Router | de fato há transição, não default |
| Persistência de estado | search params, localStorage, cookie | filtros/busca sobrevivem a refresh ou navegação |
| Botão de retorno e breadcrumbs | componente de breadcrumb | existe e é usado na PDP |
| Skeleton screens | componentes `*Skeleton`, uso em `pendingComponent` | implementados nas rotas que carregam dados |
| Feedback visual | estados `hover:`, `focus-visible:`, `active:` | consistente nos interativos |

**Regra**: se o item **parece** pronto mas não está visivelmente no código, marque `[ ]` e pergunte ao usuário antes de mudar.

### 3. Recalcular a seção "Extras"

Extras = tudo que não é escopo mínimo mas foi feito. Exemplos de candidatos a listar (só liste se **de fato** existe):

- SSR, *prefetch* em intent, hidratação parcial
- Acessibilidade além do básico (roles, `aria-*`, skip-links, leitura de tela testada)
- Testes automatizados (contar arquivos `*.test.{ts,tsx}`)
- Dark mode, i18n, analytics
- Otimizações de imagem (LQIP, responsive `srcset`)
- Otimistic UI no carrinho
- PWA / offline

Se um item migrar de "Extra" para escopo mínimo ao ser oficializado, mova a linha — não duplique.

### 4. Atualizar a tabela de stack

- Se **nova dependência** apareceu no `package.json`: adicionar linha na tabela com **justificativa curta** (1 frase de vantagem).
- Se **dependência saiu**: remover linha.
- Se **versão major mudou** (ex.: Tailwind 4 → 5): atualizar nome.

### 5. Atualizar a estrutura de pastas

A árvore na seção "Estrutura do projeto" deve refletir `src/` real. Foque no nível 2–3; não liste cada arquivo. Se surgiu uma pasta top-level nova em `src/` (ex.: `hooks/`, `features/`), adicione.

### 6. Atualizar scripts disponíveis

Compare a tabela de scripts com `package.json`. Adicione novos, remova removidos.

### 7. Checagem final

Antes de salvar:

- Rode `pnpm check` mentalmente: links internos (`#sumário`) batem com os headings?
- O checklist reflete a verdade? Se houver dúvida, pergunte ao usuário.
- A seção "Proposta de arquitetura" ainda faz sentido? Se o backend real divergiu, atualize.
- Não há seção órfã (ex.: "Setup do Banco" sem o banco ser usado).

### 8. Reportar ao usuário

Ao terminar, liste em no máximo 5 bullets:

- Itens do checklist mudados (de `[ ]` para `[x]` ou vice-versa)
- Linhas adicionadas/removidas da tabela de stack
- Nova seção criada ou removida
- Qualquer dúvida que ficou (para o usuário confirmar)

Seja conciso. O usuário quer saber **o que mudou** — não como você chegou lá.
