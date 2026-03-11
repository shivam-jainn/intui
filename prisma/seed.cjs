const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function loadSeedData() {
  const seedPath = path.join(process.cwd(), 'prisma', 'seed-data.json');
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Missing seed file at ${seedPath}. Run: pnpm run db:export-seed`);
  }

  const parsed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  if (Array.isArray(parsed)) {
    return parsed;
  }

  return parsed.questions || [];
}

async function seedQuestion(entry) {
  const question = await prisma.question.upsert({
    where: { slug: entry.name },
    update: {
      name: entry.name,
      difficulty: entry.difficulty,
      description: entry.description,
    },
    create: {
      slug: entry.name,
      name: entry.name,
      difficulty: entry.difficulty,
      description: entry.description,
    },
  });

  await prisma.questionTopic.deleteMany({ where: { questionId: question.id } });
  await prisma.questionCompany.deleteMany({ where: { questionId: question.id } });

  const topicNames = [...new Set(entry.topics || [])];
  for (const topicName of topicNames) {
    const topic = await prisma.topic.upsert({
      where: { name: topicName },
      update: {},
      create: { name: topicName },
    });

    await prisma.questionTopic.upsert({
      where: {
        questionId_topicId: {
          questionId: question.id,
          topicId: topic.id,
        },
      },
      update: {},
      create: {
        questionId: question.id,
        topicId: topic.id,
      },
    });
  }

  const companyNames = [...new Set(entry.companies || [])];
  for (const companyName of companyNames) {
    const company = await prisma.company.upsert({
      where: { name: companyName },
      update: {},
      create: { name: companyName },
    });

    await prisma.questionCompany.upsert({
      where: {
        questionId_companyId: {
          questionId: question.id,
          companyId: company.id,
        },
      },
      update: {},
      create: {
        questionId: question.id,
        companyId: company.id,
      },
    });
  }
}

async function main() {
  const seedQuestions = loadSeedData();
  if (!seedQuestions.length) {
    console.log('No questions found in seed-data.json');
    return;
  }

  for (const entry of seedQuestions) {
    await seedQuestion(entry);
  }

  console.log(`Seeded ${seedQuestions.length} questions.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
