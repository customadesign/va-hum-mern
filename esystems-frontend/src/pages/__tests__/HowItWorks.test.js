import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HowItWorks from '../HowItWorks';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrandingProvider } from '../../contexts/BrandingContext';

// Mock the useNavigate hook
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

// Mock the useBranding hook
jest.mock('../../contexts/BrandingContext', () => ({
  ...jest.requireActual('../../contexts/BrandingContext'),
  useBranding: () => ({
    branding: {
      name: 'Test Brand',
      primaryColor: '#000000',
      textColor: '#333333',
      accentColor: '#ff0000',
    },
    loading: false,
  }),
}));

describe('HowItWorks Component', () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
  });

  test('redirects to /sign-up when button is clicked and user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <BrowserRouter>
        <HowItWorks />
      </BrowserRouter>
    );

    // Find the first "Get matched with a VA" button
    const buttons = screen.getAllByText('Get matched with a VA');
    expect(buttons.length).toBeGreaterThan(0);

    // Click the first button
    fireEvent.click(buttons[0]);

    // Verify navigation was called with /sign-up
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/sign-up');
    });
  });

  test('redirects to /dashboard when button is clicked and user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
    });

    render(
      <BrowserRouter>
        <HowItWorks />
      </BrowserRouter>
    );

    // Find the first "Get matched with a VA" button
    const buttons = screen.getAllByText('Get matched with a VA');
    expect(buttons.length).toBeGreaterThan(0);

    // Click the first button
    fireEvent.click(buttons[0]);

    // Verify navigation was called with /dashboard
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('renders both CTA buttons', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <BrowserRouter>
        <HowItWorks />
      </BrowserRouter>
    );

    // Should have two "Get matched with a VA" buttons
    const buttons = screen.getAllByText('Get matched with a VA');
    expect(buttons).toHaveLength(2);

    // Both should be button elements, not links
    buttons.forEach(button => {
      expect(button.tagName).toBe('BUTTON');
    });
  });
});