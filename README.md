```
npx eslint .
npx eslint "./**/*.{js,jsx}"
npx prettier --write .
docker-compose up --build
docker compose up
NODE_ENV=development docker compose up
npx knex init

# Create a migration:
npx knex migrate:make create_entity_types --env development
npx knex migrate:make create_entity_types --env test
npx knex migrate:make create_entity_types --env staging
npx knex migrate:make create_entity_types --env production

# Run the Migration:
npx knex migrate:latest --env development
npx knex migrate:latest --env test
npx knex migrate:latest --env staging
npx knex migrate:latest --env production

# Roll Back:
npx knex migrate:rollback --env development
npx knex migrate:rollback --env test
npx knex migrate:rollback --env staging
npx knex migrate:rollback --env production

# To roll back all migrations:
npx knex migrate:rollback --env development
npx knex migrate:rollback --env test
npx knex migrate:rollback --env staging
npx knex migrate:rollback --env production

# Create a seed file:
npx knex seed:make initial_users

# Run seeds:
npx knex seed:run

```
