import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { title, description, videoUrl, orderIndex } = req.body;
      
      await pool.query(
        'UPDATE lessons SET title = COALESCE($1, title), description = COALESCE($2, description), video_url = COALESCE($3, video_url), order_index = COALESCE($4, order_index) WHERE id = $5',
        [title, description, videoUrl, orderIndex, id]
      );
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar aula' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao remover aula' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
