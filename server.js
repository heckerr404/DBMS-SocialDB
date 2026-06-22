/*
  server.js — Minimal MySQL bridge for Social Media DB Viewer
  ============================================================
  Uses ONLY Node.js built-in 'http' module + mysql2.
  NO Express. NO frameworks. Plain Node.

  Run:  node server.js
  Then: open index.html in your browser (or double-click it)

  Docker MySQL:
    Host     : localhost
    Port     : 3306
    User     : root
    Password : secretpassword
    Database : social_media_db
  ============================================================
*/

'use strict';

const http   = require('http');
const mysql2 = require('mysql2/promise');

let poolConfig = {
  host              : process.env.DB_HOST || 'localhost',
  port              : Number(process.env.DB_PORT) || 3306,
  user              : process.env.DB_USER || 'root',
  password          : process.env.DB_PASSWORD || 'secretpassword',
  database          : process.env.DB_DATABASE || 'social_media_db',
  dateStrings       : true,   // return DATE/DATETIME as "YYYY-MM-DD" strings, not JS Date objects
  waitForConnections: true,
  connectionLimit   : 10
};

if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    poolConfig.host = parsed.hostname;
    poolConfig.port = Number(parsed.port) || 3306;
    poolConfig.user = parsed.username;
    poolConfig.password = decodeURIComponent(parsed.password || '');
    poolConfig.database = parsed.pathname.replace(/^\//, '');
  } catch (e) {
    console.error('Failed to parse DATABASE_URL, using default pool config:', e.message);
  }
}

const pool = mysql2.createPool(poolConfig);

// ── Helper: run a query and return rows ───────────────────────────────────────
async function query(sql) {
  const [rows] = await pool.execute(sql);
  return rows;
}

// ── All queries ───────────────────────────────────────────────────────────────

/*
  Feed — posts with username, likes, comment count
  SQL:
    SELECT U.Username, P.Content, P.Post_Date, P.Visibility,
           COUNT(DISTINCT PL.User_ID) AS Likes,
           COUNT(DISTINCT C.Comment_ID) AS Comments
    FROM POST P
    JOIN USER U ON P.User_ID = U.User_ID
    LEFT JOIN POST_LIKE PL ON P.Post_ID = PL.Post_ID
    LEFT JOIN COMMENT C ON P.Post_ID = C.Post_ID
    GROUP BY P.Post_ID
    ORDER BY P.Post_Date DESC;
*/
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

/*
  Users — with post count and follower count
  SQL:
    SELECT U.Username, U.Full_Name, U.Bio,
           COUNT(DISTINCT P.Post_ID)   AS Total_Posts,
           COUNT(DISTINCT F.Follower_ID) AS Followers
    FROM USER U
    LEFT JOIN POST    P ON U.User_ID = P.User_ID
    LEFT JOIN FOLLOWS F ON U.User_ID = F.Following_ID
    GROUP BY U.User_ID;
*/
async function getUsers() {
  return query(`
    SELECT U.Username, U.Full_Name, U.Bio,
           COUNT(DISTINCT P.Post_ID)     AS Total_Posts,
           COUNT(DISTINCT F.Follower_ID) AS Followers
    FROM USER U
    LEFT JOIN POST    P ON U.User_ID = P.User_ID
    LEFT JOIN FOLLOWS F ON U.User_ID = F.Following_ID
    GROUP BY U.User_ID
  `);
}

/*
  Hashtags — with post count, sorted by popularity
  SQL:
    SELECT H.Tag_Name, COUNT(PH.Post_ID) AS Post_Count
    FROM HASHTAG H
    LEFT JOIN POST_HASHTAG PH ON H.Hashtag_ID = PH.Hashtag_ID
    GROUP BY H.Hashtag_ID
    ORDER BY Post_Count DESC;
*/
async function getHashtags() {
  return query(`
    SELECT H.Tag_Name, COUNT(PH.Post_ID) AS Post_Count
    FROM HASHTAG H
    LEFT JOIN POST_HASHTAG PH ON H.Hashtag_ID = PH.Hashtag_ID
    GROUP BY H.Hashtag_ID
    ORDER BY Post_Count DESC
  `);
}

/*
  Groups — with member count
  SQL:
    SELECT G.Group_Name, G.Description,
           COUNT(GM.User_ID) AS Members
    FROM USER_GROUP G
    LEFT JOIN GROUP_MEMBERSHIP GM ON G.Group_ID = GM.Group_ID
    GROUP BY G.Group_ID;
*/
async function getGroups() {
  return query(`
    SELECT G.Group_Name, G.Description,
           COUNT(GM.User_ID) AS Members
    FROM USER_GROUP G
    LEFT JOIN GROUP_MEMBERSHIP GM ON G.Group_ID = GM.Group_ID
    GROUP BY G.Group_ID
  `);
}

/*
  Stats — five scalar queries + four detail queries
*/
async function getStats() {

  // SELECT COUNT(*) AS Total_Users FROM USER;
  const [usersRow]    = await query('SELECT COUNT(*) AS v FROM USER');

  // SELECT COUNT(*) AS Total_Posts FROM POST;
  const [postsRow]    = await query('SELECT COUNT(*) AS v FROM POST');

  // SELECT COUNT(*) AS Total_Comments FROM COMMENT;
  const [commRow]     = await query('SELECT COUNT(*) AS v FROM COMMENT');

  // SELECT COUNT(*) AS Total_Messages FROM MESSAGE;
  const [msgRow]      = await query('SELECT COUNT(*) AS v FROM MESSAGE');

  // SELECT MAX(Post_Date) AS Latest_Post FROM POST;
  const [latestRow]   = await query('SELECT MAX(Post_Date) AS v FROM POST');

  // SELECT MIN(Date_Joined) AS First_User FROM USER;
  const [firstRow]    = await query('SELECT MIN(Date_Joined) AS v FROM USER');

  // -- Users with more than 1 post (GROUP BY + HAVING)
  const activeUsers   = await query(`
    SELECT U.Username, COUNT(P.Post_ID) AS Total_Posts
    FROM USER U
    JOIN POST P ON U.User_ID = P.User_ID
    GROUP BY U.User_ID
    HAVING COUNT(P.Post_ID) > 1
    ORDER BY Total_Posts DESC
  `);

  // -- Posts with more than 1 comment (Nested Query)
  const commentedPosts = await query(`
    SELECT P.Content, P.Post_Date
    FROM POST P
    WHERE P.Post_ID IN (
      SELECT Post_ID FROM COMMENT
      GROUP BY Post_ID
      HAVING COUNT(*) > 1
    )
  `);

  // -- Users who have created posts (Nested Query)
  const posters = await query(`
    SELECT Username FROM USER
    WHERE User_ID IN (SELECT User_ID FROM POST)
  `);

  // -- View query
  let viewRows = [];
  try {
    viewRows = await query('SELECT * FROM User_Posts LIMIT 10');
  } catch (e) {
    viewRows = [];
  }

  return {
    Total_Users   : usersRow.v,
    Total_Posts   : postsRow.v,
    Total_Comments: commRow.v,
    Total_Messages: msgRow.v,
    Latest_Post   : latestRow.v ? latestRow.v.toString().split('T')[0] : '—',
    First_User    : firstRow.v  ? firstRow.v.toString().split('T')[0]  : '—',
    activeUsers,
    commentedPosts,
    posters,
    viewRows
  };
}

// ── Route table ───────────────────────────────────────────────────────────────
const ROUTES = {
  '/api/feed'    : getFeed,
  '/api/users'   : getUsers,
  '/api/hashtags': getHashtags,
  '/api/groups'  : getGroups,
  '/api/stats'   : getStats
};

// ── HTTP server ───────────────────────────────────────────────────────────────
const PORT = 3001;

const serverHandler = async (req, res) => {
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
    console.error('Query error:', err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
};

module.exports = serverHandler;

if (require.main === module) {
  const server = http.createServer(serverHandler);
  server.listen(PORT, () => {
    console.log('✅  Social Media DB server running → http://localhost:' + PORT);
  });
}
