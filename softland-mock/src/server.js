'use strict';

const express = require('express');
const products = require('./data');

const PORT = process.env.PORT || 4000;
const SOFTLAND_API_KEY = process.env.SOFTLAND_API_KEY || 'softland-dev-key';

const app = express();
app.use(express.json());

// `/health` stays unauthenticated on purpose, same reasoning as a real
// ERP's liveness probe: something has to be checkable before trusting it
// with credentials.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

function requireApiKey(req, res, next) {
  if (req.get('x-api-key') !== SOFTLAND_API_KEY) {
    res.status(401).json({ error: { type: 'UnauthorizedError', message: 'Invalid or missing x-api-key' } });
    return;
  }
  next();
}

app.use('/api', requireApiKey);

app.get('/api/products', (req, res) => {
  res.status(200).json(products);
});

app.post('/api/products/sync', (req, res) => {
  const received = Array.isArray(req.body) ? req.body.length : 0;
  res.status(200).json({ received, status: 'ok' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`softland-mock listening on port ${PORT}`);
});

module.exports = app;
