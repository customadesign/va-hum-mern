import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('admin-invitations');
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state for sending invitations
  const [inviteForm, setInviteForm] = useState({
    email: '',
    message: ''
  });

  // Helper function to get cookie value
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Fetch existing invitations
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getCookie('authToken');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_URL}/admin/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || data.data || []);
      } else if (response.status === 404) {
        // API endpoint doesn't exist yet - show placeholder
        setInvitations([]);
        setError('Admin invitation feature is not yet implemented on the backend');
      } else {
        throw new Error('Failed to fetch invitations');
      }
    } catch (err) {
      setError('Admin invitation feature is not yet available');
      console.error('Error fetching invitations:', err);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  // Send invitation
  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = getCookie('authToken');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_URL}/admin/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(inviteForm)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Invitation sent successfully!');
        setInviteForm({ email: '', message: '' });
        fetchInvitations(); // Refresh the list
      } else if (response.status === 404) {
        setError('Admin invitation feature is not yet implemented on the backend');
      } else {
        throw new Error(data.message || 'Failed to send invitation');
      }
    } catch (err) {
      setError('Admin invitation feature is not yet available');
      console.error('Error sending invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      setLoading(true);
      const token = getCookie('authToken');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_URL}/admin/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Invitation cancelled successfully');
        fetchInvitations(); // Refresh the list
      } else if (response.status === 404) {
        setError('Admin invitation feature is not yet implemented on the backend');
      } else {
        throw new Error('Failed to cancel invitation');
      }
    } catch (err) {
      setError('Admin invitation feature is not yet available');
      console.error('Error cancelling invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Resend invitation
  const handleResendInvitation = async (invitationId) => {
    try {
      setLoading(true);
      const token = getCookie('authToken');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_URL}/admin/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Invitation resent successfully');
        fetchInvitations(); // Refresh the list
      } else if (response.status === 404) {
        setError('Admin invitation feature is not yet implemented on the backend');
      } else {
        throw new Error('Failed to resend invitation');
      }
    } catch (err) {
      setError('Admin invitation feature is not yet available');
      console.error('Error resending invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (activeTab === 'admin-invitations') {
      fetchInvitations();
    }
  }, [activeTab]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-admin-900">Settings</h1>
        <p className="mt-1 text-sm text-admin-600">
          Platform configuration and admin management
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-admin-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('admin-invitations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'admin-invitations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-admin-500 hover:text-admin-700 hover:border-admin-300'
            }`}
          >
            Admin Invitations
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-admin-500 hover:text-admin-700 hover:border-admin-300'
            }`}
          >
            General Settings
          </button>
        </nav>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Admin Invitations Tab */}
      {activeTab === 'admin-invitations' && (
        <div className="space-y-6">
          {/* Send Invitation Form */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-admin-900 mb-4">Send Admin Invitation</h2>
            <form onSubmit={handleSendInvitation} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-admin-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="admin-input"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-admin-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  className="admin-input"
                  rows="3"
                  placeholder="Add a personal message to the invitation"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="admin-button-primary"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>

          {/* Invitations List */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-admin-900 mb-4">Pending Invitations</h2>
            
            {loading && invitations.length === 0 ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-admin-500">Loading invitations...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-admin-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-admin-900">No invitations</h3>
                <p className="mt-1 text-sm text-admin-500">
                  No admin invitations have been sent yet.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-admin-300">
                  <thead className="bg-admin-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                        Invited By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-admin-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-admin-200">
                    {invitations.map((invitation) => (
                      <tr key={invitation._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-admin-900">
                          {invitation.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(invitation.status)}`}>
                            {invitation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-500">
                          {invitation.invitedBy?.name || invitation.invitedBy?.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-500">
                          {formatDate(invitation.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-admin-500">
                          {formatDate(invitation.expiresAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {invitation.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleResendInvitation(invitation._id)}
                                className="text-primary-600 hover:text-primary-900"
                                disabled={loading}
                              >
                                Resend
                              </button>
                              <button
                                onClick={() => handleCancelInvitation(invitation._id)}
                                className="text-red-600 hover:text-red-900"
                                disabled={loading}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="admin-card p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
              <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-admin-900">General Settings Coming Soon</h3>
            <p className="mt-1 text-sm text-admin-500">
              Additional platform configuration options will be available in the next update.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
