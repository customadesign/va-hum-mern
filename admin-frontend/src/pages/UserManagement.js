import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
  KeyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';
import AdminFooter from '../components/common/AdminFooter';

const UserManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [resetReason, setResetReason] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  // Initialize from cached settings to apply on first render (no reload needed)
  const getInitialPageSize = () => {
    try {
      const cached = sessionStorage.getItem('admin_settings_cache');
      if (cached) {
        const { data } = JSON.parse(cached);
        const d = data?.settings?.performance?.pagination?.defaultLimit;
        if (d) return Number(d);
      }
      const last = localStorage.getItem('defaultPageSize');
      if (last) return Number(last);
    } catch {}
    return 25;
  };
  const [itemsPerPage, setItemsPerPage] = useState(getInitialPageSize()); // respect saved default on first render
  const [selectedUsers, setSelectedUsers] = useState([]);

  const queryClient = useQueryClient();
  const highlightId = searchParams.get('highlight');
  const searchParam = searchParams.get('search');

  // Fetch pagination settings
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getConfig();
        return response.data;
      } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
      }
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true
  });

  // Update itemsPerPage when settings are loaded
  useEffect(() => {
    if (settingsData?.performance?.pagination?.defaultLimit) {
      const newLimit = Number(settingsData.performance.pagination.defaultLimit);
      console.log('Updating users itemsPerPage from settings:', newLimit);
      setItemsPerPage(newLimit);
      // Mirror latest for fast-start in new tabs
      localStorage.setItem('defaultPageSize', String(newLimit));
    }
  }, [settingsData]);

  // Auto-populate search when we have search parameter
  useEffect(() => {
    if (searchParam && !searchTerm) {
      console.log('🎯 User search parameter detected:', searchParam);
      setSearchTerm(searchParam);
      setDebouncedSearchTerm(searchParam);
      setRoleFilter('all');
      setStatusFilter('all');
      setCurrentPage(1);
      // Clear the search param from URL after setting
      navigate('/users', { replace: true });
    }
  }, [searchParam, searchTerm, navigate]);

  // Debounce search term (800ms to allow comfortable typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 800);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users with filters
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['admin-users', { search: debouncedSearchTerm, role: roleFilter, suspended: statusFilter, page: currentPage, limit: itemsPerPage }],
    queryFn: async () => {
      const response = await adminAPI.getUsers({
        search: debouncedSearchTerm,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        suspended: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: itemsPerPage
      });
      console.log('Users API response:', response);
      return response.data; // Extract the data from axios response
    },
    keepPreviousData: true,
    onError: (error) => {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, suspended }) => adminAPI.suspendUser(userId, suspended),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update user status');
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, admin }) => adminAPI.updateUserRole(userId, admin),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update user role');
    },
  });

  // Password reset mutation
  const passwordResetMutation = useMutation({
    mutationFn: ({ userId, reason, notifyUser }) =>
      adminAPI.adminInitiatePasswordReset(userId, reason, notifyUser),
    onSuccess: (data) => {
      setShowPasswordResetModal(false);
      setPasswordResetUser(null);
      setResetReason('');
      setNotifyUser(true);
      
      if (data.emailDelivered) {
        toast.success('Password reset initiated and email sent to user');
      } else if (data.emailError) {
        toast.warning(`Password reset initiated but email failed: ${data.emailError}`);
      } else {
        toast.success('Password reset initiated (user not notified)');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.error || error.message || 'Failed to initiate password reset';
      toast.error(message);
    },
  });

  // Handle highlighted user from query params
  useEffect(() => {
    if (highlightId && usersData?.data) {
      const userToHighlight = usersData.data.find(user => user._id === highlightId);
      if (userToHighlight) {
        setSelectedUser(userToHighlight);
        setShowModal(true);
        // Clear the highlight param after showing
        navigate('/users', { replace: true });
      }
    }
  }, [highlightId, usersData, navigate]);

  const handleSuspendUser = (userId, suspended) => {
    suspendUserMutation.mutate({ userId, suspended });
  };

  const handleUpdateRole = (userId, admin) => {
    updateRoleMutation.mutate({ userId, admin });
  };

  const handlePasswordReset = (user) => {
    setPasswordResetUser(user);
    setShowPasswordResetModal(true);
    setResetReason('');
    setNotifyUser(true);
  };

  const handlePasswordResetSubmit = () => {
    if (!passwordResetUser || !resetReason.trim()) {
      toast.error('Please provide a reason for the password reset');
      return;
    }
    
    passwordResetMutation.mutate({
      userId: passwordResetUser._id,
      reason: resetReason.trim(),
      notifyUser
    });
  };

  const handlePasswordResetCancel = () => {
    setShowPasswordResetModal(false);
    setPasswordResetUser(null);
    setResetReason('');
    setNotifyUser(true);
  };

  const getRoleBadge = (user) => {
    if (user.admin) {
      return <span className="admin-badge-danger">Admin</span>;
    } else if (user.va) {
      return <span className="admin-badge-info">Virtual Assistant</span>;
    } else if (user.business) {
      return <span className="admin-badge-warning">Business</span>;
    } else {
      return <span className="admin-badge-gray">User</span>;
    }
  };

  const getStatusBadge = (suspended) => {
    return suspended ? 
      <span className="admin-badge-danger">Suspended</span> : 
      <span className="admin-badge-success">Active</span>;
  };

  // Handle the API response structure
  const users = Array.isArray(usersData?.data) ? usersData.data : [];
  const pagination = usersData?.pagination || { pages: 1, total: 0, limit: itemsPerPage };
  
  console.log('Users data:', users);
  console.log('Pagination data:', pagination);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="admin-loading"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-admin-900">User Management</h1>
            <p className="mt-1 text-sm text-admin-600">
              Manage all platform users, roles, and permissions
            </p>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="admin-card p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder="Search by email, phone, VA name, or business name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="admin-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="va">Virtual Assistants</option>
              <option value="business">Businesses</option>
            </select>
          </div>
          <div>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="false">Active</option>
              <option value="true">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead className="admin-table-header">
              <tr>
                <th className="admin-table-header-cell">
                  <input
                    data-test="table-select-all"
                    type="checkbox"
                    className="rounded border-admin-300"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map(u => u._id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </th>
                <th className="admin-table-header-cell">User</th>
                <th className="admin-table-header-cell">Role</th>
                <th className="admin-table-header-cell">Status</th>
                <th className="admin-table-header-cell">Joined</th>
                <th className="admin-table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {users.map((user) => (
                <tr key={user._id} data-test="table-row" className="hover:bg-admin-50">
                  <td className="admin-table-cell">
                    <input
                      data-test="table-row-select"
                      type="checkbox"
                      className="rounded border-admin-300"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user._id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                        }
                      }}
                    />
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-admin-200 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-admin-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-admin-900">
                          {user.email}
                        </div>
                        {user.va && (
                          <div className="text-sm text-admin-500">
                            VA: {user.va.name}
                          </div>
                        )}
                        {user.business && (
                          <div className="text-sm text-admin-500">
                            Business: {user.business.company}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    {getRoleBadge(user)}
                  </td>
                  <td className="admin-table-cell">
                    {getStatusBadge(user.suspended)}
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center text-sm text-admin-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center justify-end space-x-1">
                      {/* View Details - Primary */}
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 group"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      
                      {/* Password Reset - Orange */}
                      <button
                        onClick={() => handlePasswordReset(user)}
                        className="p-2 rounded-lg text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-all duration-200 group"
                        title="Reset Password"
                        disabled={passwordResetMutation.isLoading}
                      >
                        <KeyIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      
                      {/* Suspend/Activate - Success/Danger */}
                      <button
                        onClick={() => handleSuspendUser(user._id, !user.suspended)}
                        className={user.suspended
                          ? 'p-2 rounded-lg text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-all duration-200 group'
                          : 'p-2 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-200 group'
                        }
                        title={user.suspended ? 'Activate User' : 'Suspend User'}
                      >
                        {user.suspended
                          ? <CheckIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          : <XMarkIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        }
                      </button>
                      
                      {/* Admin Role Toggle - Warning/Primary */}
                      <button
                        onClick={() => handleUpdateRole(user._id, !user.admin)}
                        className={user.admin
                          ? 'p-2 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all duration-200 group'
                          : 'p-2 rounded-lg text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all duration-200 group'
                        }
                        title={user.admin ? 'Remove Admin' : 'Make Admin'}
                      >
                        <ShieldCheckIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Admin Footer with Pagination */}
        <div data-test="pagination">
          <div className="px-6 py-2">
            <span className="text-xs text-admin-500">
              <span data-test="page-size">{pagination.limit}</span> per page
            </span>
          </div>
          <AdminFooter
            currentPage={currentPage}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={setCurrentPage}
            showItemsInfo={true}
            showQuickJump={true}
          />
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-admin-900">User Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-admin-400 hover:text-admin-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-admin-200 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-admin-500" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-admin-900">{selectedUser.email}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    {getRoleBadge(selectedUser)}
                    {getStatusBadge(selectedUser.suspended)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-700">User ID</label>
                  <p className="text-sm text-admin-900 font-mono">{selectedUser._id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-700">Joined</label>
                  <p className="text-sm text-admin-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedUser.va && (
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-2">VA Profile</label>
                  <div className="bg-admin-50 p-3 rounded-lg">
                    <p className="text-sm text-admin-900">Name: {selectedUser.va.name}</p>
                    <p className="text-sm text-admin-600">Email: {selectedUser.va.email}</p>
                  </div>
                </div>
              )}

              {selectedUser.business && (
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-2">Business Profile</label>
                  <div className="bg-admin-50 p-3 rounded-lg">
                    <p className="text-sm text-admin-900">Company: {selectedUser.business.company}</p>
                    <p className="text-sm text-admin-600">Email: {selectedUser.business.email}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-admin-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="admin-button-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleSuspendUser(selectedUser._id, !selectedUser.suspended);
                    setShowModal(false);
                  }}
                  className={selectedUser.suspended ? 'admin-button-success' : 'admin-button-danger'}
                >
                  {selectedUser.suspended ? 'Activate User' : 'Suspend User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && passwordResetUser && (
        <div className="admin-modal-overlay" onClick={() => setShowPasswordResetModal(false)}>
          <div className="admin-modal-content max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                  <KeyIcon className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-admin-900">Reset User Password</h3>
              </div>
              <button
                onClick={handlePasswordResetCancel}
                className="text-admin-400 hover:text-admin-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-admin-900">{passwordResetUser.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRoleBadge(passwordResetUser)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Security Notice</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      This will invalidate the user's current session and require them to set a new password.
                      The reset link will expire in 30 minutes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Reason for Password Reset <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Please explain why you're resetting this user's password..."
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  This reason will be logged for audit purposes and included in the email to the user.
                </p>
              </div>

              {/* Notification Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyUser"
                  checked={notifyUser}
                  onChange={(e) => setNotifyUser(e.target.checked)}
                  className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="notifyUser" className="ml-2 block text-sm text-admin-700">
                  Send email notification to user with reset instructions
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-admin-200">
                <button
                  onClick={handlePasswordResetCancel}
                  className="admin-button-secondary"
                  disabled={passwordResetMutation.isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordResetSubmit}
                  className="admin-button-danger"
                  disabled={passwordResetMutation.isLoading || !resetReason.trim()}
                >
                  {passwordResetMutation.isLoading ? (
                    <div className="flex items-center">
                      <div className="admin-loading-sm mr-2"></div>
                      Initiating Reset...
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
