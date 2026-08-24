import { useState } from 'react';
import { Plus, Users, Calendar, ClipboardCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { RemindersSection, type Reminder } from '@/components/dashboard/RemindersSection';
import { NewLeadModal } from '@/components/dashboard/NewLeadModal';
import { Button } from '@/components/ui/Button';
import { useDashboardOverview, useUpcomingReminders, type ReminderItem } from '@/hooks/useDashboard';
import { useLeadMutations } from '@/hooks/useLeads';
import './DashboardPage.css';

// Transform API reminder to component format
const transformReminder = (apiReminder: ReminderItem): Reminder => ({
  id: apiReminder.id,
  leadId: apiReminder.lead.id,
  leadName: apiReminder.lead.name,
  leadPhone: apiReminder.lead.phone,
  property: apiReminder.lead.property
    ? `${apiReminder.lead.property.name}, ${apiReminder.lead.property.property_type}`
    : 'No property',
  scheduledFor: apiReminder.remind_at,
  type: 'follow-up',
  notes: apiReminder.message,
});

export default function DashboardPage() {
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useDashboardOverview();

  // Mutations
  const { createLead, isCreating } = useLeadMutations({
    onCreateSuccess: () => {
      setIsNewLeadModalOpen(false);
    },
  });

  // Fetch upcoming reminders (default 7 days = 168 hours)
  const { data: remindersData, isLoading: remindersLoading, error: remindersError } = useUpcomingReminders(
    { limit: 3, hours_ahead: 168 }
  );

  const reminders = remindersData?.reminders.map(transformReminder) || [];

  const handleNewLead = async (data: any) => {
    await createLead(data);
  };

  // Loading state
  if (metricsLoading || remindersLoading) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
        action={
          <Button leftIcon={<Plus className="dashboard-page__action-icon" />} onClick={() => setIsNewLeadModalOpen(true)} size="sm">
            <span className="dashboard-page__action-text">New Lead</span>
            <span className="dashboard-page__action-text-mobile">Add</span>
          </Button>
        }
      >
        <div className="dashboard-page__loading">
          <div className="dashboard-page__loading-inner">
            <div className="dashboard-page__spinner"></div>
            <p className="dashboard-page__loading-text">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (metricsError || remindersError) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
        action={
          <Button leftIcon={<Plus className="dashboard-page__action-icon" />} onClick={() => setIsNewLeadModalOpen(true)} size="sm">
            <span className="dashboard-page__action-text">New Lead</span>
            <span className="dashboard-page__action-text-mobile">Add</span>
          </Button>
        }
      >
        <div className="dashboard-page__loading">
          <div className="dashboard-page__loading-inner">
            <AlertCircle className="dashboard-page__error-icon" />
            <p className="dashboard-page__loading-text">
              Failed to load dashboard. Please try again later.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening today."
      action={
        <div className="dashboard-page__action">
          <Button leftIcon={<Plus className="dashboard-page__action-icon" />} onClick={() => setIsNewLeadModalOpen(true)}>
            Add Lead
          </Button>
        </div>
      }
    >
      {/* Metrics Cards */}
      <div className="dashboard-page__metrics">
        <MetricsCard
          label="Total Leads"
          value={metrics?.total_leads.value ?? 0}
          icon={Users}
          iconColor="var(--primary)"
          trend={{
            value: metrics?.total_leads.trend_label ?? '+0',
            isPositive: (metrics?.total_leads.trend_value ?? 0) >= 0,
          }}
          secondaryInfo={`${metrics?.total_leads.trend_value ?? 0} new this week`}
        />
        <MetricsCard
          label="This Month"
          value={metrics?.new_leads_this_month.value ?? 0}
          icon={Calendar}
          iconColor="var(--primary)"
          trend={{
            value: metrics?.new_leads_this_month.trend_label ?? '+0%',
            isPositive: (metrics?.new_leads_this_month.trend_value ?? 0) >= 0,
          }}
        />
        <MetricsCard
          label="Surveyed"
          value={metrics?.surveyed.value ?? 0}
          icon={ClipboardCheck}
          iconColor="var(--primary)"
          trend={{
            value: metrics?.surveyed.trend_label ?? '+0',
            isPositive: (metrics?.surveyed.trend_value ?? 0) >= 0,
          }}
        />
        <MetricsCard
          label="Closed"
          value={metrics?.closed.value ?? 0}
          icon={CheckCircle}
          iconColor="var(--success)"
          trend={{
            value: metrics?.closed.trend_label ?? '+0',
            isPositive: (metrics?.closed.trend_value ?? 0) >= 0,
          }}
        />
      </div>

      {/* Upcoming Reminders */}
      <div>
        <RemindersSection reminders={reminders} maxItems={3} />
      </div>

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onSubmit={handleNewLead}
        isLoading={isCreating}
      />
    </DashboardLayout>
  );
}
