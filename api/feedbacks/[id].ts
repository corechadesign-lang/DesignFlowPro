import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      await pool.query('DELETE FROM feedbacks WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao remover feedback' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
