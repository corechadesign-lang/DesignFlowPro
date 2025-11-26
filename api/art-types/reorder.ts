import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = await pool.connect();
  try {
    const { artTypes } = req.body;
    await client.query('BEGIN');
    
    for (const art of artTypes) {
      await client.query('UPDATE art_types SET sort_order = $1 WHERE id = $2', [art.order, art.id]);
    }
    
    await client.query('COMMIT');
    return res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Erro ao reordenar' });
  } finally {
    client.release();
  }
}
