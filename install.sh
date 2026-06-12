#!/bin/bash
# SalesBoost CRM - one-command installer (Ubuntu/Debian)
set -e

PORT=5757
INSTALL_DIR="$(pwd)"

echo "=================================="
echo "  SalesBoost CRM Installer"
echo "=================================="

# Install Docker if missing
if ! command -v docker &> /dev/null; then
  echo "Docker not found. Installing Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  echo "Docker installed."
fi

# Check docker compose plugin
if ! docker compose version &> /dev/null; then
  echo "Docker Compose plugin not found. Installing..."
  sudo apt-get update -y
  sudo apt-get install -y docker-compose-plugin
fi

# Generate JWT secret if .env doesn't exist
if [ ! -f .env ]; then
  echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
  echo "Generated new JWT secret."
fi

# Build and start
echo "Building and starting SalesBoost CRM..."
sudo docker compose down 2>/dev/null || true
sudo docker compose up -d --build

# Install systemd service so it starts on reboot
SERVICE_FILE="/etc/systemd/system/salesboost.service"
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=SalesBoost CRM
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable salesboost

echo ""
echo "=================================="
echo "  SalesBoost CRM is running!"
echo "=================================="
echo "  URL:     http://$(hostname -I | awk '{print $1}'):$PORT"
echo "  Login:   admin@crm.local / admin123"
echo "=================================="
echo ""
echo "Manage with: sudo systemctl [start|stop|restart|status] salesboost"
echo "View logs:   sudo docker compose -f $INSTALL_DIR/docker-compose.yml logs -f"
