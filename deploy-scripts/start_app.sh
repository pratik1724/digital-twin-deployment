#!/bin/bash
set -e
echo "[ApplicationStart] Starting backend and frontend services..."


# --- Backend systemd (uvicorn on port 8001) ---
cat > /etc/systemd/system/digital_twin_backend.service <<'EOF'
[Unit]
Description=Digital Twin Backend (uvicorn)
After=network.target


[Service]
User=ubuntu
WorkingDirectory=/app/backend
ExecStart=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
Environment=PYTHONUNBUFFERED=1
StandardOutput=append:/var/log/digital_twin_backend.log
StandardError=append:/var/log/digital_twin_backend.err


[Install]
WantedBy=multi-user.target
EOF


systemctl daemon-reload
systemctl enable digital_twin_backend.service
systemctl restart digital_twin_backend.service || true


# --- Frontend systemd (yarn start - dev server on port 3000) ---
cat > /etc/systemd/system/digital_twin_frontend.service <<'EOF'
[Unit]
Description=Digital Twin Frontend (yarn start)
After=network.target


[Service]
User=ubuntu
WorkingDirectory=/app/frontend
# Use yarn if available. If yarn is installed under /usr/bin/yarn.
ExecStart=/usr/bin/yarn start
Restart=always
Environment=PORT=3000
StandardOutput=append:/var/log/digital_twin_frontend.log
StandardError=append:/var/log/digital_twin_frontend.err


[Install]
WantedBy=multi-user.target
EOF


systemctl daemon-reload
systemctl enable digital_twin_frontend.service
systemctl restart digital_twin_frontend.service || true


echo "[ApplicationStart] Services requested to start"