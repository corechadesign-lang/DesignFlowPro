import express from 'express';
import cors from 'cors';
import pool, { initDatabase } from './db';
import multer from 'multer';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', async (req, res) => {
  const { name, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, name, password, role, avatar_url, avatar_color, active FROM users WHERE name = $1 AND active = true',
      [name]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    const user = result.rows[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatar_url,
      avatarColor: user.avatar_color,
      active: user.active
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, role, avatar_url, avatar_color, active FROM users ORDER BY name'
    );
    res.json(result.rows.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      avatarUrl: u.avatar_url,
      avatarColor: u.avatar_color,
      active: u.active
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

app.get('/api/users/designers', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, role, avatar_url, avatar_color, active FROM users WHERE role = 'DESIGNER' ORDER BY name"
    );
    res.json(result.rows.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      avatarUrl: u.avatar_url,
      avatarColor: u.avatar_color,
      active: u.active
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar designers' });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, password, role, avatarColor } = req.body;
  const id = `user-${Date.now()}`;
  try {
    await pool.query(
      'INSERT INTO users (id, name, password, role, avatar_color, active) VALUES ($1, $2, $3, $4, $5, true)',
      [id, name, password || '123', role || 'DESIGNER', avatarColor]
    );
    res.json({ id, name, role: role || 'DESIGNER', avatarColor, active: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, password, active, avatarColor } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name = COALESCE($1, name), password = COALESCE($2, password), active = COALESCE($3, active), avatar_color = COALESCE($4, avatar_color) WHERE id = $5',
      [name, password, active, avatarColor, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE users SET active = false WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover usuário' });
  }
});

app.get('/api/art-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM art_types ORDER BY sort_order');
    res.json(result.rows.map(a => ({
      id: a.id,
      label: a.label,
      points: a.points,
      order: a.sort_order
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tipos de arte' });
  }
});

app.post('/api/art-types', async (req, res) => {
  const { label, points } = req.body;
  const id = `art-${Date.now()}`;
  try {
    const maxOrder = await pool.query('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM art_types');
    const order = maxOrder.rows[0].next;
    await pool.query(
      'INSERT INTO art_types (id, label, points, sort_order) VALUES ($1, $2, $3, $4)',
      [id, label, points, order]
    );
    res.json({ id, label, points, order });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tipo de arte' });
  }
});

app.put('/api/art-types/:id', async (req, res) => {
  const { id } = req.params;
  const { label, points, order } = req.body;
  try {
    await pool.query(
      'UPDATE art_types SET label = COALESCE($1, label), points = COALESCE($2, points), sort_order = COALESCE($3, sort_order) WHERE id = $4',
      [label, points, order, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tipo de arte' });
  }
});

app.put('/api/art-types/reorder', async (req, res) => {
  const { artTypes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const art of artTypes) {
      await client.query('UPDATE art_types SET sort_order = $1 WHERE id = $2', [art.order, art.id]);
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro ao reordenar' });
  } finally {
    client.release();
  }
});

app.delete('/api/art-types/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM art_types WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover tipo de arte' });
  }
});

app.get('/api/work-sessions', async (req, res) => {
  const { userId, startDate, endDate } = req.query;
  try {
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
    res.json(result.rows.map(s => ({
      id: s.id,
      userId: s.user_id,
      timestamp: parseInt(s.timestamp)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar sessões' });
  }
});

app.post('/api/work-sessions', async (req, res) => {
  const { userId } = req.body;
  const id = `session-${Date.now()}`;
  const timestamp = Date.now();
  try {
    await pool.query(
      'INSERT INTO work_sessions (id, user_id, timestamp) VALUES ($1, $2, $3)',
      [id, userId, timestamp]
    );
    res.json({ id, userId, timestamp });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar sessão' });
  }
});

app.get('/api/demands', async (req, res) => {
  const { userId, startDate, endDate } = req.query;
  try {
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
    res.json(demands);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar demandas' });
  }
});

app.post('/api/demands', async (req, res) => {
  const { userId, userName, items, totalQuantity, totalPoints } = req.body;
  const id = `demand-${Date.now()}`;
  const timestamp = Date.now();
  const client = await pool.connect();
  try {
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
    res.json({ id, userId, userName, items, totalQuantity, totalPoints, timestamp });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar demanda' });
  } finally {
    client.release();
  }
});

app.get('/api/feedbacks', async (req, res) => {
  const { designerId } = req.query;
  try {
    let query = 'SELECT * FROM feedbacks';
    const params: any[] = [];
    if (designerId) {
      params.push(designerId);
      query += ` WHERE designer_id = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows.map(f => ({
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
    res.status(500).json({ error: 'Erro ao buscar feedbacks' });
  }
});

app.post('/api/feedbacks', async (req, res) => {
  const { designerId, designerName, adminName, imageUrls, comment } = req.body;
  const id = `feedback-${Date.now()}`;
  const createdAt = Date.now();
  try {
    await pool.query(
      'INSERT INTO feedbacks (id, designer_id, designer_name, admin_name, image_urls, comment, created_at, viewed) VALUES ($1, $2, $3, $4, $5, $6, $7, false)',
      [id, designerId, designerName, adminName, imageUrls || [], comment, createdAt]
    );
    res.json({ id, designerId, designerName, adminName, imageUrls, comment, createdAt, viewed: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar feedback' });
  }
});

app.put('/api/feedbacks/:id/view', async (req, res) => {
  const { id } = req.params;
  const viewedAt = Date.now();
  try {
    await pool.query(
      'UPDATE feedbacks SET viewed = true, viewed_at = $1 WHERE id = $2',
      [viewedAt, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao marcar como visto' });
  }
});

app.delete('/api/feedbacks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM feedbacks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover feedback' });
  }
});

app.get('/api/lessons', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lessons ORDER BY order_index');
    res.json(result.rows.map(l => ({
      id: l.id,
      title: l.title,
      description: l.description,
      videoUrl: l.video_url,
      orderIndex: l.order_index,
      createdAt: parseInt(l.created_at)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar aulas' });
  }
});

app.post('/api/lessons', async (req, res) => {
  const { title, description, videoUrl } = req.body;
  const id = `lesson-${Date.now()}`;
  const createdAt = Date.now();
  try {
    const maxOrder = await pool.query('SELECT COALESCE(MAX(order_index), -1) + 1 as next FROM lessons');
    const orderIndex = maxOrder.rows[0].next;
    await pool.query(
      'INSERT INTO lessons (id, title, description, video_url, order_index, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, title, description || '', videoUrl, orderIndex, createdAt]
    );
    res.json({ id, title, description, videoUrl, orderIndex, createdAt });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar aula' });
  }
});

app.put('/api/lessons/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, videoUrl, orderIndex } = req.body;
  try {
    await pool.query(
      'UPDATE lessons SET title = COALESCE($1, title), description = COALESCE($2, description), video_url = COALESCE($3, video_url), order_index = COALESCE($4, order_index) WHERE id = $5',
      [title, description, videoUrl, orderIndex, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar aula' });
  }
});

app.delete('/api/lessons/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover aula' });
  }
});

app.get('/api/lesson-progress/:designerId', async (req, res) => {
  const { designerId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM lesson_progress WHERE designer_id = $1',
      [designerId]
    );
    res.json(result.rows.map(p => ({
      id: p.id,
      lessonId: p.lesson_id,
      designerId: p.designer_id,
      viewed: p.viewed,
      viewedAt: p.viewed_at ? parseInt(p.viewed_at) : undefined
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar progresso' });
  }
});

app.post('/api/lesson-progress', async (req, res) => {
  const { lessonId, designerId } = req.body;
  const id = `progress-${Date.now()}`;
  const viewedAt = Date.now();
  try {
    await pool.query(
      'INSERT INTO lesson_progress (id, lesson_id, designer_id, viewed, viewed_at) VALUES ($1, $2, $3, true, $4) ON CONFLICT (lesson_id, designer_id) DO UPDATE SET viewed = true, viewed_at = $4',
      [id, lessonId, designerId, viewedAt]
    );
    res.json({ id, lessonId, designerId, viewed: true, viewedAt });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar progresso' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM system_settings WHERE id = 1');
    if (result.rows.length === 0) {
      res.json({});
    } else {
      const s = result.rows[0];
      res.json({
        logoUrl: s.logo_url,
        brandTitle: s.brand_title,
        loginSubtitle: s.login_subtitle,
        variationPoints: s.variation_points
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

app.put('/api/settings', async (req, res) => {
  const { logoUrl, brandTitle, loginSubtitle, variationPoints } = req.body;
  try {
    await pool.query(
      'UPDATE system_settings SET logo_url = COALESCE($1, logo_url), brand_title = COALESCE($2, brand_title), login_subtitle = COALESCE($3, login_subtitle), variation_points = COALESCE($4, variation_points) WHERE id = 1',
      [logoUrl, brandTitle, loginSubtitle, variationPoints]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
