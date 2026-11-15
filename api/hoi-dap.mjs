import { applySecurityHeaders, handleApi } from '../server.mjs';

export default async function handler(req, res) {
  applySecurityHeaders(res);
  return handleApi(req, res, '/api/hoi-dap');
}
