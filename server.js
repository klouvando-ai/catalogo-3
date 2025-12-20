
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Garantir diretórios
[DATA_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const REFS_FILE = path.join(DATA_DIR, 'references.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

// Helpers de persistência
const readJSON = (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static(UPLOADS_DIR));

// Configuração do Multer para Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// API Endpoints: Referências
app.get('/api/references', (req, res) => res.json(readJSON(REFS_FILE)));
app.post('/api/references', (req, res) => {
  const refs = readJSON(REFS_FILE);
  refs.push(req.body);
  writeJSON(REFS_FILE, refs);
  res.status(201).json(req.body);
});
app.put('/api/references/:id', (req, res) => {
  let refs = readJSON(REFS_FILE);
  refs = refs.map(r => r.id === req.params.id ? { ...r, ...req.body } : r);
  writeJSON(REFS_FILE, refs);
  res.json({ success: true });
});
app.delete('/api/references/:id', (req, res) => {
  let refs = readJSON(REFS_FILE);
  refs = refs.filter(r => r.id !== req.params.id);
  writeJSON(REFS_FILE, refs);
  res.json({ success: true });
});

// API Endpoints: Produtos
app.get('/api/products', (req, res) => res.json(readJSON(PRODUCTS_FILE)));
app.post('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  products.push(req.body);
  writeJSON(PRODUCTS_FILE, products);
  res.status(201).json(req.body);
});
app.put('/api/products/:id', (req, res) => {
  let products = readJSON(PRODUCTS_FILE);
  products = products.map(p => p.id === req.params.id ? { ...p, ...req.body } : p);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true });
});
app.delete('/api/products/:id', (req, res) => {
  let products = readJSON(PRODUCTS_FILE);
  products = products.filter(p => p.id !== req.params.id);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ success: true });
});

// Upload de Imagem
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url });
});

app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
