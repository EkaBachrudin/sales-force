import { useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Mail, Phone, UserCheck, UserX, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { UserModal } from '@/components/users/UserModal';
import type { User, UsersFilters, CreateUserDto, UpdateUserDto } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';
import { useUsers, useUserMutations } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';

const roleVariantMap: Record<string, 'red' | 'blue' | 'green'> = {
  'Admin': 'red',
  'Supervisor': 'blue',
  'Sales': 'green',
};

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Sales', label: 'Sales' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
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
      alert('You cannot delete your own account');
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

  return (
    <>
      <DashboardLayout
        title="Users"
        subtitle={usersData ? `Total ${usersData.total ?? 0} users` : 'Loading...'}
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateModalOpen(true)}>
            Add User
          </Button>
        }
      >
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or phone..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <select
            value={filters.role}
            onChange={(e) => updateFilter('role', e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary"
          >
            {roleOptions.map((option) => (
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

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {isLoadingUsers ? (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              Loading users...
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="divide-y divide-[var(--border)]">
                  {!usersData?.data || usersData.data.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-text-secondary">
                      No users found
                    </div>
                  ) : (
                    usersData.data.map((user) => (
                      <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-text-primary truncate">{user.full_name}</h3>
                              <Badge variant={roleVariantMap[user.role || 'Sales']} size="sm">
                                {user.role || 'Sales'}
                              </Badge>
                              {!user.is_active && (
                                <Badge variant="gray" size="sm">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1">
                              {user.email && (
                                <p className="text-xs text-text-secondary flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {user.email}
                                </p>
                              )}
                              {user.phone && (
                                <p className="text-xs text-text-secondary flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </p>
                              )}
                              <p className="text-xs text-text-secondary">
                                Joined {formatRelativeTime(user.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="p-2 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteClick(user)}
                                className="p-2 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {!usersData?.data || usersData.data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-secondary">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      usersData.data.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-text-primary">{user.full_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {user.email && (
                                  <a
                                    href={`mailto:${user.email}`}
                                    className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary"
                                  >
                                    <Mail className="w-3 h-3" />
                                    {user.email}
                                  </a>
                                )}
                                {user.phone && (
                                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                                    <Phone className="w-3 h-3" />
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={roleVariantMap[user.role || 'Sales']} size="lg">
                              {user.role || 'Sales'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {user.is_active ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <UserCheck className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <UserX className="w-3 h-3" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-text-secondary">{formatRelativeTime(user.created_at)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditClick(user)}
                                className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {user.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDeleteClick(user)}
                                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
                  <div className="text-xs sm:text-sm text-text-secondary text-center sm:text-left">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, usersData.total ?? 0)} to{' '}
                    {Math.min(currentPage * pageSize, usersData.total ?? 0)} of {usersData.total ?? 0} users
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
                      {currentPage} / {usersData.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(usersData.totalPages || 1, prev + 1))}
                      disabled={currentPage === usersData.totalPages}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Delete User
              </h2>
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete <span className="font-medium text-text-primary">{getSelectedUser()?.full_name}</span>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUserId(null);
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
