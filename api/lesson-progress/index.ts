import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lessonId, designerId } = req.body;
    const id = `progress-${Date.now()}`;
    const viewedAt = Date.now();
    
    await pool.query(
      'INSERT INTO lesson_progress (id, lesson_id, designer_id, viewed, viewed_at) VALUES ($1, $2, $3, true, $4) ON CONFLICT (lesson_id, designer_id) DO UPDATE SET viewed = true, viewed_at = $4',
      [id, lessonId, designerId, viewedAt]
    );
    
    return res.json({ id, lessonId, designerId, viewed: true, viewedAt });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao salvar progresso' });
  }
}
