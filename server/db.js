import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000
})

export async function ensureDbReady() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL manquant — ex: postgresql://floate:MOT_DE_PASSE@localhost:5432/floate_db ' +
      '(via tunnel SSH ou Wireguard vers le VPS, voir server/schema.sql)'
    )
  }
  await pool.query('SELECT 1')
}
