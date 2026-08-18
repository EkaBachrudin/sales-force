#!/bin/bash
# ============================================
# Setup Domain & SSL untuk example.com
# ============================================

set -e

DOMAIN="example.com"
VPS_IP="203.0.113.10"
EMAIL="admin@example.com"  # Ganti dengan email Anda

echo "=========================================="
echo "Setup Domain: $DOMAIN"
echo "VPS IP: $VPS_IP"
echo "=========================================="

# 1. Update system
echo -e "\n[1] Update system..."
sudo apt update && sudo apt upgrade -y

# 2. Install Docker & Docker Compose (jika belum)
echo -e "\n[2] Check Docker..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "Docker already installed: $(docker --version)"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt install docker-compose-plugin -y
else
    echo "Docker Compose already installed: $(docker compose version)"
fi

# 3. Install Certbot untuk SSL
echo -e "\n[3] Install Certbot..."
sudo apt install certbot -y

# 4. Stop nginx if running (agar port 80 free untuk certbot)
echo -e "\n[4] Stop existing containers..."
cd /root/sales-force || { echo "Directory not found!"; exit 1; }
docker compose down 2>/dev/null || true

# 5. Generate SSL Certificate
echo -e "\n[5] Generate SSL Certificate..."
sudo certbot certonly --standalone \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --keep-until-expiring

# 6. Copy SSL certificates to project
echo -e "\n[6] Setup SSL certificates..."
sudo mkdir -p docker/nginx/ssl
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/nginx/ssl/key.pem

# 7. Update docker-compose untuk mount SSL
echo -e "\n[7] Update docker-compose..."
if ! grep -q "production.conf" docker-compose.prod.yml; then
    sed -i 's|./docker/nginx/conf.d:/etc/nginx/conf.d:ro|./docker/nginx/conf.d:/etc/nginx/conf.d:ro\n      - ./docker/nginx/conf.d/production.conf:/etc/nginx/conf.d/production.conf:ro|' docker-compose.prod.yml
fi

# 8. Setup auto-renewal SSL
echo -e "\n[8] Setup SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'cd /root/sales-force && sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/nginx/ssl/cert.pem && sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/nginx/ssl/key.pem && docker compose restart nginx'") | crontab -

# 9. Start containers
echo -e "\n[9] Start containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 10. Wait and check
echo -e "\n[10] Checking services..."
sleep 10
docker compose ps

echo -e "\n=========================================="
echo "Setup Selesai!"
echo "=========================================="
echo "Domain: https://$DOMAIN"
echo "HTTPS: https://$DOMAIN"
echo "=========================================="
echo "\nCek status:"
echo "  docker compose ps"
echo "  docker compose logs -f"
echo "=========================================="
