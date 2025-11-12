import React from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

export default function ImpersonationBanner() {
  // Check if user is being impersonated
  const token = localStorage.getItem('token');
  let isImpersonated = false;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isImpersonated = payload.isImpersonated;
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  }

  // Stop impersonation mutation
  const stopImpersonationMutation = useMutation(
    async () => {
      const response = await api.post('/admin/stop-impersonation');
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Store the admin token before clearing impersonation data
        const adminToken = data.data.token;
        const adminUser = data.data.user;
        const adminOriginUrl = data.data.adminOriginUrl;
        
        // Clear impersonation-related data from localStorage
        localStorage.removeItem('impersonationToken');
        localStorage.removeItem('impersonationData');
        
        // Store the admin token in localStorage (not sessionStorage)
        // This ensures the admin session persists
        localStorage.setItem('token', adminToken);
        localStorage.setItem('user', JSON.stringify(adminUser));
        
        toast.success('Returning to admin dashboard...');
        
        // Redirect to the admin origin URL (where the impersonation was initiated from)
        // This ensures we return to the correct admin system (Linkage or E-Systems)
        window.location.href = `${adminOriginUrl}/dashboard`;
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to stop impersonation');
      }
    }
  );

  if (!isImpersonated) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-white px-4 py-2 text-center relative">
      <div className="flex items-center justify-center gap-2">
        <span className="font-medium">
          🔄 You are impersonating a user
        </span>
        <button
          onClick={() => stopImpersonationMutation.mutate()}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          disabled={stopImpersonationMutation.isLoading}
        >
          {stopImpersonationMutation.isLoading ? 'Stopping...' : 'Return to Admin'}
        </button>
      </div>
      <button
        onClick={() => stopImpersonationMutation.mutate()}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-yellow-200"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}