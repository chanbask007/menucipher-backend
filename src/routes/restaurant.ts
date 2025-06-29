// src/routes/restaurant.ts
import type { FastifyPluginAsync } from 'fastify';
import { Restaurant, Currency } from '../types';
import { authMiddleware } from '../middleware/auth';

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: '$',
  AUD: '$',
  INR: '₹',
  CNY: '¥'
};

const restaurantPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authMiddleware);

  // Get restaurant details for a client
  fastify.get<{ Params: { clientId: string } }>('/:clientId', async (req, reply) => {
    const { clientId } = req.params;

    try {
      const { rows } = await fastify.pg.query(
        'SELECT client_id, name, address, open_at, closed_at, currency FROM clients WHERE client_id = $1',
        [clientId]
      );
      if (!rows.length) {
        return reply.code(404).send({ error: 'Client not found' });
      }

      const client = rows[0];
      const restaurant: Restaurant = {
        restaurant_id: client.client_id,
        name: client.name,
        address: client.address,
        hours: `${client.open_at} - ${client.closed_at}`,
        currency: client.currency,
        currencySymbol: currencySymbols[client.currency as Currency] || '$'
      };
      return restaurant;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch restaurant details' });
    }
  });

  // Update restaurant details
  fastify.put<{ Params: { clientId: string }; Body: Restaurant }>('/:clientId', async (req, reply) => {
    const { clientId } = req.params;
    const { name, address, hours, currency } = req.body;

    try {
      const [open_at, closed_at] = hours.split(' - ').map((time: string) => time.trim());
      const { rows } = await fastify.pg.query(
        `
        UPDATE clients
        SET name = $1, address = $2, open_at = $3, closed_at = $4, currency = $5
        WHERE client_id = $6
        RETURNING client_id, name, address, open_at, closed_at, currency
      `,
        [name, address, open_at, closed_at, currency, clientId]
      );
      if (!rows.length) {
        return reply.code(404).send({ error: 'Client not found' });
      }

      const updatedClient = rows[0];
      const restaurant: Restaurant = {
        restaurant_id: updatedClient.client_id,
        name: updatedClient.name,
        address: updatedClient.address,
        hours: `${updatedClient.open_at} - ${updatedClient.closed_at}`,
        currency: updatedClient.currency,
        currencySymbol: currencySymbols[updatedClient.currency as Currency] || '$'
      };
      return { message: 'Restaurant updated', restaurant };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update restaurant' });
    }
  });
};

export default restaurantPlugin;