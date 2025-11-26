import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool, { comparePassword } from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, password } = req.body;
    
    const result = await pool.query(
      'SELECT id, name, password, role, avatar_url, avatar_color, active FROM users WHERE name = $1 AND active = true',
      [name]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    const user = result.rows[0];
    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    
    return res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatar_url,
      avatarColor: user.avatar_color,
      active: user.active
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
