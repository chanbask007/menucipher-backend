// src/routes/menu-items.ts
import type { FastifyPluginAsync } from 'fastify';
import { MenuItem } from '../types';
import { authMiddleware } from '../middleware/auth';

// Extend MenuItem to include category_id for internal use
interface MenuItemWithCategoryId extends MenuItem {
  category_id?: number; // Optional, used internally but not in response
}

const menuItemsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware);

  // Get all menu items for a client (with optional filters)
  fastify.get<{ Params: { clientId: string }; Querystring: { categoryId?: string; popular?: string } }>(
    '/:clientId',
    async (req, reply) => {
      const { clientId } = req.params;
      const { categoryId, popular } = req.query;
  
      try {
        let query = `
          SELECT mi.*, c.name AS category
          FROM menu_items mi
          JOIN categories c ON mi.category_id = c.id
          WHERE mi.client_id = $1
        `;
        const params: (string | number | boolean)[] = [clientId];
        let paramIndex = 2;
  
        if (categoryId) {
          query += ` AND mi.category_id = $${paramIndex}`;
          params.push(parseInt(categoryId, 10)); // Convert to integer
          paramIndex++;
        }
        if (popular === 'true') {
          query += ` AND mi.popular = $${paramIndex}`;
          params.push(true);
        }
  
        const { rows } = await fastify.pg.query<MenuItem>(query, params);
        return rows;
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to fetch menu items' });
      }
    }
  );

  // Create a new menu item
fastify.post<{ Params: { clientId: string }; Body: Omit<MenuItemWithCategoryId, 'id' | 'client_id'> }>(
  '/:clientId',
  async (req, reply) => {
    const { clientId } = req.params;
    const { category_id, name, description, price, image_url, popular, rating } = req.body;

    if (!name || !category_id || price == null) {
      return reply.code(400).send({ error: 'Name, category_id, and price are required' });
    }

    try {
      // Check if a menu item with the same name already exists for this client
      const { rows: existingMenuItems } = await fastify.pg.query<MenuItem>(
        'SELECT * FROM menu_items WHERE client_id = $1 AND name = $2',
        [clientId, name]
      );

      if (existingMenuItems.length > 0) {
        return reply.code(400).send({ error: 'Menu item already exists for this client' });
      }

      // Verify category_id exists for this client
      const { rows: categoryCheck } = await fastify.pg.query(
        'SELECT name FROM categories WHERE id = $1 AND client_id = $2',
        [category_id, clientId]
      );

      if (categoryCheck.length === 0) {
        return reply.code(400).send({ error: 'Invalid category_id for this client' });
      }

      // Proceed with menu item creation
      const { rows } = await fastify.pg.query<MenuItem>(
        `
        INSERT INTO menu_items (client_id, category_id, name, description, price, image_url, create_at, popular, rating)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
        RETURNING *, (SELECT name FROM categories WHERE id = $2) AS category
      `,
        [
          clientId,
          category_id,
          name,
          description || '',
          price,
          image_url || 'https://via.placeholder.com/150',
          popular || false,
          rating || null
        ]
      );
      return reply.status(201).send(rows[0]);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to create menu item' });
    }
  }
);

// Update a menu item
fastify.put<{ Params: { clientId: string; id: string }; Body: Omit<MenuItemWithCategoryId, 'id' | 'client_id'> }>(
  '/:clientId/:id',
  async (req, reply) => {
    const { clientId, id } = req.params;
    const { category_id, name, description, price, image_url, popular, rating } = req.body;

    try {
      // Verify category_id exists for this client
      if (category_id) {
        const { rows: categoryCheck } = await fastify.pg.query(
          'SELECT name FROM categories WHERE id = $1 AND client_id = $2',
          [category_id, clientId]
        );

        if (categoryCheck.length === 0) {
          return reply.code(400).send({ error: 'Invalid category_id for this client' });
        }
      }

      const { rows } = await fastify.pg.query<MenuItem>(
        `
        UPDATE menu_items
        SET category_id = $1, name = $2, description = $3, price = $4, image_url = $5, popular = $6, rating = $7
        WHERE id = $8 AND client_id = $9
        RETURNING *, (SELECT name FROM categories WHERE id = $1) AS category
      `,
        [
          category_id,
          name,
          description,
          price,
          image_url,
          popular,
          rating,
          id,
          clientId
        ]
      );
      if (!rows.length) {
        return reply.code(404).send({ error: 'Menu item not found' });
      }
      return rows[0];
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update menu item' });
    }
  }
);

// Delete a menu item
fastify.delete<{ Params: { clientId: string; id: string } }>('/:clientId/:id', async (req, reply) => {
  const { clientId, id } = req.params;

  try {
    const { rowCount } = await fastify.pg.query(
      'DELETE FROM menu_items WHERE id = $1 AND client_id = $2',
      [id, clientId]
    );
    if (!rowCount) {
      return reply.code(404).send({ error: 'Menu item not found' });
    }
    return reply.status(204).send();
  } catch (err) {
    fastify.log.error(err);
    return reply.code(500).send({ error: 'Failed to delete menu item' });
  }
});
}

export default menuItemsPlugin;