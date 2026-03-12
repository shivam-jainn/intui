const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    include: {
      topics: { include: { topic: true } },
      companies: { include: { company: true } },
    },
    orderBy: { displayOrder: 'asc' },
  });

  const seedPayload = {
    exportedAt: new Date().toISOString(),
    questions: questions.map((q) => ({
      slug: q.slug,
      displayOrder: q.displayOrder,
      name: q.name,
      difficulty: q.difficulty,
      description: q.description,
      topics: q.topics.map((t) => t.topic.name).sort(),
      companies: q.companies.map((c) => c.company.name).sort(),
    })),
  };

  const outPath = path.join(process.cwd(), 'prisma', 'seed-data.json');
  fs.writeFileSync(outPath, JSON.stringify(seedPayload, null, 2), 'utf8');

  console.log(`Exported ${seedPayload.questions.length} questions -> ${outPath}`);
}

main()
  .catch((error) => {
    console.error('Export failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
