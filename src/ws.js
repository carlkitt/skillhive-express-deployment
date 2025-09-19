const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('./config/secret');
const { query, pool } = require('./utils/mysqlQuery');

// Map userId => ws
const clients = new Map();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/socket' });

  wss.on('connection', (ws, req) => {
    // Expect token as query param ?token=...
    const params = new URLSearchParams(req.url.replace('/socket?', ''));
    const token = params.get('token') || null;
    if (!token) {
      ws.close(4001, 'Missing token');
      return;
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      ws.close(4002, 'Invalid token');
      return;
    }

    const userId = payload.userId;
    console.log('WS connected for user', userId);
    clients.set(String(userId), ws);

    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch (e) {
        console.warn('WS: received non-json message, ignoring');
        return;
      }
      // debug: show incoming payload
      try {
        console.log('WS recv payload:', JSON.stringify(msg));
      } catch (_) {}

      // expected shape: { to: userId, text: 'hi', conversation_id?: int, metadata?: obj, content_type?: 'text' }
      const { to, text } = msg;
      if (!to || !text) {
        console.log('WS: ignoring message with missing to/text', { to, text });
        return;
      }
      const out = JSON.stringify({ from: userId, text, time: new Date().toISOString() });

      // deliver to connected recipient if present
      const target = clients.get(String(to));
      if (target && target.readyState === WebSocket.OPEN) {
        target.send(out);
      }

      // persist message (best-effort, non-blocking)
      try {
        let conversationId = msg.conversation_id || null;
        const contentType = msg.content_type || 'text';
        const metadata = msg.metadata ? JSON.stringify(msg.metadata) : null;

        // If no conversation id provided, try to find or create a direct conversation
        if (!conversationId) {
          try {
            const sqlFind = `
              SELECT c.conversation_id FROM conversations c
              JOIN conversation_participants p1 ON c.conversation_id = p1.conversation_id AND p1.user_id = ?
              JOIN conversation_participants p2 ON c.conversation_id = p2.conversation_id AND p2.user_id = ?
              WHERE c.type = 'direct' LIMIT 1`;
            const rows = await query(pool, sqlFind, [userId, to]);
            if (rows && rows.length > 0) {
              conversationId = rows[0].conversation_id;
            } else {
              // create conversation and participants
              const sqlCreate = `INSERT INTO conversations (type, created_at) VALUES ('direct', NOW())`;
              const createRes = await query(pool, sqlCreate);
              const newConvId = createRes && (createRes.insertId || (createRes[0] && createRes[0].insertId));
              if (newConvId) {
                const sqlPart = `INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)`;
                await query(pool, sqlPart, [newConvId, userId, newConvId, to]);
                conversationId = newConvId;
                console.log('WS created new conversation', conversationId, 'for', userId, to);
              }
            }
          } catch (e) {
            console.error('Failed to ensure conversation:', e && e.message ? e.message : e);
          }
        }

        const sql = `INSERT INTO messages (conversation_id, from_user_id, to_user_id, content, content_type, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`;
        // debug: show sql params
        try { console.log('WS persist params:', { conversationId, from: userId, to, text, contentType, metadata }); } catch(_) {}
        // fire-and-forget; log errors
        query(pool, sql, [conversationId, userId, to, text, contentType, metadata]).catch(err => {
          console.error('Failed to persist message:', err && err.message ? err.message : err);
        });
      } catch (e) {
        console.error('Message persist error', e && e.message ? e.message : e);
      }
    });

    ws.on('close', () => {
      console.log('WS disconnected for user', userId);
      clients.delete(String(userId));
    });
  });

  return wss;
}

module.exports = { setupWebSocket };
