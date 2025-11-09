#!/bin/bash
set -e
echo "[AfterInstall] Installing dependencies..."


# Backend setup: pip install -r requirements.txt
if [ -d /app/backend ]; then
echo "[AfterInstall] Backend found, installing Python dependencies..."
cd /app/backend
pip3 install --upgrade pip || true
if [ -f requirements.txt ]; then
pip3 install -r requirements.txt
fi
cd /app
else
echo "[AfterInstall] No /app/backend directory found"
fi


# Frontend setup: yarn install
if [ -d /app/frontend ]; then
echo "[AfterInstall] Frontend found, installing node/yarn deps..."
cd /app/frontend
if command -v yarn >/dev/null 2>&1; then
yarn install --frozen-lockfile || yarn install
else
echo "[AfterInstall] yarn not found, falling back to npm"
if [ -f package-lock.json ] || [ -f package.json ]; then
npm ci || npm install
fi
fi
cd /app
else
echo "[AfterInstall] No /app/frontend directory found"
fi


echo "[AfterInstall] done"