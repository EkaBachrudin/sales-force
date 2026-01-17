import { pool } from '../config/database';

/**
 * Cleanup expired sessions and revoked tokens
 * Run this periodically (e.g., daily via cron)
 */
export const cleanupExpiredSessions = async (): Promise<{ sessionsDeleted: number; tokensDeleted: number }> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete expired sessions (expired more than 30 days ago)
    const sessionsResult = await client.query(
      `DELETE FROM user_sessions
       WHERE expires_at < NOW() - INTERVAL '30 days'
       RETURNING id`
    );

    // Delete expired revoked tokens
    const tokensResult = await client.query(
      `DELETE FROM revoked_tokens
       WHERE expires_at < NOW()
       RETURNING id`
    );

    await client.query('COMMIT');

    return {
      sessionsDeleted: sessionsResult.rowCount || 0,
      tokensDeleted: tokensResult.rowCount || 0,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Run cleanup job (call this periodically)
 */
export const runCleanupJob = async (): Promise<void> => {
  try {
    const result = await cleanupExpiredSessions();
    console.log('[Cleanup] Deleted sessions:', result.sessionsDeleted);
    console.log('[Cleanup] Deleted tokens:', result.tokensDeleted);
  } catch (error) {
    console.error('[Cleanup] Error:', error);
  }
};
