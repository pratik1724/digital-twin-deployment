#!/bin/bash
set -e

# --- Configuration: change these as needed ---
REGION="us-east-1"        # <-- change to your AWS region, e.g. ap-south-1
# -------------------------------------------

# Update & install base packages
apt-get update -y
apt-get install -y curl wget unzip python3 python3-venv python3-pip ca-certificates gnupg lsb-release

# Install Node.js 18 (NodeSource) and Yarn (Debian/Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
# Install yarn via npm globally (alternative: install from yarn repo)
npm install -g yarn

# Create /app directory for deployments
mkdir -p /app
chown -R ubuntu:ubuntu /app || true

# Install AWS CodeDeploy agent (Ubuntu/Debian)
cd /tmp
# Download and run the installer for the region
wget https://aws-codedeploy-${REGION}.s3.${REGION}.amazonaws.com/latest/install -O ./install
chmod +x ./install
# installer may exit non-zero if agent already present; ignore errors
./install auto || true

# Enable & start the agent
if command -v systemctl >/dev/null 2>&1; then
  systemctl enable codedeploy-agent || true
  systemctl start codedeploy-agent || true
else
  service codedeploy-agent start || true
fi

# Optional: adjust permissions (user 'ubuntu' assumed; change if your AMI uses 'ec2-user')
chown -R ubuntu:ubuntu /app
echo "ec2-user-data: completed successfully"
