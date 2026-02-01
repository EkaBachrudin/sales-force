#!/bin/bash
# ============================================
# List Available Database Backups
# ============================================
# Usage: ./list-backups.sh [options]
# Options:
#   -a, --all     Show all backups (default: last 20)
#   -s, --size    Show with size information
#   -d, --detail  Show detailed information

# ============================================
# CONFIGURATION
# ============================================
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
SHOW_ALL="${SHOW_ALL:-false}"
SHOW_SIZE="${SHOW_SIZE:-true}"
SHOW_DETAIL="${SHOW_DETAIL:-false}"

# ============================================
# FUNCTIONS
# ============================================
format_size() {
    local size=$1
    if [ "$size" -ge 1073741824 ]; then
        echo "$(($size / 1073741824))GB"
    elif [ "$size" -ge 1048576 ]; then
        echo "$(($size / 1048576))MB"
    elif [ "$size" -ge 1024 ]; then
        echo "$(($size / 1024))KB"
    else
        echo "${size}B"
    fi
}

# ============================================
# PARSE ARGUMENTS
# ============================================
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--all)
            SHOW_ALL=true
            shift
            ;;
        -s|--size)
            SHOW_SIZE=true
            shift
            ;;
        -d|--detail)
            SHOW_DETAIL=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -a, --all     Show all backups (default: last 20)"
            echo "  -s, --size    Show with size information"
            echo "  -d, --detail  Show detailed information"
            echo "  -h, --help    Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# ============================================
# CHECK BACKUP DIRECTORY
# ============================================
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# ============================================
# LIST BACKUPS
# ============================================
echo "=========================================="
echo "Database Backups"
echo "Directory: $BACKUP_DIR"
echo "=========================================="
echo ""

BACKUP_COUNT=$(find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f | wc -l)

if [ "$BACKUP_COUNT" -eq 0 ]; then
    echo "No backups found."
    exit 0
fi

echo "Total backups: $BACKUP_COUNT"
echo ""

# Calculate total size
if [ "$SHOW_SIZE" = true ]; then
    TOTAL_SIZE=$(find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f -exec du -b {} + | awk '{sum += $1} END {print sum}')
    echo "Total size: $(format_size $TOTAL_SIZE)"
    echo ""
fi

# List backups
if [ "$SHOW_DETAIL" = true ]; then
    echo "Detailed backup information:"
    echo "----------------------------------------"
    find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f -printf '%Ts %s %p\n' | sort -nr | while read -r timestamp size filepath; do
        date=$(date -d "@$timestamp" "+%Y-%m-%d %H:%M:%S")
        filename=$(basename "$filepath")
        size_human=$(format_size "$size")
        echo "  $date | $size_human | $filename"
    done
else
    echo "Recent backups:"
    echo "----------------------------------------"

    if [ "$SHOW_ALL" = true ]; then
        find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f -printf '%Ts %p\n' | sort -nr | while read -r timestamp filepath; do
            date=$(date -d "@$timestamp" "+%Y-%m-%d %H:%M:%S")
            filename=$(basename "$filepath")

            if [ "$SHOW_SIZE" = true ]; then
                size=$(stat -c%s "$filepath")
                size_human=$(format_size "$size")
                echo "  $date | $size_human | $filename"
            else
                echo "  $date | $filename"
            fi
        done
    else
        find "$BACKUP_DIR" -name "salesforce_backup_*.sql.gz" -type f -printf '%Ts %p\n' | sort -nr | head -20 | while read -r timestamp filepath; do
            date=$(date -d "@$timestamp" "+%Y-%m-%d %H:%M:%S")
            filename=$(basename "$filepath")

            if [ "$SHOW_SIZE" = true ]; then
                size=$(stat -c%s "$filepath")
                size_human=$(format_size "$size")
                echo "  $date | $size_human | $filename"
            else
                echo "  $date | $filename"
            fi
        done

        if [ "$BACKUP_COUNT" -gt 20 ]; then
            echo ""
            echo "... and $(($BACKUP_COUNT - 20)) more backups"
            echo "Use -a or --all to show all backups"
        fi
    fi
fi

echo ""
echo "=========================================="
echo "Use ./restore-db.sh <backup_file> to restore"
echo "=========================================="
