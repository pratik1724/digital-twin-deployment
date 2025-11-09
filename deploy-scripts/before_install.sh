#!/bin/bash
set -e
echo "[BeforeInstall] starting"


# Ensure /app exists
mkdir -p /app
chown -R ubuntu:ubuntu /app || true


# Backup previous deployments if present
if [ -d /app/backend ]; then
ts=$(date +%s)
mv /app/backend /app/backup/backend_${ts} || true
fi
if [ -d /app/frontend ]; then
ts=$(date +%s)
mv /app/frontend /app/backup/frontend_${ts} || true
fi


echo "[BeforeInstall] done"