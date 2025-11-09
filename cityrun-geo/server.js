const express = require('express');
const cookieParser = require('cookie-parser');
const Redis = require('ioredis');

const app = express();
app.use(express.json());
app.use(cookieParser());

const redis = new Redis({ host: process.env.REDIS_HOST || 'cityrun-redis', port: 6379 });

app.post('/score-route', async (req, res) => {
  const { origin, dest } = req.body || {};
  if (!origin || !dest) return res.status(400).json({ error: 'origin/dest required' });

  // TODO: 실제 가중치 로직(횡단보도/경사/혼잡/야간)을 여기에 적용
  const finalScore = Math.floor(Math.random() * 100);
  res.json({ origin, dest, finalScore, timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.listen(3000, () => console.log('Geo-engine running on port 3000'));
