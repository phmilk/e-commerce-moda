import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client.js'
import {
  BRANDS,
  CONDITIONS,
  GENDERED_CATEGORY_TREE,
  products,
  type SeedProduct,
  slugify,
} from './seed-data.js'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

/** Gender inferred from a product's breadcrumb. */
type Gender = 'masculine' | 'feminine' | 'unisex'

/** Suffix appended to category slugs to disambiguate duplicated branches. */
const SUFFIX = { masculine: '-m', feminine: '-f' } as const

/**
 * Walks the gendered-category tree and returns every slug that exists,
 * so the seeder can detect drift between the breadcrumbs in
 * `seed-data.ts` and the canonical tree.
 */
function buildKnownSlugSet(): Set<string> {
  return new Set(GENDERED_CATEGORY_TREE.map((c) => c.slug))
}

/**
 * Detects whether a product is masculine, feminine, or unisex from its
 * breadcrumb. Unisex = the breadcrumb contains BOTH root names, which
 * was the signal used by the bugged seed rows (e.g.
 * ["Moda Masculina","Roupas","Calças","Moda Feminina","Calçados","Rasteirinhas"]).
 */
function detectGender(product: SeedProduct): Gender {
  const hasMasculine = product.categories.includes('Moda Masculina')
  const hasFeminine = product.categories.includes('Moda Feminina')
  if (hasMasculine && hasFeminine) return 'unisex'
  if (hasMasculine) return 'masculine'
  if (hasFeminine) return 'feminine'
  throw new Error(
    `Product ${product.slug} has no gender root in its categories breadcrumb`,
  )
}

/**
 * Maps a display name ("Blusas") + gender to the canonical slug
 * ("blusas-m" / "blusas-f"). Root names ("Moda Masculina" /
 * "Moda Feminina") are the exception — they never take a suffix.
 */
function nameToGenderedSlug(
  name: string,
  gender: 'masculine' | 'feminine',
): string {
  if (name === 'Moda Masculina') return 'moda-masculina'
  if (name === 'Moda Feminina') return 'moda-feminina'
  return `${slugify(name)}${SUFFIX[gender]}`
}

/**
 * Resolves a product's breadcrumb into the list of {@link GENDERED_CATEGORY_TREE}
 * slugs it should be tagged with. Unisex products are tagged **in both**
 * trees so they show up regardless of which gender the user filters by.
 *
 * The breadcrumb's original order is preserved to feed
 * `ProductCategory.position`. Slugs are deduplicated in case the
 * breadcrumb repeats a name.
 */
function resolveProductCategories(
  product: SeedProduct,
  known: Set<string>,
): string[] {
  const gender = detectGender(product)

  /**
   * For a single-gender product: strip root mentions of the opposite
   * gender (shouldn't happen, but defensive) and map each name.
   * For unisex: every non-root name is emitted twice (once per gender).
   */
  const out: string[] = []
  const push = (slug: string) => {
    if (!out.includes(slug)) out.push(slug)
  }

  if (gender === 'unisex') {
    // Emit both root slugs first.
    push('moda-masculina')
    push('moda-feminina')
    for (const name of product.categories) {
      if (name === 'Moda Masculina' || name === 'Moda Feminina') continue
      push(nameToGenderedSlug(name, 'masculine'))
      push(nameToGenderedSlug(name, 'feminine'))
    }
  } else {
    for (const name of product.categories) {
      // Skip a cross-gender root if it leaked into the breadcrumb.
      if (gender === 'masculine' && name === 'Moda Feminina') continue
      if (gender === 'feminine' && name === 'Moda Masculina') continue
      push(nameToGenderedSlug(name, gender))
    }
  }

  for (const slug of out) {
    if (!known.has(slug)) {
      throw new Error(
        `Product ${product.slug} references unknown category slug "${slug}". ` +
          `Add it to GENDERED_CATEGORY_TREE in seed-data.ts.`,
      )
    }
  }

  return out
}

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.productImage.deleteMany()
  await prisma.productSize.deleteMany()
  await prisma.productCategory.deleteMany()
  await prisma.product.deleteMany()
  await prisma.brand.deleteMany()
  // Children must be cleared before parents due to the self-relation FK.
  await prisma.category.deleteMany({ where: { parentId: { not: null } } })
  await prisma.category.deleteMany()
  await prisma.condition.deleteMany()
  await prisma.size.deleteMany()

  const brandIds = new Map<string, number>()
  for (const { name, slug } of BRANDS) {
    const row = await prisma.brand.create({ data: { name, slug } })
    brandIds.set(name, row.id)
  }

  const conditionIds = new Map<string, number>()
  for (const { name, slug } of CONDITIONS) {
    const row = await prisma.condition.create({ data: { name, slug } })
    conditionIds.set(name, row.id)
  }

  // ------------------------------------------------------------------
  // Categories: two passes over GENDERED_CATEGORY_TREE so every parent
  // row exists before its children try to reference it via parentId.
  // ------------------------------------------------------------------
  const categoryIdBySlug = new Map<string, number>()
  for (const cat of GENDERED_CATEGORY_TREE) {
    const row = await prisma.category.create({
      data: {
        name: cat.name,
        displayName: cat.displayName,
        slug: cat.slug,
      },
    })
    categoryIdBySlug.set(cat.slug, row.id)
  }
  for (const cat of GENDERED_CATEGORY_TREE) {
    if (!('parent' in cat) || !cat.parent) continue
    const parentId = categoryIdBySlug.get(cat.parent)
    if (!parentId) {
      throw new Error(
        `Category "${cat.slug}" references missing parent "${cat.parent}"`,
      )
    }
    await prisma.category.update({
      where: { slug: cat.slug },
      data: { parentId },
    })
  }

  const sizeIds = new Map<string, number>()
  for (const product of products) {
    for (const { size } of product.sizes) {
      const slug = slugify(size)
      if (!sizeIds.has(slug)) {
        const row = await prisma.size.create({ data: { name: size, slug } })
        sizeIds.set(slug, row.id)
      }
    }
  }

  const knownCategorySlugs = buildKnownSlugSet()

  for (const product of products) {
    const resolvedCategorySlugs = resolveProductCategories(
      product,
      knownCategorySlugs,
    )

    const seenCategoryIds = new Set<number>()
    const productCategories = resolvedCategorySlugs.flatMap((slug, position) => {
      const categoryId = categoryIdBySlug.get(slug)!
      if (seenCategoryIds.has(categoryId)) return []
      seenCategoryIds.add(categoryId)
      return [{ categoryId, position }]
    })

    const seenSizeIds = new Set<number>()
    const productSizes = product.sizes.flatMap(({ size, available }) => {
      const sizeId = sizeIds.get(slugify(size))!
      if (seenSizeIds.has(sizeId)) return []
      seenSizeIds.add(sizeId)
      return [{ sizeId, available }]
    })

    await prisma.product.create({
      data: {
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        description: product.description,
        brandId: brandIds.get(product.brand)!,
        price: product.price,
        currency: product.currency,
        conditionId: conditionIds.get(product.condition)!,
        categories: { create: productCategories },
        images: {
          create: product.images.map((path, position) => ({ path, position })),
        },
        sizes: { create: productSizes },
      },
    })

    console.log(
      `  ✅ ${product.slug} (sku=${product.sku}) — ${product.images.length} imagens`,
    )
  }

  console.log(`✅ ${products.length} produtos criados`)
}

main()
  .catch((error) => {
    console.error('❌ Erro ao rodar o seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
