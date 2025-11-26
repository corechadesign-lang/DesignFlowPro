import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM system_settings WHERE id = 1');
      if (result.rows.length === 0) {
        return res.json({});
      }
      const s = result.rows[0];
      return res.json({
        logoUrl: s.logo_url,
        brandTitle: s.brand_title,
        loginSubtitle: s.login_subtitle,
        variationPoints: s.variation_points
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { logoUrl, brandTitle, loginSubtitle, variationPoints } = req.body;
      
      await pool.query(
        'UPDATE system_settings SET logo_url = COALESCE($1, logo_url), brand_title = COALESCE($2, brand_title), login_subtitle = COALESCE($3, login_subtitle), variation_points = COALESCE($4, variation_points) WHERE id = 1',
        [logoUrl, brandTitle, loginSubtitle, variationPoints]
      );
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
