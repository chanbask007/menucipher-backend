"use strict";
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
const clientsPlugin = async (fastify) => {
    const server = fastify.withTypeProvider();
    // Register routes with /clients prefix
    server.register(async (clientRoutes) => {
        // GET /clients - Fetch all clients + their menu items
        clientRoutes.get('/', {
            schema: {
                response: {
                    200: typebox_1.Type.Array(typebox_1.Type.Object({
                        client: Client,
                        menuItems: typebox_1.Type.Array(MenuItem),
                    })),
                    500: typebox_1.Type.Object({ error: typebox_1.Type.String() }),
                },
            },
            async handler(_request, reply) {
                try {
                    const { rows: clientRows } = await clientRoutes.pg.query('SELECT * FROM clients');
                    const clientsWithMenuItems = await Promise.all(clientRows.map(async (client) => {
                        const { rows: menuItems } = await clientRoutes.pg.query('SELECT * FROM menu_items WHERE client_id = $1', [client.client_id]);
                        return { client, menuItems };
                    }));
                    return clientsWithMenuItems;
                }
                catch (error) {
                    clientRoutes.log.error(error);
                    return reply.code(500).send({ error: 'Database error' });
                }
            },
        });
        // GET /clients/:id - Fetch a client and their menu items
        clientRoutes.get('/:id', {
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
            async handler(request, reply) {
                const { id } = request.params;
                try {
                    const { rows: clientRows } = await clientRoutes.pg.query('SELECT * FROM clients WHERE client_id = $1', [id]);
                    if (clientRows.length === 0) {
                        return reply.code(404).send({ error: 'Client not found' });
                    }
                    const client = clientRows[0];
                    const { rows: menuItems } = await clientRoutes.pg.query('SELECT * FROM menu_items WHERE client_id = $1', [id]);
                    return { client, menuItems };
                }
                catch (error) {
                    clientRoutes.log.error(error);
                    return reply.code(500).send({ error: 'Database error while fetching client' });
                }
            },
        });
        // POST /clients - Create a new client and return client + empty menuItems
        clientRoutes.post('/', {
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
            async handler(request, reply) {
                const { name, theme, created_at, address, open_at, closed_at, currency, email, password_hash } = request.body;
                try {
                    const hashedPassword = await bcrypt_1.default.hash(password_hash, 10);
                    const insertQuery = `
            INSERT INTO clients (name, theme, created_at, address, open_at, closed_at, currency, email, password_hash)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING client_id, name, theme, created_at, address, open_at, closed_at, currency, email
          `;
                    const values = [name, theme, created_at, address, open_at, closed_at, currency, email, hashedPassword];
                    const { rows } = await clientRoutes.pg.query(insertQuery, values);
                    const client = rows[0];
                    return reply.status(201).send({
                        client,
                        menuItems: [],
                    });
                }
                catch (error) {
                    clientRoutes.log.error(error);
                    return reply.code(500).send({ error: 'Failed to create client' });
                }
            },
        });
    }, { prefix: '/clients' });
};
exports.default = clientsPlugin;
