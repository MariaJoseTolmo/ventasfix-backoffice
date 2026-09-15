// Extracts the API's { error: { type, message, details } } shape (see
// docs/04-CONTRATO-API.md "Formato de errores") from an Axios error.
export function getApiError(error) {
  return error?.response?.data?.error ?? null;
}

// Messages for failures that never reach the API's error handler, so they
// carry no JSON body: the api container is down (Nginx answers 502/504
// with an HTML page) or the network itself failed (no response at all).
const TRANSPORT_MESSAGES = {
  502: 'The server is unavailable. Please try again in a moment.',
  503: 'The server is unavailable. Please try again in a moment.',
  504: 'The server took too long to respond. Please try again.',
};

export function getErrorMessage(error, fallback = 'Something went wrong') {
  const apiMessage = getApiError(error)?.message;
  if (apiMessage) return apiMessage;

  const status = error?.response?.status;
  if (status && TRANSPORT_MESSAGES[status]) return TRANSPORT_MESSAGES[status];
  if (error?.request && !error?.response) return 'Could not reach the server. Check your connection.';

  return fallback;
}

export function isStatus(error, status) {
  return error?.response?.status === status;
}
