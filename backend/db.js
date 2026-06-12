const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'crm.db');
let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
    initSchema();
    seed();
    save();
  }
  return db;
}

function save() {
  if (!db) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'user', created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS pipelines (id TEXT PRIMARY KEY, name TEXT NOT NULL, order_num INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS stages (id TEXT PRIMARY KEY, pipeline_id TEXT NOT NULL, name TEXT NOT NULL, probability INTEGER DEFAULT 100, rotting_days INTEGER DEFAULT 14, order_num INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT, phone TEXT, email TEXT, website TEXT, label TEXT, owner_id TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, organization_id TEXT, label TEXT, owner_id TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS deals (id TEXT PRIMARY KEY, title TEXT NOT NULL, value REAL DEFAULT 0, currency TEXT DEFAULT 'USD', pipeline_id TEXT NOT NULL, stage_id TEXT NOT NULL, contact_id TEXT, organization_id TEXT, owner_id TEXT, probability INTEGER DEFAULT 100, expected_close_date TEXT, status TEXT DEFAULT 'open', label TEXT, lost_reason TEXT, won_reason TEXT, order_num INTEGER DEFAULT 0, last_activity_date TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, due_date TEXT, due_time TEXT, duration TEXT, deal_id TEXT, contact_id TEXT, organization_id TEXT, owner_id TEXT, note TEXT, done INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, content TEXT NOT NULL, deal_id TEXT, contact_id TEXT, organization_id TEXT, owner_id TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT, description TEXT, unit TEXT, price REAL DEFAULT 0, tax REAL DEFAULT 0, category TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS deal_products (id TEXT PRIMARY KEY, deal_id TEXT NOT NULL, product_id TEXT NOT NULL, quantity REAL DEFAULT 1, unit_price REAL, discount REAL DEFAULT 0);
  `);
}

function seed() {
  const adminId = 'user-admin-001';
  db.run('INSERT OR IGNORE INTO users (id,name,email,password,role) VALUES (?,?,?,?,?)',
    [adminId, 'Admin User', 'admin@crm.local', bcrypt.hashSync('admin123', 10), 'admin']);

  const p1 = 'pipeline-001', p2 = 'pipeline-002';
  db.run('INSERT OR IGNORE INTO pipelines (id,name,order_num) VALUES (?,?,?)', [p1, 'Sales Pipeline', 0]);
  db.run('INSERT OR IGNORE INTO pipelines (id,name,order_num) VALUES (?,?,?)', [p2, 'Support Pipeline', 1]);

  [
    [p1,'stage-001','Lead In',20,14,0],[p1,'stage-002','Contact Made',40,14,1],
    [p1,'stage-003','Meeting Arranged',60,14,2],[p1,'stage-004','Needs Defined',70,14,3],
    [p1,'stage-005','Proposal Made',80,14,4],[p1,'stage-006','Negotiations Started',90,14,5],
    [p2,'stage-007','New Ticket',20,7,0],[p2,'stage-008','In Progress',50,7,1],[p2,'stage-009','Resolved',100,7,2],
  ].forEach(([pid,id,name,prob,rot,ord]) => {
    db.run('INSERT OR IGNORE INTO stages (id,pipeline_id,name,probability,rotting_days,order_num) VALUES (?,?,?,?,?,?)',
      [id,pid,name,prob,rot,ord]);
  });

  // Sample orgs
  const orgs = [
    ['org-001','Wayne Enterprises',adminId],['org-002','Stark Industries',adminId],
    ['org-003','OSCORP',adminId],['org-004','Pied Piper',adminId],
  ];
  orgs.forEach(([id,name,owner]) => db.run('INSERT OR IGNORE INTO organizations (id,name,owner_id) VALUES (?,?,?)',[id,name,owner]));

  // Sample contacts
  const contacts = [
    ['con-001','Bruce Wayne','bruce@wayne.com','555-0001','org-001',adminId],
    ['con-002','Tony Stark','tony@stark.com','555-0002','org-002',adminId],
    ['con-003','Norman Osborn','norman@oscorp.com','555-0003','org-003',adminId],
    ['con-004','Richard Hendricks','richard@piedpiper.com','555-0004','org-004',adminId],
  ];
  contacts.forEach(([id,name,email,phone,org,owner]) =>
    db.run('INSERT OR IGNORE INTO contacts (id,name,email,phone,organization_id,owner_id) VALUES (?,?,?,?,?,?)',[id,name,email,phone,org,owner]));

  // Sample deals
  const deals = [
    ['deal-001','R&D Contract','org-001','con-001',150000,'stage-001',p1,0],
    ['deal-002','Manufacturing Deal','org-002','con-002',300000,'stage-001',p1,1],
    ['deal-003','Tech Consulting','org-003','con-003',413000,'stage-002',p1,0],
    ['deal-004','Platform License','org-004','con-004',525000,'stage-002',p1,1],
    ['deal-005','Consulting Services','org-002','con-002',513000,'stage-003',p1,0],
    ['deal-006','Overseas Shipping','org-003','con-003',230000,'stage-003',p1,1],
    ['deal-007','Psychological Testing','org-001','con-001',271000,'stage-004',p1,0],
    ['deal-008','Advertising Services','org-001','con-001',152000,'stage-005',p1,0],
    ['deal-009','Consulting Services','org-003','con-003',261000,'stage-006',p1,0],
  ];
  const past = new Date(Date.now() - 20*24*60*60*1000).toISOString();
  deals.forEach(([id,title,org,con,val,stage,pipe,ord]) =>
    db.run('INSERT OR IGNORE INTO deals (id,title,organization_id,contact_id,value,stage_id,pipeline_id,owner_id,order_num,last_activity_date) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id,title,org,con,val,stage,pipe,adminId,ord,past]));
}

function q(sql, params=[]) {
  if (!db) throw new Error('DB not ready');
  const stmt = db.prepare(sql);
  const rows = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}
function run(sql, params=[]) { db.run(sql, params); save(); }
function one(sql, params=[]) { return q(sql,params)[0] || null; }

module.exports = { getDb, q, run, one, save };
