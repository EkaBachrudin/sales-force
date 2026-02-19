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
PROJECT_HOME="${PROJECT_HOME:-/home/$PROJECT_USER}"
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

# Create log directory in user home
LOG_DIR="$PROJECT_HOME/logs"
sudo -u "$PROJECT_USER" mkdir -p "$LOG_DIR"

# Create log files
sudo -u "$PROJECT_USER" touch "$LOG_DIR/postgres-backup.log"
sudo -u "$PROJECT_USER" touch "$LOG_DIR/backup-sync.log"
sudo -u "$PROJECT_USER" touch "$LOG_DIR/auto-backup.log"
sudo -u "$PROJECT_USER" touch "$LOG_DIR/postgres-restore.log"

# Setup logrotate for user home logs
cat > /etc/logrotate.d/salesforce-backup << EOF
$LOG_DIR/postgres-backup.log
$LOG_DIR/backup-sync.log
$LOG_DIR/auto-backup.log
$LOG_DIR/postgres-restore.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 $PROJECT_USER $PROJECT_USER
    postrotate
        # Ensure permissions are correct after rotation
        chown $PROJECT_USER:$PROJECT_USER $LOG_DIR/postgres-backup.log \
                                 $LOG_DIR/backup-sync.log \
                                 $LOG_DIR/auto-backup.log \
                                 $LOG_DIR/postgres-restore.log 2>/dev/null || true
    endscript
}
EOF

log "✓ Log files configured in $LOG_DIR"

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
Environment="HOME_DIR=$PROJECT_HOME"
ExecStart=$AUTO_BACKUP_SCRIPT
StandardOutput=append:$PROJECT_HOME/logs/auto-backup.log
StandardError=append:$PROJECT_HOME/logs/auto-backup.log

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
    # CRON SETUP (default) - USER CRONTAB
    # ============================================
    log "Setting up cron job in user crontab ($PROJECT_USER)..."

    # Check if crontab entry already exists
    CRON_ENTRY="0 19 * * * $AUTO_BACKUP_SCRIPT >> $PROJECT_HOME/logs/auto-backup.log 2>&1"

    # Add to user crontab (not root crontab)
    if sudo -u "$PROJECT_USER" crontab -l 2>/dev/null | grep -q "auto-backup.sh"; then
        log "Cron entry already exists in user crontab. Skipping..."
    else
        # Add to user crontab
        (sudo -u "$PROJECT_USER" crontab -l 2>/dev/null; echo "$CRON_ENTRY") | sudo -u "$PROJECT_USER" crontab -
        log "✓ Cron job added to user crontab ($PROJECT_USER)"
    fi

    log ""
    log "Current user crontab ($PROJECT_USER):"
    sudo -u "$PROJECT_USER" crontab -l | grep -E "(auto-backup|backup-db|sync-backup)" || echo "No backup cron jobs found"
fi

# ============================================
# SETUP BACKUP DIRECTORY
# ============================================
log ""
log "Setting up backup directory..."

BACKUP_DIR="$PROJECT_HOME/backups/postgres"
sudo -u "$PROJECT_USER" mkdir -p "$BACKUP_DIR"
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
echo "Home Directory: $PROJECT_HOME"
echo "Backup Directory: $BACKUP_DIR"
echo "Log Directory: $PROJECT_HOME/logs"
echo ""
echo "Next Steps:"
echo "  1. Test backup manually: $AUTO_BACKUP_SCRIPT"
echo "  2. Check logs: tail -f $PROJECT_HOME/logs/auto-backup.log"
echo ""
echo "Scheduled: Daily at 7:00 PM (19:00)"
echo ""
echo "Useful Commands:"
echo "  List backups: $SCRIPT_DIR/list-backups.sh"
echo "  Restore:      $SCRIPT_DIR/restore-db.sh <backup_file>"
echo "  Sync now:      $SCRIPT_DIR/sync-backup.sh gdrive"
echo "  View cron:     sudo -u $PROJECT_USER crontab -l"
echo ""
echo "=========================================="
