"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authPlugin = async (fastify) => {
    // Login route (no auth required)
    fastify.post('/', async (req, reply) => {
        const { email, password } = req.body;
        // Validate request body
        if (!email || !password) {
            return reply.code(400).send({ error: 'Email and password are required' });
        }
        try {
            const { rows } = await fastify.pg.query('SELECT * FROM clients WHERE email = $1', [email]);
            if (!rows.length) {
                return reply.code(401).send({ error: 'Invalid credentials' });
            }
            const client = rows[0];
            // Check if password_hash exists in the database
            if (!client.password_hash) {
                fastify.log.error(`No password hash found for user with email: ${email}`);
                return reply.code(500).send({ error: 'User account is misconfigured' });
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, client.password_hash);
            if (!isPasswordValid) {
                return reply.code(401).send({ error: 'Invalid credentials' });
            }
            const token = jsonwebtoken_1.default.sign({ email: client.email }, process.env.JWT_SECRET || 'your_jwt_secret_here', { expiresIn: '1h' });
            // Include client_id in the response for frontend use
            return { token, clientId: client.client_id };
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Failed to authenticate' });
        }
    });
};
exports.default = authPlugin;
