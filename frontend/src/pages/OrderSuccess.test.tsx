import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderSuccess from './OrderSuccess';

// The page fetches the order via apiClient; resolve it immediately so the
// component renders past its loading spinner.
vi.mock('../lib/apiClient', () => ({
  apiClient: vi.fn(() =>
    Promise.resolve({
      id: 'UNI-ABC123',
      buyerName: 'Sam Student',
      totalAmount: 105,
      fee: 5,
      createdAt: '2026-03-16T09:30:00.000Z',
      items: [],
    }),
  ),
}));

describe('OrderSuccess page', () => {
  it('renders provided order id from query params', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/order-success?orderId=UNI-ABC123']}>
          <Routes>
            <Route path="/order-success" element={<OrderSuccess />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect((await screen.findAllByText(/UNI-ABC123/)).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('link', { name: /Go to My Orders/i })
    ).toBeInTheDocument();
  });
});
