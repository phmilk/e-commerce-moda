import { defineConfig, env } from 'prisma/config'

// `env('DATABASE_URL')` é eager — se a variável não existir (ex.: CI
// rodando só `prisma generate` no postinstall, antes de qualquer setup
// de DB), a config falha em carregar. `prisma generate` não precisa da
// URL; consumidores runtime (migrate/seed/studio) sempre passam via
// `dotenv -e .env.local --` ou ambiente CI com DB setado. Por isso
// usamos fallback de placeholder aqui.
const databaseUrl = process.env.DATABASE_URL
  ? env('DATABASE_URL')
  : 'file:./dev.db'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
})
