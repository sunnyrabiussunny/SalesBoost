const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'crm-super-secret-2024';
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}
module.exports = { auth, SECRET };
