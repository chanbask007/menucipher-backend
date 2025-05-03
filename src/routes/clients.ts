// src/routes/clients.ts
import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcrypt'

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
  popular?: boolean
  rating: number
}

const clientsPlugin: FastifyPluginAsync = async (fastify) => {
  // Get all clients
  fastify.get('/', async (_req, reply) => {
    try {
      const { rows } = await fastify.pg.query<Client>('SELECT * FROM clients')
      return rows
    } catch (err) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Database error' })
    }
  })

  // Get client by ID + menu items
  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      const { rows: clientRows } = await fastify.pg.query<Client>('SELECT * FROM clients WHERE client_id = $1', [id])
      if (!clientRows.length) return reply.code(404).send({ error: 'Client not found' })

      const { rows: menuItems } = await fastify.pg.query<MenuItem>('SELECT * FROM menu_items WHERE client_id = $1', [id])
      return { client: clientRows[0], menuItems }
    } catch (err) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Failed to fetch client' })
    }
  })

  // Create new client
  fastify.post('/', async (req, reply) => {
    const {
      name, theme, created_at, address,
      open_at, closed_at, currency, email, password_hash
    } = req.body as Omit<Client, 'client_id'>

    try {
      const hashedPassword = await bcrypt.hash(password_hash, 10)
      const insertQuery = `
        INSERT INTO clients (name, theme, created_at, address, open_at, closed_at, currency, email, password_hash)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING client_id, name, theme, created_at, address, open_at, closed_at, currency, email
      `
      const values = [name, theme, created_at, address, open_at, closed_at, currency, email, hashedPassword]
      const { rows } = await fastify.pg.query(insertQuery, values)
      return reply.status(201).send({ client: rows[0], menuItems: [] })
    } catch (err) {
      fastify.log.error(err)
      return reply.code(500).send({ error: 'Failed to create client' })
    }
  })
}

export default clientsPlugin
