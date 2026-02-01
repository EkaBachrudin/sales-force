#!/bin/bash
# ============================================
# PostgreSQL Restore Script for Production
# ============================================
# Usage: ./restore-db.sh <backup_file.sql.gz>
# Example: ./restore-db.sh /var/backups/postgres/salesforce_backup_20250131_120000.sql.gz

set -e

# ============================================
# CONFIGURATION
# ============================================
CONTAINER_NAME="${CONTAINER_NAME:-sales-force-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-salesforce}"
LOG_FILE="/var/log/postgres-restore.log"

# ============================================
# FUNCTIONS
# ============================================
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# ============================================
# ARGUMENT CHECK
# ============================================
if [ -z "$1" ]; then
    log "Usage: $0 <backup_file.sql.gz>"
    log "Example: $0 /var/backups/postgres/salesforce_backup_20250131_120000.sql.gz"
    log ""
    log "Available backups:"
    find /var/backups/postgres -name "salesforce_backup_*.sql.gz" -type f 2>/dev/null | sort -r | head -10 || log "  No backups found in /var/backups/postgres"
    exit 1
fi

BACKUP_FILE="$1"

# ============================================
# PRE-CHECKS
# ============================================
log "=========================================="
log "Starting restore process..."

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    error_exit "Backup file not found: $BACKUP_FILE"
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    error_exit "Container '$CONTAINER_NAME' is not running!"
fi

# Verify backup integrity
log "Verifying backup file: $BACKUP_FILE"
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
    error_exit "Backup file is corrupted!"
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
BACKUP_DATE=$(stat -c '%y' "$BACKUP_FILE" | cut -d'.' -f1)

log "Backup file information:"
log "  File: $BACKUP_FILE"
log "  Size: $BACKUP_SIZE"
log "  Date: $BACKUP_DATE"

# ============================================
# CONFIRMATION
# ============================================
log ""
log "⚠️  WARNING: This will REPLACE the existing database!"
log "   Database: $DB_NAME"
log "   Container: $CONTAINER_NAME"
log ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation

if [ "$confirmation" != "yes" ]; then
    log "Restore cancelled by user."
    exit 0
fi

# ============================================
# RESTORE PROCESS
# ============================================
log ""
log "Starting restore..."
START_TIME=$(date +%s)

# Optional: Stop dependent services to avoid conflicts
read -p "Stop frontend/backend services during restore? (y/N): " stop_services

if [ "$stop_services" = "y" ] || [ "$stop_services" = "Y" ]; then
    log "Stopping dependent services..."
    docker stop sales-force-fe sales-force-be 2>/dev/null || true
    RESTART_SERVICES=true
else
    log "Skipping service stop..."
    RESTART_SERVICES=false
fi

# Drop existing database and recreate
log "Dropping existing database (if exists)..."
docker exec "$CONTAINER_NAME" sh -c "
    dropdb -U $DB_USER $DB_NAME 2>/dev/null || true
    createdb -U $DB_USER $DB_NAME
" || error_exit "Failed to recreate database!"

log "Restoring from backup (this may take a while)..."
if gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" --quiet; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    log "✓ Restore completed successfully!"
    log "  Duration: ${DURATION}s"

    # ============================================
    # VERIFICATION
    # ============================================
    log ""
    log "Verifying restored database..."

    TABLE_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")

    if [ "$TABLE_COUNT" -gt 0 ]; then
        log "✓ Database verification passed"
        log "  Tables found: $TABLE_COUNT"

        # Show some table info
        log ""
        log "Database tables:"
        docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null || true
    else
        log "⚠️  Warning: No tables found in database!"
    fi

else
    error_exit "Restore command failed!"
fi

# ============================================
# POST-RESTORE
# ============================================
if [ "$RESTART_SERVICES" = true ]; then
    log ""
    log "Restarting services..."
    docker start sales-force-be sales-force-fe 2>/dev/null || true
    log "✓ Services restarted"
fi

log ""
log "=========================================="
log "Restore process completed successfully!"
log "Database: $DB_NAME"
log "Backup: $BACKUP_FILE"
log "=========================================="
