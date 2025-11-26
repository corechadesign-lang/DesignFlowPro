import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, role, avatar_url, avatar_color, active FROM users WHERE role = 'DESIGNER' ORDER BY name"
    );
    return res.json(result.rows.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      avatarUrl: u.avatar_url,
      avatarColor: u.avatar_color,
      active: u.active
    })));
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar designers' });
  }
}
