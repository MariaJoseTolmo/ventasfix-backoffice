'use strict';

const { Router } = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const clientRoutes = require('./client.routes');
const dashboardRoutes = require('./dashboard.routes');
const softlandRoutes = require('./softland.routes');

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/clients', clientRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/softland', softlandRoutes);

module.exports = router;
