#!/bin/bash
# SalesBoost CRM - one-click installer for macOS
# Requires Docker Desktop to be installed and running.
set -e

PORT=5757

echo "=================================="
echo "  SalesBoost CRM Installer (macOS)"
echo "=================================="

if ! command -v docker &> /dev/null; then
  echo "Docker not found."
  echo "Please install Docker Desktop first: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "Docker Desktop does not appear to be running."
  echo "Please start Docker Desktop and try again."
  exit 1
fi

# Generate JWT secret if .env doesn't exist
if [ ! -f .env ]; then
  echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
  echo "Generated new JWT secret."
fi

echo "Building and starting SalesBoost CRM..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo ""
echo "=================================="
echo "  SalesBoost CRM is running!"
echo "=================================="
echo "  URL:     http://localhost:$PORT"
echo "  Login:   admin@crm.local / admin123"
echo "=================================="
echo ""
echo "To view logs:  docker compose logs -f"
echo "To stop:       docker compose down"
