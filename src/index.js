"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const postgres_1 = __importDefault(require("@fastify/postgres"));
const autoload_1 = __importDefault(require("@fastify/autoload"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
dotenv_1.default.config();
const server = (0, fastify_1.default)({ logger: true });
server.register(postgres_1.default, { connectionString: process.env.DATABASE_URL });
server.register(autoload_1.default, { dir: (0, path_1.join)(__dirname, 'routes'), options: { prefix: '/api' } });
server.listen({ port: +(process.env.PORT || 3000), host: '0.0.0.0' })
    .then(() => server.log.info(`Server running 🚀 http://0.0.0.0:${process.env.PORT || '3000'}`))
    .catch(err => {
    server.log.error(err);
    process.exit(1);
});
