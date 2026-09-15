'use strict';

const env = require('../src/config/env.config');

/**
 * Sample catalog so the evaluator has something to see without creating
 * data by hand first.
 *
 * IMPORTANT: same caveat as the admin seeder — `bulkInsert` bypasses the
 * product.model.js `beforeSave` hook, so `sale_price` is computed here by
 * hand from `net_price` and `TAX_RATE`, using the exact same formula
 * (round to 2 decimals) the hook applies at runtime. If this seeder and
 * the hook ever disagree, the hook wins for every future write — this
 * data is just the initial snapshot.
 */
function computeSalePrice(netPrice) {
  return (netPrice * (1 + env.TAX_RATE)).toFixed(2);
}

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const products = [
      {
        sku: 'SKU-0001',
        name: 'Wireless Mouse',
        short_description: 'Ergonomic wireless mouse with rechargeable battery',
        long_description:
          'A comfortable wireless mouse with adjustable DPI and a rechargeable battery, designed for long work sessions.',
        image_url: 'seed/wireless-mouse.png',
        net_price: 12990.0,
        current_stock: 50,
        minimum_stock: 10,
        low_stock: 20,
        high_stock: 100,
      },
      {
        sku: 'SKU-0002',
        name: 'Mechanical Keyboard',
        short_description: 'Compact mechanical keyboard with RGB backlight',
        long_description:
          'A tenkeyless mechanical keyboard with hot-swappable switches and per-key RGB lighting.',
        image_url: 'seed/mechanical-keyboard.png',
        net_price: 45990.0,
        current_stock: 30,
        minimum_stock: 5,
        low_stock: 10,
        high_stock: 60,
      },
      {
        sku: 'SKU-0003',
        name: '27-inch Monitor',
        short_description: '27-inch QHD monitor, 144Hz refresh rate',
        long_description:
          'A 27-inch QHD IPS monitor with a 144Hz refresh rate, suitable for both office work and gaming.',
        image_url: 'seed/27-inch-monitor.png',
        net_price: 189990.0,
        current_stock: 15,
        minimum_stock: 3,
        low_stock: 6,
        high_stock: 40,
      },
    ].map((product) => ({
      ...product,
      sale_price: computeSalePrice(product.net_price),
      created_at: now,
      updated_at: now,
      deleted_at: null,
    }));

    const clients = [
      {
        company_rut: '76123456-0',
        industry: 'Retail',
        legal_name: 'Comercial Andes SpA',
        phone: '+56912345678',
        address: 'Av. Providencia 1234, Santiago',
        contact_name: 'Maria Perez',
        contact_email: 'maria.perez@comercialandes.cl',
      },
      {
        company_rut: '77987654-3',
        industry: 'Manufacturing',
        legal_name: 'Industrias del Sur Ltda',
        phone: '+56923456789',
        address: 'Camino a Melipilla 500, Santiago',
        contact_name: 'Jorge Soto',
        contact_email: 'jorge.soto@industriasdelsur.cl',
      },
      {
        company_rut: '76111222-8',
        industry: 'Technology',
        legal_name: 'Tecnologia Rios y Cia',
        phone: '+56934567890',
        address: 'Av. Apoquindo 4500, Santiago',
        contact_name: 'Camila Fuentes',
        contact_email: 'camila.fuentes@tecnologiarios.cl',
      },
    ].map((client) => ({
      ...client,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    }));

    await queryInterface.bulkInsert('products', products);
    await queryInterface.bulkInsert('clients', clients);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', {
      sku: ['SKU-0001', 'SKU-0002', 'SKU-0003'],
    });
    await queryInterface.bulkDelete('clients', {
      company_rut: ['76123456-0', '77987654-3', '76111222-8'],
    });
  },
};
