require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

// Env dan ulanish ma'lumotlarini o‘qish
// Agar .env da DATABASE_URL yo'q bo'lsa, uni shu yerda hosil qilamiz
const {
  DATABASE_URL,
} = process.env;

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// Pool yaratamiz
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,  // Renderda SSL talab qilinadi
  },
});

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.send('Movie Tracker API is running');
});

// 1. Barcha filmlarni olish
app.get('/movies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

// 2. ID bo‘yicha bitta filmni olish
app.get('/movies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM movies WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Film topilmadi' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

// 3. Yangi film qo‘shish
app.post('/movies', async (req, res) => {
  const { title, year, genre, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Film nomi kiritilishi shart' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO movies (title, year, genre, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, year, genre, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

// 4. Filmni tahrirlash
app.put('/movies/:id', async (req, res) => {
  const { id } = req.params;
  const { title, year, genre, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Film nomi kiritilishi shart' });
  }
  try {
    const result = await pool.query(
      'UPDATE movies SET title=$1, year=$2, genre=$3, description=$4 WHERE id=$5 RETURNING *',
      [title, year, genre, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Film topilmadi' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

// 5. Filmni o‘chirish
app.delete('/movies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM movies WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Film topilmadi' });
    }
    res.json({ message: 'Film muvaffaqiyatli o‘chirildi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
