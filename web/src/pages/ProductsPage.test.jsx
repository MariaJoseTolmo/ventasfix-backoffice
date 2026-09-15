import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { renderWithProviders } from '../test/testUtils';
import ProductsPage from './ProductsPage';

describe('ProductsPage', () => {
  it('renders the product list and shows a red stock tag when current_stock < minimum_stock', async () => {
    renderWithProviders(<ProductsPage />);

    expect(await screen.findByText('Wireless Mouse')).toBeInTheDocument();
    const tag = await screen.findByText('Below minimum');
    expect(tag).toBeInTheDocument();
    expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-red');
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
