#!/bin/bash
set -e
echo "[ValidateService] Validating backend and frontend health..."


BACKEND_OK=1
for i in {1..12}; do
if curl -sSf http://127.0.0.1:8001/health >/dev/null 2>&1; then
echo "[ValidateService]