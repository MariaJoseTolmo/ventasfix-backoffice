'use strict';

/**
 * Runs once after the whole test suite (see jest.config.js `globalTeardown`).
 *
 * Removes the per-run temp upload directory created in
 * jest.global-setup.js. Both scripts run in the Jest parent process, so
 * the `process.env.UPLOAD_DIR` set there is still visible here.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = async () => {
  const uploadDir = process.env.UPLOAD_DIR;

  // Only ever delete the directory this suite created itself.
  if (uploadDir && uploadDir.startsWith(path.join(os.tmpdir(), 'ventasfix-test-uploads-'))) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }
};
