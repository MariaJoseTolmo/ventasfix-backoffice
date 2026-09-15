'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env.config');
const swaggerDocument = require('./config/swagger.config');
const routes = require('./routes');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// docs/adr/ADR-008: product images are served as static files straight
// from the uploads volume.
app.use('/uploads', express.static(env.UPLOAD_DIR));

// Raw spec first, then the interactive UI built on top of it
// (docs/adr/ADR-005: Swagger is generated from the same Zod schemas that
// validate every request).
app.get('/api-docs.json', (req, res) => {
  res.status(200).json(swaggerDocument);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
