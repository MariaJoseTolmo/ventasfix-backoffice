'use strict';

const { UniqueConstraintError } = require('sequelize');
const db = require('../../src/models');

const { User, sequelize } = db;

async function truncateAll() {
  await db.User.destroy({ truncate: true, cascade: true, force: true });
  await db.Product.destroy({ truncate: true, cascade: true, force: true });
  await db.Client.destroy({ truncate: true, cascade: true, force: true });
}

beforeEach(truncateAll);

afterAll(async () => {
  await sequelize.close();
});

describe('User model', () => {
  test('creating a user stores a bcrypt hash, never the plain password, and comparePassword works', async () => {
    const user = await User.create({
      rut: '12345678-5',
      firstName: 'Ana',
      lastName: 'Gomez',
      email: 'ana@ventasfix.cl',
      password: 'S3cret!234',
    });

    expect(user.password).toMatch(/^\$2b\$/);
    expect(user.password).not.toBe('S3cret!234');

    await expect(user.comparePassword('S3cret!234')).resolves.toBe(true);
    await expect(user.comparePassword('wrong-password')).resolves.toBe(false);
  });

  test('instance.save() re-hashes the password when it changes', async () => {
    const user = await User.create({
      rut: '76123456-0',
      firstName: 'Ana',
      lastName: 'Gomez',
      email: 'ana2@ventasfix.cl',
      password: 'FirstPass1!',
    });
    const firstHash = user.password;

    user.set('password', 'SecondPass2!');
    await user.save();

    expect(user.password).toMatch(/^\$2b\$/);
    expect(user.password).not.toBe(firstHash);
    await expect(user.comparePassword('SecondPass2!')).resolves.toBe(true);
  });

  test('User.update(data, { where }) also re-hashes the password, thanks to the forced bulk hook', async () => {
    const user = await User.create({
      rut: '77987654-3',
      firstName: 'Ana',
      lastName: 'Gomez',
      email: 'ana3@ventasfix.cl',
      password: 'FirstPass1!',
    });
    const firstHash = user.password;

    await User.update({ password: 'BulkUpdated9!' }, { where: { id: user.id } });

    const reloaded = await User.scope('withPassword').findByPk(user.id);
    expect(reloaded.password).toMatch(/^\$2b\$/);
    expect(reloaded.password).not.toBe(firstHash);
    await expect(reloaded.comparePassword('BulkUpdated9!')).resolves.toBe(true);
  });

  test('defaultScope excludes password; withPassword scope includes it', async () => {
    await User.create({
      rut: '76111222-8',
      firstName: 'Ana',
      lastName: 'Gomez',
      email: 'ana4@ventasfix.cl',
      password: 'FirstPass1!',
    });

    const withDefault = await User.findOne({ where: { email: 'ana4@ventasfix.cl' } });
    expect(withDefault.password).toBeUndefined();

    const withPassword = await User.scope('withPassword').findOne({ where: { email: 'ana4@ventasfix.cl' } });
    expect(withPassword.password).toMatch(/^\$2b\$/);
  });

  test('destroy() sets deleted_at; findAll hides it; findAll({ paranoid: false }) shows it', async () => {
    const user = await User.create({
      rut: '96543210-8',
      firstName: 'Ana',
      lastName: 'Gomez',
      email: 'ana5@ventasfix.cl',
      password: 'FirstPass1!',
    });

    await user.destroy();

    expect(user.deletedAt).not.toBeNull();

    const visible = await User.findAll({ where: { email: 'ana5@ventasfix.cl' } });
    expect(visible).toHaveLength(0);

    const includingDeleted = await User.findAll({
      where: { email: 'ana5@ventasfix.cl' },
      paranoid: false,
    });
    expect(includingDeleted).toHaveLength(1);
    expect(includingDeleted[0].deletedAt).not.toBeNull();
  });

  test('the email of a deleted user can be reused; a duplicate active email is rejected', async () => {
    const firstUser = await User.create({
      rut: '11111111-1',
      firstName: 'Ana',
      lastName: 'Gomez',
      email: 'reuse@ventasfix.cl',
      password: 'FirstPass1!',
    });
    await firstUser.destroy();

    const secondUser = await User.create({
      rut: '5000000-1',
      firstName: 'Bea',
      lastName: 'Lopez',
      email: 'reuse@ventasfix.cl',
      password: 'SecondPass2!',
    });
    expect(secondUser.id).not.toBe(firstUser.id);

    await expect(
      User.create({
        rut: '76123456-0',
        firstName: 'Carla',
        lastName: 'Diaz',
        email: 'reuse@ventasfix.cl',
        password: 'ThirdPass3!',
      })
    ).rejects.toBeInstanceOf(UniqueConstraintError);
  });
});
