# WIDE Naturals Inc. – ERP

Internal web-based ERP system providing inventory management,
order processing, role-based access control,
and operational workflow support.

---

## Prerequisites

Required for local development:

- Node.js >= 20.x (LTS)
- npm >= 10.x
- PostgreSQL >= 17
- Redis >= 7 (required for caching, sessions, and background coordination)
- Git >= 2.40
- Docker (optional, for containerized environments)

macOS users are recommended to install dependencies via Homebrew

---

## Getting Started

1. Clone the Repository

```bash
git clone git@github.com:Zhenzhong-Zhou/widenaturals_erp.git
```

2. Install Dependencies

```bash
cd widenaturals_erp
npm install

cd server
npm install

cd ../client
npm install
```

---

## Environment & Configuration

⚠️ Important

This project does NOT use a root .env file.

Configuration is layered and environment-specific.

### Environment Structure

```text
env/
├─ .env.defaults
├─ development/
│  ├─ .env.server
│  └─ .env.database
├─ staging/
└─ production/
```

- .env.defaults → shared safe defaults
- .env.server → app / API config
- .env.database → database connection
- Files are loaded automatically based on NODE_ENV

### Local Development Setup

```bash
cp env/.env.defaults.example env/.env.defaults
cp env/development/.env.server.example env/development/.env.server
cp env/development/.env.database.example env/development/.env.database
```

Fill in required values before starting the server.

### Secrets (Docker / Production Only)

- File-based secrets are supported via Docker:

```arduino
/run/secrets/<secret_name>
```

- Local development does NOT require secrets
- Never commit secret files to git

See:

- env/README.md
- secrets/README.md

## Running the Application

#### Backend (Server / API)

> The backend automatically initializes and migrates the development database on startup.

```bash
cd server
npm run devStart
```

#### Frontend (Client)

```bash
cd client
npm run dev
```

#### Backend (Server) Commands

> These commands are project-level scripts.  
> Additional database and maintenance scripts are available in `package.json`
> and documented under `/docs`.

| Command            | Description              |
| ------------------ | ------------------------ |
| `npm run devStart` | Start development server |
| `npm run migrate`  | Run database migrations  |
| `npm run seed`     | Seed development data    |
| `npm run lint`     | Lint codebase            |
| `npm run test`     | Run tests                |

### Frontend (Client) Commands

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start frontend development server |
| `npm run build`   | Build frontend for production     |
| `npm run preview` | Preview production build locally  |

---

## **License**

This project is licensed under the MIT License.

**Prevent Storing Passwords in Bash History**:

```bash
unset HISTFILE
```

**Disable history temporarily for the session**:

```bash
set +o history
pg_dump -U your_user -h localhost -d your_db -f backup.sql
set -o history
```

Set correct permissions:
chmod 400 your-key.pem

SSH into Amazon Linux:
ssh -i your-key.pem ec2-user@your-ec2-public-ip

SSH into Ubuntu:
ssh -i your-key.pem ubuntu@r@your-ec2-public-ip

For Amazon Linux 2023 (dnf package manager):
sudo dnf install -y postgresql17-server postgresql15-contrib

# Ensure www-data owns the entire frontend directory

sudo chown -R www-data:www-data /home/ubuntu/apps/widenaturals_erp/client/dist

# Ensure www-data has read + execute permissions

sudo chmod -R 755 /home/ubuntu/apps/widenaturals_erp/client/dist

# Allow execution (traversal) for all parent directories

sudo chmod +x /home/ubuntu
sudo chmod +x /home/ubuntu/apps
sudo chmod +x /home/ubuntu/apps/widenaturals_erp
sudo chmod +x /home/ubuntu/apps/widenaturals_erp/client

sudo chown -R ubuntu:ubuntu /home/ubuntu/apps/widenaturals_erp/client

cd /home/ubuntu/apps/widenaturals_erp/client
npm run build

sudo systemctl restart nginx

sudo -i -u postgres

psql
