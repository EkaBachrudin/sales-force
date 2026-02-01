#!/bin/bash
# ============================================
# PostgreSQL Backup Script for Production
# ============================================
# Usage: ./backup-db.sh
# Schedule (crontab): 0 2 * * * /path/to/backup-db.sh >> /var/log/postgres-backup.log 2>&1

set -e

# ============================================
# CONFIGURATION
# ============================================
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/salesforce_backup_$TIMESTAMP.sql.gz"
LOG_FILE="/var/log/postgres-backup.log"

# Container & Database
CONTAINER_NAME="${CONTAINER_NAME:-sales-force-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-salesforce}"

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
# PRE-CHECKS
# ============================================
# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    error_exit "Container '$CONTAINER_NAME' is not running!"
fi

# Create backup directory if not exists
if [ ! -d "$BACKUP_DIR" ]; then
    log "Creating backup directory: $BACKUP_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo chown $USER:$USER "$BACKUP_DIR"
fi

# ============================================
# BACKUP PROCESS
# ============================================
log "=========================================="
log "Starting backup process..."
log "Database: $DB_NAME"
log "Container: $CONTAINER_NAME"
log "Backup file: $BACKUP_FILE"

# Start backup timer
START_TIME=$(date +%s)

# Dump database dan kompres dengan gzip
log "Executing pg_dump..."
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" --no-owner --no-acl | gzip > "$BACKUP_FILE"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

    log "✓ Backup completed successfully!"
    log "  Size: $BACKUP_SIZE"
    log "  Duration: ${DURATION}s"
    log "  File: $BACKUP_FILE"

    # ============================================
    # BACKUP VERIFICATION
    # ============================================
    log "Verifying backup integrity..."
    if gzip -t "$BACKUP_FILE" 2>/dev/null; then
        log "✓ Backup verification passed"
    else
        log "✗ Backup verification failed!"
        exit 1
    fi

    # ============================================
    # RETENTION POLICY
    # ============================================
    log "Applying retention policy ($RETENTION_DAYS days)..."
    DELETED_COUNT=$(find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)

    if [ "$DELETED_COUNT" -gt 0 ]; then
        log "✓ Deleted $DELETED_COUNT old backup(s)"
    else
        log "No old backups to delete"
    fi

    # ============================================
    # SUMMARY
    # ============================================
    TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f | wc -l)
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

    log "=========================================="
    log "Backup Summary:"
    log "  Total backups: $TOTAL_BACKUPS"
    log "  Total size: $TOTAL_SIZE"
    log "  Retention: $RETENTION_DAYS days"
    log "=========================================="

    # List recent backups (last 5)
    log "Recent backups:"
    find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f -printf '%T+ %p\n' | sort -r | head -5 | while read -r line; do
        log "  $line"
    done

    log "Backup process completed successfully!"

else
    error_exit "pg_dump command failed!"
fi
