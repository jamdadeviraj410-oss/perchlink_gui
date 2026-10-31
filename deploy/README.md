# Raspberry Pi 4B Deployment Guide (Phase 4)

This folder contains the complete, automated configuration package for deploying PerchLink onto a **Raspberry Pi 4 Model B (4 GB)** running **Raspberry Pi OS Lite 64-bit**.

---

## 📋 What This Automated Setup Does

1. **Creates the Emergency Wi-Fi Hotspot (`hostapd`):**
   - Broadcasts the unencrypted Wi-Fi network: **`PERCHLINK_SOS`**.
   - No internet, SIM card, or router needed.
2. **Configures Captive Portal Redirection (`dnsmasq`):**
   - Assigns IP addresses (`192.168.4.10` - `192.168.4.150`).
   - Redirects all DNS queries to `192.168.4.1` so smartphones automatically trigger the emergency portal popup when connecting.
3. **USB Serial Permissions:**
   - Adds the user to the `dialout` group to enable communication with the **LILYGO T3-S3 SX1262** radio on `/dev/ttyACM0`.
4. **Auto-Start Service (`systemd`):**
   - Automatically launches the FastAPI server and serves the React frontend whenever the drone is powered on.

---

## 🚀 Quick Setup Instructions on the Raspberry Pi

### Step 1: Copy the Project to the Pi
On your development machine, copy the project folder to the Pi (via SSH or USB thumb drive):

```bash
# Example via rsync/scp:
scp -r perchlink pi@raspberrypi.local:/home/pi/
```

### Step 2: Run the Automated Setup Script
SSH into the Raspberry Pi:

```bash
cd /home/pi/perchlink
sudo bash deploy/setup_rpi.sh
```

The script will automatically configure packages, setup the hotspot, create the Python venv, install requirements, and start the service!

---

## 🔍 Verification Commands on the Pi

```bash
# Check the PerchLink service status
sudo systemctl status perchlink

# View live application logs (SOS requests, LoRa transmissions)
journalctl -u perchlink -f

# Check Wi-Fi hotspot status
sudo systemctl status hostapd

# Check USB Serial connection to LILYGO board
ls -l /dev/ttyACM*
```

---

## 📱 Testing with a Real Smartphone

1. Turn on your smartphone's Wi-Fi.
2. Look for the network **`PERCHLINK_SOS`** and tap to connect.
3. Your phone will say *"No Internet Access"* (normal).
4. Open your mobile browser and go to:  
   **`http://192.168.4.1`**
5. Tap **SEND SOS** to transmit an emergency beacon!
