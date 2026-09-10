-- Migration: 011_seed_reminder_schedules
-- Description: Seed reminder_schedules synced with leads.next_follow_up_at
-- Created: 2026-09-10
-- Database: PostgreSQL 15+

-- ============================================================================
-- 1. Refresh upcoming follow-up dates on a curated subset of active leads
--    Purpose: Pick ~7 random active leads per sales user (sales, sales2, sales3)
--             and spread their next_follow_up_at across the next 7 days so the
--             dashboard "Upcoming Reminders" has data for every role.
-- ============================================================================
UPDATE leads l
SET next_follow_up_at = NOW() + ((random() * 7 * 24) || ' hours')::INTERVAL,
    updated_at = NOW()
WHERE l.id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY assigned_to ORDER BY random()) AS rn
        FROM leads
        WHERE assigned_to IN (
            SELECT id FROM users WHERE email IN
                ('sales@example.com', 'sales2@example.com', 'sales3@example.com')
        )
          AND status NOT IN ('closed', 'cancelled')
    ) t
    WHERE rn <= 7
);

-- ============================================================================
-- 2. Insert reminder_schedules synced with leads
--    Purpose: For every lead with a future next_follow_up_at that has no
--             reminder yet, create a reminder owned by the lead's assignee
--             (user_id = leads.assigned_to) so RBAC works:
--             - Sales  -> sees only reminders of their own leads
--             - Admin/Supervisor -> sees all reminders
-- ============================================================================
INSERT INTO reminder_schedules (user_id, lead_id, remind_at, message, is_completed)
SELECT
    l.assigned_to,
    l.id,
    l.next_follow_up_at,
    'Follow up: ' || COALESCE(NULLIF(l.notes, ''), 'Kontak lead untuk langkah berikutnya'),
    false
FROM leads l
WHERE l.next_follow_up_at > NOW()
  AND l.status NOT IN ('closed', 'cancelled')
  AND NOT EXISTS (
      SELECT 1 FROM reminder_schedules rs WHERE rs.lead_id = l.id
  );

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Total seeded reminders
-- SELECT count(*) AS total FROM reminder_schedules;

-- Reminders per owner
-- SELECT u.email, count(*) AS total
-- FROM reminder_schedules rs JOIN users u ON rs.user_id = u.id
-- GROUP BY u.email ORDER BY total DESC;

-- Reminders that are NOT synced with their lead's next_follow_up_at
-- SELECT count(*) AS unsynced
-- FROM reminder_schedules rs JOIN leads l ON rs.lead_id = l.id
-- WHERE rs.remind_at <> l.next_follow_up_at OR rs.user_id <> l.assigned_to;