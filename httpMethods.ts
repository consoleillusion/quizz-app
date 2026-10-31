import { getReasonPhrase } from 'http-status-codes';

export const httpMethods = {
  get: {
    method: 'get',
    description: 'Retrieve a resource from the server',
    safe: true,
    idempotent: true,
    requestBody: false,
    responses: [200, 206, 304, 400, 401, 403, 404, 500].map(code => ({
      code,
      reason: getReasonPhrase(code),
    })),
  },

  post: {
    method: 'post',
    description: 'Submit data to the server, typically creating a resource or triggering an action',
    safe: false,
    idempotent: false,
    requestBody: true,
    responses: [200, 201, 202, 204, 400, 401, 403, 404, 409, 422, 429, 500].map(code => ({
      code,
      reason: getReasonPhrase(code),
    })),
  },

  put: {
    method: 'put',
    description: 'Create or completely replace a resource',
    safe: false,
    idempotent: true,
    requestBody: true,
    responses: [200, 201, 204, 400, 401, 403, 404, 409, 412, 422, 500].map(code => ({
      code,
      reason: getReasonPhrase(code),
    })),
  },

  patch: {
    method: 'patch',
    description: 'Partially modify an existing resource',
    safe: false,
    idempotent: false,
    requestBody: true,
    responses: [200, 204, 400, 401, 403, 404, 409, 412, 422, 500].map(code => ({
      code,
      reason: getReasonPhrase(code),
    })),
  },

  delete: {
    method: 'delete',
    description: 'Delete a specified resource',
    safe: false,
    idempotent: true,
    requestBody: false,
    responses: [200, 202, 204, 400, 401, 403, 404, 409, 412, 500, 503].map(code => ({
      code,
      reason: getReasonPhrase(code),
    })),
  },

  head: {
    method: 'head',
    description: 'Retrieve the response headers without returning a response body',
    safe: true,
    idempotent: true,
    requestBody: false,
    responses: [200, 204, 304, 400, 401, 403, 404, 405, 500].map(code => ({
      code,
      reason: getReasonPhrase(code),
    })),
  },

  options: {
    method: 'options',
    description: 'Retrieve communication options and supported methods for a resource',
    safe: true,
    idempotent: true,
    requestBody: false,
    responses: [200, 204, 400, 401, 403, 404, 405, 500].map(code => ({
      code,
      reason: getReasonPhrase(code),
    })),
  },
};
