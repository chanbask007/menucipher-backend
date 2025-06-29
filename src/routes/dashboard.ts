// src/routes/dashboard.ts
import type { FastifyPluginAsync } from 'fastify';
import { Client, MenuItem, Category, DashboardResponse, Restaurant, Analytics } from '../types';
import { authMiddleware } from '../middleware/auth';

const dashboardPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware);

  // Get dashboard data for a client
  fastify.get<{ Params: { clientId: string } }>('/:clientId', async (req, reply) => {
    const { clientId } = req.params;

    try {
      // Fetch client (restaurant) details
      const { rows: clientRows } = await fastify.pg.query<Client>(
        'SELECT * FROM clients WHERE client_id = $1',
        [clientId]
      );
      if (!clientRows.length) {
        return reply.code(404).send({ error: 'Client not found' });
      }

      const client = clientRows[0];
      const restaurant: Restaurant = {
        restaurant_id: client.client_id,
        name: client.name,
        address: client.address,
        hours: `${client.open_at} - ${client.closed_at}`,
        currency: client.currency,
        currencySymbol: { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: '$', AUD: '$', INR: '₹', CNY: '¥' }[
          client.currency
        ] || '$'
      };

      // Fetch categories
      const { rows: categories } = await fastify.pg.query<Category>(
        'SELECT * FROM categories WHERE client_id = $1',
        [clientId]
      );

      // Fetch menu items
      const { rows: menuItems } = await fastify.pg.query<MenuItem>(
        'SELECT * FROM menu_items WHERE client_id = $1',
        [clientId]
      );

      // Compute analytics (simplified; in production, use a proper query)
      const today = new Date().toISOString().split('T')[0];
      const { rows: todayOrdersRows } = await fastify.pg.query(
        'SELECT COUNT(*) as count FROM orders WHERE client_id = $1 AND DATE(order_date) = $2',
        [clientId, today]
      );
      const { rows: weeklyOrdersRows } = await fastify.pg.query(
        'SELECT COUNT(*) as count FROM orders WHERE client_id = $1 AND order_date >= NOW() - INTERVAL \'7 days\'',
        [clientId]
      );
      const { rows: revenueRows } = await fastify.pg.query(
        'SELECT SUM(total) as total FROM orders WHERE client_id = $1',
        [clientId]
      );

      const weeklySales = Array(7).fill(0);
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const { rows } = await fastify.pg.query(
          'SELECT SUM(total) as total FROM orders WHERE client_id = $1 AND DATE(order_date) = $2',
          [clientId, dateStr]
        );
        weeklySales[6 - i] = rows[0].total || 0;
      }

      const analytics: Analytics = {
        todayOrders: Number(todayOrdersRows[0]?.count) || 0,
        weeklyOrders: Number(weeklyOrdersRows[0]?.count) || 0,
        totalRevenue: Number(revenueRows[0]?.total) || 0,
        weeklySales
      };

      const response: DashboardResponse = {
        restaurant,
        analytics,
        categories,
        menuItems
      };

      return response;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch dashboard data' });
    }
  });
};

export default dashboardPlugin;