import { pool } from '../config/database';
import { AppError } from '../utils/AppError';

/**
 * Dashboard Overview Metrics Interface
 */
export interface DashboardOverviewMetrics {
  total_leads: {
    value: number;
    trend_value: number;
    trend_label: string;
    trend_period: string;
  };
  new_leads_this_month: {
    value: number;
    trend_value: number;
    trend_label: string;
    trend_percentage: boolean;
  };
  surveyed: {
    value: number;
    trend_value: number;
    trend_label: string;
  };
  closed: {
    value: number;
    trend_value: number;
    trend_label: string;
  };
}

/**
 * Get Dashboard Overview Metrics
 * @param userId - The ID of the user to get metrics for
 * @returns Dashboard overview metrics with trends
 */
export const getDashboardOverview = async (userId: string, userRole: string): Promise<DashboardOverviewMetrics> => {
  // Validate user exists
  const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userCheck.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // RBAC: Admin & Supervisor aggregate ALL leads; Sales only their own
  const isPrivilegedRole = userRole === 'Admin' || userRole === 'Supervisor';

  // Total leads (excluding cancelled)
  const totalLeadsResult = await pool.query(
    `SELECT COUNT(*) as count FROM leads WHERE (assigned_to = $1 OR $2::boolean) AND status != 'cancelled'`,
    [userId, isPrivilegedRole]
  );
  const totalLeads = parseInt(totalLeadsResult.rows[0].count, 10);

  // New leads this week
  const newLeadsThisWeekResult = await pool.query(
    `SELECT COUNT(*) as count FROM leads
     WHERE (assigned_to = $1 OR $2::boolean)
     AND created_at >= DATE_TRUNC('week', NOW())
     AND status != 'cancelled'`,
    [userId, isPrivilegedRole]
  );
  const newLeadsThisWeek = parseInt(newLeadsThisWeekResult.rows[0].count, 10);

  // New leads this month
  const newLeadsThisMonthResult = await pool.query(
    `SELECT COUNT(*) as count FROM leads
     WHERE (assigned_to = $1 OR $2::boolean)
     AND created_at >= DATE_TRUNC('month', NOW())
     AND status != 'cancelled'`,
    [userId, isPrivilegedRole]
  );
  const newLeadsThisMonth = parseInt(newLeadsThisMonthResult.rows[0].count, 10);

  // New leads last month (for percentage calculation)
  const newLeadsLastMonthResult = await pool.query(
    `SELECT COUNT(*) as count FROM leads
     WHERE (assigned_to = $1 OR $2::boolean)
     AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
     AND created_at < DATE_TRUNC('month', NOW())
     AND status != 'cancelled'`,
    [userId, isPrivilegedRole]
  );
  const newLeadsLastMonth = parseInt(newLeadsLastMonthResult.rows[0].count, 10);

  // Calculate trend percentage for new leads this month
  let newLeadsTrendPercentage = 0;
  if (newLeadsLastMonth > 0) {
    newLeadsTrendPercentage = Math.round(((newLeadsThisMonth - newLeadsLastMonth) / newLeadsLastMonth) * 100);
  } else if (newLeadsThisMonth > 0) {
    newLeadsTrendPercentage = 100; // 100% increase if going from 0 to something
  }

  // Surveyed leads (total and this week)
  const surveyedResult = await pool.query(
    `SELECT COUNT(*) as count FROM leads WHERE (assigned_to = $1 OR $2::boolean) AND status = 'surveyed'`,
    [userId, isPrivilegedRole]
  );
  const surveyed = parseInt(surveyedResult.rows[0].count, 10);

  const surveyedThisWeekResult = await pool.query(
    `SELECT COUNT(*) as count FROM leads
     WHERE (assigned_to = $1 OR $2::boolean) AND status = 'surveyed'
     AND created_at >= DATE_TRUNC('week', NOW())`,
    [userId, isPrivilegedRole]
  );
  const surveyedThisWeek = parseInt(surveyedThisWeekResult.rows[0].count, 10);

  // Closed leads (total and this week)
  const closedResult = await pool.query(
    `SELECT COUNT(*) as count FROM leads WHERE (assigned_to = $1 OR $2::boolean) AND status = 'closed'`,
    [userId, isPrivilegedRole]
  );
  const closed = parseInt(closedResult.rows[0].count, 10);

  const closedThisWeekResult = await pool.query(
    `SELECT COUNT(*) as count FROM leads
     WHERE (assigned_to = $1 OR $2::boolean) AND status = 'closed'
     AND created_at >= DATE_TRUNC('week', NOW())`,
    [userId, isPrivilegedRole]
  );
  const closedThisWeek = parseInt(closedThisWeekResult.rows[0].count, 10);

  return {
    total_leads: {
      value: totalLeads,
      trend_value: newLeadsThisWeek,
      trend_label: `+${newLeadsThisWeek}`,
      trend_period: 'this_week',
    },
    new_leads_this_month: {
      value: newLeadsThisMonth,
      trend_value: newLeadsTrendPercentage,
      trend_label: `${newLeadsTrendPercentage >= 0 ? '+' : ''}${newLeadsTrendPercentage}%`,
      trend_percentage: true,
    },
    surveyed: {
      value: surveyed,
      trend_value: surveyedThisWeek,
      trend_label: `+${surveyedThisWeek}`,
    },
    closed: {
      value: closed,
      trend_value: closedThisWeek,
      trend_label: `+${closedThisWeek}`,
    },
  };
};
