# CI/CD Setup Guide

Panduan setup deployment otomatis menggunakan GitHub Actions dan VPS.

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions (CI)                      │
│  - Build Docker images                                      │
│  - Push ke GitHub Container Registry (GHCR)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SSH + docker pull
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    VPS Production                            │
│  - Pull images dari GHCR                                    │
│  - Start containers via docker compose                     │
└─────────────────────────────────────────────────────────────┘
```

## Prasyarat

### Local Development
- Git repository di GitHub
- Docker Desktop (untuk testing local)

### GitHub Repository Settings
- Repository visibility: Public atau Private
- GitHub Actions di-enable

### VPS
- Ubuntu/Debian Linux
- Docker dan Docker Compose terinstall
- SSH access dengan key-based authentication

## Langkah 1: Setup GitHub Secrets

Buka repository di GitHub: **Settings > Secrets and variables > Actions**

Tambahkan secrets berikut:

| Secret | Deskripsi | Contoh |
|--------|-----------|--------|
| `VPS_HOST` | IP address atau domain VPS | `192.168.1.100` atau `domain.com` |
| `VPS_USER` | Username SSH di VPS | `root` atau `ubuntu` |
| `VPS_PORT` | Port SSH (opsional, default 22) | `22` |
| `VPS_SSH_KEY` | Private key untuk SSH | Isi dari file `.pem` atau `id_rsa` |

### Cara mendapatkan `VPS_SSH_KEY`:

```bash
# Di local machine, baca private key
cat ~/.ssh/id_rsa
# atau jika menggunakan specific key
cat /path/to/your-key.pem

# Copy output dan paste ke GitHub Secret
```

### Jika belum ada SSH key:

```bash
# Generate SSH key baru
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Copy public key ke VPS
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@your-vps-host

# Private key untuk GitHub Secret:
cat ~/.ssh/github_actions_deploy
```

## Langkah 2: Setup GitHub Variables (Opsional)

**Settings > Secrets and variables > Actions > Variables**

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `VITE_API_URL` | API URL untuk frontend | `https://api.domain.com` |

## Langkah 3: Setup VPS

### 3.1 Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (jika belum included)
sudo apt install docker-compose-plugin -y

# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add user ke docker group (opsional, agar tidak perlu sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### 3.2 Setup Directory di VPS

```bash
# Buat directory untuk deployment
sudo mkdir -p /var/www/sales-force
cd /var/www/sales-force

# Setup directory structure
mkdir -p docker/nginx/{conf.d,ssl}
mkdir -p docker/logs/nginx
mkdir -p docker/init-db.d
```

### 3.3 Copy File yang Diperlukan ke VPS

**Dari local machine:**

```bash
# Copy docker-compose file
scp docker-compose.registry.yml user@vps-host:/var/www/sales-force/

# Copy nginx config (sudah include production.conf untuk SSL)
scp -r docker/nginx user@vps-host:/var/www/sales-force/docker/

# Copy init-db.sql (jika ada)
scp docker/init-db.sql user@vps-host:/var/www/sales-force/docker/

# Copy .env file (yang sudah diisi dengan production values)
scp .env user@vps-host:/var/www/sales-force/
```

**Catatan:** Nginx config yang di-copy sudah include:
- [nginx.conf](docker/nginx/nginx.conf) - Config global dengan upstream frontend & backend
- [conf.d/production.conf](docker/nginx/conf.d/production.conf) - Server config untuk domain sforce.my.id dengan SSL

Jika domain Anda bukan `sforce.my.id`, edit file `production.conf` setelah di-copy ke VPS.

### 3.4 Buat `.env` di VPS 

```bash
# SSH ke VPS
ssh user@vps-host

# Edit .env file
cd /var/www/sales-force
nano .env
```

Isi dengan environment variables:

```env
# Registry Configuration
REGISTRY=ghcr.io/your-github-username
IMAGE_TAG=latest

# Application Configuration
NODE_ENV=production

# Frontend Configuration
VITE_API_URL=https://your-domain.com

# Backend Configuration
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=salesforce
DB_USER=postgres
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://your-domain.com

# Nginx Configuration
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

**⚠️ PENTING:** Ganti `your-github-username` dengan username GitHub Anda yang sebenarnya.

## Langkah 4: Update docker-compose.registry.yml

Edit file `docker-compose.registry.yml` di VPS:

```yaml
frontend:
  image: ghcr.io/GANTI_USERNAME_GITHUB_ANDA/sales-force-frontend:${IMAGE_TAG:-latest}
  # ...

backend:
  image: ghcr.io/GANTI_USERNAME_GITHUB_ANDA/sales-force-backend:${IMAGE_TAG:-latest}
  # ...
```

## Langkah 5: Setup Domain dan SSL

Pilih salah satu opsi di bawah ini untuk setup SSL:

### Opsi A: Let's Encrypt (Gratis, Auto-renew)

**Kelebihan:** Gratis, trusted certificate, auto-renewal

**Syarat:**
- Domain sudah pointing ke IP VPS (A record)
- Port 80 dan 443 accessible dari internet

#### 5.1 Point Domain ke VPS

Di DNS provider Anda (Cloudflare, Namecheap, dll):

| Type | Name | Value |
|------|------|-------|
| A | @ | IP_VPS_ANDA |
| A | www | IP_VPS_ANDA |

Tunggu propagasi DNS (biasanya 5-30 menit). Cek dengan:
```bash
nslookup your-domain.com
```

#### 5.2 Install Certbot

```bash
# Update package list
sudo apt update

# Install Certbot
sudo apt install certbot -y

# Install Certbot Nginx plugin
sudo apt install python3-certbot-nginx -y
```

#### 5.3 Generate SSL Certificate

**Metode 1: Standalone (nginx belum running)**

```bash
# Stop nginx jika sudah running
sudo docker compose -f docker-compose.registry.yml --env-file .env stop nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Certificate akan disimpan di:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

**Metode 2: Webroot (nginx sudah running)**

```bash
# Generate dengan webroot method
sudo certbot certonly --webroot -w /var/www/certbot \
  -d your-domain.com -d www.your-domain.com
```

#### 5.4 Copy Certificate ke Docker Volume

```bash
# Copy certificate ke project directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /var/www/sales-force/docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /var/www/sales-force/docker/nginx/ssl/

# Set permissions
sudo chmod 644 /var/www/sales-force/docker/nginx/ssl/*.pem
sudo chown $USER:$USER /var/www/sales-force/docker/nginx/ssl/*.pem
```

#### 5.5 Setup Nginx Config untuk SSL

# Cek apakah production.conf sudah ada di VPS
cat /var/www/sales-force/docker/nginx/conf.d/production.conf

#### 5.6 Setup Auto-renewal

Buat script renew di `/var/www/sales-force/scripts/renew-ssl.sh`:

```bash
#!/bin/bash

# Renew certificate
sudo certbot renew --quiet

# Copy new certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /var/www/sales-force/docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /var/www/sales-force/docker/nginx/ssl/

# Restart nginx container
cd /var/www/sales-force
docker compose -f docker-compose.registry.yml --env-file .env restart nginx
```

Setup cron job:
```bash
# Edit crontab
crontab -e

# Tambahkan baris ini (renew setiap hari jam 3 pagi)
0 3 * * * /var/www/sales-force/scripts/renew-ssl.sh >> /var/log/certbot-renew.log 2>&1
```

---

### Opsi B: Cloudflare Origin Certificate

**Kelebihan:** Valid 15 tahun, setup cepat, Cloudflare CDN

**Syarat:** Domain menggunakan Cloudflare DNS

#### 5.1 Setup Cloudflare SSL

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih domain Anda
3. Go to **SSL/TLS > Origin Server**
4. Click **Create Certificate**
5. Select hostnames: `your-domain.com`, `*.your-domain.com`
6. Validity: 15 years
7. Copy **Origin Certificate** dan **Private Key**

#### 5.2 Save Certificate ke VPS

```bash
# Create certificate files
nano /var/www/sales-force/docker/nginx/ssl/cloudflare-origin.pem
# Paste Origin Certificate

nano /var/www/sales-force/docker/nginx/ssl/cloudflare-key.pem
# Paste Private Key

# Set permissions
chmod 644 /var/www/sales-force/docker/nginx/ssl/cloudflare-*.pem
```

#### 5.3 Update Nginx Config

# Cek apakah production.conf sudah ada di VPS
cat /var/www/sales-force/docker/nginx/conf.d/production.conf

#### 5.4 Setup Cloudflare DNS

Di Cloudflare Dashboard:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | @ | IP_VPS_ANDA | Proxied (orange) |
| A | www | IP_VPS_ANDA | Proxied (orange) |

#### 5.5 Cloudflare SSL Settings

Di **SSL/TLS > Overview**:
- Encryption mode: **Full (strict)**

---

### Testing SSL

Setelah setup, test SSL configuration:

```bash
# Test dari local machine
curl -I https://your-domain.com

# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Online test: https://www.ssllabs.com/ssltest/
```

---

## Langkah 6: Login ke GitHub Container Registry (One-time)

```bash
# Di VPS
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Untuk membuat Personal Access Token:
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token (classic)
3. Pilih scope: `read:packages`

## Langkah 7: Deploy Pertama Kali

### Opsi A: Automatic (via GitHub Actions)

1. Push code ke branch `main`:
```bash
git add .
git commit -m "feat: add CI/CD deployment"
git push origin main
```

2. Buka GitHub > Actions > Lihat workflow berjalan

3. Setelah selesai, cek VPS:
```bash
ssh user@vps-host
cd /var/www/sales-force
docker compose -f docker-compose.registry.yml --env-file .env ps
```

### Opsi B: Manual (via Script)

```bash
# Copy deploy script ke VPS
scp scripts/vps-deploy.sh user@vps-host:/var/www/sales-force/

# SSH ke VPS
ssh user@vps-host

# Make script executable
cd /var/www/sales-force
chmod +x vps-deploy.sh

# Run deployment
./vps-deploy.sh deploy
```

## Troubleshooting

### Workflow gagal di GitHub Actions

**Error: Permission denied (publickey)**
- Pastikan `VPS_SSH_KEY` secret sudah benar
- Coba test SSH dari local: `ssh -i ~/.ssh/your-key user@vps-host`

**Error: docker pull failed**
- Pastikan sudah login ke GHCR di VPS
- Cek apakah repository visibility public/private

### Container tidak start di VPS

**Cek logs:**
```bash
docker compose -f docker-compose.registry.yml --env-file .env logs
```

**Cek spesifik service:**
```bash
docker compose -f docker-compose.registry.yml --env-file .env logs frontend
docker compose -f docker-compose.registry.yml --env-file .env logs backend
```

**Restart service:**
```bash
docker compose -f docker-compose.registry.yml --env-file .env restart
```

### Port already in use

```bash
# Cek port yang dipakai
sudo netstat -tulpn

# Stop service yang konflik
sudo systemctl stop nginx  # jika nginx terinstall di host
```

### SSL / HTTPS Issues

**Error: SSL certificate expired**

```bash
# Manual renew Let's Encrypt
sudo certbot renew

# Copy dan restart nginx
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /var/www/sales-force/docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /var/www/sales-force/docker/nginx/ssl/
cd /var/www/sales-force
docker compose -f docker-compose.registry.yml --env-file .env restart nginx
```

**Error: SSL connection error / ERR_SSL_PROTOCOL_ERROR**

- Pastikan port 443 open: `sudo ufw allow 443/tcp`
- Cek nginx config sudah benar
- Pastikan certificate files exist dan readable

**Error: Certificate verify failed (Cloudflare)**

- Pastikan Cloudflare SSL/TLS mode set ke **Full (strict)**
- Cek Origin Certificate sudah benar di VPS
- Install Cloudflare Origin CA: `sudo apt install ca-certificates`

**Error: Domain tidak resolving**

```bash
# Cek DNS propagation
nslookup your-domain.com
dig your-domain.com

# Cek dari VPS
curl -I http://localhost
```

**Browser menunjukkan "Not Secure"**

- Clear browser cache
- Pastikan HTTP redirect ke HTTPS
- Cek SSL configuration di nginx config
- Test dengan: https://www.ssllabs.com/ssltest/

### Certbot Failed

**Error: Failed to connect to host for DVSNI challenge**

```bash
# Pastikan port 80 dan 443 open
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Cek firewall status
sudo ufw status
```

**Error: Too many certificates already issued**

Let's Encrypt ada rate limit (5 certificates per domain per 7 hari). Gunakan staging environment untuk testing:

```bash
# Test dengan staging environment
sudo certbot certonly --test-mode --standalone -d your-domain.com
```

## Rollback

Jika deployment bermasalah, rollback ke versi sebelumnya:

```bash
# Cek image yang tersedia
docker images | grep sales-force

# Edit .env untuk ganti IMAGE_TAG
# IMAGE_TAG=sha-before-commit

# Restart dengan tag lama
docker compose -f docker-compose.registry.yml --env-file .env up -d
```

## Monitoring

### Cek service status
```bash
docker compose -f docker-compose.registry.yml --env-file .env ps
```

### Cek resource usage
```bash
docker stats
```

### Cek disk space
```bash
df -h
docker system df
```

### Cleanup old images
```bash
docker image prune -af --filter "until=24h"
```
