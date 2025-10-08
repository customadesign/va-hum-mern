/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import SafeHtml from './SafeHtml';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-path">{location.pathname}</div>;
}

function TestApp({ html }) {
  return (
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SafeHtml html={html} />
              <LocationDisplay />
            </>
          }
        />
        <Route path="/dashboard" element={<div>On Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SafeHtml', () => {
  it('navigates via SPA for internal links starting with "/"', () => {
    const html = `<p>Go to <a href="/dashboard">Dashboard</a></p>`;
    render(<TestApp html={html} />);

    // Initially at root
    expect(screen.getByTestId('location-path')).toHaveTextContent('/');

    const link = screen.getByRole('link', { name: /dashboard/i });
    fireEvent.click(link);

    // Should route to /dashboard without full page reload
    expect(screen.getByTestId('location-path')).toHaveTextContent('/dashboard');
    expect(screen.getByText('On Dashboard')).toBeInTheDocument();
  });

  it('does nothing special for external links (no SPA navigation assertion)', () => {
    const html = `<a href="https://example.com">External</a>`;
    render(<TestApp html={html} />);

    const link = screen.getByRole('link', { name: /external/i });
    // Click should not change SPA path to external URL
    fireEvent.click(link);
    expect(screen.getByTestId('location-path')).toHaveTextContent('/');
  });
});