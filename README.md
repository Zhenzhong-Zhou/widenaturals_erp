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
9. [License](#license)

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
   - Create a .env file in the project root.
   - Add the following variables:
     ```env
        NODE_ENV=development
        DB_HOST=localhost
        DB_PORT=5432
        DB_USER=your_database_user
        DB_PASSWORD=your_database_password
        DB_NAME=your_database_name
     ```

4. **Initialize the database**:
   ```bash
    npx knex migrate:latest
    npx knex seed:run
   ```
5. **Running the Project**:
   ```bash
   npm run devStart
   ```
6. **Running Tests**:
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
      ```
   - Format the codebase:
      ```bash
      npx prettier --write .
      ```

**Database Management**

**Knex Commands**
   1. **Initialize Knex Configuration**:
      ```bash
      npx knex init
      ```
   2. **Migrations**:
      - Create a migration:
        ```bash
        npx knex migrate:make create_entity_types --env development
        npx knex migrate:make create_entity_types --env test
        npx knex migrate:make create_entity_types --env staging
        npx knex migrate:make create_entity_types --env production
        ```
      - Run migrations:
        ```bash
        NODE_ENV=test npx knex migrate:latest
        npx knex migrate:latest --env development
        npx knex migrate:latest --env test
        npx knex migrate:latest --env staging
        npx knex migrate:latest --env production
        ```
      - Rollback migrations:
        ```bash
        NODE_ENV=test npx knex migrate:rollback
        npx knex migrate:latest --env development
        npx knex migrate:latest --env test
        npx knex migrate:latest --env staging
        npx knex migrate:latest --env production
        ```
      - Rollback all migrations:
        ```bash
        NODE_ENV=test npx knex migrate:rollback --all
        npx knex migrate:rollback --all --env development
        npx knex migrate:rollback --all --env test
        npx knex migrate:rollback --all --env staging
        npx knex migrate:rollback --all --env production
        ```
   3. **Seeds**:
      - Create a seed file:
         ```bash
         npx knex seed:make seed_name
         ```
      - Run seed files:
          ```bash
         npx knex seed:run --env development
         NODE_ENV=development npx knex seed:run
         ```

**Run with Docker**
1. **Build and start the containers**:
   ```bash
   docker-compose up --build
   ```
2. **Start the containers (without rebuild)**:
    ```bash
   docker-compose up
    ```
3. **Run the development environment in Docker**:
    ```bash
    NODE_ENV=development docker-compose up
    ```

---

## **License**

This project is licensed under the MIT License.
