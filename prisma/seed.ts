import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { products } from './seed-data.js'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.productImage.deleteMany()
  await prisma.productSize.deleteMany()
  await prisma.product.deleteMany()

  for (const product of products) {
    await prisma.product.create({
      data: {
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        description: product.description,
        brand: product.brand,
        price: product.price,
        currency: product.currency,
        category: product.category,
        categories: product.categories,
        images: {
          create: product.images.map((path, position) => ({ path, position })),
        },
        sizes: {
          create: product.sizes.map(({ size, available }) => ({
            size,
            available,
          })),
        },
      },
    })

    console.log(
      `  ✅ ${product.category}/${product.slug} (sku=${product.sku}) — ${product.images.length} imagens`,
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
