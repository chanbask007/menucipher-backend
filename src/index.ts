import Fastify from 'fastify'
import dotenv from 'dotenv'
import fastifyPostgres from '@fastify/postgres'
import clientsPlugin from './routes/clients'

dotenv.config()

const fastify = Fastify({ logger: true })

fastify.register(fastifyPostgres, {
  connectionString: process.env.DATABASE_URL
})

// Health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' }
})

fastify.register(clientsPlugin, { prefix: '/api/clients' })

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' })
    console.log(`Server running on http://localhost:${process.env.PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
