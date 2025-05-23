// src/routes/categories.ts
import type { FastifyPluginAsync } from 'fastify';
import { Category } from '../types';
import { authMiddleware } from '../middleware/auth';

const categoriesPlugin: FastifyPluginAsync = async (fastify) => {
  // Apply auth middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Get all categories for a client
  fastify.get<{ Params: { clientId: string } }>('/:clientId', async (req, reply) => {
    const { clientId } = req.params;

    try {
      const { rows } = await fastify.pg.query<Category>(
        'SELECT * FROM categories WHERE client_id = $1',
        [clientId]
      );
      return rows;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch categories' });
    }
  });

  // Create a new category
  fastify.post<{ Params: { clientId: string }; Body: Omit<Category, 'id' | 'client_id'> }>(
    '/:clientId',
    async (req, reply) => {
      const { clientId } = req.params;
      const { name } = req.body;

      if (!name) {
        return reply.code(400).send({ error: 'Name is required' });
      }

      try {
        const { rows } = await fastify.pg.query<Category>(
          'INSERT INTO categories (client_id, name) VALUES ($1, $2) RETURNING *',
          [clientId, name]
        );
        return reply.status(201).send(rows[0]);
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to create category' });
      }
    }
  );

  // Update a category
  fastify.put<{ Params: { clientId: string; id: string }; Body: Omit<Category, 'id' | 'client_id'> }>(
    '/:clientId/:id',
    async (req, reply) => {
      const { clientId, id } = req.params;
      const { name } = req.body;

      if (!name) {
        return reply.code(400).send({ error: 'Name is required' });
      }

      try {
        const { rows } = await fastify.pg.query<Category>(
          'UPDATE categories SET name = $1 WHERE id = $2 AND client_id = $3 RETURNING *',
          [name, id, clientId]
        );
        if (!rows.length) {
          return reply.code(404).send({ error: 'Category not found' });
        }
        return rows[0];
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to update category' });
      }
    }
  );

  // Delete a category
  fastify.delete<{ Params: { clientId: string; id: string } }>('/:clientId/:id', async (req, reply) => {
    const { clientId, id } = req.params;

    try {
      const { rowCount } = await fastify.pg.query(
        'DELETE FROM categories WHERE id = $1 AND client_id = $2',
        [id, clientId]
      );
      if (!rowCount) {
        return reply.code(404).send({ error: 'Category not found' });
      }
      return reply.status(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete category' });
    }
  });
};

export default categoriesPlugin;