#!/bin/bash
# ============================================
# Automated Backup Wrapper Script
# ============================================
# This script runs backup-db.sh followed by sync-backup.sh
# Schedule (crontab): 0 2 * * * /path/to/auto-backup.sh >> /var/log/auto-backup.log 2>&1

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-db.sh"
SYNC_SCRIPT="$SCRIPT_DIR/sync-backup.sh"
LOG_FILE="/var/log/auto-backup.log"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"

# ============================================
# FUNCTIONS
# ============================================
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    send_notification "❌ Backup FAILED: $1"
    exit 1
}

send_notification() {
    local message="$1"
    log "$message"

    # Send email if configured (requires mailutils/postfix)
    if [ -n "$NOTIFICATION_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Backup Alert - $(hostname)" "$NOTIFICATION_EMAIL"
    fi

    # Could add Slack/Telegram notification here
}

# ============================================
# MAIN PROCESS
# ============================================
log "=========================================="
log "Starting automated backup process..."
log "Host: $(hostname)"
log "=========================================="

# Step 1: Run Backup
log ""
log "Step 1/2: Running database backup..."
if sudo bash "$BACKUP_SCRIPT"; then
    log "✓ Database backup completed successfully"
else
    error_exit "Database backup failed! Check logs at /var/log/postgres-backup.log"
fi

# Step 2: Sync to Cloud
log ""
log "Step 2/2: Syncing to cloud storage..."
# Default to gdrive, override with CLOUD_PROVIDER env var if needed
CLOUD_PROVIDER="${CLOUD_PROVIDER:-gdrive}"
log "Cloud provider: $CLOUD_PROVIDER"

# Get original user before sudo (if any)
SYNC_SUCCESS=false
if [ -n "$SUDO_USER" ]; then
    # Running with sudo - run sync as original user to access rclone config
    log "Syncing as user: $SUDO_USER (to access rclone config)"
    if sudo -u "$SUDO_USER" "$SYNC_SCRIPT" "$CLOUD_PROVIDER"; then
        SYNC_SUCCESS=true
    fi
else
    # Not running with sudo - run sync normally
    if bash "$SYNC_SCRIPT" "$CLOUD_PROVIDER"; then
        SYNC_SUCCESS=true
    fi
fi

if [ "$SYNC_SUCCESS" = true ]; then
    log "✓ Cloud sync completed successfully"
else
    log "⚠️  Cloud sync failed! Backup is safe locally."
    log "   Check logs at /var/log/backup-sync.log"
    # Don't exit here - backup is still safe locally
fi

# ============================================
# SUMMARY
# ============================================
log ""
log "=========================================="
log "Automated backup process completed!"

# Show backup summary
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)

if [ -n "$LATEST_BACKUP" ]; then
    log "Latest backup: $LATEST_BACKUP"
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
    log "Size: $BACKUP_SIZE"
fi

log "=========================================="
send_notification "✅ Backup completed successfully on $(hostname)"
