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
/ app/                # Next.js pages and components
/ components/         # Reusable React components
/ lib/                # Shared utilities and API clients
/ contexts/           # React context providers
/ prisma/             # Database schema and migrations
/ public/             # Static assets
/ test-utils/         # Utilities for tests
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
