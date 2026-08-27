import { useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Mail, Phone, UserCheck, UserX, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { UserModal } from '@/components/users/UserModal';
import type { User, UsersFilters, CreateUserDto, UpdateUserDto } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import { useUsers, useUserMutations } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import './UsersPage.css';

const roleVariantMap: Record<string, 'red' | 'blue' | 'green'> = {
  'Admin': 'red',
  'Supervisor': 'blue',
  'Sales': 'green',
};

const roleOptions: ComboboxOption[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Sales', label: 'Sales' },
];

const statusOptions: ComboboxOption[] = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [filters, setFilters] = useState<UsersFilters>({
    search: '',
    role: 'all',
    status: 'all',
  });

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers } = useUsers(currentPage, pageSize, filters);

  // Mutations
  const { updateUser, createUser, deleteUser, isCreating, isUpdating, isDeleting } = useUserMutations({
    onCreateSuccess: () => {
      setIsCreateModalOpen(false);
    },
    onUpdateSuccess: () => {
      setIsEditModalOpen(false);
      setSelectedUserId(null);
    },
    onDeleteSuccess: () => {
      setIsDeleteModalOpen(false);
      setSelectedUserId(null);
    },
  });

  const updateFilter = (key: keyof UsersFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleCreateUser = async (data: CreateUserDto | UpdateUserDto) => {
    await createUser(data as CreateUserDto);
  };

  const handleEditUser = async (data: CreateUserDto | UpdateUserDto) => {
    if (!selectedUserId) return;
    await updateUser({ id: selectedUserId, data: data as UpdateUserDto });
  };

  const handleDeleteClick = (user: User) => {
    if (user.id === currentUser?.id) {
      return;
    }
    setSelectedUserId(user.id);
    setIsDeleteModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUserId(user.id);
    setIsEditModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUserId) return;
    await deleteUser(selectedUserId);
  };

  const getSelectedUser = (): User | undefined => {
    return usersData?.data.find((u) => u.id === selectedUserId);
  };

  const canEdit = (user: User) => {
    if (currentUser?.role === 'Admin') return true;
    if (currentUser?.role === 'Supervisor') {
      return user.role === 'Sales' || user.id === currentUser?.id;
    }
    return false;
  };

  const canDelete = (user: User) => {
    if (currentUser?.role === 'Admin') return true;
    if (currentUser?.role === 'Supervisor') return user.role === 'Sales';
    return false;
  };

  return (
    <>
      <DashboardLayout
        title="Users"
        subtitle={usersData ? `Total ${usersData.total ?? 0} users` : 'Loading...'}
        action={
          <Button leftIcon={<Plus className="users-page__add-icon" />} onClick={() => setIsCreateModalOpen(true)}>
            Add User
          </Button>
        }
      >
        {/* Filters */}
        <div className="users-page__filters">
          <div className="users-page__search">
            <Input
              placeholder="Search by name, email, or phone..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              leftIcon={<Search className="users-page__search-icon" />}
            />
          </div>
          <Combobox
            className="users-page__combobox"
            options={roleOptions}
            value={filters.role === 'all' ? '' : filters.role}
            onChange={(value) => updateFilter('role', value === '' ? 'all' : (value as string))}
            placeholder="All Roles"
            searchPlaceholder="Search role..."
          />
          <Combobox
            className="users-page__combobox"
            options={statusOptions}
            value={filters.status === 'all' ? '' : filters.status}
            onChange={(value) => updateFilter('status', value === '' ? 'all' : (value as string))}
            placeholder="All Status"
            searchPlaceholder="Search status..."
          />
        </div>

        {/* Users Table */}
        <div className="users-page__table-container">
          {isLoadingUsers ? (
            <div className="users-page__loading">Loading users...</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="users-page__mobile">
                <div className="users-page__list">
                  {!usersData?.data || usersData.data.length === 0 ? (
                    <div className="users-page__empty">No users found</div>
                  ) : (
                    usersData.data.map((user) => (
                      <div key={user.id} className="users-page__mobile-card">
                        <div className="users-page__mobile-card-row">
                          <div className="users-page__mobile-card-info">
                            <div className="users-page__name-row">
                              <h3 className="users-page__name">{user.full_name}</h3>
                              <Badge variant={roleVariantMap[user.role || 'Sales']} size="sm">
                                {user.role || 'Sales'}
                              </Badge>
                              {!user.is_active && (
                                <Badge variant="gray" size="sm">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="users-page__details">
                              {user.email && (
                                <p className="users-page__meta">
                                  <Mail className="users-page__meta-icon" />
                                  {user.email}
                                </p>
                              )}
                              {user.phone && (
                                <p className="users-page__meta">
                                  <Phone className="users-page__meta-icon" />
                                  {user.phone}
                                </p>
                              )}
                              <p className="users-page__meta">
                                Joined {formatRelativeTime(user.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="users-page__mobile-actions">
                            {canEdit(user) && (
                              <button
                                onClick={() => handleEditClick(user)}
                                className="users-page__action-btn users-page__action-btn--edit"
                                title="Edit"
                              >
                                <svg className="users-page__mobile-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {canDelete(user) && (
                              <button
                                onClick={() => handleDeleteClick(user)}
                                className="users-page__action-btn users-page__action-btn--delete"
                                title="Delete"
                              >
                                <svg className="users-page__mobile-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="users-page__desktop">
                <table className="users-page__table">
                  <thead>
                    <tr className="users-page__table-head">
                      <th className="users-page__th">User</th>
                      <th className="users-page__th">Role</th>
                      <th className="users-page__th">Status</th>
                      <th className="users-page__th">Created</th>
                      <th className="users-page__th users-page__th--right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="users-page__table-body">
                    {!usersData?.data || usersData.data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="users-page__empty">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      usersData.data.map((user) => (
                        <tr key={user.id} className="users-page__table-row">
                          <td className="users-page__td">
                            <div>
                              <p className="users-page__table-name">{user.full_name}</p>
                              <div className="users-page__table-name-row">
                                {user.email && (
                                  <a
                                    href={`mailto:${user.email}`}
                                    className="users-page__email"
                                  >
                                    <Mail className="users-page__email-icon" />
                                    {user.email}
                                  </a>
                                )}
                                {user.phone && (
                                  <span className="users-page__phone">
                                    <Phone className="users-page__phone-icon" />
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="users-page__td">
                            <Badge variant={roleVariantMap[user.role || 'Sales']} size="lg">
                              {user.role || 'Sales'}
                            </Badge>
                          </td>
                          <td className="users-page__td">
                            {user.is_active ? (
                              <span className="users-page__status users-page__status--active">
                                <UserCheck className="users-page__status-icon" />
                                Active
                              </span>
                            ) : (
                              <span className="users-page__status users-page__status--inactive">
                                <UserX className="users-page__status-icon" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="users-page__td">
                            <p className="users-page__created">{formatRelativeTime(user.created_at)}</p>
                          </td>
                          <td className="users-page__td">
                            <div className="users-page__table-actions">
                              {canEdit(user) && (
                                <button
                                  onClick={() => handleEditClick(user)}
                                  className="users-page__action-btn users-page__action-btn--edit users-page__action-btn--table"
                                  title="Edit"
                                >
                                  <svg className="users-page__table-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              {canDelete(user) && (
                                <button
                                  onClick={() => handleDeleteClick(user)}
                                  className="users-page__action-btn users-page__action-btn--delete users-page__action-btn--table"
                                  title="Delete"
                                >
                                  <svg className="users-page__table-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {usersData && (usersData.total ?? 0) > 0 && usersData.totalPages && usersData.totalPages > 1 && (
                <div className="users-page__pagination">
                  <div className="users-page__pagination-info">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, usersData.total ?? 0)} to{' '}
                    {Math.min(currentPage * pageSize, usersData.total ?? 0)} of {usersData.total ?? 0} users
                  </div>
                  <div className="users-page__pagination-buttons">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="users-page__page-btn"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="users-page__page-btn-icon" />
                    </button>
                    <span className="users-page__page-indicator">
                      {currentPage} / {usersData.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(usersData.totalPages || 1, prev + 1))}
                      disabled={currentPage === usersData.totalPages}
                      className="users-page__page-btn"
                      aria-label="Next page"
                    >
                      <ChevronRight className="users-page__page-btn-icon" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>

      {/* Create User Modal */}
      <UserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
        isLoading={isCreating}
        mode="create"
      />

      {/* Edit User Modal */}
      <UserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUserId(null);
        }}
        onSubmit={handleEditUser}
        isLoading={isUpdating}
        mode="edit"
        user={getSelectedUser()}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="users-page__delete-modal">
          <div className="users-page__delete-modal-panel">
            <div className="users-page__delete-modal-body">
              <div className="users-page__delete-modal-icon">
                <Trash2 className="users-page__delete-modal-icon-svg" />
              </div>
              <h2 className="users-page__delete-modal-title">Delete User</h2>
              <p className="users-page__delete-modal-text">
                Are you sure you want to delete{' '}
                <span className="users-page__delete-modal-highlight">{getSelectedUser()?.full_name}</span>?
                This action cannot be undone.
              </p>
            </div>

            <div className="users-page__delete-modal-actions">
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUserId(null);
                }}
                className="users-page__delete-modal-button"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="users-page__delete-modal-button users-page__delete-modal-button--danger"
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