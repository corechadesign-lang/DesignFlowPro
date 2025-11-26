import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { designerId } = req.query;
      
      let query = 'SELECT * FROM feedbacks';
      const params: any[] = [];
      
      if (designerId) {
        params.push(designerId);
        query += ` WHERE designer_id = $${params.length}`;
      }
      
      query += ' ORDER BY created_at DESC';
      const result = await pool.query(query, params);
      
      return res.json(result.rows.map(f => ({
        id: f.id,
        designerId: f.designer_id,
        designerName: f.designer_name,
        adminName: f.admin_name,
        imageUrls: f.image_urls || [],
        comment: f.comment,
        createdAt: parseInt(f.created_at),
        viewed: f.viewed,
        viewedAt: f.viewed_at ? parseInt(f.viewed_at) : undefined
      })));
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar feedbacks' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { designerId, designerName, adminName, imageUrls, comment } = req.body;
      const id = `feedback-${Date.now()}`;
      const createdAt = Date.now();
      
      await pool.query(
        'INSERT INTO feedbacks (id, designer_id, designer_name, admin_name, image_urls, comment, created_at, viewed) VALUES ($1, $2, $3, $4, $5, $6, $7, false)',
        [id, designerId, designerName, adminName, imageUrls || [], comment, createdAt]
      );
      
      return res.json({ id, designerId, designerName, adminName, imageUrls, comment, createdAt, viewed: false });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar feedback' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
