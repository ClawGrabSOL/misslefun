// api/launched.js — Vercel serverless function
// Uses Upstash Redis for persistence (free tier)
// Set env vars: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const DB_KEY = 'misslefun:launched';

async function redisCmd(...args) {
  const res = await fetch(`${REDIS_URL}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  const data = await res.json();
  return data.result;
}

async function getDB() {
  if (!REDIS_URL) return {}; // fallback: in-memory (resets on cold start)
  const raw = await redisCmd('GET', DB_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function setDB(db) {
  if (!REDIS_URL) return;
  await redisCmd('SET', DB_KEY, JSON.stringify(db));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const db = await getDB();
    return res.status(200).json(db);
  }

  if (req.method === 'POST') {
    const { country, ticker, flag, mint, wallet } = req.body;
    if (!country || !mint) return res.status(400).json({ error: 'Missing fields' });

    const db = await getDB();
    if (db[country]) return res.status(409).json({ error: 'Already launched', data: db[country] });

    db[country] = {
      country, ticker, flag, mint, wallet,
      launchedAt: new Date().toISOString(),
      pumpUrl: `https://pump.fun/${mint}`,
    };
    await setDB(db);
    return res.status(200).json({ ok: true, data: db[country] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
