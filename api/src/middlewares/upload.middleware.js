'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');

const multer = require('multer');

const env = require('../config/env.config');
const { UnsupportedMediaTypeError, ValidationError } = require('../errors');

/**
 * Extension AND binary signature ("magic bytes") per accepted MIME type.
 *
 * Neither `file.mimetype` nor `file.originalname` can be trusted: both are
 * declared by the client. Trusting the original extension would let a
 * request labelled `image/png` land a `<uuid>.html` (or `.js`) file on the
 * uploads volume, which express.static would then happily serve as
 * text/html — a stored XSS on the api origin. So the stored extension is
 * derived from the MIME whitelist, and the file's first bytes are checked
 * against the signature that MIME type must have.
 *
 * WebP: "RIFF" + 4 size bytes + "WEBP"; the size bytes are skipped.
 */
const IMAGE_SIGNATURES = {
  'image/jpeg': { extension: '.jpg', signatures: [[0xff, 0xd8, 0xff]] },
  'image/png': { extension: '.png', signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  'image/webp': {
    extension: '.webp',
    signatures: [[0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]],
  },
  'image/gif': { extension: '.gif', signatures: [[0x47, 0x49, 0x46, 0x38]] },
};

const MAX_SIGNATURE_LENGTH = 12;

function isMimeTypeAllowed(mimetype) {
  return env.ALLOWED_MIME_TYPES.includes(mimetype) && IMAGE_SIGNATURES[mimetype] !== undefined;
}

function matchesSignature(bytes, signature) {
  if (bytes.length < signature.length) return false;
  return signature.every((expected, index) => expected === null || bytes[index] === expected);
}

// docs/adr/ADR-008: files land on the UPLOAD_DIR volume, named
// <uuid>.<ext> to avoid collisions and to not expose the original name.
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, env.UPLOAD_DIR);
  },
  filename(req, file, cb) {
    // Extension comes from the MIME whitelist, never from originalname.
    cb(null, `${crypto.randomUUID()}${IMAGE_SIGNATURES[file.mimetype].extension}`);
  },
});

function fileFilter(req, file, cb) {
  if (!isMimeTypeAllowed(file.mimetype)) {
    cb(new UnsupportedMediaTypeError(`Unsupported image type: ${file.mimetype}`));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_SIZE },
  fileFilter,
});

/** Removes the file multer already wrote. ENOENT is not an error here. */
async function discardUploadedFile(file) {
  if (!file || !file.path) return;
  try {
    await fs.unlink(file.path);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

/**
 * Runs after multer: reads the first bytes of the stored file and checks
 * they match the signature of the declared MIME type. A text file
 * renamed to `.png` is rejected with 415 and removed from disk.
 */
async function verifyImageSignature(req, res, next) {
  if (!req.file) {
    next();
    return;
  }

  let handle;
  try {
    handle = await fs.open(req.file.path, 'r');
    const { bytesRead, buffer } = await handle.read(Buffer.alloc(MAX_SIGNATURE_LENGTH), 0, MAX_SIGNATURE_LENGTH, 0);
    const head = buffer.subarray(0, bytesRead);
    const { signatures } = IMAGE_SIGNATURES[req.file.mimetype];

    if (!signatures.some((signature) => matchesSignature(head, signature))) {
      await handle.close();
      handle = null;
      await discardUploadedFile(req.file);
      req.file = undefined;
      next(new UnsupportedMediaTypeError('The uploaded file content does not match its declared image type'));
      return;
    }
    next();
  } catch (err) {
    next(err);
  } finally {
    if (handle) await handle.close();
  }
}

// Route order matters: multer must parse the multipart body BEFORE Zod
// validates req.body (docs/02-ARQUITECTURA.md "Recorrido de una petición").
const uploadProductImage = [upload.single('image'), verifyImageSignature];

/**
 * Only used on the create route. On update the image is optional — the
 * existing one is kept unless a new file is sent.
 */
function requireProductImage(req, res, next) {
  if (!req.file) {
    next(new ValidationError('The submitted data is not valid', [{ field: 'image', message: 'image is required' }]));
    return;
  }
  next();
}

/**
 * Product update is the one entity where "at least one field" (ADR-005)
 * cannot be enforced purely inside the Zod schema: an update that only
 * replaces the image is legitimate, but the image never appears in
 * `req.body` — Zod only ever sees the text fields. This runs after
 * multer, so both `req.body` and `req.file` are known, and rejects only
 * the case where neither changed anything.
 */
function requireAtLeastOneUpdateField(req, res, next) {
  const hasBodyFields = req.body && Object.keys(req.body).length > 0;
  if (!hasBodyFields && !req.file) {
    next(
      new ValidationError('The submitted data is not valid', [
        { field: 'body', message: 'At least one field or a new image must be provided' },
      ])
    );
    return;
  }
  next();
}

module.exports = {
  uploadProductImage,
  requireProductImage,
  requireAtLeastOneUpdateField,
  discardUploadedFile,
};
