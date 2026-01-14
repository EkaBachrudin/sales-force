'use client';

import React, { useState } from 'react';
import { Plus, Users, Calendar, ClipboardCheck, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { RemindersSection } from '@/components/dashboard/RemindersSection';
import { NewLeadModal } from '@/components/dashboard/NewLeadModal';
import { Button } from '@/components/ui/Button';
import { mockReminders, mockMetrics } from '@/lib/mockData';

export default function DashboardPage() {
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  const handleNewLead = (data: any) => {
    // In a real app, this would save to a database
    setIsNewLeadModalOpen(false);
  };

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening today."
      action={
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsNewLeadModalOpen(true)} size="sm">
          <span className="hidden sm:inline">New Lead</span>
          <span className="sm:hidden">Add</span>
        </Button>
      }
    >
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <MetricsCard
          label="Total Leads"
          value={mockMetrics.totalLeads}
          icon={Users}
          iconColor="#2563EB"
          trend={{ value: mockMetrics.totalLeadsTrend, isPositive: true }}
          secondaryInfo={`${mockMetrics.thisMonth} new this week`}
        />
        <MetricsCard
          label="This Month"
          value={mockMetrics.thisMonth}
          icon={Calendar}
          iconColor="#10B981"
          trend={{ value: mockMetrics.thisMonthTrend, isPositive: true }}
        />
        <MetricsCard
          label="Surveyed"
          value={mockMetrics.surveyed}
          icon={ClipboardCheck}
          iconColor="#8B5CF6"
          trend={{ value: mockMetrics.surveyedTrend, isPositive: true }}
        />
        <MetricsCard
          label="Closed"
          value={mockMetrics.closed}
          icon={CheckCircle}
          iconColor="#10B981"
          trend={{ value: mockMetrics.closedTrend, isPositive: true }}
        />
      </div>

      {/* Upcoming Reminders */}
      <div>
        <RemindersSection reminders={mockReminders} maxItems={3} />
      </div>

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onSubmit={handleNewLead}
      />
    </DashboardLayout>
  );
}
