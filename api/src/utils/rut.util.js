'use strict';

/**
 * Chilean RUT (Rol Unico Tributario) validation.
 *
 * `rut` is kept untranslated on purpose (see docs/03-MODELO-DATOS.md): it
 * names a specific legal instrument with its own format and check digit,
 * not a generic "tax id".
 *
 * Accepted shape: "<7 or 8 digits>-<check digit>", e.g. "12345678-5" or
 * "76123456-0". The check digit may be "0"-"9" or "K"/"k".
 */

const RUT_PATTERN = /^(\d{7,8})-([\dkK])$/;

function computeCheckDigit(digits) {
  let sum = 0;
  let multiplier = 2;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    sum += Number(digits[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

function isValidRut(rawRut) {
  if (typeof rawRut !== 'string') return false;

  const match = RUT_PATTERN.exec(rawRut.trim());
  if (!match) return false;

  const [, digits, checkDigit] = match;
  return computeCheckDigit(digits) === checkDigit.toUpperCase();
}

module.exports = { isValidRut, computeCheckDigit, RUT_PATTERN };
