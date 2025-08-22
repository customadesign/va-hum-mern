import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();

  // Fetch users with filters
  const { data: usersData, isLoading, error } = useQuery(
    ['admin-users', { search: searchTerm, role: roleFilter, suspended: statusFilter, page: currentPage }],
    async () => {
      const response = await adminAPI.getUsers({
        search: searchTerm,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        suspended: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: 20
      });
      console.log('Users API response:', response);
      return response.data; // Extract the data from axios response
    },
    {
      keepPreviousData: true,
      onError: (error) => {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      }
    }
  );

  // Suspend user mutation
  const suspendUserMutation = useMutation(
    ({ userId, suspended }) => adminAPI.suspendUser(userId, suspended),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        toast.success('User status updated successfully');
      },
      onError: (error) => {
        toast.error('Failed to update user status');
      },
    }
  );

  // Update user role mutation
  const updateRoleMutation = useMutation(
    ({ userId, admin }) => adminAPI.updateUserRole(userId, admin),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        toast.success('User role updated successfully');
      },
      onError: (error) => {
        toast.error('Failed to update user role');
      },
    }
  );

  const handleSuspendUser = (userId, suspended) => {
    suspendUserMutation.mutate({ userId, suspended });
  };

  const handleUpdateRole = (userId, admin) => {
    updateRoleMutation.mutate({ userId, admin });
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
  const pagination = usersData?.pagination || { pages: 1, total: 0, limit: 20 };
  
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
                <MagnifyingGlassIcon className="h-5 w-5 text-admin-400" />
              </div>
              <input
                type="text"
                className="admin-input pl-10"
                placeholder="Search users by email..."
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
                <th className="admin-table-header-cell">User</th>
                <th className="admin-table-header-cell">Role</th>
                <th className="admin-table-header-cell">Status</th>
                <th className="admin-table-header-cell">Joined</th>
                <th className="admin-table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-admin-50">
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSuspendUser(user._id, !user.suspended)}
                        className={user.suspended ? 'text-success-600 hover:text-success-900' : 'text-danger-600 hover:text-danger-900'}
                        title={user.suspended ? 'Activate User' : 'Suspend User'}
                      >
                        {user.suspended ? <CheckIcon className="h-5 w-5" /> : <XMarkIcon className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleUpdateRole(user._id, !user.admin)}
                        className={user.admin ? 'text-warning-600 hover:text-warning-900' : 'text-primary-600 hover:text-primary-900'}
                        title={user.admin ? 'Remove Admin' : 'Make Admin'}
                      >
                        <ShieldCheckIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-admin-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="admin-button-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="admin-button-secondary"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-admin-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="admin-button-secondary rounded-l-md"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                    className="admin-button-secondary rounded-r-md"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
