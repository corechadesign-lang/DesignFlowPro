import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { label, points, order } = req.body;
      
      await pool.query(
        'UPDATE art_types SET label = COALESCE($1, label), points = COALESCE($2, points), sort_order = COALESCE($3, sort_order) WHERE id = $4',
        [label, points, order, id]
      );
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar tipo de arte' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await pool.query('DELETE FROM art_types WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao remover tipo de arte' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
