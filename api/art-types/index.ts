import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM art_types ORDER BY sort_order');
      return res.json(result.rows.map(a => ({
        id: a.id,
        label: a.label,
        points: a.points,
        order: a.sort_order
      })));
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar tipos de arte' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { label, points } = req.body;
      const id = `art-${Date.now()}`;
      const maxOrder = await pool.query('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM art_types');
      const order = maxOrder.rows[0].next;
      
      await pool.query(
        'INSERT INTO art_types (id, label, points, sort_order) VALUES ($1, $2, $3, $4)',
        [id, label, points, order]
      );
      
      return res.json({ id, label, points, order });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar tipo de arte' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
