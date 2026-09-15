'use strict';

/**
 * Fake ERP catalog, intentionally shaped NOTHING like VentasFix's own
 * `products` table (see docs/03-MODELO-DATOS.md). The point of this mock
 * is giving tramo 2's Adapter (docs/adr/ADR-006-mock-softland-con-adapter.md)
 * a real, differently-shaped payload to translate — `codigo` instead of
 * `sku`, `precioNeto` instead of `net_price`, etc.
 */
module.exports = [
  {
    codigo: 'SFT-100',
    descripcion: 'Impresora laser monocromatica',
    precioNeto: 89990,
    existencia: 12,
  },
  {
    codigo: 'SFT-200',
    descripcion: 'Silla ergonomica de oficina',
    precioNeto: 65990,
    existencia: 8,
  },
  {
    codigo: 'SFT-300',
    descripcion: 'Escritorio ajustable en altura',
    precioNeto: 149990,
    existencia: 4,
  },
];
