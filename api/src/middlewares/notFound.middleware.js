'use strict';

/** Registered after every route. Any request that reaches here matched no route. */
function notFound(req, res) {
  res.status(404).json({
    error: { type: 'NotFoundError', message: 'The requested route does not exist' },
  });
}

module.exports = notFound;
