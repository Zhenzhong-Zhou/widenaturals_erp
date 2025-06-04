# WIDE Naturals Inc. - ERP

A web-based ERP system designed to streamline the management of inventory, orders, users, and permissions efficiently.

---

## **Table of Contents**

1. [Getting Started](#getting-started)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Running the Project](#running-the-project)
5. [Running Tests](#running-tests)
6. [Directory Structure](#directory-structure)
7. [Development Commands](#development-commands)
8. [License](#license)

---

## **Getting Started**

Follow these instructions to set up the project on your local machine for development and testing.

---

## **Prerequisites**

Before starting, ensure you have the following installed:

- **Node.js** (v14 or later)
- **PostgreSQL** (Database)
- **npm** or **yarn** (Package Manager)
- [Knex.js CLI](https://knexjs.org/) (for database migrations and seeds)
- [Docker](https://www.docker.com/) (optional, for running the project with containers)

---

## **Installation**

1. **Clone the repository**:
   ```bash
   git clone git@github.com:Zhenzhong-Zhou/widenaturals_erp.git
   cd widenaturals_erp
   ```
2. **Install dependencies**:
   - Server
   ```bash
   cd server
   npm install
   ```
3. **Set up environment variables**:
   - Create `.env` files for each environment (e.g., `.env.development`, `.env.test`).
   - Add the following variables to each file:
     ```env
     NODE_ENV=development
     DEV_DB_HOST=localhost
     DEV_DB_PORT=5432
     DEV_DB_USER=your_database_user
     DEV_DB_PASSWORD=your_database_password
     DEV_DB_NAME=your_database_name
     ```
   - For the test environment, use:
     ```env
     NODE_ENV=test
     TEST_DB_HOST=localhost
     TEST_DB_PORT=5432
     TEST_DB_USER=your_test_database_user
     TEST_DB_PASSWORD=your_test_database_password
     TEST_DB_NAME=your_test_database_name
     ```
4. **Initialize the database**:
   - Run the following command to create the database, apply migrations, and seed data:
     ```bash
     npm run setup
     ```
   - If needed, run individual steps:
     - Create the database:
       ```bash
       npm run create-db
       ```
     - Run migrations:
       ```bash
       npm run migrate
       ```
     - Seed the database:
       ```bash
       npm run seed
       ```
5. **Running the Project**:
   ```bash
   npm run devStart
   ```
6. **Running Tests**:
   - Ensure you have a `.env.test` file configured for the test database.
   - Run the entire test suite:
     ```bash
     npm test
     ```
   - Run specific tests:
     ```bash
     npm test -- path/to/your/test-file.test.js
     ```
7. **Directory Structure**:
   ```plaintext
     project root/
      ├── client/             # Frontend application (if applicable)
      ├── env/                # Environment-specific configurations
      ├── secrets/            # Sensitive files (excluded from version control)
      ├── server/             # Backend application
      ├── migrations/         # Knex.js migrations
      ├── seeds/              # Knex.js seed files
      ├── tests/              # Test files for the application
      ├── .env                # Environment variable configuration
      ├── knexfile.js         # Knex configuration
      └── README.md           # Project documentation
   ```

---

## **Development Commands**

**Code Quality**

- Lint the codebase:
  ```bash
  npx eslint .
  npx eslint . --fix
  ```
- Format the codebase:
  ```bash
  npx prettier --write .
  ```

**Database Management**

**Knex Commands**

1.  **Initialize Knex Configuration**:
    ```bash
    npx knex init
    ```
2.  **Common Knex Operations**:
    - Create a migration:
      ```bash
      npx knex migrate:make create_entity_types --env development
      ```
    - Run migrations:
      ```bash
      npm run migrate
      ```
    - Rollback the last migration::
      ```bash
      npm run rollback
      ```
    - Rollback all migrations:
      ```bash
      npx knex migrate:rollback --all --env development
      ```
3.  **Seeds**:

- Create a seed file:
  ```bash
  npx knex seed:make seed_name
  ```
- Run seed files:
  ```bash
  npm run seed
  ```

**Cron**:

- Backup Database:
  **Test the Backup Process Manually**:
  ```bash
  node /path/to/backup-scheduler.js
  ```
  **Find the absolute path**:
  ```bash
  realpath /path/to/backup-scheduler.js
  realpath /path/to/backup.log
  ```
  **Node.js Path:**:
  ```bash
  which node
  ```
  **For system-wide crontab:**:
  ```bash
  sudo crontab -e
  crontab -e
  ```
  \*Update Cron Job:\*\*:
  ```bash
  PATH=/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin
  NODE_ENV=development
  TZ=UTC
  0 2 * * * NODE_ENV=development /usr/bin/node /home/user/project/src/tasks/schedulers/backup-scheduler.js >> /home/user/project/dev_logs/backup.log 2>&1
  ```
  **Test the Cron Job Run the script manually to ensure it works:**:
  ```bash
  /usr/bin/node /path/to/backup-scheduler.js
  ```
  **Run the following command to see if cron is restricted for your user:**:
  `bash
     sudo crontab -l
     crontab -l
     `
  **Monitor Logs:**:

```bash
tail -f /path/to/backup.log
```

**Redis**

1. **Using Homebrew (macOS):**
   ```bash
   brew install redis
   brew services start redis
   ```
2. **Using APT (Ubuntu/Debian):**
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo systemctl start redis
   ```
3. **Verify Redis Installation:**
   ```bash
   redis-cli ping
   ```
4. **Start Redis Locally:**
   ```bash
   redis-server
   ```
5. **Stop Redis (macOS):**
   ```bash
   brew services stop redis
   ```
6. **Stop Redis (Ubuntu/Debian):**
   ```bash
   sudo systemctl stop redis
   ```
7. **Edit the Redis Configuration:**
   ```bash
   /etc/redis/redis.conf
   /opt/homebrew/var/db/redis
   ```
8. **Open the configuration file for editing:**
   ```bash
   sudo nano /etc/redis/redis.conf
   ```
9. **Add a user with a password and permissions:**
   ```bash
   user myuser on >my_secure_password ~* +@all
   ```
10. **Restart the Redis server to apply the changes:**
    ```bash
    sudo systemctl restart redis
    brew services restart redis
    ```
11. **Connect to Redis::**
    ```bash
    redis-cli
    ```
12. **Authenticate with the password:**
    ```bash
     redis-cli
    ```
13. **Authenticate with the password:**
    ```bash
    AUTH your_secure_password
    ```

**Run with Docker**

1. **Build and start the containers**:
   ```bash
    docker compose up --build
   ```
2. **Start the containers (without rebuild)**:
   ```bash
   docker compose up
   docker compose up -d
   ```
3. **Run the development environment in Docker**:
   ```bash
   NODE_ENV=development docker compose up
   ```
4. **Rebuild Docker Containers**
   ```bash
       docker compose down
       docker compose down -v
   ```

---

## **License**

This project is licensed under the MIT License.

## Logging Results

**Save test results to a file for later analysis**:

```
artillery run real-time-test.yaml -o results.json
```

**You can then generate a detailed HTML report**:

```
artillery report -o report.html results.json
```

**generates a 32-byte hexadecimal key:**

```bash
    openssl rand -hex 32
    head -c 32 /dev/urandom | xxd -p -c 64
```

**Set Up .pgpass in Production**

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

1. **Create .pgpass file**:
   ```bash
     nano ~/.pgpass
   ```
2. **Add database credentials**:
   ```bash
     localhost:5432:widenaturals_erp_production:your_user:your_password
   ```
3. **Set strict permissions**:
   ```bash
    chmod 600 ~/.pgpass
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
