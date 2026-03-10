const { spawnSync } = require('child_process');

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  return result.status === null ? 1 : result.status;
}

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    shell: true,
    encoding: 'utf8',
  });

  const combined = `${result.stdout || ''}${result.stderr || ''}`;
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');

  return {
    code: result.status === null ? 1 : result.status,
    output: combined,
  };
}

function main() {
  // 1) Ensure Prisma client is up to date for the build environment.
  if (run('prisma', ['generate']) !== 0) process.exit(1);

  // 2) Apply migrations; for first-time non-empty DBs (P3005), baseline via db push.
  const migrate = runCapture('prisma', ['migrate deploy']);
  if (migrate.code !== 0) {
    if (migrate.output.includes('P3005')) {
      console.log('Detected P3005 baseline case. Running prisma db push...');
      if (run('prisma', ['db push --accept-data-loss']) !== 0) process.exit(1);
    } else {
      process.exit(migrate.code);
    }
  }

  // 3) Seed data and then build app.
  if (run('prisma', ['db seed']) !== 0) process.exit(1);
  if (run('next', ['build']) !== 0) process.exit(1);
}

main();
