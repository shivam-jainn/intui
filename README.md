# Mantine Next.js template

This is a template for [Next.js](https://nextjs.org/) app router + [Mantine](https://mantine.dev/).
If you want to use pages router instead, see [next-pages-template](https://github.com/mantinedev/next-pages-template).

## Features

This template comes with the following features:

- [PostCSS](https://postcss.org/) with [mantine-postcss-preset](https://mantine.dev/styles/postcss-preset)
- [TypeScript](https://www.typescriptlang.org/)
- [Storybook](https://storybook.js.org/)
- [Jest](https://jestjs.io/) setup with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- ESLint setup with [eslint-config-mantine](https://github.com/mantinedev/eslint-config-mantine)

## npm scripts

### Build and dev scripts

- `dev` – start dev server
- `build` – bundle application for production
- `analyze` – analyzes application bundle with [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

### Testing scripts

- `typecheck` – checks TypeScript types
- `lint` – runs ESLint
- `prettier:check` – checks files with Prettier
- `jest` – runs jest tests
- `jest:watch` – starts jest watch
- `test` – runs `jest`, `prettier:check`, `lint` and `typecheck` scripts

### Other scripts

- `storybook` – starts storybook dev server
- `storybook:build` – build production storybook bundle to `storybook-static`
- `prettier:write` – formats all files with Prettier

## Database seeding

A simple seeder script (`prisma/seed.js`) is included that populates a few
example topics and questions so you can explore the Kanban board without
creating your own data.

Run it after the database is running:

```bash
# ensure postgres container is up
docker compose up -d database

# attempt to seed via npm script (this requires localhost:5432 to point at the
# container; if you have a separate Postgres instance running on your machine
# the connection will fail and you'll need to use the Docker CLI method below)
npm run seed
```

If the `npm run seed` command complains about access denied (common when a
host Postgres is listening on port 5432), run the script from inside a
dedicated Node container instead:

```bash
# executed from workspace root
docker run --rm \
  -v "$PWD":/app -w /app \
  --network=intui_default \
  -e DATABASE_URL="postgresql://test:testpass@database:5432/intui-test" \
  node:20 node prisma/seed.js
```

This variant connects directly to the `database` service on the same Docker
network and avoids any host port conflicts.

The script is idempotent; feel free to run it multiple times. It creates three
questions under the topics `Arrays`, `Linked Lists`, and
`Dynamic Programming`, each tagged with a sample company.
