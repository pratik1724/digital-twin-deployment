#!/bin/bash
set -e
echo "[ApplicationStop] Stopping services..."


systemctl stop digital_twin_backend.service || true
systemctl stop digital_twin_frontend.service || true


echo "[ApplicationStop] Done"