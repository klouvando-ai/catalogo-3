
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Garantir diretório de uploads
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static(UPLOADS_DIR));

// Configuração da Conexão MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Inicialização do Banco de Dados
async function initDB() {
  try {
    const connection = await pool.getConnection();
    console.log('Conectado ao MySQL com sucesso.');

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

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`products\` (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        fabric VARCHAR(255),
        category VARCHAR(100),
        images JSON,
        coverImageIndex INT DEFAULT 0,
        isFeatured BOOLEAN DEFAULT FALSE,
        referenceIds JSON,
        createdAt BIGINT
      )
    `);

    connection.release();
    console.log('Tabelas verificadas/criadas.');
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err.message);
  }
}

initDB();

// Configuração do Multer para Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// API: Referências
app.get('/api/references', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM \`references\` ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/references', async (req, res) => {
  try {
    const { id, code, name, category, sizeRange, priceRepresentative, priceSacoleira, colors, createdAt } = req.body;
    await pool.query(
      'INSERT INTO \`references\` (id, code, name, category, sizeRange, priceRepresentative, priceSacoleira, colors, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, code, name, category, sizeRange, priceRepresentative, priceSacoleira, JSON.stringify(colors), createdAt]
    );
    res.status(201).json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/references/:id', async (req, res) => {
  try {
    const { code, name, category, sizeRange, priceRepresentative, priceSacoleira, colors } = req.body;
    await pool.query(
      'UPDATE \`references\` SET code=?, name=?, category=?, sizeRange=?, priceRepresentative=?, priceSacoleira=?, colors=? WHERE id=?',
      [code, name, category, sizeRange, priceRepresentative, priceSacoleira, JSON.stringify(colors), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/references/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM \`references\` WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Produtos
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM \`products\` ORDER BY isFeatured DESC, createdAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { id, name, description, fabric, category, images, coverImageIndex, isFeatured, referenceIds, createdAt } = req.body;
    await pool.query(
      'INSERT INTO \`products\` (id, name, description, fabric, category, images, coverImageIndex, isFeatured, referenceIds, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, description, fabric, category, JSON.stringify(images), coverImageIndex, isFeatured, JSON.stringify(referenceIds), createdAt]
    );
    res.status(201).json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, description, fabric, category, images, coverImageIndex, isFeatured, referenceIds } = req.body;
    await pool.query(
      'UPDATE \`products\` SET name=?, description=?, fabric=?, category=?, images=?, coverImageIndex=?, isFeatured=?, referenceIds=? WHERE id=?',
      [name, description, fabric, category, JSON.stringify(images), coverImageIndex, isFeatured, JSON.stringify(referenceIds), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM \`products\` WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload de Imagem
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url });
});

app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
