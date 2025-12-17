#!/bin/sh
set -e

# Generate crontab with environment variables
# Redirect both stdout and stderr to /proc/1/fd/1 (Docker container stdout)
cat > /etc/cron.d/acled-ingest <<EOF
INCOMING_DIR=${INCOMING_DIR}
ARCHIVED_DIR=${ARCHIVED_DIR}
DATABASE_URL=${DATABASE_URL}

# Run ACLED ingestion every minute for testing
* * * * * root /usr/local/bin/python /app/ingest_acled.py >> /proc/1/fd/1 2>&1

EOF

chmod 644 /etc/cron.d/acled-ingest

# Start cron in foreground
echo "[$(date)] [INFO] cron: Starting ingestion service"
exec cron -f -L 2