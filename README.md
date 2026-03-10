# Intui

> **Interactive coding playground and learning platform**

Intui is a modern web application built with Next.js (app router) and Mantine UI, designed to provide users with an embedded code editor, question bank, and execution backend. It includes authentication, real‑time execution, and a modular component library for rapid feature development.

![Demo Gif Placeholder](gif-placeholder-1)

> _Insert GIF showing landing page and basic navigation_

## 🚀 Features

- **Next.js app router** with optimized server‑side rendering and API routes
- **Mantine UI** for consistent, themeable components
- Rich **code editor** with syntax highlighting and execution
- **Authentication** via GitHub and Google
- Support for **submissions**, **questions**, and **playground** interactions
- Google Cloud storage integration for assets and execution data
- Built‑in **Storybook** and **Jest** testing setup
- Environment configuration through `.env` with clear example

![Playground Gif Placeholder](gif-placeholder-2)

> _Insert GIF showing code editor interaction and execution results_

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ (or LTS)
- [pnpm](https://pnpm.io/) (preferred package manager)
- A PostgreSQL database (see `DATABASE_URL`)

### Installation

```bash
git clone https://github.com/your-org/intui.git
cd intui
pnpm install
```

Copy environment variables from the example:

```bash
cp .env.example .env
# then edit `.env` with your values
```

### Running Locally

Development server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
pnpm start
```

### Database Seeding

Export current local DB question bank into a reusable seed file:

```bash
pnpm run db:export-seed
```

Seed whichever database your `DATABASE_URL` points to:

```bash
pnpm run db:seed
```

### Vercel CI (Auto Migrate + Auto Seed)

Use this as your Vercel Build Command so each push runs migrations, seeds, and then builds:

```bash
pnpm run vercel:build
```

`vercel:build` runs `scripts/ci-build.cjs`, which does:

1. `prisma generate`
2. `prisma migrate deploy`
3. if migration fails with `P3005` (non-empty DB baseline case), it falls back to `prisma db push --accept-data-loss`
4. `prisma db seed`
5. `next build`

Note: the `P3005` fallback is for first-time baseline/drifted databases in CI. It may alter schema destructively to match `schema.prisma`.

Required Vercel environment variables:

- `DATABASE_URL` (production DB connection string)
- OAuth and any other runtime vars from `.env.example`

How to update prod question data:

1. Update local DB data.
2. Run `pnpm run db:export-seed`.
3. Commit `prisma/seed-data.json`.
4. Push to main; Vercel CI will apply the updated seed automatically.

Analyze bundle size:

```bash
pnpm analyze
```

### Storybook

```bash
pnpm storybook
```

### Testing

```bash
pnpm test
```

### Docker (optional)

For a containerized setup using `docker-compose`:

```bash
docker-compose up --build
```

## 📁 Project Structure

```
/src/app/             # Next.js pages and components
/src/components/      # Reusable React components
/src/contexts/        # React context providers
/src/services/        # Business logic & API clients (formerly lib)
/src/core/            # Core configuration (middleware, theme, etc.)
/src/db/              # Database client and Prisma schema
/src/utils/test-utils/ # Utilities for tests
/public/              # Static assets
```

## 🔧 Environment Variables

See `.env.example` for a full list. Key variables include:

- `DATABASE_URL` – PostgreSQL connection string
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` – GitHub OAuth
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` – Google OAuth
- `GCP_*` – Google Cloud service account details

## 🤝 Contributing

Contributions are welcome! Please fork the repo and open a pull request. Follow existing code style and add tests for new features. Run `pnpm lint && pnpm test` before submitting.

## 📄 License

[MIT](LICENSE)


---

*README generated and maintained by the Intui team.*
