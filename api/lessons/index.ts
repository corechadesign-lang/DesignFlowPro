import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM lessons ORDER BY order_index');
      return res.json(result.rows.map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        videoUrl: l.video_url,
        orderIndex: l.order_index,
        createdAt: parseInt(l.created_at)
      })));
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar aulas' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, videoUrl } = req.body;
      const id = `lesson-${Date.now()}`;
      const createdAt = Date.now();
      const maxOrder = await pool.query('SELECT COALESCE(MAX(order_index), -1) + 1 as next FROM lessons');
      const orderIndex = maxOrder.rows[0].next;
      
      await pool.query(
        'INSERT INTO lessons (id, title, description, video_url, order_index, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, title, description || '', videoUrl, orderIndex, createdAt]
      );
      
      return res.json({ id, title, description, videoUrl, orderIndex, createdAt });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar aula' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
