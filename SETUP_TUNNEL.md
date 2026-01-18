Baik! Untuk domain **erp.jonisteak.com**, berikut konfigurasi spesifiknya:

## **1. Login ke Cloudflare (Lakukan Sekali)**

```bash
# Jalankan login
cloudflared tunnel login
```

Browser akan terbuka, pilih domain `jonisteak.com` untuk diotorisasi.

## **2. Buat Tunnel untuk Next.js ERP**

```bash
# Buat tunnel dengan nama erp-tunnel
cloudflared tunnel create erp-tunnel

# Contoh output:
# Tunnel created with ID: abc123def-4567-8901-ghij234klm56
# Simpan ID ini!
```

## **3. Konfigurasi File**

Buat/edit file konfigurasi:

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Isi dengan:

```yaml
tunnel: abc123def-4567-8901-ghij234klm56 # GANTI dengan Tunnel ID Anda
credentials-file: /home/ubuntu/.cloudflared/abc123def-4567-8901-ghij234klm56.json

ingress:
  # Rule 1: Untuk subdomain erp.jonisteak.com
  - hostname: erp.jonisteak.com
    service: http://localhost:3000
    originRequest:
      connectTimeout: 30s
      noTLSVerify: false

  # Rule 2: Untuk testing local (opsional)
  - hostname: erp-local.jonisteak.com
    service: http://localhost:3001

  # Rule 3: Fallback
  - service: http_status:404
```

## **4. Setup DNS Record di Cloudflare**

```bash
# Route subdomain erp.jonisteak.com ke tunnel
cloudflared tunnel route dns erp-tunnel erp.jonisteek.com

# Verifikasi
cloudflared tunnel route ip erp.jonisteak.com
```

Atau **secara manual di Cloudflare Dashboard**:

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pilih domain `jonisteak.com`
3. Ke **DNS > Records**
4. Tambah record:
   - Type: `CNAME`
   - Name: `erp`
   - Target: `abc123def-4567-8901-ghij234klm56.cfargotunnel.com` (Ganti dengan Tunnel ID Anda)
   - Proxy status: Proxied (orange cloud)
   - TTL: Auto

## **5. Install sebagai Service**

```bash
# Install cloudflared sebagai system service
sudo cloudflared service install

# Atau manual service file
sudo nano /etc/systemd/system/cloudflared-erp.service
```

**Service file custom**:

```ini
[Unit]
Description=Cloudflare Tunnel for ERP Next.js
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/ubuntu/.cloudflared/config.yml run erp-tunnel
Restart=always
RestartSec=5
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Aktifkan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-erp
sudo systemctl start cloudflared-erp
sudo systemctl status cloudflared-erp
```

## **6. Konfigurasi Next.js (Opsional)**

Pastikan `next.config.js` support hostname eksternal:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Tambahkan jika perlu
  images: {
    domains: ["erp.jonisteak.com"],
  },

  // Untuk development dengan hostname eksternal
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
    ]
  },
}

module.exports = nextConfig
```

## **7. Start Next.js Development Server**

```bash
# Pastikan di project directory
cd ~/erp-nextjs

# Install dependencies jika belum
npm install

# Jalankan dengan host 0.0.0.0 agar bisa diakses dari tunnel
npm run dev -- -H 0.0.0.0

# Atau tambah di package.json
# "scripts": {
#   "dev": "next dev -H 0.0.0.0"
# }
```

## **8. Script Setup Lengkap untuk ERP**

Buat file `setup-erp-tunnel.sh`:

```bash
#!/bin/bash
DOMAIN="erp.jonisteak.com"
TUNNEL_NAME="erp-tunnel"
USER="ubuntu"
CONFIG_PATH="/home/$USER/.cloudflared/config.yml"

echo "=== Setup Cloudflare Tunnel untuk $DOMAIN ==="

# Step 1: Install cloudflared
echo "[1] Installing cloudflared..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb

# Step 2: Login (manual step)
echo "[2] Login ke Cloudflare..."
echo "Jalankan manual: cloudflared tunnel login"
echo "Setelah login, lanjut ke step 3"

# Step 3: Create tunnel
echo "[3] Membuat tunnel..."
read -p "Masukkan Tunnel ID setelah create tunnel: " TUNNEL_ID

# Step 4: Create config
echo "[4] Membuat konfigurasi..."
cat > $CONFIG_PATH << EOF
tunnel: $TUNNEL_ID
credentials-file: /home/$USER/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:3000
  - service: http_status:404
EOF

echo "Config created at $CONFIG_PATH"

# Step 5: Setup DNS
echo "[5] Setup DNS record..."
cloudflared tunnel route dns $TUNNEL_NAME $DOMAIN

# Step 6: Install service
echo "[6] Install sebagai service..."
sudo cloudflared service install

echo "=== Setup selesai ==="
echo "Jalankan Next.js: npm run dev -- -H 0.0.0.0"
echo "Akses aplikasi di: https://$DOMAIN"
```

## **9. Testing & Monitoring**

```bash
# Cek tunnel status
cloudflared tunnel info erp-tunnel

# Lihat traffic
cloudflared tunnel traffic erp-tunnel

# Cek logs
sudo journalctl -u cloudflared -f -n 50

# Test koneksi
curl -I https://erp.jonisteak.com
```

## **10. Konfigurasi Tambahan (Opsional)**

**Untuk HTTPS local development**:

```yaml
ingress:
  - hostname: erp.jonisteak.com
    service: https://localhost:3000
    originRequest:
      noTLSVerify: true
      httpHostHeader: "erp.jonisteak.com"
```

**Multiple apps (misal ada staging juga)**:

```yaml
ingress:
  - hostname: erp.jonisteak.com
    service: http://localhost:3000
  - hostname: staging.erp.jonisteak.com
    service: http://localhost:3001
  - service: http_status:404
```

## **11. Troubleshooting Spesifik**

Jika `erp.jonisteak.com` tidak bisa diakses:

```bash
# 1. Cek apakah Next.js berjalan
sudo lsof -i :3000

# 2. Cek apakah tunnel aktif
cloudflared tunnel list

# 3. Cek DNS sudah benar
dig erp.jonisteak.com

# 4. Test tunnel langsung
cloudflared tunnel run erp-tunnel

# 5. Cek firewall
sudo ufw status
sudo ufw allow 3000/tcp
```

## **12. Auto-start dengan System Boot**

Agar Next.js juga auto-start:

```bash
# Buat service untuk Next.js
sudo nano /etc/systemd/system/nextjs-erp.service
```

```ini
[Unit]
Description=Next.js ERP Development Server
After=network.target cloudflared-erp.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/erp-nextjs
ExecStart=/usr/bin/npm run dev -- -H 0.0.0.0
Restart=always
RestartSec=10
Environment=NODE_ENV=development

[Install]
WantedBy=multi-user.target
```

Sekarang Anda bisa akses **https://erp.jonisteak.com** dari mana saja!

Mau tambahkan fitur lain seperti basic auth untuk proteksi development?
