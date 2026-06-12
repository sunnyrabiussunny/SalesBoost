const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { q, run, one } = require('../db');
const { auth } = require('../middleware/auth');

const dealSelect = `
  SELECT d.*,
    c.name as contact_name, c.email as contact_email, c.phone as contact_phone,
    o.name as organization_name,
    u.name as owner_name,
    s.name as stage_name, s.rotting_days, s.probability as stage_probability,
    p.name as pipeline_name
  FROM deals d
  LEFT JOIN contacts c ON d.contact_id=c.id
  LEFT JOIN organizations o ON d.organization_id=o.id
  LEFT JOIN users u ON d.owner_id=u.id
  LEFT JOIN stages s ON d.stage_id=s.id
  LEFT JOIN pipelines p ON d.pipeline_id=p.id
`;

function addRottingFlag(deals) {
  const now = Date.now();
  return deals.map(d => {
    const refDate = d.last_activity_date || d.created_at;
    const days = Math.floor((now - new Date(refDate).getTime()) / 86400000);
    return { ...d, is_rotting: d.rotting_days ? days >= d.rotting_days : false, days_since_activity: days };
  });
}

router.get('/', auth, (req, res) => {
  const { pipeline_id, stage_id, status='open', owner_id, search } = req.query;
  let sql = dealSelect + ' WHERE 1=1';
  const p = [];
  if (status) { sql+=' AND d.status=?'; p.push(status); }
  if (pipeline_id) { sql+=' AND d.pipeline_id=?'; p.push(pipeline_id); }
  if (stage_id) { sql+=' AND d.stage_id=?'; p.push(stage_id); }
  if (owner_id) { sql+=' AND d.owner_id=?'; p.push(owner_id); }
  if (search) { sql+=' AND d.title LIKE ?'; p.push(`%${search}%`); }
  sql += ' ORDER BY d.order_num, d.created_at DESC';
  res.json(addRottingFlag(q(sql, p)));
});

router.get('/stats', auth, (req, res) => {
  const { pipeline_id } = req.query;
  const stats = q(`
    SELECT s.id, s.name, s.order_num, s.probability,
      COUNT(CASE WHEN d.status='open' THEN 1 END) as deal_count,
      COALESCE(SUM(CASE WHEN d.status='open' THEN d.value ELSE 0 END),0) as total_value
    FROM stages s
    LEFT JOIN deals d ON d.stage_id=s.id
    WHERE s.pipeline_id=?
    GROUP BY s.id ORDER BY s.order_num
  `, [pipeline_id]);
  const totals = one('SELECT COUNT(*) as total, SUM(CASE WHEN status=\'won\' THEN value ELSE 0 END) as won_value, COUNT(CASE WHEN status=\'won\' THEN 1 END) as won_count FROM deals WHERE pipeline_id=?', [pipeline_id]);
  res.json({ stages: stats, totals });
});

router.get('/forecast', auth, (req, res) => {
  const rows = q(`
    SELECT strftime('%Y-%m', expected_close_date) as month,
      SUM(value) as total, SUM(value * probability / 100.0) as weighted,
      COUNT(*) as count
    FROM deals WHERE status='open' AND expected_close_date IS NOT NULL
    GROUP BY month ORDER BY month LIMIT 12
  `);
  res.json(rows);
});

router.get('/:id', auth, (req, res) => {
  const deal = one(dealSelect + ' WHERE d.id=?', [req.params.id]);
  if (!deal) return res.status(404).json({ error: 'Not found' });
  deal.activities = q('SELECT a.*,u.name as owner_name FROM activities a LEFT JOIN users u ON a.owner_id=u.id WHERE a.deal_id=? ORDER BY a.due_date DESC,a.created_at DESC', [req.params.id]);
  deal.notes = q('SELECT n.*,u.name as owner_name FROM notes n LEFT JOIN users u ON n.owner_id=u.id WHERE n.deal_id=? ORDER BY n.created_at DESC', [req.params.id]);
  deal.products = q('SELECT dp.*,pr.name as product_name,pr.unit FROM deal_products dp JOIN products pr ON dp.product_id=pr.id WHERE dp.deal_id=?', [req.params.id]);
  res.json(deal);
});

router.post('/', auth, (req, res) => {
  const { title, value=0, currency='USD', pipeline_id, stage_id, contact_id, organization_id, owner_id, probability=100, expected_close_date, label } = req.body;
  if (!title||!pipeline_id||!stage_id) return res.status(400).json({ error: 'title, pipeline_id, stage_id required' });
  const id = uuidv4();
  const max = one('SELECT MAX(order_num) as m FROM deals WHERE stage_id=?', [stage_id]);
  run(`INSERT INTO deals (id,title,value,currency,pipeline_id,stage_id,contact_id,organization_id,owner_id,probability,expected_close_date,label,order_num,last_activity_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`,
    [id,title,value,currency,pipeline_id,stage_id,contact_id||null,organization_id||null,owner_id||req.user.id,probability,expected_close_date||null,label||null,(max?.m||0)+1]);
  res.json(one('SELECT * FROM deals WHERE id=?',[id]));
});

router.put('/:id', auth, (req, res) => {
  const d = one('SELECT * FROM deals WHERE id=?',[req.params.id]);
  if (!d) return res.status(404).json({ error: 'Not found' });
  const f = {...d, ...req.body};
  run(`UPDATE deals SET title=?,value=?,currency=?,stage_id=?,pipeline_id=?,contact_id=?,organization_id=?,owner_id=?,probability=?,expected_close_date=?,label=?,status=?,lost_reason=?,won_reason=?,updated_at=datetime('now') WHERE id=?`,
    [f.title,f.value,f.currency,f.stage_id,f.pipeline_id,f.contact_id||null,f.organization_id||null,f.owner_id,f.probability,f.expected_close_date||null,f.label||null,f.status,f.lost_reason||null,f.won_reason||null,req.params.id]);
  res.json(one('SELECT * FROM deals WHERE id=?',[req.params.id]));
});

router.put('/:id/move', auth, (req, res) => {
  const { stage_id, order_num, pipeline_id } = req.body;
  run(`UPDATE deals SET stage_id=?,pipeline_id=COALESCE(?,pipeline_id),order_num=?,last_activity_date=datetime('now'),updated_at=datetime('now') WHERE id=?`,
    [stage_id, pipeline_id||null, order_num, req.params.id]);
  res.json(one('SELECT * FROM deals WHERE id=?',[req.params.id]));
});

router.delete('/:id', auth, (req, res) => {
  run('DELETE FROM deals WHERE id=?',[req.params.id]);
  res.json({ success: true });
});

module.exports = router;
