import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitation, setInvitation] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Form state for new user registration
  const [userForm, setUserForm] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  // Verify invitation token on component mount
  useEffect(() => {
    const verifyInvitation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/invitations/${token}/verify`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          setInvitation(data.invitation);
        } else {
          setError(data.message || 'Invalid or expired invitation');
        }
      } catch (err) {
        setError('Failed to verify invitation');
        console.error('Error verifying invitation:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyInvitation();
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
  }, [token]);

  // Handle invitation acceptance
  const handleAcceptInvitation = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!userForm.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!userForm.password) {
      setError('Password is required');
      return;
    }
    
    if (userForm.password !== userForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (userForm.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsAccepting(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/admin/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: userForm.name,
          password: userForm.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Invitation accepted successfully! You are now an admin. Redirecting to login...');
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to accept invitation');
      }
    } catch (err) {
      setError('Failed to accept invitation');
      console.error('Error accepting invitation:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <h2 className="mt-4 text-2xl font-bold text-admin-900">
              Verifying Invitation
            </h2>
            <p className="mt-2 text-sm text-admin-600">
              Please wait while we verify your invitation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-admin-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-admin-900">
              Invalid Invitation
            </h2>
            <p className="mt-2 text-sm text-admin-600">
              {error}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="admin-button-primary"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-admin-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-admin-900">
              Welcome to the Team!
            </h2>
            <p className="mt-2 text-sm text-admin-600">
              {success}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-admin-900">
            Admin Invitation
          </h2>
          <p className="mt-2 text-sm text-admin-600">
            You've been invited to become an administrator
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="admin-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {invitation && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Invitation Details</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Email:</strong> {invitation.email}</p>
                <p><strong>Invited by:</strong> {invitation.invitedBy?.name || invitation.invitedBy?.email}</p>
                <p><strong>Expires:</strong> {formatDate(invitation.expiresAt)}</p>
                {invitation.message && (
                  <div className="mt-2">
                    <p><strong>Message:</strong></p>
                    <p className="italic">"{invitation.message}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleAcceptInvitation} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-admin-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="admin-input"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-admin-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="admin-input"
                  placeholder="Create a password (min. 6 characters)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-admin-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                  className="admin-input"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isAccepting}
                className="w-full admin-button-primary"
              >
                {isAccepting ? 'Accepting Invitation...' : 'Accept Invitation & Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-admin-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-admin-500">Or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
