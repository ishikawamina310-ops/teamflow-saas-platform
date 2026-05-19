===== README.en.md START =====

# TeamFlow

Production-ready fullstack SaaS task and project management platform.

Built with Next.js, NestJS, Prisma, and PostgreSQL,
featuring modern Kanban UX, RBAC authorization,
Swagger API documentation, and workspace-based multi-tenant architecture.

---

## Dashboard Overview

Workspace-based SaaS dashboard with:

- Task statistics
- Recent activities
- Recent tasks
- Workspace summary
- Responsive enterprise UI

![Dashboard](./public/screenshots/dashboard.png)

---

## Features

- Multi-tenant workspace architecture
- Kanban task management
- Drag & Drop interactions
- Inline Quick Create UX
- JWT Authentication
- Role-Based Access Control (RBAC)
- Swagger/OpenAPI documentation
- React Query caching
- Prisma ORM
- PostgreSQL
- AWS-ready deployment architecture
- Responsive mobile-friendly UI

---

## Tech Stack

### Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- Zustand

### Backend

- NestJS
- Prisma
- PostgreSQL
- JWT Authentication
- Swagger/OpenAPI
- Zod Validation

### Infrastructure

- Docker
- GitHub Actions
- AWS Ready Architecture
- pnpm Workspace
- TurboRepo

---

## Kanban Board

Modern SaaS-style Kanban board implementation.

### Features

- Drag & Drop
- Optimistic Updates
- Inline Task Creation
- Keyboard Accessible DnD
- Mobile Friendly UX

![Kanban Board](./public/screenshots/kanban-board.png)

---

## Quick Create UX

Fast inline task creation inspired by Linear and Jira.

![Quick Create](./public/screenshots/quick-create-inline.png)

---

## Swagger API Documentation

Fully documented REST API using NestJS + Swagger.

### API Features

- JWT Authentication
- Typed Request / Response Schema
- Workspace-scoped API Design
- RBAC Protected Endpoints

![Swagger API](./public/screenshots/swagger-api.png)

---

## Architecture

```text
apps/
 ├── web      → Next.js Frontend
 └── api      → NestJS Backend

packages/
 ├── shared   → shared types/schemas
```

---

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

### 3. Setup environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### 4. Prisma setup

```bash
pnpm --filter @teamflow/api prisma:generate
pnpm --filter @teamflow/api prisma:migrate
pnpm --filter @teamflow/api prisma:seed
```

### 5. Run development server

```bash
pnpm dev
```

---

## API Documentation

```text
http://localhost:4000/api/docs
```

---

## Demo Account

```text
Email: admin@teamflow.dev
Password: Admin@1234
```

---

## Roadmap

- File Upload (S3)
- Realtime Notifications
- Activity Logs
- Analytics Dashboard
- AWS ECS Deployment
- Terraform Infrastructure

---

## Author

Ishikawa Mina

Fullstack Engineer
Japan

===== README.en.md END =====