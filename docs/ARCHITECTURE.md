# TeamFlow — Architecture

This document describes the overall system design, layering, and deployment topology
of TeamFlow. The goal is **production-ready, scalable, and maintainable** — not
"toy code with a clean folder structure".

---

## 1. High-level system diagram

```
                   ┌────────────────────────────────────────────┐
                   │                  Users                     │
                   └───────────────────┬────────────────────────┘
                                       │ HTTPS
                                       ▼
                          ┌──────────────────────────┐
                          │   CloudFront (CDN/TLS)   │
                          └──────────┬──────┬────────┘
                                     │      │
                  static assets ◄────┘      └────► /api/* → ALB
                  (Next.js SSG/RSC)                       │
                                                          ▼
                                            ┌────────────────────────┐
                                            │     ECS Fargate        │
                                            │  ┌──────────────────┐  │
                                            │  │  web (Next.js)   │  │
                                            │  │  api (NestJS)    │  │
                                            │  └──────────────────┘  │
                                            └────────┬──────┬────────┘
                                                     │      │
                              ┌──────────────────────┘      └─────────────────┐
                              ▼                                               ▼
                      ┌──────────────┐                                ┌──────────────┐
                      │  AWS RDS     │                                │   AWS S3     │
                      │ PostgreSQL   │                                │ user uploads │
                      └──────────────┘                                └──────────────┘
```

- **CloudFront** terminates TLS and caches static assets / Next.js ISR output.
- **ALB** routes `/api/*` traffic to the NestJS service running on ECS Fargate.
- **RDS PostgreSQL** is the single source of truth (multi-AZ in production).
- **S3** stores user-uploaded files; public reads happen through CloudFront with
  signed URLs for private objects.
- **Redis** (optional, ElastiCache) is reserved for rate limiting, refresh-token
  revocation lists, and websocket fan-out when realtime is added.

---

## 2. Layering — Backend (NestJS, Clean Architecture-lite)

We follow a **modular monolith** with a Clean-Architecture-inspired layering inside
each feature module. This keeps cognitive overhead low while leaving the door open
to extract microservices later.

```
┌─────────────────────────────────────────────────────────────┐
│  Interface  →  controllers / DTOs / Swagger decorators      │  (HTTP edge)
├─────────────────────────────────────────────────────────────┤
│  Application →  services (use cases) / domain orchestration │  (business logic)
├─────────────────────────────────────────────────────────────┤
│  Domain     →  entities / value objects / domain errors     │  (pure rules)
├─────────────────────────────────────────────────────────────┤
│  Infrastructure → Prisma repos / S3 client / mail / cache   │  (adapters)
└─────────────────────────────────────────────────────────────┘
```

Cross-cutting concerns live in `common/`:

- `filters/AllExceptionsFilter` — single global error contract
- `interceptors/LoggingInterceptor`, `TransformInterceptor`
- `guards/JwtAuthGuard`, `RolesGuard`
- `pipes/ZodValidationPipe`
- `decorators/CurrentUser`, `Roles`, `Public`

### Why not full hexagonal/CQRS?

Over-engineering kills portfolio projects. We use ports-and-adapters only where it
pays off (e.g. the `StorageService` interface lets S3 be swapped for local disk in
dev). Most modules just use Prisma directly via a thin repository for readability.

---

## 3. Layering — Frontend (Next.js App Router)

Feature-based, **not** type-based. Every feature owns its API client, components,
hooks, schemas and stores.

```
src/
├── app/           # Routing only — thin pages that compose features
├── features/      # Self-contained vertical slices
├── components/ui  # Design-system primitives (shadcn-style)
├── lib/           # Cross-cutting: api client, auth, utils
└── stores/        # Global Zustand stores (session, ui)
```

**State strategy**

| Concern             | Tool          | Why                                            |
| ------------------- | ------------- | ---------------------------------------------- |
| Server state        | React Query   | Caching, dedupe, mutations, optimistic updates |
| Auth/session global | Zustand       | Tiny, no Provider hell, persisted              |
| Forms               | RHF + Zod     | Type-safe, shared schemas with backend         |
| URL state           | `searchParams`| App Router native                              |

---

## 4. Data flow — a request from click to DB

```
[User clicks "Create Task"]
     │
     ▼
features/tasks/api/createTask.ts ── useMutation ──► lib/api/axios (attaches JWT)
     │                                                       │
     │                                                       ▼
     │                                              ALB → NestJS gateway
     │                                                       │
     │  ┌── JwtAuthGuard ── RolesGuard ── ZodValidationPipe ──┤
     │  │                                                    ▼
     │  │                                          TasksController.create()
     │  │                                                    │
     │  │                                                    ▼
     │  │                                          TasksService.create()  ← business rules
     │  │                                                    │
     │  │                                                    ▼
     │  │                                          TasksRepository (Prisma)
     │  │                                                    │
     │  │                                                    ▼
     │  │                                                RDS Postgres
     │  │                                                    │
     │  │                                          ActivityLogService.record() (async)
     │  ▼                                                    │
     ▼                                                       ▼
React Query cache ◄─── TransformInterceptor ◄──── { data, meta } envelope
```

---

## 5. Authentication & Authorization

- **Access token**: short-lived (15 min), signed JWT, sent via `Authorization: Bearer`.
- **Refresh token**: long-lived (30 days), rotated on every refresh, stored
  hashed in DB with `userId + jti` (token reuse → cascade revoke).
- **Password hashing**: `bcrypt` (cost 12).
- **RBAC**: `Role` enum on `User` (`ADMIN`, `USER`) + per-workspace `MemberRole`
  (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`) on `WorkspaceMember`.
- Guards: `JwtAuthGuard` → `RolesGuard` → `WorkspaceMemberGuard` (resource-scoped).

---

## 6. Error contract

Every error returns:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Email is invalid",
  "details": [{ "path": "email", "message": "Invalid email" }],
  "timestamp": "2026-05-13T08:13:00.000Z",
  "path": "/api/v1/auth/register"
}
```

Every success returns:

```json
{ "data": <payload>, "meta": { "page": 1, "total": 42 } }
```

This is enforced by `AllExceptionsFilter` + `TransformInterceptor`.

---

## 7. Deployment topology

```
GitHub  ──push──►  GitHub Actions
                       │
                       ├── lint + typecheck + test
                       ├── build docker images
                       ├── push to ECR
                       └── ECS deploy (blue/green)
                              │
                              ▼
                       ECS Fargate service
                              │
                              ├── api task  (NestJS)
                              └── web task  (Next.js standalone)
```

Secrets live in AWS SSM Parameter Store; the task definition pulls them at runtime.

---

## 8. Conventions

- **Strict TypeScript** everywhere (`strict: true`, `noUncheckedIndexedAccess: true`).
- **Conventional Commits** + **Husky pre-commit** (lint-staged → eslint + prettier).
- **Path aliases**: `@/` per app, `@teamflow/shared` cross-package.
- **API versioning**: URL-based (`/api/v1/...`) — explicit, cache-friendly.
- **Validation**: Zod schemas at the edge; Prisma types at the boundary.
- **No console.log in production code** — use `Logger` everywhere.
