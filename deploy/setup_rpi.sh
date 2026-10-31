#!/usr/bin/env bash
# ==============================================================================
# PerchLink RPi Automated Setup Script (Phase 4 Deployment)
# Target: Raspberry Pi 4 Model B – 4 GB RAM (Raspberry Pi OS Lite 64-bit)
# ==============================================================================
set -e

echo "🛸 Starting PerchLink Raspberry Pi Setup..."

# Ensure running with sudo
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run this script with sudo: sudo bash deploy/setup_rpi.sh"
  exit 1
fi

REAL_USER=${SUDO_USER:-$USER}
PROJECT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

echo "📁 Project Directory: $PROJECT_DIR"
echo "👤 Target User: $REAL_USER"

# 1. Update and install packages
echo "📦 Updating apt repositories and installing packages..."
apt-get update -y
apt-get install -y hostapd dnsmasq iptables python3-pip python3-venv git rfkill

# Unblock Wi-Fi
rfkill unblock wifi || true

# 2. Grant serial port permissions for LILYGO T3-S3 USB connection
echo "🔌 Granting USB serial permissions to $REAL_USER..."
usermod -a -G dialout "$REAL_USER"

# 3. Configure Wi-Fi Access Point (hostapd)
echo "📡 Configuring Wi-Fi Access Point (SSID: PERCHLINK_SOS)..."
systemctl stop hostapd || true
cp "$PROJECT_DIR/deploy/hostapd.conf" /etc/hostapd/hostapd.conf

# Point default hostapd daemon to our configuration
sed -i 's|#DAEMON_CONF=""|DAEMON_CONF="/etc/hostapd/hostapd.conf"|g' /etc/default/hostapd

# 4. Configure DHCP & Captive Portal (dnsmasq)
echo "🌐 Configuring dnsmasq DHCP and DNS Redirection..."
systemctl stop dnsmasq || true
cp "$PROJECT_DIR/deploy/dnsmasq.conf" /etc/dnsmasq.d/perchlink.conf

# 5. Configure Static IP 192.168.4.1 for wlan0
echo "⚙️ Configuring static IP 192.168.4.1 on wlan0..."
if grep -q "192.168.4.1" /etc/dhcpcd.conf 2>/dev/null; then
  echo "Static IP already present in /etc/dhcpcd.conf"
else
  cat "$PROJECT_DIR/deploy/dhcpcd.conf.append" >> /etc/dhcpcd.conf 2>/dev/null || true
fi

# NetworkManager compatibility (for newer Bookworm OS releases)
if command -v nmcli &> /dev/null; then
  echo "Detected NetworkManager. Applying static hotspot profile..."
  nmcli con delete PERCHLINK_SOS 2>/dev/null || true
  nmcli con add type wifi ifname wlan0 con-name PERCHLINK_SOS autoconnect yes ssid PERCHLINK_SOS
  nmcli con modify PERCHLINK_SOS 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared ipv4.addresses 192.168.4.1/24
fi

# 6. Configure port 80 to port 8000 forwarding
echo "🔀 Setting up port 80 -> 8000 redirect via iptables..."
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8000 || true

# 7. Setup Python Virtual Environment and Dependencies
echo "🐍 Setting up Python virtual environment in $PROJECT_DIR/backend/venv..."
if [ ! -d "$PROJECT_DIR/backend/venv" ]; then
  sudo -u "$REAL_USER" python3 -m venv "$PROJECT_DIR/backend/venv"
fi

sudo -u "$REAL_USER" "$PROJECT_DIR/backend/venv/bin/pip" install --upgrade pip
sudo -u "$REAL_USER" "$PROJECT_DIR/backend/venv/bin/pip" install -r "$PROJECT_DIR/backend/requirements.txt"

# 8. Configure systemd Service for Auto-Start on Boot
echo "🚀 Installing perchlink.service into systemd..."
SERVICE_FILE="/etc/systemd/system/perchlink.service"
cat << EOF > "$SERVICE_FILE"
[Unit]
Description=PerchLink Survivor SOS Drone Relay Service
After=network.target

[Service]
Type=simple
User=$REAL_USER
WorkingDirectory=$PROJECT_DIR/backend
ExecStart=$PROJECT_DIR/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

Environment=PYTHONUNBUFFERED=1
Environment=LORA_PORT=/dev/ttyACM0
Environment=LORA_BAUD_RATE=115200
Environment=MOCK_LORA=false
Environment=MAVLINK_CONNECTION=/dev/ttyAMA0

[Install]
WantedBy=multi-user.target
EOF

# 9. Enable and start services
echo "🔄 Enabling and starting services..."
systemctl daemon-reload
systemctl unmask hostapd 2>/dev/null || true
systemctl enable hostapd
systemctl restart hostapd || true

systemctl enable dnsmasq
systemctl restart dnsmasq || true

systemctl enable perchlink.service
systemctl restart perchlink.service

echo "=================================================================="
echo "✅ PERCHLINK RASPBERRY PI DEPLOYMENT COMPLETE!"
echo "📡 Wi-Fi Hotspot: PERCHLINK_SOS"
echo "🌐 Local Address: http://192.168.4.1 (or http://192.168.4.1:8000)"
echo "🛰️ Serial Port:   /dev/ttyACM0 (LILYGO T3-S3 SX1262)"
echo "📊 Service Check: sudo systemctl status perchlink"
echo "=================================================================="
