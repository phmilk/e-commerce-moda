import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { BRANDS, CONDITIONS, products, slugify } from './seed-data.js'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.productImage.deleteMany()
  await prisma.productSize.deleteMany()
  await prisma.productCategory.deleteMany()
  await prisma.product.deleteMany()
  await prisma.brand.deleteMany()
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

  // Categories and sizes are derived from the seed products (no hardcoded list).
  // Canonicalization is by slug: "Único" and "Unico" both slugify to "unico",
  // so the first name seen for a given slug wins and every variant resolves to it.
  const categoryIds = new Map<string, number>()
  for (const product of products) {
    for (const name of product.categories) {
      const slug = slugify(name)
      if (!categoryIds.has(slug)) {
        const row = await prisma.category.create({ data: { name, slug } })
        categoryIds.set(slug, row.id)
      }
    }
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

  for (const product of products) {
    const seenCategoryIds = new Set<number>()
    const productCategories = product.categories.flatMap((name, position) => {
      const categoryId = categoryIds.get(slugify(name))!
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
