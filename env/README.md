# Environment Configuration

This project uses **layered environment configuration** to keep settings clear,
secure, and portable across local development, containers (Docker / Podman),
CI, and production.

❗ **Do NOT create a single `.env` at the project root.**  
The application does **not** load configuration from a root `.env` file.

---

## 1. Environment Structure

```text
env/
├─ .env.defaults.example        # Shared, non-secret defaults (example)
├─ .env.server.example          # Server runtime config (example)
├─ .env.database.example        # Database & cache config (example)
│
├─ development/
│  ├─ .env.server               # Development server config (ignored)
│  └─ .env.database             # Development DB config (ignored)
│
├─ staging/
│  ├─ .env.server
│  └─ .env.database
│
└─ production/
   ├─ .env.server
   └─ .env.database
```
Only *.example files are committed to Git.
Real environment files are always ignored.

## 2. Load Order (Important)
Environment files are loaded in the following order:

env/.env.defaults

env/${NODE_ENV}/.env.database

env/${NODE_ENV}/.env.server

Later files override earlier ones.

## 3. File Responsibilities
.env.defaults
Purpose
Shared, safe defaults used by all environments.

Rules

No secrets

No credentials

Safe to commit

Minimal and stable

Typical contents

NODE_ENV

PORT

API_PREFIX

Logging paths

CORS defaults

Cookie defaults

.env.server
Purpose
Application runtime configuration and security settings.

Rules

Environment-specific

May contain secrets in development only

In production, secrets must be referenced via files (see secrets/)

Typical contents

JWT secrets

Password pepper

Admin bootstrap credentials (development only)

AWS configuration

CORS allowed origins

References to secret files (e.g. backup encryption key)

.env.database
Purpose
Database and cache connectivity only.

Rules

No application logic configuration

No cryptographic secrets beyond connection credentials

Typical contents

PostgreSQL host / port / database / user / password

Redis host / port / auth / TLS flags

## 4. Secrets Handling
High-impact secrets (encryption keys, private keys, credentials that must not
rotate casually) are not stored in env files.

They live in:

secrets/
Secrets are referenced from .env.server using *_FILE variables.

See secrets/README.md for details.

## 5. Setup Checklist (New Developer)
Copy example files:

env/.env.defaults.example   → env/.env.defaults
env/.env.server.example     → env/development/.env.server
env/.env.database.example   → env/development/.env.database
Create required secrets as documented in secrets/README.md

Ensure NODE_ENV=development

Start the application

If required variables are missing, the application must fail fast at startup.

## 6. What NOT to Do
❌ Commit real .env files
❌ Put secrets in .env.defaults
❌ Mix database variables into server env
❌ Change env structure based on container runtime
❌ Store backup encryption keys directly in env files

## 7. Design Principles
Environment configuration is an application concern

Container runtime (Docker / Podman) is an infrastructure concern

Secrets are referenced, not embedded

Structure is stable across all environments

This layout is intentional and should not be simplified.