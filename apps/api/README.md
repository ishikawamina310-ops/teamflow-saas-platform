# @teamflow/api

NestJS backend for TeamFlow.

## Folder structure

```
src/
├── main.ts                      # Bootstrap (Swagger, CORS, helmet, global pipes)
├── app.module.ts                # Root module — wires features + global guards
│
├── config/                      # Typed, namespaced config (registerAs)
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── aws.config.ts
│   └── env.validation.ts        # Zod-validated process.env
│
├── common/                      # Cross-cutting kernel
│   ├── decorators/              # @CurrentUser, @Public, @Roles
│   ├── filters/                 # AllExceptionsFilter (single error contract)
│   ├── guards/                  # RolesGuard
│   ├── interceptors/            # Transform, Logging
│   ├── pipes/                   # ZodValidationPipe
│   └── types/
│
├── infrastructure/              # External adapters
│   ├── database/                # Prisma module + service
│   ├── storage/                 # S3 client (when added)
│   └── mailer/                  # SES client (when added)
│
└── modules/                     # Vertical feature slices
    ├── auth/
    ├── users/
    ├── workspaces/
    ├── projects/
    ├── tasks/
    ├── activity-logs/
    ├── notifications/
    ├── files/
    └── health/
```

Each feature module follows the same internal shape:

```
modules/<feature>/
├── dto/                 # Zod schemas + class-based DTOs for Swagger
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts   # (when Prisma access is non-trivial)
└── <feature>.module.ts
```

## Scripts

| Command                       | Description                       |
| ----------------------------- | --------------------------------- |
| `pnpm dev`                    | Watch mode (NestJS)               |
| `pnpm build`                  | Compile to `dist/`                |
| `pnpm prisma:migrate`         | Run + create dev migration        |
| `pnpm prisma:deploy`          | Apply migrations (CI/prod)        |
| `pnpm prisma:studio`          | Open Prisma Studio                |
| `pnpm test`                   | Run unit tests                    |
| `pnpm test:e2e`               | Run e2e tests                     |
