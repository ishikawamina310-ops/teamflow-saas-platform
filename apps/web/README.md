# @teamflow/web

Next.js 15 (App Router) frontend for TeamFlow.

## Folder structure

```
src/
├── app/                         # Routing (thin pages)
│   ├── (auth)/                  # /login, /register, /forgot-password
│   ├── (dashboard)/             # /dashboard, /projects, /tasks, /settings
│   ├── layout.tsx               # Root layout
│   ├── providers.tsx            # React Query + Toaster
│   └── page.tsx                 # Marketing landing
│
├── features/                    # Self-contained vertical slices
│   ├── auth/
│   │   ├── api/                 # axios calls
│   │   ├── components/          # Forms, widgets
│   │   ├── hooks/               # useLogin, useRegister, useLogout
│   │   ├── schemas/             # Re-exports of @teamflow/shared schemas
│   │   └── stores/              # Feature-local state (if any)
│   ├── workspaces/
│   ├── projects/
│   ├── tasks/                   # Kanban board, list views
│   ├── dashboard/
│   └── notifications/
│
├── components/
│   ├── ui/                      # Design-system primitives (Button, Input...)
│   └── layouts/                 # Sidebar, header, etc.
│
├── lib/
│   ├── api/                     # Axios client w/ refresh interceptor
│   ├── auth/                    # Auth helpers
│   └── utils.ts                 # cn() + misc
│
├── stores/                      # Global Zustand stores (auth, ui)
├── hooks/                       # Cross-cutting hooks
├── types/                       # App-wide TS types
└── styles/                      # globals.css (Tailwind layers)
```

## Why feature-based?

Each feature owns *everything it needs* — API calls, components, hooks, schemas.
Adding a new feature is `mkdir features/<name>` and the team can work in parallel
without colliding inside `components/` or `hooks/`.

## State strategy

| Concern         | Tool         |
| --------------- | ------------ |
| Server state    | React Query  |
| Session         | Zustand (`auth.store.ts`, persisted) |
| Form state      | React Hook Form + Zod (shared schemas) |
| URL state       | `useSearchParams`                      |
