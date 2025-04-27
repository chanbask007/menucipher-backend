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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = __importStar(require("bcrypt"));
// Register the plugin
const clientsPlugin = (fastify) => __awaiter(void 0, void 0, void 0, function* () {
    // GET / - Fetch all clients
    fastify.get('/', (_request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { rows } = yield fastify.pg.query('SELECT * FROM clients');
            return rows;
        }
        catch (err) {
            return reply.code(500).send({ error: 'Database Error' });
        }
    }));
    // GET /:id - Fetch client and menu items by client_id
    fastify.get('/:id', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = request.params;
        try {
            const clientResult = yield fastify.pg.query('SELECT * FROM clients WHERE client_id = $1', [id]);
            if (clientResult.rows.length === 0) {
                return reply.code(404).send({ error: 'Client Not Found' });
            }
            const client = clientResult.rows[0];
            const menuItemsResult = yield fastify.pg.query('SELECT * FROM menu_items WHERE client_id = $1', [id]);
            return { client, menuItems: menuItemsResult.rows };
        }
        catch (err) {
            return reply.code(500).send({ error: 'Database Error' });
        }
    }));
    // POST / - Create a new client
    fastify.post('/', (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { client_id, name, theme, created_at, address, open_at, closed_at, currency, email, password_hash, } = request.body;
            const hashedPassword = yield bcrypt.hash(password_hash, 10);
            const query = `
        INSERT INTO clients (client_id, name, theme, created_at, address, open_at, closed_at, currency, email, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING client_id
      `;
            const values = [
                client_id,
                name,
                theme,
                created_at,
                address,
                open_at,
                closed_at,
                currency,
                email,
                hashedPassword,
            ];
            const result = yield fastify.pg.query(query, values);
            return reply.status(201).send({
                message: 'Client created successfully',
                client_id: result.rows[0].client_id,
            });
        }
        catch (error) {
            return reply.status(500).send({ error: 'Failed to create client' });
        }
    }));
});
exports.default = clientsPlugin;
