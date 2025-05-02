"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const typebox_1 = require("@sinclair/typebox");
// Types
const Client = typebox_1.Type.Object({
    client_id: typebox_1.Type.String(),
    name: typebox_1.Type.String(),
    theme: typebox_1.Type.String(),
    created_at: typebox_1.Type.String({ format: 'date-time' }),
    address: typebox_1.Type.String(),
    open_at: typebox_1.Type.String(),
    closed_at: typebox_1.Type.String(),
    currency: typebox_1.Type.String({ maxLength: 3 }),
    email: typebox_1.Type.String({ format: 'email' }),
    password_hash: typebox_1.Type.String(),
});
const MenuItem = typebox_1.Type.Object({
    id: typebox_1.Type.Number(),
    client_id: typebox_1.Type.String(),
    category: typebox_1.Type.String(),
    name: typebox_1.Type.String(),
    description: typebox_1.Type.String(),
    price: typebox_1.Type.Number(),
    image_url: typebox_1.Type.String(),
    create_at: typebox_1.Type.String({ format: 'date-time' }),
    popular: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    rating: typebox_1.Type.Number(),
});
const PostClientBody = typebox_1.Type.Object({
    name: typebox_1.Type.String(),
    theme: typebox_1.Type.String(),
    created_at: typebox_1.Type.String({ format: 'date-time' }),
    address: typebox_1.Type.String(),
    open_at: typebox_1.Type.String(),
    closed_at: typebox_1.Type.String(),
    currency: typebox_1.Type.String({ maxLength: 3 }),
    email: typebox_1.Type.String({ format: 'email' }),
    password_hash: typebox_1.Type.String(),
});
// Plugin
const clientsPlugin = (fastify) => __awaiter(void 0, void 0, void 0, function* () {
    const server = fastify.withTypeProvider();
    // GET / - Fetch all clients + their menu items
    server.get('/', {
        schema: {
            response: {
                200: typebox_1.Type.Array(typebox_1.Type.Object({
                    client: Client,
                    menuItems: typebox_1.Type.Array(MenuItem),
                })),
                500: typebox_1.Type.Object({ error: typebox_1.Type.String() }),
            },
        },
        handler(_request, reply) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const { rows: clientRows } = yield server.pg.query('SELECT * FROM clients');
                    const clientsWithMenuItems = yield Promise.all(clientRows.map((client) => __awaiter(this, void 0, void 0, function* () {
                        const { rows: menuItems } = yield server.pg.query('SELECT * FROM menu_items WHERE client_id = $1', [client.client_id]);
                        return { client, menuItems };
                    })));
                    return clientsWithMenuItems;
                }
                catch (error) {
                    server.log.error(error);
                    return reply.code(500).send({ error: 'Database error' });
                }
            });
        },
    });
    // GET /:id - Fetch a client and their menu items
    server.get('/:id', {
        schema: {
            params: typebox_1.Type.Object({ id: typebox_1.Type.String() }),
            response: {
                200: typebox_1.Type.Object({
                    client: Client,
                    menuItems: typebox_1.Type.Array(MenuItem),
                }),
                404: typebox_1.Type.Object({ error: typebox_1.Type.String() }),
                500: typebox_1.Type.Object({ error: typebox_1.Type.String() }),
            },
        },
        handler(request, reply) {
            return __awaiter(this, void 0, void 0, function* () {
                const { id } = request.params;
                try {
                    const { rows: clientRows } = yield server.pg.query('SELECT * FROM clients WHERE client_id = $1', [id]);
                    if (clientRows.length === 0) {
                        return reply.code(404).send({ error: 'Client not found' });
                    }
                    const client = clientRows[0];
                    const { rows: menuItems } = yield server.pg.query('SELECT * FROM menu_items WHERE client_id = $1', [id]);
                    return { client, menuItems };
                }
                catch (error) {
                    server.log.error(error);
                    return reply.code(500).send({ error: 'Database error while fetching client' });
                }
            });
        },
    });
    // POST / - Create a new client and return client + empty menuItems
    server.post('/', {
        schema: {
            body: PostClientBody,
            response: {
                201: typebox_1.Type.Object({
                    client: Client,
                    menuItems: typebox_1.Type.Array(MenuItem),
                }),
                500: typebox_1.Type.Object({ error: typebox_1.Type.String() }),
            },
        },
        handler(request, reply) {
            return __awaiter(this, void 0, void 0, function* () {
                const { name, theme, created_at, address, open_at, closed_at, currency, email, password_hash } = request.body;
                try {
                    const hashedPassword = yield bcrypt_1.default.hash(password_hash, 10);
                    const insertQuery = `
          INSERT INTO clients (name, theme, created_at, address, open_at, closed_at, currency, email, password_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING client_id, name, theme, created_at, address, open_at, closed_at, currency, email
        `;
                    const values = [name, theme, created_at, address, open_at, closed_at, currency, email, hashedPassword];
                    const { rows } = yield server.pg.query(insertQuery, values);
                    const client = rows[0];
                    return reply.status(201).send({
                        client,
                        menuItems: [],
                    });
                }
                catch (error) {
                    server.log.error(error);
                    return reply.code(500).send({ error: 'Failed to create client' });
                }
            });
        },
    });
});
exports.default = clientsPlugin;
