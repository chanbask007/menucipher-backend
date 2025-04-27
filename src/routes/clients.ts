// src/routes/clients.ts

import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcrypt'
import { log } from 'console'

// Types
interface Client {
  client_id: string
  name: string
  theme: string
  created_at: string
  address: string
  open_at: string
  closed_at: string
  currency: string
  email: string
  password_hash: string
}

interface MenuItem {
  id: number
  client_id: string
  category: string
  name: string
  description: string
  price: number
  image_url: string
  create_at: string
  popular: boolean
  rating: number
}

interface GetClientParams {
  id: string
}

interface PostClientBody {
  name: string
  theme: string
  created_at: string
  address: string
  open_at: string
  closed_at: string
  currency: string
  email: string
  password_hash: string
}

// Plugin
const clientsPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(async (clientRoutes) => {
    
   // GET /clients/ - Fetch all clients + their menu items
   clientRoutes.get('/', async (_request, reply) => {
    try {
      const { rows: clientRows } = await fastify.pg.query<Client>('SELECT * FROM clients')

      const clientsWithMenuItems = await Promise.all(
        clientRows.map(async (client) => {
          const { rows: menuItems } = await fastify.pg.query<MenuItem>(
            'SELECT * FROM menu_items WHERE client_id = $1',
            [client.client_id]
          )
          return { client, menuItems }
        })
      )

      return clientsWithMenuItems
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error })
    }
  })

    // GET /clients/:id - Fetch a client and their menu items
    clientRoutes.get<{ Params: GetClientParams }>('/:id', async (request, reply) => {
      const { id } = request.params

      try {
        const { rows: clientRows } = await fastify.pg.query<Client>('SELECT * FROM clients WHERE client_id = $1', [id])
        if (clientRows.length === 0) {
          return reply.code(404).send({ error: 'Client not found' })
        }

        const client = clientRows[0]
        const { rows: menuItems } = await fastify.pg.query<MenuItem>('SELECT * FROM menu_items WHERE client_id = $1', [id])
        
        return { client, menuItems }
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Database error while fetching client' })
      }
    })

    // POST /clients/ - Create a new client and return client + empty menuItems
    clientRoutes.post<{ Body: PostClientBody }>('/', async (request, reply) => {
      const {
        name,
        theme,
        created_at,
        address,
        open_at,
        closed_at,
        currency,
        email,
        password_hash,
      } = request.body

      try {
        const hashedPassword = await bcrypt.hash(password_hash, 10)

        const insertQuery = `
          INSERT INTO clients (name, theme, created_at, address, open_at, closed_at, currency, email, password_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING client_id, name, theme, created_at, address, open_at, closed_at, currency, email
        `
        const values = [name, theme, created_at, address, open_at, closed_at, currency, email, hashedPassword]

        const { rows } = await fastify.pg.query<Client>(insertQuery, values)

        const client = rows[0]

        return reply.status(201).send({
          client,
          menuItems: [] as MenuItem[] // 🛠️ Empty menuItems array typed correctly
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.code(500).send({ error: 'Failed to create client' })
      }
    })

  }, { prefix: '/clients' })
}

export default clientsPlugin
