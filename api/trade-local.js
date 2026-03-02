// api/trade-local.js — proxy to pump.fun trade API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const response = await fetch('https://pump.fun/api/trade-local', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://pump.fun',
        'Referer': 'https://pump.fun/',
      },
      body: JSON.stringify(req.body),
    });

    const buf = await response.arrayBuffer();
    res.status(response.status)
      .setHeader('Content-Type', 'application/octet-stream')
      .send(Buffer.from(buf));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
