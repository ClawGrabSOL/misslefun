// api/ipfs.js — proxy to pump.fun IPFS upload
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Stream the raw body straight through to pump.fun
    const response = await fetch('https://pump.fun/api/ipfs', {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'],
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://pump.fun',
        'Referer': 'https://pump.fun/',
      },
      body: req,
      duplex: 'half',
    });

    const text = await response.text();
    res.status(response.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };
