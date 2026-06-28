import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Mail, Calendar, DollarSign, Trash2, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SubscriptionModal } from '@/components/subscriptions/SubscriptionModal';
import type { Subscription, SubscriptionFilters, CreateSubscriptionDto, UpdateSubscriptionDto } from '@/lib/types';
import { useSubscriptions, useSubscriptionMutations } from '@/hooks/useSubscriptions';

const statusVariantMap: Record<string, 'red' | 'blue' | 'green' | 'gray' | 'orange'> = {
  'pending': 'orange',
  'active': 'green',
  'overdue': 'red',
  'cancelled': 'gray',
};

const subscriptionTypeVariantMap: Record<string, 'blue' | 'green' | 'purple'> = {
  'monthly': 'blue',
  'quarterly': 'green',
  'annual': 'purple',
};

const subscriptionTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function SubscriptionsPage() {
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [filters, setFilters] = useState<SubscriptionFilters>({
    search: '',
    status: 'all',
    subscriptionType: 'all',
  });

  // Fetch subscriptions
  const { data: subscriptionsData, isLoading: isLoadingSubscriptions } = useSubscriptions(currentPage, pageSize, filters);

  // Mutations
  const { updateSubscription, createSubscription, deleteSubscription, isCreating, isUpdating, isDeleting } = useSubscriptionMutations({
    onCreateSuccess: () => {
      setIsCreateModalOpen(false);
    },
    onUpdateSuccess: () => {
      setIsEditModalOpen(false);
      setSelectedSubscriptionId(null);
    },
    onDeleteSuccess: () => {
      setIsDeleteModalOpen(false);
      setSelectedSubscriptionId(null);
    },
  });

  const updateFilter = (key: keyof SubscriptionFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleCreateSubscription = async (data: CreateSubscriptionDto | UpdateSubscriptionDto) => {
    await createSubscription(data as CreateSubscriptionDto);
  };

  const handleEditSubscription = async (data: CreateSubscriptionDto | UpdateSubscriptionDto) => {
    if (!selectedSubscriptionId) return;
    await updateSubscription({ id: selectedSubscriptionId, data: data as UpdateSubscriptionDto });
  };

  const handleDeleteClick = (subscription: Subscription) => {
    setSelectedSubscriptionId(subscription.id);
    setIsDeleteModalOpen(true);
  };

  const handleEditClick = (subscription: Subscription) => {
    setSelectedSubscriptionId(subscription.id);
    setIsEditModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSubscriptionId) return;
    await deleteSubscription(selectedSubscriptionId);
  };

  const getSelectedSubscription = (): Subscription | undefined => {
    return subscriptionsData?.data.find((s: { id: string | null; }) => s.id === selectedSubscriptionId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <DashboardLayout
        title="Subscriptions"
        subtitle={subscriptionsData ? `Total ${subscriptionsData.total ?? 0} subscriptions` : 'Loading...'}
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateModalOpen(true)}>
            Add Subscription
          </Button>
        }
      >
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            value={filters.subscriptionType}
            onChange={(e) => updateFilter('subscriptionType', e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary"
          >
            {subscriptionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {isLoadingSubscriptions ? (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              Loading subscriptions...
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="divide-y divide-[var(--border)]">
                  {!subscriptionsData?.data || subscriptionsData.data.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-text-secondary">
                      No subscriptions found
                    </div>
                  ) : (
                    subscriptionsData.data.map((subscription: Subscription) => (
                      <div key={subscription.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-text-primary truncate">
                                {subscription.user_name || 'Unknown User'}
                              </h3>
                              <Badge variant={subscriptionTypeVariantMap[subscription.subscription_type] || 'blue'} size="sm">
                                {subscription.subscription_type}
                              </Badge>
                              <Badge variant={statusVariantMap[subscription.status] || 'gray'} size="sm">
                                {subscription.status}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              {subscription.user_email && (
                                <p className="text-xs text-text-secondary flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {subscription.user_email}
                                </p>
                              )}
                              <p className="text-xs text-text-secondary flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {formatCurrency(subscription.amount)}
                              </p>
                              <p className="text-xs text-text-secondary flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {formatDate(subscription.due_date)}
                              </p>
                              {subscription.period_start && subscription.period_end && (
                                <p className="text-xs text-text-secondary flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(subscription.period_start)} - {formatDate(subscription.period_end)}
                                </p>
                              )}
                              {subscription.notes && (
                                <p className="text-xs text-text-secondary line-clamp-1">
                                  {subscription.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditClick(subscription)}
                              className="p-2 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(subscription)}
                              className="p-2 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {!subscriptionsData?.data || subscriptionsData.data.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-sm text-text-secondary">
                          No subscriptions found
                        </td>
                      </tr>
                    ) : (
                      subscriptionsData.data.map((subscription: Subscription) => (
                        <tr key={subscription.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {subscription.user_name || 'Unknown User'}
                              </p>
                              {subscription.user_email && (
                                <a
                                  href={`mailto:${subscription.user_email}`}
                                  className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary"
                                >
                                  <Mail className="w-3 h-3" />
                                  {subscription.user_email}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={subscriptionTypeVariantMap[subscription.subscription_type] || 'blue'} size="lg">
                              {subscription.subscription_type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm text-text-primary">
                              <DollarSign className="w-4 h-4" />
                              {formatCurrency(subscription.amount)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm text-text-secondary">
                              <Clock className="w-4 h-4" />
                              {subscription.period_start && subscription.period_end ? (
                                <span>
                                  {formatDate(subscription.period_start)} - {formatDate(subscription.period_end)}
                                </span>
                              ) : (
                                '-'
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-sm text-text-secondary">
                              <Calendar className="w-4 h-4" />
                              {formatDate(subscription.due_date)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariantMap[subscription.status] || 'gray'} size="lg">
                              {subscription.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-text-secondary line-clamp-1 max-w-xs">
                              {subscription.notes || '-'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditClick(subscription)}
                                className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(subscription)}
                                className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {subscriptionsData && (subscriptionsData.total ?? 0) > 0 && subscriptionsData.totalPages && subscriptionsData.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
                  <div className="text-xs sm:text-sm text-text-secondary text-center sm:text-left">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, subscriptionsData.total ?? 0)} to{' '}
                    {Math.min(currentPage * pageSize, subscriptionsData.total ?? 0)} of {subscriptionsData.total ?? 0} subscriptions
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs sm:text-sm text-text-secondary whitespace-nowrap">
                      {currentPage} / {subscriptionsData.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(subscriptionsData.totalPages || 1, prev + 1))}
                      disabled={currentPage === subscriptionsData.totalPages}
                      className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>

      {/* Create Subscription Modal */}
      <SubscriptionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubscription}
        isLoading={isCreating}
        mode="create"
      />

      {/* Edit Subscription Modal */}
      <SubscriptionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSubscriptionId(null);
        }}
        onSubmit={handleEditSubscription}
        isLoading={isUpdating}
        mode="edit"
        subscription={getSelectedSubscription()}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Delete Subscription
              </h2>
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete this subscription for{' '}
                <span className="font-medium text-text-primary">{getSelectedSubscription()?.user_name}</span>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedSubscriptionId(null);
                }}
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
