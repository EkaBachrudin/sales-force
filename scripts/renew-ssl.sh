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
docker compose -f docker-compose.registry.yml --env-file .env restart nginx

echo "[$(date)] SSL renewal completed!"
