import { http, HttpResponse } from 'msw';

export const mockProducts = [
  {
    id: 1,
    sku: 'SKU-0001',
    name: 'Wireless Mouse',
    short_description: 'Ergonomic wireless mouse',
    long_description: 'A comfortable wireless mouse.',
    image_url: 'seed/wireless-mouse.png',
    net_price: '12990.00',
    sale_price: '15458.10',
    current_stock: 2,
    minimum_stock: 10,
    low_stock: 20,
    high_stock: 100,
  },
];

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'admin@ventasfix.cl' && body.password === 'Admin.2026') {
      return HttpResponse.json({
        token: 'fake-jwt-token',
        user: { id: 1, email: 'admin@ventasfix.cl', first_name: 'Admin', last_name: 'User', rut: '11111111-1' },
      });
    }
    return HttpResponse.json(
      { error: { type: 'UnauthorizedError', message: 'Invalid credentials' } },
      { status: 401 }
    );
  }),

  http.get('/api/products', () => HttpResponse.json(mockProducts)),

  http.get('/api/dashboard/summary', () => HttpResponse.json({ users: 1, products: 1, clients: 1 })),
];
