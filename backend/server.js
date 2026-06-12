const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5757;

app.use(cors());
app.use(express.json());

// Init DB then start
getDb().then(() => {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/pipelines', require('./routes/pipelines'));
  app.use('/api/deals', require('./routes/deals'));
  app.use('/api', require('./routes/contacts'));
  app.use('/api', require('./routes/misc'));
  app.use('/api/reports', require('./routes/reports'));

  // Serve frontend in production
  const frontendBuild = path.join(__dirname, 'frontend/dist');
  const fs = require('fs');
  if (fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendBuild, 'index.html'));
      }
    });
  }

  app.listen(PORT, () => console.log(`SalesBoost CRM API running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to init DB:', err);
  process.exit(1);
});
