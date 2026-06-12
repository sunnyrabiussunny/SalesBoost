const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { q, run, one } = require('../db');
const { auth } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const pipelines = q('SELECT * FROM pipelines ORDER BY order_num');
  const stages = q('SELECT * FROM stages ORDER BY order_num');
  res.json(pipelines.map(p => ({ ...p, stages: stages.filter(s => s.pipeline_id === p.id) })));
});

router.post('/', auth, (req, res) => {
  const { name } = req.body;
  const id = uuidv4();
  const maxOrder = one('SELECT MAX(order_num) as m FROM pipelines');
  run('INSERT INTO pipelines (id,name,order_num) VALUES (?,?,?)', [id, name, (maxOrder?.m||0)+1]);
  ['Lead In','Contact Made','Proposal Made','Negotiations Started'].forEach((n,i) =>
    run('INSERT INTO stages (id,pipeline_id,name,order_num,probability,rotting_days) VALUES (?,?,?,?,?,?)', [uuidv4(),id,n,i,100,14]));
  const pipe = one('SELECT * FROM pipelines WHERE id=?',[id]);
  res.json({ ...pipe, stages: q('SELECT * FROM stages WHERE pipeline_id=? ORDER BY order_num',[id]) });
});

router.put('/:id', auth, (req, res) => {
  run('UPDATE pipelines SET name=? WHERE id=?', [req.body.name, req.params.id]);
  res.json(one('SELECT * FROM pipelines WHERE id=?', [req.params.id]));
});

router.delete('/:id', auth, (req, res) => {
  run('DELETE FROM stages WHERE pipeline_id=?', [req.params.id]);
  run('DELETE FROM pipelines WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

router.post('/:pid/stages', auth, (req, res) => {
  const { name, probability=100, rotting_days=14 } = req.body;
  const id = uuidv4();
  const max = one('SELECT MAX(order_num) as m FROM stages WHERE pipeline_id=?', [req.params.pid]);
  run('INSERT INTO stages (id,pipeline_id,name,probability,rotting_days,order_num) VALUES (?,?,?,?,?,?)',
    [id, req.params.pid, name, probability, rotting_days, (max?.m||0)+1]);
  res.json(one('SELECT * FROM stages WHERE id=?',[id]));
});

router.put('/:pid/stages/:id', auth, (req, res) => {
  const { name, probability, rotting_days } = req.body;
  run('UPDATE stages SET name=COALESCE(?,name), probability=COALESCE(?,probability), rotting_days=COALESCE(?,rotting_days) WHERE id=?',
    [name, probability, rotting_days, req.params.id]);
  res.json(one('SELECT * FROM stages WHERE id=?',[req.params.id]));
});

router.delete('/:pid/stages/:id', auth, (req, res) => {
  run('DELETE FROM stages WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
