import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import ProfileViewsWidget from './ProfileViewsWidget';
import analyticsAPI from '../../services/analytics';

// Mock the analytics API
jest.mock('../../services/analytics');

// Mock ProfileViewsModal
jest.mock('./ProfileViewsModal', () => {
  return function MockProfileViewsModal({ onClose }) {
    return (
      <div data-testid="profile-views-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  };
});

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  });

// Wrapper component with QueryClient
const wrapper = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ProfileViewsWidget', () => {
  const mockUser = {
    id: 'user123',
    va: 'va123',
    email: 'test@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state', () => {
    analyticsAPI.getProfileViewsSummary.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ProfileViewsWidget user={mockUser} />, { wrapper });

    // Check for loading skeleton
    expect(screen.getByText('Profile Views')).toBeInTheDocument();
    // Loading state has animated pulse class
    const card = screen.getByText('Profile Views').closest('div').closest('div');
    expect(card).toHaveClass('animate-pulse');
  });

  test('renders empty state when no views', async () => {
    analyticsAPI.getProfileViewsSummary.mockResolvedValue({
      data: {
        total: 0,
        trend: 0,
        sparkline: [],
        registrationDate: '2024-01-01T00:00:00Z'
      }
    });

    render(<ProfileViewsWidget user={mockUser} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('No views yet')).toBeInTheDocument();
    });
  });

  test('renders success state with data', async () => {
    const mockSummary = {
      total: 1234,
      trend: 15,
      sparkline: [10, 15, 12, 20, 25, 30, 28],
      registrationDate: '2024-01-15T00:00:00Z'
    };

    analyticsAPI.getProfileViewsSummary.mockResolvedValue({
      data: mockSummary
    });

    render(<ProfileViewsWidget user={mockUser} />, { wrapper });

    await waitFor(() => {
      // Check total views is displayed
      expect(screen.getByText('1,234')).toBeInTheDocument();

      // Check registration date is formatted correctly
      expect(screen.getByText(/since Jan 15, 2024/i)).toBeInTheDocument();

      // Check trend indicator
      expect(screen.getByText('15%')).toBeInTheDocument();
    });
  });

  test('renders negative trend correctly', async () => {
    analyticsAPI.getProfileViewsSummary.mockResolvedValue({
      data: {
        total: 500,
        trend: -10,
        sparkline: [30, 25, 20, 15, 12, 10, 8],
        registrationDate: '2024-01-01T00:00:00Z'
      }
    });

    render(<ProfileViewsWidget user={mockUser} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });
  });

  test('renders error state with retry button', async () => {
    const mockError = new Error('Failed to fetch');
    analyticsAPI.getProfileViewsSummary.mockRejectedValue(mockError);

    render(<ProfileViewsWidget user={mockUser} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.getByText('Try again →')).toBeInTheDocument();
    });

    // Test retry functionality
    const retryButton = screen.getByText('Try again →');

    // Mock successful response on retry
    analyticsAPI.getProfileViewsSummary.mockResolvedValue({
      data: {
        total: 100,
        trend: 0,
        sparkline: [],
        registrationDate: '2024-01-01T00:00:00Z'
      }
    });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  test('opens modal when View insights button is clicked', async () => {
    analyticsAPI.getProfileViewsSummary.mockResolvedValue({
      data: {
        total: 100,
        trend: 5,
        sparkline: [10, 12, 15],
        registrationDate: '2024-01-01T00:00:00Z'
      }
    });

    render(<ProfileViewsWidget user={mockUser} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('View insights →')).toBeInTheDocument();
    });

    // Click the View insights button
    fireEvent.click(screen.getByText('View insights →'));

    // Modal should appear
    expect(screen.getByTestId('profile-views-modal')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText('Close Modal'));

    // Modal should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('profile-views-modal')).not.toBeInTheDocument();
    });
  });

  test('does not fetch data when user is not provided', () => {
    render(<ProfileViewsWidget user={null} />, { wrapper });

    // API should not be called
    expect(analyticsAPI.getProfileViewsSummary).not.toHaveBeenCalled();
  });

  test('displays sparkline when data is available', async () => {
    analyticsAPI.getProfileViewsSummary.mockResolvedValue({
      data: {
        total: 500,
        trend: 10,
        sparkline: [10, 15, 20, 25, 30, 28, 32],
        registrationDate: '2024-01-01T00:00:00Z'
      }
    });

    render(<ProfileViewsWidget user={mockUser} />, { wrapper });

    await waitFor(() => {
      // Check for SVG sparkline
      const svg = screen.getByText('500').closest('dl').querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '80');
      expect(svg).toHaveAttribute('height', '24');
    });
  });

  test('handles zero trend correctly', async () => {
    analyticsAPI.getProfileViewsSummary.mockResolvedValue({
      data: {
        total: 100,
        trend: 0,
        sparkline: [10, 10, 10, 10],
        registrationDate: '2024-01-01T00:00:00Z'
      }
    });

    render(<ProfileViewsWidget user={mockUser} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('No change')).toBeInTheDocument();
    });
  });
});