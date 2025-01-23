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
3.  **Seeds**: - Create a seed file:
    `bash
 npx knex seed:make seed_name
 ` - Run seed files:
    `bash
  npm run seed
  `
  
   **Cron**: - Backup Database:
1. **Test the Backup Process Manually**:
    ```bash 
    node /path/to/backup-scheduler.js
    ```
2. **Find the absolute path**:
    ```bash 
    realpath /path/to/backup-scheduler.js
    realpath /path/to/backup.log
    ```
3. **Node.js Path:**:
   ```bash 
   which node
   ```
4. **For system-wide crontab:**:
   ```bash 
   sudo crontab -e
   ```
5. *Update Cron Job:**:
   ```bash 
   PATH=/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin
   NODE_ENV=development
   0 2 * * * NODE_ENV=development /usr/bin/node /home/user/project/src/tasks/schedulers/backup-scheduler.js >> /home/user/project/dev_logs/backup.log 2>&1
   ```
6. **Test the Cron Job Run the script manually to ensure it works:**:
   ```bash 
   /usr/bin/node /path/to/backup-scheduler.js
   ```
7. **Run the following command to see if cron is restricted for your user:**:
   ```bash 
   sudo crontab -l
   ```
8. **Monitor Logs:**:
   ```bash 
   tail -f /path/to/backup.log
   ```

  **Run with Docker**
  **Build and start the containers**:
    ```bash
    docker compose up --build
    ```
1. **Start the containers (without rebuild)**:
    ```bash
    docker compose up
    ```
2. **Run the development environment in Docker**:
    ```bash
    NODE_ENV=development docker compose up
    ```
3. **Rebuild Docker Containers**
    ```bash
        docker compose down
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

