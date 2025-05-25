"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("@fastify/cors"));
const postgres_1 = __importDefault(require("@fastify/postgres"));
const clients_1 = __importDefault(require("./routes/clients"));
const auth_1 = __importDefault(require("./routes/auth"));
const categories_1 = __importDefault(require("./routes/categories"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const menu_items_1 = __importDefault(require("./routes/menu-items"));
const restaurant_1 = __importDefault(require("./routes/restaurant"));
dotenv_1.default.config();
const fastify = (0, fastify_1.default)({ logger: true });
// Enable CORS
fastify.register(cors_1.default, {
    origin: true, // Allow requests from the frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow these HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
    credentials: true, // Allow cookies or auth headers if needed
});
fastify.register(postgres_1.default, {
    connectionString: process.env.DATABASE_URL
});
// Health check route
fastify.get('/health', async (request, reply) => {
    return { status: 'ok' };
});
fastify.register(clients_1.default, { prefix: '/api/clients' });
// Register routes
fastify.register(auth_1.default, { prefix: '/api/auth' });
//fastify.register(clientsPlugin, { prefix: '/api/clients' });
fastify.register(categories_1.default, { prefix: '/api/categories' });
fastify.register(dashboard_1.default, { prefix: '/api/dashboard' });
fastify.register(menu_items_1.default, { prefix: '/api/menu-items' });
fastify.register(restaurant_1.default, { prefix: '/api/restaurant' });
const start = async () => {
    try {
        await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
        console.log(`Server running on port ${process.env.PORT || 3000}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
