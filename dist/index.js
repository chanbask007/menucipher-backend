"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const postgres_1 = __importDefault(require("@fastify/postgres"));
const clients_1 = __importDefault(require("./routes/clients"));
dotenv_1.default.config();
const fastify = (0, fastify_1.default)({ logger: true });
fastify.register(postgres_1.default, {
    connectionString: process.env.DATABASE_URL
});
// Health check route
fastify.get('/health', async (request, reply) => {
    return { status: 'ok' };
});
fastify.register(clients_1.default, { prefix: '/api/clients' });
const start = async () => {
    try {
        await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
        console.log(`Server running on http://localhost:${process.env.PORT}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
