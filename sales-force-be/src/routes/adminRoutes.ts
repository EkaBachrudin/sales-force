import { Router } from 'express';
import { runCleanupJob } from '../jobs/cleanupSessions';

const router = Router();

/**
 * POST /api/v1/admin/cleanup-sessions
 * Manually trigger session cleanup (admin only)
 */
router.post('/cleanup-sessions', async (_req, res) => {
  try {
    await runCleanupJob();
    res.status(200).json({
      success: true,
      message: 'Cleanup job completed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Cleanup job failed',
    });
  }
});

export default router;
