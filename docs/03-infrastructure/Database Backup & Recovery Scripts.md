# Database Backup & Recovery Scripts

# Database Backup & Recovery Scripts

Automated backup and recovery system for PostgreSQL database in production environment.

---

## Files

| Script | Description |
| --- | --- |
| [backup-db.sh](http://backup-db.sh) | Automated daily backup script |
| [restore-db.sh](http://restore-db.sh) | Restore database from backup |
| [sync-backup.sh](http://sync-backup.sh) | Sync backups to cloud storage (S3, GDrive, Dropbox, SFTP) |
| [list-backups.sh](http://list-backups.sh) | List available backups |
| [auto-backup.sh](http://auto-backup.sh) | Wrapper script: backup + sync in one step |
| [setup-backup-automation.sh](http://setup-backup-automation.sh) | One-click setup automation (cron/systemd) |

---

## Quick Setup

### 1. Create Backup Directory

```bash
sudo mkdir -p /var/backups/postgres
sudo chown $USER:$USER /var/backups/postgres
```

### 2. Setup Environment Variables (Optional)

```bash
# Add to ~/.bashrc or /etc/environment
export BACKUP_DIR="/var/backups/postgres"
export RETENTION_DAYS=30
export DB_USER="your_db_user"
export DB_NAME="your_db_name"
export CONTAINER_NAME="sales-force-db"
```

### 3. Schedule Automated Backup (Crontab)

```bash
crontab -e
```

Add these lines:

```
# Backup database every day at 2 AM
0 2 * * * /home/eka/dev/sales-force/scripts/backup-db.sh >> /var/log/postgres-backup.log 2>&1

# Sync to Google Drive every day at 3 AM (optional)
0 3 * * * /home/eka/dev/sales-force/scripts/sync-backup.sh gdrive >> /var/log/backup-sync.log 2>&1
```

---

## Automated Setup (Recommended) ⚡

Cara termudah untuk setup otomatisasi backup di VPS:

```bash
cd /home/eka/dev/sales-force/scripts
sudo ./setup-backup-automation.sh
```

Ini akan mengkonfigurasi:

- ✓ Directory backup `/var/backups/postgres`
- ✓ Log rotation untuk semua log file
- ✓ Cron job (backup jam 2 pagi setiap hari)

---

## Usage

### Manual Backup

```bash
# Backup standalone
./scripts/backup-db.sh

# Atau gunakan wrapper (backup + sync ke cloud)
./scripts/auto-backup.sh
```

### List Available Backups

```bash
# Show last 20 backups
./scripts/list-backups.sh

# Show all backups
./scripts/list-backups.sh --all

# Show with detailed information
./scripts/list-backups.sh --detail
```

### Restore Database

```bash
# Interactive restore
./scripts/restore-db.sh /var/backups/postgres/salesforce_backup_20250131_120000.sql.gz

# List backups first to choose
./scripts/list-backups.sh
```

### Sync to Cloud Storage

```bash
# Sync to Google Drive (default)
./scripts/sync-backup.sh gdrive

# Sync to AWS S3
./scripts/sync-backup.sh s3

# Sync to local/mounted drive
./scripts/sync-backup.sh local
```

---

## Cloud Storage Setup (Rclone) ☁️

For [`sync-backup.sh`](http://sync-backup.sh) to work with cloud storage, install and configure rclone:

### Install Rclone

```bash
# Install unzip first (required)
sudo apt update && sudo apt install -y unzip

# Install rclone
curl https://rclone.org/install.sh | sudo bash
```

### Configure Google Drive

```bash
# 1. Run rclone config
rclone config

# 2. Create new remote: n) New remote
# 3. Name: gdrive
# 4. Type: drive (Google Drive)
# 5. client_id/client_secret: Press Enter (use default)
# 6. scope: 1 (Full access)
# 7. root_folder_id: Press Enter
# 8. service_account_file: Press Enter
# 9. advanced_config: n
# 10. use_auto_config: n (important for VPS/WSL!)
# 11. Open link in browser on your LOCAL machine:
rclone authorize "drive"

# 12. Copy the auth code and paste it to your VPS/WSL
```

### Test Connection

```bash
# List Google Drive root
rclone ls gdrive:

# Create backup folder
rclone mkdir gdrive:salesforce-backups

# Test upload
echo "test" > /tmp/test.txt
rclone copy /tmp/test.txt gdrive:salesforce-backups
```

---

## Configuration 🔧

### Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `BACKUP_DIR` | `/var/backups/postgres` | Backup storage location |
| `RETENTION_DAYS` | `30` | Days to keep backups |
| `DB_USER` | `postgres` | Database user |
| `DB_NAME` | `salesforce` | Database name |
| `CONTAINER_NAME` | `sales-force-db` | Docker container name |

### For Cloud Sync

| Variable | Default | Description |
| --- | --- | --- |
| `GDRIVE_REMOTE` | `gdrive:salesforce-backups` | Rclone Google Drive path |
| `S3_REMOTE` | `s3:salesforce-backups` | Rclone S3 remote path |
| `MAX_AGE_DAYS` | `90` | Days to keep in cloud (for sync filter) |
| `CLEANUP_AFTER_DAYS` | `30` | Auto-delete files older than this in cloud |
| `LOCAL_BACKUP_DIR` | `/mnt/backup-drive/salesforce` | Local backup path |

---

## Recovery Procedure 📋

### Complete Database Recovery

```bash
# 1. Stop application services (optional)
docker stop sales-force-fe sales-force-be

# 2. List available backups
./scripts/list-backups.sh

# 3. Restore from backup
./scripts/restore-db.sh /var/backups/postgres/salesforce_backup_20250131_120000.sql.gz

# 4. Start services
docker start sales-force-be sales-force-fe

# 5. Verify
docker logs sales-force-be
```

### Recovery from Cloud Backup

```bash
# 1. Download backup from Google Drive
rclone copy gdrive:salesforce-backups/salesforce_backup_20250131_120000.sql.gz /tmp/

# 2. Restore
./scripts/restore-db.sh /tmp/salesforce_backup_20250131_120000.sql.gz
```

---

## Troubleshooting 🔍

### Check Logs

```bash
# Backup logs
tail -f /var/log/postgres-backup.log

# Restore logs
tail -f /var/log/postgres-restore.log

# Sync logs
tail -f /var/log/backup-sync.log
```

### Verify Backup Integrity

```bash
# Test gzip file
gzip -t /var/backups/postgres/salesforce_backup_*.sql.gz

# View backup contents (without restoring)
gunzip -c /var/backups/postgres/salesforce_backup_20250131_120000.sql.gz | head
```

### Common Issues

**Permission denied on /var/backups/postres:**

```bash
sudo chown -R $USER:$USER /var/backups/postgres
```

**Container not found:**

```bash
docker ps | grep sales-force
```

**Disk space full:**

```bash
# Check backup size
du -sh /var/backups/postgres

# Reduce retention days
export RETENTION_DAYS=7
./scripts/backup-db.sh
```

---

## Backup Strategy 📊

### Recommended Schedule

| Frequency | Time | Operation |
| --- | --- | --- |
| Daily | 2:00 AM | Full backup |
| Daily | 3:00 AM | Sync to cloud |
| Weekly | - | Manual verification |
| Monthly | - | Test restore procedure |

### Retention Policy

| Location | Retention | Auto Delete |
| --- | --- | --- |
| Local (VPS) | 30 days | ✓ Yes |
| Cloud Storage | 30 days | ✓ Yes (configurable via `CLEANUP_AFTER_DAYS`) |
| Long-term Archive | 1 year | Manual |

---

## Best Practices 🛡️

1. **Test Regularly**: Perform test restore monthly
2. **Monitor Logs**: Check backup logs daily
3. **Off-site Backup**: Always sync to cloud storage
4. **Encryption**: Consider encrypting backups before cloud sync
5. **Document Recovery**: Keep this README accessible
6. **Alerting**: Setup alerts for backup failures

---

## Support 📞

For issues or questions:

- Check logs: `/var/log/postgres-*.log`
- Verify container: `docker ps`
- Test connection: `docker exec sales-force-db pg_isready -U postgres`