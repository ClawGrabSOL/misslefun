const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── Persistent storage: launched.json ──
const DB_FILE = path.join(__dirname, 'launched.json');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return {}; }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ── GET /api/launched — return all launched countries ──
app.get('/api/launched', (req, res) => {
  res.json(loadDB());
});

// ── POST /api/launched — mark a country as launched ──
app.post('/api/launched', (req, res) => {
  const { country, ticker, flag, mint, wallet } = req.body;
  if (!country || !mint) return res.status(400).json({ error: 'Missing fields' });

  const db = loadDB();
  if (db[country]) {
    return res.status(409).json({ error: 'Already launched', data: db[country] });
  }

  db[country] = {
    country, ticker, flag, mint, wallet,
    launchedAt: new Date().toISOString(),
    pumpUrl: `https://pump.fun/${mint}`,
  };
  saveDB(db);
  console.log(`✅ Launched: ${flag} ${country} ($${ticker}) → ${mint}`);
  res.json({ ok: true, data: db[country] });
});

// ── POST /api/ipfs — proxy to pump.fun IPFS upload ──
app.post('/api/ipfs', async (req, res) => {
  try {
    // Forward the raw multipart form to pump.fun
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', async () => {
      const body = Buffer.concat(chunks);
      const response = await fetch('https://pump.fun/api/ipfs', {
        method: 'POST',
        headers: {
          'Content-Type': req.headers['content-type'],
          'Content-Length': body.length,
          'User-Agent': 'Mozilla/5.0',
          'Origin': 'https://pump.fun',
          'Referer': 'https://pump.fun/',
        },
        body,
      });
      const text = await response.text();
      res.status(response.status).set('Content-Type', 'application/json').send(text);
    });
  } catch (e) {
    console.error('IPFS proxy error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/trade-local — proxy to pump.fun trade API ──
app.post('/api/trade-local', async (req, res) => {
  try {
    const response = await fetch('https://pump.fun/api/trade-local', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://pump.fun',
        'Referer': 'https://pump.fun/',
      },
      body: JSON.stringify(req.body),
    });
    const buf = await response.buffer();
    res.status(response.status).set('Content-Type', 'application/octet-stream').send(buf);
  } catch (e) {
    console.error('Trade proxy error:', e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 MISSILE.FUN server running at http://localhost:${PORT}`);
  console.log(`📁 launched.json tracks all deployed tokens\n`);
});
