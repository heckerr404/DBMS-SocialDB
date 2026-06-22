/*
  server.js — Minimal MySQL bridge for Social Media DB Viewer
  ============================================================
  Uses ONLY Node.js built-in 'http' module + mysql2.
  NO Express. NO frameworks. Plain Node.
*/

'use strict';

const http   = require('http');
const mysql2 = require('mysql2/promise');

// ── MySQL connection pool ──────────────────────────────────────────────────────
const pool = mysql2.createPool({
  host    : 'localhost',
  port    : 3306,
  user    : 'root',
  password: 'secretpassword',
  database: 'social_media_db',
  waitForConnections: true,
  connectionLimit   : 10
});

// ── Helper: run a query and return rows ───────────────────────────────────────
async function query(sql) {
  const [rows] = await pool.execute(sql);
  return rows;
}

async function getFeed() {
  return query(`
    SELECT U.Username, P.Content, P.Post_Date, P.Visibility,
           COUNT(DISTINCT PL.User_ID)   AS Likes,
           COUNT(DISTINCT C.Comment_ID) AS Comments
    FROM POST P
    JOIN USER U ON P.User_ID = U.User_ID
    LEFT JOIN POST_LIKE PL ON P.Post_ID = PL.Post_ID
    LEFT JOIN COMMENT   C  ON P.Post_ID = C.Post_ID
    GROUP BY P.Post_ID
    ORDER BY P.Post_Date DESC
  `);
}

const ROUTES = {
  '/api/feed'    : getFeed
};

// ── HTTP server ───────────────────────────────────────────────────────────────
const PORT = 3001;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const handler = ROUTES[req.url];

  if (!handler) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found: ' + req.url }));
    return;
  }

  try {
    const data = await handler();
    res.writeHead(200);
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log('✅  Social Media DB server running → http://localhost:' + PORT);
});
