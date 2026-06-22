/*
  server.js — Minimal MySQL bridge for Social Media DB Viewer
  ============================================================
  Uses ONLY Node.js built-in 'http' module + mysql2.
  NO Express. NO frameworks. Plain Node.
*/

'use strict';

const http   = require('http');

// ── HTTP server ───────────────────────────────────────────────────────────────
const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // Allow browser to call this server (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'running' }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found: ' + req.url }));
});

server.listen(PORT, () => {
  console.log('✅  Social Media DB server running → http://localhost:' + PORT);
});
