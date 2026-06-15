# 💼 SalesBoost CRM

Self-hosted sales CRM. Visual drag-and-drop pipelines, dealtracking with rotting/stagnation alerts, activities & calendar, contacts & organizations, product catalog, and an insights dashboard with charts.

Runs entirely on your own server. All data is yours, stored locally in SQLite. No account, no cloud dependency.

**Port: 5757**

## 📸 Screenshots

<p align="center">
  <img src="https://iili.io/CnviZwN.png" width="49%" /> <img src="https://iili.io/CnvsHcG.png" width="46%" />
</p>

## Features

- Multiple pipelines, unlimited custom stages, drag-and-drop deal cards
- Rotting/stagnation alerts on deals (configurable per stage)
- Deal cards: value, owner, label, probability, won/lost reasons
- Contacts & Organizations with labels, search, full CRUD
- Activities: calls, meetings, tasks, deadlines, emails, lunches
- Notes timeline per deal
- Product catalog (price, tax, unit, category)
- Insights dashboard: conversion funnel, revenue forecast, deals over time,
  activity breakdown, performance by owner
- Responsive UI, works on desktop and mobile browser

---

## 🚀 One-Click Install

### Linux (Ubuntu/Debian) — self-hosted server / NAS

```bash
git clone https://github.com/sunnyrabiussunny/salesboost.git
cd salesboost
sudo bash install.sh
```

The script:
- Installs Docker if not already present
- Generates a secret key (`.env`)
- Builds the frontend and backend into one container
- Starts everything with Docker Compose
- Installs a systemd service so SalesBoost starts on reboot

After install, open: `http://localhost:5757` (or `http://<your-server-ip>:5757`)

Default login: **admin@crm.local / admin123**

---

### macOS — one-click install

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/)
installed and running.

```bash
git clone https://github.com/sunnyrabiussunny/salesboost.git
cd salesboost
bash install-mac.sh
```

Open: `http://localhost:5757`

---

### Windows — one-click install

Requires [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
installed and running.

1. Download/clone this repo
2. Double-click `install-windows.bat` (or right-click → Run as administrator)

Open: `http://localhost:5757`

---

## 🐳 Manual Docker Setup (any OS)

If you want full control instead of the install scripts:

```bash
git clone https://github.com/sunnyrabiussunny/salesboost.git
cd salesboost

# Create .env with a random secret
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Build and start
docker compose up -d --build
```

Open: `http://localhost:5757`

### Changing the port

Edit `docker-compose.yml` and change `"5757:5757"` to e.g. `"8080:5757"`.

---

## 🖥️ Node.js Direct Run (without Docker)

If Docker is not available, run the backend (which also serves the built
frontend) directly.

### Requirements

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# macOS
brew install node

# Windows
# Download Node.js LTS from https://nodejs.org
```

### Build and run

```bash
cd salesboost/frontend
npm install
npm run build

cd ../backend
npm install
PORT=5757 npm start
```

Open: `http://localhost:5757`

### Dev mode (frontend hot-reload)

```bash
# Terminal 1
cd salesboost/backend
npm install
npm run dev          # http://localhost:5757

# Terminal 2
cd salesboost/frontend
npm install
npm run dev          # http://localhost:5173, proxies /api to 5757
```

---

## 🌐 Bluehost / Shared Hosting Subdomain Setup

Shared hosting does not support Docker. Use this approach instead:

### Option A — VPS (recommended)

1. Get a small VPS (DigitalOcean, Hetzner, or Linode — from $4/month)
2. Point your subdomain DNS to the VPS IP
   (A record: `salesboost.yourdomain.com` → `VPS_IP`)
3. SSH into the VPS and run the one-command install:
   ```bash
   git clone https://github.com/sunnyrabiussunny/salesboost.git
   cd salesboost
   sudo bash install.sh
   ```
4. Set up Nginx on the VPS to proxy port 5757:
   ```nginx
   server {
       listen 80;
       server_name salesboost.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:5757;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
5. Get a free SSL certificate:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d salesboost.yourdomain.com
   ```

### Option B — Bluehost VPS or Dedicated plan

If you have a Bluehost VPS or Dedicated server (not shared hosting):

```bash
ssh your-bluehost-vps
git clone https://github.com/sunnyrabiussunny/salesboost.git
cd salesboost
sudo bash install.sh
```

Then configure Apache or Nginx to proxy to port 5757.

---

## 🔄 Update to Latest Version

```bash
cd salesboost
git pull origin main
docker compose down
docker compose up -d --build
```

Or simply re-run `sudo bash install.sh` — it detects the existing install and
rebuilds.

---

## 💾 Data and Backups

All data is stored in a Docker volume (`salesboost_data`), backed by SQLite
at `/app/data/crm.db` inside the container.

To back up manually:

```bash
docker run --rm -v salesboost_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/salesboost-backup-$(date +%F).tar.gz -C /data .
```

To restore:

```bash
docker run --rm -v salesboost_data:/data -v $(pwd):/backup alpine \
  sh -c "cd /data && tar xzf /backup/salesboost-backup-<date>.tar.gz"
```

---

## ⚙️ Manage the Service (systemd, after install.sh)

```bash
# Start
sudo systemctl start salesboost

# Stop
sudo systemctl stop salesboost

# Restart
sudo systemctl restart salesboost

# View logs
sudo docker compose -f /path/to/salesboost/docker-compose.yml logs -f

# Check status
sudo systemctl status salesboost
```

---

## 🔧 Environment Variables

| Variable     | Default                          | Description                  |
|--------------|-----------------------------------|-------------------------------|
| `PORT`       | `5757`                            | Server port                   |
| `JWT_SECRET` | random (set by `install.sh`)      | Token signing key             |
| `DATA_DIR`   | `/app/data`                        | SQLite database location      |
| `NODE_ENV`   | `production`                       | Environment mode              |

---

## 🧩 Tech Stack

| Layer     | Technology              |
|-----------|---------------------------|
| Frontend  | React 18 + Vite           |
| Backend   | Node.js + Express          |
| Database  | SQLite (via sql.js)        |
| Container | Docker + Docker Compose    |
| Charts    | Recharts                   |
| Drag&Drop | @dnd-kit                   |

---

## 🗺️ Roadmap (not yet included)

- Goals system (individual/team/company targets)
- CSV import/export
- Duplicate detection & merge UI
- Email integration

## License

MIT.

Built by Sunny Rabius Sunny
