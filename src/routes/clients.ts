import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

// Types
const Client = Type.Object({
  client_id: Type.String(),
  name: Type.String(),
  theme: Type.String(),
  created_at: Type.String({ format: 'date-time' }),
  address: Type.String(),
  open_at: Type.String(),
  closed_at: Type.String(),
  currency: Type.String({ maxLength: 3 }),
  email: Type.String({ format: 'email' }),
  password_hash: Type.String(),
});

const MenuItem = Type.Object({
  id: Type.Number(),
  client_id: Type.String(),
  category: Type.String(),
  name: Type.String(),
  description: Type.String(),
  price: Type.Number(),
  image_url: Type.String(),
  create_at: Type.String({ format: 'date-time' }),
  popular: Type.Optional(Type.Boolean()),
  rating: Type.Number(),
});

interface GetClientParams {
  Params: {
    id: string;
  };
}

const PostClientBody = Type.Object({
  name: Type.String(),
  theme: Type.String(),
  created_at: Type.String({ format: 'date-time' }),
  address: Type.String(),
  open_at: Type.String(),
  closed_at: Type.String(),
  currency: Type.String({ maxLength: 3 }),
  email: Type.String({ format: 'email' }),
  password_hash: Type.String(),
});

// Plugin
const clientsPlugin: FastifyPluginAsync = async (fastify) => {
  const server = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // Register routes with /clients prefix
  server.register(async (clientRoutes) => {
    // GET /clients - Fetch all clients + their menu items
    clientRoutes.get('/', {
      schema: {
        response: {
          200: Type.Array(
            Type.Object({
              client: Client,
              menuItems: Type.Array(MenuItem),
            })
          ),
          500: Type.Object({ error: Type.String() }),
        },
      },
      async handler(_request: FastifyRequest, reply: FastifyReply) {
        try {
          const { rows: clientRows } = await clientRoutes.pg.query<typeof Client['static']>('SELECT * FROM clients');

          const clientsWithMenuItems = await Promise.all(
            clientRows.map(async (client: typeof Client['static']) => {
              const { rows: menuItems } = await clientRoutes.pg.query<typeof MenuItem['static']>(
                'SELECT * FROM menu_items WHERE client_id = $1',
                [client.client_id]
              );
              return { client, menuItems };
            })
          );

          return clientsWithMenuItems;
        } catch (error) {
          clientRoutes.log.error(error);
          return reply.code(500).send({ error: 'Database error' });
        }
      },
    });

    // GET /clients/:id - Fetch a client and their menu items
    clientRoutes.get('/:id', {
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: {
          200: Type.Object({
            client: Client,
            menuItems: Type.Array(MenuItem),
          }),
          404: Type.Object({ error: Type.String() }),
          500: Type.Object({ error: Type.String() }),
        },
      },
      async handler(request: FastifyRequest<GetClientParams>, reply: FastifyReply) {
        const { id } = request.params;

        try {
          const { rows: clientRows } = await clientRoutes.pg.query<typeof Client['static']>(
            'SELECT * FROM clients WHERE client_id = $1',
            [id]
          );
          if (clientRows.length === 0) {
            return reply.code(404).send({ error: 'Client not found' });
          }

          const client = clientRows[0];
          const { rows: menuItems } = await clientRoutes.pg.query<typeof MenuItem['static']>(
            'SELECT * FROM menu_items WHERE client_id = $1',
            [id]
          );

          return { client, menuItems };
        } catch (error) {
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
          201: Type.Object({
            client: Client,
            menuItems: Type.Array(MenuItem),
          }),
          500: Type.Object({ error: Type.String() }),
        },
      },
      async handler(request: FastifyRequest<{ Body: typeof PostClientBody['static'] }>, reply: FastifyReply) {
        const { name, theme, created_at, address, open_at, closed_at, currency, email, password_hash } = request.body;

        try {
          const hashedPassword = await bcrypt.hash(password_hash, 10);

          const insertQuery = `
            INSERT INTO clients (name, theme, created_at, address, open_at, closed_at, currency, email, password_hash)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING client_id, name, theme, created_at, address, open_at, closed_at, currency, email
          `;
          const values = [name, theme, created_at, address, open_at, closed_at, currency, email, hashedPassword];

          const { rows } = await clientRoutes.pg.query<typeof Client['static']>(insertQuery, values);

          const client = rows[0];

          return reply.status(201).send({
            client,
            menuItems: [],
          });
        } catch (error) {
          clientRoutes.log.error(error);
          return reply.code(500).send({ error: 'Failed to create client' });
        }
      },
    });
  }, { prefix: '/clients' });
};

export default clientsPlugin;