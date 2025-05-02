"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const postgres_1 = __importDefault(require("@fastify/postgres"));
const autoload_1 = __importDefault(require("@fastify/autoload"));
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
// Load environment variables
dotenv.config();
// Initialize Fastify with TypeBox
const fastify = (0, fastify_1.default)({
    logger: true,
}).withTypeProvider();
// Register PostgreSQL plugin
fastify.register(postgres_1.default, {
    connectionString: process.env.DATABASE_URL,
});
// Add health check route
fastify.get('/health', async (_request, reply) => {
    return { status: 'ok' };
});
// Register autoload for plugins
fastify.register(autoload_1.default, {
    dir: (0, path_1.join)(__dirname, '../dist/routes'),
    options: { prefix: '/api' },
    ignorePattern: /.*\.ts$/,
});
// Start server
const start = async () => {
    try {
        await fastify.listen({ port: parseInt(process.env.PORT || '3000'), host: '0.0.0.0' });
        fastify.log.info(`Server running on http://0.0.0.0:${process.env.PORT || '3000'}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
