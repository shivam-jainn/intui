const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const baseDir = path.join(__dirname, '../data/questions');
  const questionFolders = fs.readdirSync(baseDir);

  for (const folder of questionFolders) {
    const folderPath = path.join(baseDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const metadataPath = path.join(folderPath, 'metadata.json');
    const questionMdPath = path.join(folderPath, 'Question.md');

    if (!fs.existsSync(metadataPath)) {
      console.warn(`Skipping ${folder}: metadata.json missing`);
      continue;
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const description = fs.existsSync(questionMdPath) 
      ? fs.readFileSync(questionMdPath, 'utf8') 
      : "";

    console.log(`Seeding question: ${metadata.title} (${metadata.slug})`);

    // Create or update the question
    const question = await prisma.question.upsert({
      where: { slug: metadata.slug },
      update: {
        name: metadata.title,
        difficulty: metadata.difficulty,
        description: description,
      },
      create: {
        slug: metadata.slug,
        name: metadata.title,
        difficulty: metadata.difficulty,
        description: description,
      },
    });

    // Handle topics (tags in metadata)
    if (metadata.tags && Array.isArray(metadata.tags)) {
      for (const tagName of metadata.tags) {
        const topic = await prisma.topic.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
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
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
