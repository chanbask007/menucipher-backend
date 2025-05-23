// src/routes/auth.ts
import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Client } from '../types';

interface LoginRequest {
  email: string;
  password: string;
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Login route (no auth required)
  fastify.post<{ Body: LoginRequest }>('/', async (req, reply) => {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    try {
      const { rows } = await fastify.pg.query<Client>(
        'SELECT * FROM clients WHERE email = $1',
        [email]
      );

      if (!rows.length) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const client = rows[0];

      // Check if password_hash exists in the database
      if (!client.password_hash) {
        fastify.log.error(`No password hash found for user with email: ${email}`);
        return reply.code(500).send({ error: 'User account is misconfigured' });
      }

      const isPasswordValid = await bcrypt.compare(password, client.password_hash);
      if (!isPasswordValid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { email: client.email },
        process.env.JWT_SECRET || 'your_jwt_secret_here',
        { expiresIn: '1h' }
      );

      // Include client_id in the response for frontend use
      return { token, clientId: client.client_id };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to authenticate' });
    }
  });
};

export default authPlugin;