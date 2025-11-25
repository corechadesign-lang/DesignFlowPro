import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('ADM', 'DESIGNER')),
        avatar_url TEXT,
        avatar_color VARCHAR(20),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS art_types (
        id VARCHAR(50) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        points INTEGER NOT NULL,
        sort_order INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS demands (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id),
        user_name VARCHAR(255) NOT NULL,
        total_quantity INTEGER NOT NULL,
        total_points INTEGER NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS demand_items (
        id SERIAL PRIMARY KEY,
        demand_id VARCHAR(50) REFERENCES demands(id) ON DELETE CASCADE,
        art_type_id VARCHAR(50),
        art_type_label VARCHAR(255) NOT NULL,
        points_per_unit INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        variation_quantity INTEGER DEFAULT 0,
        variation_points INTEGER DEFAULT 0,
        total_points INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS work_sessions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id),
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feedbacks (
        id VARCHAR(50) PRIMARY KEY,
        designer_id VARCHAR(50) REFERENCES users(id),
        designer_name VARCHAR(255) NOT NULL,
        admin_name VARCHAR(255) NOT NULL,
        image_urls TEXT[],
        comment TEXT,
        created_at BIGINT NOT NULL,
        viewed BOOLEAN DEFAULT false,
        viewed_at BIGINT
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        created_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lesson_progress (
        id VARCHAR(50) PRIMARY KEY,
        lesson_id VARCHAR(50) REFERENCES lessons(id) ON DELETE CASCADE,
        designer_id VARCHAR(50) REFERENCES users(id),
        viewed BOOLEAN DEFAULT false,
        viewed_at BIGINT,
        UNIQUE(lesson_id, designer_id)
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        logo_url TEXT,
        brand_title VARCHAR(255),
        login_subtitle VARCHAR(255),
        variation_points INTEGER DEFAULT 5
      );
    `);

    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO users (id, name, password, role, avatar_url, active) VALUES
        ('d1', 'Designer 01 - Davi', '123', 'DESIGNER', 'https://ui-avatars.com/api/?name=Davi&background=8b5cf6&color=fff', true),
        ('d2', 'Designer 02 - Guilherme', '123', 'DESIGNER', 'https://ui-avatars.com/api/?name=Guilherme&background=06b6d4&color=fff', true),
        ('d3', 'Designer 03 - Paulo', '123', 'DESIGNER', 'https://ui-avatars.com/api/?name=Paulo&background=ec4899&color=fff', true),
        ('a1', 'Administrador', '123', 'ADM', 'https://ui-avatars.com/api/?name=Admin&background=1e293b&color=fff', true)
      `);
    }

    const artTypesCount = await client.query('SELECT COUNT(*) FROM art_types');
    if (parseInt(artTypesCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO art_types (id, label, points, sort_order) VALUES
        ('1', 'Arte Única', 10, 0),
        ('2', 'Feed + Storys', 25, 1),
        ('3', 'Carrossel', 40, 2),
        ('4', 'Banner Site', 30, 3),
        ('5', 'Tabela de Preços', 50, 4),
        ('6', 'Criação de Categoria', 15, 5),
        ('7', 'Variação de Formato', 5, 6),
        ('8', 'Edição de Vídeo (Reels)', 60, 7),
        ('9', 'Outros', 10, 8)
      `);
    }

    const settingsCount = await client.query('SELECT COUNT(*) FROM system_settings');
    if (parseInt(settingsCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO system_settings (id, brand_title, login_subtitle, variation_points) 
        VALUES (1, 'DesignFlow Pro', 'Sistema de Produtividade', 5)
      `);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
