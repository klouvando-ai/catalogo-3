
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static(UPLOADS_DIR));

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Benvindo199380@',
  database: process.env.DB_NAME || 'catalogo',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    const connection = await pool.getConnection();
    
    // Tabela Referências
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`references\` (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        category VARCHAR(100),
        sizeRange VARCHAR(50),
        priceRepresentative DECIMAL(10, 2),
        priceSacoleira DECIMAL(10, 2),
        colors JSON,
        createdAt BIGINT
      )
    `);

    // Tabela Produtos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`products\` (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        fabric VARCHAR(255),
        categoryIds JSON,
        images JSON,
        coverImageIndex INT DEFAULT 0,
        isFeatured BOOLEAN DEFAULT FALSE,
        referenceIds JSON,
        createdAt BIGINT
      )
    `);

    // Tabela Categorias
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`categories\` (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        orderIndex INT DEFAULT 0
      )
    `);

    // Tabela Usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        createdAt BIGINT
      )
    `);

    // Dados iniciais de Categorias se estiver vazio
    const [cats] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (cats[0].count === 0) {
      const initialCats = ['Lançamentos', 'Vestidos', 'Conjuntos', 'Blusas', 'Calças', 'Camisetas', 'Promoção'];
      for (let i = 0; i < initialCats.length; i++) {
        await connection.query('INSERT INTO categories (id, name, orderIndex) VALUES (?, ?, ?)', [crypto.randomUUID(), initialCats[i], i]);
      }
    }

    // Usuário admin inicial se estiver vazio
    const [usrs] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (usrs[0].count === 0) {
      await connection.query('INSERT INTO users (id, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)', 
        [crypto.randomUUID(), 'kavinsadmin', 'admka2026', 'ADMIN', Date.now()]);
    }

    connection.release();
    console.log('Banco de dados pronto.');
  } catch (err) {
    console.error('Erro DB:', err.message);
  }
}

initDB();

// Endpoints Categorias
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY orderIndex ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { id, name, orderIndex } = req.body;
    await pool.query('INSERT INTO categories (id, name, orderIndex) VALUES (?, ?, ?)', [id, name, orderIndex]);
    res.status(201).json(req.body);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, orderIndex } = req.body;
    await pool.query('UPDATE categories SET name=?, orderIndex=? WHERE id=?', [name, orderIndex, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoints Usuários
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, role, createdAt FROM users ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, username, password, role, createdAt } = req.body;
    await pool.query('INSERT INTO users (id, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)', [id, username, password, role, createdAt]);
    res.status(201).json(req.body);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (password) {
      await pool.query('UPDATE users SET username=?, password=?, role=? WHERE id=?', [username, password, role, req.params.id]);
    } else {
      await pool.query('UPDATE users SET username=?, role=? WHERE id=?', [username, role, req.params.id]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT username, role FROM users WHERE username=? AND password=?', [username, password]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(401).json({ error: 'Invalido' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Referências
app.get('/api/references', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM \`references\` ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching references:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/references', async (req, res) => {
  try {
    const { id, code, name, category, sizeRange, priceRepresentative, priceSacoleira, colors, createdAt } = req.body;
    await pool.query('INSERT INTO \`references\` (id, code, name, category, sizeRange, priceRepresentative, priceSacoleira, colors, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, code, name, category, sizeRange, priceRepresentative, priceSacoleira, colors || null, createdAt]);
    res.status(201).json(req.body);
  } catch (error) {
    console.error('Error creating reference:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/references/:id', async (req, res) => {
  try {
    const { code, name, category, sizeRange, priceRepresentative, priceSacoleira, colors } = req.body;
    await pool.query('UPDATE \`references\` SET code=?, name=?, category=?, sizeRange=?, priceRepresentative=?, priceSacoleira=?, colors=? WHERE id=?',
      [code, name, category, sizeRange, priceRepresentative, priceSacoleira, colors || null, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating reference:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/references/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM \`references\` WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting reference:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Produtos
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM \`products\` ORDER BY isFeatured DESC, createdAt DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { id, name, description, fabric, categoryIds, images, coverImageIndex, isFeatured, referenceIds, createdAt } = req.body;
    await pool.query('INSERT INTO \`products\` (id, name, description, fabric, categoryIds, images, coverImageIndex, isFeatured, referenceIds, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, description, fabric, categoryIds || null, images || null, coverImageIndex, isFeatured, referenceIds || null, createdAt]);
    res.status(201).json(req.body);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, description, fabric, categoryIds, images, coverImageIndex, isFeatured, referenceIds } = req.body;
    await pool.query('UPDATE \`products\` SET name=?, description=?, fabric=?, categoryIds=?, images=?, coverImageIndex=?, isFeatured=?, referenceIds=? WHERE id=?',
      [name, description, fabric, categoryIds || null, images || null, coverImageIndex, isFeatured, referenceIds || null, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error updating product ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM \`products\` WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado. Use JPG, PNG ou WEBP.'), false);
  }
};

const upload = multer({ storage, fileFilter });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Sem arquivo ou formato inválido' });
  res.json({ url: `/api/uploads/${req.file.filename}` });
});

app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
