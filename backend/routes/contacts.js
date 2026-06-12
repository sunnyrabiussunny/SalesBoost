const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { q, run, one } = require('../db');
const { auth } = require('../middleware/auth');

// CONTACTS
router.get('/contacts', auth, (req, res) => {
  const { search, label } = req.query;
  let sql = `SELECT c.*,o.name as organization_name,u.name as owner_name FROM contacts c LEFT JOIN organizations o ON c.organization_id=o.id LEFT JOIN users u ON c.owner_id=u.id WHERE 1=1`;
  const p = [];
  if (search) { sql+=' AND (c.name LIKE ? OR c.email LIKE ?)'; p.push(`%${search}%`,`%${search}%`); }
  if (label) { sql+=' AND c.label=?'; p.push(label); }
  sql+=' ORDER BY c.name';
  res.json(q(sql,p));
});

router.get('/contacts/:id', auth, (req, res) => {
  const c = one('SELECT c.*,o.name as organization_name,u.name as owner_name FROM contacts c LEFT JOIN organizations o ON c.organization_id=o.id LEFT JOIN users u ON c.owner_id=u.id WHERE c.id=?',[req.params.id]);
  if (!c) return res.status(404).json({error:'Not found'});
  c.deals = q('SELECT d.*,s.name as stage_name,p.name as pipeline_name FROM deals d LEFT JOIN stages s ON d.stage_id=s.id LEFT JOIN pipelines p ON d.pipeline_id=p.id WHERE d.contact_id=? ORDER BY d.created_at DESC',[req.params.id]);
  c.activities = q('SELECT a.*,u.name as owner_name FROM activities a LEFT JOIN users u ON a.owner_id=u.id WHERE a.contact_id=? ORDER BY a.created_at DESC',[req.params.id]);
  c.notes = q('SELECT n.*,u.name as owner_name FROM notes n LEFT JOIN users u ON n.owner_id=u.id WHERE n.contact_id=? ORDER BY n.created_at DESC',[req.params.id]);
  res.json(c);
});

router.post('/contacts', auth, (req, res) => {
  const { name, email, phone, organization_id, label, notes } = req.body;
  if (!name) return res.status(400).json({error:'Name required'});
  const id = uuidv4();
  run('INSERT INTO contacts (id,name,email,phone,organization_id,label,notes,owner_id) VALUES (?,?,?,?,?,?,?,?)',
    [id,name,email||null,phone||null,organization_id||null,label||null,notes||null,req.user.id]);
  res.json(one('SELECT * FROM contacts WHERE id=?',[id]));
});

router.put('/contacts/:id', auth, (req, res) => {
  const c = one('SELECT * FROM contacts WHERE id=?',[req.params.id]);
  if (!c) return res.status(404).json({error:'Not found'});
  const f = {...c,...req.body};
  run('UPDATE contacts SET name=?,email=?,phone=?,organization_id=?,label=?,notes=? WHERE id=?',
    [f.name,f.email||null,f.phone||null,f.organization_id||null,f.label||null,f.notes||null,req.params.id]);
  res.json(one('SELECT * FROM contacts WHERE id=?',[req.params.id]));
});

router.delete('/contacts/:id', auth, (req, res) => {
  run('DELETE FROM contacts WHERE id=?',[req.params.id]);
  res.json({success:true});
});

// ORGANIZATIONS
router.get('/organizations', auth, (req, res) => {
  const { search } = req.query;
  let sql = `SELECT o.*,u.name as owner_name, (SELECT COUNT(*) FROM contacts WHERE organization_id=o.id) as contact_count, (SELECT COUNT(*) FROM deals WHERE organization_id=o.id AND status='open') as deal_count FROM organizations o LEFT JOIN users u ON o.owner_id=u.id WHERE 1=1`;
  const p = [];
  if (search) { sql+=' AND o.name LIKE ?'; p.push(`%${search}%`); }
  sql+=' ORDER BY o.name';
  res.json(q(sql,p));
});

router.get('/organizations/:id', auth, (req, res) => {
  const org = one('SELECT * FROM organizations WHERE id=?',[req.params.id]);
  if (!org) return res.status(404).json({error:'Not found'});
  org.contacts = q('SELECT * FROM contacts WHERE organization_id=?',[req.params.id]);
  org.deals = q('SELECT d.*,s.name as stage_name FROM deals d LEFT JOIN stages s ON d.stage_id=s.id WHERE d.organization_id=? ORDER BY d.created_at DESC',[req.params.id]);
  org.activities = q('SELECT a.*,u.name as owner_name FROM activities a LEFT JOIN users u ON a.owner_id=u.id WHERE a.organization_id=? ORDER BY a.created_at DESC',[req.params.id]);
  res.json(org);
});

router.post('/organizations', auth, (req, res) => {
  const { name, address, phone, email, website, label } = req.body;
  if (!name) return res.status(400).json({error:'Name required'});
  const id = uuidv4();
  run('INSERT INTO organizations (id,name,address,phone,email,website,label,owner_id) VALUES (?,?,?,?,?,?,?,?)',
    [id,name,address||null,phone||null,email||null,website||null,label||null,req.user.id]);
  res.json(one('SELECT * FROM organizations WHERE id=?',[id]));
});

router.put('/organizations/:id', auth, (req, res) => {
  const o = one('SELECT * FROM organizations WHERE id=?',[req.params.id]);
  if (!o) return res.status(404).json({error:'Not found'});
  const f = {...o,...req.body};
  run('UPDATE organizations SET name=?,address=?,phone=?,email=?,website=?,label=? WHERE id=?',
    [f.name,f.address||null,f.phone||null,f.email||null,f.website||null,f.label||null,req.params.id]);
  res.json(one('SELECT * FROM organizations WHERE id=?',[req.params.id]));
});

router.delete('/organizations/:id', auth, (req, res) => {
  run('DELETE FROM organizations WHERE id=?',[req.params.id]);
  res.json({success:true});
});

module.exports = router;
