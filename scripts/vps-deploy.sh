#!/bin/bash
# ============================================
# VPS Deployment Script
# ============================================
# Script ini digunakan untuk:
# 1. Setup awal di VPS
# 2. Manual deploy (jika tidak menggunakan GitHub Actions)

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/sales-force}"
REGISTRY="${REGISTRY:-ghcr.io/yourusername}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
COMPOSE_FILE="docker-compose.registry.yml"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warn "Running as root. Some commands will use sudo."
    fi
}

# Create directory structure
setup_directories() {
    log_info "Setting up directory structure..."
    sudo mkdir -p "$DEPLOY_DIR"
    sudo mkdir -p "$DEPLOY_DIR/docker/nginx/conf.d"
    sudo mkdir -p "$DEPLOY_DIR/docker/nginx/ssl"
    sudo mkdir -p "$DEPLOY_DIR/docker/logs/nginx"
    sudo mkdir -p "$DEPLOY_DIR/docker/init-db.d"

    # Set permissions
    sudo chown -R $USER:$USER "$DEPLOY_DIR"
}

# Copy necessary files to VPS (run this locally)
copy_files_to_vps() {
    log_info "Copying files to VPS..."
    log_warn "Run this command from your local machine:"
    echo ""
    echo "rsync -avz --exclude='node_modules' --exclude='.git' \\"
    echo "  --exclude='.next' --exclude='dist' \\"
    echo "  /path/to/sales-force/ \\"
    echo "  $VPS_USER@$VPS_HOST:$DEPLOY_DIR/"
    echo ""
}

# Login to GitHub Container Registry
login_to_registry() {
    log_info "Logging in to GitHub Container Registry..."
    echo "Username (your GitHub username):"
    read -r GH_USERNAME
    echo "Personal Access Token (with read:packages scope):"
    read -rs GH_TOKEN

    echo $GH_TOKEN | docker login ghcr.io -u $GH_USERNAME --password-stdin
}

# Pull latest images
pull_images() {
    log_info "Pulling latest images..."
    cd "$DEPLOY_DIR"

    docker pull "$REGISTRY/sales-force-frontend:$IMAGE_TAG"
    docker pull "$REGISTRY/sales-force-backend:$IMAGE_TAG"

    # Tag as latest for easier management
    docker tag "$REGISTRY/sales-force-frontend:$IMAGE_TAG" "$REGISTRY/sales-force-frontend:latest"
    docker tag "$REGISTRY/sales-force-backend:$IMAGE_TAG" "$REGISTRY/sales-force-backend:latest"
}

# Start services
start_services() {
    log_info "Starting services..."
    cd "$DEPLOY_DIR"

    docker compose -f "$COMPOSE_FILE" --env-file .env up -d
}

# Stop services
stop_services() {
    log_info "Stopping services..."
    cd "$DEPLOY_DIR"

    docker compose -f "$COMPOSE_FILE" --env-file .env down
}

# Restart services
restart_services() {
    log_info "Restarting services..."
    cd "$DEPLOY_DIR"

    docker compose -f "$COMPOSE_FILE" --env-file .env restart
}

# Show status
show_status() {
    log_info "Service status:"
    cd "$DEPLOY_DIR"

    docker compose -f "$COMPOSE_FILE" --env-file .env ps
}

# Show logs
show_logs() {
    log_info "Showing logs (Ctrl+C to exit)..."
    cd "$DEPLOY_DIR"

    docker compose -f "$COMPOSE_FILE" --env-file .env logs -f "${1:-}"
}

# Cleanup old images
cleanup_images() {
    log_info "Cleaning up old images (older than 24 hours)..."
    docker image prune -af --filter "until=24h"
}

# Full deployment
deploy() {
    log_info "Starting deployment..."
    setup_directories
    login_to_registry
    pull_images
    start_services
    show_status
    log_info "Deployment completed!"
}

# Main menu
show_menu() {
    echo ""
    echo "============================================"
    echo "  Sales Force - VPS Deployment Script"
    echo "============================================"
    echo ""
    echo "Available commands:"
    echo "  setup       - Setup directory structure"
    echo "  login       - Login to container registry"
    echo "  pull        - Pull latest images"
    echo "  start       - Start services"
    echo "  stop        - Stop services"
    echo "  restart     - Restart services"
    echo "  status      - Show service status"
    echo "  logs        - Show logs (all services)"
    echo "  logs [svc]  - Show logs for specific service"
    echo "  cleanup     - Cleanup old images"
    echo "  deploy      - Full deployment (setup + pull + start)"
    echo ""
}

# Parse command
case "${1:-}" in
    setup)
        setup_directories
        ;;
    login)
        login_to_registry
        ;;
    pull)
        pull_images
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "${2:-}"
        ;;
    cleanup)
        cleanup_images
        ;;
    deploy)
        deploy
        ;;
    *)
        show_menu
        echo "Usage: $0 {setup|login|pull|start|stop|restart|status|logs|cleanup|deploy}"
        exit 1
        ;;
esac
