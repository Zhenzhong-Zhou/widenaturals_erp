# Secrets Management

This directory contains **high-impact secrets** that must **never** be committed
to version control.

Secrets stored here protect:
- encrypted backups
- cryptographic signing
- long-lived credentials that must not rotate casually

Only **file-based secrets** belong in this directory.

---

## 1. Directory Structure

secrets/
├─ README.md # This file (committed)
├─ .gitignore # Ignores all real secrets
├─ .gitkeep # Keeps directory tracked
│
├─ backup/
│ └─ encryption.key # Backup encryption key (required)
│
└─ jwt/
├─ access.key # JWT access token secret (optional)
└─ refresh.key # JWT refresh token secret (optional)


Only documentation files are committed.  
All real secret files are ignored by Git.

---

## 2. Backup Encryption Key (Required)

The backup encryption key protects **all application backups**.

### Requirements
- Minimum 32 bytes
- Randomly generated
- Stable (do NOT rotate casually)

### Generate once

```bash
mkdir -p secrets/backup
openssl rand -hex 32 > secrets/backup/encryption.key
```
How it is used
The server references this key via an environment variable:

BACKUP_ENCRYPTION_KEY_FILE=/run/secrets/backup/encryption.key
The key value itself is never stored in an env file.

3. JWT Secrets (Optional File-Based Mode)
JWT secrets may be provided either via env variables or secret files.

File-based secrets are recommended for:

production

containers

CI/CD

Generate JWT secrets
```bash
mkdir -p secrets/jwt
openssl rand -hex 32 > secrets/jwt/access.key
openssl rand -hex 32 > secrets/jwt/refresh.key
```
Reference from env
JWT_ACCESS_SECRET_FILE=/run/secrets/jwt/access.key
JWT_REFRESH_SECRET_FILE=/run/secrets/jwt/refresh.key
4. Development vs Production
Environment	Storage
Development	Env variables or files
CI	Mounted secrets
Production	File-based secrets only
Never commit real secret values, even in development.

5. What NOT to Do
❌ Commit secret values

❌ Store backup encryption keys in env files

❌ Rotate encryption keys without a re-encryption plan

❌ Reuse JWT secrets across environments

6. Responsibility
Secrets are an operations concern, not an application concern.

Application code:

reads secrets

never defines them

never logs them