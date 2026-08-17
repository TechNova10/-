require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false });

app.use(cors({ origin: true }));
app.use(express.json({ limit: "8mb" }));

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      old_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      rating NUMERIC(3,1) NOT NULL DEFAULT 0,
      reviews INTEGER NOT NULL DEFAULT 0,
      sold INTEGER NOT NULL DEFAULT 0,
      discount TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'gamer',
      art TEXT NOT NULL DEFAULT '📦',
      image TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function normalizeProduct(p) {
  return {
    id: Number(p.id),
    name: p.name,
    price: Number(p.price),
    old: Number(p.old_price ?? p.old ?? p.price),
    stock: Number(p.stock ?? 0),
    rating: Number(p.rating ?? 0),
    reviews: Number(p.reviews ?? 0),
    sold: Number(p.sold ?? 0),
    discount: p.discount || "",
    description: p.description || "",
    category: p.category || "gamer",
    art: p.art || "📦",
    image: p.image || "",
    active: p.active !== false
  };
}

app.get("/api/health", async (req, res) => {
  try { await pool.query("SELECT 1"); res.json({ ok: true, database: "connected" }); }
  catch (e) { res.status(500).json({ ok: false, error: "Database unavailable" }); }
});

app.get("/api/products", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products WHERE active = TRUE ORDER BY created_at DESC");
    res.json(rows.map(normalizeProduct));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Não foi possível carregar os produtos." });
  }
});

app.get("/api/admin/products", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    res.json(rows.map(normalizeProduct));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Não foi possível carregar os produtos." });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const p = req.body;
    if (!p.name || Number.isNaN(Number(p.price))) return res.status(400).json({ error: "Nome e preço são obrigatórios." });
    const { rows } = await pool.query(`
      INSERT INTO products (name, price, old_price, stock, rating, reviews, sold, discount, description, category, art, image, active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [p.name, Number(p.price), Number(p.old ?? p.price), Number(p.stock ?? 0), Number(p.rating ?? 0), Number(p.reviews ?? 0), Number(p.sold ?? 0), p.discount || "", p.description || "", p.category || "gamer", p.art || "📦", p.image || "", p.active !== false]);
    res.status(201).json(normalizeProduct(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Não foi possível criar o produto." });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = req.body;
    const { rows } = await pool.query(`
      UPDATE products SET name=$1, price=$2, old_price=$3, stock=$4, rating=$5, reviews=$6, sold=$7,
      discount=$8, description=$9, category=$10, art=$11, image=$12, active=$13, updated_at=NOW()
      WHERE id=$14 RETURNING *
    `, [p.name, Number(p.price), Number(p.old ?? p.price), Number(p.stock ?? 0), Number(p.rating ?? 0), Number(p.reviews ?? 0), Number(p.sold ?? 0), p.discount || "", p.description || "", p.category || "gamer", p.art || "📦", p.image || "", p.active !== false, id]);
    if (!rows.length) return res.status(404).json({ error: "Produto não encontrado." });
    res.json(normalizeProduct(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Não foi possível atualizar o produto." });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query("DELETE FROM products WHERE id=$1", [id]);
    if (!result.rowCount) return res.status(404).json({ error: "Produto não encontrado." });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Não foi possível excluir o produto." });
  }
});

initDb()
  .then(() => app.listen(PORT, () => console.log(`TechNova API rodando na porta ${PORT}`)))
  .catch(err => { console.error("Falha ao iniciar banco:", err); process.exit(1); });
