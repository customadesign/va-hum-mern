import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import ProfileViewsModal from './ProfileViewsModal';
import analyticsAPI from '../../services/analytics';

// Mock the analytics API
jest.mock('../../services/analytics');

// Mock Chart.js to avoid canvas issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Chart</div>
}));

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

describe('ProfileViewsModal', () => {
  const mockUser = {
    id: 'user123',
    va: 'va123',
    email: 'test@example.com'
  };

  const mockOnClose = jest.fn();
  const registrationDate = '2024-01-01T00:00:00Z';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSeriesData = {
    series: [
      { date: '2024-01-01', views: 10 },
      { date: '2024-01-02', views: 15 },
      { date: '2024-01-03', views: 20 },
      { date: '2024-01-04', views: 18 },
      { date: '2024-01-05', views: 25 }
    ],
    unique: 45
  };

  const mockReferrersData = {
    referrers: [
      { source: 'google.com', count: 50 },
      { source: 'linkedin.com', count: 30 },
      { source: 'facebook.com', count: 20 },
      { source: 'twitter.com', count: 10 },
      { source: null, count: 5 }
    ]
  };

  test('renders modal with correct title and structure', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    expect(screen.getByText('Profile Views Analytics')).toBeInTheDocument();
    expect(screen.getByText('Track how many people are viewing your profile')).toBeInTheDocument();
  });

  test('displays KPI cards with correct data', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    await waitFor(() => {
      // Total views: sum of all views (10 + 15 + 20 + 18 + 25 = 88)
      expect(screen.getByText('88')).toBeInTheDocument();

      // Unique viewers
      expect(screen.getByText('45')).toBeInTheDocument();

      // Check KPI labels
      expect(screen.getByText('Total Views')).toBeInTheDocument();
      expect(screen.getByText('Unique Viewers')).toBeInTheDocument();
      expect(screen.getByText('Avg per Day')).toBeInTheDocument();
      expect(screen.getByText('7-Day Change')).toBeInTheDocument();
    });
  });

  test('renders chart when data is available', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  test('displays loading state for chart', () => {
    analyticsAPI.getProfileViewsSeries.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    // Should show loading spinner
    const loadingSpinner = screen.getAllByRole('status', { hidden: true })[0];
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('displays top referrers correctly', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('google.com')).toBeInTheDocument();
      expect(screen.getByText('linkedin.com')).toBeInTheDocument();
      expect(screen.getByText('facebook.com')).toBeInTheDocument();
      expect(screen.getByText('twitter.com')).toBeInTheDocument();
      expect(screen.getByText('Direct / Unknown')).toBeInTheDocument();

      // Check view counts
      expect(screen.getByText('50 views')).toBeInTheDocument();
      expect(screen.getByText('30 views')).toBeInTheDocument();
    });
  });

  test('shows empty state when no referrers', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({
      data: { referrers: [] }
    });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText('No referrer data yet')).toBeInTheDocument();
      expect(
        screen.getByText('Referrers will appear as people visit your profile from external links')
      ).toBeInTheDocument();
    });
  });

  test('changes interval filter', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    const intervalSelect = screen.getByRole('combobox', { name: /interval/i });

    // Change to week
    fireEvent.change(intervalSelect, { target: { value: 'week' } });

    await waitFor(() => {
      // API should be called with new interval
      expect(analyticsAPI.getProfileViewsSeries).toHaveBeenCalledWith(
        expect.objectContaining({ interval: 'week' })
      );
    });
  });

  test('toggles unique viewers filter', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    const uniqueCheckbox = screen.getByRole('checkbox', {
      name: /show unique viewers only/i
    });

    // Toggle unique viewers
    fireEvent.click(uniqueCheckbox);

    await waitFor(() => {
      expect(analyticsAPI.getProfileViewsSeries).toHaveBeenCalledWith(
        expect.objectContaining({ unique: true })
      );
    });
  });

  test('changes date range preset', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    const dateRangeSelect = screen.getByRole('combobox', { name: /date range/i });

    // Change to last 7 days
    fireEvent.change(dateRangeSelect, { target: { value: 'LAST_7_DAYS' } });

    await waitFor(() => {
      // API should be called with updated date range
      expect(analyticsAPI.getProfileViewsSeries).toHaveBeenCalled();
    });
  });

  test('closes modal when close button is clicked', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    // Find and click the X button
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Also test the bottom Close button
    const bottomCloseButton = screen.getByRole('button', { name: /^close$/i });
    fireEvent.click(bottomCloseButton);

    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  test('closes modal when ESC key is pressed', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    // Press ESC key
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('closes modal when clicking backdrop', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    // Click the backdrop (the outer div with role="dialog")
    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('displays custom date range inputs when custom is selected', async () => {
    analyticsAPI.getProfileViewsSeries.mockResolvedValue({ data: mockSeriesData });
    analyticsAPI.getProfileViewsReferrers.mockResolvedValue({ data: mockReferrersData });

    render(
      <ProfileViewsModal
        user={mockUser}
        registrationDate={registrationDate}
        onClose={mockOnClose}
      />,
      { wrapper }
    );

    const dateRangeSelect = screen.getByRole('combobox', { name: /date range/i });

    // Change to custom range
    fireEvent.change(dateRangeSelect, { target: { value: 'CUSTOM' } });

    // Custom date inputs should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });
  });
});