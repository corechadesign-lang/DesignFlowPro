import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { designerId } = req.query;
    const result = await pool.query(
      'SELECT * FROM lesson_progress WHERE designer_id = $1',
      [designerId]
    );
    
    return res.json(result.rows.map(p => ({
      id: p.id,
      lessonId: p.lesson_id,
      designerId: p.designer_id,
      viewed: p.viewed,
      viewedAt: p.viewed_at ? parseInt(p.viewed_at) : undefined
    })));
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
}
