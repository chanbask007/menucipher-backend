import Fastify from 'fastify'
import dotenv from 'dotenv'
import fastifyPostgres from '@fastify/postgres'
import clientsPlugin from './routes/clients'


import authPlugin from './routes/auth';
import categoriesPlugin from './routes/categories';
import dashboardPlugin from './routes/dashboard';
import menuItemsPlugin from './routes/menu-items';
import restaurantPlugin from './routes/restaurant';

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
// Register routes
fastify.register(authPlugin, { prefix: '/api/auth' });
//fastify.register(clientsPlugin, { prefix: '/api/clients' });
fastify.register(categoriesPlugin, { prefix: '/api/categories' });
fastify.register(dashboardPlugin, { prefix: '/api/dashboard' });
fastify.register(menuItemsPlugin, { prefix: '/api/menu-items' });
fastify.register(restaurantPlugin, { prefix: '/api/restaurant' });




const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' })
    console.log(`Server running on port ${process.env.PORT || 3000}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
