import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const viewedAt = Date.now();
    
    await pool.query(
      'UPDATE feedbacks SET viewed = true, viewed_at = $1 WHERE id = $2',
      [viewedAt, id]
    );
    
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao marcar como visto' });
  }
}
