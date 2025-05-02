import Fastify, { FastifyInstance } from 'fastify';
import postgres from '@fastify/postgres';
import autoload from '@fastify/autoload';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config();

// Initialize Fastify with TypeBox
const fastify: FastifyInstance = Fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

// Register PostgreSQL plugin
fastify.register(postgres, {
  connectionString: process.env.DATABASE_URL,
});

// Add health check route
fastify.get('/health', async (_request, reply) => {
  return { status: 'ok' };
});

// Register autoload for plugins
fastify.register(autoload, {
  dir: join(__dirname, '../dist/routes'),
  options: { prefix: '/api' },
  ignorePattern: /.*\.ts$/,
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: parseInt(process.env.PORT || '3000'), host: '0.0.0.0' });
    fastify.log.info(`Server running on http://0.0.0.0:${process.env.PORT || '3000'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();