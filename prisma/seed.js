// simple database seeding script for intui
// run with `node prisma/seed.js` (ensure DATABASE_URL points to your dev DB)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fs = require('fs').promises;
const path = require('path');

// core seeding logic extracted so we can retry with alternate client
async function seedWithClient(client) {
  const topics = ['Arrays', 'Linked Lists', 'Dynamic Programming'];
  const companies = ['Google', 'Microsoft', 'Amazon'];

  // upsert topics and companies so script is idempotent
  for (const t of topics) {
    await client.topic.upsert({
      where: { name: t },
      update: {},
      create: { name: t },
    });
  }
  for (const c of companies) {
    await client.company.upsert({
      where: { name: c },
      update: {},
      create: { name: c },
    });
  }

  const questions = [
    {
      name: 'two-sum',
      difficulty: 'Easy',
      topics: ['Arrays'],
      companies: ['Google'],
    },
    {
      name: 'reverse-linked-list',
      difficulty: 'Easy',
      topics: ['Linked Lists'],
      companies: ['Microsoft'],
    },
    {
      name: 'knapsack-problem',
      difficulty: 'Medium',
      topics: ['Dynamic Programming'],
      companies: ['Amazon'],
    },
  ];

  for (const q of questions) {
    // try to load description from local file
    let description = '';
    try {
      const localPath = path.join(__dirname, '..', 'questions', q.name, 'Question.md');
      description = await fs.readFile(localPath, 'utf8');
    } catch (e) {
      console.warn(`Could not read local file for ${q.name}, description will be empty.`);
    }

    // upsert base question
    const up = await client.question.upsert({
      where: { name: q.name },
      update: {
        difficulty: q.difficulty,
        description: description,
      },
      create: {
        name: q.name,
        difficulty: q.difficulty,
        description: description,
      },
    });

    // associate topics and companies via join tables
    for (const tname of q.topics) {
      const topicRec = await client.topic.findUnique({ where: { name: tname } });
      if (topicRec) {
        await client.questionTopic.upsert({
          where: {
            questionId_topicId: {
              questionId: up.id,
              topicId: topicRec.id,
            },
          },
          update: {},
          create: {
            question: { connect: { id: up.id } },
            topic: { connect: { id: topicRec.id } },
          },
        });
      }
    }

    for (const cname of q.companies) {
      const compRec = await client.company.findUnique({ where: { name: cname } });
      if (compRec) {
        await client.questionCompany.upsert({
          where: {
            questionId_companyId: {
              questionId: up.id,
              companyId: compRec.id,
            },
          },
          update: {},
          create: {
            question: { connect: { id: up.id } },
            company: { connect: { id: compRec.id } },
          },
        });
      }
    }
  }

  console.log('Seeding finished.');
}

async function main() {
  console.log('Seeding database...');
  console.log('Using DATABASE_URL=', process.env.DATABASE_URL);

  try {
    await seedWithClient(prisma);
  } catch (err) {
    if (
      err.message &&
      err.message.includes('denied access') &&
      process.env.DATABASE_URL &&
      process.env.DATABASE_URL.includes('localhost')
    ) {
      console.error("Local connection failed. If you have another Postgres running on 5432, the script tries that by default.");
      console.error("Refer to the README instructions for using the Docker-network seeder command.");
    }
    throw err;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
