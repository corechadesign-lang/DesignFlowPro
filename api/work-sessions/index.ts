import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { userId, startDate, endDate } = req.query;
      
      let query = 'SELECT * FROM work_sessions WHERE 1=1';
      const params: any[] = [];
      
      if (userId) {
        params.push(userId);
        query += ` AND user_id = $${params.length}`;
      }
      if (startDate) {
        params.push(parseInt(startDate as string));
        query += ` AND timestamp >= $${params.length}`;
      }
      if (endDate) {
        params.push(parseInt(endDate as string));
        query += ` AND timestamp <= $${params.length}`;
      }
      
      query += ' ORDER BY timestamp DESC';
      const result = await pool.query(query, params);
      
      return res.json(result.rows.map(s => ({
        id: s.id,
        userId: s.user_id,
        timestamp: parseInt(s.timestamp)
      })));
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar sessões' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId } = req.body;
      const id = `session-${Date.now()}`;
      const timestamp = Date.now();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();
      
      const existing = await pool.query(
        'SELECT * FROM work_sessions WHERE user_id = $1 AND timestamp >= $2 ORDER BY timestamp ASC LIMIT 1',
        [userId, todayStart]
      );
      
      if (existing.rows.length > 0) {
        const s = existing.rows[0];
        return res.json({ id: s.id, userId: s.user_id, timestamp: parseInt(s.timestamp) });
      }
      
      await pool.query(
        'INSERT INTO work_sessions (id, user_id, timestamp) VALUES ($1, $2, $3)',
        [id, userId, timestamp]
      );
      
      return res.json({ id, userId, timestamp });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar sessão' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
