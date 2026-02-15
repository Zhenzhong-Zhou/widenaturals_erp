# Knex & Database Migrations

This document describes how database schema changes and seed data
are managed using Knex in the WIDE Naturals ERP backend.

## When to Use Knex Commands

Most developers do not need to run Knex commands manually.
The backend automatically applies migrations on startup in development.

Use the commands below only when:

- creating new schema changes
- adding or modifying seed data
- debugging migration issues

## Creating a Migration

```bash
npx knex migrate:make create_xxx_xxx --env development
```

## Running Migrations

```bash
npm run migrate
```

## Rolling Back Migrations

#### Rollback last migration:

```bash
npm run rollback
```

#### Rollback all migrations:

```bash
npx knex migrate:rollback --all --env development
```

## Seed Files

#### Create a seed file:

```bash
npx knex seed:make seed_name
```

#### Run seeds:

```bash
npm run seed
```
