// src/middleware/auth.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export const authMiddleware = async (req: FastifyRequest, reply: FastifyReply) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_here') as { email: string };
    req.user = { email: decoded.email };
  } catch (err) {
    req.log.error(err);
    return reply.code(401).send({ error: 'Invalid token' });
  }
};