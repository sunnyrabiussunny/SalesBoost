const router = require('express').Router();
const { q, one } = require('../db');
const { auth } = require('../middleware/auth');

router.get('/summary', auth, (req, res) => {
  const { pipeline_id } = req.query;
  let dealFilter = pipeline_id ? 'AND pipeline_id=?' : '';
  const p = pipeline_id ? [pipeline_id] : [];

  const totals = one(`SELECT
    COUNT(*) as total_deals,
    SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) as open_deals,
    SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won_deals,
    SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) as lost_deals,
    SUM(CASE WHEN status='open' THEN value ELSE 0 END) as pipeline_value,
    SUM(CASE WHEN status='won' THEN value ELSE 0 END) as won_value,
    AVG(CASE WHEN status='won' THEN value END) as avg_deal_size
    FROM deals WHERE 1=1 ${dealFilter}`, p);

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
  const { pipeline_id } = req.query;
  if (!pipeline_id) return res.status(400).json({error:'pipeline_id required'});
  const rows = q(`
    SELECT s.name, s.order_num,
      COUNT(d.id) as deals,
      COALESCE(SUM(d.value),0) as value
    FROM stages s
    LEFT JOIN deals d ON d.stage_id=s.id AND d.status IN ('open','won','lost')
    WHERE s.pipeline_id=?
    GROUP BY s.id ORDER BY s.order_num
  `, [pipeline_id]);

  // Add conversion rates
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i-1].deals;
    rows[i].conversion = prev > 0 ? Math.round((rows[i].deals / prev) * 100) : 0;
  }
  if (rows[0]) rows[0].conversion = 100;
  res.json(rows);
});

router.get('/deals-over-time', auth, (req, res) => {
  const rows = q(`
    SELECT strftime('%Y-%m', created_at) as month,
      COUNT(*) as started,
      SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END) as lost,
      SUM(CASE WHEN status='won' THEN value ELSE 0 END) as won_value
    FROM deals
    GROUP BY month ORDER BY month DESC LIMIT 12
  `);
  res.json(rows.reverse());
});

router.get('/activities-by-type', auth, (req, res) => {
  res.json(q(`SELECT type, COUNT(*) as count, SUM(done) as completed FROM activities GROUP BY type ORDER BY count DESC`));
});

router.get('/deals-by-owner', auth, (req, res) => {
  res.json(q(`
    SELECT u.name as owner, u.id as owner_id,
      COUNT(d.id) as total_deals,
      SUM(CASE WHEN d.status='open' THEN 1 ELSE 0 END) as open_deals,
      SUM(CASE WHEN d.status='won' THEN 1 ELSE 0 END) as won_deals,
      SUM(CASE WHEN d.status='won' THEN d.value ELSE 0 END) as won_value,
      ROUND(100.0*SUM(CASE WHEN d.status='won' THEN 1 ELSE 0 END)/NULLIF(COUNT(d.id),0),1) as win_rate
    FROM users u
    LEFT JOIN deals d ON d.owner_id=u.id
    GROUP BY u.id ORDER BY won_value DESC
  `));
});

router.get('/lost-reasons', auth, (req, res) => {
  res.json(q(`SELECT lost_reason as reason, COUNT(*) as count FROM deals WHERE status='lost' AND lost_reason IS NOT NULL GROUP BY lost_reason ORDER BY count DESC`));
});

router.get('/revenue-forecast', auth, (req, res) => {
  res.json(q(`
    SELECT strftime('%Y-%m', expected_close_date) as month,
      SUM(value) as total_value,
      SUM(value * probability / 100.0) as weighted_value,
      COUNT(*) as deal_count
    FROM deals WHERE status='open' AND expected_close_date IS NOT NULL
    GROUP BY month ORDER BY month LIMIT 12
  `));
});

module.exports = router;
