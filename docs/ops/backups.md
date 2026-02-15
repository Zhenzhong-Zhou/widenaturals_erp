# Database Backups

This document describes how database backups are scheduled and executed
using cron in non-development environments.

## Purpose

Automated database backups are used to protect against data loss.
This process is intended for staging and production environments only.

## Scope

This document applies to staging and production environments only.
Local development does not require scheduled backups.

## Manual Backup Test

Before scheduling cron jobs, verify the backup script runs correctly:

```bash
node /absolute/path/to/backup-scheduler.js
```

## Cron Configuration

### Cron Job Setup

#### Example cron configuration:

```bash
PATH=/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin
NODE_ENV=production
TZ=UTC
0 2 * * * /usr/bin/node /absolute/path/to/backup-scheduler.js >> /absolute/path/to/backup.log 2>&1
```

## Validation & Monitoring

### Validation

#### List cron jobs:

```bash
stdo crontab -l
```

#### Monitor logs:

```bash
tail -f /path/to/backup.log
```

## Security Notes

- Do not hardcode credentials in cron
- Use environment variables or Docker secrets
- Ensure backup files are access-restricted
