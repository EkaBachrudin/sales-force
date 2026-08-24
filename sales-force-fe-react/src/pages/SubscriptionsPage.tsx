import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Mail, Calendar, DollarSign, Trash2, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SubscriptionModal } from '@/components/subscriptions/SubscriptionModal';
import type { Subscription, SubscriptionFilters, CreateSubscriptionDto, UpdateSubscriptionDto } from '@/lib/types';
import { useSubscriptions, useSubscriptionMutations } from '@/hooks/useSubscriptions';
import './SubscriptionsPage.css';

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
          <Button leftIcon={<Plus className="subscriptions-page__add-icon" />} onClick={() => setIsCreateModalOpen(true)}>
            Add Subscription
          </Button>
        }
      >
        {/* Filters */}
        <div className="subscriptions-page__filters">
          <select
            value={filters.subscriptionType}
            onChange={(e) => updateFilter('subscriptionType', e.target.value)}
            className="subscriptions-page__select"
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
            className="subscriptions-page__select"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subscriptions Table */}
        <div className="subscriptions-page__table-container">
          {isLoadingSubscriptions ? (
            <div className="subscriptions-page__loading">Loading subscriptions...</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="subscriptions-page__mobile">
                <div className="subscriptions-page__list">
                  {!subscriptionsData?.data || subscriptionsData.data.length === 0 ? (
                    <div className="subscriptions-page__empty">No subscriptions found</div>
                  ) : (
                    subscriptionsData.data.map((subscription: Subscription) => (
                      <div key={subscription.id} className="subscriptions-page__mobile-card">
                        <div className="subscriptions-page__mobile-card-row">
                          <div className="subscriptions-page__mobile-card-info">
                            <div className="subscriptions-page__name-row">
                              <h3 className="subscriptions-page__name">
                                {subscription.user_name || 'Unknown User'}
                              </h3>
                              <Badge variant={subscriptionTypeVariantMap[subscription.subscription_type] || 'blue'} size="sm">
                                {subscription.subscription_type}
                              </Badge>
                              <Badge variant={statusVariantMap[subscription.status] || 'gray'} size="sm">
                                {subscription.status}
                              </Badge>
                            </div>
                            <div className="subscriptions-page__details">
                              {subscription.user_email && (
                                <p className="subscriptions-page__meta">
                                  <Mail className="subscriptions-page__meta-icon" />
                                  {subscription.user_email}
                                </p>
                              )}
                              <p className="subscriptions-page__meta">
                                <DollarSign className="subscriptions-page__meta-icon" />
                                {formatCurrency(subscription.amount)}
                              </p>
                              <p className="subscriptions-page__meta">
                                <Calendar className="subscriptions-page__meta-icon" />
                                Due: {formatDate(subscription.due_date)}
                              </p>
                              {subscription.period_start && subscription.period_end && (
                                <p className="subscriptions-page__meta">
                                  <Clock className="subscriptions-page__meta-icon" />
                                  {formatDate(subscription.period_start)} - {formatDate(subscription.period_end)}
                                </p>
                              )}
                              {subscription.notes && (
                                <p className="subscriptions-page__notes">{subscription.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="subscriptions-page__mobile-actions">
                            <button
                              onClick={() => handleEditClick(subscription)}
                              className="subscriptions-page__action-btn subscriptions-page__action-btn--edit"
                              title="Edit"
                            >
                              <svg className="subscriptions-page__mobile-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(subscription)}
                              className="subscriptions-page__action-btn subscriptions-page__action-btn--delete"
                              title="Delete"
                            >
                              <Trash2 className="subscriptions-page__mobile-action-icon" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="subscriptions-page__desktop">
                <table className="subscriptions-page__table">
                  <thead>
                    <tr className="subscriptions-page__table-head">
                      <th className="subscriptions-page__th">User</th>
                      <th className="subscriptions-page__th">Type</th>
                      <th className="subscriptions-page__th">Amount</th>
                      <th className="subscriptions-page__th">Period</th>
                      <th className="subscriptions-page__th">Due Date</th>
                      <th className="subscriptions-page__th">Status</th>
                      <th className="subscriptions-page__th">Notes</th>
                      <th className="subscriptions-page__th subscriptions-page__th--right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="subscriptions-page__table-body">
                    {!subscriptionsData?.data || subscriptionsData.data.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="subscriptions-page__empty">
                          No subscriptions found
                        </td>
                      </tr>
                    ) : (
                      subscriptionsData.data.map((subscription: Subscription) => (
                        <tr key={subscription.id} className="subscriptions-page__table-row">
                          <td className="subscriptions-page__td">
                            <div>
                              <p className="subscriptions-page__table-name">
                                {subscription.user_name || 'Unknown User'}
                              </p>
                              {subscription.user_email && (
                                <a
                                  href={`mailto:${subscription.user_email}`}
                                  className="subscriptions-page__email"
                                >
                                  <Mail className="subscriptions-page__email-icon" />
                                  {subscription.user_email}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="subscriptions-page__td">
                            <Badge variant={subscriptionTypeVariantMap[subscription.subscription_type] || 'blue'} size="lg">
                              {subscription.subscription_type}
                            </Badge>
                          </td>
                          <td className="subscriptions-page__td">
                            <div className="subscriptions-page__amount">
                              <DollarSign className="subscriptions-page__amount-icon" />
                              {formatCurrency(subscription.amount)}
                            </div>
                          </td>
                          <td className="subscriptions-page__td">
                            <div className="subscriptions-page__period">
                              <Clock className="subscriptions-page__period-icon" />
                              {subscription.period_start && subscription.period_end ? (
                                <span>
                                  {formatDate(subscription.period_start)} - {formatDate(subscription.period_end)}
                                </span>
                              ) : (
                                '-'
                              )}
                            </div>
                          </td>
                          <td className="subscriptions-page__td">
                            <div className="subscriptions-page__period">
                              <Calendar className="subscriptions-page__period-icon" />
                              {formatDate(subscription.due_date)}
                            </div>
                          </td>
                          <td className="subscriptions-page__td">
                            <Badge variant={statusVariantMap[subscription.status] || 'gray'} size="lg">
                              {subscription.status}
                            </Badge>
                          </td>
                          <td className="subscriptions-page__td">
                            <p className="subscriptions-page__table-notes">
                              {subscription.notes || '-'}
                            </p>
                          </td>
                          <td className="subscriptions-page__td">
                            <div className="subscriptions-page__table-actions">
                              <button
                                onClick={() => handleEditClick(subscription)}
                                className="subscriptions-page__action-btn subscriptions-page__action-btn--edit subscriptions-page__action-btn--table"
                                title="Edit"
                              >
                                <svg className="subscriptions-page__table-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(subscription)}
                                className="subscriptions-page__action-btn subscriptions-page__action-btn--delete subscriptions-page__action-btn--table"
                                title="Delete"
                              >
                                <Trash2 className="subscriptions-page__table-action-icon" />
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
                <div className="subscriptions-page__pagination">
                  <div className="subscriptions-page__pagination-info">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, subscriptionsData.total ?? 0)} to{' '}
                    {Math.min(currentPage * pageSize, subscriptionsData.total ?? 0)} of {subscriptionsData.total ?? 0} subscriptions
                  </div>
                  <div className="subscriptions-page__pagination-buttons">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="subscriptions-page__page-btn"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="subscriptions-page__page-btn-icon" />
                    </button>
                    <span className="subscriptions-page__page-indicator">
                      {currentPage} / {subscriptionsData.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(subscriptionsData.totalPages || 1, prev + 1))}
                      disabled={currentPage === subscriptionsData.totalPages}
                      className="subscriptions-page__page-btn"
                      aria-label="Next page"
                    >
                      <ChevronRight className="subscriptions-page__page-btn-icon" />
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
        <div className="subscriptions-page__delete-modal">
          <div className="subscriptions-page__delete-modal-panel">
            <div className="subscriptions-page__delete-modal-body">
              <div className="subscriptions-page__delete-modal-icon">
                <Trash2 className="subscriptions-page__delete-modal-icon-svg" />
              </div>
              <h2 className="subscriptions-page__delete-modal-title">Delete Subscription</h2>
              <p className="subscriptions-page__delete-modal-text">
                Are you sure you want to delete this subscription for{' '}
                <span className="subscriptions-page__delete-modal-highlight">{getSelectedSubscription()?.user_name}</span>?
                This action cannot be undone.
              </p>
            </div>

            <div className="subscriptions-page__delete-modal-actions">
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedSubscriptionId(null);
                }}
                className="subscriptions-page__delete-modal-button"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="subscriptions-page__delete-modal-button subscriptions-page__delete-modal-button--danger"
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
