#!/bin/bash
# ============================================
# Backup Sync to Cloud Storage
# ============================================
# Usage: ./sync-backup.sh [provider]
# Providers: s3, gdrive, dropbox, sftp, local
# Schedule (crontab): 0 3 * * * /path/to/sync-backup.sh s3 >> /var/log/backup-sync.log 2>&1

set -e

# ============================================
# CONFIGURATION
# ============================================
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
PROVIDER="${1:-s3}"
LOG_FILE="/var/log/backup-sync.log"
MAX_AGE_DAYS="${MAX_AGE_DAYS:-90}"
CLEANUP_AFTER_DAYS="${CLEANUP_AFTER_DAYS:-30}"  # Delete files older than this in cloud

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

check_rclone() {
    if ! command -v rclone &> /dev/null; then
        error_exit "rclone is not installed! Install with: curl https://rclone.org/install.sh | sudo bash"
    fi
}

# ============================================
# PRE-CHECKS
# ============================================
log "=========================================="
log "Starting backup sync..."
log "Provider: $PROVIDER"
log "Source: $BACKUP_DIR"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    error_exit "Backup directory not found: $BACKUP_DIR"
fi

# Count local backups
LOCAL_COUNT=$(find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f | wc -l)
log "Local backups: $LOCAL_COUNT"

if [ "$LOCAL_COUNT" -eq 0 ]; then
    log "No backups to sync. Exiting."
    exit 0
fi

# ============================================
# SYNC BASED ON PROVIDER
# ============================================
case "$PROVIDER" in
    s3)
        # AWS S3 / S3-Compatible (Wasabi, DigitalOcean Spaces, etc)
        check_rclone
        REMOTE="${S3_REMOTE:-s3:salesforce-backups}"

        log "Syncing to S3: $REMOTE"
        rclone sync "$BACKUP_DIR" "$REMOTE" \
            --include "salesforce_backup_*.sql.gz" \
            --max-age "${MAX_AGE_DAYS}d" \
            --progress \
            --log-file="$LOG_FILE" \
            --log-level INFO \
            --transfers 4 \
            || error_exit "Rclone sync failed!"

        # Cleanup old files in cloud
        log ""
        log "Cleaning up files older than ${CLEANUP_AFTER_DAYS} days in S3..."
        DELETED=$(rclone delete "$REMOTE" \
            --min-age "${CLEANUP_AFTER_DAYS}d" \
            --include "salesforce_backup_*.sql.gz" \
            --log-file="$LOG_FILE" \
            --log-level INFO 2>&1 | grep -c "deleted" || echo "0")
        log "Deleted $DELETED old file(s) from S3"
        ;;

    gdrive)
        # Google Drive
        check_rclone
        REMOTE="${GDRIVE_REMOTE:-gdrive:salesforce-backups}"

        log "Syncing to Google Drive: $REMOTE"
        rclone sync "$BACKUP_DIR" "$REMOTE" \
            --include "salesforce_backup_*.sql.gz" \
            --max-age "${MAX_AGE_DAYS}d" \
            --progress \
            --log-file="$LOG_FILE" \
            --log-level INFO \
            --transfers 4 \
            || error_exit "Rclone sync failed!"

        # Cleanup old files in cloud
        log ""
        log "Cleaning up files older than ${CLEANUP_AFTER_DAYS} days in Google Drive..."
        DELETED=$(rclone delete "$REMOTE" \
            --min-age "${CLEANUP_AFTER_DAYS}d" \
            --include "salesforce_backup_*.sql.gz" \
            --log-file="$LOG_FILE" \
            --log-level INFO 2>&1 | grep -c "deleted" || echo "0")
        log "Deleted $DELETED old file(s) from Google Drive"
        ;;

    dropbox)
        # Dropbox
        check_rclone
        REMOTE="${DROPBOX_REMOTE:-dropbox:salesforce-backups}"

        log "Syncing to Dropbox: $REMOTE"
        rclone sync "$BACKUP_DIR" "$REMOTE" \
            --include "salesforce_backup_*.sql.gz" \
            --max-age "${MAX_AGE_DAYS}d" \
            --progress \
            --log-file="$LOG_FILE" \
            --log-level INFO \
            --transfers 4 \
            || error_exit "Rclone sync failed!"

        # Cleanup old files in cloud
        log ""
        log "Cleaning up files older than ${CLEANUP_AFTER_DAYS} days in Dropbox..."
        DELETED=$(rclone delete "$REMOTE" \
            --min-age "${CLEANUP_AFTER_DAYS}d" \
            --include "salesforce_backup_*.sql.gz" \
            --log-file="$LOG_FILE" \
            --log-level INFO 2>&1 | grep -c "deleted" || echo "0")
        log "Deleted $DELETED old file(s) from Dropbox"
        ;;

    sftp)
        # SFTP / Remote Server
        check_rclone
        REMOTE="${SFTP_REMOTE:-sftp:backups/salesforce}"

        log "Syncing to SFTP: $REMOTE"
        rclone sync "$BACKUP_DIR" "$REMOTE" \
            --include "salesforce_backup_*.sql.gz" \
            --max-age "${MAX_AGE_DAYS}d" \
            --progress \
            --log-file="$LOG_FILE" \
            --log-level INFO \
            --transfers 4 \
            || error_exit "Rclone sync failed!"

        # Cleanup old files in cloud
        log ""
        log "Cleaning up files older than ${CLEANUP_AFTER_DAYS} days in SFTP..."
        DELETED=$(rclone delete "$REMOTE" \
            --min-age "${CLEANUP_AFTER_DAYS}d" \
            --include "salesforce_backup_*.sql.gz" \
            --log-file="$LOG_FILE" \
            --log-level INFO 2>&1 | grep -c "deleted" || echo "0")
        log "Deleted $DELETED old file(s) from SFTP"
        ;;

    local)
        # Local / Mounted Drive (NFS, SMB, USB)
        DEST_DIR="${LOCAL_BACKUP_DIR:-/mnt/backup-drive/salesforce}"

        if [ ! -d "$DEST_DIR" ]; then
            error_exit "Local backup directory not found: $DEST_DIR"
        fi

        log "Syncing to local: $DEST_DIR"
        rsync -av --delete \
            --include "salesforce_backup_*.sql.gz" \
            --exclude "*" \
            "$BACKUP_DIR/" "$DEST_DIR/" \
            || error_exit "Rsync failed!"
        ;;

    *)
        error_exit "Unknown provider: $PROVIDER"
        echo ""
        echo "Available providers:"
        echo "  s3     - AWS S3 or S3-compatible storage"
        echo "  gdrive - Google Drive"
        echo "  dropbox - Dropbox"
        echo "  sftp   - SFTP/Remote server"
        echo "  local  - Local/mounted drive"
        exit 1
        ;;
esac

# ============================================
# SYNC SUMMARY
# ============================================
log "✓ Sync completed successfully!"

# Show storage usage (for rclone providers)
if command -v rclone &> /dev/null && [[ ! "$PROVIDER" == "local" ]]; then
    log ""
    log "Remote storage usage:"
    rclone about "$REMOTE" 2>/dev/null || log "  Unable to get usage info"
fi

# Show remote backup count
REMOTE_COUNT=$(find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f -mtime -1 | wc -l)
log "Recent backups (last 24h): $REMOTE_COUNT"

log "=========================================="
