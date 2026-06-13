const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { run, one } = require('../db');
const { SECRET } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = one('SELECT * FROM users WHERE email=?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (one('SELECT id FROM users WHERE email=?', [email])) return res.status(400).json({ error: 'Email taken' });
  const id = uuidv4();
  run('INSERT INTO users (id,name,email,password) VALUES (?,?,?,?)', [id, name, email, bcrypt.hashSync(password, 10)]);
  const token = jwt.sign({ id, name, email, role: 'user' }, SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id, name, email, role: 'user' } });
});

router.get('/me', require('../middleware/auth').auth, (req, res) => {
  const user = one('SELECT id,name,email,role,created_at FROM users WHERE id=?', [req.user.id]);
  res.json(user);
});

// Change own password
router.post('/change-password', require('../middleware/auth').auth, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both fields required' });
  if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

  const user = one('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!bcrypt.compareSync(current_password, user.password)) return res.status(401).json({ error: 'Current password is incorrect' });

  run('UPDATE users SET password=? WHERE id=?', [bcrypt.hashSync(new_password, 10), req.user.id]);
  res.json({ success: true });
});

// Update own profile (name)
router.put('/profile', require('../middleware/auth').auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  run('UPDATE users SET name=? WHERE id=?', [name, req.user.id]);
  const user = one('SELECT id,name,email,role,created_at FROM users WHERE id=?', [req.user.id]);
  res.json(user);
});

// Admin: create a new user
router.post('/users', require('../middleware/auth').auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { name, email, password, role = 'user' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (one('SELECT id FROM users WHERE email=?', [email])) return res.status(400).json({ error: 'Email already exists' });
  const id = uuidv4();
  run('INSERT INTO users (id,name,email,password,role) VALUES (?,?,?,?,?)', [id, name, email, bcrypt.hashSync(password, 10), role]);
  res.json({ id, name, email, role });
});

// Admin: update a user's role
router.put('/users/:id/role', require('../middleware/auth').auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { role } = req.body;
  if (!['admin','user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  run('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
  res.json({ success: true });
});

// Admin: reset another user's password
router.put('/users/:id/reset-password', require('../middleware/auth').auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  run('UPDATE users SET password=? WHERE id=?', [bcrypt.hashSync(new_password, 10), req.params.id]);
  res.json({ success: true });
});

// Admin: delete a user
router.delete('/users/:id', require('../middleware/auth').auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  run('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
