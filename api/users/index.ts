import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool, { hashPassword } from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT id, name, role, avatar_url, avatar_color, active FROM users ORDER BY name'
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
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, password, role, avatarColor } = req.body;
      const id = `user-${Date.now()}`;
      const hashedPassword = await hashPassword(password || '123');
      
      await pool.query(
        'INSERT INTO users (id, name, password, role, avatar_color, active) VALUES ($1, $2, $3, $4, $5, true)',
        [id, name, hashedPassword, role || 'DESIGNER', avatarColor]
      );
      
      return res.json({ id, name, role: role || 'DESIGNER', avatarColor, active: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
