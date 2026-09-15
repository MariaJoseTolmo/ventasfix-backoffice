'use strict';

const { UniqueConstraintError, ValidationError } = require('sequelize');
const db = require('../../src/models');

const { Client, sequelize } = db;

function baseClient(overrides = {}) {
  return {
    companyRut: '76123456-0',
    industry: 'Retail',
    legalName: 'Test Client SpA',
    phone: '+56911112222',
    address: 'Test address 123',
    contactName: 'Contact Person',
    contactEmail: 'contact@example.com',
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

describe('Client model', () => {
  test('rejects a company_rut with an invalid check digit', async () => {
    await expect(Client.create(baseClient({ companyRut: '76123456-9' }))).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  test('accepts a company_rut with a valid check digit', async () => {
    const client = await Client.create(baseClient());
    expect(client.companyRut).toBe('76123456-0');
  });

  test('destroy() is reversible and frees up company_rut for reuse', async () => {
    const client = await Client.create(baseClient());
    await client.destroy();

    const visible = await Client.findAll({ where: { companyRut: '76123456-0' } });
    expect(visible).toHaveLength(0);

    const recreated = await Client.create(baseClient({ legalName: 'Another Legal Name' }));
    expect(recreated.id).not.toBe(client.id);

    await expect(Client.create(baseClient())).rejects.toBeInstanceOf(UniqueConstraintError);
  });
});
