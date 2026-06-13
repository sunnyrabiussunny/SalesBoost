const router = require('express').Router();
const { q, one } = require('../db');
const { auth } = require('../middleware/auth');

function buildFilters(query, alias = 'd') {
  const { pipeline_id, owner_id, date_from, date_to } = query;
  let sql = '';
  const params = [];
  if (pipeline_id) { sql += ` AND ${alias}.pipeline_id=?`; params.push(pipeline_id); }
  if (owner_id) { sql += ` AND ${alias}.owner_id=?`; params.push(owner_id); }
  if (date_from) { sql += ` AND ${alias}.created_at>=?`; params.push(date_from); }
  if (date_to) { sql += ` AND ${alias}.created_at<=?`; params.push(date_to + ' 23:59:59'); }
  return { sql, params };
}

router.get('/summary', auth, (req, res) => {
  const { sql: filterSql, params } = buildFilters(req.query);

  const totals = one(`SELECT
    COUNT(*) as total_deals,
    SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) as open_deals,
    SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won_deals,
    SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) as lost_deals,
    SUM(CASE WHEN status='open' THEN value ELSE 0 END) as pipeline_value,
    SUM(CASE WHEN status='won' THEN value ELSE 0 END) as won_value,
    AVG(CASE WHEN status='won' THEN value END) as avg_deal_size
    FROM deals d WHERE 1=1 ${filterSql}`, params);

  const activitiesStats = one(`SELECT
    COUNT(*) as total,
    SUM(CASE WHEN done=1 THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN done=0 THEN 1 ELSE 0 END) as pending
    FROM activities`);

  const contactsCount = one('SELECT COUNT(*) as total FROM contacts');
  const orgsCount = one('SELECT COUNT(*) as total FROM organizations');

  res.json({ deals: totals, activities: activitiesStats, contacts: contactsCount, organizations: orgsCount });
});

router.get('/funnel', auth, (req, res) => {
  const { pipeline_id, owner_id, date_from, date_to } = req.query;
  if (!pipeline_id) return res.status(400).json({error:'pipeline_id required'});

  let dealFilter = "d.status IN ('open','won','lost')";
  const dealParams = [];
  if (owner_id) { dealFilter += ' AND d.owner_id=?'; dealParams.push(owner_id); }
  if (date_from) { dealFilter += ' AND d.created_at>=?'; dealParams.push(date_from); }
  if (date_to) { dealFilter += ' AND d.created_at<=?'; dealParams.push(date_to + ' 23:59:59'); }

  const rows = q(`
    SELECT s.name, s.order_num,
      COUNT(d.id) as deals,
      COALESCE(SUM(d.value),0) as value
    FROM stages s
    LEFT JOIN deals d ON d.stage_id=s.id AND ${dealFilter}
    WHERE s.pipeline_id=?
    GROUP BY s.id ORDER BY s.order_num
  `, [...dealParams, pipeline_id]);

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i-1].deals;
    rows[i].conversion = prev > 0 ? Math.round((rows[i].deals / prev) * 100) : 0;
  }
  if (rows[0]) rows[0].conversion = 100;
  res.json(rows);
});

router.get('/deals-over-time', auth, (req, res) => {
  const { sql: filterSql, params } = buildFilters(req.query, 'd');
  const rows = q(`
    SELECT strftime('%Y-%m', created_at) as month,
      COUNT(*) as started,
      SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) as lost,
      SUM(CASE WHEN status='won' THEN value ELSE 0 END) as won_value
    FROM deals d WHERE 1=1 ${filterSql}
    GROUP BY month ORDER BY month DESC LIMIT 12
  `, params);
  res.json(rows.reverse());
});

router.get('/activities-by-type', auth, (req, res) => {
  const { owner_id, date_from, date_to } = req.query;
  let sql = '';
  const params = [];
  if (owner_id) { sql += ' AND owner_id=?'; params.push(owner_id); }
  if (date_from) { sql += ' AND created_at>=?'; params.push(date_from); }
  if (date_to) { sql += ' AND created_at<=?'; params.push(date_to + ' 23:59:59'); }
  res.json(q(`SELECT type, COUNT(*) as count, SUM(done) as completed FROM activities WHERE 1=1 ${sql} GROUP BY type ORDER BY count DESC`, params));
});

router.get('/deals-by-owner', auth, (req, res) => {
  const { pipeline_id, date_from, date_to } = req.query;
  let sql = '';
  const params = [];
  if (pipeline_id) { sql += ' AND d.pipeline_id=?'; params.push(pipeline_id); }
  if (date_from) { sql += ' AND d.created_at>=?'; params.push(date_from); }
  if (date_to) { sql += ' AND d.created_at<=?'; params.push(date_to + ' 23:59:59'); }
  res.json(q(`
    SELECT u.name as owner, u.id as owner_id,
      COUNT(d.id) as total_deals,
      SUM(CASE WHEN d.status='open' THEN 1 ELSE 0 END) as open_deals,
      SUM(CASE WHEN d.status='won' THEN 1 ELSE 0 END) as won_deals,
      SUM(CASE WHEN d.status='won' THEN d.value ELSE 0 END) as won_value,
      ROUND(100.0*SUM(CASE WHEN d.status='won' THEN 1 ELSE 0 END)/NULLIF(COUNT(d.id),0),1) as win_rate
    FROM users u
    LEFT JOIN deals d ON d.owner_id=u.id ${sql}
    GROUP BY u.id ORDER BY won_value DESC
  `, params));
});

router.get('/lost-reasons', auth, (req, res) => {
  const { pipeline_id, owner_id, date_from, date_to } = req.query;
  let sql = "status='lost' AND lost_reason IS NOT NULL";
  const params = [];
  if (pipeline_id) { sql += ' AND pipeline_id=?'; params.push(pipeline_id); }
  if (owner_id) { sql += ' AND owner_id=?'; params.push(owner_id); }
  if (date_from) { sql += ' AND created_at>=?'; params.push(date_from); }
  if (date_to) { sql += ' AND created_at<=?'; params.push(date_to + ' 23:59:59'); }
  res.json(q(`SELECT lost_reason as reason, COUNT(*) as count, SUM(value) as value FROM deals WHERE ${sql} GROUP BY lost_reason ORDER BY count DESC`, params));
});

router.get('/revenue-forecast', auth, (req, res) => {
  const { pipeline_id, owner_id } = req.query;
  let sql = "status='open' AND expected_close_date IS NOT NULL";
  const params = [];
  if (pipeline_id) { sql += ' AND pipeline_id=?'; params.push(pipeline_id); }
  if (owner_id) { sql += ' AND owner_id=?'; params.push(owner_id); }
  res.json(q(`
    SELECT strftime('%Y-%m', expected_close_date) as month,
      SUM(value) as total_value,
      SUM(value * probability / 100.0) as weighted_value,
      COUNT(*) as deal_count
    FROM deals WHERE ${sql}
    GROUP BY month ORDER BY month LIMIT 12
  `, params));
});

// Top organizations by open + won deal value
router.get('/top-organizations', auth, (req, res) => {
  const { pipeline_id, owner_id, date_from, date_to } = req.query;
  let sql = '1=1';
  const params = [];
  if (pipeline_id) { sql += ' AND d.pipeline_id=?'; params.push(pipeline_id); }
  if (owner_id) { sql += ' AND d.owner_id=?'; params.push(owner_id); }
  if (date_from) { sql += ' AND d.created_at>=?'; params.push(date_from); }
  if (date_to) { sql += ' AND d.created_at<=?'; params.push(date_to + ' 23:59:59'); }
  res.json(q(`
    SELECT o.name as organization, COUNT(d.id) as deal_count,
      SUM(CASE WHEN d.status='open' THEN d.value ELSE 0 END) as open_value,
      SUM(CASE WHEN d.status='won' THEN d.value ELSE 0 END) as won_value,
      SUM(d.value) as total_value
    FROM deals d
    JOIN organizations o ON d.organization_id=o.id
    WHERE ${sql}
    GROUP BY o.id ORDER BY total_value DESC LIMIT 10
  `, params));
});

// Deal value distribution by label
router.get('/deals-by-label', auth, (req, res) => {
  const { sql: filterSql, params } = buildFilters(req.query);
  res.json(q(`
    SELECT COALESCE(label,'(No label)') as label, COUNT(*) as count, SUM(value) as value
    FROM deals d WHERE 1=1 ${filterSql}
    GROUP BY label ORDER BY value DESC
  `, params));
});

// Activity completion rate over time (weekly)
router.get('/activity-completion', auth, (req, res) => {
  const { owner_id, date_from, date_to } = req.query;
  let sql = '';
  const params = [];
  if (owner_id) { sql += ' AND owner_id=?'; params.push(owner_id); }
  if (date_from) { sql += ' AND due_date>=?'; params.push(date_from); }
  if (date_to) { sql += ' AND due_date<=?'; params.push(date_to); }
  res.json(q(`
    SELECT strftime('%Y-%m', due_date) as month,
      COUNT(*) as total,
      SUM(done) as completed
    FROM activities WHERE due_date IS NOT NULL ${sql}
    GROUP BY month ORDER BY month LIMIT 12
  `, params));
});

module.exports = router;
