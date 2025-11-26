import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool, { hashPassword } from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { name, password, active, avatarColor } = req.body;
      const hashedPassword = password ? await hashPassword(password) : null;
      
      await pool.query(
        'UPDATE users SET name = COALESCE($1, name), password = COALESCE($2, password), active = COALESCE($3, active), avatar_color = COALESCE($4, avatar_color) WHERE id = $5',
        [name, hashedPassword, active, avatarColor, id]
      );
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await pool.query('UPDATE users SET active = false WHERE id = $1', [id]);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao remover usuário' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
