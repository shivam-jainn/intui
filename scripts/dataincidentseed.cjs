const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const baseDir = path.join(__dirname, '../data/incidents');
  const folders = fs
    .readdirSync(baseDir)
    .filter((f) => fs.statSync(path.join(baseDir, f)).isDirectory());

  for (const folder of folders) {
    const metadataPath = path.join(baseDir, folder, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      console.warn(`Skipping ${folder}: metadata.json missing`);
      continue;
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    console.log(`Seeding incident: ${metadata.title} (${metadata.slug})`);

    await prisma.incident.upsert({
      where: { slug: metadata.slug },
      update: {
        title: metadata.title,
        severity: metadata.severity,
        difficulty: metadata.difficulty,
        service: metadata.service,
        summary: metadata.summary,
        slaMinutes: metadata.slaMinutes,
      },
      create: {
        slug: metadata.slug,
        title: metadata.title,
        severity: metadata.severity,
        difficulty: metadata.difficulty,
        service: metadata.service,
        summary: metadata.summary,
        slaMinutes: metadata.slaMinutes,
      },
    });
  }

  console.log('Incident seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
