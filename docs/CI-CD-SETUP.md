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
| `NEXT_PUBLIC_API_URL` | API URL untuk frontend | `https://api.domain.com` |

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

# Copy nginx config
scp -r docker/nginx user@vps-host:/var/www/sales-force/docker/

# Copy init-db.sql (jika ada)
scp docker/init-db.sql user@vps-host:/var/www/sales-force/docker/
```

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
NEXT_PUBLIC_API_URL=https://your-domain.com/api

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

## Langkah 5: Login ke GitHub Container Registry (One-time)

```bash
# Di VPS
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Untuk membuat Personal Access Token:
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token (classic)
3. Pilih scope: `read:packages`

## Langkah 6: Deploy Pertama Kali

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
