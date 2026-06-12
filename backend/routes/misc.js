const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { q, run, one } = require('../db');
const { auth } = require('../middleware/auth');

// ACTIVITIES
router.get('/activities', auth, (req, res) => {
  const { deal_id, contact_id, done, owner_id, date_from, date_to } = req.query;
  let sql = `SELECT a.*,u.name as owner_name,d.title as deal_title,c.name as contact_name FROM activities a LEFT JOIN users u ON a.owner_id=u.id LEFT JOIN deals d ON a.deal_id=d.id LEFT JOIN contacts c ON a.contact_id=c.id WHERE 1=1`;
  const p = [];
  if (deal_id) { sql+=' AND a.deal_id=?'; p.push(deal_id); }
  if (contact_id) { sql+=' AND a.contact_id=?'; p.push(contact_id); }
  if (done !== undefined) { sql+=' AND a.done=?'; p.push(done==='true'?1:0); }
  if (owner_id) { sql+=' AND a.owner_id=?'; p.push(owner_id); }
  if (date_from) { sql+=' AND a.due_date>=?'; p.push(date_from); }
  if (date_to) { sql+=' AND a.due_date<=?'; p.push(date_to); }
  sql+=' ORDER BY a.due_date ASC, a.created_at DESC';
  res.json(q(sql,p));
});

router.post('/activities', auth, (req, res) => {
  const { type, title, due_date, due_time, duration, deal_id, contact_id, organization_id, note } = req.body;
  if (!type||!title) return res.status(400).json({error:'type and title required'});
  const id = uuidv4();
  run('INSERT INTO activities (id,type,title,due_date,due_time,duration,deal_id,contact_id,organization_id,owner_id,note) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [id,type,title,due_date||null,due_time||null,duration||null,deal_id||null,contact_id||null,organization_id||null,req.user.id,note||null]);
  if (deal_id) run("UPDATE deals SET last_activity_date=datetime('now'),updated_at=datetime('now') WHERE id=?",[deal_id]);
  res.json(one('SELECT * FROM activities WHERE id=?',[id]));
});

router.put('/activities/:id', auth, (req, res) => {
  const a = one('SELECT * FROM activities WHERE id=?',[req.params.id]);
  if (!a) return res.status(404).json({error:'Not found'});
  const f = {...a,...req.body};
  run('UPDATE activities SET type=?,title=?,due_date=?,due_time=?,duration=?,note=?,done=? WHERE id=?',
    [f.type,f.title,f.due_date||null,f.due_time||null,f.duration||null,f.note||null,f.done?1:0,req.params.id]);
  res.json(one('SELECT * FROM activities WHERE id=?',[req.params.id]));
});

router.delete('/activities/:id', auth, (req, res) => {
  run('DELETE FROM activities WHERE id=?',[req.params.id]);
  res.json({success:true});
});

// NOTES
router.get('/notes', auth, (req, res) => {
  const { deal_id, contact_id, organization_id } = req.query;
  let sql = `SELECT n.*,u.name as owner_name FROM notes n LEFT JOIN users u ON n.owner_id=u.id WHERE 1=1`;
  const p = [];
  if (deal_id) { sql+=' AND n.deal_id=?'; p.push(deal_id); }
  if (contact_id) { sql+=' AND n.contact_id=?'; p.push(contact_id); }
  if (organization_id) { sql+=' AND n.organization_id=?'; p.push(organization_id); }
  sql+=' ORDER BY n.created_at DESC';
  res.json(q(sql,p));
});

router.post('/notes', auth, (req, res) => {
  const { content, deal_id, contact_id, organization_id } = req.body;
  if (!content) return res.status(400).json({error:'content required'});
  const id = uuidv4();
  run('INSERT INTO notes (id,content,deal_id,contact_id,organization_id,owner_id) VALUES (?,?,?,?,?,?)',
    [id,content,deal_id||null,contact_id||null,organization_id||null,req.user.id]);
  res.json(one('SELECT * FROM notes WHERE id=?',[id]));
});

router.put('/notes/:id', auth, (req, res) => {
  run('UPDATE notes SET content=? WHERE id=?',[req.body.content,req.params.id]);
  res.json(one('SELECT * FROM notes WHERE id=?',[req.params.id]));
});

router.delete('/notes/:id', auth, (req, res) => {
  run('DELETE FROM notes WHERE id=?',[req.params.id]);
  res.json({success:true});
});

// PRODUCTS
router.get('/products', auth, (req, res) => res.json(q('SELECT * FROM products ORDER BY name')));

router.post('/products', auth, (req, res) => {
  const { name, code, description, unit, price=0, tax=0, category } = req.body;
  if (!name) return res.status(400).json({error:'name required'});
  const id = uuidv4();
  run('INSERT INTO products (id,name,code,description,unit,price,tax,category) VALUES (?,?,?,?,?,?,?,?)',
    [id,name,code||null,description||null,unit||null,price,tax,category||null]);
  res.json(one('SELECT * FROM products WHERE id=?',[id]));
});

router.delete('/products/:id', auth, (req, res) => {
  run('DELETE FROM products WHERE id=?',[req.params.id]);
  res.json({success:true});
});

// USERS list (for owner assignment)
router.get('/users', auth, (req, res) => {
  res.json(q('SELECT id,name,email,role FROM users ORDER BY name'));
});

module.exports = router;
