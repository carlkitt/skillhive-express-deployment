/*
  Backfill script: create conversations for messages with NULL conversation_id.
  Usage:
    node backfill_conversations.js --dry-run   # show actions without changing DB
    node backfill_conversations.js              # actually apply changes
*/

const path = require('path');
const { query, pool } = require('../utils/mysqlQuery');

async function run(dryRun = true) {
  console.log(`[backfill] dryRun=${dryRun}`);
  try {
    // 1) find distinct unordered pairs that have messages with NULL conversation_id
    const pairsSql = `
      SELECT DISTINCT
        LEAST(from_user_id, to_user_id) AS u1,
        GREATEST(from_user_id, to_user_id) AS u2
      FROM messages
      WHERE conversation_id IS NULL
        AND from_user_id IS NOT NULL
        AND to_user_id IS NOT NULL
    `;
    const pairs = await query(pool, pairsSql);
    console.log(`[backfill] found ${pairs.length} distinct pair(s) with unlinked messages`);

    let createdConversations = 0;
    let updatedMessages = 0;

    for (const row of pairs) {
      const u1 = Number(row.u1);
      const u2 = Number(row.u2);
      if (isNaN(u1) || isNaN(u2)) continue;
      if (u1 === u2) {
        console.log(`[backfill] skipping self-pair for user ${u1}`);
        continue;
      }

      // 2) check if a direct conversation between these users already exists
      const findSql = `
        SELECT c.conversation_id FROM conversations c
        JOIN conversation_participants p1 ON c.conversation_id = p1.conversation_id AND p1.user_id = ?
        JOIN conversation_participants p2 ON c.conversation_id = p2.conversation_id AND p2.user_id = ?
        WHERE c.type = 'direct' LIMIT 1
      `;
      const found = await query(pool, findSql, [u1, u2]);
      if (found && found.length > 0 && found[0].conversation_id) {
        const existingId = found[0].conversation_id;
        console.log(`[backfill] existing conversation ${existingId} found for pair ${u1}<->${u2}`);
        // update messages to reference existing conversation
        const updSql = `UPDATE messages SET conversation_id = ? WHERE conversation_id IS NULL AND ((from_user_id=? AND to_user_id=?) OR (from_user_id=? AND to_user_id=?))`;
        if (!dryRun) {
          const res = await query(pool, updSql, [existingId, u1, u2, u2, u1]);
          // res.affectedRows may not be available; attempt to infer
          if (res && res.affectedRows !== undefined) {
            updatedMessages += res.affectedRows;
          } else if (Array.isArray(res)) {
            // some mysql libs return array; cannot determine affected count easily
            // we'll just log a generic update
            updatedMessages++;
          }
        }
        continue;
      }

      console.log(`[backfill] will create conversation for pair ${u1}<->${u2}`);
      if (dryRun) continue;

      // 3) create conversation
      const insertConvSql = `INSERT INTO conversations (type, created_at) VALUES ('direct', NOW())`;
      const insertRes = await query(pool, insertConvSql);
      // determine insertId
      const convId = (insertRes && (insertRes.insertId || (insertRes[0] && insertRes[0].insertId))) || null;
      if (!convId) {
        console.error(`[backfill] failed to create conversation for ${u1}<->${u2}`);
        continue;
      }
      createdConversations++;

      // 4) insert participants (avoid duplicates by checking existence)
      const insertPartSql = `INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)`;
      try {
        await query(pool, insertPartSql, [convId, u1, convId, u2]);
      } catch (e) {
        console.warn(`[backfill] warning inserting participants for conv ${convId}:`, e && e.message ? e.message : e);
      }

      // 5) update messages for this pair
      const updSql2 = `UPDATE messages SET conversation_id = ? WHERE conversation_id IS NULL AND ((from_user_id=? AND to_user_id=?) OR (from_user_id=? AND to_user_id=?))`;
      try {
        const updRes = await query(pool, updSql2, [convId, u1, u2, u2, u1]);
        if (updRes && updRes.affectedRows !== undefined) updatedMessages += updRes.affectedRows;
      } catch (e) {
        console.error(`[backfill] failed to update messages for conv ${convId}:`, e && e.message ? e.message : e);
      }

      console.log(`[backfill] created conversation ${convId} for ${u1}<->${u2}`);
    }

    console.log(`[backfill] complete. createdConversations=${createdConversations}, updatedMessages=${updatedMessages}`);
  } catch (err) {
    console.error('[backfill] error', err && err.message ? err.message : err);
  } finally {
    try {
      // gracefully end pool connections if supported
      if (pool && pool.end) pool.end(() => {});
    } catch (_) {}
  }
}

// parse args
const args = process.argv.slice(2);
const dry = args.includes('--dry-run') || args.includes('-d') || args.includes('dry-run');
run(dry);
