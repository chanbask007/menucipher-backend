import Fastify from 'fastify'
import postgres from '@fastify/postgres'
import autoload from '@fastify/autoload'
import dotenv from 'dotenv'
import { join } from 'path'

dotenv.config()

const server = Fastify({ logger: true })

server.register(postgres, { connectionString: process.env.DATABASE_URL })
server.register(autoload, { dir: join(__dirname, 'routes'), options: { prefix: '/api' } })

server.listen({ port: +(process.env.PORT || 3000), host: '0.0.0.0' })
  .then(() => server.log.info(`Server running 🚀 http://0.0.0.0:${process.env.PORT || '3000'}`))
  .catch(err => {
    server.log.error(err)
    process.exit(1)
  })
