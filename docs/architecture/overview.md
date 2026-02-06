## Overview

This document provides a high-level view of the WIDE Naturals ERP system,
including its main components, responsibilities, and configuration model.

## System Components

- **Client**  
  Web frontend built with Vite and React.  
  Responsible for user interaction, data presentation, and form workflows.

- **Server**  
  Backend API and business logic layer.  
  Handles authentication, authorization, inventory, orders, and data persistence.

- **Database**  
  PostgreSQL used as the primary data store.

- **Cache / Queue**  
  Redis used for caching, sessions, and background coordination.

- **Infrastructure (Optional)**  
  Docker and Docker Compose are supported for containerized environments.

## Repository Structure (High-Level)

```text
client/        # Frontend application (Vite / React)
server/        # Backend API and services
env/           # Layered environment configuration
secrets/       # File-based secrets (not committed)
docs/          # Internal documentation
dev_logs/      # Local development logs (ignored)
.github/       # GitHub workflows and templates
```

## Configuration Model

The application uses a layered environment configuration model.
Configuration is loaded from the `env/` directory based on `NODE_ENV`.
A root `.env` file is not used.

Sensitive values may be provided via Docker secrets in production environments.

## Runtime Model

- Client and server run as separate processes in development
- Server exposes a REST API consumed by the client
- Redis and PostgreSQL are required supporting services.

## Non-Goals

This document does not describe implementation details, APIs, database schemas,
or operational procedures. Those are documented separately.
