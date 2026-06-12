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

module.exports = router;
