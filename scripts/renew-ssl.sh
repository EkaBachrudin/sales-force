#!/bin/bash
# ============================================
# Let's Encrypt SSL Auto-Renewal Script
# ============================================
# Script ini untuk auto-renew Let's Encrypt certificate
# dan restart nginx container setelah renew

# Renew certificate
echo "[$(date)] Checking certificate renewal..."
sudo certbot renew --quiet

# Restart nginx container (certificate langsung terbaca dari /etc/letsencrypt)
echo "[$(date)] Restarting nginx container..."
cd /var/www/sales-force
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml restart nginx

echo "[$(date)] SSL renewal completed!"
