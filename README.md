# Task Manager (Frontend)

Modern Next.js App Router prototype with RBAC, Kanban, MSW mocks, and tests.

## Quickstart

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Login credentials (mocked): any email, password: `password`.

## Scripts

- `npm run dev`: start Next.js with MSW worker
- `npm run build`: production build
- `npm run lint`: run ESLint
- `npm run format`: format with Prettier
- `npm run test`: Vitest unit tests
- `npm run e2e`: Playwright smoke tests

## Structure

```
src/
  app/
    (marketing)/
      page.tsx            # Landing (SSG)
      pricing/page.tsx    # Pricing (SSG)
      legal/privacy/...   # Privacy (SSG)
    (app)/
      login/page.tsx      # Login (client)
      dashboard/page.tsx  # Dashboard (client)
      admin/users/page.tsx
      admin/roles/page.tsx
      projects/[projectId]/board/page.tsx
  components/
  features/
  hooks/
  api/
  mocks/
  schemas/
  types/
```

## Auth & RBAC

- NextAuth CredentialsProvider at `app/api/auth/[...nextauth]/route.ts`.
- Middleware enforces:
  - `/admin/*` → admin only
  - `/projects/*` → admin/manager/member
  - `/dashboard` → any authenticated user

## Mocks (MSW)

- Handlers in `src/mocks/handlers.ts`
- Worker auto-starts in dev via `MswProvider`

## Testing

- Vitest + React Testing Library
- Playwright for e2e smoke

## Notes

This is a baseline. Extend features under `src/features/*` and wire real APIs replacing MSW.
