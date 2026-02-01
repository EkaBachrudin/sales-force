#!/bin/bash
# ============================================
# Setup Backup Automation
# ============================================
# Usage: ./setup-backup-automation.sh [cron|systemd]
# Default: cron (simpler)
# Note: This script must be run with sudo

set -e

# ============================================
# CHECKS
# ============================================
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script with sudo:"
    echo "  sudo ./setup-backup-automation.sh"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_USER="${SUDO_USER:-$USER}"
AUTO_BACKUP_SCRIPT="$SCRIPT_DIR/auto-backup.sh"
METHOD="${1:-cron}"

# ============================================
# FUNCTIONS
# ============================================
log() {
    echo "==> $1"
}

error_exit() {
    echo "ERROR: $1"
    exit 1
}

# ============================================
# SETUP LOGGING
# ============================================
log "Setting up log files and rotation..."

# Create log files
touch /var/log/postgres-backup.log
touch /var/log/backup-sync.log
touch /var/log/auto-backup.log
touch /var/log/postgres-restore.log

# Set permissions
chown $PROJECT_USER:$PROJECT_USER /var/log/postgres-backup.log
chown $PROJECT_USER:$PROJECT_USER /var/log/backup-sync.log
chown $PROJECT_USER:$PROJECT_USER /var/log/auto-backup.log
chown $PROJECT_USER:$PROJECT_USER /var/log/postgres-restore.log

# Setup logrotate
cat > /etc/logrotate.d/salesforce-backup << 'EOF'
/var/log/postgres-backup.log
/var/log/backup-sync.log
/var/log/auto-backup.log
/var/log/postgres-restore.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF

log "✓ Log files configured"

# ============================================
# SETUP SUDOERS (optional)
# ============================================
log "Configuring sudoers for passwordless backup..."

# Allow running backup script without password
SUDOERS_FILE="/etc/sudoers.d/salesforce-backup"
cat > "$SUDOERS_FILE" << EOF
# Allow passwordless execution of backup scripts
$PROJECT_USER ALL=(ALL) NOPASSWD:$SCRIPT_DIR/backup-db.sh
$PROJECT_USER ALL=(ALL) NOPASSWD:$SCRIPT_DIR/auto-backup.sh
EOF

chmod 0440 "$SUDOERS_FILE"
log "✓ Sudoers configured at $SUDOERS_FILE"

# ============================================
# SETUP AUTOMATION METHOD
# ============================================
if [ "$METHOD" = "systemd" ]; then
    # ============================================
    # SYSTEMD TIMER SETUP
    # ============================================
    log "Setting up systemd timer..."

    # Create systemd service
    cat > /etc/systemd/system/salesforce-backup.service << EOF
[Unit]
Description=Salesforce Database Backup
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
User=$PROJECT_USER
Group=$PROJECT_USER
ExecStart=$AUTO_BACKUP_SCRIPT
StandardOutput=append:/var/log/auto-backup.log
StandardError=append:/var/log/auto-backup.log

[Install]
WantedBy=multi-user.target
EOF

    # Create systemd timer
    cat > /etc/systemd/system/salesforce-backup.timer << EOF
[Unit]
Description=Run Salesforce Backup Daily
Requires=salesforce-backup.service

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

    # Reload systemd and enable timer
    systemctl daemon-reload
    systemctl enable salesforce-backup.timer
    systemctl start salesforce-backup.timer

    log "✓ Systemd timer configured"
    log ""
    log "Commands:"
    log "  systemctl status salesforce-backup.timer"
    log "  systemctl list-timers salesforce-backup.timer"
    log "  journalctl -u salesforce-backup.service"

else
    # ============================================
    # CRON SETUP (default)
    # ============================================
    log "Setting up cron job..."

    # Check if crontab entry already exists
    CRON_ENTRY="0 2 * * * $AUTO_BACKUP_SCRIPT >> /var/log/auto-backup.log 2>&1"

    if crontab -l -u "$PROJECT_USER" 2>/dev/null | grep -q "auto-backup.sh"; then
        log "Cron entry already exists. Skipping..."
    else
        # Add to crontab
        (crontab -l -u "$PROJECT_USER" 2>/dev/null; echo "$CRON_ENTRY") | crontab -u "$PROJECT_USER" -
        log "✓ Cron job added to user $PROJECT_USER"
    fi

    log ""
    log "Current crontab:"
    crontab -l -u "$PROJECT_USER" | grep -E "(auto-backup|backup-db|sync-backup)" || echo "No backup cron jobs found"
fi

# ============================================
# SETUP BACKUP DIRECTORY
# ============================================
log ""
log "Setting up backup directory..."

BACKUP_DIR="/var/backups/postgres"
mkdir -p "$BACKUP_DIR"
chown $PROJECT_USER:$PROJECT_USER "$BACKUP_DIR"
log "✓ Backup directory: $BACKUP_DIR"

# ============================================
# SUMMARY
# ============================================
echo ""
echo "=========================================="
echo "Backup Automation Setup Complete!"
echo "=========================================="
echo ""
echo "Method: $METHOD"
echo "User: $PROJECT_USER"
echo "Backup Directory: $BACKUP_DIR"
echo ""
echo "Next Steps:"
echo "  1. Test backup manually: $AUTO_BACKUP_SCRIPT"
echo "  2. Check logs: tail -f /var/log/auto-backup.log"
echo ""
echo "Scheduled: Daily at 2:00 AM"
echo ""
echo "Useful Commands:"
echo "  List backups: $SCRIPT_DIR/list-backups.sh"
echo "  Restore:      $SCRIPT_DIR/restore-db.sh <backup_file>"
echo "  Sync now:      $SCRIPT_DIR/sync-backup.sh gdrive"
echo ""
echo "=========================================="
