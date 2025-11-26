import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { userId, startDate, endDate } = req.query;
      
      let query = 'SELECT * FROM demands WHERE 1=1';
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
      
      const demands = await Promise.all(result.rows.map(async (d) => {
        const itemsResult = await pool.query(
          'SELECT * FROM demand_items WHERE demand_id = $1',
          [d.id]
        );
        return {
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          items: itemsResult.rows.map(i => ({
            artTypeId: i.art_type_id,
            artTypeLabel: i.art_type_label,
            pointsPerUnit: i.points_per_unit,
            quantity: i.quantity,
            variationQuantity: i.variation_quantity,
            variationPoints: i.variation_points,
            totalPoints: i.total_points
          })),
          totalQuantity: d.total_quantity,
          totalPoints: d.total_points,
          timestamp: parseInt(d.timestamp)
        };
      }));
      
      return res.json(demands);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar demandas' });
    }
  }

  if (req.method === 'POST') {
    const client = await pool.connect();
    try {
      const { userId, userName, items, totalQuantity, totalPoints } = req.body;
      const id = `demand-${Date.now()}`;
      const timestamp = Date.now();
      
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO demands (id, user_id, user_name, total_quantity, total_points, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, userId, userName, totalQuantity, totalPoints, timestamp]
      );
      
      for (const item of items) {
        await client.query(
          'INSERT INTO demand_items (demand_id, art_type_id, art_type_label, points_per_unit, quantity, variation_quantity, variation_points, total_points) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [id, item.artTypeId, item.artTypeLabel, item.pointsPerUnit, item.quantity, item.variationQuantity || 0, item.variationPoints || 0, item.totalPoints]
        );
      }
      
      await client.query('COMMIT');
      return res.json({ id, userId, userName, items, totalQuantity, totalPoints, timestamp });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar demanda' });
    } finally {
      client.release();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
