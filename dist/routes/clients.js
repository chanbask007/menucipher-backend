"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const clientsPlugin = async (fastify) => {
    // Get all clients
    fastify.get('/', async (_req, reply) => {
        try {
            const { rows } = await fastify.pg.query('SELECT * FROM clients');
            return rows;
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Database error' });
        }
    });
    // Get client by ID + menu items
    fastify.get('/:id', async (req, reply) => {
        const { id } = req.params;
        try {
            const { rows: clientRows } = await fastify.pg.query('SELECT * FROM clients WHERE client_id = $1', [id]);
            if (!clientRows.length)
                return reply.code(404).send({ error: 'Client not found' });
            const { rows: menuItems } = await fastify.pg.query('SELECT * FROM menu_items WHERE client_id = $1', [id]);
            return { client: clientRows[0], menuItems };
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Failed to fetch client' });
        }
    });
    // Create new client
    fastify.post('/', async (req, reply) => {
        const { name, theme, created_at, address, open_at, closed_at, currency, email, password_hash } = req.body;
        try {
            const hashedPassword = await bcrypt_1.default.hash(password_hash, 10);
            const insertQuery = `
        INSERT INTO clients (name, theme, created_at, address, open_at, closed_at, currency, email, password_hash)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING client_id, name, theme, created_at, address, open_at, closed_at, currency, email
      `;
            const values = [name, theme, created_at, address, open_at, closed_at, currency, email, hashedPassword];
            const { rows } = await fastify.pg.query(insertQuery, values);
            return reply.status(201).send({ client: rows[0], menuItems: [] });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Failed to create client' });
        }
    });
};
exports.default = clientsPlugin;
