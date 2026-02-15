# Secrets Management

This document describes how high-impact secrets are generated, stored,
and consumed by the system.

Secrets must **never** be committed to version control.

Secrets covered here protect:

- Encrypted backups
- Cryptographic signing
- Long-lived credentials that must not rotate casually

The examples below assume a file-based secrets layout using a `secrets/`
directory. Actual mount paths may vary by environment.

---

## Example Directory Structure

```text
secrets/
├─ .gitignore        # Ignores all real secrets
├─ .gitkeep          # Keeps directory tracked
│
├─ backup/
│  └─ encryption.key # Backup encryption key (required)
│
└─ jwt/
   ├─ access.key     # JWT access token secret (optional)
   └─ refresh.key    # JWT refresh token secret (optional)
```

Only documentation files are committed.  
All real secret files are ignored by Git.

---

## Backup Encryption Key (Required)

The backup encryption key protects **all application backups**.

### Requirements

- Minimum 32 bytes
- Randomly generated
- Stable (do NOT rotate casually)

### Generate (choose one)

- Using OpenSSL:

```bash
mkdir -p secrets/backup
openssl rand -hex 32 > secrets/backup/encryption.key
```

- Using system entropy:

```bash
mkdir -p secrets/backup
head -c 32 /dev/urandom | xxd -p -c 64 > secrets/backup/encryption.key
```

### Usage

The server references this key via an environment variable:

```bash
BACKUP_ENCRYPTION_KEY_FILE=/run/secrets/backup/encryption.key
```

The key value itself is never stored in an env file.

## JWT Secrets (Optional File-Based Mode)

JWT secrets may be provided either via env variables or secret files.

File-based secrets are recommended for:

- production
- containers
- CI/CD

#### Generate JWT secrets

```bash
mkdir -p secrets/jwt
openssl rand -hex 32 > secrets/jwt/access.key
openssl rand -hex 32 > secrets/jwt/refresh.key
```

#### Reference from environment

```bash
JWT_ACCESS_SECRET_FILE=/run/secrets/jwt/access.key
JWT_REFRESH_SECRET_FILE=/run/secrets/jwt/refresh.key
```

## Development vs Production

| Environment | Storage Method          |
| ----------- | ----------------------- |
| Development | Env variables or files  |
| CI          | Mounted secrets         |
| Production  | File-based secrets only |

## What NOT to Do

❌ Commit secret values

❌ Store backup encryption keys in env files

❌ Rotate encryption keys without a re-encryption plan

❌ Reuse JWT secrets across environments

## Responsibility

Secrets are an **operations concern**, not an application concern.

Application code:

- reads secrets
- never defines them
- never logs them
