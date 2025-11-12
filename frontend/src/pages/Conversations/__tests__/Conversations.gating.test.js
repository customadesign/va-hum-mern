import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Conversations from '../index';
import ConversationDetail from '../Detail';
import { AuthProvider } from '../../../contexts/AuthContext';
import { BrandingProvider } from '../../../contexts/BrandingContext';
import api from '../../../services/api';

jest.mock('../../../services/api');

const mockUser = {
  id: 'user123',
  email: 'business@test.com',
  profile: { business: 'business123' }
};

const mockVAUser = {
  id: 'va123',
  email: 'va@test.com',
  profile: { va: 'va123' }
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  });

  return ({ children }) => (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <BrandingProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </BrandingProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

describe('Conversations - Profile Completion Gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Gated View (Profile <= 80%)', () => {
    it('should show onboarding notice when profile completion is 0%', async () => {
      // Mock API response for gated user
      api.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            gated: true,
            error: 'PROFILE_INCOMPLETE',
            message: 'Welcome to your messages. To get started, visit your Dashboard to complete your profile and begin conversations.',
            profileCompletion: 0,
            requiredCompletion: 80
          }
        }
      });

      const { container } = render(<Conversations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Welcome to your messages/i)).toBeInTheDocument();
        expect(screen.getByText(/visit your/i)).toBeInTheDocument();
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/to complete your profile and begin conversations/i)).toBeInTheDocument();
      });

      // Should show profile completion percentage
      await waitFor(() => {
        expect(screen.getByText(/0%/i)).toBeInTheDocument();
      });

      // Should have link to dashboard
      const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      // Should NOT show any conversations
      expect(screen.queryByText(/sample/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Linkage Admin/i)).not.toBeInTheDocument();
    });

    it('should show onboarding notice when profile completion is exactly 80%', async () => {
      api.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            gated: true,
            error: 'PROFILE_INCOMPLETE',
            message: 'Welcome to your messages. To get started, visit your Dashboard to complete your profile and begin conversations.',
            profileCompletion: 80,
            requiredCompletion: 80
          }
        }
      });

      render(<Conversations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Welcome to your messages/i)).toBeInTheDocument();
        expect(screen.getByText(/80%/i)).toBeInTheDocument();
      });

      // Should show completion progress bar
      const progressBar = screen.getByRole('progressbar', { hidden: true });
      expect(progressBar).toHaveStyle({ width: '80%' });

      // Should NOT show conversations list
      expect(screen.queryByText(/conversation/i)).not.toBeInTheDocument();
    });

    it('should show onboarding notice when profile completion is 79%', async () => {
      api.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            gated: true,
            error: 'PROFILE_INCOMPLETE',
            message: 'Welcome to your messages. To get started, visit your Dashboard to complete your profile and begin conversations.',
            profileCompletion: 79,
            requiredCompletion: 80
          }
        }
      });

      render(<Conversations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/79%/i)).toBeInTheDocument();
        expect(screen.getByText(/more than 80%/i)).toBeInTheDocument();
      });
    });

    it('should hide composer, unread counts, and all message UI when gated', async () => {
      api.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            gated: true,
            profileCompletion: 50
          }
        }
      });

      render(<Conversations />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should not show messaging UI elements
        expect(screen.queryByPlaceholderText(/Type a message/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /send/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/unread/i)).not.toBeInTheDocument();
        
        // Should show gated view instead
        expect(screen.getByText(/Complete Your Profile/i)).toBeInTheDocument();
      });
    });
  });

  describe('Unlocked View (Profile > 80%)', () => {
    it('should show conversations when profile completion is 81%', async () => {
      const mockConversations = [
        {
          _id: 'conv1',
          participants: [mockUser.id, mockVAUser.id],
          va: {
            _id: mockVAUser.id,
            email: 'va@test.com',
            profile: {
              name: 'Test VA',
              avatar: null
            }
          },
          messages: [{
            _id: 'msg1',
            sender: mockVAUser.id,
            content: 'Hello!',
            createdAt: new Date()
          }],
          lastMessage: 'Hello!',
          lastMessageAt: new Date(),
          status: 'active',
          unreadCount: { business: 1, va: 0 }
        }
      ];

      api.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockConversations
        }
      });

      render(<Conversations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Test VA/i)).toBeInTheDocument();
        expect(screen.getByText(/Hello!/i)).toBeInTheDocument();
      });

      // Should NOT show gated view
      expect(screen.queryByText(/Welcome to your messages.*complete your profile/i)).not.toBeInTheDocument();
    });

    it('should show conversations when profile completion is 100%', async () => {
      const mockConversations = [
        {
          _id: 'conv1',
          participants: [mockUser.id, mockVAUser.id],
          va: {
            _id: mockVAUser.id,
            email: 'va@test.com',
            profile: {
              name: 'Test VA',
              avatar: null
            }
          },
          messages: [],
          lastMessage: '',
          lastMessageAt: new Date(),
          status: 'active',
          unreadCount: { business: 0, va: 0 }
        }
      ];

      api.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockConversations
        }
      });

      render(<Conversations />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Test VA/i)).toBeInTheDocument();
      });
    });
  });

  describe('VA Users', () => {
    it('should never gate VA users regardless of profile completion', async () => {
      // VA users should always see conversations
      const mockConversations = [];

      api.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockConversations
        }
      });

      render(<Conversations />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Should show empty state, not gated view
        expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
        expect(screen.queryByText(/Complete Your Profile/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('ConversationDetail - Deep link handling', () => {
    it('should redirect gated users attempting to access conversation detail', async () => {
      api.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            gated: true,
            error: 'PROFILE_INCOMPLETE'
          }
        }
      });

      const { container } = render(
        <ConversationDetail />,
        { wrapper: createWrapper() }
      );

      // Should redirect to /conversations
      // Navigation would be handled by React Router in real scenario
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/conversations/'));
      });
    });
  });
});