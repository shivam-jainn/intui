const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const baseDir = path.join(__dirname, '../data/questions');
  const questionFolders = fs
    .readdirSync(baseDir)
    .filter((folder) => fs.statSync(path.join(baseDir, folder)).isDirectory())
    .sort((a, b) => a.localeCompare(b));

  for (const [index, folder] of questionFolders.entries()) {
    const folderPath = path.join(baseDir, folder);

    const metadataPath = path.join(folderPath, 'metadata.json');
    const questionMdPath = path.join(folderPath, 'Question.md');

    if (!fs.existsSync(metadataPath)) {
      console.warn(`Skipping ${folder}: metadata.json missing`);
      continue;
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const displayOrder = index + 1;
    const description = fs.existsSync(questionMdPath) 
      ? fs.readFileSync(questionMdPath, 'utf8') 
      : "";

    console.log(`Seeding question: ${metadata.title} (${metadata.slug})`);

    const rawDifficulty = metadata.difficulty || "Medium";
    const difficulty = rawDifficulty.charAt(0).toUpperCase() + rawDifficulty.slice(1).toLowerCase();

    const existing = await prisma.question.findUnique({ where: { slug: metadata.slug } });
    let finalDisplayOrder;
    if (existing) {
      finalDisplayOrder = existing.displayOrder;
    } else {
      const maxQuestion = await prisma.question.findFirst({ orderBy: { displayOrder: 'desc' } });
      finalDisplayOrder = maxQuestion ? maxQuestion.displayOrder + 1 : index + 1;
    }

    // Create or update the question
    const question = await prisma.question.upsert({
      where: { slug: metadata.slug },
      update: {
        name: metadata.title,
        difficulty: difficulty,
        description: description,
      },
      create: {
        displayOrder: finalDisplayOrder,
        slug: metadata.slug,
        name: metadata.title,
        difficulty: difficulty,
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
