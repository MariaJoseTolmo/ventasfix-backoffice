'use strict';

const db = require('../../src/models');

const { Product, sequelize } = db;

function baseProduct(overrides = {}) {
  return {
    sku: 'TEST-SKU-1',
    name: 'Test product',
    shortDescription: 'Short description',
    longDescription: 'Long description',
    imageUrl: 'seed/test.jpg',
    netPrice: 100.0,
    currentStock: 10,
    minimumStock: 2,
    lowStock: 5,
    highStock: 20,
    ...overrides,
  };
}

async function truncateAll() {
  await db.User.destroy({ truncate: true, cascade: true, force: true });
  await db.Product.destroy({ truncate: true, cascade: true, force: true });
  await db.Client.destroy({ truncate: true, cascade: true, force: true });
}

beforeEach(truncateAll);

afterAll(async () => {
  await sequelize.close();
});

describe('Product model', () => {
  test('sale_price is computed from net_price and TAX_RATE on create', async () => {
    const product = await Product.create(baseProduct());

    // TAX_RATE=0.19 in .env.example: 100.00 * 1.19 = 119.00
    expect(parseFloat(product.salePrice)).toBeCloseTo(119.0, 2);
  });

  test('a client-sent sale_price is ignored and overwritten by the hook', async () => {
    const product = await Product.create(baseProduct({ salePrice: 999.99 }));

    expect(parseFloat(product.salePrice)).toBeCloseTo(119.0, 2);
  });

  test('sale_price is recalculated when net_price changes', async () => {
    const product = await Product.create(baseProduct());
    expect(parseFloat(product.salePrice)).toBeCloseTo(119.0, 2);

    product.set('netPrice', 200.0);
    await product.save();

    expect(parseFloat(product.salePrice)).toBeCloseTo(238.0, 2);
  });

  test('the stock thresholds CHECK constraint rejects minimum_stock > low_stock', async () => {
    // { validate: false } skips Sequelize-level validation (including our
    // own model-wide `stockThresholdsOrdered` validator) so the invalid row
    // actually reaches PostgreSQL and is rejected by the migration's CHECK
    // constraint, not by the application layer.
    await expect(
      Product.create(
        baseProduct({ sku: 'TEST-SKU-2', minimumStock: 50, lowStock: 10, highStock: 100 }),
        { validate: false }
      )
    ).rejects.toThrow();
  });
});
