const fs = require('fs');
const path = require('path');
const os = require('os');
const { PrismaClient } = require('@prisma/client');
const { Storage } = require('@google-cloud/storage');

const prisma = new PrismaClient();
const storage = new Storage({
  credentials: {
    type: process.env.GCP_TYPE || '',
    project_id: process.env.GCP_PROJECT_ID || '',
    private_key_id: process.env.GCP_PRIVATE_KEY_ID || '',
    private_key: (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    client_email: process.env.GCP_CLIENT_EMAIL || '',
    client_id: process.env.GCP_CLIENT_ID || '',
    auth_uri: process.env.GCP_AUTH_URI || '',
    token_uri: process.env.GCP_TOKEN_URI || '',
    auth_provider_x509_cert_url: process.env.GCP_AUTH_PROVIDER_X509_CERT_URL || '',
    client_x509_cert_url: process.env.GCP_CLIENT_X509_CERT_URL || '',
    universe_domain: process.env.GCP_UNIVERSE_DOMAIN || '',
  },
});

function loadJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function bucketName() {
  return process.env.GCP_BUCKET_NAME || '';
}

async function copyPrefixFromGcs(prefix, targetDir) {
  const bucket = bucketName();
  if (!bucket) {
    throw new Error(`GCP_BUCKET_NAME is required to seed from gs://${prefix}`);
  }

  const [files] = await storage.bucket(bucket).getFiles({ prefix });

  for (const file of files) {
    if (file.name.endsWith('/')) continue;

    const relativePath = file.name.slice(prefix.length).replace(/^\/+/, '');
    if (!relativePath) continue;

    const destination = path.join(targetDir, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    await file.download({ destination });
  }
}

async function prepareDataDir(kind) {
  const localDir = path.join(__dirname, '../data', kind);
  if (fs.existsSync(localDir)) return localDir;

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `intui-${kind}-`));
  const mirroredDir = path.join(tempRoot, kind);
  fs.mkdirSync(mirroredDir, { recursive: true });

  console.log(`Local data/${kind} not found. Pulling gs://${bucketName()}/${kind}...`);
  await copyPrefixFromGcs(`${kind}/`, mirroredDir);

  return mirroredDir;
}

async function seedQuestions() {
  const baseDir = await prepareDataDir('questions');
  const questionFolders = fs
    .readdirSync(baseDir)
    .filter((folder) => fs.statSync(path.join(baseDir, folder)).isDirectory())
    .sort((a, b) => a.localeCompare(b));

  for (const [index, folder] of questionFolders.entries()) {
    const folderPath = path.join(baseDir, folder);
    const metadata = loadJsonIfExists(path.join(folderPath, 'metadata.json'));

    if (!metadata) {
      console.warn(`Skipping ${folder}: metadata.json missing`);
      continue;
    }

    const questionMdPath = path.join(folderPath, 'Question.md');
    const displayOrder = Number.isInteger(metadata.displayOrder) ? metadata.displayOrder : index + 1;
    const description = fs.existsSync(questionMdPath) ? fs.readFileSync(questionMdPath, 'utf8') : '';

    console.log(`Seeding question: ${metadata.title} (${metadata.slug})`);

    const question = await prisma.question.upsert({
      where: { slug: metadata.slug },
      update: {
        displayOrder,
        name: metadata.title,
        difficulty: metadata.difficulty,
        description,
      },
      create: {
        displayOrder,
        slug: metadata.slug,
        name: metadata.title,
        difficulty: metadata.difficulty,
        description,
      },
    });

    if (!Array.isArray(metadata.tags)) continue;

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

async function seedIncidents() {
  const baseDir = await prepareDataDir('incidents');
  const folders = fs
    .readdirSync(baseDir)
    .filter((folder) => fs.statSync(path.join(baseDir, folder)).isDirectory())
    .sort((a, b) => a.localeCompare(b));

  for (const folder of folders) {
    const metadata = loadJsonIfExists(path.join(baseDir, folder, 'metadata.json'));

    if (!metadata) {
      console.warn(`Skipping ${folder}: metadata.json missing`);
      continue;
    }

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
}

async function main() {
  await seedQuestions();
  await seedIncidents();
  console.log('Seeding completed successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
