// src/types/fastify.d.ts
import { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      email: string;
    };
  }
}