import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { renderWithProviders } from '../test/testUtils';
import ProductsPage from './ProductsPage';

describe('ProductsPage', () => {
  it('renders the product list and marks a product below its minimum stock as critical', async () => {
    renderWithProviders(<ProductsPage />);

    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument();
    // mockProducts: current_stock 2, minimum 10, low 20, high 100 → scaleMax = 120.
    const gauge = await screen.findByRole('img', {
      name: 'Stock 2 of 120 — minimum 10, low 20, high 100',
    });
    expect(gauge).toBeInTheDocument();
    expect(screen.getByText('Below minimum')).toBeInTheDocument();
  });

  it('shows an error alert, not the empty state, when the API is unreachable', async () => {
    // What Nginx answers when the api container is down: an HTML 504, no JSON body.
    server.use(http.get('/api/products', () => new HttpResponse('<html>504</html>', { status: 504 })));

    renderWithProviders(<ProductsPage />);

    expect(await screen.findByText('Could not load records')).toBeInTheDocument();
    expect(screen.getByText('The server took too long to respond. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText('No records yet')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
