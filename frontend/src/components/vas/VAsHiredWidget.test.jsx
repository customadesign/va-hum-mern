import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import VAsHiredWidget from './VAsHiredWidget';
import * as useVAEngagementsHook from '../../hooks/useVAEngagements';

// Mock the useVAEngagements hook
jest.mock('../../hooks/useVAEngagements');

// Test wrapper with required providers
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock user data
const mockUser = {
  _id: 'user123',
  name: 'Test Business User',
  business: { _id: 'business123' }
};

// Mock engagement data
const mockSummaryData = {
  total: 12,
  active: 5,
  considering: 3,
  past: 4
};

const mockEngagements = [
  {
    id: 'eng1',
    status: 'active',
    va: {
      id: 'va1',
      fullName: 'John Doe',
      avatarUrl: 'https://example.com/avatar1.jpg',
      title: 'Frontend Developer'
    },
    contract: {
      startDate: '2024-01-15',
      endDate: null,
      hoursPerWeek: 40,
      rate: 25
    },
    lastActivityAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'eng2', 
    status: 'considering',
    va: {
      id: 'va2',
      fullName: 'Jane Smith',
      avatarUrl: null,
      title: 'Marketing Specialist'
    },
    contract: {
      startDate: '2024-02-01',
      endDate: '2024-08-01',
      hoursPerWeek: 20,
      rate: 30
    },
    lastActivityAt: '2024-01-18T14:30:00Z'
  }
];

describe('VAsHiredWidget', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    useVAEngagementsHook.useVAEngagements.mockReturnValue({
      summary: { isLoading: true },
      list: { isLoading: true },
      isLoading: true,
      error: null,
      refetch: jest.fn()
    });

    render(
      <TestWrapper>
        <VAsHiredWidget user={mockUser} />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders error state with retry button', async () => {
    const mockRefetch = jest.fn();
    useVAEngagementsHook.useVAEngagements.mockReturnValue({
      summary: { error: new Error('API Error') },
      list: { error: new Error('API Error') },
      isLoading: false,
      error: new Error('API Error'),
      refetch: mockRefetch
    });

    render(
      <TestWrapper>
        <VAsHiredWidget user={mockUser} />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try again →');
    fireEvent.click(retryButton);
    
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state when no engagements exist', () => {
    useVAEngagementsHook.useVAEngagements.mockReturnValue({
      summary: {
        data: { total: 0, active: 0, considering: 0, past: 0 },
        isLoading: false,
        error: null
      },
      list: {
        data: { engagements: [] },
        isLoading: false,
        error: null
      },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    render(
      <TestWrapper>
        <VAsHiredWidget user={mockUser} />
      </TestWrapper>
    );

    expect(screen.getByText('No VAs hired yet')).toBeInTheDocument();
    expect(screen.getByText('Browse Candidates')).toBeInTheDocument();
    expect(screen.getByText('Post a Role')).toBeInTheDocument();
  });

  it('renders widget with summary counts and engagements list', () => {
    useVAEngagementsHook.useVAEngagements.mockReturnValue({
      summary: {
        data: mockSummaryData,
        isLoading: false,
        error: null
      },
      list: {
        data: { 
          engagements: mockEngagements,
          pagination: { hasNextPage: true }
        },
        isLoading: false,
        error: null
      },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    render(
      <TestWrapper>
        <VAsHiredWidget user={mockUser} />
      </TestWrapper>
    );

    // Check header
    expect(screen.getByText('VAs Hired')).toBeInTheDocument();
    expect(screen.getByText('View all →')).toBeInTheDocument();

    // Check summary counts
    expect(screen.getByText('12')).toBeInTheDocument(); // Total
    expect(screen.getByText('5')).toBeInTheDocument(); // Active
    expect(screen.getByText('3')).toBeInTheDocument(); // Considering
    expect(screen.getByText('4')).toBeInTheDocument(); // Past

    // Check engagement items
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Marketing Specialist')).toBeInTheDocument();
  });

  it('handles filter tab changes correctly', async () => {
    const mockUseVAEngagements = jest.fn();
    useVAEngagementsHook.useVAEngagements.mockImplementation(mockUseVAEngagements);

    // Initial call with 'all' filter
    mockUseVAEngagements.mockReturnValue({
      summary: {
        data: mockSummaryData,
        isLoading: false,
        error: null
      },
      list: {
        data: { engagements: mockEngagements },
        isLoading: false,
        error: null
      },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    render(
      <TestWrapper>
        <VAsHiredWidget user={mockUser} />
      </TestWrapper>
    );

    // Click on 'Active' filter tab
    const activeTab = screen.getByText('Active');
    fireEvent.click(activeTab);

    // Verify hook was called with active filter
    await waitFor(() => {
      expect(mockUseVAEngagements).toHaveBeenCalledWith({
        status: 'active',
        limit: 5
      });
    });
  });

  it('displays correct status pills and formatting', () => {
    useVAEngagementsHook.useVAEngagements.mockReturnValue({
      summary: {
        data: mockSummaryData,
        isLoading: false,
        error: null
      },
      list: {
        data: { engagements: mockEngagements },
        isLoading: false,
        error: null
      },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    render(
      <TestWrapper>
        <VAsHiredWidget user={mockUser} />
      </TestWrapper>
    );

    // Check status pills
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Considering')).toBeInTheDocument();

    // Check contract details
    expect(screen.getByText('40h/week')).toBeInTheDocument();
    expect(screen.getByText('$25/hr')).toBeInTheDocument();
    expect(screen.getByText('20h/week')).toBeInTheDocument();
    expect(screen.getByText('$30/hr')).toBeInTheDocument();
  });

  it('handles view details and message actions', () => {
    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };

    useVAEngagementsHook.useVAEngagements.mockReturnValue({
      summary: {
        data: mockSummaryData,
        isLoading: false,
        error: null
      },
      list: {
        data: { engagements: mockEngagements },
        isLoading: false,
        error: null
      },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    render(
      <TestWrapper>
        <VAsHiredWidget user={mockUser} />
      </TestWrapper>
    );

    // Click view details button
    const viewDetailsButtons = screen.getAllByText('View details');
    fireEvent.click(viewDetailsButtons[0]);
    
    expect(window.location.href).toBe('/engagements/eng1');

    // Click message button
    const messageButtons = screen.getAllByText('Message');
    fireEvent.click(messageButtons[0]);
    
    expect(window.location.href).toBe('/conversations?va=va1');
  });

  it('shows avatar initials when no avatar URL provided', () => {
    useVAEngagementsHook.useVAEngagements.mockReturnValue({
      summary: {
        data: mockSummaryData,
        isLoading: false,
        error: null
      },
      list: {
        data: { engagements: mockEngagements },
        isLoading: false,
        error: null
      },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });

    render(
      <TestWrapper>
        <VAsHiredWidget user={mockUser} />
      </TestWrapper>
    );

    // Jane Smith has no avatar, should show initials
    expect(screen.getByText('JS')).toBeInTheDocument();
  });
});
